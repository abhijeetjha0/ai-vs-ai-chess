/**
 * Prompt & Context Builder for AI Chess Arena
 * Converts board state and chess rules into high-signal, token-efficient context.
 */

/**
 * Formats an 8x8 board matrix into a clean 2D ASCII grid.
 * White pieces: uppercase (P, N, B, R, Q, K)
 * Black pieces: lowercase (p, n, b, r, q, k)
 * Empty squares: .
 *
 * @param {Array<Array<{type: string, color: string}|null>>} board - 8x8 board from chess.js
 * @returns {string} Clean 2D ASCII representation
 */
export function formatBoard2D(board) {
  if (!board || !Array.isArray(board) || board.length !== 8) {
    return '';
  }

  const lines = [];
  for (let r = 0; r < 8; r++) {
    const rankNum = 8 - r;
    const rowChars = board[r].map(square => {
      if (!square) return '.';
      return square.color === 'w' ? square.type.toUpperCase() : square.type.toLowerCase();
    });
    lines.push(`${rankNum}  ${rowChars.join(' ')}`);
  }
  lines.push('   a b c d e f g h');
  return lines.join('\n');
}

/**
 * Categorizes a list of legal moves into tactical clusters.
 *
 * @param {Array<{san: string, captured?: string|null}>} legalMoves
 * @returns {{ captures: string[], checks: string[], castles: string[], quiet: string[] }}
 */
export function categorizeLegalMoves(legalMoves = []) {
  const captures = [];
  const checks = [];
  const castles = [];
  const quiet = [];

  for (const m of legalMoves) {
    const san = m.san;
    const isCheck = san.includes('+') || san.includes('#');
    const isCapture = Boolean(m.captured) || san.includes('x');
    const isCastle = san === 'O-O' || san === 'O-O-O';

    if (isCapture) {
      captures.push(san);
    } else if (isCheck) {
      checks.push(san);
    } else if (isCastle) {
      castles.push(san);
    } else {
      quiet.push(san);
    }
  }

  return { captures, checks, castles, quiet };
}

/**
 * Builds high-signal prompt context for Player 1 / Player 2 turn decision.
 */
export function buildPlayerPromptContext({
  turn = 'w',
  fen,
  board,
  legalMoves = [],
  historySan = [],
  opening = null,
  lastMove = null,
  inCheck = false,
  advantage = 0,
  enriched = true
}) {
  const turnColor = turn === 'w' ? 'White' : 'Black';
  const opponentColor = turn === 'w' ? 'Black' : 'White';
  const legalSanList = legalMoves.map(m => m.san);

  if (!enriched) {
    // Lightweight fallback prompt
    return `You are playing as ${turnColor} in chess.
Board FEN: ${fen}
Legal moves: ${JSON.stringify(legalSanList)}

Choose ONE move strictly from the legal moves list.
Respond ONLY with this JSON:
{"move": "EXACT_SAN_MOVE", "reasoning": "Brief 1-sentence tactical rationale", "candidates": ["MOVE_1", "MOVE_2"]}`;
  }

  const board2D = board ? formatBoard2D(board) : '';
  const categorized = categorizeLegalMoves(legalMoves);
  const moveNumber = Math.floor(historySan.length / 2) + 1;
  const recentMoves = historySan.slice(-6).join(' ') || 'Game Start';

  const sections = [
    `You are playing as ${turnColor} in chess (Turn #${moveNumber}).`,
    `Status: ${inCheck ? '⚠️ IN CHECK! You must defend your King.' : 'Normal'} | Material balance: ${advantage > 0 ? `+${advantage} advantage` : advantage < 0 ? `${advantage} deficit` : 'Equal'}.`,
    lastMove ? `Opponent's last move: ${lastMove.san} by ${opponentColor}.` : 'First move of the match.',
    opening?.name && opening.name !== 'Starting Position' ? `Opening: ${opening.name}${opening.eco ? ` (${opening.eco})` : ''}.` : null,
    `Recent moves: ${recentMoves}`,
    board2D ? `Board (White bottom uppercase, Black top lowercase):\n${board2D}` : null,
    `FEN: ${fen}`,
    'Tactical Opportunities in your Legal Moves:',
    categorized.captures.length > 0 ? `- Captures/Attacks: ${categorized.captures.join(', ')}` : '- Captures: None',
    categorized.checks.length > 0 ? `- Checks: ${categorized.checks.join(', ')}` : '- Checks: None',
    categorized.castles.length > 0 ? `- King Safety / Castling: ${categorized.castles.join(', ')}` : null,
    `- Quiet / Positional (${categorized.quiet.length}): ${categorized.quiet.slice(0, 15).join(', ')}${categorized.quiet.length > 15 ? '...' : ''}`,
    `All Legal Moves (${legalSanList.length}): ${JSON.stringify(legalSanList)}`,
    '',
    'Instructions:',
    '1. Pick the best tactical or strategic move strictly from the legal moves list.',
    '2. Respond ONLY with this valid JSON object without markdown or extra text:',
    '{"move": "EXACT_SAN_MOVE", "reasoning": "Brief 1-sentence tactical rationale", "candidates": ["MOVE_1", "MOVE_2"]}'
  ].filter(Boolean);

  return sections.join('\n');
}

/**
 * Builds high-signal state context for Decision Arbiter adjudication.
 */
export function buildArbiterPromptContext({
  turn = 'w',
  proposedMove,
  playerReasoning,
  candidates = [],
  fen,
  legalMoves = [],
  lastMove = null,
  inCheck = false,
  opening = null
}) {
  const turnColor = turn === 'w' ? 'White' : 'Black';
  const categorized = categorizeLegalMoves(legalMoves);
  const isCapture = proposedMove && (proposedMove.includes('x') || legalMoves.some(m => m.san === proposedMove && m.captured));
  const isCheck = proposedMove && (proposedMove.includes('+') || proposedMove.includes('#'));
  const isCastle = proposedMove === 'O-O' || proposedMove === 'O-O-O';

  const moveType = isCheck ? 'Check' : isCapture ? 'Capture' : isCastle ? 'Castling' : 'Quiet Move';

  const parts = [
    `Chess match turn: ${turnColor} proposed move '${proposedMove}' (${moveType}).`,
    playerReasoning ? `Player reasoning: "${playerReasoning}".` : null,
    inCheck ? 'Context: Player was in check when proposing this move.' : null,
    lastMove ? `Preceding move by opponent: ${lastMove.san}.` : null,
    opening?.name && opening.name !== 'Starting Position' ? `Opening: ${opening.name}.` : null,
    candidates.length > 1 ? `Alternative candidate moves considered: ${candidates.join(', ')}.` : null,
    categorized.captures.length > 0 ? `Available capture tactics in position: ${categorized.captures.slice(0, 5).join(', ')}.` : null,
    categorized.checks.length > 0 ? `Available checks: ${categorized.checks.slice(0, 4).join(', ')}.` : null
  ].filter(Boolean);

  return parts.join(' ');
}
