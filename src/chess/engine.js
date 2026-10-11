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
