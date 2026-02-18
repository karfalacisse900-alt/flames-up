import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw } from "lucide-react";

const SIZE = 8;
const PLAYER = 1, AI = 2;

function initBoard() {
  const board = Array(SIZE).fill(null).map(() => Array(SIZE).fill(0));
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < SIZE; c++)
      if ((r + c) % 2 === 1) board[r][c] = AI;
  for (let r = 5; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if ((r + c) % 2 === 1) board[r][c] = PLAYER;
  return board;
}

function getMoves(board, piece, r, c) {
  const moves = [];
  const dirs = piece === PLAYER ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
  for (const [dr, dc] of dirs) {
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc] === 0)
      moves.push({ type: "move", to: [nr, nc] });
    const jr = r + dr * 2, jc = c + dc * 2;
    const mr = r + dr, mc = c + dc;
    if (jr >= 0 && jr < SIZE && jc >= 0 && jc < SIZE &&
        board[jr][jc] === 0 &&
        board[mr][mc] !== 0 && board[mr][mc] !== piece)
      moves.push({ type: "jump", to: [jr, jc], captured: [mr, mc] });
  }
  return moves;
}

function getAllMoves(board, player) {
  const all = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (board[r][c] === player) {
        const moves = getMoves(board, player, r, c);
        moves.forEach(m => all.push({ from: [r, c], ...m }));
      }
  return all;
}

function applyMove(board, move) {
  const nb = board.map(row => [...row]);
  const [fr, fc] = move.from;
  const [tr, tc] = move.to;
  nb[tr][tc] = nb[fr][fc];
  nb[fr][fc] = 0;
  if (move.type === "jump") {
    const [cr, cc] = move.captured;
    nb[cr][cc] = 0;
  }
  return nb;
}

export default function Checkers({ onEnd }) {
  const [board, setBoard] = useState(initBoard());
  const [selected, setSelected] = useState(null);
  const [turn, setTurn] = useState(PLAYER);
  const [scores, setScores] = useState({ player: 12, ai: 12 });
  const [winner, setWinner] = useState(null);
  const [validMoves, setValidMoves] = useState([]);

  const countPieces = (b) => {
    let p = 0, a = 0;
    b.forEach(row => row.forEach(cell => { if (cell === PLAYER) p++; if (cell === AI) a++; }));
    return { player: p, ai: a };
  };

  const handleCell = (r, c) => {
    if (winner || turn !== PLAYER) return;
    const piece = board[r][c];
    if (piece === PLAYER) {
      const moves = getMoves(board, PLAYER, r, c);
      setSelected([r, c]);
      setValidMoves(moves.map(m => m.to));
      return;
    }
    if (selected) {
      const moves = getMoves(board, PLAYER, selected[0], selected[1]);
      const move = moves.find(m => m.to[0] === r && m.to[1] === c);
      if (move) {
        const nb = applyMove(board, { from: selected, ...move });
        const counts = countPieces(nb);
        setBoard(nb); setSelected(null); setValidMoves([]);
        setScores(counts);
        if (counts.ai === 0) { setWinner("player"); onEnd?.(true, 0); return; }
        setTurn(AI);
        setTimeout(() => doAIMove(nb, counts), 500);
      } else { setSelected(null); setValidMoves([]); }
    }
  };

  const doAIMove = (b, counts) => {
    const moves = getAllMoves(b, AI);
    if (moves.length === 0) { setWinner("player"); onEnd?.(true, 0); return; }
    const jumps = moves.filter(m => m.type === "jump");
    const move = jumps.length > 0 ? jumps[Math.floor(Math.random() * jumps.length)] : moves[Math.floor(Math.random() * moves.length)];
    const nb = applyMove(b, move);
    const nc = countPieces(nb);
    setBoard(nb); setScores(nc);
    if (nc.player === 0) { setWinner("ai"); onEnd?.(false, 0); return; }
    setTurn(PLAYER);
  };

  const reset = () => {
    setBoard(initBoard()); setSelected(null); setValidMoves([]);
    setTurn(PLAYER); setWinner(null); setScores({ player: 12, ai: 12 });
  };

  const cellColor = (r, c) => (r + c) % 2 === 0 ? "#E8DFD0" : "#7C6B5A";

  return (
    <div className="space-y-4 pb-6">
      {/* Scores */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-3 rounded-2xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>You ⚪</p>
          <motion.p key={scores.player} initial={{ scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="text-2xl font-bold" style={{ color: "var(--accent-primary)" }}>{scores.player}</motion.p>
        </div>
        <div className="flex items-center justify-center">
          <span className="text-sm font-semibold" style={{ color: "var(--text-hint)" }}>
            {winner ? (winner === "player" ? "🎉 You Win!" : "😢 AI Wins!") : turn === PLAYER ? "Your turn" : "AI thinking…"}
          </span>
        </div>
        <div className="p-3 rounded-2xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>AI ⚫</p>
          <motion.p key={scores.ai} initial={{ scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="text-2xl font-bold" style={{ color: "#E05C7A" }}>{scores.ai}</motion.p>
        </div>
      </div>

      {/* Board */}
      <div className="rounded-2xl overflow-hidden border-2" style={{ borderColor: "#7C6B5A" }}>
        {board.map((row, r) => (
          <div key={r} className="flex">
            {row.map((cell, c) => {
              const isSelected = selected?.[0] === r && selected?.[1] === c;
              const isValid = validMoves.some(([vr, vc]) => vr === r && vc === c);
              return (
                <motion.button
                  key={c}
                  onClick={() => handleCell(r, c)}
                  className="flex-1 aspect-square flex items-center justify-center relative"
                  style={{ backgroundColor: isSelected ? "#B5A27A" : isValid ? "#C8D4A8" : cellColor(r, c) }}
                  whileTap={{ scale: 0.92 }}
                >
                  {isValid && !cell && (
                    <div className="w-3 h-3 rounded-full opacity-60" style={{ backgroundColor: "var(--accent-primary)" }} />
                  )}
                  {cell !== 0 && (
                    <motion.div
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="w-7 h-7 rounded-full border-2 shadow-md"
                      style={{
                        backgroundColor: cell === PLAYER ? "#F0EBE0" : "#2C2C2C",
                        borderColor: cell === PLAYER ? "#C8BCA8" : "#555",
                        boxShadow: isSelected ? "0 0 0 3px #3C6E5A" : "0 2px 4px rgba(0,0,0,0.3)",
                      }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        ))}
      </div>

      <motion.button whileTap={{ scale: 0.96 }} onClick={reset}
        className="w-full py-3 rounded-2xl font-semibold text-white flex items-center justify-center gap-2"
        style={{ backgroundColor: "var(--accent-primary)" }}>
        <RotateCcw className="w-4 h-4" /> New Game
      </motion.button>
    </div>
  );
}