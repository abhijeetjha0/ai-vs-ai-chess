/**
 * Opening detector using the open Lichess Masters Explorer API with local fallback
 */

const openingCache = new Map();

// Local fallback dictionary for popular opening move prefixes
const localOpenings = [
  { moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'], name: 'Ruy Lopez', eco: 'C60' },
  { moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'], name: 'Italian Game', eco: 'C50' },
  { moves: ['e4', 'e5', 'Nf3', 'Nf6'], name: "Petrov's Defense", eco: 'C42' },
  { moves: ['e4', 'c5', 'Nf3', 'd6'], name: 'Sicilian Defense: Modern Variations', eco: 'B50' },
  { moves: ['e4', 'c5', 'Nf3', 'Nc6'], name: 'Sicilian Defense: Old Sicilian', eco: 'B30' },
  { moves: ['e4', 'c5'], name: 'Sicilian Defense', eco: 'B20' },
  { moves: ['e4', 'e6'], name: 'French Defense', eco: 'C00' },
  { moves: ['e4', 'c6'], name: 'Caro-Kann Defense', eco: 'B10' },
  { moves: ['e4', 'd5'], name: 'Scandinavian Defense', eco: 'B01' },
  { moves: ['d4', 'd5', 'c4'], name: "Queen's Gambit", eco: 'D06' },
  { moves: ['d4', 'Nf6', 'c4', 'e6', 'Nf3'], name: "Queen's Indian Defense", eco: 'E12' },
  { moves: ['d4', 'Nf6', 'c4', 'g6'], name: "King's Indian Defense", eco: 'E60' },
  { moves: ['d4', 'd5', 'Nf3', 'Nf6', 'Bf4'], name: 'London System', eco: 'D02' },
  { moves: ['d4', 'Nf6'], name: 'Indian Defense', eco: 'A45' },
  { moves: ['c4'], name: 'English Opening', eco: 'A10' },
  { moves: ['Nf3'], name: 'Réti Opening', eco: 'A04' },
  { moves: ['e4', 'e5'], name: "King's Pawn Game", eco: 'C20' },
  { moves: ['d4', 'd5'], name: "Queen's Pawn Game", eco: 'D00' },
  { moves: ['e4'], name: "King's Pawn Opening", eco: 'B00' },
  { moves: ['d4'], name: "Queen's Pawn Opening", eco: 'A40' }
];

export async function detectOpening(fen, historySan = []) {
  if (historySan.length === 0) {
    return { name: 'Starting Position', eco: 'A00' };
  }

  // Check cache
  if (openingCache.has(fen)) {
    return openingCache.get(fen);
  }

  // Only query Lichess if move count is within opening phase (up to move 25)
  if (historySan.length <= 25) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const url = `https://explorer.lichess.org/masters?fen=${encodeURIComponent(fen)}&moves=5`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.opening && data.opening.name) {
          const result = {
            name: data.opening.name,
            eco: data.opening.eco || ''
          };
          openingCache.set(fen, result);
          return result;
        }
      }
    } catch (e) {
      // Network timeout or offline - seamlessly proceed to local heuristic
    }
  }

  // Local prefix match fallback
  for (const item of localOpenings) {
    if (item.moves.length <= historySan.length) {
      const match = item.moves.every((m, idx) => historySan[idx] === m);
      if (match) {
        const result = { name: item.name, eco: item.eco };
        openingCache.set(fen, result);
        return result;
      }
    }
  }

  // In later game phases
  const gamePhase = historySan.length > 30 ? 'Endgame' : 'Middlegame';
  const fallback = { name: gamePhase, eco: '' };
  openingCache.set(fen, fallback);
  return fallback;
}
