import React, { useState, useEffect } from "react";
import { RotateCcw } from "lucide-react";

export default function TicTacToe({ mode }) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [playerX, setPlayerX] = useState(true);
  const [scores, setScores] = useState({ player: 0, ai: 0, tie: 0 });

  const calculateWinner = (squares) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const makeAIMove = (squares) => {
    const emptySquares = squares.map((val, idx) => val === null ? idx : null).filter(val => val !== null);
    if (emptySquares.length === 0) return;

    const aiSymbol = "O";
    const playerSymbol = "X";

    // Check if AI can win
    for (let square of emptySquares) {
      const testBoard = [...squares];
      testBoard[square] = aiSymbol;
      if (calculateWinner(testBoard) === aiSymbol) {
        return square;
      }
    }

    // Check if player can win and block
    for (let square of emptySquares) {
      const testBoard = [...squares];
      testBoard[square] = playerSymbol;
      if (calculateWinner(testBoard) === playerSymbol) {
        return square;
      }
    }

    // Take center if available
    if (emptySquares.includes(4)) return 4;

    // Take corners
    const corners = [0, 2, 6, 8].filter(i => emptySquares.includes(i));
    if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];

    // Take random
    return emptySquares[Math.floor(Math.random() * emptySquares.length)];
  };

  useEffect(() => {
    if (!isXNext && playerX) {
      const timer = setTimeout(() => {
        const aiMove = makeAIMove(board);
        if (aiMove !== undefined) {
          const newBoard = [...board];
          newBoard[aiMove] = "O";
          setBoard(newBoard);
          setIsXNext(true);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isXNext, board, playerX]);

  const winner = calculateWinner(board);
  const isBoardFull = board.every(square => square !== null);
  const gameOver = winner || isBoardFull;

  const handleClick = (index) => {
    if (board[index] || gameOver || !isXNext) return;
    const newBoard = [...board];
    newBoard[index] = "X";
    setBoard(newBoard);

    if (!calculateWinner(newBoard) && !newBoard.every(s => s)) {
      setIsXNext(false);
    }
  };

  useEffect(() => {
    if (gameOver) {
      const newScores = { ...scores };
      if (winner === "X") newScores.player++;
      else if (winner === "O") newScores.ai++;
      else newScores.tie++;
      setScores(newScores);
    }
  }, [gameOver]);

  const reset = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  };

  const resetScores = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setScores({ player: 0, ai: 0, tie: 0 });
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Scores */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-xl text-center" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>You (X)</p>
          <p className="text-2xl font-bold" style={{ color: "var(--accent-primary)" }}>{scores.player}</p>
        </div>
        <div className="p-3 rounded-xl text-center" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>Tie</p>
          <p className="text-2xl font-bold" style={{ color: "var(--text-secondary)" }}>{scores.tie}</p>
        </div>
        <div className="p-3 rounded-xl text-center" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>AI (O)</p>
          <p className="text-2xl font-bold" style={{ color: "var(--text-secondary)" }}>{scores.ai}</p>
        </div>
      </div>

      {/* Board */}
      <div className="grid grid-cols-3 gap-2 bg-white p-4 rounded-2xl" style={{ border: "1px solid var(--border-light)" }}>
        {board.map((value, index) => (
          <button
            key={index}
            onClick={() => handleClick(index)}
            className="aspect-square rounded-xl text-2xl font-bold transition-all"
            style={{
              backgroundColor: "var(--bg-app)",
              border: "2px solid var(--border-light)",
              color: value === "X" ? "var(--accent-primary)" : "var(--text-secondary)",
              opacity: !gameOver && !isXNext ? 0.6 : 1,
            }}
          >
            {value}
          </button>
        ))}
      </div>

      {/* Status */}
      {gameOver && (
        <div className={`p-4 rounded-xl text-center font-bold ${
          winner === "X" ? "bg-green-100 text-green-700" :
          winner === "O" ? "bg-red-100 text-red-700" :
          "bg-yellow-100 text-yellow-700"
        }`}>
          {winner === "X" ? "🎉 You Win!" : winner === "O" ? "😢 AI Wins!" : "🤝 It's a Tie!"}
        </div>
      )}

      {!gameOver && !isXNext && (
        <div className="p-4 rounded-xl text-center" style={{ backgroundColor: "rgba(60,110,90,0.1)", color: "var(--accent-primary)" }}>
          ⏳ AI is thinking...
        </div>
      )}

      {/* Buttons */}
      <button
        onClick={reset}
        disabled={!gameOver}
        className="w-full p-3 rounded-xl font-medium text-white"
        style={{ backgroundColor: gameOver ? "var(--accent-primary)" : "var(--text-hint)" }}
      >
        {gameOver ? "Play Again" : "Waiting..."}
      </button>

      <button
        onClick={resetScores}
        className="w-full p-2 rounded-lg border flex items-center justify-center gap-2 text-sm"
        style={{ borderColor: "var(--border-light)", color: "var(--text-hint)" }}
      >
        <RotateCcw className="w-4 h-4" /> Reset Scores
      </button>
    </div>
  );
}