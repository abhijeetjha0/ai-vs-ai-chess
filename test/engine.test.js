import test from 'node:test';
import assert from 'node:assert';
import { ChessGameEngine } from '../src/chess/engine.js';
import { evaluateBoardLocal } from '../src/chess/evaluator.js';
import { OfflineEngine } from '../src/api/mock.js';
import { ModelManager } from '../src/api/model-manager.js';

test('ChessGameEngine initializes with correct starting position', () => {
  const engine = new ChessGameEngine();
  assert.strictEqual(engine.getFen(), 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  assert.strictEqual(engine.getTurn(), 'w');
  assert.strictEqual(engine.getTurnColorName(), 'White');
  assert.strictEqual(engine.isGameOver(), false);
  assert.strictEqual(engine.inCheck(), false);
  assert.strictEqual(engine.getLegalMoves().length, 20);
});

test('ChessGameEngine executes moves accurately', () => {
  const engine = new ChessGameEngine();
  const m1 = engine.makeMove('e4');
  assert.ok(m1);
  assert.strictEqual(m1.san, 'e4');
  assert.strictEqual(engine.getTurn(), 'b');

  const m2 = engine.makeMove('e5');
  assert.ok(m2);
  assert.strictEqual(engine.getTurn(), 'w');

  const history = engine.getHistorySan();
  assert.deepStrictEqual(history, ['e4', 'e5']);
});

test('ChessGameEngine calculates captures and material advantage', () => {
  const engine = new ChessGameEngine();
  engine.makeMove('e4');
  engine.makeMove('d5');
  const captureMove = engine.makeMove('exd5'); // White captures pawn
  assert.ok(captureMove);
  assert.strictEqual(captureMove.captured, 'p');

  const captures = engine.getCapturedPieces();
  assert.deepStrictEqual(captures.whiteCaptured, ['p']);
  assert.deepStrictEqual(captures.blackCaptured, []);
  assert.strictEqual(captures.whiteAdvantage, 1);
});

test('Position Evaluator computes balanced score for initial position', () => {
  const engine = new ChessGameEngine();
  const res = evaluateBoardLocal(engine.chess);
  assert.strictEqual(res.score, 0);
  assert.strictEqual(res.whiteWinChance, 50);
});

test('OfflineEngine generates valid legal moves and reasoning', async () => {
  const engine = new ChessGameEngine();
  const legal = engine.getLegalMoves();
  const result = await OfflineEngine.generatePlayerMove({
    legalMoves: legal,
    fen: engine.getFen(),
    historySan: [],
    turn: 'w',
    delay: 20
  });

  assert.ok(result.move);
  assert.ok(legal.some(m => m.san === result.move));
  assert.ok(result.reasoning.length > 0);
  assert.ok(Array.isArray(result.candidates));
});

test('OfflineEngine evaluates move for arbiter adjudication', async () => {
  const engine = new ChessGameEngine();
  const legal = engine.getLegalMoves();
  const arbiterResult = await OfflineEngine.evaluateArbiterDecision({
    proposedMove: 'e4',
    playerReasoning: 'Central pawn thrust',
    legalMoves: legal,
    delay: 20
  });

  assert.strictEqual(arbiterResult.finalMove, 'e4');
  assert.ok(arbiterResult.grade);
  assert.ok(arbiterResult.commentary);
});

test('ModelManager cleans and parses JSON responses correctly', () => {
  const mm = new ModelManager();
  
  const raw1 = '```json\n{"move": "Nf3", "reasoning": "Controls center"}\n```';
  const parsed1 = mm.parseJsonFromResponse(raw1);
  assert.deepStrictEqual(parsed1, { move: "Nf3", reasoning: "Controls center" });

  const raw2 = 'Here is your move: {"move": "d4", "reasoning": "Queen pawn"} enjoy!';
  const parsed2 = mm.parseJsonFromResponse(raw2);
  assert.deepStrictEqual(parsed2, { move: "d4", reasoning: "Queen pawn" });
});

test('ModelManager accurately preserves temperature including 0.0 deterministic value', () => {
  const mm = new ModelManager();
  assert.strictEqual(mm.config.temperature, 0.7);

  mm.saveConfig({ temperature: 0.0 });
  assert.strictEqual(mm.config.temperature, 0.0);

  mm.saveConfig({ temperature: 1.2 });
  assert.strictEqual(mm.config.temperature, 1.2);
});

test('ChessGameEngine detects threefold repetition risk and filters safe moves', () => {
  const engine = new ChessGameEngine();
  // 1. Nf3 Nf6, 2. Ng1 Ng8, 3. Nf3 Nf6, 4. Ng1 Ng8
  ['Nf3', 'Nf6', 'Ng1', 'Ng8', 'Nf3', 'Nf6', 'Ng1', 'Ng8'].forEach(m => engine.makeMove(m));

  // If White plays Nf3 again, that position occurs for the 3rd time (threefold repetition)
  assert.strictEqual(engine.wouldCauseRepetition('Nf3'), true);
  // Other moves (like e4 or d4) do NOT cause repetition
  assert.strictEqual(engine.wouldCauseRepetition('e4'), false);
  assert.strictEqual(engine.wouldCauseRepetition('d4'), false);

  const { safeMoves, filteredOut, hasRepetitionRisk } = engine.getMovesAvoidingRepetition();
  assert.strictEqual(hasRepetitionRisk, true);
  assert.ok(filteredOut.some(m => m.san === 'Nf3'));
  assert.ok(!safeMoves.some(m => m.san === 'Nf3'));
  assert.ok(safeMoves.some(m => m.san === 'e4'));
});

test('ChessGameEngine detects piece shuffle patterns and provides diverse alternatives', () => {
  const engine = new ChessGameEngine();
  // Play oscillating knight moves
  engine.makeMove('Nf3');
  engine.makeMove('Nf6');
  engine.makeMove('Ng1');
  engine.makeMove('Ng8');

  const shuffle = engine.getShuffleAnalysis();
  assert.strictEqual(shuffle.isShuffling, true);
  // White's Nf3 is an immediate return / repeat
  assert.ok(shuffle.shuffleMoves.includes('Nf3'));
  assert.ok(shuffle.shuffleSummary.length > 0);

  // getDiverseAlternative should avoid Nf3 and pick a progressive move like a pawn push
  const diverse = engine.getDiverseAlternative(shuffle.shuffleMoves);
  assert.ok(diverse);
  assert.notStrictEqual(diverse, 'Nf3');
  // Should prefer pawn advances or center development
  assert.ok(['e4', 'd4', 'c4', 'e3', 'd3', 'c3', 'f4', 'b3', 'g3', 'Nc3'].includes(diverse));
});

test('OfflineEngine evaluates arbiter decisions with repetition and shuffle vetoes', async () => {
  const engine = new ChessGameEngine();
  const legal = engine.getLegalMoves();

  // 1. Repetition veto
  const repVerdict = await OfflineEngine.evaluateArbiterDecision({
    proposedMove: 'Nf3',
    playerReasoning: 'Developing piece',
    legalMoves: legal,
    repetitionRiskMoves: ['Nf3'],
    candidates: ['Nf3', 'e4', 'd4'],
    delay: 10
  });
  assert.strictEqual(repVerdict.grade, 'Inaccuracy');
  assert.notStrictEqual(repVerdict.finalMove, 'Nf3');
  assert.ok(repVerdict.commentary.includes('threefold repetition'));

  // 2. Shuffle intervention
  const shuffleVerdict = await OfflineEngine.evaluateArbiterDecision({
    proposedMove: 'Nh3',
    playerReasoning: 'Aimless piece move',
    legalMoves: legal,
    shuffleMoves: ['Nh3'],
    candidates: ['Nh3', 'e4'],
    delay: 10
  });
  assert.strictEqual(shuffleVerdict.grade, 'Inaccuracy');
  assert.strictEqual(shuffleVerdict.finalMove, 'e4');
  assert.ok(shuffleVerdict.commentary.includes('piece shuffling'));
});
