import React, { useRef, useEffect } from 'react';
import { Card, Badge } from 'react-bootstrap';
import { renderGradeContent, getGradeClass } from '../ui/gradeUtils.jsx';

export default function MoveLog({ thoughtEntries = [], historySan = [] }) {
  const thoughtsEndRef = useRef(null);

  useEffect(() => {
    if (thoughtsEndRef.current) {
      thoughtsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [thoughtEntries.length]);

  return (
    <Card className="history-card glass-panel border border-secondary border-opacity-25">
      <Card.Header className="p-2.5 px-3 border-bottom border-secondary border-opacity-25 bg-transparent d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2">
          <span className="material-symbols-rounded text-info fs-5 align-middle">psychology</span>
          <span className="fw-bold small text-light" style={{ fontSize: '0.85rem' }}>AI Thoughts</span>
        </div>
        <Badge
          bg="dark"
          className="border border-secondary border-opacity-50 text-info fw-bold px-2 py-1"
        >
          {thoughtEntries.length}
        </Badge>
      </Card.Header>

      <Card.Body
        className="p-0 d-flex flex-column flex-grow-1 overflow-hidden"
        style={{ minHeight: 0, height: '100%' }}
      >
        <div
          className="thoughts-stream-container p-2 flex-grow-1"
          style={{ minHeight: 0, overflowY: 'auto' }}
        >
          {thoughtEntries.length === 0 ? (
            <div className="thoughts-empty text-center py-4 text-muted">
              <span className="material-symbols-rounded fs-2 d-block mb-1 text-secondary opacity-50">
                psychology
              </span>
              <span className="small">
                Model thoughts and arbiter commentary will appear here live during play.
              </span>
            </div>
          ) : (
            <>
              {thoughtEntries.map((entry, idx) => (
                <Card
                  key={idx}
                  className={`thought-stream-card mb-2 border-secondary border-opacity-25 bg-dark bg-opacity-50 ${
                    entry.playerSlot === 'white'
                      ? 'stream-white border-start border-3 border-light'
                      : 'stream-black border-start border-3 border-info'
                  }`}
                >
                  <Card.Body className="p-2">
                    <div className="stream-card-header d-flex justify-content-between align-items-center mb-1">
                      <Badge
                        bg={entry.playerSlot === 'white' ? 'light' : 'info'}
                        text="dark"
                        className="fw-semibold px-1.5 py-0.5 small d-inline-flex align-items-center gap-1"
                      >
                        <span className="material-symbols-rounded" style={{ fontSize: '12px' }}>circle</span>
                        {entry.playerSlot === 'white' ? 'White' : 'Black'} T{entry.turnNumber}
                      </Badge>
                      <span className="stream-model-name text-secondary" style={{ fontSize: '0.72rem' }}>
                        {entry.modelName}
                      </span>
                    </div>

                    <div className="stream-proposal-row d-flex align-items-baseline gap-1.5 mb-1">
                      <Badge
                        bg="primary"
                        className="stream-move-badge font-monospace px-1.5 py-0.5"
                        style={{ fontSize: '0.75rem' }}
                      >
                        {entry.proposedMove}
                      </Badge>
                      <div
                        className="stream-reasoning-text text-light text-opacity-90"
                        style={{ fontSize: '0.74rem', lineHeight: '1.3' }}
                      >
                        {entry.reasoning}
                      </div>
                    </div>

                    {entry.arbiterModel && (
                      <div className="stream-arbiter-verdict-box p-1.5 rounded bg-black bg-opacity-30 border border-secondary border-opacity-25 mt-1">
                        <div className="stream-arbiter-header d-flex justify-content-between align-items-center">
                          <span
                            className="text-warning fw-semibold d-inline-flex align-items-center gap-1"
                            style={{ fontSize: '0.7rem' }}
                          >
                            <span className="material-symbols-rounded" style={{ fontSize: '13px' }}>balance</span>
                            {entry.arbiterModel}
                          </span>
                          <span className={`stream-grade-badge ${getGradeClass(entry.grade)}`} style={{ fontSize: '0.68rem' }}>
                            {renderGradeContent(entry.grade)}
                          </span>
                        </div>
                        {entry.commentary && !entry.commentary.includes('verified move') && (
                          <div
                            className="stream-arbiter-commentary fst-italic text-light text-opacity-75 mt-1"
                            style={{ fontSize: '0.72rem', lineHeight: '1.25' }}
                          >
                            "{entry.commentary}"
                          </div>
                        )}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              ))}
              <div ref={thoughtsEndRef} />
            </>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}
