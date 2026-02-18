import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ROWS = 11, COLS = 11;

function generateMaze(rows, cols) {
  const maze = Array(rows).fill(null).map(() => Array(cols).fill(1));
  const visited = Array(rows).fill(null).map(() => Array(cols).fill(false));

  function carve(r, c) {
    visited[r][c] = true;
    maze[r][c] = 0;
    const dirs = [[0,2],[2,0],[0,-2],[-2,0]].sort(() => Math.random() - 0.5);
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc]) {
        maze[r + dr/2][c + dc/2] = 0;
        carve(nr, nc);
      }
    }
  }
  carve(1, 1);
  maze[rows - 2][cols - 2] = 0; // ensure exit
  return maze;
}

export default function MazeRunner({ onEnd }) {
  const [maze, setMaze] = useState(() => generateMaze(ROWS, COLS));
  const [pos, setPos] = useState([1, 1]);
  const [time, setTime] = useState(0);
  const [won, setWon] = useState(false);
  const [moves, setMoves] = useState(0);

  const goal = [ROWS - 2, COLS - 2];

  useEffect(() => {
    if (won) return;
    const t = setInterval(() => setTime(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [won]);

  const move = useCallback((dr, dc) => {
    if (won) return;
    setPos(([r, c]) => {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return [r, c];
      if (maze[nr][nc] === 1) return [r, c];
      setMoves(m => m + 1);
      if (nr === goal[0] && nc === goal[1]) {
        setWon(true);
        onEnd?.(true, 0);
      }
      return [nr, nc];
    });
  }, [won, maze]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowUp") { e.preventDefault(); move(-1, 0); }
      if (e.key === "ArrowDown") { e.preventDefault(); move(1, 0); }
      if (e.key === "ArrowLeft") { e.preventDefault(); move(0, -1); }
      if (e.key === "ArrowRight") { e.preventDefault(); move(0, 1); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [move]);

  const reset = () => {
    setMaze(generateMaze(ROWS, COLS));
    setPos([1, 1]); setTime(0); setWon(false); setMoves(0);
  };

  const fmt = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
  const cellSize = Math.floor(Math.min(320, window.innerWidth - 40) / COLS);

  return (
    <div className="space-y-4 pb-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-2xl text-center" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>Time</p>
          <p className="text-xl font-bold" style={{ color: won ? "var(--accent-primary)" : "var(--text-primary)" }}>{fmt(time)}</p>
        </div>
        <div className="p-3 rounded-2xl text-center" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>Moves</p>
          <p className="text-xl font-bold" style={{ color: "var(--accent-primary)" }}>{moves}</p>
        </div>
      </div>

      <AnimatePresence>
        {won && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            className="p-3 rounded-2xl text-center font-bold"
            style={{ backgroundColor: "rgba(60,110,90,0.12)", color: "var(--accent-primary)" }}>
            🎉 You escaped in {fmt(time)} with {moves} moves!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Maze grid */}
      <div className="flex justify-center">
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${COLS}, ${cellSize}px)` }}>
          {maze.map((row, r) =>
            row.map((cell, c) => {
              const isPlayer = pos[0] === r && pos[1] === c;
              const isGoal = goal[0] === r && goal[1] === c;
              return (
                <div key={`${r}-${c}`}
                  style={{
                    width: cellSize, height: cellSize,
                    backgroundColor: isPlayer ? "var(--accent-primary)" : isGoal ? "#F59E0B" : cell === 1 ? "#3C3528" : "#FAF7F0",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: cellSize * 0.6,
                    transition: "background 0.1s",
                  }}>
                  {isPlayer && <span>🏃</span>}
                  {isGoal && !isPlayer && <span>🚩</span>}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* D-pad controls */}
      <div className="flex flex-col items-center gap-1 mt-2">
        <motion.button whileTap={{ scale: 0.88 }} onClick={() => move(-1, 0)}
          className="w-14 h-14 rounded-2xl text-2xl flex items-center justify-center"
          style={{ backgroundColor: "var(--bg-card)", border: "2px solid var(--border-light)" }}>▲</motion.button>
        <div className="flex gap-1">
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => move(0, -1)}
            className="w-14 h-14 rounded-2xl text-2xl flex items-center justify-center"
            style={{ backgroundColor: "var(--bg-card)", border: "2px solid var(--border-light)" }}>◀</motion.button>
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => move(1, 0)}
            className="w-14 h-14 rounded-2xl text-2xl flex items-center justify-center"
            style={{ backgroundColor: "var(--bg-card)", border: "2px solid var(--border-light)" }}>▼</motion.button>
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => move(0, 1)}
            className="w-14 h-14 rounded-2xl text-2xl flex items-center justify-center"
            style={{ backgroundColor: "var(--bg-card)", border: "2px solid var(--border-light)" }}>▶</motion.button>
        </div>
      </div>

      <motion.button whileTap={{ scale: 0.96 }} onClick={reset}
        className="w-full py-3 rounded-2xl font-semibold text-white"
        style={{ backgroundColor: "var(--accent-primary)" }}>
        {won ? "▶  New Maze" : "↺  Reset"}
      </motion.button>
    </div>
  );
}