import React from 'react';
import { Button, Form, Spinner } from 'react-bootstrap';

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
    <div className="controls-card glass-panel p-2 d-flex align-items-center justify-content-between flex-wrap gap-2">
      {/* LEFT: MODE DROPDOWN */}
      <div className="controls-mode-select-wrap">
        <Form.Select
          size="sm"
          value={mode}
          onChange={(e) => onModeChange(e.target.value)}
          className="controls-mode-select bg-dark text-light border-secondary border-opacity-50 fw-semibold"
          aria-label="Game Mode"
        >
          <option value="auto">⚡ Automated Match</option>
          <option value="manual">👆 Manual Mode</option>
        </Form.Select>
      </div>

      {/* CENTER: PRIMARY ACTIONS (ICON BUTTONS) & AUTO DELAY */}
      <div className="controls-primary-actions d-flex align-items-center gap-2">
        {mode === 'auto' ? (
          <>
            {!isRunning ? (
              <Button
                variant="primary"
                className="btn-control-icon btn-primary-play btn-glow"
                onClick={onStartAuto}
                title="Start Match"
                aria-label="Start Match"
              >
                <span className="fs-5">▶</span>
              </Button>
            ) : (
              <div className="d-flex align-items-center gap-1">
                <Button
                  variant={isPaused ? 'success' : 'warning'}
                  className="btn-control-icon btn-pause-resume"
                  onClick={onPauseResumeAuto}
                  title={isPaused ? 'Resume Match' : 'Pause Match'}
                  aria-label={isPaused ? 'Resume' : 'Pause'}
                >
                  <span className="fs-5">{isPaused ? '▶' : '⏸'}</span>
                </Button>
                <Button
                  variant="danger"
                  className="btn-control-icon"
                  onClick={onStopAuto}
                  title="Stop Match"
                  aria-label="Stop Match"
                >
                  <span className="fs-5">⏹</span>
                </Button>
              </div>
            )}

            {/* SPEED SLIDER (AUTO MODE) */}
            <div className="speed-control-compact d-flex align-items-center gap-2 px-2 py-1 bg-dark bg-opacity-50 border border-secondary border-opacity-25 rounded">
              <span className="small text-secondary fw-semibold text-nowrap">
                ⏱️ {(turnDelay / 1000).toFixed(1)}s
              </span>
              <Form.Range
                min={500}
                max={6000}
                step={250}
                value={turnDelay}
                onChange={(e) => onSpeedChange(parseInt(e.target.value, 10))}
                className="speed-range"
                title="Auto move delay"
              />
            </div>
          </>
        ) : (
          <Button
            variant="primary"
            className="btn-control-icon btn-primary-play btn-glow"
            onClick={onPlayTurn}
            disabled={turnInProgress}
            title={turnInProgress ? 'Thinking & Evaluating...' : 'Play Next Turn (🎲)'}
            aria-label="Play Next Turn"
          >
            {turnInProgress ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <span className="fs-5">🎲</span>
            )}
          </Button>
        )}
      </div>

      {/* RIGHT: SECONDARY UTILITY ICON BUTTONS */}
      <div className="controls-secondary-actions d-flex align-items-center gap-1 ms-auto">
        <Button
          variant="outline-secondary"
          size="sm"
          className="btn-control-icon btn-utility"
          onClick={onResetMatch}
          title="Reset match to start"
          aria-label="Reset Match"
        >
          <span>🔄</span>
        </Button>
        <Button
          variant="outline-secondary"
          size="sm"
          className="btn-control-icon btn-utility"
          onClick={onFlipBoard}
          title="Flip board perspective"
          aria-label="Flip Board"
        >
          <span>🔃</span>
        </Button>
        <Button
          variant="outline-secondary"
          size="sm"
          className="btn-control-icon btn-utility"
          onClick={onToggleSound}
          title={isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
          aria-label="Toggle Sound"
        >
          <span>{isMuted ? '🔇' : '🔊'}</span>
        </Button>
        <Button
          variant="outline-secondary"
          size="sm"
          className="btn-control-icon btn-utility"
          onClick={onCopyFen}
          title="Copy board FEN"
          aria-label="Copy FEN"
        >
          <span>📋</span>
        </Button>
        <Button
          variant="outline-secondary"
          size="sm"
          className="btn-control-icon btn-utility"
          onClick={onExportPgn}
          title="Download PGN notation"
          aria-label="Download PGN"
        >
          <span>💾</span>
        </Button>
      </div>
    </div>
  );
}
