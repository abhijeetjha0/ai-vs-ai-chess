/**
 * Chess Position Evaluator using local positional heuristic and piece-square tables
 */

const evalCache = new Map();

// Simplified Piece-Square Tables (White perspective; mirrored for Black)
const PAWN_TABLE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0
];

const KNIGHT_TABLE = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50
];

const BISHOP_TABLE = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20
];

const ROOK_TABLE = [
   0,  0,  0,  0,  0,  0,  0,  0,
   5, 10, 10, 10, 10, 10, 10,  5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
   0,  0,  0,  5,  5,  0,  0,  0
];

const QUEEN_TABLE = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
   -5,  0,  5,  5,  5,  5,  0, -5,
    0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20
];

const KING_TABLE = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
   20, 20,  0,  0,  0,  0, 20, 20,
   20, 30, 10,  0,  0, 10, 30, 20
];

const PIECE_VALUES = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000
};

function getTableValue(table, r, c, isWhite) {
  const index = isWhite ? r * 8 + c : (7 - r) * 8 + c;
  return table[index];
}

export function evaluateBoardLocal(chessInstance) {
  const board = chessInstance.board();
  let score = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const isWhite = piece.color === 'w';
      const baseValue = PIECE_VALUES[piece.type] || 0;
      let positional = 0;

      switch (piece.type) {
        case 'p': positional = getTableValue(PAWN_TABLE, r, c, isWhite); break;
        case 'n': positional = getTableValue(KNIGHT_TABLE, r, c, isWhite); break;
        case 'b': positional = getTableValue(BISHOP_TABLE, r, c, isWhite); break;
        case 'r': positional = getTableValue(ROOK_TABLE, r, c, isWhite); break;
        case 'q': positional = getTableValue(QUEEN_TABLE, r, c, isWhite); break;
        case 'k': positional = getTableValue(KING_TABLE, r, c, isWhite); break;
      }

      const totalPieceVal = baseValue + positional;
      score += isWhite ? totalPieceVal : -totalPieceVal;
    }
  }

  // Logistic winning chance percentage (0% to 100%)
  const clampedScore = Math.max(-1500, Math.min(1500, score));
  const whiteWinChance = Math.round(100 / (1 + Math.exp(-0.003 * clampedScore)));
  const formattedScore = score >= 0 ? `+${(score / 100).toFixed(1)}` : `${(score / 100).toFixed(1)}`;

  return {
    score,
    formatted: formattedScore,
    whiteWinChance,
    isMate: false,
    source: 'local'
  };
}

export async function evaluatePosition(chessEngine) {
  const fen = chessEngine.getFen();

  if (chessEngine.isGameOver()) {
    const details = chessEngine.getGameOverDetails();
    if (details.reason === 'Checkmate') {
      const whiteWon = details.winner === 'White';
      return {
        score: whiteWon ? 10000 : -10000,
        formatted: whiteWon ? '#+1' : '#-1',
        whiteWinChance: whiteWon ? 100 : 0,
        isMate: true,
        source: 'terminal'
      };
    }
    return {
      score: 0,
      formatted: '0.0',
      whiteWinChance: 50,
      isMate: false,
      source: 'terminal'
    };
  }

  if (evalCache.has(fen)) {
    return evalCache.get(fen);
  }

  // Local positional heuristic evaluation
  const localResult = evaluateBoardLocal(chessEngine.chess);
  evalCache.set(fen, localResult);
  return localResult;
}
