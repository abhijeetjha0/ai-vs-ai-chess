/**
 * Dynamic Ollama Local Client
 * Connects directly or via Vite dev proxy.
 * Categorizes models into chatModels (for players) and decisionModels (for middle decision model).
 */

export class OllamaClient {
  static getDefaultHost() {
    return 'http://localhost:11434';
  }

  /**
   * Fetches real models from local Ollama and categorizes by capabilities:
   * - chatModels: models capable of completion/chat
   * - decisionModels: models specifically capable of decision
   */
  static async fetchModels(baseUrl = OllamaClient.getDefaultHost()) {
    const urlsToTry = [
      '/ollama/api/tags', // Vite proxy (no CORS issues)
      baseUrl.replace(/\/+$/, '') + '/api/tags'
    ];

    let lastError = null;

    for (const url of urlsToTry) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(url, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);

        if (!res.ok) continue;

        const data = await res.json();
        const rawModels = data.models || [];

        // 1. Chat models: must support 'completion' or 'chat', exclude embedding, functional & decision-only
        const chatModels = rawModels
          .filter(m => {
            const nameLower = (m.name || '').toLowerCase();
            if (nameLower.includes('embed')) return false;
            if (nameLower.includes('function')) return false;
            if (nameLower.includes('rerank')) return false;
            if (m.capabilities && Array.isArray(m.capabilities)) {
              const canChat = m.capabilities.includes('completion') || m.capabilities.includes('chat');
              if (!canChat) return false;
            }
            return true;
          })
          .map(m => ({
            id: m.name,
            name: m.name,
            size: m.size ? `${(m.size / 1e9).toFixed(1)} GB` : '',
            capabilities: m.capabilities || ['completion'],
            provider: 'ollama'
          }));

        // 2. Decision models: must specifically have 'decision' capability
        const decisionModels = rawModels
          .filter(m => {
            if (m.capabilities && Array.isArray(m.capabilities)) {
              return m.capabilities.includes('decision');
            }
            return m.name.toLowerCase().includes('decision');
          })
          .map(m => ({
            id: m.name,
            name: m.name,
            size: m.size ? `${(m.size / 1e9).toFixed(1)} GB` : '',
            capabilities: m.capabilities || ['decision'],
            provider: 'ollama'
          }));

        return {
          success: true,
          chatModels,
          decisionModels,
          models: chatModels,
          endpointUsed: url
        };
      } catch (err) {
        lastError = err;
      }
    }

    return {
      success: false,
      error: 'Cannot reach Ollama at ' + baseUrl + '. Make sure Ollama is running (`ollama serve`).',
      chatModels: [],
      decisionModels: [],
      models: []
    };
  }

  /**
   * Calls /api/chat with fallback to /api/generate
   */
  static async chat({
    baseUrl = OllamaClient.getDefaultHost(),
    model,
    messages,
    temperature = 0.7,
    jsonFormat = true,
    think = false,
    numPredict = 128,
    numCtx = 2048,
    timeoutMs = 25000
  }) {
    const urlsToTry = [
      '/ollama/api/chat',
      baseUrl.replace(/\/+$/, '') + '/api/chat'
    ];

    const body = {
      model,
      messages,
      stream: false,
      think: think, // disable CoT thinking tokens for reasoning models (e.g. qwen3.5, deepseek) to ensure sub-2s responses
      options: {
        temperature: parseFloat(temperature) || 0.7,
        num_predict: numPredict,
        num_ctx: numCtx
      }
    };

    if (jsonFormat) {
      body.format = 'json';
    }

    let lastError = null;

    for (const url of urlsToTry) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          // If model doesn't support chat, attempt /api/generate fallback
          if (errText.includes('does not support chat')) {
            const genUrl = url.replace(/\/chat$/, '/generate');
            try {
              const promptText = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n') + '\n\nASSISTANT:';
              const genRes = await fetch(genUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  model,
                  prompt: promptText,
                  stream: false,
                  think: think,
                  format: jsonFormat ? 'json' : undefined,
                  options: {
                    temperature: parseFloat(temperature) || 0.7,
                    num_predict: numPredict,
                    num_ctx: numCtx
                  }
                })
              });
              if (genRes.ok) {
                const genData = await genRes.json();
                const genContent = genData.response?.trim() || genData.thinking?.trim() || '';
                return {
                  success: true,
                  content: genContent,
                  raw: genData
                };
              }
            } catch (genErr) {}
          }
          throw new Error(`Ollama error (${res.status}): ${errText || res.statusText}`);
        }

        const data = await res.json();
        const content = data.message?.content?.trim() || data.message?.thinking?.trim() || '';
        return {
          success: true,
          content,
          raw: data
        };
      } catch (err) {
        lastError = err;
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Failed to call Ollama chat'
    };
  }

  /**
   * Calls native Ollama /v1/systemone decision endpoint for decision models
   */
  static async decide({
    baseUrl = OllamaClient.getDefaultHost(),
    model,
    state,
    questions,
    timeoutMs = 8000
  }) {
    const urlsToTry = [
      '/ollama/v1/systemone',
      baseUrl.replace(/\/+$/, '') + '/v1/systemone'
    ];

    const body = {
      model,
      state,
      questions
    };

    let lastError = null;

    for (const url of urlsToTry) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          throw new Error(`Ollama decision error (${res.status}): ${errText || res.statusText}`);
        }

        const data = await res.json();
        return {
          success: true,
          data
        };
      } catch (err) {
        lastError = err;
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Failed to call decision endpoint'
    };
  }
}
