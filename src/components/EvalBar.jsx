import React from 'react';

export default function EvalBar({
  whiteWinChance = 50,
  scoreFormatted = '0.0',
  flipped = false
}) {
  const clampedWhite = Math.max(2, Math.min(98, Number(whiteWinChance) || 50));
  const blackWinChance = 100 - (Number(whiteWinChance) || 50);

  const whitePercent = clampedWhite;
  const fillStyle = flipped
    ? { right: 0, width: `${whitePercent}%` }
    : { left: 0, width: `${whitePercent}%` };

  const leftLabel = flipped ? `Black ${blackWinChance}%` : `White ${whiteWinChance}%`;
  const rightLabel = flipped ? `${whiteWinChance}% White` : `${blackWinChance}% Black`;

  return (
    <div
      className="eval-bar-horizontal-wrapper"
      title={`Position Balance: ${scoreFormatted} (${whiteWinChance}% White, ${blackWinChance}% Black)`}
      role="progressbar"
      aria-label="Position Evaluation Bar"
      aria-valuenow={whiteWinChance}
      aria-valuemin="0"
      aria-valuemax="100"
    >
      {/* Dynamic white advantage fill */}
      <div
        className={`eval-bar-horizontal-fill ${flipped ? 'flipped' : ''}`}
        style={fillStyle}
      />

      {/* Text overlay: Side indicators and centered score badge */}
      <div className="eval-bar-horizontal-content">
        <span className="eval-bar-tag eval-bar-tag-left">
          <span className={`eval-bar-dot ${flipped ? 'black-dot' : 'white-dot'}`} />
          {leftLabel}
        </span>

        <span className="eval-bar-score-badge">
          {scoreFormatted}
        </span>

        <span className="eval-bar-tag eval-bar-tag-right">
          {rightLabel}
          <span className={`eval-bar-dot ${flipped ? 'white-dot' : 'black-dot'}`} />
        </span>
      </div>
    </div>
  );
}
