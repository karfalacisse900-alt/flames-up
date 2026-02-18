import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw } from "lucide-react";

const WINNING_LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

function calcWinner(squares) {
  for (const [a,b,c] of WINNING_LINES) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c])
      return { winner: squares[a], line: [a,b,c] };
  }
  return null;
}

function minimax(squares, isMax) {
  const res = calcWinner(squares);
  if (res?.winner === "O") return 10;
  if (res?.winner === "X") return -10;
  if (squares.every(Boolean)) return 0;
  const empty = squares.map((v,i) => v===null?i:-1).filter(i=>i>=0);
  const scores = empty.map(i => {
    const b = [...squares]; b[i] = isMax ? "O" : "X";
    return minimax(b, !isMax);
  });
  return isMax ? Math.max(...scores) : Math.min(...scores);
}

function bestMove(squares) {
  const empty = squares.map((v,i) => v===null?i:-1).filter(i=>i>=0);
  let best = -Infinity, move = empty[0];
  for (const i of empty) {
    const b = [...squares]; b[i] = "O";
    const s = minimax(b, false);
    if (s > best) { best = s; move = i; }
  }
  return move;
}

export default function TicTacToe({ mode }) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [scores, setScores] = useState({ player: 0, ai: 0, tie: 0 });
  const [thinking, setThinking] = useState(false);

  const result = calcWinner(board);
  const winner = result?.winner;
  const winLine = result?.line || [];
  const isFull = board.every(Boolean);
  const gameOver = winner || isFull;

  useEffect(() => {
    if (!isXNext && !gameOver) {
      setThinking(true);
      const t = setTimeout(() => {
        const move = bestMove(board);
        const nb = [...board]; nb[move] = "O";
        setBoard(nb);
        setIsXNext(true);
        setThinking(false);
      }, 500);
      return () => clearTimeout(t);
    }
  }, [isXNext, gameOver]);

  useEffect(() => {
    if (gameOver) {
      setScores(s => ({
        ...s,
        player: s.player + (winner === "X" ? 1 : 0),
        ai: s.ai + (winner === "O" ? 1 : 0),
        tie: s.tie + (!winner ? 1 : 0),
      }));
    }
  }, [gameOver]);

  const handleClick = (i) => {
    if (board[i] || gameOver || !isXNext || thinking) return;
    const nb = [...board]; nb[i] = "X";
    setBoard(nb);
    setIsXNext(false);
  };

  const reset = () => { setBoard(Array(9).fill(null)); setIsXNext(true); };

  return (
    <div className="space-y-5 pb-6">
      {/* Score bar */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "You (X)", val: scores.player, color: "var(--accent-primary)" },
          { label: "Tie", val: scores.tie, color: "var(--text-secondary)" },
          { label: "AI (O)", val: scores.ai, color: "#E05C7A" },
        ].map((s) => (
          <motion.div key={s.label} className="p-3 rounded-2xl text-center" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
            whileTap={{ scale: 0.97 }}>
            <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>{s.label}</p>
            <motion.p key={s.val} initial={{ scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="text-2xl font-bold" style={{ color: s.color }}>{s.val}</motion.p>
          </motion.div>
        ))}
      </div>

      {/* Status */}
      <AnimatePresence mode="wait">
        {gameOver ? (
          <motion.div key="over" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-3 rounded-2xl text-center font-bold text-sm"
            style={{
              backgroundColor: winner === "X" ? "rgba(60,110,90,0.12)" : winner === "O" ? "rgba(224,92,122,0.12)" : "rgba(245,158,11,0.12)",
              color: winner === "X" ? "var(--accent-primary)" : winner === "O" ? "#E05C7A" : "#B45309",
            }}>
            {winner === "X" ? "🎉 You Win!" : winner === "O" ? "😢 AI Wins!" : "🤝 It's a Tie!"}
          </motion.div>
        ) : thinking ? (
          <motion.div key="think" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="p-3 rounded-2xl text-center text-sm flex items-center justify-center gap-2"
            style={{ backgroundColor: "rgba(60,110,90,0.08)", color: "var(--accent-primary)" }}>
            <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>⏳</motion.span>
            AI is thinking…
          </motion.div>
        ) : (
          <motion.div key="turn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="p-3 rounded-2xl text-center text-sm"
            style={{ backgroundColor: "var(--bg-card)", color: "var(--text-secondary)" }}>
            Your turn — tap a square
          </motion.div>
        )}
      </AnimatePresence>

      {/* Board */}
      <div className="grid grid-cols-3 gap-2 p-3 rounded-3xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
        {board.map((val, i) => {
          const isWinCell = winLine.includes(i);
          return (
            <motion.button
              key={i}
              onClick={() => handleClick(i)}
              whileTap={{ scale: val ? 1 : 0.88 }}
              className="aspect-square rounded-2xl flex items-center justify-center text-3xl font-black"
              style={{
                backgroundColor: isWinCell ? (winner === "X" ? "rgba(60,110,90,0.18)" : "rgba(224,92,122,0.18)") : "var(--bg-app)",
                border: `2px solid ${isWinCell ? (winner === "X" ? "var(--accent-primary)" : "#E05C7A") : "var(--border-light)"}`,
                cursor: val || gameOver ? "default" : "pointer",
                transition: "background 0.2s, border 0.2s",
              }}
            >
              <AnimatePresence>
                {val && (
                  <motion.span
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 18 }}
                    style={{ color: val === "X" ? "var(--accent-primary)" : "#E05C7A" }}
                  >
                    {val}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* Buttons */}
      <motion.button
        onClick={reset}
        whileTap={{ scale: 0.96 }}
        className="w-full py-3.5 rounded-2xl font-semibold text-white text-sm"
        style={{ backgroundColor: gameOver ? "var(--accent-primary)" : "var(--text-hint)", boxShadow: gameOver ? "0 4px 14px rgba(60,110,90,0.35)" : "none" }}
      >
        {gameOver ? "▶  Play Again" : "Waiting…"}
      </motion.button>
      <button onClick={() => { reset(); setScores({ player: 0, ai: 0, tie: 0 }); }}
        className="w-full py-2 rounded-xl flex items-center justify-center gap-2 text-xs"
        style={{ color: "var(--text-hint)", border: "1px solid var(--border-light)" }}>
        <RotateCcw className="w-3 h-3" /> Reset Scores
      </button>
    </div>
  );
}