import React, { useState, useEffect } from 'react';
import { Offcanvas, Form, Button, Alert, InputGroup, Card } from 'react-bootstrap';

export default function ApiDrawer({
  isOpen,
  onClose,
  config,
  turnDelay = 2000,
  onSpeedChange,
  onSaveConfig,
  onRefreshModels,
  isRefreshing
}) {
  const [provider, setProvider] = useState(config.provider || 'ollama');
  const [ollamaUrl, setOllamaUrl] = useState(config.ollamaBaseUrl || 'http://localhost:11434');
  const [openaiUrl, setOpenaiUrl] = useState(config.openaiBaseUrl || 'https://api.openai.com/v1');
  const [openaiKey, setOpenaiKey] = useState(config.openaiApiKey || '');
  const [temp, setTemp] = useState(config.temperature !== undefined ? config.temperature : 0.7);
  const [fastThinking, setFastThinking] = useState(config.fastThinking !== false);
  const [enrichedContext, setEnrichedContext] = useState(config.enrichedContext !== false);
  const [duration, setDuration] = useState(config.turnDelay || turnDelay || 2000);

  useEffect(() => {
    if (isOpen) {
      setProvider(config.provider || 'ollama');
      setOllamaUrl(config.ollamaBaseUrl || 'http://localhost:11434');
      setOpenaiUrl(config.openaiBaseUrl || 'https://api.openai.com/v1');
      setOpenaiKey(config.openaiApiKey || '');
      setTemp(config.temperature !== undefined ? config.temperature : 0.7);
      setFastThinking(config.fastThinking !== false);
      setEnrichedContext(config.enrichedContext !== false);
      setDuration(config.turnDelay || turnDelay || 2000);
    }
  }, [isOpen, config, turnDelay]);

  const handleSave = () => {
    if (onSpeedChange) onSpeedChange(duration);
    const parsedTemp = parseFloat(temp);
    onSaveConfig({
      provider,
      ollamaBaseUrl: ollamaUrl,
      openaiBaseUrl: openaiUrl,
      openaiApiKey: openaiKey,
      temperature: Number.isFinite(parsedTemp) ? parsedTemp : 0.7,
      fastThinking,
      enrichedContext,
      turnDelay: duration
    });
    onClose();
  };

  return (
    <Offcanvas
      show={isOpen}
      onHide={onClose}
      placement="end"
      data-bs-theme="dark"
      className="api-drawer-offcanvas glass-panel"
      style={{
        backgroundColor: 'rgba(10, 15, 29, 0.94)',
        backdropFilter: 'blur(20px)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.12)',
        color: '#f8fafc'
      }}
    >
      <Offcanvas.Header closeButton closeVariant="white" className="border-bottom border-secondary-subtle">
        <Offcanvas.Title className="d-flex align-items-center gap-2">
          <span className="material-symbols-rounded">settings</span> API Endpoints & Provider
        </Offcanvas.Title>
      </Offcanvas.Header>

      <Offcanvas.Body className="d-flex flex-column gap-3">
        {/* PROVIDER SELECTION */}
        <Form.Group>
          <Form.Label className="text-secondary fw-semibold small text-uppercase">Active Provider</Form.Label>
          <Form.Select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="home-select bg-dark text-light border-secondary"
          >
            <option value="ollama">Ollama Local (Local LLMs)</option>
            <option value="openai">OpenAI / OpenRouter / Custom</option>
            <option value="offline">Built-in Local Chess Engine</option>
          </Form.Select>
        </Form.Group>

        {/* OLLAMA CONFIG */}
        {provider === 'ollama' && (
          <Card className="bg-dark bg-opacity-50 border-secondary">
            <Card.Body>
              <Card.Title className="h6 text-info mb-1">Ollama Local Host</Card.Title>
              <Card.Subtitle className="mb-2 text-muted small">Connects to your local Ollama instance</Card.Subtitle>
              <InputGroup className="mt-2">
                <Form.Control
                  type="text"
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  placeholder="http://localhost:11434"
                  className="bg-dark text-light border-secondary"
                />
                <Button
                  variant="outline-info"
                  onClick={onRefreshModels}
                  disabled={isRefreshing}
                >
                  <span className={`material-symbols-rounded align-middle me-1 ${isRefreshing ? 'spin' : ''}`}>refresh</span> Refresh
                </Button>
              </InputGroup>
              <Alert variant="info" className="mt-3 mb-0 py-2 small bg-opacity-25 border-info">
                Ensure Ollama is running: <code>ollama serve</code>
              </Alert>

              <Form.Group className="mt-3 pt-2 border-top border-secondary border-opacity-50">
                <Form.Check
                  type="switch"
                  id="fast-thinking-switch"
                  label={
                    <span className="d-inline-flex align-items-center gap-1">
                      <span className="material-symbols-rounded text-warning fs-6">bolt</span>
                      Fast Reasoning (Bypass verbose CoT)
                    </span>
                  }
                  checked={fastThinking}
                  onChange={(e) => setFastThinking(e.target.checked)}
                  className="fw-semibold text-light"
                />
                <Form.Text className="text-secondary small d-block mt-1">
                  Disables hidden thinking tokens for reasoning models (e.g., Qwen 3.5, DeepSeek-R1), accelerating chess turns from ~60s down to ~1.4s.
                </Form.Text>
              </Form.Group>
            </Card.Body>
          </Card>
        )}

        {/* OPENAI CONFIG */}
        {provider === 'openai' && (
          <Card className="bg-dark bg-opacity-50 border-secondary">
            <Card.Body>
              <Card.Title className="h6 text-primary mb-1">OpenAI / OpenAPI Endpoint</Card.Title>
              <Card.Subtitle className="mb-2 text-muted small">OpenAI, OpenRouter, Groq, LM Studio</Card.Subtitle>
              <Form.Group className="mb-2">
                <Form.Label className="small text-muted">Base URL</Form.Label>
                <Form.Control
                  type="text"
                  value={openaiUrl}
                  onChange={(e) => setOpenaiUrl(e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  className="bg-dark text-light border-secondary"
                />
              </Form.Group>
              <Form.Group>
                <Form.Label className="small text-muted">API Key</Form.Label>
                <Form.Control
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                  className="bg-dark text-light border-secondary"
                />
              </Form.Group>
            </Card.Body>
          </Card>
        )}

        {/* ENRICHED CHESS CONTEXT TOGGLE */}
        <Card className="bg-dark bg-opacity-50 border-secondary">
          <Card.Body className="py-2.5 px-3">
            <Form.Group className="mb-0">
              <Form.Check
                type="switch"
                id="enriched-context-switch"
                label={
                  <span className="d-inline-flex align-items-center gap-1">
                    <span className="material-symbols-rounded text-info fs-6">grid_view</span>
                    Enriched Chess Context
                  </span>
                }
                checked={enrichedContext}
                onChange={(e) => setEnrichedContext(e.target.checked)}
                className="fw-semibold text-light"
              />
              <Form.Text className="text-secondary small d-block mt-1">
                Supplies models with 2D board diagram, tactical move clustering (captures, checks, castling), and situational awareness.
              </Form.Text>
            </Form.Group>
          </Card.Body>
        </Card>

        {/* TURN DURATION (AUTOMATED PLAYBACK SPEED) */}
        <Card className="bg-dark bg-opacity-50 border-secondary">
          <Card.Body className="py-2.5 px-3">
            <div className="d-flex justify-content-between align-items-center mb-1.5">
              <Form.Label className="text-secondary fw-semibold small text-uppercase mb-0 d-flex align-items-center gap-1.5">
                <span className="material-symbols-rounded text-info fs-6">timer</span>
                Turn Duration (Auto Speed)
              </Form.Label>
              <span className="badge bg-dark border border-secondary border-opacity-50 text-cyan font-monospace px-2 py-0.5">
                {(duration / 1000).toFixed(1)}s / move
              </span>
            </div>
            <div className="d-flex align-items-center gap-2 mt-1">
              <span className="text-secondary small fw-semibold font-monospace" style={{ fontSize: '0.72rem' }}>
                0.5s
              </span>
              <Form.Range
                min={500}
                max={6000}
                step={250}
                value={duration}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setDuration(val);
                  if (onSpeedChange) onSpeedChange(val);
                }}
                className="duration-range flex-grow-1"
                aria-label="Turn Duration Slider"
              />
              <span className="text-secondary small fw-semibold font-monospace" style={{ fontSize: '0.72rem' }}>
                6.0s
              </span>
            </div>
            <Form.Text className="text-secondary small d-block mt-1">
              Deliberation and turn delay between AI model moves during Automated Match mode.
            </Form.Text>
          </Card.Body>
        </Card>

        {/* TEMPERATURE */}
        <Form.Group>
          <div className="d-flex justify-content-between mb-1">
            <Form.Label className="text-secondary fw-semibold small text-uppercase mb-0">Model Creativity (Temperature)</Form.Label>
            <span className="badge bg-secondary">{temp}</span>
          </div>
          <Form.Range
            min={0}
            max={1.2}
            step={0.1}
            value={temp}
            onChange={(e) => setTemp(e.target.value)}
          />
        </Form.Group>

        <div className="mt-auto d-flex justify-content-end gap-2 pt-3 border-top border-secondary">
          <Button variant="outline-secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" className="btn-glow" onClick={handleSave}>
            Apply Settings
          </Button>
        </div>
      </Offcanvas.Body>
    </Offcanvas>
  );
}
