import React, { useState, useRef, useEffect } from 'react';
import { Card, Nav, Table, Badge } from 'react-bootstrap';

export default function MoveLog({ historySan = [], thoughtEntries = [] }) {
  const [activeTab, setActiveTab] = useState('moves'); // 'moves' | 'thoughts'
  const thoughtsEndRef = useRef(null);
  const movesEndRef = useRef(null);

  useEffect(() => {
    if (activeTab === 'thoughts' && thoughtsEndRef.current) {
      thoughtsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [thoughtEntries.length, activeTab]);

  useEffect(() => {
    if (activeTab === 'moves' && movesEndRef.current) {
      movesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [historySan.length, activeTab]);

  // Format moves into pairs
  const moveRows = [];
  for (let i = 0; i < historySan.length; i += 2) {
    const num = Math.floor(i / 2) + 1;
    moveRows.push({
      num,
      white: historySan[i] || '',
      black: historySan[i + 1] || ''
    });
  }

  return (
    <Card className="history-card glass-panel border border-secondary border-opacity-25">
      <Card.Header className="p-2 border-bottom border-secondary border-opacity-25 bg-transparent">
        <Nav variant="pills" className="history-nav-pills d-flex gap-2">
          <Nav.Item className="flex-grow-1">
            <Nav.Link
              active={activeTab === 'moves'}
              onClick={() => setActiveTab('moves')}
              className={`text-center py-2 d-flex justify-content-center align-items-center gap-1 ${activeTab === 'moves' ? 'bg-primary text-white shadow' : 'text-light text-opacity-75'}`}
            >
              <span>📜</span> Moves <Badge bg="dark" className="border border-secondary border-opacity-25 ms-1">{historySan.length}</Badge>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item className="flex-grow-1">
            <Nav.Link
              active={activeTab === 'thoughts'}
              onClick={() => setActiveTab('thoughts')}
              className={`text-center py-2 d-flex justify-content-center align-items-center gap-1 ${activeTab === 'thoughts' ? 'bg-primary text-white shadow' : 'text-light text-opacity-75'}`}
            >
              <span>🧠</span> AI Thoughts
              {thoughtEntries.length > 0 && (
                <Badge bg="info" text="dark" className="ms-1 fw-bold">{thoughtEntries.length}</Badge>
              )}
            </Nav.Link>
          </Nav.Item>
        </Nav>
      </Card.Header>

      <Card.Body className="p-0 d-flex flex-column flex-grow-1 overflow-hidden" style={{ minHeight: 0, height: '100%' }}>
        {activeTab === 'moves' ? (
          <div className="moves-table-container flex-grow-1" style={{ minHeight: 0, overflowY: 'auto' }}>
            <Table hover responsive size="sm" variant="dark" className="moves-table mb-0 align-middle">
              <thead>
                <tr>
                  <th className="th-num ps-3">#</th>
                  <th className="th-white">White</th>
                  <th className="th-black">Black</th>
                </tr>
              </thead>
              <tbody>
                {moveRows.length === 0 ? (
                  <tr className="empty-row">
                    <td colSpan="3" className="text-center py-4 text-muted">
                      No moves yet. Start match to begin!
                    </td>
                  </tr>
                ) : (
                  moveRows.map((row, idx) => {
                    const isLatest = idx === moveRows.length - 1;
                    return (
                      <tr key={row.num} className={isLatest ? 'latest-row table-active' : ''}>
                        <td className="td-num ps-3 text-secondary">{row.num}.</td>
                        <td className="td-san td-white fw-semibold">{row.white}</td>
                        <td className="td-san td-black fw-semibold text-info">{row.black}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
            <div ref={movesEndRef} />
          </div>
        ) : (
          <div className="thoughts-stream-container p-2 flex-grow-1" style={{ minHeight: 0, overflowY: 'auto' }}>
            {thoughtEntries.length === 0 ? (
              <div className="thoughts-empty text-center py-4 text-muted">
                <span className="fs-3 d-block mb-1">💭</span>
                <span className="small">Model thoughts and arbiter commentary will appear here live during play.</span>
              </div>
            ) : (
              <>
                {thoughtEntries.map((entry, idx) => (
                  <Card
                    key={idx}
                    className={`thought-stream-card mb-2 border-secondary border-opacity-25 bg-dark bg-opacity-50 ${entry.playerSlot === 'white' ? 'stream-white border-start border-3 border-light' : 'stream-black border-start border-3 border-info'}`}
                  >
                    <Card.Body className="p-2">
                      <div className="stream-card-header d-flex justify-content-between align-items-center mb-1">
                        <Badge bg={entry.playerSlot === 'white' ? 'light' : 'info'} text={entry.playerSlot === 'white' ? 'dark' : 'dark'} className="fw-semibold px-1.5 py-0.5 small">
                          {entry.playerSlot === 'white' ? '⚪ White' : '⚫ Black'} T{entry.turnNumber}
                        </Badge>
                        <span className="stream-model-name text-secondary" style={{ fontSize: '0.72rem' }}>{entry.modelName}</span>
                      </div>
                      <div className="stream-proposal-row d-flex align-items-baseline gap-1.5 mb-1">
                        <Badge bg="primary" className="stream-move-badge font-monospace px-1.5 py-0.5" style={{ fontSize: '0.75rem' }}>{entry.proposedMove}</Badge>
                        <div className="stream-reasoning-text text-light text-opacity-90" style={{ fontSize: '0.74rem', lineHeight: '1.3' }}>{entry.reasoning}</div>
                      </div>
                      {entry.arbiterModel && (
                        <div className="stream-arbiter-verdict-box p-1.5 rounded bg-black bg-opacity-30 border border-secondary border-opacity-25 mt-1">
                          <div className="stream-arbiter-header d-flex justify-content-between align-items-center mb-0.5">
                            <span className="text-warning fw-semibold" style={{ fontSize: '0.7rem' }}>⚖️ {entry.arbiterModel}</span>
                            <span className="stream-grade-badge" style={{ fontSize: '0.68rem' }}>{entry.grade}</span>
                          </div>
                          <div className="stream-arbiter-commentary fst-italic text-light text-opacity-75" style={{ fontSize: '0.72rem', lineHeight: '1.25' }}>"{entry.commentary}"</div>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                ))}
                <div ref={thoughtsEndRef} />
              </>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
