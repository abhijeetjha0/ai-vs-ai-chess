import React from 'react';
import { Button, Form, Spinner, Dropdown, OverlayTrigger, Tooltip } from 'react-bootstrap';

function ActionTooltipButton({ tooltip, placement = 'top', children, ...props }) {
  return (
    <OverlayTrigger
      placement={placement}
      delay={{ show: 100, hide: 50 }}
      overlay={<Tooltip id={`tt-${tooltip.toLowerCase().replace(/\s+/g, '-')}`}>{tooltip}</Tooltip>}
    >
      <Button {...props}>{children}</Button>
    </OverlayTrigger>
  );
}

export default function Controls({
  mode,
  onModeChange,
  isRunning,
  isPaused,
  turnInProgress,
  turnDelay,
  onSpeedChange,
  onStartAuto,
  onPauseResumeAuto,
  onStopAuto,
  onPlayTurn,
  onResetMatch,
  onFlipBoard,
  isMuted,
  onToggleSound,
  onCopyFen,
  onExportPgn
}) {

  return (
    <div className="controls-card glass-panel d-flex align-items-center justify-content-between gap-1">
        {/* LEFT: MODE DROPDOWN */}
        <div className="controls-mode-select-wrap">
          <Dropdown className="controls-mode-dropdown">
            <Dropdown.Toggle
              variant="dark"
              id="controls-mode-dropdown-toggle"
              className="controls-mode-toggle d-flex align-items-center justify-content-between"
              aria-label="Game Mode Selection"
            >
              <span className="d-flex align-items-center gap-2">
                <span className="material-symbols-rounded mode-toggle-icon fs-5">
                  {mode === 'auto' ? 'smart_toy' : 'touch_app'}
                </span>
                <span className="mode-toggle-label">{mode === 'auto' ? 'Automated Match' : 'Manual Mode'}</span>
              </span>
            </Dropdown.Toggle>

            <Dropdown.Menu className="controls-mode-menu glass-panel shadow-lg" align="start">
              <Dropdown.Item
                active={mode === 'auto'}
                onClick={() => onModeChange('auto')}
                className="controls-mode-item"
              >
                <div className="d-flex align-items-center gap-2 py-1">
                  <span className="material-symbols-rounded fs-5 text-primary">smart_toy</span>
                  <div>
                    <div className="fw-semibold text-light">Automated Match</div>
                    <div className="text-secondary small">Continuous turn execution by AI models</div>
                  </div>
                </div>
              </Dropdown.Item>
              <Dropdown.Divider className="border-secondary border-opacity-25 my-1" />
              <Dropdown.Item
                active={mode === 'manual'}
                onClick={() => onModeChange('manual')}
                className="controls-mode-item"
              >
                <div className="d-flex align-items-center gap-2 py-1">
                  <span className="material-symbols-rounded fs-5 text-info">touch_app</span>
                  <div>
                    <div className="fw-semibold text-light">Manual Mode</div>
                    <div className="text-secondary small">Interactive board play & step-by-step turns</div>
                  </div>
                </div>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>

        {/* CENTER: PRIMARY ACTIONS & MODE CONTROLS */}
        <div className="controls-primary-actions d-flex align-items-center gap-1">
          {mode === 'auto' ? (
            <>
              {!isRunning ? (
                <ActionTooltipButton
                  tooltip="Start"
                  variant="primary"
                  className="btn-control-icon btn-primary-play btn-glow"
                  onClick={onStartAuto}
                  aria-label="Start Match"
                >
                  <span className="material-symbols-rounded fs-5">play_arrow</span>
                </ActionTooltipButton>
              ) : (
                <div className="d-flex align-items-center gap-1">
                  <ActionTooltipButton
                    tooltip={isPaused ? 'Resume' : 'Pause'}
                    variant={isPaused ? 'success' : 'warning'}
                    className="btn-control-icon btn-pause-resume"
                    onClick={onPauseResumeAuto}
                    aria-label={isPaused ? 'Resume' : 'Pause'}
                  >
                    <span className="material-symbols-rounded fs-5">{isPaused ? 'play_arrow' : 'pause'}</span>
                  </ActionTooltipButton>
                  <ActionTooltipButton
                    tooltip="Stop"
                    variant="danger"
                    className="btn-control-icon btn-stop"
                    onClick={onStopAuto}
                    aria-label="Stop Match"
                  >
                    <span className="material-symbols-rounded fs-5">stop</span>
                  </ActionTooltipButton>
                </div>
              )}
            </>
          ) : (
            <ActionTooltipButton
              tooltip="Step AI"
              variant="primary"
              className="btn-control-icon btn-primary-play btn-glow"
              onClick={onPlayTurn}
              disabled={turnInProgress}
              aria-label="Step AI Move"
            >
              {turnInProgress ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <span className="material-symbols-rounded fs-5">play_arrow</span>
              )}
            </ActionTooltipButton>
          )}
        </div>

        {/* RIGHT: SECONDARY UTILITY ICON BUTTONS */}
        <div className="controls-secondary-actions d-flex align-items-center gap-1 ms-auto flex-shrink-0">
          <ActionTooltipButton
            tooltip="Reset"
            variant="outline-secondary"
            className="btn-control-icon btn-utility"
            onClick={onResetMatch}
            aria-label="Reset Match"
          >
            <span className="material-symbols-rounded fs-6">restart_alt</span>
          </ActionTooltipButton>
          <ActionTooltipButton
            tooltip="Flip"
            variant="outline-secondary"
            className="btn-control-icon btn-utility"
            onClick={onFlipBoard}
            aria-label="Flip Board"
          >
            <span className="material-symbols-rounded fs-6">swap_vert</span>
          </ActionTooltipButton>
          <ActionTooltipButton
            tooltip={isMuted ? 'Unmute' : 'Mute'}
            variant="outline-secondary"
            className="btn-control-icon btn-utility"
            onClick={onToggleSound}
            aria-label="Toggle Sound"
          >
            <span className="material-symbols-rounded fs-6">{isMuted ? 'volume_off' : 'volume_up'}</span>
          </ActionTooltipButton>
          <ActionTooltipButton
            tooltip="Copy"
            variant="outline-secondary"
            className="btn-control-icon btn-utility"
            onClick={onCopyFen}
            aria-label="Copy FEN"
          >
            <span className="material-symbols-rounded fs-6">content_copy</span>
          </ActionTooltipButton>
          <ActionTooltipButton
            tooltip="Export"
            variant="outline-secondary"
            className="btn-control-icon btn-utility"
            onClick={onExportPgn}
            aria-label="Export PGN"
          >
            <span className="material-symbols-rounded fs-6">download</span>
          </ActionTooltipButton>
        </div>
      </div>
  );
}
