/**
 * Chess Position Evaluator supporting Lichess Cloud Eval API with local positional heuristic fallback
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

  // Attempt Lichess Cloud Eval API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);
    const url = `https://lichess.org/api/cloud-eval?fen=${encodeURIComponent(fen)}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.pvs && data.pvs.length > 0) {
        const pv = data.pvs[0];
        let score = 0;
        let formatted = '0.0';
        let isMate = false;
        let whiteWinChance = 50;

        if (pv.mate !== undefined) {
          isMate = true;
          formatted = pv.mate > 0 ? `#+${pv.mate}` : `#-` + Math.abs(pv.mate);
          whiteWinChance = pv.mate > 0 ? 99 : 1;
          score = pv.mate > 0 ? 8000 : -8000;
        } else if (pv.cp !== undefined) {
          // Centipawns are from White's perspective in Lichess
          score = pv.cp;
          formatted = score >= 0 ? `+${(score / 100).toFixed(1)}` : `${(score / 100).toFixed(1)}`;
          const clamped = Math.max(-1500, Math.min(1500, score));
          whiteWinChance = Math.round(100 / (1 + Math.exp(-0.0035 * clamped)));
        }

        const result = { score, formatted, whiteWinChance, isMate, source: 'cloud' };
        evalCache.set(fen, result);
        return result;
      }
    }
  } catch (e) {
    // Timeout or network unreachable
  }

  // Fallback to local heuristic
  const localResult = evaluateBoardLocal(chessEngine.chess);
  evalCache.set(fen, localResult);
  return localResult;
}
