import React from 'react';

export default function EvalBar({ whiteWinChance = 50, scoreFormatted = '0.0' }) {
  const heightPercent = Math.max(2, Math.min(98, whiteWinChance));

  return (
    <div
      className="eval-bar-wrapper"
      title={`Position Balance: ${scoreFormatted} (${whiteWinChance}% White chance)`}
    >
      <div
        className="eval-bar-fill"
        style={{ height: `${heightPercent}%` }}
      />
      <div className="eval-bar-label">{scoreFormatted}</div>
    </div>
  );
}
