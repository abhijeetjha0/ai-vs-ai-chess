/**
 * Dynamic OpenAI-compatible API Client
 * Dynamically queries /models endpoint to discover accessible models
 */

export class OpenAiClient {
  static getDefaultBaseUrl() {
    return 'https://api.openai.com/v1';
  }

  /**
   * Dynamically queries /models endpoint
   */
  static async fetchModels({ baseUrl = OpenAiClient.getDefaultBaseUrl(), apiKey = '' }) {
    let cleanUrl = baseUrl.replace(/\/+$/, '');
    if (!cleanUrl.endsWith('/models')) {
      cleanUrl = `${cleanUrl}/models`;
    }

    const headers = { 'Accept': 'application/json' };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey.trim()}`;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(cleanUrl, {
        headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Endpoint returned status ${res.status}`);
      }

      const data = await res.json();
      const rawList = data.data || [];
      const models = rawList
        .filter(m => {
          const id = (m.id || '').toLowerCase();
          // Filter out whisper, embedding, tts, dall-e, moderation, and functional-calling specific models
          return !id.includes('whisper') &&
                 !id.includes('embedding') &&
                 !id.includes('tts') &&
                 !id.includes('dall-e') &&
                 !id.includes('moderation') &&
                 !id.includes('function') &&
                 !id.includes('rerank');
        })
        .map(m => ({
          id: m.id,
          name: m.id,
          provider: 'openai'
        }));

      return { success: true, models };
    } catch (err) {
      return { success: false, error: err.message, models: [] };
    }
  }

  static async chat({
    baseUrl = OpenAiClient.getDefaultBaseUrl(),
    apiKey,
    model,
    messages,
    temperature = 0.7,
    jsonMode = true
  }) {
    let cleanUrl = baseUrl.replace(/\/+$/, '');
    if (!cleanUrl.endsWith('/chat/completions')) {
      cleanUrl = `${cleanUrl}/chat/completions`;
    }

    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey.trim()}`;
    }

    if (cleanUrl.includes('openrouter.ai')) {
      headers['HTTP-Referer'] = window.location.origin;
      headers['X-Title'] = 'AI vs AI Chess';
    }

    const parsedTemp = parseFloat(temperature);
    const validTemp = Number.isFinite(parsedTemp) ? parsedTemp : 0.7;

    const body = {
      model,
      messages,
      temperature: validTemp
    };

    if (jsonMode) {
      body.response_format = { type: 'json_object' };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const res = await fetch(cleanUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errMessage = errorData.error?.message || res.statusText || `HTTP ${res.status}`;
        throw new Error(errMessage);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '';

      return {
        success: true,
        content,
        raw: data
      };
    } catch (err) {
      clearTimeout(timeoutId);
      return {
        success: false,
        error: err.message || 'Request failed'
      };
    }
  }
}
