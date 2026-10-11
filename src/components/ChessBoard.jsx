import React, { useState } from 'react';
import { getPieceSvg } from '../ui/pieces.js';

export default function ChessBoard({
  board,
  turn,
  legalMoves = [],
  lastMove = null,
  kingInCheckSquare = null,
  flipped = false,
  interactive = true,
  onUserMove
}) {
  const [selectedSquare, setSelectedSquare] = useState(null);

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const renderRanks = flipped ? [...ranks].reverse() : ranks;
  const renderFiles = flipped ? [...files].reverse() : files;

  // Legal destinations for selected piece
  const legalDestinations = selectedSquare
    ? legalMoves.filter((m) => m.from === selectedSquare)
    : [];

  const handleSquareClick = (square) => {
    if (!interactive) return;

    // If a piece is already selected, check if clicked square is destination
    if (selectedSquare) {
      const match = legalDestinations.find((m) => m.to === square);
      if (match) {
        const from = selectedSquare;
        setSelectedSquare(null);
        if (onUserMove) {
          onUserMove(match.san, { from, to: square });
        }
        return;
      }
    }

    // Check if clicked square has a piece of current turn
    const fileIdx = square.charCodeAt(0) - 97;
    const rankIdx = 8 - parseInt(square[1], 10);
    const piece = board[rankIdx]?.[fileIdx];

    if (piece && piece.color === turn) {
      setSelectedSquare(square);
    } else {
      setSelectedSquare(null);
    }
  };

  return (
    <div className="chessboard-wrapper">
      <div className="chessboard-grid">
        {renderRanks.map((rank, rIdx) =>
          renderFiles.map((file, fIdx) => {
            const square = `${file}${rank}`;
            const actualR = 8 - parseInt(rank, 10);
            const actualC = file.charCodeAt(0) - 97;
            const piece = board[actualR]?.[actualC];
            const isLight = (actualR + actualC) % 2 === 0;

            const isSelected = selectedSquare === square;
            const isLastFrom = lastMove?.from === square;
            const isLastTo = lastMove?.to === square;
            const isInCheck = kingInCheckSquare === square;
            const isLegalTarget = legalDestinations.some((m) => m.to === square);

            let squareClasses = `board-square ${isLight ? 'light' : 'dark'}`;
            if (isSelected) squareClasses += ' selected';
            if (isLastFrom) squareClasses += ' last-move-from';
            if (isLastTo) squareClasses += ' last-move-to';
            if (isInCheck) squareClasses += ' in-check';

            return (
              <div
                key={square}
                className={squareClasses}
                data-square={square}
                onClick={() => handleSquareClick(square)}
              >
                {/* Coordinates */}
                {fIdx === 0 && <span className="coord-label coord-rank">{rank}</span>}
                {rIdx === 7 && <span className="coord-label coord-file">{file}</span>}

                {/* Piece */}
                {piece && (
                  <div
                    className={`piece-container piece-${piece.color}${piece.type}`}
                    dangerouslySetInnerHTML={{ __html: getPieceSvg(piece) }}
                  />
                )}

                {/* Move destination dot / capture ring */}
                {isLegalTarget && (
                  piece ? <div className="capture-ring" /> : <div className="legal-dot" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
