/**
 * Application Entry Point & State Coordinator
 * AI vs AI Chess with Middle Decision Arbiter
 */

import { ChessGameEngine } from './chess/engine.js';
import { detectOpening } from './chess/openings.js';
import { evaluatePosition } from './chess/evaluator.js';
import { ModelManager } from './api/model-manager.js';
import { DecisionEngine } from './arbiter/decision-engine.js';
import { ChessBoardUI } from './ui/board.js';
import { ControlsUI } from './ui/controls.js';
import { PlayerCardsUI } from './ui/player-cards.js';
import { ArbiterPanelUI } from './ui/arbiter-panel.js';
import { HistoryPanelUI } from './ui/history-panel.js';
import { SettingsModalUI } from './ui/settings-modal.js';

class ChessArenaApp {
  constructor() {
    this.engine = new ChessGameEngine();
    this.modelManager = new ModelManager();
    this.decisionEngine = new DecisionEngine(this.engine, this.modelManager);

    this.turnCounter = 0;
    this.lastTurnProposal = null;

    this.initComponents();
    this.bindGlobalEvents();
    this.updateLiveStats();
  }

  initComponents() {
    // 1. Board Component
    const boardContainer = document.getElementById('chessboardContainer');
    this.boardUI = new ChessBoardUI(boardContainer, this.engine, {
      interactive: true,
      onMove: (san) => this.handleUserManualMove(san)
    });

    // 2. Player Cards Component
    this.playerCardsUI = new PlayerCardsUI({
      containerTop: document.getElementById('playerCardBlackContainer'),
      containerBottom: document.getElementById('playerCardWhiteContainer'),
      modelManager: this.modelManager
    });

    // 3. Arbiter Lounge Component
    this.arbiterPanelUI = new ArbiterPanelUI(
      document.getElementById('arbiterContainer'),
      this.modelManager
    );

    // 4. Move History & AI Thought Stream Component
    this.historyPanelUI = new HistoryPanelUI(
      document.getElementById('historyContainer'),
      this.engine
    );

    // 5. Controls UI Component
    this.controlsUI = new ControlsUI(
      document.getElementById('controlsContainer'),
      this.decisionEngine,
      {
        onStartAuto: () => this.handleStartAutomation(),
        onPlayTurn: () => this.handlePlayTurn(),
        onForceSide: (side) => this.handleForceSide(side),
        onReset: () => this.handleResetGame(),
        onFlip: () => this.boardUI.flip(),
        onToggleSound: () => this.engine.audio.toggleMute(),
        onCopyFen: () => this.handleCopyFen(),
        onExportPgn: () => this.handleExportPgn(),
        onModeChange: (mode) => {
          this.boardUI.setInteractive(mode === 'manual');
        }
      }
    );

    // 6. Settings Modal Component
    this.settingsModalUI = new SettingsModalUI(this.modelManager, {
      onSaved: () => this.handleSettingsSaved()
    });

    // Sync Header Matchup Pill
    this.updateHeaderMatchupPill();
  }

  bindGlobalEvents() {
    // Open Settings Button
    document.getElementById('btnOpenSettings')?.addEventListener('click', () => {
      this.settingsModalUI.open();
    });

    // Game Over Modal Buttons
    document.getElementById('btnModalClose')?.addEventListener('click', () => {
      document.getElementById('gameOverModal')?.classList.add('hidden');
    });

    document.getElementById('btnModalRematch')?.addEventListener('click', () => {
      document.getElementById('gameOverModal')?.classList.add('hidden');
      this.handleResetGame();
      this.handleStartAutomation();
    });
  }

  updateHeaderMatchupPill() {
    const cfg = this.modelManager.config;
    const pillWhite = document.getElementById('pillWhiteName');
    const pillBlack = document.getElementById('pillBlackName');
    const pillArbiter = document.getElementById('pillArbiterName');

    if (pillWhite) pillWhite.textContent = cfg.white.name || cfg.white.model;
    if (pillBlack) pillBlack.textContent = cfg.black.name || cfg.black.model;
    if (pillArbiter) pillArbiter.textContent = cfg.arbiter.name || cfg.arbiter.model;
  }

  handleSettingsSaved() {
    this.updateHeaderMatchupPill();
    this.playerCardsUI.updatePlayerConfigs();
    this.arbiterPanelUI.updateConfig();
  }

  async updateLiveStats() {
    const currentTurn = this.engine.getTurn();
    const fen = this.engine.getFen();
    const history = this.engine.getHistorySan();

    // 1. Update Player Turn Indicators
    this.playerCardsUI.setTurnStatus(currentTurn, this.decisionEngine.isExecuting() ? 'thinking' : 'to-move');
    this.playerCardsUI.updateCaptures(this.engine);

    // 2. Update Position Evaluation & Eval Bar
    evaluatePosition(this.engine).then(evalRes => {
      const fillEl = document.getElementById('evalBarFill');
      const scoreEl = document.getElementById('evalBarScore');
      if (fillEl && scoreEl) {
        fillEl.style.height = `${evalRes.whiteWinChance}%`;
        scoreEl.textContent = evalRes.formatted;
      }
    });

    // 3. Update Lichess Opening Name & Game Phase
    detectOpening(fen, history).then(opening => {
      const nameEl = document.getElementById('openingName');
      const ecoEl = document.getElementById('ecoCode');
      const phaseEl = document.getElementById('gamePhase');

      if (nameEl) nameEl.textContent = opening.name || 'Open Game';
      if (ecoEl) ecoEl.textContent = opening.eco || '';
      if (phaseEl) {
        const moveNumber = Math.floor(history.length / 2) + 1;
        const phase = history.length < 16 ? 'Opening' : history.length < 35 ? 'Middlegame' : 'Endgame';
        phaseEl.textContent = `Move ${moveNumber} • ${phase}`;
      }
    });

    // 4. Update Move History Table
    this.historyPanelUI.updateMovesTable(history);
  }

  createTurnCallbacks() {
    let currentProposal = null;

    return {
      onThinkingDetails: ({ slot, modelName, status }) => {
        const turnColor = slot === 'white' ? 'w' : 'b';
        if (slot === 'white' || slot === 'black') {
          this.playerCardsUI.setTurnStatus(turnColor, 'thinking');
        }
      },

      onPlayerThinking: ({ slot, turnColor }) => {
        this.controlsUI.setTurnInProgress(true);
        this.setMatchBadge('in-progress', 'THINKING');
      },

      onPlayerProposed: ({ slot, move, reasoning, candidates, rawPrompt, rawResponse }) => {
        currentProposal = {
          slot,
          move,
          reasoning,
          candidates,
          rawPrompt,
          rawResponse,
          turnNumber: Math.floor(this.engine.getHistorySan().length / 2) + 1
        };
        this.playerCardsUI.setReasoning(slot, move, reasoning);
      },

      onArbiterEvaluating: ({ proposedMove, playerReasoning, candidates }) => {
        this.arbiterPanelUI.setEvaluating(proposedMove, playerReasoning, candidates);
      },

      onArbiterVerdict: ({ slot, proposedMove, finalMove, grade, commentary, rawPrompt, rawResponse }) => {
        this.arbiterPanelUI.setVerdict({
          slot,
          proposedMove,
          finalMove,
          grade,
          commentary
        });

        // Record into AI Thought Stream
        const whiteCfg = this.modelManager.config.white;
        const blackCfg = this.modelManager.config.black;
        const arbiterCfg = this.modelManager.config.arbiter;
        const isWhite = slot === 'white';

        this.historyPanelUI.addThoughtEntry({
          turnNumber: currentProposal ? currentProposal.turnNumber : 1,
          playerSlot: slot,
          modelName: isWhite ? (whiteCfg.name || whiteCfg.model) : (blackCfg.name || blackCfg.model),
          proposedMove,
          reasoning: currentProposal ? currentProposal.reasoning : '',
          candidates: currentProposal ? currentProposal.candidates : [proposedMove],
          arbiterModel: arbiterCfg.name || arbiterCfg.model,
          finalMove,
          grade,
          commentary,
          playerRaw: currentProposal ? currentProposal.rawResponse : null,
          arbiterRaw: rawResponse
        });
      },

      onMoveExecuted: ({ move, fen, history, isGameOver }) => {
        if (move) {
          this.boardUI.setLastMove(move.from, move.to);
        }
        this.boardUI.render();
        this.updateLiveStats();
        this.controlsUI.setTurnInProgress(false);
      },

      onAutoStateChange: ({ isRunning, isPaused }) => {
        this.controlsUI.updateAutoState({ isRunning, isPaused });
        if (isRunning) {
          this.setMatchBadge('in-progress', isPaused ? 'PAUSED' : 'AUTO PLAYING');
        } else {
          this.setMatchBadge('ready', 'READY');
        }
      },

      onGameOver: (details) => {
        this.handleGameOver(details);
      },

      onError: (err) => {
        this.controlsUI.setTurnInProgress(false);
        this.setMatchBadge('ready', 'ERROR');
        console.error('Match error:', err);
      }
    };
  }

  async handleStartAutomation() {
    if (this.engine.isGameOver()) {
      this.handleResetGame();
    }
    const callbacks = this.createTurnCallbacks();
    await this.decisionEngine.startAutomation(callbacks);
  }

  async handlePlayTurn() {
    if (this.engine.isGameOver()) return;
    const callbacks = this.createTurnCallbacks();
    await this.decisionEngine.playSingleTurn(callbacks);
  }

  async handleForceSide(side) {
    if (this.engine.isGameOver()) return;
    if (this.engine.getTurn() !== side) {
      alert(`It is currently ${this.engine.getTurnColorName()}'s turn.`);
      return;
    }
    await this.handlePlayTurn();
  }

  handleUserManualMove(san) {
    const executed = this.engine.makeMove(san);
    if (executed) {
      this.boardUI.setLastMove(executed.from, executed.to);
      this.boardUI.render();
      this.updateLiveStats();

      // Trigger arbiter evaluation on human move
      const turnSlot = executed.color === 'w' ? 'white' : 'black';
      this.arbiterPanelUI.setVerdict({
        slot: turnSlot,
        proposedMove: executed.san,
        finalMove: executed.san,
        grade: 'Manual Play',
        commentary: `Move ${executed.san} played manually by user on the board.`
      });

      if (this.engine.isGameOver()) {
        this.handleGameOver(this.engine.getGameOverDetails());
      }
    }
  }

  handleResetGame() {
    this.decisionEngine.stopAutomation();
    this.engine.reset();
    this.boardUI.setLastMove(null, null);
    this.boardUI.render();
    this.arbiterPanelUI.reset();
    this.historyPanelUI.reset();
    this.updateLiveStats();
    this.setMatchBadge('ready', 'READY');
  }

  handleGameOver(details) {
    this.decisionEngine.stopAutomation();
    this.controlsUI.updateAutoState({ isRunning: false, isPaused: false });
    this.setMatchBadge('ready', 'MATCH CONCLUDED');
    this.playerCardsUI.setGameOver(details);

    // Show Game Over Modal
    const modal = document.getElementById('gameOverModal');
    const titleEl = document.getElementById('gameOverTitle');
    const descEl = document.getElementById('gameOverDesc');
    const trophyEl = document.getElementById('gameOverTrophy');

    if (modal && titleEl && descEl) {
      titleEl.textContent = details.reason === 'Checkmate' ? `Checkmate! ${details.winner} Wins!` : `Draw! (${details.reason})`;
      descEl.textContent = details.description;
      if (trophyEl) {
        trophyEl.innerHTML = details.winner
          ? `<span class="material-symbols-rounded text-warning fs-1">emoji_events</span>`
          : `<span class="material-symbols-rounded text-info fs-1">handshake</span>`;
      }
      modal.classList.remove('hidden');
    }
  }

  handleCopyFen() {
    const fen = this.engine.getFen();
    navigator.clipboard.writeText(fen);
    this.showToast('Current board FEN copied to clipboard!');
  }

  handleExportPgn() {
    const pgn = this.engine.getPgn();
    const blob = new Blob([pgn], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chess_match_${Date.now()}.pgn`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('PGN match notation downloaded!');
  }

  setMatchBadge(type, text) {
    const badge = document.getElementById('matchStatusBadge');
    if (badge) {
      badge.className = `match-status-badge badge-${type}`;
      const label = badge.querySelector('.status-label');
      if (label) label.textContent = text;
    }
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'glass-panel';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      padding: 10px 18px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #38bdf8;
      border-color: rgba(56, 189, 248, 0.4);
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      z-index: 999;
      animation: fadeIn 0.2s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }
}

// Bootstrap Application on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  new ChessArenaApp();
});
