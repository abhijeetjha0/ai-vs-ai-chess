import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, Button, Toast, ToastContainer, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { ChessGameEngine } from './chess/engine.js';
import { detectOpening } from './chess/openings.js';
import { evaluatePosition } from './chess/evaluator.js';
import { ModelManager } from './api/model-manager.js';

import ChessBoard from './components/ChessBoard.jsx';
import EvalBar from './components/EvalBar.jsx';
import Controls from './components/Controls.jsx';
import PlayerStatus from './components/PlayerStatus.jsx';
import ArbiterCard from './components/ArbiterCard.jsx';
import MoveLog from './components/MoveLog.jsx';
import ApiDrawer from './components/ApiDrawer.jsx';
import HelpModal from './components/HelpModal.jsx';

export default function App() {
  // Ref singletons
  const engineRef = useRef(new ChessGameEngine());
  const modelManagerRef = useRef(new ModelManager());

  // Game state
  const [board, setBoard] = useState(() => engineRef.current.getBoard());
  const [turn, setTurn] = useState(() => engineRef.current.getTurn());
  const [historySan, setHistorySan] = useState(() => engineRef.current.getHistorySan());
  const [lastMove, setLastMove] = useState(null);
  const [captures, setCaptures] = useState(() => engineRef.current.getCapturedPieces());
  const [opening, setOpening] = useState({ name: 'Starting Position', eco: 'A00' });
  const [evalData, setEvalData] = useState({ whiteWinChance: 50, formatted: '0.0' });
  const [kingInCheck, setKingInCheck] = useState(null);
  const [gameOver, setGameOver] = useState(null);
  const [flipped, setFlipped] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Match control state
  const [mode, setMode] = useState('auto'); // 'auto' | 'manual'
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [turnInProgress, setTurnInProgress] = useState(false);
  const [turnDelay, setTurnDelay] = useState(() => modelManagerRef.current?.config?.turnDelay || 2000);

  // Model & Provider state
  const [config, setConfig] = useState(() => modelManagerRef.current.config);
  const [chatModels, setChatModels] = useState([]);
  const [decisionModels, setDecisionModels] = useState([]);
  const [ollamaConnected, setOllamaConnected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Turn thought and Arbiter state
  const [whiteThought, setWhiteThought] = useState({ move: null, reasoning: '' });
  const [blackThought, setBlackThought] = useState({ move: null, reasoning: '' });
  const [arbiterState, setArbiterState] = useState({
    isEvaluating: false,
    proposedMove: null,
    finalMove: null,
    grade: '',
    commentary: ''
  });
  const [thoughtEntries, setThoughtEntries] = useState([]);

  // Toast notifications
  const [toast, setToast] = useState(null);
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // Refresh available models dynamically
  const fetchAvailableModels = useCallback(async () => {
    setIsRefreshing(true);
    const res = await modelManagerRef.current.refreshAvailableModels();
    setIsRefreshing(false);
    if (res.success) {
      setChatModels(res.chatModels || []);
      setDecisionModels(res.decisionModels || []);
      setOllamaConnected(res.provider === 'ollama');
      setConfig({ ...modelManagerRef.current.config });
    } else {
      setChatModels([]);
      setDecisionModels([]);
      setOllamaConnected(false);
      setConfig({ ...modelManagerRef.current.config });
    }
  }, []);

  // Initial load: fetch real models
  useEffect(() => {
    fetchAvailableModels();
  }, [fetchAvailableModels]);

  // Update position stats (Eval bar and Opening)
  const syncPositionStats = useCallback(() => {
    const engine = engineRef.current;
    const currentFen = engine.getFen();
    const currentHist = engine.getHistorySan();

    setBoard(engine.getBoard());
    setTurn(engine.getTurn());
    setHistorySan(currentHist);
    setCaptures(engine.getCapturedPieces());
    setKingInCheck(engine.inCheck() ? engine.findKingSquare() : null);

    // Opening
    detectOpening(currentFen, currentHist).then(setOpening);

    // Eval
    evaluatePosition(engine).then((res) => {
      setEvalData({
        whiteWinChance: res.whiteWinChance,
        formatted: res.formatted
      });
    });

    if (engine.isGameOver()) {
      const details = engine.getGameOverDetails();
      setGameOver(details);
      setIsRunning(false);
    }
  }, []);

  // Execute a single turn cycle (Player thinks -> Arbiter adjudicates -> Move executed)
  const executeTurn = useCallback(async () => {
    const engine = engineRef.current;
    const mm = modelManagerRef.current;

    if (engine.isGameOver()) {
      setIsRunning(false);
      return;
    }

    setTurnInProgress(true);
    const currentTurn = engine.getTurn();
    const slot = currentTurn === 'w' ? 'white' : 'black';
    const fen = engine.getFen();
    const pgn = engine.getPgn();
    const legalMoves = engine.getLegalMoves();
    const { safeMoves, filteredOut, hasRepetitionRisk } = engine.getMovesAvoidingRepetition();
    const repetitionRiskSans = filteredOut.map(m => m.san);
    const shuffleAnalysis = engine.getShuffleAnalysis();
    const history = engine.getHistorySan();
    const turnNumber = Math.floor(history.length / 2) + 1;

    try {
      // 1. Player Model Thinking Phase
      // Send safe moves (excluding repetition-causing ones) to the AI,
      // but also pass the full legal moves list for reference.
      const movesForAI = hasRepetitionRisk ? safeMoves : legalMoves;
      const playerRes = await mm.requestPlayerMove({
        slot,
        fen,
        pgn,
        board: engine.getBoard(),
        legalMoves: movesForAI,
        allLegalMoves: legalMoves,
        historySan: history,
        opening,
        lastMove: engine.getLastMove(),
        inCheck: engine.inCheck(),
        advantage: engine.getMaterialAdvantage(currentTurn),
        repetitionRiskMoves: repetitionRiskSans,
        shuffleMoves: shuffleAnalysis.shuffleMoves,
        shuffleSummary: shuffleAnalysis.shuffleSummary
      });

      const proposedMove = playerRes.move;
      const reasoning = playerRes.reasoning;

      if (slot === 'white') {
        setWhiteThought({ move: proposedMove, reasoning });
      } else {
        setBlackThought({ move: proposedMove, reasoning });
      }

      // 2. Middle Decision Model Adjudication Phase (only if decision capable models exist)
      let finalMove = proposedMove;
      let grade = '';
      let commentary = '';
      const hasArbiter = Boolean(
        decisionModels.length > 0 &&
        config.arbiterModel &&
        decisionModels.some(m => m.id === config.arbiterModel)
      );

      if (hasArbiter) {
        setArbiterState({
          isEvaluating: true,
          proposedMove,
          finalMove: null,
          grade: '',
          commentary: ''
        });

        const arbiterRes = await mm.requestArbiterVerdict({
          playerSlot: slot,
          proposedMove,
          playerReasoning: reasoning,
          candidates: playerRes.candidates || [proposedMove],
          fen,
          pgn,
          board: engine.getBoard(),
          legalMoves,
          historySan: history,
          opening,
          lastMove: engine.getLastMove(),
          inCheck: engine.inCheck(),
          repetitionRiskMoves: repetitionRiskSans,
          shuffleMoves: shuffleAnalysis.shuffleMoves,
          shuffleSummary: shuffleAnalysis.shuffleSummary
        });

        finalMove = arbiterRes.finalMove || proposedMove;
        grade = arbiterRes.grade || 'Best Move';
        commentary = arbiterRes.commentary || '';

        setArbiterState({
          isEvaluating: false,
          proposedMove,
          finalMove,
          grade,
          commentary
        });
      } else {
        // Direct move execution without Middle Decision Model
        finalMove = proposedMove;
      }

      // 3. Move Execution on Board — with threefold repetition & dynamic anti-shuffle safety net
      let moveToPlay = finalMove;
      if (hasRepetitionRisk && engine.wouldCauseRepetition(moveToPlay)) {
        // AI ignored the repetition warning — substitute with a safe diverse alternative
        const safeAlternative = engine.getDiverseAlternative([moveToPlay, ...repetitionRiskSans]);
        if (safeAlternative) {
          console.warn(`[Anti-Repetition] AI chose ${moveToPlay} which causes threefold repetition. Substituting with ${safeAlternative}.`);
          moveToPlay = safeAlternative;
        }
      } else if (shuffleAnalysis.isShuffling && shuffleAnalysis.shuffleMoves.includes(moveToPlay)) {
        // AI attempted to repeat an oscillating piece shuffle
        const repeatCount = shuffleAnalysis.recentSanRepeatCount.get(moveToPlay) || 0;
        if (repeatCount >= 2) {
          const diverseAlternative = engine.getDiverseAlternative([moveToPlay, ...repetitionRiskSans, ...shuffleAnalysis.shuffleMoves]);
          if (diverseAlternative && diverseAlternative !== moveToPlay) {
            console.warn(`[Anti-Shuffle] AI is oscillating with ${moveToPlay} (${repeatCount}x in recent window). Breaking loop with progressive move ${diverseAlternative}.`);
            moveToPlay = diverseAlternative;
          }
        }
      }
      const executed = engine.makeMove(moveToPlay);
      if (executed) {
        setLastMove({ from: executed.from, to: executed.to });
      }

      // 4. Record Thought Stream Entry
      const whiteName = config.whiteModel || 'White Model';
      const blackName = config.blackModel || 'Black Model';
      const arbiterName = hasArbiter ? config.arbiterModel : null;

      setThoughtEntries((prev) => [
        ...prev,
        {
          turnNumber,
          playerSlot: slot,
          modelName: slot === 'white' ? whiteName : blackName,
          proposedMove,
          reasoning,
          arbiterModel: arbiterName,
          finalMove,
          grade,
          commentary
        }
      ]);

      syncPositionStats();
    } catch (err) {
      console.error('Turn error:', err);
    } finally {
      setTurnInProgress(false);
    }
  }, [config, decisionModels, syncPositionStats]);

  // Automated match loop
  useEffect(() => {
    let timeoutId;
    if (isRunning && !isPaused && !turnInProgress && !gameOver) {
      timeoutId = setTimeout(() => {
        executeTurn();
      }, turnDelay);
    }
    return () => clearTimeout(timeoutId);
  }, [isRunning, isPaused, turnInProgress, gameOver, turnDelay, executeTurn]);

  // Handlers
  const handleConfigChange = (updated) => {
    const providerChanged = Boolean(updated.provider && updated.provider !== config.provider);
    modelManagerRef.current.saveConfig(updated);
    setConfig({ ...modelManagerRef.current.config, ...updated });
    if (updated.turnDelay !== undefined) {
      setTurnDelay(updated.turnDelay);
    }
    if (providerChanged) {
      setTimeout(() => fetchAvailableModels(), 50);
    }
  };

  const handleStartAuto = () => {
    if (gameOver) handleResetMatch();
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePauseResumeAuto = () => {
    setIsPaused((prev) => !prev);
  };

  const handleStopAuto = () => {
    setIsRunning(false);
    setIsPaused(false);
  };

  const handlePlayTurnManual = () => {
    if (!turnInProgress && !gameOver) {
      executeTurn();
    }
  };

  const handleResetMatch = () => {
    setIsRunning(false);
    setIsPaused(false);
    engineRef.current.reset();
    setLastMove(null);
    setGameOver(null);
    setWhiteThought({ move: null, reasoning: '' });
    setBlackThought({ move: null, reasoning: '' });
    setArbiterState({
      isEvaluating: false,
      proposedMove: null,
      finalMove: null,
      grade: '',
      commentary: ''
    });
    setThoughtEntries([]);
    syncPositionStats();
    showToast('Match reset to starting position');
  };

  const handleUserManualMove = (san) => {
    const executed = engineRef.current.makeMove(san);
    if (executed) {
      setLastMove({ from: executed.from, to: executed.to });
      setArbiterState({
        isEvaluating: false,
        proposedMove: san,
        finalMove: san,
        grade: 'Manual Play',
        commentary: `Player made move ${san} manually on the board.`
      });
      syncPositionStats();
    }
  };

  const handleCopyFen = () => {
    navigator.clipboard.writeText(engineRef.current.getFen());
    showToast('FEN copied to clipboard!');
  };

  const handleExportPgn = () => {
    const pgn = engineRef.current.getPgn();
    const blob = new Blob([pgn], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `match_${Date.now()}.pgn`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('PGN match notation downloaded!');
  };

  const handleToggleSound = () => {
    const muted = engineRef.current.audio.toggleMute();
    setIsMuted(muted);
    return muted;
  };

  const currentLegalMoves = engineRef.current.getLegalMoves();

  return (
    <div className="app-layout">
      {/* BACKGROUND ATMOSPHERE */}
      <div className="arena-bg-grid" />
      <div className="arena-bg-glow glow-cyan" />
      <div className="arena-bg-glow glow-purple" />

      {/* UNIFIED COMPACT TOP HEADER PANEL */}
      <header className="arena-header glass-panel d-flex align-items-center justify-content-between">
        <div className="header-brand flex-shrink-0 d-flex align-items-center gap-3">
          <div className="brand-logo-icon">
            <span className="material-symbols-rounded brand-symbol">crown</span>
            <span className="material-symbols-rounded icon-sparkle">auto_awesome</span>
          </div>
          <div className="brand-text">
            <h1 className="brand-title mb-0">AI vs AI <span className="gradient-text">Chess</span></h1>
            <p className="brand-subtitle d-none d-md-block mb-0">
              {decisionModels.length > 0 && config.arbiterModel && decisionModels.some((m) => m.id === config.arbiterModel)
                ? 'Automated Multi-Model Chess with Decision Model'
                : 'Automated Multi-Model Chess Arena'}
            </p>
          </div>
        </div>

        {/* RIGHT ACTIONS: PROVIDER STATUS + MATCH STATUS + SETTINGS */}
        <div className="header-actions-group d-flex align-items-center gap-2">
          {/* PROVIDER INDICATOR */}
          <div className="compact-provider-pill d-flex align-items-center gap-1 px-2 py-1 rounded-pill">
            <span className={`status-dot ${ollamaConnected ? 'connected' : 'offline'}`} />
            <span className="provider-name small text-light text-opacity-90">
              {config.provider === 'ollama' ? 'Ollama' : config.provider === 'openai' ? 'OpenAI' : 'Local'}
            </span>
            <OverlayTrigger
              placement="bottom"
              delay={{ show: 100, hide: 50 }}
              overlay={<Tooltip id="tt-refresh">Refresh</Tooltip>}
            >
              <Button
                variant="link"
                size="sm"
                className="btn-icon-refresh p-0 text-decoration-none"
                onClick={fetchAvailableModels}
                disabled={isRefreshing}
                aria-label="Refresh Models"
              >
                <span className={`material-symbols-rounded fs-6 align-middle ${isRefreshing ? 'spin' : ''}`}>
                  refresh
                </span>
              </Button>
            </OverlayTrigger>
          </div>

          {/* USER MANUAL / HELP ICON */}
          <OverlayTrigger
            placement="bottom"
            delay={{ show: 100, hide: 50 }}
            overlay={<Tooltip id="tt-help">User Manual</Tooltip>}
          >
            <button
              type="button"
              className="btn-help-icon flex-shrink-0"
              onClick={() => setIsHelpOpen(true)}
              aria-label="User Manual"
            >
              <span className="material-symbols-rounded">help</span>
            </button>
          </OverlayTrigger>

          {/* RIGHT-MOST API SETTINGS ICON */}
          <OverlayTrigger
            placement="bottom"
            delay={{ show: 100, hide: 50 }}
            overlay={<Tooltip id="tt-settings">Settings</Tooltip>}
          >
            <button
              type="button"
              className="btn-settings-icon flex-shrink-0"
              onClick={() => setIsDrawerOpen(true)}
              aria-label="API Settings"
            >
              <span className="material-symbols-rounded">settings</span>
            </button>
          </OverlayTrigger>
        </div>
      </header>

      {/* MAIN ARENA GRID (2 COLUMNS: STAGE ON LEFT, COMPACT CARDS & LOG ON RIGHT) */}
      <main className="arena-main-grid">
        {/* STAGE: CHESSBOARD, BOTTOM EVAL BAR & CONTROLS */}
        <section className="col-stage">
          <div className="board-stage-wrapper">
            <div className="board-center-container">
              <ChessBoard
                board={board}
                turn={turn}
                legalMoves={currentLegalMoves}
                lastMove={lastMove}
                kingInCheckSquare={kingInCheck}
                flipped={flipped}
                interactive={mode === 'manual'}
                onUserMove={handleUserManualMove}
              />
            </div>

            {/* HORIZONTAL EVALUATION BAR AT THE BOTTOM */}
            <EvalBar
              whiteWinChance={evalData.whiteWinChance}
              scoreFormatted={evalData.formatted}
              flipped={flipped}
            />
          </div>
        </section>

        {/* RIGHT COLUMN: PLAYER 1, PLAYER 2, DECISION, CONTROLS & HISTORY */}
        <aside className="col-arbiter-history">
          {/* PLAYER 1 (WHITE) */}
          <PlayerStatus
            playerNumber={1}
            color="white"
            model={config.whiteModel}
            models={chatModels}
            onModelChange={(newModel) => handleConfigChange({ whiteModel: newModel })}
            isActiveTurn={turn === 'w'}
            isThinking={turnInProgress && turn === 'w'}
            capturedPieces={captures.whiteCaptured}
            advantage={captures.whiteAdvantage > 0 ? captures.whiteAdvantage : 0}
            lastMove={whiteThought.move}
            lastReasoning={whiteThought.reasoning}
          />

          {/* PLAYER 2 (BLACK) */}
          <PlayerStatus
            playerNumber={2}
            color="black"
            model={config.blackModel}
            models={chatModels}
            onModelChange={(newModel) => handleConfigChange({ blackModel: newModel })}
            isActiveTurn={turn === 'b'}
            isThinking={turnInProgress && turn === 'b'}
            capturedPieces={captures.blackCaptured}
            advantage={captures.whiteAdvantage < 0 ? Math.abs(captures.whiteAdvantage) : 0}
            lastMove={blackThought.move}
            lastReasoning={blackThought.reasoning}
          />

          {/* MIDDLE DECISION MODEL (ARBITER) */}
          {decisionModels.length > 0 && config.arbiterModel && decisionModels.some((m) => m.id === config.arbiterModel) && (
            <ArbiterCard
              model={config.arbiterModel}
              decisionModels={decisionModels}
              onModelChange={(newModel) => handleConfigChange({ arbiterModel: newModel })}
              isEvaluating={arbiterState.isEvaluating}
              proposedMove={arbiterState.proposedMove}
              finalMove={arbiterState.finalMove}
              grade={arbiterState.grade}
              commentary={arbiterState.commentary}
            />
          )}

          {/* ARENA CONTROLS */}
          <Controls
            mode={mode}
            onModeChange={(m) => {
              if (m === 'manual' && isRunning) {
                setIsRunning(false);
                setIsPaused(false);
              }
              setMode(m);
            }}
            isRunning={isRunning}
            isPaused={isPaused}
            turnInProgress={turnInProgress}
            turnDelay={turnDelay}
            onSpeedChange={setTurnDelay}
            onStartAuto={handleStartAuto}
            onPauseResumeAuto={handlePauseResumeAuto}
            onStopAuto={handleStopAuto}
            onPlayTurn={handlePlayTurnManual}
            onResetMatch={handleResetMatch}
            onFlipBoard={() => setFlipped((f) => !f)}
            isMuted={isMuted}
            onToggleSound={handleToggleSound}
            onCopyFen={handleCopyFen}
            onExportPgn={handleExportPgn}
          />

          {/* AI THOUGHTS STREAM LOG */}
          <MoveLog
            thoughtEntries={thoughtEntries}
          />
        </aside>
      </main>

      {/* GAME OVER MODAL (REACT BOOTSTRAP MODAL) */}
      <Modal
        show={Boolean(gameOver)}
        onHide={() => setGameOver(null)}
        centered
        data-bs-theme="dark"
        className="gameover-modal"
        dialogClassName="gameover-dialog"
      >
        <Modal.Body className="text-center p-4 text-light">
          <div className="gameover-trophy d-flex align-items-center justify-content-center gap-2 mb-2">
            {gameOver?.winner ? (
              <span className="material-symbols-rounded text-warning" style={{ fontSize: '3.5rem' }}>emoji_events</span>
            ) : (
              <span className="material-symbols-rounded text-info" style={{ fontSize: '3.5rem' }}>handshake</span>
            )}
          </div>
          <h2 className="gameover-title h3 fw-bold mb-2">
            {gameOver?.reason === 'Checkmate' ? `Checkmate! ${gameOver.winner} Wins!` : `Draw! (${gameOver?.reason})`}
          </h2>
          <p className="gameover-desc text-muted mb-4">{gameOver?.description}</p>
          <div className="gameover-actions d-flex justify-content-center gap-3">
            <Button variant="outline-secondary" className="px-3" onClick={() => setGameOver(null)}>
              Review Board
            </Button>
            <Button variant="primary" className="btn-glow px-4" onClick={() => { handleResetMatch(); handleStartAuto(); }}>
              Start Rematch
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* API CONFIG DRAWER */}
      <ApiDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        config={config}
        turnDelay={turnDelay}
        onSpeedChange={setTurnDelay}
        onSaveConfig={handleConfigChange}
        onRefreshModels={fetchAvailableModels}
        isRefreshing={isRefreshing}
      />

      {/* TOAST NOTIFICATION (REACT BOOTSTRAP TOAST) */}
      <ToastContainer position="bottom-center" className="p-3 position-fixed" style={{ zIndex: 9999 }}>
        <Toast
          show={Boolean(toast)}
          onClose={() => setToast(null)}
          delay={2500}
          autohide
          bg="dark"
          data-bs-theme="dark"
          className="border-secondary border-opacity-50 text-light shadow-lg"
        >
          <Toast.Body className="d-flex align-items-center gap-2 py-2 px-3">
            <span className="material-symbols-rounded text-warning fs-5">auto_awesome</span>
            <span className="small fw-semibold">{toast}</span>
          </Toast.Body>
        </Toast>
      </ToastContainer>

      {/* IN-APP USER MANUAL MODAL */}
      <HelpModal
        show={isHelpOpen}
        onHide={() => setIsHelpOpen(false)}
      />
    </div>
  );
}
