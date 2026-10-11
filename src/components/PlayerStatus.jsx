import React from 'react';
import { Card, Badge, Spinner, Stack } from 'react-bootstrap';
import { getPieceSvg } from '../ui/pieces.js';

export default function PlayerStatus({
  color, // 'white' | 'black'
  modelName,
  isActiveTurn,
  isThinking,
  capturedPieces = [],
  advantage = 0,
  lastMove = null,
  lastReasoning = ''
}) {
  const isWhite = color === 'white';
  const accentClass = isWhite ? 'player-white' : 'player-black';
  const icon = isWhite ? '♔' : '♚';
  const opponentPieceColor = isWhite ? 'b' : 'w';

  let statusText = 'WAITING';
  let statusClass = 'waiting';
  let badgeVariant = 'secondary';

  if (isActiveTurn) {
    if (isThinking) {
      statusText = 'THINKING...';
      statusClass = 'thinking';
      badgeVariant = 'warning';
    } else {
      statusText = 'TO MOVE';
      statusClass = 'active';
      badgeVariant = isWhite ? 'info' : 'primary';
    }
  }

  return (
    <Card className={`player-card glass-panel ${accentClass} ${isActiveTurn ? 'turn-active' : ''}`}>
      <Card.Body className="p-3">
        <div className="player-header d-flex justify-content-between align-items-center mb-2">
          <div className="player-identity d-flex align-items-center gap-2">
            <span className="player-piece-icon fs-3">{icon}</span>
            <div className="player-meta">
              <div className="player-name fw-bold">{modelName || `${isWhite ? 'White' : 'Black'} Player`}</div>
              <Badge bg="dark" className="border border-secondary border-opacity-25 text-secondary small">
                {isWhite ? 'WHITE' : 'BLACK'}
              </Badge>
            </div>
          </div>
          <div className={`player-status-pill ${statusClass} d-flex align-items-center`}>
            {isThinking && <Spinner animation="border" size="sm" className="me-1" />}
            {statusText}
          </div>
        </div>

        {/* CAPTURED PIECES TRAY */}
        <div className="player-captures-row d-flex align-items-center justify-content-between mb-2">
          <div className="captures-tray d-flex flex-wrap gap-1">
            {capturedPieces.map((type, idx) => (
              <span
                key={idx}
                className="captured-piece-mini"
                dangerouslySetInnerHTML={{ __html: getPieceSvg({ color: opponentPieceColor, type }) }}
              />
            ))}
          </div>
          {advantage > 0 && (
            <Badge bg="success" pill className="advantage-pill">
              +{advantage}
            </Badge>
          )}
        </div>

        {/* COMPACT STRATEGY / THOUGHTS BUBBLE */}
        <div
          className="player-reasoning-bubble px-2 py-1 rounded"
          title={lastReasoning ? `${lastMove ? `[${lastMove}] ` : ''}${lastReasoning}` : 'Awaiting turn execution...'}
        >
          {lastMove && (
            <span className={`reasoning-move-tag ${isWhite ? 'tag-white' : 'tag-black'}`}>
              {lastMove}
            </span>
          )}
          <span className={`reasoning-text ${!lastReasoning ? 'waiting' : ''}`}>
            {lastReasoning ? lastReasoning : '💭 Awaiting turn...'}
          </span>
        </div>
      </Card.Body>
    </Card>
  );
}
