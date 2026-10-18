import test from 'node:test';
import assert from 'node:assert';
import { ChessGameEngine } from '../src/chess/engine.js';
import {
  formatBoard2D,
  categorizeLegalMoves,
  buildPlayerPromptContext,
  buildArbiterPromptContext
} from '../src/chess/prompt-builder.js';

test('formatBoard2D renders 8x8 ASCII board accurately', () => {
  const engine = new ChessGameEngine();
  const ascii = formatBoard2D(engine.getBoard());

  assert.ok(ascii.includes('8  r n b q k b n r'));
  assert.ok(ascii.includes('7  p p p p p p p p'));
  assert.ok(ascii.includes('2  P P P P P P P P'));
  assert.ok(ascii.includes('1  R N B Q K B N R'));
  assert.ok(ascii.includes('a b c d e f g h'));
});

test('categorizeLegalMoves correctly separates tactical moves', () => {
  const engine = new ChessGameEngine();
  // In starting position, there are no checks, captures, or castles
  const moves = engine.getLegalMoves();
  const cat1 = categorizeLegalMoves(moves);
  assert.strictEqual(cat1.captures.length, 0);
  assert.strictEqual(cat1.checks.length, 0);
  assert.strictEqual(cat1.castles.length, 0);
  assert.strictEqual(cat1.quiet.length, 20);

  // Play moves to set up capture and check
  engine.makeMove('e4');
  engine.makeMove('d5');
  const cat2 = categorizeLegalMoves(engine.getLegalMoves());
  assert.ok(cat2.captures.includes('exd5'));
});

test('buildPlayerPromptContext outputs high-signal enriched prompt', () => {
  const engine = new ChessGameEngine();
  engine.makeMove('e4');
  engine.makeMove('e5');

  const prompt = buildPlayerPromptContext({
    turn: 'w',
    fen: engine.getFen(),
    board: engine.getBoard(),
    legalMoves: engine.getLegalMoves(),
    historySan: engine.getHistorySan(),
    opening: { name: "King's Pawn Game", eco: 'C20' },
    lastMove: engine.getLastMove(),
    inCheck: false,
    advantage: 0,
    enriched: true
  });

  assert.ok(prompt.includes('You are playing as White in chess'));
  assert.ok(prompt.includes("King's Pawn Game (C20)"));
  assert.ok(prompt.includes("Opponent's last move: e5 by Black"));
  assert.ok(prompt.includes('Board (White bottom uppercase, Black top lowercase)'));
  assert.ok(prompt.includes('Tactical Opportunities in your Legal Moves'));
  assert.ok(prompt.includes('{"move": "EXACT_SAN_MOVE"'));
});

test('buildPlayerPromptContext falls back to lightweight prompt when enriched is false', () => {
  const engine = new ChessGameEngine();
  const prompt = buildPlayerPromptContext({
    turn: 'w',
    fen: engine.getFen(),
    legalMoves: engine.getLegalMoves(),
    enriched: false
  });

  assert.ok(prompt.includes('You are playing as White in chess'));
  assert.ok(!prompt.includes('Tactical Opportunities'));
  assert.ok(!prompt.includes('Board (White bottom uppercase'));
});

test('buildArbiterPromptContext includes candidate alternatives and tactical classification', () => {
  const engine = new ChessGameEngine();
  engine.makeMove('e4');
  engine.makeMove('d5');

  const arbiterContext = buildArbiterPromptContext({
    turn: 'w',
    proposedMove: 'exd5',
    playerReasoning: 'Captures the d5 pawn in the center',
    candidates: ['exd5', 'Nf3', 'e5'],
    fen: engine.getFen(),
    legalMoves: engine.getLegalMoves(),
    lastMove: engine.getLastMove(),
    inCheck: false,
    opening: { name: 'Scandinavian Defense', eco: 'B01' }
  });

  assert.ok(arbiterContext.includes("White proposed move 'exd5' (Capture)"));
  assert.ok(arbiterContext.includes('Scandinavian Defense'));
  assert.ok(arbiterContext.includes('Alternative candidate moves considered: exd5, Nf3, e5'));
  assert.ok(arbiterContext.includes('Preceding move by opponent: d5'));
});

test('buildPlayerPromptContext injects anti-repetition and anti-shuffle warnings', () => {
  const engine = new ChessGameEngine();
  const prompt = buildPlayerPromptContext({
    turn: 'w',
    fen: engine.getFen(),
    legalMoves: engine.getLegalMoves(),
    historySan: ['Nf3', 'Nf6', 'Ng1', 'Ng8'],
    repetitionRiskMoves: ['Ng1'],
    shuffleMoves: ['Nf3'],
    shuffleSummary: 'Repeated moves by you: Nf3 (2x)',
    enriched: true
  });

  assert.ok(prompt.includes('CRITICAL WARNING - AVOID THREEFOLD REPETITION: The following moves would cause a draw by threefold repetition and must be AVOIDED: Ng1'));
  assert.ok(prompt.includes('DIVERSITY WARNING - AVOID PIECE SHUFFLING'));
  assert.ok(prompt.includes('Repeated moves by you: Nf3 (2x)'));
  assert.ok(prompt.includes('Avoid these shuffle moves: Nf3'));
  assert.ok(prompt.includes('DO NOT shuffle pieces back to squares they have recently visited'));
});

test('buildArbiterPromptContext includes repetition risk and shuffle diversity alerts', () => {
  const engine = new ChessGameEngine();
  const context = buildArbiterPromptContext({
    turn: 'w',
    proposedMove: 'Ng1',
    playerReasoning: 'Returning knight',
    candidates: ['Ng1', 'e4', 'd4'],
    fen: engine.getFen(),
    legalMoves: engine.getLegalMoves(),
    repetitionRiskMoves: ['Ng1'],
    shuffleMoves: ['Ng1'],
    shuffleSummary: 'Knight oscillation between f3 and g1'
  });

  assert.ok(context.includes("CRITICAL ARBITER ALERT: Proposed move 'Ng1' causes THREEFOLD REPETITION"));
  assert.ok(context.includes("DIVERSITY ALERT: Proposed move 'Ng1' continues a repetitive piece shuffle loop"));
});

