/**
 * Minimal offline engine fallback when no LLM server is reachable
 */

export const OFFLINE_MODELS = [
  { id: 'engine-tactical', name: 'Local Engine (Tactical)', provider: 'offline' },
  { id: 'engine-solid', name: 'Local Engine (Positional)', provider: 'offline' }
];

export const OFFLINE_ARBITERS = [
  { id: 'engine-arbiter', name: 'Local Engine Arbiter', provider: 'offline', role: 'arbiter' }
];

function pickHeuristicMove(legalMoves, mode, turn, moveNumber) {
  if (!legalMoves || legalMoves.length === 0) return null;

  if (moveNumber === 1) {
    if (turn === 'w') {
      const preferred = ['e4', 'd4', 'c4', 'Nf3'];
      const found = legalMoves.find(m => preferred.includes(m.san));
      if (found) return found;
    } else {
      const preferred = ['e5', 'c5', 'Nf6', 'd5', 'e6'];
      const found = legalMoves.find(m => preferred.includes(m.san));
      if (found) return found;
    }
  }

  const scoredMoves = legalMoves.map(move => {
    let score = 0;
    const san = move.san;

    if (san.includes('#')) score += 10000;
    if (san.includes('+')) score += 40;

    if (move.captured) {
      const pieceVal = { p: 10, n: 30, b: 35, r: 50, q: 90 }[move.captured] || 10;
      score += pieceVal * 1.2;
    }

    if (san === 'O-O' || san === 'O-O-O') score += 35;

    if (moveNumber <= 10) {
      if (['e4', 'd4', 'e5', 'd5', 'c4', 'c5', 'Nf3', 'Nc3', 'Nf6', 'Nc6', 'Bb5', 'Bc4'].includes(san)) {
        score += 25;
      }
    }

    score += Math.random() * 6;
    return { move, score };
  });

  scoredMoves.sort((a, b) => b.score - a.score);
  return scoredMoves[0].move;
}

export class OfflineEngine {
  static async generatePlayerMove({ legalMoves, fen, historySan, turn, delay = 500 }) {
    await new Promise(r => setTimeout(r, delay));
    const moveCount = Math.floor(historySan.length / 2) + 1;
    const chosen = pickHeuristicMove(legalMoves, 'tactical', turn, moveCount) || legalMoves[0];

    const otherLegal = legalMoves.filter(m => m.san !== chosen.san);
    const candidate2 = otherLegal[Math.floor(Math.random() * otherLegal.length)]?.san || null;
    const candidates = [chosen.san, candidate2].filter(Boolean);

    let reasoning = `Controlling key squares and advancing piece coordination with ${chosen.san}.`;
    if (chosen.san.includes('#')) reasoning = `Checkmate combination found with ${chosen.san}!`;
    else if (chosen.san.includes('+')) reasoning = `Delivering check with ${chosen.san} to seize tactical momentum.`;
    else if (chosen.captured) reasoning = `Capturing the opponent ${chosen.captured.toUpperCase()} to gain material.`;

    return {
      move: chosen.san,
      reasoning,
      candidates
    };
  }

  static async evaluateArbiterDecision({ proposedMove, playerReasoning, legalMoves, delay = 500 }) {
    await new Promise(r => setTimeout(r, delay));
    const isLegal = legalMoves.some(m => m.san === proposedMove);
    const verifiedMove = isLegal ? proposedMove : (legalMoves[0]?.san || proposedMove);

    let grade = '👍 Good';
    let commentary = `Arbiter approves legal move ${verifiedMove}. ${playerReasoning || 'Solid move maintaining position.'}`;

    if (verifiedMove.includes('#')) {
      grade = '🌟 Brilliant';
      commentary = `Game-ending checkmate combination! Flawless precision.`;
    } else if (verifiedMove.includes('+')) {
      grade = '🎯 Best';
      commentary = `Check delivers direct attack and limits defensive responses.`;
    } else if (['e4', 'd4', 'Nf3', 'c4', 'e5', 'c5', 'Nf6'].includes(verifiedMove)) {
      grade = '🎯 Best';
      commentary = `Standard theoretical move fighting for center control.`;
    }

    return {
      decision: 'approved',
      finalMove: verifiedMove,
      grade,
      commentary
    };
  }
}
