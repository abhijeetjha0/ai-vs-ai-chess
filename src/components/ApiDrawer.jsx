import React, { useState } from 'react';
import { Offcanvas, Form, Button, Alert, InputGroup, Card } from 'react-bootstrap';

export default function ApiDrawer({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onRefreshModels,
  isRefreshing
}) {
  const [provider, setProvider] = useState(config.provider || 'ollama');
  const [ollamaUrl, setOllamaUrl] = useState(config.ollamaBaseUrl || 'http://localhost:11434');
  const [openaiUrl, setOpenaiUrl] = useState(config.openaiBaseUrl || 'https://api.openai.com/v1');
  const [openaiKey, setOpenaiKey] = useState(config.openaiApiKey || '');
  const [temp, setTemp] = useState(config.temperature || 0.7);
  const [fastThinking, setFastThinking] = useState(config.fastThinking !== false);

  const handleSave = () => {
    onSaveConfig({
      provider,
      ollamaBaseUrl: ollamaUrl,
      openaiBaseUrl: openaiUrl,
      openaiApiKey: openaiKey,
      temperature: parseFloat(temp),
      fastThinking
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
          <span>⚙️</span> API Endpoints & Provider
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
                  <span className={isRefreshing ? 'spin d-inline-block' : ''}>🔄</span> Refresh
                </Button>
              </InputGroup>
              <Alert variant="info" className="mt-3 mb-0 py-2 small bg-opacity-25 border-info">
                Ensure Ollama is running: <code>ollama serve</code>
              </Alert>

              <Form.Group className="mt-3 pt-2 border-top border-secondary border-opacity-50">
                <Form.Check
                  type="switch"
                  id="fast-thinking-switch"
                  label="⚡ Fast Reasoning (Bypass verbose CoT)"
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
