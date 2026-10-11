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
