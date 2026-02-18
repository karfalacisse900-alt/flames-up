import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LEVELS = [
  {
    size: 5,
    pairs: [
      { color: "#E05C7A", cells: [[0,0],[4,4]] },
      { color: "#3C6E5A", cells: [[0,4],[4,0]] },
      { color: "#5579A6", cells: [[2,0],[2,4]] },
      { color: "#D98B62", cells: [[0,2],[4,2]] },
    ]
  },
  {
    size: 6,
    pairs: [
      { color: "#E05C7A", cells: [[0,0],[5,5]] },
      { color: "#3C6E5A", cells: [[0,5],[5,0]] },
      { color: "#5579A6", cells: [[0,3],[5,2]] },
      { color: "#D98B62", cells: [[2,0],[3,5]] },
      { color: "#8B5CF6", cells: [[1,2],[4,3]] },
    ]
  }
];

function initGrid(level) {
  const { size, pairs } = LEVELS[level];
  const grid = Array(size).fill(null).map(() => Array(size).fill(null));
  pairs.forEach(({ color, cells }) => {
    cells.forEach(([r, c]) => { grid[r][c] = { color, isEndpoint: true }; });
  });
  return grid;
}

export default function ColorConnect({ onEnd }) {
  const [levelIdx, setLevelIdx] = useState(0);
  const level = LEVELS[levelIdx];
  const [grid, setGrid] = useState(() => initGrid(0));
  const [drawing, setDrawing] = useState(null); // { color, path: [[r,c],...] }
  const [paths, setPaths] = useState([]); // [{color, path}]
  const [won, setWon] = useState(false);

  const getEndpointColor = (r, c) => {
    return level.pairs.find(p => p.cells.some(([pr, pc]) => pr === r && pc === c))?.color || null;
  };

  const getCellColor = (r, c) => {
    const ep = getEndpointColor(r, c);
    if (ep) return ep;
    const path = paths.find(p => p.path.some(([pr, pc]) => pr === r && pc === c));
    return path?.color || null;
  };

  const handleCellPress = (r, c) => {
    if (won) return;
    const epColor = getEndpointColor(r, c);
    if (epColor) {
      // Remove existing path for this color
      setPaths(ps => ps.filter(p => p.color !== epColor));
      setDrawing({ color: epColor, path: [[r, c]] });
    }
  };

  const handleCellEnter = (r, c) => {
    if (!drawing) return;
    const last = drawing.path[drawing.path.length - 1];
    if (last[0] === r && last[1] === c) return;
    const dr = Math.abs(r - last[0]), dc = Math.abs(c - last[1]);
    if (dr + dc !== 1) return; // must be adjacent

    // Check if backtracking
    const prevIdx = drawing.path.findIndex(([pr, pc]) => pr === r && pc === c);
    if (prevIdx >= 0) {
      setDrawing(d => ({ ...d, path: d.path.slice(0, prevIdx + 1) }));
      return;
    }
    // Check occupied
    const occupied = paths.find(p => p.color !== drawing.color && p.path.some(([pr, pc]) => pr === r && pc === c));
    if (occupied) return;
    if (getEndpointColor(r, c) && getEndpointColor(r, c) !== drawing.color) return;

    const newPath = [...drawing.path, [r, c]];
    setDrawing(d => ({ ...d, path: newPath }));
  };

  const handleRelease = () => {
    if (!drawing) return;
    const newPaths = [...paths.filter(p => p.color !== drawing.color), { color: drawing.color, path: drawing.path }];
    setPaths(newPaths);
    setDrawing(null);
    // Check win: all endpoints connected and grid full
    const allConnected = level.pairs.every(({ color, cells }) => {
      const p = newPaths.find(pp => pp.color === color);
      if (!p) return false;
      const [start, end] = cells;
      return p.path.some(([r,c]) => r===start[0]&&c===start[1]) && p.path.some(([r,c]) => r===end[0]&&c===end[1]);
    });
    if (allConnected) {
      setWon(true);
      onEnd?.(true, 0);
    }
  };

  const reset = () => {
    setGrid(initGrid(levelIdx)); setPaths([]); setDrawing(null); setWon(false);
  };

  const nextLevel = () => {
    const next = (levelIdx + 1) % LEVELS.length;
    setLevelIdx(next); setGrid(initGrid(next)); setPaths([]); setDrawing(null); setWon(false);
  };

  const cellSize = Math.floor(Math.min(300, window.innerWidth - 60) / level.size);

  const activePath = drawing ? [...paths.filter(p => p.color !== drawing.color), drawing] : paths;

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between px-1">
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Level {levelIdx + 1}</p>
        <p className="text-xs" style={{ color: "var(--text-hint)" }}>Connect matching colors</p>
      </div>

      <AnimatePresence>
        {won && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            className="p-3 rounded-2xl text-center font-bold"
            style={{ backgroundColor: "rgba(60,110,90,0.12)", color: "var(--accent-primary)" }}>
            🎉 Level Complete!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      <div className="flex justify-center"
        onMouseUp={handleRelease}
        onTouchEnd={handleRelease}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${level.size}, ${cellSize}px)`, gap: 3, padding: 8, borderRadius: 16, backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          {Array(level.size).fill(null).map((_, r) =>
            Array(level.size).fill(null).map((__, c) => {
              const color = getCellColor(r, c) || (drawing?.path.some(([pr,pc]) => pr===r&&pc===c) ? drawing.color : null);
              const isEndpoint = !!getEndpointColor(r, c);
              return (
                <motion.div
                  key={`${r}-${c}`}
                  onMouseDown={() => handleCellPress(r, c)}
                  onMouseEnter={() => handleCellEnter(r, c)}
                  onTouchStart={() => handleCellPress(r, c)}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    width: cellSize, height: cellSize,
                    borderRadius: isEndpoint ? "50%" : 6,
                    backgroundColor: color || "var(--bg-app)",
                    border: `2px solid ${color ? color : "var(--border-light)"}`,
                    boxShadow: isEndpoint && color ? `0 0 0 3px ${color}44` : "none",
                    transition: "background 0.15s",
                    cursor: "pointer",
                  }}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Color legend */}
      <div className="flex gap-2 justify-center flex-wrap">
        {level.pairs.map(({ color }) => {
          const connected = paths.find(p => {
            if (p.color !== color) return false;
            const pair = level.pairs.find(pp => pp.color === color);
            return pair.cells.every(([r,c]) => p.path.some(([pr,pc]) => pr===r&&pc===c));
          });
          return (
            <div key={color} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: `${color}18`, border: `1.5px solid ${color}`, color: color }}>
              {connected ? "✓" : "○"}
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        <motion.button whileTap={{ scale: 0.96 }} onClick={reset}
          className="flex-1 py-3 rounded-2xl font-semibold text-sm"
          style={{ border: "1px solid var(--border-light)", color: "var(--text-secondary)", backgroundColor: "var(--bg-card)" }}>
          ↺ Reset
        </motion.button>
        {won && (
          <motion.button whileTap={{ scale: 0.96 }} onClick={nextLevel}
            className="flex-1 py-3 rounded-2xl font-semibold text-white text-sm"
            style={{ backgroundColor: "var(--accent-primary)" }}>
            Next Level →
          </motion.button>
        )}
      </div>
    </div>
  );
}