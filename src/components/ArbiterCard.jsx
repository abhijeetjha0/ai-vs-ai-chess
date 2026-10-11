import React from 'react';
import { Card, Badge, Spinner, Alert } from 'react-bootstrap';

export default function ArbiterCard({
  modelName,
  isEvaluating,
  proposedMove,
  finalMove,
  grade,
  commentary
}) {
  const getGradeClass = (g = '') => {
    if (g.includes('Brilliant')) return 'grade-brilliant';
    if (g.includes('Best')) return 'grade-best';
    if (g.includes('Good') || g.includes('Strong')) return 'grade-good';
    if (g.includes('Inaccuracy')) return 'grade-inaccuracy';
    if (g.includes('Blunder')) return 'grade-blunder';
    return 'grade-solid';
  };

  const statusVariant = isEvaluating ? 'warning' : finalMove ? 'success' : 'secondary';
  const statusText = isEvaluating ? 'EVALUATING...' : finalMove ? 'ADJUDICATED' : 'STANDBY';

  return (
    <Card className="arbiter-card glass-panel border border-secondary border-opacity-25">
      <Card.Body className="p-3">
        <div className="arbiter-header d-flex justify-content-between align-items-center mb-3">
          <div className="arbiter-identity d-flex align-items-center gap-2">
            <span className="arbiter-badge-icon fs-3">⚖️</span>
            <div>
              <div className="arbiter-title small text-secondary fw-semibold text-uppercase">Middle Decision Model</div>
              <div className="arbiter-name fw-bold text-light">{modelName || 'Arbiter'}</div>
            </div>
          </div>
          <Badge
            bg={statusVariant}
            className={`arbiter-status-pill ${isEvaluating ? 'evaluating' : finalMove ? 'approved' : 'standby'} d-flex align-items-center gap-1 text-light shadow-sm`}
          >
            {isEvaluating && <Spinner animation="border" size="sm" />}
            {statusText}
          </Badge>
        </div>

        {isEvaluating ? (
          <div className="evaluating-state p-3 rounded bg-dark bg-opacity-50 text-center">
            <Spinner animation="grow" variant="warning" className="mb-2" />
            <div className="evaluating-details">
              <div className="eval-proposed">
                Evaluating proposal: <strong className="glow-text text-warning fs-5 ms-1">{proposedMove}</strong>
              </div>
              <div className="eval-reasoning small text-muted mt-1">Running tactical and legality checks...</div>
            </div>
          </div>
        ) : finalMove ? (
          <div className="adjudication-result">
            <div className="arbiter-metrics-row d-flex justify-content-between align-items-center mb-0 p-2 rounded bg-dark bg-opacity-25">
              <div className="metric-item d-flex align-items-center gap-2">
                <span className="metric-label small text-secondary">Move Grade:</span>
                <span className={`grade-badge ${getGradeClass(grade)}`}>
                  {grade || '🎯 Best Move'}
                </span>
              </div>
              <div className="metric-item d-flex align-items-center gap-2">
                <span className="metric-label small text-secondary">Approved Move:</span>
                <Badge bg="primary" className="final-move-badge fs-6 px-2 py-1">{finalMove}</Badge>
              </div>
            </div>
          </div>
        ) : (
          <div className="adjudication-empty text-center p-3 text-muted">
            <span className="empty-icon fs-2 d-block mb-1">🛡️</span>
            <span className="small">Awaiting first move proposal to adjudicate...</span>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
