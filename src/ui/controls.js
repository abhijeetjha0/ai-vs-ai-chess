/**
 * Control Panel UI Component: Auto & Manual Controls, Speed Slider, and Board Actions
 */

export class ControlsUI {
  constructor(containerEl, decisionEngine, options = {}) {
    this.container = containerEl;
    this.engine = decisionEngine;
    this.options = options;
    this.mode = 'auto'; // 'auto' | 'manual'
    this.initDOM();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="controls-card glass-panel">
        <div class="controls-mode-toggle">
          <button class="mode-btn active" id="btnModeAuto" title="Automated turn-by-turn match">
            <span class="material-symbols-rounded icon">smart_toy</span> Automated Mode
          </button>
          <button class="mode-btn" id="btnModeManual" title="Step-by-step turn execution">
            <span class="material-symbols-rounded icon">touch_app</span> Manual Mode
          </button>
        </div>

        <div class="controls-action-row" id="autoControlsGroup">
          <button class="btn btn-primary btn-glow" id="btnStartAuto">
            <span class="material-symbols-rounded btn-icon">play_arrow</span>
            <span class="btn-text">Start Match</span>
          </button>
          <button class="btn btn-secondary" id="btnPauseAuto" disabled>
            <span class="material-symbols-rounded btn-icon">pause</span>
            <span class="btn-text">Pause</span>
          </button>
          <button class="btn btn-danger" id="btnStopAuto" disabled>
            <span class="material-symbols-rounded btn-icon">stop</span>
            <span class="btn-text">Stop</span>
          </button>
        </div>

        <div class="controls-action-row hidden" id="manualControlsGroup">
          <button class="btn btn-primary btn-glow" id="btnPlayTurn">
            <span class="material-symbols-rounded btn-icon">casino</span>
            <span class="btn-text">Play Next Turn</span>
          </button>
          <button class="btn btn-secondary" id="btnForceWhite">
            <span class="material-symbols-rounded btn-icon">circle</span> White Move
          </button>
          <button class="btn btn-secondary" id="btnForceBlack">
            <span class="material-symbols-rounded btn-icon">circle</span> Black Move
          </button>
        </div>

        <div class="speed-slider-container">
          <div class="speed-header">
            <span class="speed-label"><span class="material-symbols-rounded icon">timer</span> Auto Turn Interval:</span>
            <span class="speed-value" id="speedDisplay">2.0s</span>
          </div>
          <input type="range" class="speed-slider" id="speedRange" min="500" max="8000" step="250" value="2000" />
        </div>

        <div class="secondary-actions-row">
          <button class="btn-chip" id="btnResetGame" title="Start a fresh match">
            <span class="material-symbols-rounded chip-icon">restart_alt</span> Reset Match
          </button>
          <button class="btn-chip" id="btnFlipBoard" title="Flip board view">
            <span class="material-symbols-rounded chip-icon">swap_vert</span> Flip Board
          </button>
          <button class="btn-chip" id="btnToggleSound" title="Toggle move sounds">
            <span class="material-symbols-rounded chip-icon" id="soundIcon">volume_up</span> Sound: ON
          </button>
          <button class="btn-chip" id="btnCopyFen" title="Copy current FEN">
            <span class="material-symbols-rounded chip-icon">content_copy</span> Copy FEN
          </button>
          <button class="btn-chip" id="btnExportPgn" title="Download PGN notation">
            <span class="material-symbols-rounded chip-icon">download</span> Export PGN
          </button>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const btnModeAuto = this.container.querySelector('#btnModeAuto');
    const btnModeManual = this.container.querySelector('#btnModeManual');
    const autoGroup = this.container.querySelector('#autoControlsGroup');
    const manualGroup = this.container.querySelector('#manualControlsGroup');

    btnModeAuto.addEventListener('click', () => {
      this.mode = 'auto';
      btnModeAuto.classList.add('active');
      btnModeManual.classList.remove('active');
      autoGroup.classList.remove('hidden');
      manualGroup.classList.add('hidden');
      if (this.options.onModeChange) this.options.onModeChange('auto');
    });

    btnModeManual.addEventListener('click', () => {
      this.mode = 'manual';
      btnModeManual.classList.add('active');
      btnModeAuto.classList.remove('active');
      manualGroup.classList.remove('hidden');
      autoGroup.classList.add('hidden');
      // If automation was running, pause it
      if (this.engine.isRunning) {
        this.engine.pauseAutomation();
      }
      if (this.options.onModeChange) this.options.onModeChange('manual');
    });

    // Speed slider
    const speedRange = this.container.querySelector('#speedRange');
    const speedDisplay = this.container.querySelector('#speedDisplay');
    speedRange.addEventListener('input', (e) => {
      const ms = parseInt(e.target.value, 10);
      speedDisplay.textContent = `${(ms / 1000).toFixed(1)}s`;
      this.engine.setSpeed(ms);
    });

    // Auto buttons
    const btnStart = this.container.querySelector('#btnStartAuto');
    const btnPause = this.container.querySelector('#btnPauseAuto');
    const btnStop = this.container.querySelector('#btnStopAuto');

    btnStart.addEventListener('click', () => {
      if (this.options.onStartAuto) this.options.onStartAuto();
    });

    btnPause.addEventListener('click', () => {
      if (this.engine.isPaused) {
        this.engine.resumeAutomation();
      } else {
        this.engine.pauseAutomation();
      }
    });

    btnStop.addEventListener('click', () => {
      this.engine.stopAutomation();
    });

    // Manual buttons
    const btnPlayTurn = this.container.querySelector('#btnPlayTurn');
    btnPlayTurn.addEventListener('click', () => {
      if (this.options.onPlayTurn) this.options.onPlayTurn();
    });

    const btnForceWhite = this.container.querySelector('#btnForceWhite');
    btnForceWhite.addEventListener('click', () => {
      if (this.options.onForceSide) this.options.onForceSide('w');
    });

    const btnForceBlack = this.container.querySelector('#btnForceBlack');
    btnForceBlack.addEventListener('click', () => {
      if (this.options.onForceSide) this.options.onForceSide('b');
    });

    // Secondary actions
    this.container.querySelector('#btnResetGame').addEventListener('click', () => {
      if (this.options.onReset) this.options.onReset();
    });

    this.container.querySelector('#btnFlipBoard').addEventListener('click', () => {
      if (this.options.onFlip) this.options.onFlip();
    });

    const btnToggleSound = this.container.querySelector('#btnToggleSound');
    const soundIcon = this.container.querySelector('#soundIcon');
    btnToggleSound.addEventListener('click', () => {
      if (this.options.onToggleSound) {
        const isMuted = this.options.onToggleSound();
        const iconName = isMuted ? 'volume_off' : 'volume_up';
        soundIcon.textContent = iconName;
        btnToggleSound.innerHTML = `<span class="material-symbols-rounded chip-icon">${iconName}</span> Sound: ${isMuted ? 'OFF' : 'ON'}`;
      }
    });

    this.container.querySelector('#btnCopyFen').addEventListener('click', () => {
      if (this.options.onCopyFen) this.options.onCopyFen();
    });

    this.container.querySelector('#btnExportPgn').addEventListener('click', () => {
      if (this.options.onExportPgn) this.options.onExportPgn();
    });
  }

  updateAutoState({ isRunning, isPaused }) {
    const btnStart = this.container.querySelector('#btnStartAuto');
    const btnPause = this.container.querySelector('#btnPauseAuto');
    const btnStop = this.container.querySelector('#btnStopAuto');
    const btnPlayTurn = this.container.querySelector('#btnPlayTurn');

    if (!btnStart) return;

    if (isRunning) {
      btnStart.disabled = true;
      btnStop.disabled = false;
      btnPause.disabled = false;
      btnPause.innerHTML = isPaused ? '<span class="material-symbols-rounded btn-icon">play_arrow</span> Resume' : '<span class="material-symbols-rounded btn-icon">pause</span> Pause';
      if (btnPlayTurn) btnPlayTurn.disabled = true;
    } else {
      btnStart.disabled = false;
      btnPause.disabled = true;
      btnStop.disabled = true;
      btnPause.innerHTML = '<span class="material-symbols-rounded btn-icon">pause</span> Pause';
      if (btnPlayTurn) btnPlayTurn.disabled = false;
    }
  }

  setTurnInProgress(inProgress) {
    const btnPlayTurn = this.container.querySelector('#btnPlayTurn');
    if (btnPlayTurn) {
      btnPlayTurn.disabled = inProgress;
      if (inProgress) {
        btnPlayTurn.innerHTML = '<span class="material-symbols-rounded btn-icon spin">refresh</span> Thinking...';
      } else {
        btnPlayTurn.innerHTML = '<span class="material-symbols-rounded btn-icon">casino</span> Play Next Turn';
      }
    }
  }
}
