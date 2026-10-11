/**
 * Arbiter Lounge UI: Displays Middle Decision Model Adjudication, Move Grades, and Grandmaster Commentary
 */

export class ArbiterPanelUI {
  constructor(containerEl, modelManager) {
    this.container = containerEl;
    this.modelManager = modelManager;
    this.initDOM();
  }

  initDOM() {
    const config = this.modelManager.config.arbiter;
    this.container.innerHTML = `
      <div class="arbiter-card glass-panel">
        <div class="arbiter-header">
          <div class="arbiter-identity">
            <span class="arbiter-badge-icon">⚖️</span>
            <div>
              <div class="arbiter-title">Middle Decision Model</div>
              <div class="arbiter-name" id="arbiterModelName">${config.name || config.model}</div>
            </div>
          </div>
          <div class="arbiter-status-pill standby" id="arbiterStatus">STANDBY</div>
        </div>

        <div class="arbiter-role-bar">
          <span class="role-label">Decision Role:</span>
          <span class="role-value" id="arbiterRoleMode">${this.getRoleLabel(config.roleMode)}</span>
        </div>

        <div class="arbiter-adjudication-box" id="adjudicationBox">
          <div class="adjudication-empty">
            <span class="empty-icon">🛡️</span>
            <span>Awaiting first move proposal to adjudicate...</span>
          </div>
        </div>

        <div class="arbiter-metrics-row hidden" id="arbiterMetricsRow">
          <div class="metric-item">
            <span class="metric-label">Move Grade:</span>
            <span class="grade-badge" id="arbiterGradeBadge">-</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Approved Move:</span>
            <span class="final-move-badge" id="arbiterFinalMoveBadge">-</span>
          </div>
        </div>

        <div class="arbiter-commentary-box hidden" id="arbiterCommentaryBox">
          <div class="commentary-header">
            <span class="quote-icon">❝</span>
            <span class="commentary-title">Grandmaster Adjudication</span>
          </div>
          <div class="commentary-text" id="arbiterCommentaryText"></div>
        </div>
      </div>
    `;
  }

  getRoleLabel(mode) {
    switch (mode) {
      case 'captain': return 'Strategic Captain (Multi-Candidate Pick)';
      case 'failsafe': return 'Failsafe Sanity Validator';
      default: return 'Chief Arbiter & Adjudicator';
    }
  }

  updateConfig() {
    const config = this.modelManager.config.arbiter;
    const nameEl = document.getElementById('arbiterModelName');
    const roleEl = document.getElementById('arbiterRoleMode');
    if (nameEl) nameEl.textContent = config.name || config.model;
    if (roleEl) roleEl.textContent = this.getRoleLabel(config.roleMode);
  }

  setEvaluating(proposedMove, playerReasoning, candidates = []) {
    const statusEl = document.getElementById('arbiterStatus');
    const emptyBox = document.getElementById('adjudicationBox');
    const metricsRow = document.getElementById('arbiterMetricsRow');
    const commentaryBox = document.getElementById('arbiterCommentaryBox');

    if (statusEl) {
      statusEl.className = 'arbiter-status-pill evaluating';
      statusEl.textContent = 'EVALUATING...';
    }

    if (emptyBox) {
      emptyBox.innerHTML = `
        <div class="evaluating-state">
          <div class="evaluating-spinner"></div>
          <div class="evaluating-details">
            <div class="eval-proposed">Evaluating proposal: <strong class="glow-text">${proposedMove}</strong></div>
            <div class="eval-reasoning">${playerReasoning || 'Analyzing tactical options...'}</div>
            ${candidates.length > 1 ? `<div class="eval-candidates">Candidates considered: ${candidates.join(', ')}</div>` : ''}
          </div>
        </div>
      `;
    }

    metricsRow?.classList.add('hidden');
    commentaryBox?.classList.add('hidden');
  }

  setVerdict({ slot, proposedMove, finalMove, grade, commentary }) {
    const statusEl = document.getElementById('arbiterStatus');
    const emptyBox = document.getElementById('adjudicationBox');
    const metricsRow = document.getElementById('arbiterMetricsRow');
    const commentaryBox = document.getElementById('arbiterCommentaryBox');
    const gradeBadge = document.getElementById('arbiterGradeBadge');
    const finalMoveBadge = document.getElementById('arbiterFinalMoveBadge');
    const commentaryText = document.getElementById('arbiterCommentaryText');

    if (statusEl) {
      statusEl.className = 'arbiter-status-pill approved';
      statusEl.textContent = 'VERDICT DELIVERED';
    }

    if (emptyBox) {
      emptyBox.innerHTML = '';
      emptyBox.style.display = 'none';
    }

    if (metricsRow) {
      metricsRow.classList.remove('hidden');
      if (gradeBadge) {
        gradeBadge.textContent = grade;
        gradeBadge.className = `grade-badge ${this.getGradeClass(grade)}`;
      }
      if (finalMoveBadge) {
        finalMoveBadge.textContent = finalMove;
      }
    }

    if (commentaryBox && commentaryText) {
      commentaryBox.classList.remove('hidden');
      commentaryText.textContent = commentary;
    }
  }

  getGradeClass(grade = '') {
    if (grade.includes('Brilliant')) return 'grade-brilliant';
    if (grade.includes('Best')) return 'grade-best';
    if (grade.includes('Good') || grade.includes('Strong')) return 'grade-good';
    if (grade.includes('Inaccuracy')) return 'grade-inaccuracy';
    if (grade.includes('Blunder')) return 'grade-blunder';
    return 'grade-solid';
  }

  reset() {
    const statusEl = document.getElementById('arbiterStatus');
    const emptyBox = document.getElementById('adjudicationBox');
    const metricsRow = document.getElementById('arbiterMetricsRow');
    const commentaryBox = document.getElementById('arbiterCommentaryBox');

    if (statusEl) {
      statusEl.className = 'arbiter-status-pill standby';
      statusEl.textContent = 'STANDBY';
    }

    if (emptyBox) {
      emptyBox.style.display = 'block';
      emptyBox.innerHTML = `
        <div class="adjudication-empty">
          <span class="empty-icon">🛡️</span>
          <span>Awaiting first move proposal to adjudicate...</span>
        </div>
      `;
    }

    metricsRow?.classList.add('hidden');
    commentaryBox?.classList.add('hidden');
  }
}
