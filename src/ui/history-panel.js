/**
 * History & AI Thought Inspector UI
 * Tabs: Move List (PGN notation), AI Thought Stream (Reasoning & Raw Prompts), and PGN Exporter
 */

export class HistoryPanelUI {
  constructor(containerEl, engine, options = {}) {
    this.container = containerEl;
    this.engine = engine;
    this.options = options;
    this.activeTab = 'moves'; // 'moves' | 'thoughts' | 'pgn'
    this.thoughtEntries = [];
    this.initDOM();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="history-card glass-panel">
        <div class="history-tabs-header">
          <button class="tab-btn active" data-tab="moves" id="tabMovesBtn">
            <span class="material-symbols-rounded icon">list_alt</span> Moves
          </button>
          <button class="tab-btn" data-tab="thoughts" id="tabThoughtsBtn">
            <span class="material-symbols-rounded icon">psychology</span> AI Thought Stream
            <span class="count-badge hidden" id="thoughtCountBadge">0</span>
          </button>
          <button class="tab-btn" data-tab="pgn" id="tabPgnBtn">
            <span class="material-symbols-rounded icon">content_copy</span> PGN & FEN
          </button>
        </div>

        <div class="tab-content" id="tabContentMoves">
          <div class="moves-table-container">
            <table class="moves-table">
              <thead>
                <tr>
                  <th class="th-num">#</th>
                  <th class="th-white">White</th>
                  <th class="th-black">Black</th>
                </tr>
              </thead>
              <tbody id="movesTableBody">
                <tr class="empty-row"><td colspan="3">No moves yet. Start match to begin!</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="tab-content hidden" id="tabContentThoughts">
          <div class="thoughts-stream-container" id="thoughtsStreamContainer">
            <div class="thoughts-empty">
              <span class="material-symbols-rounded empty-icon">psychology</span>
              <span>Model prompts, tactical thoughts, and arbiter reasoning will appear here live during play.</span>
            </div>
          </div>
        </div>

        <div class="tab-content hidden" id="tabContentPgn">
          <div class="pgn-fen-container">
            <div class="code-section">
              <div class="code-header">
                <span>Current FEN</span>
                <button class="btn-copy-small" id="btnCopyFenSmall">Copy</button>
              </div>
              <textarea class="code-textarea" id="fenTextarea" readonly></textarea>
            </div>
            <div class="code-section">
              <div class="code-header">
                <span>PGN Notation</span>
                <button class="btn-copy-small" id="btnCopyPgnSmall">Copy</button>
              </div>
              <textarea class="code-textarea" id="pgnTextarea" readonly></textarea>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const tabs = this.container.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        this.switchTab(targetTab);
      });
    });

    const copyFenBtn = this.container.querySelector('#btnCopyFenSmall');
    copyFenBtn?.addEventListener('click', () => {
      const fenText = this.container.querySelector('#fenTextarea').value;
      navigator.clipboard.writeText(fenText);
      copyFenBtn.textContent = 'Copied!';
      setTimeout(() => copyFenBtn.textContent = 'Copy', 1500);
    });

    const copyPgnBtn = this.container.querySelector('#btnCopyPgnSmall');
    copyPgnBtn?.addEventListener('click', () => {
      const pgnText = this.container.querySelector('#pgnTextarea').value;
      navigator.clipboard.writeText(pgnText);
      copyPgnBtn.textContent = 'Copied!';
      setTimeout(() => copyPgnBtn.textContent = 'Copy', 1500);
    });
  }

  switchTab(tabId) {
    this.activeTab = tabId;
    this.container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    this.container.querySelector('#tabContentMoves').classList.toggle('hidden', tabId !== 'moves');
    this.container.querySelector('#tabContentThoughts').classList.toggle('hidden', tabId !== 'thoughts');
    this.container.querySelector('#tabContentPgn').classList.toggle('hidden', tabId !== 'pgn');

    if (tabId === 'pgn') {
      this.updatePgnFenTab();
    }
  }

  updateMovesTable(historySan = []) {
    const tbody = this.container.querySelector('#movesTableBody');
    if (!tbody) return;

    if (historySan.length === 0) {
      tbody.innerHTML = '<tr class="empty-row"><td colspan="3">No moves yet. Start match to begin!</td></tr>';
      return;
    }

    const rows = [];
    for (let i = 0; i < historySan.length; i += 2) {
      const moveNum = Math.floor(i / 2) + 1;
      const whiteMove = historySan[i] || '';
      const blackMove = historySan[i + 1] || '';
      const isLatestRow = (i + 2 >= historySan.length);

      rows.push(`
        <tr class="${isLatestRow ? 'latest-row' : ''}">
          <td class="td-num">${moveNum}.</td>
          <td class="td-san td-white ${i === historySan.length - 1 ? 'latest-san' : ''}">${whiteMove}</td>
          <td class="td-san td-black ${i + 1 === historySan.length - 1 ? 'latest-san' : ''}">${blackMove}</td>
        </tr>
      `);
    }

    tbody.innerHTML = rows.join('');

    // Scroll to bottom
    const container = this.container.querySelector('.moves-table-container');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }

    this.updatePgnFenTab();
  }

  addThoughtEntry({
    turnNumber,
    playerSlot,
    modelName,
    proposedMove,
    reasoning,
    candidates,
    arbiterModel,
    finalMove,
    grade,
    commentary,
    playerRaw,
    arbiterRaw
  }) {
    this.thoughtEntries.push({
      turnNumber,
      playerSlot,
      modelName,
      proposedMove,
      reasoning,
      candidates,
      arbiterModel,
      finalMove,
      grade,
      commentary,
      playerRaw,
      arbiterRaw,
      timestamp: new Date().toLocaleTimeString()
    });

    // Update count badge
    const badge = this.container.querySelector('#thoughtCountBadge');
    if (badge) {
      badge.textContent = this.thoughtEntries.length;
      badge.classList.remove('hidden');
    }

    const container = this.container.querySelector('#thoughtsStreamContainer');
    if (!container) return;

    // Clear empty placeholder
    const emptyEl = container.querySelector('.thoughts-empty');
    if (emptyEl) emptyEl.remove();

    const isWhite = playerSlot === 'white';
    const entryEl = document.createElement('div');
    entryEl.className = `thought-stream-card ${isWhite ? 'stream-white' : 'stream-black'}`;

    entryEl.innerHTML = `
      <div class="stream-card-header">
        <span class="stream-turn-tag"><span class="material-symbols-rounded" style="font-size:12px;vertical-align:middle;">circle</span> ${isWhite ? 'White' : 'Black'} Turn ${turnNumber}</span>
        <span class="stream-model-name">${modelName}</span>
        <span class="stream-timestamp">${new Date().toLocaleTimeString()}</span>
      </div>

      <div class="stream-proposal-row">
        <div class="stream-move-badge">${proposedMove}</div>
        <div class="stream-reasoning-text">${reasoning}</div>
      </div>

      ${candidates && candidates.length > 1 ? `
        <div class="stream-candidates-row">
          <span class="candidates-label">Candidates Considered:</span>
          <span class="candidates-list">${candidates.map(c => `<code>${c}</code>`).join(' ')}</span>
        </div>
      ` : ''}

      <div class="stream-arbiter-verdict-box">
        <div class="stream-arbiter-header">
          <span class="material-symbols-rounded arbiter-mini-icon">balance</span>
          <span class="arbiter-title-text">${arbiterModel || 'Middle Decision Model'}</span>
          <span class="stream-grade-badge">${grade || 'Approved'}</span>
        </div>
        <div class="stream-arbiter-commentary">"${commentary}"</div>
      </div>

      ${(playerRaw || arbiterRaw) ? `
        <details class="stream-raw-details">
          <summary>Inspect Raw LLM Output</summary>
          ${playerRaw ? `<div class="raw-block"><strong>Player Response:</strong><pre>${playerRaw}</pre></div>` : ''}
          ${arbiterRaw ? `<div class="raw-block"><strong>Arbiter Response:</strong><pre>${arbiterRaw}</pre></div>` : ''}
        </details>
      ` : ''}
    `;

    container.appendChild(entryEl);
    container.scrollTop = container.scrollHeight;
  }

  updatePgnFenTab() {
    const fenTextarea = this.container.querySelector('#fenTextarea');
    const pgnTextarea = this.container.querySelector('#pgnTextarea');
    if (fenTextarea) fenTextarea.value = this.engine.getFen();
    if (pgnTextarea) pgnTextarea.value = this.engine.getPgn() || 'No moves yet.';
  }

  reset() {
    this.thoughtEntries = [];
    const tbody = this.container.querySelector('#movesTableBody');
    if (tbody) tbody.innerHTML = '<tr class="empty-row"><td colspan="3">No moves yet. Start match to begin!</td></tr>';

    const container = this.container.querySelector('#thoughtsStreamContainer');
    if (container) {
      container.innerHTML = `
        <div class="thoughts-empty">
          <span class="material-symbols-rounded empty-icon">psychology</span>
          <span>Model prompts, tactical thoughts, and arbiter reasoning will appear here live during play.</span>
        </div>
      `;
    }

    const badge = this.container.querySelector('#thoughtCountBadge');
    if (badge) badge.classList.add('hidden');

    this.updatePgnFenTab();
  }
}
