import React from 'react';
import { Form, Button, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';

export default function ModelSelectorBar({
  config,
  chatModels = [],
  decisionModels = [],
  onConfigChange,
  onRefreshModels,
  isRefreshing,
  ollamaConnected,
  onOpenApiDrawer,
  isRunning,
  isPaused
}) {
  const provider = config.provider;
  const hasDecisionModels = decisionModels && decisionModels.length > 0;

  return (
    <div className="top-selector-container d-flex align-items-center justify-content-between flex-grow-1 ms-3 gap-3 flex-wrap">
      {/* COMPACT MATCHUP GROUP */}
      <div className="top-matchup-group d-flex align-items-center gap-2 flex-wrap">
        {/* WHITE MODEL */}
        <div className="compact-player-pill pill-white d-flex align-items-center" title="White Player Model">
          <span className="dot white-dot me-1" />
          <span className="compact-pill-label me-1">White</span>
          <Form.Select
            id="selectWhite"
            size="sm"
            className="compact-select"
            value={config.whiteModel || ''}
            onChange={(e) => onConfigChange({ whiteModel: e.target.value })}
            disabled={chatModels.length === 0}
            title={config.whiteModel}
          >
            {chatModels.length === 0 ? (
              <option value="">No models</option>
            ) : (
              chatModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))
            )}
          </Form.Select>
        </div>

        {/* VS SEPARATOR */}
        <Badge bg="dark" className="compact-vs-badge border border-secondary border-opacity-50 px-2 py-1">
          VS
        </Badge>

        {/* BLACK MODEL */}
        <div className="compact-player-pill pill-black d-flex align-items-center" title="Black Player Model">
          <span className="dot black-dot me-1" />
          <span className="compact-pill-label me-1">Black</span>
          <Form.Select
            id="selectBlack"
            size="sm"
            className="compact-select"
            value={config.blackModel || ''}
            onChange={(e) => onConfigChange({ blackModel: e.target.value })}
            disabled={chatModels.length === 0}
            title={config.blackModel}
          >
            {chatModels.length === 0 ? (
              <option value="">No models</option>
            ) : (
              chatModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))
            )}
          </Form.Select>
        </div>

        {/* ARBITER MODEL (IF PRESENT) */}
        {hasDecisionModels && (
          <div className="compact-player-pill pill-arbiter d-flex align-items-center" title="Decision Model">
            <span className="dot arbiter-dot me-1" />
            <span className="compact-pill-label me-1">Decision</span>
            <Form.Select
              id="selectArbiter"
              size="sm"
              className="compact-select"
              value={config.arbiterModel || ''}
              onChange={(e) => onConfigChange({ arbiterModel: e.target.value })}
              title={config.arbiterModel}
            >
              {decisionModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Form.Select>
          </div>
        )}
      </div>

      {/* RIGHT CONTROLS: PROVIDER + STATUS + SETTINGS */}
      <div className="top-actions-group d-flex align-items-center gap-2 ms-auto">
        {/* PROVIDER INDICATOR */}
        <div className="compact-provider-pill d-flex align-items-center gap-1 px-2 py-1 rounded-pill">
          <span className={`status-dot ${ollamaConnected ? 'connected' : 'offline'}`} />
          <span className="provider-name small text-light text-opacity-90">
            {provider === 'ollama' ? 'Ollama' : provider === 'openai' ? 'OpenAI' : 'Local'}
          </span>
          <OverlayTrigger
            placement="bottom"
            delay={{ show: 100, hide: 50 }}
            overlay={<Tooltip id="tt-refresh">Refresh</Tooltip>}
          >
            <Button
              variant="link"
              size="sm"
              className="btn-icon-refresh p-0 text-decoration-none"
              onClick={onRefreshModels}
              disabled={isRefreshing}
              aria-label="Refresh Models"
            >
              <span className={`material-symbols-rounded fs-6 align-middle ${isRefreshing ? 'spin' : ''}`}>
                refresh
              </span>
            </Button>
          </OverlayTrigger>
        </div>

        {/* MATCH STATUS BADGE */}
        {isRunning !== undefined && (
          <Badge
            bg={isRunning ? (isPaused ? 'warning' : 'primary') : 'success'}
            className="match-status-badge d-flex align-items-center gap-1 px-2 py-1 rounded-pill small"
          >
            <span className="status-dot" />
            <span className="status-label">{isRunning ? (isPaused ? 'PAUSED' : 'AUTO') : 'READY'}</span>
          </Badge>
        )}
      </div>
    </div>
  );
}
