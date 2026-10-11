# Chess Engine & Game Logic — Agent Guidelines

## Purpose
This directory contains the core chess game engine, position evaluation algorithms, opening book lookups, and move validation logic. It is decoupled from the UI and network layers, providing deterministic rules and game state tracking.

## Key Files
| File | Role |
|---|---|
| [`engine.js`](file:///Users/abhijit/Documents/Projects/Learning/AI/ai-vs-ai-chess/src/chess/engine.js) | Main chess game engine wrapping `chess.js`: manages board state, move execution, captured piece tracking, check/checkmate detection, FEN/PGN output, and audio sounds |
| [`evaluator.js`](file:///Users/abhijit/Documents/Projects/Learning/AI/ai-vs-ai-chess/src/chess/evaluator.js) | Heuristic board evaluation: evaluates piece values, center control, piece mobility, king safety, and computes White win chance percentage |
| [`openings.js`](file:///Users/abhijit/Documents/Projects/Learning/AI/ai-vs-ai-chess/src/chess/openings.js) | Opening book catalog: detects ECO code and opening name from move sequences and FEN |

## Conventions & Rules

### 1. Move Notation
- **Always Use SAN (Standard Algebraic Notation)**:
  - All moves communicated to AI models, recorded in `historySan`, and displayed in the move log must use SAN (e.g., `e4`, `Nf3`, `exd5`, `O-O`, `Qxf7#`).
  - When accepting manual moves from the board, validate and convert them using `engine.makeMove(san)`.

### 2. State Purity & Decoupling
- Classes in this directory must remain pure domain models and never import React hooks, components, or DOM elements directly.
- Audio synthesis in `engine.js` uses standard `WebAudioApi` synthesizers wrapped in safe volume/mute checks.

### 3. Captured Pieces & Material Calculation
- `getCapturedPieces()` computes captured pieces per color and returns the net material advantage (positive for White, negative for Black) based on standard piece values:
  - Pawn: 1
  - Knight / Bishop: 3
  - Rook: 5
  - Queen: 9

### 4. Unit Testing
- Always run and maintain tests in `test/engine.test.js` when editing chess logic:
  ```bash
  npm test
  # or: node --test test/*.test.js
  ```
- Ensure tests verify initial board state, valid move execution, capture tracking, and position evaluator balance.
