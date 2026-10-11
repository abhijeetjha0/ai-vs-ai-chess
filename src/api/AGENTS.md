# API & LLM Layer — Agent Guidelines

## Purpose
This directory manages external and local AI providers for chess turn generation and middle decision adjudication. It interfaces with local Ollama instances (with capability tagging, MLX support, and fast thinking bypass), OpenAI-compatible API endpoints, and fallback mock/offline engines.

## Key Files
| File | Role |
|---|---|
| [`model-manager.js`](file:///Users/abhijit/Documents/Projects/Learning/AI/ai-vs-ai-chess/src/api/model-manager.js) | Central coordinator: manages provider state, config persistence, model discovery, move dispatch, and arbiter adjudication |
| [`ollama.js`](file:///Users/abhijit/Documents/Projects/Learning/AI/ai-vs-ai-chess/src/api/ollama.js) | Ollama HTTP client: fetches local models (`/api/tags`), inspects capabilities, handles structured JSON output schemas and `think: false` bypass |
| [`openai.js`](file:///Users/abhijit/Documents/Projects/Learning/AI/ai-vs-ai-chess/src/api/openai.js) | OpenAI-compatible chat client: interfaces with OpenAI, OpenRouter, Groq, LM Studio, and vLLM |
| [`mock.js`](file:///Users/abhijit/Documents/Projects/Learning/AI/ai-vs-ai-chess/src/api/mock.js) | Fast in-memory mock personas and rule-based move evaluator for offline/testing play |

## Conventions & Rules

### 1. Decision Model Capability Filtering
- **Strict Capability Matching**: Only models with explicit decision capability (`caps.includes('decision')`) must be exposed in `decisionModels`.
- Do NOT classify general chat or coder models as decision models unless explicitly tagged or capable of typed structured decisions.

### 2. Fast Reasoning (CoT Bypass)
- When querying reasoning models (such as `qwen3.5`, `deepseek-r1`), the Ollama client supports passing `think: false` in the request options when `config.fastThinking !== false`.
- This accelerates turn evaluation times from ~60 seconds down to ~1.4 seconds while still returning valid moves.

### 3. Move Adjudication & Grade Output
- All grades generated or returned by `model-manager.js` or `mock.js` must be clean strings without hardcoded emojis:
  - `'Best Move'`
  - `'Good Move'`
  - `'Inaccuracy'`
  - `'Brilliant'`
  - `'Manual Play'`
- The UI layer handles styling and icon presentation via Google Material Symbols.
- **No Redundant Synthetic Commentary**: Do not generate robotic boilerplate strings (e.g., `"Decision model <model> verified move <move> as <grade>"`). The Arbiter model name and grade badge already convey this structured data cleanly.

### 4. Resilient Fallbacks
- Network failures, timeouts (e.g., 8-second limit on arbiter calls), or JSON parse errors in external LLM calls must NEVER crash the match loop.
- Always provide graceful fallbacks using `OfflineEngine.evaluateArbiterDecision` or the first legal move from `legalMoves`.
