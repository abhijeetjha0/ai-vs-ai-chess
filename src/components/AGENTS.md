# UI Components — Agent Guidelines

## Purpose
This directory contains all user-facing React components for AI vs AI Chess. Components are responsible for the board rendering, game controls, model selection, live move & thought stream logs, middle arbiter adjudication, and provider configuration drawer.

## Key Files
| File | Role |
|---|---|
| [`App.jsx`](file:///Users/abhijit/Documents/Projects/Learning/AI/ai-vs-ai-chess/src/App.jsx) | Application root & orchestrator: 2-column stage layout, top header with brand & status pills, turn loop, modals |
| [`Controls.jsx`](file:///Users/abhijit/Documents/Projects/Learning/AI/ai-vs-ai-chess/src/components/Controls.jsx) | Right sidebar action card: mode selection dropdown, playback controls, step AI, utility buttons |
| [`PlayerStatus.jsx`](file:///Users/abhijit/Documents/Projects/Learning/AI/ai-vs-ai-chess/src/components/PlayerStatus.jsx) | Compact player card: in-card model selection dropdown, captured pieces tray, advantage, and live thought bubble |
| [`ArbiterCard.jsx`](file:///Users/abhijit/Documents/Projects/Learning/AI/ai-vs-ai-chess/src/components/ArbiterCard.jsx) | Compact Middle Decision Model card: in-card model dropdown, adjudication status, grades, and commentary |
| [`MoveLog.jsx`](file:///Users/abhijit/Documents/Projects/Learning/AI/ai-vs-ai-chess/src/components/MoveLog.jsx) | Right-hand AI Thoughts panel: live stream of model reasoning, move proposals, turn tags, and arbiter grades |
| [`ChessBoard.jsx`](file:///Users/abhijit/Documents/Projects/Learning/AI/ai-vs-ai-chess/src/components/ChessBoard.jsx) | Interactive 8x8 chessboard: Staunton SVG pieces, legal move destination dots/rings, check indicators |
| [`ApiDrawer.jsx`](file:///Users/abhijit/Documents/Projects/Learning/AI/ai-vs-ai-chess/src/components/ApiDrawer.jsx) | Offcanvas settings drawer: Ollama URL, OpenAI endpoint/key, temperature, and Fast Reasoning switch |
| [`EvalBar.jsx`](file:///Users/abhijit/Documents/Projects/Learning/AI/ai-vs-ai-chess/src/components/EvalBar.jsx) | Horizontal evaluation bar at the bottom of the chessboard displaying win percentages and position balance score |
| [`HelpModal.jsx`](file:///Users/abhijit/Documents/Projects/Learning/AI/ai-vs-ai-chess/src/components/HelpModal.jsx) | In-app user manual modal: real-time in-page search, category filtering, and step-by-step feature guides |

## Component Conventions

### 1. Iconography
- **Strictly use Google Material Symbols**: Never introduce emojis (e.g., ⚡, 🎲, 🔄) or Unicode glyphs (e.g., ▶, ⏸, ♔).
- Format: `<span className="material-symbols-rounded [optional-sizing-class]">icon_name</span>`.
- Always wrap standalone icon buttons in `ActionTooltipButton` with single-word tooltips (`Start`, `Pause`, `Resume`, `Stop`, `Step`, `Reset`, `Flip`, `Mute`/`Unmute`, `Copy`, `Export`, `Refresh`, `Settings`).

### 2. Layout & State Continuity
- **2-Column Layout**: Left column is the stage (Chessboard, bottom Horizontal Eval Bar); right column stacks compact Player 1, Player 2, Decision, Controls card, and AI Thoughts stream card.
- **Top Header**: Single horizontal row containing brand title/subtitle on left, and Ollama status pill, Match status badge, and Settings button on right.
- **In-Card Model Selectors**: Both Player cards and the Decision card contain inline model `<Form.Select>` dropdowns (`.in-card-select`) for instant model switching without top-bar clutter.
- **Zero Layout Shift**: Both Automated mode and Manual mode in `Controls.jsx` occupy the exact same vertical height (`38px` inner controls) on a single horizontal row.
- **Conditional Decision Rendering**: If `decisionModels` is empty, `ArbiterCard` automatically unmounts without leaving empty space or broken UI.

### 3. Glassmorphic Styling
- Utilize classes from `src/style.css`: `.glass-panel`, `.border-secondary`, `.border-opacity-25`.
- Avoid hardcoded ad-hoc CSS colors; rely on CSS variables (`var(--bg-dark)`, `var(--text-main)`, `var(--cyan-primary)`, `var(--purple-primary)`, `var(--amber-primary)`).

### 4. Grade Rendering
- Use `renderGradeContent(grade)` from [`src/ui/gradeUtils.jsx`](file:///Users/abhijit/Documents/Projects/Learning/AI/ai-vs-ai-chess/src/ui/gradeUtils.jsx) to render move grades across `ArbiterCard` and `MoveLog`.
- `renderGradeContent` sanitizes incoming strings and pairs them with appropriate Material Symbols (`stars`, `auto_awesome`, `thumb_up`, `warning`, `pan_tool_alt`).

### 5. In-App UI Manual Sync
- **Mandatory Manual Synchronization Rule**: Whenever adding, removing, or updating a UI feature, agents MUST automatically update the in-app UI manual (`src/data/help-sections.json` and help components) to reflect the changes to keep the project manual accurate and in-sync.
