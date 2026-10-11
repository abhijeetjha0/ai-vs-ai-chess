/**
 * Settings Modal UI: Model Selection (White, Black, Decision Model), Ollama & OpenAI Endpoints
 */

export class SettingsModalUI {
  constructor(modelManager, options = {}) {
    this.modelManager = modelManager;
    this.options = options;
    this.isOpen = false;
    this.initDOM();
  }

  initDOM() {
    const modalEl = document.createElement('div');
    modalEl.className = 'modal-backdrop hidden';
    modalEl.id = 'settingsModal';

    const cfg = this.modelManager.config;

    modalEl.innerHTML = `
      <div class="modal-dialog glass-panel">
        <div class="modal-header">
          <div class="modal-title-wrap">
            <span class="material-symbols-rounded modal-icon">settings</span>
            <h3>Arena Model & API Configuration</h3>
          </div>
          <button class="modal-close-btn" id="btnCloseSettings">&times;</button>
        </div>

        <div class="modal-body">
          <!-- SECTION 1: MODEL SLOTS -->
          <div class="settings-section">
            <h4 class="section-title"><span class="material-symbols-rounded icon">crown</span> Model Matchup Selection</h4>

            <div class="slots-grid">
              <!-- WHITE MODEL SLOT -->
              <div class="slot-card slot-white">
                <div class="slot-header">
                  <span class="slot-color-dot white-dot"></span>
                  <strong>White Player (Slot 1)</strong>
                </div>
                <div class="form-group">
                  <label>Provider</label>
                  <select class="form-select" id="whiteProvider">
                    <option value="mock" ${cfg.white.provider === 'mock' ? 'selected' : ''}>Mock AI Personas</option>
                    <option value="ollama" ${cfg.white.provider === 'ollama' ? 'selected' : ''}>Ollama Local</option>
                    <option value="openai" ${cfg.white.provider === 'openai' ? 'selected' : ''}>OpenAI Compatible</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Model</label>
                  <select class="form-select" id="whiteModelSelect"></select>
                  <input type="text" class="form-input hidden" id="whiteCustomModel" placeholder="Enter model name..." />
                </div>
                <div class="form-group">
                  <label>Temperature: <span id="whiteTempLabel">${cfg.white.temperature || 0.7}</span></label>
                  <input type="range" class="form-range" id="whiteTempRange" min="0" max="1.5" step="0.1" value="${cfg.white.temperature || 0.7}" />
                </div>
              </div>

              <!-- BLACK MODEL SLOT -->
              <div class="slot-card slot-black">
                <div class="slot-header">
                  <span class="slot-color-dot black-dot"></span>
                  <strong>Black Player (Slot 2)</strong>
                </div>
                <div class="form-group">
                  <label>Provider</label>
                  <select class="form-select" id="blackProvider">
                    <option value="mock" ${cfg.black.provider === 'mock' ? 'selected' : ''}>Mock AI Personas</option>
                    <option value="ollama" ${cfg.black.provider === 'ollama' ? 'selected' : ''}>Ollama Local</option>
                    <option value="openai" ${cfg.black.provider === 'openai' ? 'selected' : ''}>OpenAI Compatible</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Model</label>
                  <select class="form-select" id="blackModelSelect"></select>
                  <input type="text" class="form-input hidden" id="blackCustomModel" placeholder="Enter model name..." />
                </div>
                <div class="form-group">
                  <label>Temperature: <span id="blackTempLabel">${cfg.black.temperature || 0.7}</span></label>
                  <input type="range" class="form-range" id="blackTempRange" min="0" max="1.5" step="0.1" value="${cfg.black.temperature || 0.7}" />
                </div>
              </div>

              <!-- MIDDLE DECISION MODEL SLOT -->
              <div class="slot-card slot-arbiter">
                <div class="slot-header">
                  <span class="slot-color-dot arbiter-dot"></span>
                  <strong>Middle Decision Model (Slot 3)</strong>
                </div>
                <div class="form-group">
                  <label>Provider</label>
                  <select class="form-select" id="arbiterProvider">
                    <option value="mock" ${cfg.arbiter.provider === 'mock' ? 'selected' : ''}>Mock AI Arbiter</option>
                    <option value="ollama" ${cfg.arbiter.provider === 'ollama' ? 'selected' : ''}>Ollama Local</option>
                    <option value="openai" ${cfg.arbiter.provider === 'openai' ? 'selected' : ''}>OpenAI Compatible</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Model</label>
                  <select class="form-select" id="arbiterModelSelect"></select>
                  <input type="text" class="form-input hidden" id="arbiterCustomModel" placeholder="Enter model name..." />
                </div>
                <div class="form-group">
                  <label>Decision Role</label>
                  <select class="form-select" id="arbiterRoleSelect">
                    <option value="adjudicator" ${cfg.arbiter.roleMode === 'adjudicator' ? 'selected' : ''}>Chief Arbiter & Adjudicator</option>
                    <option value="captain" ${cfg.arbiter.roleMode === 'captain' ? 'selected' : ''}>Strategic Captain (Picks Candidates)</option>
                    <option value="failsafe" ${cfg.arbiter.roleMode === 'failsafe' ? 'selected' : ''}>Failsafe Sanity Validator</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- SECTION 2: ENDPOINT & PROVIDER CREDENTIALS -->
          <div class="settings-section">
            <h4 class="section-title"><span class="material-symbols-rounded icon">settings_ethernet</span> API Endpoints & Authentication</h4>

            <div class="endpoints-grid">
              <!-- OLLAMA CONFIG -->
              <div class="endpoint-card">
                <div class="endpoint-title">
                  <strong>Ollama Local API</strong>
                  <span class="endpoint-hint">Runs locally on your machine</span>
                </div>
                <div class="form-group">
                  <label>Host URL</label>
                  <div class="input-with-button">
                    <input type="text" class="form-input" id="ollamaHostInput" value="${cfg.ollamaBaseUrl}" placeholder="http://localhost:11434" />
                    <button class="btn btn-secondary btn-sm" id="btnTestOllama">
                      <span class="material-symbols-rounded icon">refresh</span> Fetch Models
                    </button>
                  </div>
                </div>
                <div class="endpoint-status-text" id="ollamaStatusMsg"></div>
                <div class="cors-tip">
                  Tip: If browser blocks local requests, run Ollama with: <code>OLLAMA_ORIGINS="*" ollama serve</code>
                </div>
              </div>

              <!-- OPENAI COMPATIBLE CONFIG -->
              <div class="endpoint-card">
                <div class="endpoint-title">
                  <strong>OpenAI / OpenAPI Compatible</strong>
                  <span class="endpoint-hint">OpenAI, OpenRouter, Groq, LM Studio</span>
                </div>
                <div class="form-group">
                  <label>Base URL</label>
                  <input type="text" class="form-input" id="openaiBaseUrlInput" value="${cfg.openaiBaseUrl}" placeholder="https://api.openai.com/v1" />
                </div>
                <div class="form-group">
                  <label>API Key</label>
                  <input type="password" class="form-input" id="openaiApiKeyInput" value="${cfg.openaiApiKey}" placeholder="sk-..." />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" id="btnResetDefaults">Reset Defaults</button>
          <button class="btn btn-primary btn-glow" id="btnSaveSettings">Save & Apply</button>
        </div>
      </div>
    `;

    document.body.appendChild(modalEl);
    this.modalEl = modalEl;

    this.bindEvents();
    this.refreshAllModelDropdowns();
  }

  bindEvents() {
    this.modalEl.querySelector('#btnCloseSettings').addEventListener('click', () => this.close());
    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) this.close();
    });

    // Provider changes
    ['white', 'black', 'arbiter'].forEach(slot => {
      const provEl = this.modalEl.querySelector(`#${slot}Provider`);
      provEl.addEventListener('change', () => {
        this.populateModelDropdown(slot, provEl.value);
      });

      // Temp sliders
      const tempRange = this.modalEl.querySelector(`#${slot}TempRange`);
      const tempLabel = this.modalEl.querySelector(`#${slot}TempLabel`);
      if (tempRange && tempLabel) {
        tempRange.addEventListener('input', (e) => {
          tempLabel.textContent = e.target.value;
        });
      }
    });

    // Ollama test button
    const btnTest = this.modalEl.querySelector('#btnTestOllama');
    const ollamaStatus = this.modalEl.querySelector('#ollamaStatusMsg');
    btnTest.addEventListener('click', async () => {
      const host = this.modalEl.querySelector('#ollamaHostInput').value;
      ollamaStatus.textContent = 'Connecting to Ollama...';
      ollamaStatus.className = 'endpoint-status-text info';
      btnTest.disabled = true;

      const res = await this.modelManager.fetchOllamaModels(host);
      btnTest.disabled = false;

      if (res.success) {
        ollamaStatus.textContent = `✓ Successfully found ${res.models.length} local model(s)!`;
        ollamaStatus.className = 'endpoint-status-text success';
        this.refreshAllModelDropdowns();
      } else {
        ollamaStatus.textContent = `✗ ${res.error}`;
        ollamaStatus.className = 'endpoint-status-text error';
      }
    });

    // Save button
    this.modalEl.querySelector('#btnSaveSettings').addEventListener('click', () => {
      this.saveFromInputs();
      this.close();
      if (this.options.onSaved) this.options.onSaved();
    });

    // Reset defaults button
    this.modalEl.querySelector('#btnResetDefaults').addEventListener('click', () => {
      this.modelManager.saveConfig(this.modelManager.getDefaultConfig());
      this.close();
      if (this.options.onSaved) this.options.onSaved();
    });
  }

  populateModelDropdown(slot, provider) {
    const selectEl = this.modalEl.querySelector(`#${slot}ModelSelect`);
    const isArbiter = slot === 'arbiter';
    const models = isArbiter ? this.modelManager.getAvailableArbiters(provider) : this.modelManager.getAvailableModels(provider);

    selectEl.innerHTML = '';
    models.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = m.name || m.id;
      selectEl.appendChild(opt);
    });

    // Add option for custom model
    if (provider !== 'mock') {
      const customOpt = document.createElement('option');
      customOpt.value = '__custom__';
      customOpt.textContent = '+ Custom Model Name...';
      selectEl.appendChild(customOpt);
    }

    // Set currently saved model if matches
    const currentModel = this.modelManager.config[slot].model;
    if (models.some(m => m.id === currentModel)) {
      selectEl.value = currentModel;
    }
  }

  refreshAllModelDropdowns() {
    ['white', 'black', 'arbiter'].forEach(slot => {
      const prov = this.modalEl.querySelector(`#${slot}Provider`).value;
      this.populateModelDropdown(slot, prov);
    });
  }

  saveFromInputs() {
    const whiteProv = this.modalEl.querySelector('#whiteProvider').value;
    const whiteModel = this.modalEl.querySelector('#whiteModelSelect').value;
    const whiteTemp = parseFloat(this.modalEl.querySelector('#whiteTempRange')?.value || 0.7);

    const blackProv = this.modalEl.querySelector('#blackProvider').value;
    const blackModel = this.modalEl.querySelector('#blackModelSelect').value;
    const blackTemp = parseFloat(this.modalEl.querySelector('#blackTempRange')?.value || 0.7);

    const arbiterProv = this.modalEl.querySelector('#arbiterProvider').value;
    const arbiterModel = this.modalEl.querySelector('#arbiterModelSelect').value;
    const arbiterRole = this.modalEl.querySelector('#arbiterRoleSelect').value;

    const ollamaUrl = this.modalEl.querySelector('#ollamaHostInput').value;
    const openaiUrl = this.modalEl.querySelector('#openaiBaseUrlInput').value;
    const openaiKey = this.modalEl.querySelector('#openaiApiKeyInput').value;

    const getDisplayName = (slot, prov, id) => {
      const list = slot === 'arbiter' ? this.modelManager.getAvailableArbiters(prov) : this.modelManager.getAvailableModels(prov);
      const found = list.find(m => m.id === id);
      return found ? found.name : id;
    };

    const newConfig = {
      ollamaBaseUrl: ollamaUrl,
      openaiBaseUrl: openaiUrl,
      openaiApiKey: openaiKey,
      white: {
        provider: whiteProv,
        model: whiteModel,
        name: getDisplayName('white', whiteProv, whiteModel),
        temperature: whiteTemp
      },
      black: {
        provider: blackProv,
        model: blackModel,
        name: getDisplayName('black', blackProv, blackModel),
        temperature: blackTemp
      },
      arbiter: {
        provider: arbiterProv,
        model: arbiterModel,
        name: getDisplayName('arbiter', arbiterProv, arbiterModel),
        roleMode: arbiterRole,
        temperature: 0.4
      }
    };

    this.modelManager.saveConfig(newConfig);
  }

  open() {
    this.refreshAllModelDropdowns();
    this.modalEl.classList.remove('hidden');
    this.isOpen = true;
  }

  close() {
    this.modalEl.classList.add('hidden');
    this.isOpen = false;
  }
}
