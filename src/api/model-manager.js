/**
 * Model Manager: Dynamically queries and manages models,
 * separating Player chat models from Middle Decision models
 */

import { OllamaClient } from './ollama.js';
import { OpenAiClient } from './openai.js';
import { OfflineEngine, OFFLINE_MODELS, OFFLINE_ARBITERS } from './mock.js';
import { buildPlayerPromptContext, buildArbiterPromptContext } from '../chess/prompt-builder.js';

const STORAGE_KEY = 'ai_chess_config_v2';

export class ModelManager {
  constructor() {
    this.config = this.loadConfig();
    this.chatModels = [];
    this.decisionModels = [];
    this.ollamaConnected = false;
  }

  getDefaultConfig() {
    return {
      provider: 'ollama', // 'ollama' | 'openai' | 'offline'
      ollamaBaseUrl: 'http://localhost:11434',
      openaiBaseUrl: 'https://api.openai.com/v1',
      openaiApiKey: '',
      whiteModel: '',
      blackModel: '',
      arbiterModel: '',
      arbiterRole: 'adjudicator',
      temperature: 0.7,
      fastThinking: true, // when true, suppresses verbose CoT reasoning tokens in Ollama for sub-2s responses
      enrichedContext: true, // formats 2D board diagram, tactical move categorization, and situational awareness
      turnDelay: 2000, // pause delay (ms) between turns in Automated Match mode
      maxTokens: 128
    };
  }

  loadConfig() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...this.getDefaultConfig(), ...JSON.parse(saved) };
      }
    } catch (e) {}
    return this.getDefaultConfig();
  }

  saveConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    } catch (e) {}
  }

  /**
   * Refreshes real models from active provider
   */
  async refreshAvailableModels() {
    if (this.config.provider === 'ollama') {
      const res = await OllamaClient.fetchModels(this.config.ollamaBaseUrl);
      if (res.success) {
        this.chatModels = res.chatModels || [];
        this.decisionModels = res.decisionModels || [];
        this.ollamaConnected = true;

        // Auto-assign player models from chatModels
        const chatNames = this.chatModels.map(m => m.id);
        if (!chatNames.includes(this.config.whiteModel)) {
          this.config.whiteModel = chatNames[0] || '';
        }
        if (!chatNames.includes(this.config.blackModel)) {
          this.config.blackModel = chatNames.length > 1 ? chatNames[1] : (chatNames[0] || '');
        }

        // Auto-assign middle decision model ONLY from decisionModels
        const decisionNames = this.decisionModels.map(m => m.id);
        if (decisionNames.length === 0) {
          this.config.arbiterModel = '';
        } else if (!decisionNames.includes(this.config.arbiterModel)) {
          this.config.arbiterModel = decisionNames[0];
        }

        this.saveConfig(this.config);

        return {
          success: true,
          chatModels: this.chatModels,
          decisionModels: this.decisionModels,
          models: this.chatModels,
          provider: 'ollama'
        };
      } else {
        this.ollamaConnected = false;
        this.chatModels = [];
        this.decisionModels = [];
        this.config.whiteModel = '';
        this.config.blackModel = '';
        this.config.arbiterModel = '';
        this.saveConfig(this.config);
        return { success: false, error: res.error, chatModels: [], decisionModels: [], models: [], provider: 'ollama' };
      }
    }

    if (this.config.provider === 'openai') {
      const res = await OpenAiClient.fetchModels({
        baseUrl: this.config.openaiBaseUrl,
        apiKey: this.config.openaiApiKey
      });
      if (res.success && res.models.length > 0) {
        this.chatModels = res.models;
        this.decisionModels = []; // OpenAI models are completion/chat
        const names = res.models.map(m => m.id);
        if (!names.includes(this.config.whiteModel)) this.config.whiteModel = names[0];
        if (!names.includes(this.config.blackModel)) this.config.blackModel = names.length > 1 ? names[1] : names[0];
        this.config.arbiterModel = '';
        this.saveConfig(this.config);
        return { success: true, chatModels: res.models, decisionModels: [], models: res.models, provider: 'openai' };
      } else {
        return { success: false, error: res.error || 'No models returned from OpenAI endpoint', chatModels: [], decisionModels: [], models: [], provider: 'openai' };
      }
    }

    // Offline provider
    this.chatModels = OFFLINE_MODELS;
    this.decisionModels = OFFLINE_ARBITERS;
    return { success: true, chatModels: OFFLINE_MODELS, decisionModels: OFFLINE_ARBITERS, models: OFFLINE_MODELS, provider: 'offline' };
  }

  parseJsonFromResponse(rawText) {
    if (!rawText) return null;
    let clean = rawText.trim();
    if (clean.startsWith('```')) {
      clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    }
    try {
      return JSON.parse(clean);
    } catch (e) {
      const first = clean.indexOf('{');
      const last = clean.lastIndexOf('}');
      if (first !== -1 && last > first) {
        try {
          return JSON.parse(clean.slice(first, last + 1));
        } catch (e2) {}
      }
      return null;
    }
  }

  async requestPlayerMove({
    slot,
    fen,
    pgn,
    board,
    legalMoves = [],
    allLegalMoves,
    historySan = [],
    opening = null,
    lastMove = null,
    inCheck = false,
    advantage = 0,
    onThinking,
    repetitionRiskMoves = [],
    shuffleMoves = [],
    shuffleSummary = ''
  }) {
    const modelName = slot === 'white' ? this.config.whiteModel : this.config.blackModel;
    const turnColor = slot === 'white' ? 'White' : 'Black';
    const legalSanList = legalMoves.map(m => m.san);

    if (onThinking) {
      onThinking({ slot, modelName, status: 'thinking' });
    }

    if (this.config.provider === 'offline' || !modelName) {
      return await OfflineEngine.generatePlayerMove({
        legalMoves,
        fen,
        historySan,
        turn: slot === 'white' ? 'w' : 'b',
        repetitionRiskMoves,
        shuffleMoves
      });
    }

    const prompt = buildPlayerPromptContext({
      turn: slot === 'white' ? 'w' : 'b',
      fen,
      board,
      legalMoves,
      historySan,
      opening,
      lastMove,
      inCheck,
      advantage,
      enriched: this.config.enrichedContext !== false,
      repetitionRiskMoves,
      shuffleMoves,
      shuffleSummary
    });

    const hasShuffleRisk = shuffleMoves.length > 0;
    const systemPrompt = `You are an elite chess grandmaster playing as ${turnColor}. Evaluate tactics, King safety, and piece activity. Output strictly valid JSON with a legal move.${hasShuffleRisk ? ' CRITICAL: You must play diverse, progressive moves. NEVER shuffle the same piece back and forth between the same squares. Prioritize pawn advances, piece development to new squares, and creating fresh threats.' : ''}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ];

    let apiResponse = null;
    if (this.config.provider === 'ollama') {
      apiResponse = await OllamaClient.chat({
        baseUrl: this.config.ollamaBaseUrl,
        model: modelName,
        messages,
        temperature: this.config.temperature,
        jsonFormat: true,
        think: this.config.fastThinking === false ? true : false,
        numPredict: this.config.maxTokens || 128,
        timeoutMs: 25000
      });
    } else {
      apiResponse = await OpenAiClient.chat({
        baseUrl: this.config.openaiBaseUrl,
        apiKey: this.config.openaiApiKey,
        model: modelName,
        messages,
        temperature: this.config.temperature,
        jsonMode: true
      });
    }

    if (!apiResponse.success) {
      console.warn(`[${turnColor}] Model call failed:`, apiResponse.error);
      const fallback = legalMoves[0]?.san || 'e4';
      return {
        move: fallback,
        reasoning: `Model ${modelName} error: ${apiResponse.error}. Fallback played.`,
        candidates: [fallback],
        rawResponse: apiResponse.error
      };
    }

    const parsed = this.parseJsonFromResponse(apiResponse.content);
    let chosenMove = parsed?.move?.trim();

    if (!legalSanList.includes(chosenMove)) {
      const uciMatch = legalMoves.find(m => m.uci.toLowerCase() === chosenMove?.toLowerCase());
      chosenMove = uciMatch ? uciMatch.san : legalMoves[0]?.san;
    }

    return {
      move: chosenMove,
      reasoning: parsed?.reasoning || `Model chose ${chosenMove}.`,
      candidates: parsed?.candidates || [chosenMove],
      rawPrompt: prompt,
      rawResponse: apiResponse.content
    };
  }

  async requestArbiterVerdict({
    playerSlot,
    proposedMove,
    playerReasoning,
    candidates = [],
    fen,
    pgn,
    board,
    legalMoves = [],
    historySan = [],
    opening = null,
    lastMove = null,
    inCheck = false,
    onThinking,
    repetitionRiskMoves = [],
    shuffleMoves = [],
    shuffleSummary = ''
  }) {
    const arbiterModel = this.config.arbiterModel;
    const turnColor = playerSlot === 'white' ? 'White' : 'Black';
    const legalSanList = legalMoves.map(m => m.san);

    // If no Middle Decision Model is configured, pass through directly
    if (!arbiterModel) {
      return {
        decision: 'approved',
        finalMove: proposedMove,
        grade: 'Direct Play',
        commentary: 'Direct move execution without Middle Decision Model.',
        hasDecisionModel: false
      };
    }

    if (onThinking) {
      onThinking({ slot: 'arbiter', modelName: arbiterModel, status: 'evaluating' });
    }

    const arbiterState = buildArbiterPromptContext({
      turn: playerSlot === 'white' ? 'w' : 'b',
      proposedMove,
      playerReasoning,
      candidates,
      fen,
      legalMoves,
      lastMove,
      inCheck,
      opening,
      repetitionRiskMoves,
      shuffleMoves,
      shuffleSummary
    });

    // 1. Check if model is a decision model in Ollama
    const isDecisionModel = this.decisionModels.some(m => m.id === arbiterModel);
    if (isDecisionModel && this.config.provider === 'ollama') {
      try {
        const decisionRes = await OllamaClient.decide({
          baseUrl: this.config.ollamaBaseUrl,
          model: arbiterModel,
          state: arbiterState,
          questions: {
            evaluation: {
              type: 'choice',
              instructions: 'Evaluate the chess move proposal',
              criteria: {
                best: 'Best move',
                good: 'Good move',
                inaccuracy: 'Inaccuracy'
              }
            }
          },
          timeoutMs: 8000
        });

        if (decisionRes.success) {
          const outcome = decisionRes.data?.answers?.evaluation?.choice || decisionRes.data?.answers?.evaluation || decisionRes.data?.evaluation || 'good';
          const gradeMap = {
            best: 'Best Move',
            good: 'Good Move',
            inaccuracy: 'Inaccuracy'
          };
          return {
            decision: 'approved',
            finalMove: proposedMove,
            grade: gradeMap[outcome] || 'Best Move',
            commentary: '',
            hasDecisionModel: true,
            rawResponse: JSON.stringify(decisionRes.data)
          };
        }
      } catch (e) {
        // Fallback below
      }
    }

    // 2. Offline fallback engine if timeout or offline provider
    return await OfflineEngine.evaluateArbiterDecision({
      proposedMove,
      playerReasoning,
      legalMoves,
      repetitionRiskMoves,
      shuffleMoves,
      candidates
    });
  }
}
