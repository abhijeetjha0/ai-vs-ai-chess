# AI vs AI Chess ♟️

**AI vs AI Chess** is an automated multi-model chess web application featuring AI player models (White and Black) and an independent Middle Decision Arbiter model. It supports local Ollama models (with MLX acceleration, Fast Reasoning CoT bypass, and structured schema outputs), OpenAI-compatible APIs, and a fallback offline engine.

---

## 📋 Prerequisites & System Requirements

Before running the application, ensure your environment meets the requirements below.

### 1. Core Development Environment
* **Node.js**: Version **18.0.0** or higher (**Node.js 20+ LTS** recommended).
  * Check version: `node -v`
* **npm**: Version **9.0.0** or higher (bundled with Node.js) or `pnpm` / `yarn`.
  * Check version: `npm -v`
* **Operating System**: macOS (Apple Silicon or Intel), Linux, or Windows (WSL2 recommended).
* **Modern Web Browser**: Google Chrome, Brave, Microsoft Edge, Safari, or Firefox with CSS `backdrop-filter` and Web Audio API support.

---

### 2. AI Provider Setup (Choose One or More)

The application supports three flexible AI provider modes. You only need to set up the one you intend to use.

#### Option A: Local Ollama (Recommended for Free, Local Play)
To run models locally on your GPU/CPU with complete privacy:

1. **Install Ollama**:
   * Download and install from [ollama.com](https://ollama.com/download).
2. **Configure CORS (Crucial for Browser Frontend)**:
   * By default, Ollama blocks browser requests from different origins (`http://localhost:5174`). You must start Ollama with `OLLAMA_ORIGINS="*"`:
     * **macOS / Linux**:
       ```bash
       OLLAMA_ORIGINS="*" ollama serve
       ```
       *Persistent on macOS*:
       ```bash
       launchctl setenv OLLAMA_ORIGINS "*"
       ```
     * **Windows**:
       Set the system environment variable `OLLAMA_ORIGINS` to `*` in System Properties, then restart Ollama.
3. **Pull Recommended Models**:
   * **Player Models** (White and Black):
     ```bash
     # Lightweight & Fast (Recommended for quick turns)
     ollama pull gemma3:270m
     ollama pull qwen2.5:0.5b
     ollama pull llama3.2:1b

     # Stronger Players
     ollama pull llama3.2:3b
     ollama pull qwen2.5:7b
     ```
   * **Decision Models** (for Middle Decision Arbiter):
     ```bash
     # Structured decision / MLX models
     ollama pull laya:421m-typed-decisions-mlx-fp16
     ```
     *(The Arbiter automatically filters for models possessing decision capabilities, and unmounts cleanly if none are available).*

#### Option B: OpenAI-Compatible Cloud APIs (Optional)
If you prefer running cloud models (OpenAI, Groq, OpenRouter, LM Studio, or vLLM):
* An API Key from [OpenAI](https://platform.openai.com/), [Groq](https://console.groq.com/), or [OpenRouter](https://openrouter.ai/).
* Custom endpoint URL (e.g. `https://api.openai.com/v1`, `https://api.groq.com/openai/v1`, or local `http://127.0.0.1:1234/v1` for LM Studio).

#### Option C: Built-in Offline Engine (Zero Setup)
* **No external software required**: If Ollama is not installed or unreachable, the application automatically falls back to its built-in rule-based heuristic engine and offline evaluator. You can start playing immediately with zero external dependencies.

---

## 🚀 Installation & Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/abhijeetjha0/ai-vs-ai-chess.git
cd ai-vs-ai-chess
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Launch Development Server
```bash
npm run dev
```
Open your browser to the URL displayed in the terminal (typically [http://localhost:5174](http://localhost:5174)).

### 4. Run Automated Test Suite
Verify chess rule validation, offline heuristics, and model JSON parsers:
```bash
npm test
```

### 5. Build for Production
```bash
npm run build
```

---

## 📖 In-App UI Manual & Help Center

The application features an exhaustive, searchable **In-App User Manual**:
* **Top Header**: Click the **User Manual** button (`help` icon) next to the Settings gear icon in the top header.
* **In-Page Search**: Filter across all features, rules, and steps in real time.
* **Category Navigation**: Filter by *Chessboard & Stage*, *Controls & Match Modes*, *AI Models & Arbiter*, *Analysis & Live Thoughts*, *API & Settings*, and *End of Match*.
* **Step-by-Step Guides**: Numbered instructions (`1. `, `2. `) detailing exact UI interactions and button actions.

> **Note**: The in-app manual is bundled directly into the client bundle and is fully available offline and on static deployments (e.g., GitHub Pages).

---

## ✨ Features & Architecture

* **2-Column Stage Layout**:
  * **Left Stage**: Interactive 8x8 chessboard with Staunton vector SVG pieces, legal move destination rings, king-in-check indicators, single-row controls, and a responsive bottom evaluation bar.
  * **Right Sidebar**: Streamlined vertical stack featuring Player 1 (White), Player 2 (Black), Decision Model, and live AI Thoughts stream.
* **In-Card Model Selectors**:
  * Independent model selection dropdowns directly inside Player 1, Player 2, and Decision cards, eliminating header clutter.
* **Decision Model (Arbiter)**:
  * Gated strictly to decision-capable models (`caps.includes('decision')`).
  * Intercepts the active player's proposed move, adjudicating quality grades (`Best Move`, `Good Move`, `Inaccuracy`, `Brilliant`, `Blunder`) with balanced dual-tile layout and Google Material Symbols.
  * Automatically unmounts if no decision models exist.
* **Horizontal Bottom Evaluation Bar**:
  * Smooth White-advantage gradient fill with center numerical score capsule (`+1.4`, `-0.8`, `0.0`).
  * Automatically flips orientation when the board is flipped to Black's perspective.
* **Dual Match Modes**:
  * **Automated Match**: Continuous AI-versus-AI play with playback controls (`Start`, `Pause`, `Resume`, `Stop`) and a speed slider (`0.5s` to `5.0s`).
  * **Manual Mode**: Interactive board play with click-to-move piece interaction and single-turn **Step AI** execution.
* **Live AI Thoughts Stream**:
  * Displays real-time model reasoning, proposed moves, and color-coded decision verdicts with automatic smooth scrolling.
* **Strict Iconography Standards**:
  * 100% Google Material Symbols Rounded (`<span className="material-symbols-rounded">`) with single-word action hover tooltips. Zero raw emojis or Unicode glyphs.
* **Dark Glassmorphism Design System**:
  * Deep cyber dark theme with HSL color tokens, backdrop blur filters, and glowing accents.

---

## 🧠 Model & Decision Architecture: In-Depth Logic

This application features a multi-agent chess decision pipeline where **Player Models** propose moves and an independent **Decision Model** acts as an intermediary judge. Below is a detailed technical walkthrough of how turn deliberation, real-time interception, guaranteed move legality, and timing operate.

### 1. Three-Phase Real-Time Turn Interception Pipeline

When a turn begins (either autonomously in Automated Match mode or via **Step AI** in Manual Mode), execution proceeds through three distinct phases:

```
┌──────────────────────────────────────┐
│  Phase 1: Player Proposal            │
│  - Active Player LLM (White / Black) │ ──> Generates candidate SAN move & CoT reasoning
└──────────────────┬───────────────────┘
                   │ (Candidate move intercepted BEFORE board execution)
                   ▼
┌──────────────────────────────────────┐
│  Phase 2: Decision Adjudication      │
│  - Independent Decision Model        │ ──> Evaluates tactical soundness & candidate moves
│  - Structured Schema Output          │ ──> Assigns quality grade (Best, Good, Inaccuracy, etc.)
└──────────────────┬───────────────────┘ ──> Emits approved finalMove
                   │
                   ▼
┌──────────────────────────────────────┐
│  Phase 3: Guaranteed Execution       │
│  - FIDE Engine (chess.js)            │ ──> Commits finalMove, updates board, animates pieces
│  - Live Evaluator                    │ ──> Recalculates win % and material advantage
└──────────────────────────────────────┘
```

#### Phase 1: Player Deliberation & Enriched Context
1. The active player model (Player 1 White or Player 2 Black) receives a high-signal, token-efficient chess prompt:
   - **2D Visual Board Grid**: An 8x8 ASCII board representation (White uppercase `P, N, B, R, Q, K`, Black lowercase `p, n, b, r, q, k`) granting immediate 2D spatial orientation.
   - **Tactical Move Clustering**: Legal moves grouped into high-priority tactical clusters:
     - *Captures & Tactical Attacks* (e.g. `exd5`, `Nxe4`)
     - *Forcing Checks* (e.g. `Qh5+`, `Bb5+`)
     - *King Safety & Castling* (`O-O`, `O-O-O`)
     - *Positional & Quiet Moves*
   - **Situational Awareness**: Explicit status indicators including King check status (`⚠️ IN CHECK`), opponent's preceding move, and material advantage balance.
   - **Opening Theory Activation**: Detected opening book name and ECO code (e.g. `Italian Game (C50)`).
   - Forsyth–Edwards Notation (FEN) and recent ply history.
2. The player model conducts internal reasoning and outputs a proposed move alongside its tactical reasoning and candidate moves considered.

#### Phase 2: Decision Interception & Adjudication
1. **Real-Time Interception**: The player's proposal **never touches the board immediately**. Instead, the Decision Model intercepts the candidate move while the player card displays an awaiting state.
2. **Context-Aware Adjudication**: The Decision Model receives the full tactical position, whether the proposed move is a capture or check, the preceding opponent move, and the **player's considered candidate alternatives** (`Candidates considered: [Qxd8+, Nf3]`) to detect tactical oversights and evaluate move accuracy.
3. **Structured Verdict Schema**: Using strict JSON schema outputs, the Decision Model returns:
   - `approved`: Boolean indicating whether the move is tactically sound.
   - `finalMove`: The verified SAN move (it may approve the player's proposal or substitute a stronger legal alternative).
   - `grade`: Move quality classification (`Brilliant`, `Best Move`, `Good Move`, `Inaccuracy`, `Blunder`, or `Solid`).
   - `commentary`: Concise grandmaster-level evaluation.
4. If no decision-capable model is configured, this phase safely bypasses and passes the player proposal directly to Phase 3.

#### Phase 3: Engine Execution & Live Feedback
1. The `finalMove` is applied to the official `chess.js` engine instance.
2. The chessboard updates, triggering piece transition animations, capture counts, and king-in-check indicators.
3. The horizontal evaluation bar updates live win probabilities.
4. The full deliberation and decision verdict stream directly into the **AI Thoughts** card with color-coded badges (`#38bdf8` for Good Move, `#f59e0b` for Inaccuracy, `#06b6d4` for Best Move, `#34d399` for Brilliant, `#f43f5e` for Blunder).

---

### 2. Guaranteed Move Legality: 5-Layer Defense-in-Depth

All moves are strictly guaranteed to be legal according to official FIDE chess rules across all modes:

| Layer | Enforcement Mechanism | Failure Recovery |
|---|---|---|
| **Layer 1: UI Board Constraints** | Click events in Manual Mode are restricted exclusively to `legalMoves` calculated by `chess.js`. | Impossible to click or drag pieces to illegal squares. |
| **Layer 2: Prompt Context Restriction** | Model prompts include the full, exhaustive list of legal SAN moves for the current position. | Minimizes hallucination by giving LLMs an explicit choice set. |
| **Layer 3: Player Move Sanitizer** | If an LLM hallucinates an invalid SAN notation or non-existent square, the sanitizer catches it before dispatch. | Automatically falls back to the top legal candidate move (`legalMoves[0].san`). |
| **Layer 4: Decision Override Validation** | If the Decision Model approves or suggests a move not in the legal move list, the override is rejected. | Reverts to the player's original verified proposal or top engine move. |
| **Layer 5: FIDE Engine Verification** | Final execution goes through `chess.js`'s strict `gameEngine.makeMove()`. | If rejected by FIDE rules (pins, castling through check, en passant expiry), execution halts safely. |

---

### 3. Turn Timing vs. Decision Quality: The Role of the Speed Slider

* **Pacing Delay (`turnDelay` slider, 0.5s – 5.0s)**:
  * The speed slider on the bottom controls bar controls **only the presentation delay between turns in Automated Mode**.
  * It provides spectators time to read AI Thoughts, observe the Decision card's dual-tile grade/move badges, and watch board animations.
  * It has **no impact on LLM thinking depth or calculation power**.

* **How AI Thinking Depth is Actually Controlled**:
  * **Fast Thinking Toggle** (in Settings Drawer): Enables or disables extended Chain-of-Thought (CoT) internal deliberation for reasoning models (e.g. Qwen 2.5, DeepSeek, Llama 3.2). When Fast Thinking is enabled, reasoning models output extensive tactical analysis before choosing a move.
  * **Temperature Slider** (in Settings Drawer): Adjusts model entropy (`0.0` for rigid, deterministic moves vs `0.7+` for dynamic, creative play).
  * **Model Capacity**: Selecting higher-parameter models (e.g. 7B vs 0.5B) directly boosts calculation accuracy and positional depth.
  * **Manual Mode**: Allows users to step through games turn-by-turn with complete control via the **Step AI** button.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | React 19 (`react`, `react-dom`) |
| **UI Components & Styling** | React Bootstrap 2.10, Bootstrap 5.3, Custom CSS Design System (`src/styles/`) |
| **Typography & Icons** | Google Fonts (`Outfit`, `JetBrains Mono`), Google Material Symbols Rounded |
| **Chess Engine** | `chess.js` (v1.0.0-beta.6), custom heuristic evaluator, ECO opening book |
| **Build & Tooling** | Vite 5.4 with `@vitejs/plugin-react` |
| **Testing** | Node.js built-in test runner (`node --test test/*.test.js`) |

---

## ❓ Frequently Asked Questions

<details>
<summary><strong>Are all moves legally checked in every mode?</strong></summary>

**Yes.** All moves are strictly validated by `chess.js` across 5 layers of defense:
1. **Manual Mode**: The board only permits clicks on squares in `legalMoves`.
2. **AI Deliberation**: The LLM prompt receives the current list of legal SAN moves. If the model hallucinates an invalid move, the sanitizer safely replaces it with a verified legal move (`legalMoves[0].san`).
3. **Decision Model**: If the Decision Model overrides with an invalid move, it is rejected in favor of a verified legal candidate.
4. **Engine Execution**: `engine.makeMove()` enforces standard FIDE rules before any move is placed on the board.
</details>

<details>
<summary><strong>Does the Decision Model intercept the current move or the next move?</strong></summary>

The Decision Model intercepts the **current move** before it touches the board. When White or Black proposes a move, the Decision Model evaluates its tactical soundness, assigns a grade, and approves the `finalMove` before the engine executes it.
</details>

<details>
<summary><strong>Does the speed slider affect AI thinking depth?</strong></summary>

**No.** The speed slider (`turnDelay`) is purely a visual pacing delay between automated turns for spectator comfort. To control AI thinking depth, toggle **Fast Thinking** in the Settings drawer (allowing reasoning models to execute deep internal Chain-of-Thought deliberations).
</details>

---

## 📜 Agent Guidelines & Architecture

This repository maintains modular guidelines for agentic development:
* [`AGENTS.md`](file:///Users/abhijit/Documents/Projects/Learning/AI/ai-vs-ai-chess/AGENTS.md): Root guidelines and repository conventions.
* [`src/components/AGENTS.md`](file:///Users/abhijit/Documents/Projects/Learning/AI/ai-vs-ai-chess/src/components/AGENTS.md): React UI components, Bootstrap integration, and layout continuity.
* [`src/api/AGENTS.md`](file:///Users/abhijit/Documents/Projects/Learning/AI/ai-vs-ai-chess/src/api/AGENTS.md): Model Manager, Ollama & OpenAI clients, and structured decision schemas.
* [`src/chess/AGENTS.md`](file:///Users/abhijit/Documents/Projects/Learning/AI/ai-vs-ai-chess/src/chess/AGENTS.md): Chess rules, move validation, and heuristic evaluator.