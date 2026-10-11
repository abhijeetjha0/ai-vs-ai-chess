import React from 'react';
import { Card, Badge, Spinner, Form } from 'react-bootstrap';

export default function ArbiterCard({
  model,
  decisionModels = [],
  onModelChange,
  isEvaluating,
  proposedMove,
  finalMove,
  grade,
  commentary
}) {
  const statusVariant = isEvaluating ? 'warning' : finalMove ? 'success' : 'secondary';
  const statusText = isEvaluating ? 'EVALUATING...' : finalMove ? 'ADJUDICATED' : 'STANDBY';

  return (
    <Card className="arbiter-card glass-panel compact-arbiter-card border border-secondary border-opacity-25">
      <Card.Body className="p-2.5">
        {/* HEADER ROW: LABEL, IN-CARD SELECT, STATUS */}
        <div className="arbiter-header d-flex justify-content-between align-items-center gap-2 mb-0">
          <div className="arbiter-identity d-flex align-items-center gap-1.5 flex-shrink-0">
            <span className="material-symbols-rounded arbiter-badge-icon fs-5 text-warning">balance</span>
            <span className="arbiter-title small text-light fw-bold" style={{ fontSize: '0.85rem' }}>
              Decision
            </span>
          </div>

          {/* IN-CARD DECISION MODEL SELECTOR DROPDOWN */}
          <div className="arbiter-model-select-wrap flex-grow-1 mx-1" style={{ maxWidth: '175px' }}>
            <Form.Select
              size="sm"
              className="compact-select in-card-select"
              value={model || ''}
              onChange={(e) => onModelChange && onModelChange(e.target.value)}
              disabled={decisionModels.length === 0}
              title={model}
              aria-label="Decision Model"
            >
              {decisionModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Form.Select>
          </div>

          <Badge
            bg={statusVariant}
            className={`arbiter-status-pill ${isEvaluating ? 'evaluating' : finalMove ? 'approved' : 'standby'} d-flex align-items-center gap-1 text-light shadow-sm flex-shrink-0`}
            style={{ fontSize: '0.7rem' }}
          >
            {isEvaluating && (
              <Spinner
                animation="border"
                size="sm"
                style={{ width: '10px', height: '10px', borderWidth: '1.5px' }}
              />
            )}
            {statusText}
          </Badge>
        </div>
      </Card.Body>
    </Card>
  );
}
