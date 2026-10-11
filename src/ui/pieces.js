/**
 * Crisp High-Definition Vector SVG Chess Pieces
 * Standard Staunton styling with modern vectorized paths
 */

export const PIECE_SVGS = {
  // White Pieces
  wP: `<svg viewBox="0 0 45 45" class="chess-piece-svg">
    <path d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 l 23,0 c 0,-7.92 -4.41,-12.41 -7.41,-13.47 C 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z"
      fill="#ffffff" stroke="#1e293b" stroke-width="1.5" stroke-linejoin="round" />
  </svg>`,

  wN: `<svg viewBox="0 0 45 45" class="chess-piece-svg">
    <g fill="#ffffff" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="m 22,10 c 10.5,1 16.5,8 16,29 L 15,39 C 15,30 11,27 9,19 7.3,12.7 13,8 19,8.5 c 2.5,0.2 4.6,1.3 6,2.5 z" />
      <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 c -1.5,1 -4,2 -4,2 l 1,-3 c 1,-2 3.5,-4 5,-5.5 1.5,-1.5 5,-3 6,-2.5 z" />
      <path d="M 9.5,25.5 A 0.5,0.5 0 1 1 8.5,25.5 0.5,0.5 0 1 1 9.5,25.5 z" fill="#1e293b" />
      <path d="M 15,15.5 A 0.5,1.5 0 1 1 14,15.5 0.5,1.5 0 1 1 15,15.5 z" transform="matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)" fill="#1e293b" />
    </g>
  </svg>`,

  wB: `<svg viewBox="0 0 45 45" class="chess-piece-svg">
    <g fill="#ffffff" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 c 0,2.5 -4.5,4 -13.5,4 -9,0 -13.5,-1.5 -13.5,-4 z" />
      <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 30.5,30.5 30,30 30,30 30,27.5 27.5,26 22.5,26 17.5,26 15,27.5 15,30 c 0,0 -0.5,0.5 0,2 z" />
      <path d="M 25,8 A 2.5,2.5 0 1 1 20,8 2.5,2.5 0 1 1 25,8 z" />
      <path d="m 17.5,26 c 0,0 1,-6.5 5,-8.5 4,2 5,8.5 5,8.5 0,0 3,-5.5 1,-10.5 -2,-5 -6,-5.5 -6,-5.5 0,0 -4,0.5 -6,5.5 -2,5 1,10.5 1,10.5 z" />
      <path d="m 20,19 5,0" stroke-width="1" />
      <path d="m 22.5,16.5 0,5" stroke-width="1" />
    </g>
  </svg>`,

  wR: `<svg viewBox="0 0 45 45" class="chess-piece-svg">
    <g fill="#ffffff" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M 9,39 L 36,39 L 36,36 L 9,36 z" />
      <path d="M 12,36 L 12,32 L 33,32 L 33,36 z" />
      <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 z" />
      <path d="M 34,14 L 31,17 L 14,17 L 11,14 z" />
      <path d="M 14,17 L 14,29.5 L 31,29.5 L 31,17 z" />
      <path d="M 14,29.5 L 11,32 L 34,32 L 31,29.5 z" />
      <path d="M 14,16 L 31,16" stroke-width="1" />
    </g>
  </svg>`,

  wQ: `<svg viewBox="0 0 45 45" class="chess-piece-svg">
    <g fill="#ffffff" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M 8,12 A 2,2 0 1 1 4,12 2,2 0 1 1 8,12 z" />
      <path d="M 18,9 A 2,2 0 1 1 14,9 2,2 0 1 1 18,9 z" />
      <path d="M 28,8 A 2,2 0 1 1 24,8 2,2 0 1 1 28,8 z" />
      <path d="M 38,9 A 2,2 0 1 1 34,9 2,2 0 1 1 38,9 z" />
      <path d="M 48,12 A 2,2 0 1 1 44,12 2,2 0 1 1 48,12 z" transform="translate(-7, 0)" />
      <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38,14 L 31,25 L 22.5,10 L 14,25 L 7,14 z" />
      <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 10.5,36 10,38.5 L 35,38.5 C 34.5,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 z" />
      <path d="M 11.5,30 C 15,29 30,29 33.5,30" stroke-width="1" />
      <path d="M 12,33.5 C 18,32.5 27,32.5 33,33.5" stroke-width="1" />
    </g>
  </svg>`,

  wK: `<svg viewBox="0 0 45 45" class="chess-piece-svg">
    <g fill="#ffffff" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M 22.5,11.63 L 22.5,6" stroke-width="1.5" />
      <path d="M 20,8 L 25,8" stroke-width="1.5" />
      <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 24,11.5 21,11.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25" />
      <path d="M 11.5,37 C 17,40.5 28,40.5 33.5,37 C 36.5,34 37,29.5 35.5,26 C 34,22.5 29.5,22 22.5,22 C 15.5,22 11,22.5 9.5,26 C 8,29.5 8.5,34 11.5,37 z" />
      <path d="M 11.5,30 C 17,27 28,27 33.5,30" stroke-width="1" />
      <path d="M 11.5,33.5 C 17,30.5 28,30.5 33.5,33.5" stroke-width="1" />
      <path d="M 11.5,37 C 17,34 28,34 33.5,37" stroke-width="1" />
    </g>
  </svg>`,

  // Black Pieces (sleek dark styling with neon accents)
  bP: `<svg viewBox="0 0 45 45" class="chess-piece-svg">
    <path d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 l 23,0 c 0,-7.92 -4.41,-12.41 -7.41,-13.47 C 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z"
      fill="#1e1b4b" stroke="#a855f7" stroke-width="1.5" stroke-linejoin="round" />
  </svg>`,

  bN: `<svg viewBox="0 0 45 45" class="chess-piece-svg">
    <g fill="#1e1b4b" stroke="#a855f7" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="m 22,10 c 10.5,1 16.5,8 16,29 L 15,39 C 15,30 11,27 9,19 7.3,12.7 13,8 19,8.5 c 2.5,0.2 4.6,1.3 6,2.5 z" />
      <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 c -1.5,1 -4,2 -4,2 l 1,-3 c 1,-2 3.5,-4 5,-5.5 1.5,-1.5 5,-3 6,-2.5 z" />
      <path d="M 9.5,25.5 A 0.5,0.5 0 1 1 8.5,25.5 0.5,0.5 0 1 1 9.5,25.5 z" fill="#c084fc" />
      <path d="M 15,15.5 A 0.5,1.5 0 1 1 14,15.5 0.5,1.5 0 1 1 15,15.5 z" transform="matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)" fill="#c084fc" />
    </g>
  </svg>`,

  bB: `<svg viewBox="0 0 45 45" class="chess-piece-svg">
    <g fill="#1e1b4b" stroke="#a855f7" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 c 0,2.5 -4.5,4 -13.5,4 -9,0 -13.5,-1.5 -13.5,-4 z" />
      <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 30.5,30.5 30,30 30,30 30,27.5 27.5,26 22.5,26 17.5,26 15,27.5 15,30 c 0,0 -0.5,0.5 0,2 z" />
      <path d="M 25,8 A 2.5,2.5 0 1 1 20,8 2.5,2.5 0 1 1 25,8 z" />
      <path d="m 17.5,26 c 0,0 1,-6.5 5,-8.5 4,2 5,8.5 5,8.5 0,0 3,-5.5 1,-10.5 -2,-5 -6,-5.5 -6,-5.5 0,0 -4,0.5 -6,5.5 -2,5 1,10.5 1,10.5 z" />
      <path d="m 20,19 5,0" stroke-width="1" stroke="#c084fc" />
      <path d="m 22.5,16.5 0,5" stroke-width="1" stroke="#c084fc" />
    </g>
  </svg>`,

  bR: `<svg viewBox="0 0 45 45" class="chess-piece-svg">
    <g fill="#1e1b4b" stroke="#a855f7" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M 9,39 L 36,39 L 36,36 L 9,36 z" />
      <path d="M 12,36 L 12,32 L 33,32 L 33,36 z" />
      <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 z" />
      <path d="M 34,14 L 31,17 L 14,17 L 11,14 z" />
      <path d="M 14,17 L 14,29.5 L 31,29.5 L 31,17 z" />
      <path d="M 14,29.5 L 11,32 L 34,32 L 31,29.5 z" />
      <path d="M 14,16 L 31,16" stroke-width="1" stroke="#c084fc" />
    </g>
  </svg>`,

  bQ: `<svg viewBox="0 0 45 45" class="chess-piece-svg">
    <g fill="#1e1b4b" stroke="#a855f7" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M 8,12 A 2,2 0 1 1 4,12 2,2 0 1 1 8,12 z" />
      <path d="M 18,9 A 2,2 0 1 1 14,9 2,2 0 1 1 18,9 z" />
      <path d="M 28,8 A 2,2 0 1 1 24,8 2,2 0 1 1 28,8 z" />
      <path d="M 38,9 A 2,2 0 1 1 34,9 2,2 0 1 1 38,9 z" />
      <path d="M 48,12 A 2,2 0 1 1 44,12 2,2 0 1 1 48,12 z" transform="translate(-7, 0)" />
      <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38,14 L 31,25 L 22.5,10 L 14,25 L 7,14 z" />
      <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 10.5,36 10,38.5 L 35,38.5 C 34.5,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 z" />
      <path d="M 11.5,30 C 15,29 30,29 33.5,30" stroke-width="1" stroke="#c084fc" />
      <path d="M 12,33.5 C 18,32.5 27,32.5 33,33.5" stroke-width="1" stroke="#c084fc" />
    </g>
  </svg>`,

  bK: `<svg viewBox="0 0 45 45" class="chess-piece-svg">
    <g fill="#1e1b4b" stroke="#a855f7" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M 22.5,11.63 L 22.5,6" stroke-width="1.5" stroke="#c084fc" />
      <path d="M 20,8 L 25,8" stroke-width="1.5" stroke="#c084fc" />
      <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 24,11.5 21,11.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25" />
      <path d="M 11.5,37 C 17,40.5 28,40.5 33.5,37 C 36.5,34 37,29.5 35.5,26 C 34,22.5 29.5,22 22.5,22 C 15.5,22 11,22.5 9.5,26 C 8,29.5 8.5,34 11.5,37 z" />
      <path d="M 11.5,30 C 17,27 28,27 33.5,30" stroke-width="1" stroke="#c084fc" />
      <path d="M 11.5,33.5 C 17,30.5 28,30.5 33.5,33.5" stroke-width="1" stroke="#c084fc" />
      <path d="M 11.5,37 C 17,34 28,34 33.5,37" stroke-width="1" stroke="#c084fc" />
    </g>
  </svg>`
};

export function getPieceSvg(piece) {
  if (!piece) return '';
  const key = `${piece.color}${piece.type.toUpperCase()}`;
  return PIECE_SVGS[key] || '';
}
