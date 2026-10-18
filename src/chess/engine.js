import { Chess } from 'chess.js';

// Audio Synthesizer using Web Audio API (zero external assets needed)
class ChessAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  playTone(freq, type, duration, gainStart = 0.15, gainEnd = 0.001) {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainStart, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(gainEnd, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio autoplay policy or error
    }
  }

  playMove() {
    this.playTone(320, 'sine', 0.09, 0.18, 0.01);
  }

  playCapture() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc1.type = 'triangle';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(260, this.ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.12);
      osc2.frequency.setValueAtTime(190, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);
      osc1.start();
      osc2.start();
      osc1.stop(this.ctx.currentTime + 0.12);
      osc2.stop(this.ctx.currentTime + 0.12);
    } catch (e) {}
  }

  playCheck() {
    this.playTone(660, 'sine', 0.18, 0.2, 0.01);
    setTimeout(() => this.playTone(880, 'sine', 0.22, 0.22, 0.01), 60);
  }

  playGameOver() {
    [440, 554, 659, 880].forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'sine', 0.4, 0.18, 0.01), idx * 90);
    });
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }
}

export class ChessGameEngine {
  constructor() {
    this.chess = new Chess();
    this.audio = new ChessAudio();
    this.historyStack = []; // Stores state snapshots for smooth navigation
  }

  reset() {
    this.chess.reset();
    this.historyStack = [];
  }

  load(fen) {
    this.chess.load(fen);
  }

  getFen() {
    return this.chess.fen();
  }

  getPgn() {
    return this.chess.pgn();
  }

  getTurn() {
    return this.chess.turn(); // 'w' or 'b'
  }

  getTurnColorName() {
    return this.chess.turn() === 'w' ? 'White' : 'Black';
  }

  isGameOver() {
    return this.chess.isGameOver();
  }

  inCheck() {
    return this.chess.inCheck();
  }

  getGameOverDetails() {
    if (!this.chess.isGameOver()) return null;
    if (this.chess.isCheckmate()) {
      const winner = this.chess.turn() === 'w' ? 'Black' : 'White';
      return {
        isGameOver: true,
        reason: 'Checkmate',
        winner,
        description: `Checkmate! ${winner} wins.`
      };
    }
    if (this.chess.isDraw()) {
      let reason = 'Draw';
      if (this.chess.isStalemate()) reason = 'Stalemate';
      else if (this.chess.isThreefoldRepetition()) reason = 'Threefold Repetition';
      else if (this.chess.isInsufficientMaterial()) reason = 'Insufficient Material';
      return {
        isGameOver: true,
        reason,
        winner: 'Draw',
        description: `Game drawn by ${reason}.`
      };
    }
    return {
      isGameOver: true,
      reason: 'Game Over',
      winner: 'Draw',
      description: 'Game concluded.'
    };
  }

  /**
   * Returns the number of times the current position has occurred.
   * Useful for detecting repetition risk (2 = one more repeat triggers draw).
   */
  getRepetitionCount() {
    // chess.js internally tracks position counts via _positionCount map.
    // isThreefoldRepetition() returns true when count >= 3.
    // We simulate: if current position already seen 2+ times, we're at risk.
    // Since _getPositionCount is private, we use isThreefoldRepetition after
    // a move/undo cycle, or approximate by checking move history for repeated FENs.
    const history = this.chess.history({ verbose: true });
    const currentFenKey = this._positionKey(this.chess.fen());
    let count = 1; // current position counts as 1 occurrence
    // Walk backwards through history to count prior occurrences of this position
    const tempChess = new (this.chess.constructor)();
    tempChess.load(this.chess.fen());
    // We need to replay from the start to count position occurrences
    // Instead, use a simpler heuristic: undo moves to find matching FEN keys
    const fens = [currentFenKey];
    const savedMoves = [];
    const chess = this.chess;
    let undone = chess.undo();
    while (undone) {
      savedMoves.push(undone);
      fens.push(this._positionKey(chess.fen()));
      undone = chess.undo();
    }
    // Restore all moves
    for (let i = savedMoves.length - 1; i >= 0; i--) {
      chess.move(savedMoves[i].san);
    }
    // Count occurrences of currentFenKey
    count = fens.filter(f => f === currentFenKey).length;
    return count;
  }

  /**
   * Extracts a position key from a FEN (strips move counters for repetition comparison).
   * Threefold repetition cares about: piece placement, active color, castling, en passant.
   */
  _positionKey(fen) {
    // FEN: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    // Position key = first 4 fields (pieces, turn, castling, en passant)
    return fen.split(' ').slice(0, 4).join(' ');
  }

  /**
   * Checks if making a specific move would cause threefold repetition.
   * @param {string} san - Move in SAN notation
   * @returns {boolean} True if the move would trigger threefold repetition
   */
  wouldCauseRepetition(san) {
    try {
      const result = this.chess.move(san);
      if (!result) return false;
      const wouldRepeat = this.chess.isThreefoldRepetition();
      this.chess.undo();
      return wouldRepeat;
    } catch (e) {
      return false;
    }
  }

  /**
   * Returns list of legal moves with details
   */
  getLegalMoves() {
    const rawMoves = this.chess.moves({ verbose: true });
    return rawMoves.map(m => ({
      san: m.san,
      from: m.from,
      to: m.to,
      piece: m.piece,
      color: m.color,
      captured: m.captured || null,
      promotion: m.promotion || null,
      uci: `${m.from}${m.to}${m.promotion ? m.promotion : ''}`
    }));
  }

  /**
   * Returns legal moves filtered to exclude those that would cause threefold repetition.
   * Falls back to all legal moves if every move would cause repetition (to avoid stalling).
   * @returns {{ safeMoves: Array, filteredOut: Array, hasRepetitionRisk: boolean }}
   */
  getMovesAvoidingRepetition() {
    const allMoves = this.getLegalMoves();
    const safeMoves = [];
    const filteredOut = [];

    for (const move of allMoves) {
      if (this.wouldCauseRepetition(move.san)) {
        filteredOut.push(move);
      } else {
        safeMoves.push(move);
      }
    }

    // If ALL moves lead to repetition, return all (can't avoid it)
    if (safeMoves.length === 0) {
      return { safeMoves: allMoves, filteredOut: [], hasRepetitionRisk: false };
    }

    return {
      safeMoves,
      filteredOut,
      hasRepetitionRisk: filteredOut.length > 0
    };
  }

  /**
   * Analyzes recent move history to detect piece shuffle patterns (pieces bouncing
   * between the same squares without making progress). Returns a structured report
   * including which legal moves would continue a detected shuffle.
   *
   * @param {number} lookback - Number of half-moves to scan (default 12)
   * @returns {{
   *   isShuffling: boolean,
   *   shuffleMoves: string[],        - SAN moves that continue a detected shuffle pattern
   *   shuffleSummary: string,        - Human-readable description for prompt injection
   *   recentSanRepeatCount: Map,     - How many times each SAN appeared in the window
   *   pieceSquareHistory: Map         - piece+square visit frequency for the current player
   * }}
   */
  getShuffleAnalysis(lookback = 12) {
    const history = this.chess.history({ verbose: true });
    const currentColor = this.chess.turn();
    const legalMoves = this.getLegalMoves();
    const result = {
      isShuffling: false,
      shuffleMoves: [],
      shuffleSummary: '',
      recentSanRepeatCount: new Map(),
      pieceSquareHistory: new Map()
    };

    if (history.length < 4) return result;

    // Only look at the recent window
    const window = history.slice(-lookback);

    // 1. Track SAN repetition in the window (same color only)
    const sanCounts = new Map();
    for (const move of window) {
      if (move.color === currentColor) {
        sanCounts.set(move.san, (sanCounts.get(move.san) || 0) + 1);
      }
    }
    result.recentSanRepeatCount = sanCounts;

    // 2. Track piece-to-square visit frequency (same color only)
    // e.g., "N@f3" → 3 visits means the knight has landed on f3 three times
    const pieceSquareVisits = new Map();
    for (const move of window) {
      if (move.color === currentColor) {
        const key = `${move.piece.toUpperCase()}@${move.to}`;
        pieceSquareVisits.set(key, (pieceSquareVisits.get(key) || 0) + 1);
      }
    }
    result.pieceSquareHistory = pieceSquareVisits;

    // 3. Detect immediate reversals: piece went from A→B, then B→A (or is about to)
    //    Look at the last move by this color to see if they just moved a piece;
    //    if a legal move returns that piece to the "from" square, that's a reversal.
    const myRecentMoves = window.filter(m => m.color === currentColor);
    const lastOwnMove = myRecentMoves.length > 0 ? myRecentMoves[myRecentMoves.length - 1] : null;
    const secondLastOwnMove = myRecentMoves.length > 1 ? myRecentMoves[myRecentMoves.length - 2] : null;

    const shuffleSet = new Set();
    const shuffleReasons = [];

    // 3a. Detect direct reversal: if a legal move sends the same piece back to
    //     the square it came from on the last move
    if (lastOwnMove) {
      for (const m of legalMoves) {
        // Same piece type going back to where it just came from
        if (m.piece === lastOwnMove.piece && m.from === lastOwnMove.to && m.to === lastOwnMove.from && !m.captured) {
          shuffleSet.add(m.san);
        }
      }
    }

    // 3b. Detect oscillation: piece has visited the same square 2+ times in window
    //     and a legal move sends it back there again
    for (const m of legalMoves) {
      if (m.captured) continue; // captures make progress, skip
      const key = `${m.piece.toUpperCase()}@${m.to}`;
      const visits = pieceSquareVisits.get(key) || 0;
      if (visits >= 2) {
        shuffleSet.add(m.san);
      }
    }

    // 3c. Detect SAN repetition: the exact same SAN move has been played 2+ times
    //     by this color in the window
    for (const m of legalMoves) {
      if (m.captured) continue;
      const repeats = sanCounts.get(m.san) || 0;
      if (repeats >= 2) {
        shuffleSet.add(m.san);
      }
    }

    // 3d. Detect broader back-and-forth pattern:
    //     If the second-to-last own move's .to matches a legal move's .to (going
    //     back to where we were 2 own-moves ago) and it's the same piece type
    if (secondLastOwnMove) {
      for (const m of legalMoves) {
        if (m.captured) continue;
        if (m.piece === secondLastOwnMove.piece && m.to === secondLastOwnMove.to) {
          shuffleSet.add(m.san);
        }
      }
    }

    result.shuffleMoves = [...shuffleSet];
    result.isShuffling = shuffleSet.size > 0;

    // Build human-readable summary
    if (result.isShuffling) {
      const parts = [];
      // Direct reversals
      if (lastOwnMove) {
        const reversals = legalMoves.filter(m => m.piece === lastOwnMove.piece && m.from === lastOwnMove.to && m.to === lastOwnMove.from && !m.captured);
        if (reversals.length > 0) {
          parts.push(`Immediate reversal: ${lastOwnMove.piece.toUpperCase()} returning to ${lastOwnMove.from} (${reversals.map(m => m.san).join(', ')})`);
        }
      }
      // Find the most repeated patterns
      const topRepeats = [...sanCounts.entries()]
        .filter(([, c]) => c >= 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      if (topRepeats.length > 0) {
        parts.push(`Repeated moves by you: ${topRepeats.map(([san, c]) => `${san} (${c}x)`).join(', ')}`);
      }
      const topSquareLoops = [...pieceSquareVisits.entries()]
        .filter(([, c]) => c >= 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      if (topSquareLoops.length > 0) {
        parts.push(`Piece-square loops: ${topSquareLoops.map(([k, c]) => `${k} visited ${c}x`).join(', ')}`);
      }
      if (parts.length === 0) {
        parts.push(`Piece oscillation detected: avoiding shuffle moves ${result.shuffleMoves.join(', ')}`);
      }
      result.shuffleSummary = parts.join('. ');
    }

    return result;
  }

  /**
   * Finds a progressive, diverse alternative move from legal moves, excluding
   * repetition-causing moves and shuffle moves where possible.
   * Prioritizes: safe checkmates/checks/captures > forward pawn pushes > piece development to fresh squares > castling.
   *
   * @param {string[]} excludeSans - Moves to avoid (e.g. repetition or shuffle moves)
   * @returns {string|null} SAN string of the diverse alternative move
   */
  getDiverseAlternative(excludeSans = []) {
    const excludeSet = new Set(excludeSans);
    const legalMoves = this.getLegalMoves();
    const candidateMoves = legalMoves.filter(m => !excludeSet.has(m.san) && !this.wouldCauseRepetition(m.san));

    if (candidateMoves.length === 0) {
      // If all candidate moves are excluded, try moves that at least don't cause threefold repetition
      const nonRepetition = legalMoves.filter(m => !this.wouldCauseRepetition(m.san));
      if (nonRepetition.length > 0) return nonRepetition[0].san;
      return legalMoves[0]?.san || null;
    }

    // Score candidates by progressive diversity:
    const turn = this.chess.turn();
    const scored = candidateMoves.map(m => {
      let score = 0;
      // 1. Checks and captures make tangible progress
      if (m.san.includes('#')) score += 1000;
      if (m.san.includes('+')) score += 100;
      if (m.captured) score += 80;

      // 2. Pawn pushes are irreversible and permanently break loops
      if (m.piece === 'p') {
        score += 50;
        if (['d', 'e'].includes(m.to[0])) score += 20; // Center pawn
        const rank = parseInt(m.to[1]);
        if ((turn === 'w' && rank >= 5) || (turn === 'b' && rank <= 4)) score += 15; // Advanced pawn
      }

      // 3. Castling enhances king safety
      if (m.san === 'O-O' || m.san === 'O-O-O') score += 40;

      // 4. Minor piece development to central files
      if (['n', 'b'].includes(m.piece)) {
        if (['c', 'd', 'e', 'f'].includes(m.to[0])) score += 25;
      }

      // Small tie-breaker to avoid determinism
      score += Math.random() * 5;
      return { move: m, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.move.san || candidateMoves[0].san;
  }

  /**
   * Attempts to execute a move. Input can be SAN string (e.g. "e4", "Nf3", "O-O"),
   * UCI string (e.g. "e2e4"), or move object { from, to, promotion }.
   */
  makeMove(moveInput) {
    let result = null;
    try {
      if (typeof moveInput === 'string') {
        const clean = moveInput.trim();
        // Check if input is UCI format (e.g. e2e4 or e7e8q)
        if (/^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(clean)) {
          const from = clean.slice(0, 2).toLowerCase();
          const to = clean.slice(2, 4).toLowerCase();
          const promotion = clean.length === 5 ? clean[4].toLowerCase() : undefined;
          result = this.chess.move({ from, to, promotion });
        } else {
          result = this.chess.move(clean);
        }
      } else if (typeof moveInput === 'object' && moveInput !== null) {
        result = this.chess.move(moveInput);
      }
    } catch (err) {
      return null;
    }

    if (result) {
      // Sound feedback
      if (this.chess.isGameOver()) {
        this.audio.playGameOver();
      } else if (this.chess.inCheck()) {
        this.audio.playCheck();
      } else if (result.captured) {
        this.audio.playCapture();
      } else {
        this.audio.playMove();
      }
    }

    return result;
  }

  undo() {
    return this.chess.undo();
  }

  getBoard() {
    return this.chess.board(); // 8x8 array of Piece | null
  }

  getHistoryVerbose() {
    return this.chess.history({ verbose: true });
  }

  getHistorySan() {
    return this.chess.history();
  }

  findKingSquare(color = this.chess.turn()) {
    const board = this.chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'k' && piece.color === color) {
          const file = String.fromCharCode(97 + c);
          const rank = 8 - r;
          return `${file}${rank}`;
        }
      }
    }
    return null;
  }

  getCapturedPieces() {
    const counts = {
      w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
      b: { p: 0, n: 0, b: 0, r: 0, q: 0 }
    };
    const board = this.chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type !== 'k') {
          counts[piece.color][piece.type]++;
        }
      }
    }

    const initial = { p: 8, n: 2, b: 2, r: 2, q: 1 };
    const values = { p: 1, n: 3, b: 3, r: 5, q: 9 };

    // White lost:
    const whiteLost = [];
    let whiteLostVal = 0;
    for (const [type, initCount] of Object.entries(initial)) {
      const lost = initCount - counts.w[type];
      for (let i = 0; i < lost; i++) {
        whiteLost.push(type);
        whiteLostVal += values[type];
      }
    }

    // Black lost:
    const blackLost = [];
    let blackLostVal = 0;
    for (const [type, initCount] of Object.entries(initial)) {
      const lost = initCount - counts.b[type];
      for (let i = 0; i < lost; i++) {
        blackLost.push(type);
        blackLostVal += values[type];
      }
    }

    // Advantage calculation:
    // White captures = blackLost; Black captures = whiteLost
    const whiteAdvantage = blackLostVal - whiteLostVal;

    return {
      whiteCaptured: blackLost, // pieces captured by white
      blackCaptured: whiteLost, // pieces captured by black
      whiteAdvantage
    };
  }

  getLastMove() {
    const historyVerbose = this.chess.history({ verbose: true });
    if (!historyVerbose || historyVerbose.length === 0) return null;
    return historyVerbose[historyVerbose.length - 1];
  }

  getMaterialAdvantage(color = this.chess.turn()) {
    const { whiteAdvantage } = this.getCapturedPieces();
    return color === 'w' ? whiteAdvantage : -whiteAdvantage;
  }
}
