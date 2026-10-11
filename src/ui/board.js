/**
 * Interactive SVG/CSS Chessboard UI Component
 */

import { getPieceSvg } from './pieces.js';

export class ChessBoardUI {
  constructor(containerEl, engine, options = {}) {
    this.container = containerEl;
    this.engine = engine;
    this.options = options;
    this.flipped = false;
    this.selectedSquare = null;
    this.legalDestinations = [];
    this.lastMove = null; // { from, to }
    this.onMoveCallback = options.onMove || null;
    this.interactive = options.interactive !== undefined ? options.interactive : true;

    this.initDOM();
    this.render();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="chessboard-wrapper">
        <div class="chessboard-grid" id="chessboardGrid"></div>
      </div>
    `;
    this.gridEl = this.container.querySelector('#chessboardGrid');
  }

  setInteractive(val) {
    this.interactive = val;
    if (!val) {
      this.clearSelection();
    }
  }

  flip() {
    this.flipped = !this.flipped;
    this.render();
    return this.flipped;
  }

  setFlipped(val) {
    this.flipped = val;
    this.render();
  }

  setLastMove(from, to) {
    this.lastMove = from && to ? { from, to } : null;
    this.updateHighlights();
  }

  clearSelection() {
    this.selectedSquare = null;
    this.legalDestinations = [];
    this.updateHighlights();
  }

  handleSquareClick(square) {
    if (!this.interactive) return;

    const board = this.engine.getBoard();
    const legalMoves = this.engine.getLegalMoves();
    const currentTurn = this.engine.getTurn();

    // If already clicked a piece, check if this click is a valid move destination
    if (this.selectedSquare) {
      const targetMove = this.legalDestinations.find(m => m.to === square);
      if (targetMove) {
        const fromSquare = this.selectedSquare;
        this.clearSelection();
        if (this.onMoveCallback) {
          this.onMoveCallback(targetMove.san, { from: fromSquare, to: square });
        }
        return;
      }
    }

    // Check if clicked square has a piece of current turn
    const fileIdx = square.charCodeAt(0) - 97;
    const rankIdx = 8 - parseInt(square[1], 10);
    const piece = board[rankIdx]?.[fileIdx];

    if (piece && piece.color === currentTurn) {
      this.selectedSquare = square;
      this.legalDestinations = legalMoves.filter(m => m.from === square);
      this.updateHighlights();
    } else {
      this.clearSelection();
    }
  }

  render() {
    this.gridEl.innerHTML = '';
    const board = this.engine.getBoard();
    const kingInCheck = this.engine.inCheck() ? this.engine.findKingSquare() : null;

    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

    const renderRanks = this.flipped ? [...ranks].reverse() : ranks;
    const renderFiles = this.flipped ? [...files].reverse() : files;

    renderRanks.forEach((rank, rIdx) => {
      renderFiles.forEach((file, fIdx) => {
        const square = `${file}${rank}`;
        const actualR = 8 - parseInt(rank, 10);
        const actualC = file.charCodeAt(0) - 97;
        const piece = board[actualR][actualC];

        const isLight = (actualR + actualC) % 2 === 0;
        const squareEl = document.createElement('div');
        squareEl.className = `board-square ${isLight ? 'light' : 'dark'}`;
        squareEl.dataset.square = square;

        // Coordinate labels
        if (fIdx === 0) {
          const rankLabel = document.createElement('span');
          rankLabel.className = 'coord-label coord-rank';
          rankLabel.textContent = rank;
          squareEl.appendChild(rankLabel);
        }
        if (rIdx === 7) {
          const fileLabel = document.createElement('span');
          fileLabel.className = 'coord-label coord-file';
          fileLabel.textContent = file;
          squareEl.appendChild(fileLabel);
        }

        // Piece
        if (piece) {
          const pieceEl = document.createElement('div');
          pieceEl.className = `piece-container piece-${piece.color}${piece.type}`;
          pieceEl.innerHTML = getPieceSvg(piece);
          squareEl.appendChild(pieceEl);
        }

        // Click handler
        squareEl.addEventListener('click', () => this.handleSquareClick(square));

        this.gridEl.appendChild(squareEl);
      });
    });

    this.updateHighlights();
  }

  updateHighlights() {
    const kingInCheck = this.engine.inCheck() ? this.engine.findKingSquare() : null;
    const squares = this.gridEl.querySelectorAll('.board-square');

    squares.forEach(sq => {
      const squareName = sq.dataset.square;

      // Reset dynamic highlights
      sq.classList.remove('selected', 'last-move-from', 'last-move-to', 'in-check', 'is-legal-target', 'has-target-dot');
      const existingDot = sq.querySelector('.legal-dot');
      if (existingDot) existingDot.remove();
      const existingRing = sq.querySelector('.capture-ring');
      if (existingRing) existingRing.remove();

      // Selected square highlight
      if (this.selectedSquare === squareName) {
        sq.classList.add('selected');
      }

      // Last move highlight
      if (this.lastMove) {
        if (this.lastMove.from === squareName) sq.classList.add('last-move-from');
        if (this.lastMove.to === squareName) sq.classList.add('last-move-to');
      }

      // Check glow
      if (kingInCheck === squareName) {
        sq.classList.add('in-check');
      }

      // Legal move markers
      const isLegal = this.legalDestinations.some(m => m.to === squareName);
      if (isLegal) {
        const hasPiece = sq.querySelector('.piece-container');
        if (hasPiece) {
          const ring = document.createElement('div');
          ring.className = 'capture-ring';
          sq.appendChild(ring);
        } else {
          const dot = document.createElement('div');
          dot.className = 'legal-dot';
          sq.appendChild(dot);
        }
      }
    });
  }
}
