import React from 'react';
import { Card, Badge, Spinner, Form } from 'react-bootstrap';
import { getPieceSvg } from '../ui/pieces.js';

export default function PlayerStatus({
  playerNumber = 1,
  color, // 'white' | 'black'
  model,
  models = [],
  onModelChange,
  isActiveTurn,
  isThinking,
  capturedPieces = [],
  advantage = 0,
  lastMove = null,
  lastReasoning = ''
}) {
  const isWhite = color === 'white';
  const accentClass = isWhite ? 'player-white' : 'player-black';
  const opponentPieceColor = isWhite ? 'b' : 'w';

  let statusText = 'WAITING';
  let statusClass = 'waiting';

  if (isActiveTurn) {
    if (isThinking) {
      statusText = 'THINKING...';
      statusClass = 'thinking';
    } else {
      statusText = 'TO MOVE';
      statusClass = 'active';
    }
  }

  const playerLabel = playerNumber === 1 ? 'Player 1 (White)' : 'Player 2 (Black)';

  return (
    <Card className={`player-card glass-panel compact-player-card ${accentClass} ${isActiveTurn ? 'turn-active' : ''}`}>
      <Card.Body className="p-2.5">
        {/* HEADER ROW: LABEL, IN-CARD SELECT, STATUS */}
        <div className={`player-header d-flex justify-content-between align-items-center gap-2 ${capturedPieces.length > 0 ? 'mb-2' : 'mb-0'}`}>
          <div className="player-identity d-flex align-items-center flex-shrink-0">
            <span className="player-name fw-bold text-light" style={{ fontSize: '0.85rem' }}>
              {playerLabel}
            </span>
          </div>

          {/* IN-CARD MODEL SELECTOR DROPDOWN */}
          <div className="player-model-select-wrap flex-grow-1 mx-1" style={{ maxWidth: '175px' }}>
            <Form.Select
              size="sm"
              className="compact-select in-card-select"
              value={model || ''}
              onChange={(e) => onModelChange && onModelChange(e.target.value)}
              disabled={models.length === 0}
              title={model}
              aria-label={`${playerLabel} Model`}
            >
              {models.length === 0 ? (
                <option value="">No models</option>
              ) : (
                models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))
              )}
            </Form.Select>
          </div>

          {/* TURN STATUS PILL */}
          <div className={`player-status-pill ${statusClass} d-flex align-items-center flex-shrink-0`}>
            {isThinking && (
              <Spinner
                animation="border"
                size="sm"
                className="me-1"
                style={{ width: '10px', height: '10px', borderWidth: '1.5px' }}
              />
            )}
            <span style={{ fontSize: '0.7rem' }}>{statusText}</span>
          </div>
        </div>

        {/* BOTTOM ROW: CAPTURED PIECES TRAY (VISIBLE ONLY WHEN PIECES ARE CAPTURED) */}
        {capturedPieces.length > 0 && (
          <div className="player-card-content d-flex align-items-center justify-content-between gap-2 mt-2">
            <div className="player-captures-row d-flex align-items-center gap-1 mb-0 py-1 px-1.5">
              <div className="captures-tray d-flex flex-wrap gap-0.5">
                {capturedPieces.slice(-7).map((type, idx) => (
                  <span
                    key={idx}
                    className="captured-piece-mini"
                    dangerouslySetInnerHTML={{ __html: getPieceSvg({ color: opponentPieceColor, type }) }}
                  />
                ))}
              </div>
              {advantage > 0 && (
                <Badge bg="success" pill className="advantage-pill py-0 px-1" style={{ fontSize: '0.65rem' }}>
                  +{advantage}
                </Badge>
              )}
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
