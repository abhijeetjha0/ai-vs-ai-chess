/**
 * Arbiter Decision Engine: Orchestrates Player Proposals & Middle Decision Model Adjudication
 */

export class DecisionEngine {
  constructor(chessEngine, modelManager) {
    this.chess = chessEngine;
    this.models = modelManager;
    this.isRunning = false;
    this.isPaused = false;
    this.turnDelay = 2000; // milliseconds between turns in auto mode
    this.abortController = null;
    this.turnInProgress = false;
  }

  setSpeed(delayMs) {
    this.turnDelay = Math.max(500, Math.min(10000, delayMs));
  }

  isExecuting() {
    return this.turnInProgress;
  }

  /**
   * Executes a complete single turn with:
   * 1. Player Model Proposal
   * 2. Middle Decision Model Adjudication & Grading
   * 3. Board Move Execution
   */
  async playSingleTurn(callbacks = {}) {
    if (this.chess.isGameOver()) {
      const details = this.chess.getGameOverDetails();
      if (callbacks.onGameOver) callbacks.onGameOver(details);
      return { success: false, reason: 'Game over' };
    }

    if (this.turnInProgress) {
      return { success: false, reason: 'Turn already in progress' };
    }

    this.turnInProgress = true;
    const currentTurn = this.chess.getTurn(); // 'w' or 'b'
    const playerSlot = currentTurn === 'w' ? 'white' : 'black';
    const fen = this.chess.getFen();
    const pgn = this.chess.getPgn();
    const legalMoves = this.chess.getLegalMoves();
    const historySan = this.chess.getHistorySan();

    try {
      // 1. Player Model Thinking Phase
      if (callbacks.onPlayerThinking) {
        callbacks.onPlayerThinking({
          slot: playerSlot,
          turnColor: currentTurn === 'w' ? 'White' : 'Black',
          fen
        });
      }

      const playerResult = await this.models.requestPlayerMove({
        slot: playerSlot,
        fen,
        pgn,
        legalMoves,
        historySan,
        onThinking: callbacks.onThinkingDetails
      });

      if (callbacks.onPlayerProposed) {
        callbacks.onPlayerProposed({
          slot: playerSlot,
          move: playerResult.move,
          reasoning: playerResult.reasoning,
          candidates: playerResult.candidates,
          rawPrompt: playerResult.rawPrompt,
          rawResponse: playerResult.rawResponse
        });
      }

      // 2. Middle Decision Model Adjudication Phase
      if (callbacks.onArbiterEvaluating) {
        callbacks.onArbiterEvaluating({
          proposedMove: playerResult.move,
          playerReasoning: playerResult.reasoning,
          candidates: playerResult.candidates
        });
      }

      const arbiterResult = await this.models.requestArbiterVerdict({
        playerSlot,
        proposedMove: playerResult.move,
        playerReasoning: playerResult.reasoning,
        candidates: playerResult.candidates,
        fen,
        pgn,
        legalMoves,
        historySan,
        onThinking: callbacks.onThinkingDetails
      });

      if (callbacks.onArbiterVerdict) {
        callbacks.onArbiterVerdict({
          slot: playerSlot,
          proposedMove: playerResult.move,
          finalMove: arbiterResult.finalMove,
          grade: arbiterResult.grade,
          commentary: arbiterResult.commentary,
          rawPrompt: arbiterResult.rawPrompt,
          rawResponse: arbiterResult.rawResponse
        });
      }

      // 3. Execution on the Chess Board
      const executedMove = this.chess.makeMove(arbiterResult.finalMove);

      if (!executedMove) {
        // Fallback safety move if SAN mismatch
        const emergencyMove = legalMoves[0]?.san;
        const fallbackExecuted = this.chess.makeMove(emergencyMove);
        if (callbacks.onMoveExecuted) {
          callbacks.onMoveExecuted({
            move: fallbackExecuted,
            fen: this.chess.getFen(),
            history: this.chess.getHistorySan(),
            isGameOver: this.chess.isGameOver()
          });
        }
      } else {
        if (callbacks.onMoveExecuted) {
          callbacks.onMoveExecuted({
            move: executedMove,
            fen: this.chess.getFen(),
            history: this.chess.getHistorySan(),
            isGameOver: this.chess.isGameOver()
          });
        }
      }

      // Check game over
      if (this.chess.isGameOver()) {
        const details = this.chess.getGameOverDetails();
        if (callbacks.onGameOver) callbacks.onGameOver(details);
      }

      this.turnInProgress = false;
      return { success: true };
    } catch (err) {
      this.turnInProgress = false;
      console.error('Turn execution error:', err);
      if (callbacks.onError) callbacks.onError(err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Starts Automated Continuous Match Loop
   */
  async startAutomation(callbacks = {}) {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;

    if (callbacks.onAutoStateChange) {
      callbacks.onAutoStateChange({ isRunning: true, isPaused: false });
    }

    while (this.isRunning && !this.chess.isGameOver()) {
      if (this.isPaused) {
        await new Promise(r => setTimeout(r, 200));
        continue;
      }

      const turnResult = await this.playSingleTurn(callbacks);
      if (!turnResult.success && turnResult.reason === 'Game over') {
        break;
      }

      // Delay between turns
      if (this.isRunning && !this.isPaused && !this.chess.isGameOver()) {
        await new Promise(r => setTimeout(r, this.turnDelay));
      }
    }

    this.isRunning = false;
    if (callbacks.onAutoStateChange) {
      callbacks.onAutoStateChange({ isRunning: false, isPaused: false });
    }
  }

  pauseAutomation(callbacks = {}) {
    if (!this.isRunning) return;
    this.isPaused = true;
    if (callbacks.onAutoStateChange) {
      callbacks.onAutoStateChange({ isRunning: true, isPaused: true });
    }
  }

  resumeAutomation(callbacks = {}) {
    if (!this.isRunning) return;
    this.isPaused = false;
    if (callbacks.onAutoStateChange) {
      callbacks.onAutoStateChange({ isRunning: true, isPaused: false });
    }
  }

  stopAutomation(callbacks = {}) {
    this.isRunning = false;
    this.isPaused = false;
    if (callbacks.onAutoStateChange) {
      callbacks.onAutoStateChange({ isRunning: false, isPaused: false });
    }
  }
}
