# Project Agent Guidelines: AI vs AI Chess

## Project Overview
**AI vs AI Chess** is an automated multi-model chess web application featuring AI player models (White and Black) and a Middle Decision Arbiter model. It supports local Ollama models (with MLX, Fast Reasoning bypass, and structured schema outputs), OpenAI-compatible APIs, and a fallback offline engine.

## Tech Stack
- **Language**: JavaScript (ES Modules, modern ES2022+)
- **Frontend Framework**: React 19 (`react`, `react-dom`)
- **UI Components & Styling**: React Bootstrap (`react-bootstrap` 2.10, `bootstrap` 5.3) & Custom CSS Design System (`src/style.css`)
- **Design Aesthetic**: Modern Cyber Dark Glassmorphism with HSL color tokens
- **Typography & Icons**: Google Fonts (`Outfit`, `JetBrains Mono`) and Google Material Symbols Rounded (`Material Symbols Rounded`)
- **Chess Engine**: `chess.js` (v1.0.0-beta.6), custom heuristic evaluator, ECO opening book
- **Build & Dev Tooling**: Vite 5.4 (`@vitejs/plugin-react`), Node.js built-in test runner (`node --test`)

## Global Conventions & Guidelines

### 1. Iconography — Strict Material Symbols Policy
- **NO Emojis or Unicode Glyphs in UI**: Never use raw emojis (e.g., ⚡, 👆, 🎲, 🔄, ⚖️, ♔, 🏆) in user-facing components.
- Always use Google Material Symbols via `<span className="material-symbols-rounded">symbol_name</span>`.
- Provide single-word action hover tooltips on all icon-only buttons via `ActionTooltipButton` with React Bootstrap's `OverlayTrigger` / `Tooltip`.

### 2. Layout & UI Continuity
- **2-Column Stage Layout**: Left stage features chessboard with horizontal bottom evaluation bar; right column contains compact Player 1, Player 2, Middle Decision Arbiter, Controls card, and AI Thoughts stream card.
- **Top Header**: Single-row alignment featuring brand title/subtitle on the left, and provider status pill, Help manual button, and API settings icon on the right.
- **In-Card Model Selectors**: Model change dropdowns are built directly into Player 1, Player 2, and Arbiter cards, eliminating header dropdown clutter.
- **Controls Row**: Maintain a consistent, single-row layout inside the right sidebar card across both Automated and Manual modes with zero layout shift.
- **Mode Selection**: Render game mode toggling as a styled Bootstrap `Dropdown` with clear title, subtitle, and icons (`smart_toy` for Auto, `touch_app` for Manual).

### 3. Middle Decision Arbiter Filtering
- Middle decision models must strictly possess decision capability (`caps.includes('decision')`).
- If no decision models are available, the right-column `ArbiterCard` must automatically hide with zero broken UI.

### 4. Code Hygiene & Testing
- Run unit tests with `npm test` (`node --test test/*.test.js`).
- Verify production builds with `npm run build` (`vite build`).
- Keep components focused and modular under `src/components/`.

### 5. In-App UI Manual Sync
- **Mandatory Manual Synchronization Rule**: Whenever adding, removing, or updating a UI feature, agents MUST automatically update the in-app UI manual (`src/data/help-sections.json` and help components) to reflect the changes to keep the project manual accurate and in-sync.

## Modular Guidelines
This repository uses folder-scoped `AGENTS.md` files for deeper, context-specific guidelines:

| Directory | Scope & Guidelines |
|---|---|
| [`src/components/`](file:///Users/abhijit/Documents/Projects/Learning/AI/ai-vs-ai-chess/src/components/AGENTS.md) | React UI components, Bootstrap integration, tooltips, and state visualization |
| [`src/api/`](file:///Users/abhijit/Documents/Projects/Learning/AI/ai-vs-ai-chess/src/api/AGENTS.md) | LLM provider integration, Ollama capabilities, structured decision schemas, and mock engine |
| [`src/chess/`](file:///Users/abhijit/Documents/Projects/Learning/AI/ai-vs-ai-chess/src/chess/AGENTS.md) | Chess engine rules, board state, move validation, heuristic evaluation, and ECO openings |

## Directory Guide
```
ai-vs-ai-chess/
├── index.html               # Entry HTML with Google Fonts & Material Symbols
├── package.json             # Dependencies and scripts (dev, build, test)
├── vite.config.js           # Vite build configuration with React plugin
├── src/
│   ├── main.jsx             # React entry point mounting <App />
│   ├── App.jsx              # Main application orchestrator & turn loop
│   ├── style.css            # Dark glassmorphism design tokens & styles
│   ├── components/          # React components (Controls, ChessBoard, Arbiter, etc.)
│   ├── api/                 # Model Manager, Ollama & OpenAI clients, Mock personas
│   ├── arbiter/             # Decision engine orchestration & prompt templates
│   ├── chess/               # Chess rules, evaluation engine, opening book
│   └── ui/                  # Staunton vector SVG chess piece definitions
└── test/
    └── engine.test.js       # Node.js unit tests for chess engine & evaluator
```
