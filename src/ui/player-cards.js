/**
 * Player Cards UI: White & Black Player Profiles, Status Badges, and Captured Pieces
 */

import { getPieceSvg } from './pieces.js';

export class PlayerCardsUI {
  constructor({ containerTop, containerBottom, modelManager }) {
    this.topContainer = containerTop;       // Typically Black player
    this.bottomContainer = containerBottom; // Typically White player
    this.modelManager = modelManager;
    this.initDOM();
  }

  initDOM() {
    this.topContainer.innerHTML = this.getCardTemplate('black');
    this.bottomContainer.innerHTML = this.getCardTemplate('white');
  }

  getCardTemplate(color) {
    const isWhite = color === 'white';
    const config = this.modelManager.config[color];
    const accentClass = isWhite ? 'player-white' : 'player-black';
    const initialPiece = isWhite ? '♔' : '♚';

    return `
      <div class="player-card glass-panel ${accentClass}" id="card-${color}">
        <div class="player-header">
          <div class="player-identity">
            <span class="player-piece-icon">${initialPiece}</span>
            <div class="player-meta">
              <div class="player-name" id="name-${color}">${config.name || config.model}</div>
              <div class="player-provider-badge badge-${config.provider}" id="badge-${color}">
                ${config.provider.toUpperCase()}
              </div>
            </div>
          </div>
          <div class="player-status-pill waiting" id="status-${color}">
            WAITING
          </div>
        </div>

        <div class="player-captures-row">
          <div class="captures-tray" id="captures-${color}"></div>
          <div class="advantage-pill hidden" id="advantage-${color}">+0</div>
        </div>

        <div class="player-reasoning-bubble" id="reasoning-${color}">
          <span class="reasoning-label">Strategy:</span>
          <span class="reasoning-text">Awaiting match start...</span>
        </div>
      </div>
    `;
  }

  updatePlayerConfigs() {
    ['white', 'black'].forEach(color => {
      const config = this.modelManager.config[color];
      const nameEl = document.getElementById(`name-${color}`);
      const badgeEl = document.getElementById(`badge-${color}`);
      if (nameEl) nameEl.textContent = config.name || config.model;
      if (badgeEl) {
        badgeEl.textContent = config.provider.toUpperCase();
        badgeEl.className = `player-provider-badge badge-${config.provider}`;
      }
    });
  }

  setTurnStatus(activeTurn, turnState = 'turn') {
    // activeTurn: 'w' or 'b'
    const whiteStatus = document.getElementById('status-white');
    const blackStatus = document.getElementById('status-black');
    const cardWhite = document.getElementById('card-white');
    const cardBlack = document.getElementById('card-black');

    if (!whiteStatus || !blackStatus) return;

    if (activeTurn === 'w') {
      whiteStatus.className = `player-status-pill ${turnState === 'thinking' ? 'thinking' : 'active'}`;
      whiteStatus.textContent = turnState === 'thinking' ? 'THINKING...' : 'TO MOVE';
      blackStatus.className = 'player-status-pill waiting';
      blackStatus.textContent = 'WAITING';
      cardWhite?.classList.add('turn-active');
      cardBlack?.classList.remove('turn-active');
    } else {
      blackStatus.className = `player-status-pill ${turnState === 'thinking' ? 'thinking' : 'active'}`;
      blackStatus.textContent = turnState === 'thinking' ? 'THINKING...' : 'TO MOVE';
      whiteStatus.className = 'player-status-pill waiting';
      whiteStatus.textContent = 'WAITING';
      cardBlack?.classList.add('turn-active');
      cardWhite?.classList.remove('turn-active');
    }
  }

  setReasoning(slot, move, reasoning) {
    const bubble = document.getElementById(`reasoning-${slot}`);
    if (bubble) {
      bubble.innerHTML = `
        <span class="reasoning-move-tag">${move}</span>
        <span class="reasoning-text">${reasoning}</span>
      `;
    }
  }

  updateCaptures(engine) {
    const { whiteCaptured, blackCaptured, whiteAdvantage } = engine.getCapturedPieces();

    const whiteCapturesEl = document.getElementById('captures-white');
    const blackCapturesEl = document.getElementById('captures-black');
    const whiteAdvEl = document.getElementById('advantage-white');
    const blackAdvEl = document.getElementById('advantage-black');

    const renderPieces = (pieces, pieceColor) => {
      return pieces.map(type => {
        return `<span class="captured-piece-mini" title="${type}">${getPieceSvg({ color: pieceColor, type })}</span>`;
      }).join('');
    };

    if (whiteCapturesEl) {
      whiteCapturesEl.innerHTML = renderPieces(whiteCaptured, 'b');
    }
    if (blackCapturesEl) {
      blackCapturesEl.innerHTML = renderPieces(blackCaptured, 'w');
    }

    if (whiteAdvEl && blackAdvEl) {
      if (whiteAdvantage > 0) {
        whiteAdvEl.textContent = `+${whiteAdvantage}`;
        whiteAdvEl.classList.remove('hidden');
        blackAdvEl.classList.add('hidden');
      } else if (whiteAdvantage < 0) {
        blackAdvEl.textContent = `+${Math.abs(whiteAdvantage)}`;
        blackAdvEl.classList.remove('hidden');
        whiteAdvEl.classList.add('hidden');
      } else {
        whiteAdvEl.classList.add('hidden');
        blackAdvEl.classList.add('hidden');
      }
    }
  }

  setGameOver(details) {
    const whiteStatus = document.getElementById('status-white');
    const blackStatus = document.getElementById('status-black');
    if (!whiteStatus || !blackStatus) return;

    if (details.winner === 'White') {
      whiteStatus.className = 'player-status-pill winner';
      whiteStatus.textContent = 'VICTORIOUS 👑';
      blackStatus.className = 'player-status-pill defeated';
      blackStatus.textContent = 'DEFEATED';
    } else if (details.winner === 'Black') {
      blackStatus.className = 'player-status-pill winner';
      blackStatus.textContent = 'VICTORIOUS 👑';
      whiteStatus.className = 'player-status-pill defeated';
      whiteStatus.textContent = 'DEFEATED';
    } else {
      whiteStatus.className = 'player-status-pill draw';
      whiteStatus.textContent = 'DRAW';
      blackStatus.className = 'player-status-pill draw';
      blackStatus.textContent = 'DRAW';
    }
  }
}
