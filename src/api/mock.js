/**
 * Minimal offline engine fallback when no LLM server is reachable
 */

export const OFFLINE_MODELS = [
  { id: 'engine-tactical', name: 'Local Engine (Tactical)', provider: 'offline' },
  { id: 'engine-solid', name: 'Local Engine (Positional)', provider: 'offline' }
];

export const OFFLINE_ARBITERS = [
  { id: 'engine-arbiter', name: 'Local Engine Arbiter', provider: 'offline', role: 'arbiter', capabilities: ['decision'] }
];

function pickHeuristicMove(legalMoves, mode, turn, moveNumber, repetitionRiskMoves = [], shuffleMoves = []) {
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

  const repetitionSet = new Set(repetitionRiskMoves);
  const shuffleSet = new Set(shuffleMoves);

  const scoredMoves = legalMoves.map(move => {
    let score = 0;
    const san = move.san;

    // Heavily penalize moves that would cause threefold repetition
    if (repetitionSet.has(san)) {
      score -= 50000;
    }

    // Penalize shuffle moves (pieces bouncing between same squares)
    if (shuffleSet.has(san)) {
      score -= 200;
    }

    // Tactical scoring
    if (san.includes('#')) score += 10000;
    if (san.includes('+')) score += 40;

    if (move.captured) {
      const pieceVal = { p: 10, n: 30, b: 35, r: 50, q: 90 }[move.captured] || 10;
      score += pieceVal * 1.2;
    }

    if (san === 'O-O' || san === 'O-O-O') score += 35;

    // Opening development
    if (moveNumber <= 10) {
      if (['e4', 'd4', 'e5', 'd5', 'c4', 'c5', 'Nf3', 'Nc3', 'Nf6', 'Nc6', 'Bb5', 'Bc4'].includes(san)) {
        score += 25;
      }
    }

    // Diversity bonuses: reward pawn advances (irreversible progress)
    if (move.piece === 'p' && !move.captured) {
      score += 15;
      // Extra bonus for central pawn advances
      if (['d', 'e'].includes(move.to[0])) score += 10;
      // Bonus for advancing past rank 4/5 (deeper pushes)
      const rank = parseInt(move.to[1]);
      if ((turn === 'w' && rank >= 5) || (turn === 'b' && rank <= 4)) {
        score += 12;
      }
    }

    // Bonus for knight and bishop development to fresh central squares
    if ((move.piece === 'n' || move.piece === 'b') && !shuffleSet.has(san)) {
      const file = move.to[0];
      const rank = parseInt(move.to[1]);
      if (['c', 'd', 'e', 'f'].includes(file) && rank >= 3 && rank <= 6) {
        score += 15;
      }
    }

    // Increase randomization in mid/late game for diversity
    const randomFactor = moveNumber <= 10 ? 6 : (moveNumber <= 25 ? 12 : 18);
    score += Math.random() * randomFactor;

    return { move, score };
  });

  scoredMoves.sort((a, b) => b.score - a.score);
  return scoredMoves[0].move;
}

export class OfflineEngine {
  static async generatePlayerMove({ legalMoves, fen, historySan, turn, delay = 500, repetitionRiskMoves = [], shuffleMoves = [] }) {
    await new Promise(r => setTimeout(r, delay));
    const moveCount = Math.floor(historySan.length / 2) + 1;
    const chosen = pickHeuristicMove(legalMoves, 'tactical', turn, moveCount, repetitionRiskMoves, shuffleMoves) || legalMoves[0];

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

  static async evaluateArbiterDecision({
    proposedMove,
    playerReasoning,
    legalMoves = [],
    delay = 500,
    repetitionRiskMoves = [],
    shuffleMoves = [],
    candidates = []
  }) {
    await new Promise(r => setTimeout(r, delay));
    const isLegal = legalMoves.some(m => m.san === proposedMove);
    let verifiedMove = isLegal ? proposedMove : (legalMoves[0]?.san || proposedMove);

    const repetitionSet = new Set(repetitionRiskMoves);
    const shuffleSet = new Set(shuffleMoves);

    let grade = 'Good Move';
    let commentary = `Arbiter approves legal move ${verifiedMove}. ${playerReasoning || 'Solid move maintaining position.'}`;

    if (repetitionSet.has(verifiedMove)) {
      grade = 'Inaccuracy';
      const safeCandidate = candidates.find(c => !repetitionSet.has(c) && legalMoves.some(m => m.san === c));
      const safeLegal = legalMoves.find(m => !repetitionSet.has(m.san));
      const alternative = safeCandidate || safeLegal?.san;
      if (alternative) {
        verifiedMove = alternative;
        commentary = `Arbiter vetoed proposed move (causes threefold repetition draw). Overridden with safe alternative ${verifiedMove}.`;
      } else {
        commentary = `Move causes threefold repetition, but no non-repeating alternatives exist.`;
      }
    } else if (shuffleSet.has(verifiedMove)) {
      grade = 'Inaccuracy';
      const diverseCandidate = candidates.find(c => !shuffleSet.has(c) && !repetitionSet.has(c) && legalMoves.some(m => m.san === c));
      const diverseLegal = legalMoves.find(m => !shuffleSet.has(m.san) && !repetitionSet.has(m.san));
      const alternative = diverseCandidate || diverseLegal?.san;
      if (alternative) {
        verifiedMove = alternative;
        commentary = `Arbiter intervened: proposed move was aimless piece shuffling. Replaced with progressive move ${verifiedMove}.`;
      } else {
        commentary = `Move continues piece oscillation. Arbiter cautions player to seek fresh tactics.`;
      }
    } else if (verifiedMove.includes('#')) {
      grade = 'Brilliant';
      commentary = `Game-ending checkmate combination! Flawless precision.`;
    } else if (verifiedMove.includes('+')) {
      grade = 'Best Move';
      commentary = `Check delivers direct attack and limits defensive responses.`;
    } else if (['e4', 'd4', 'Nf3', 'c4', 'e5', 'c5', 'Nf6'].includes(verifiedMove)) {
      grade = 'Best Move';
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
