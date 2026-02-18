import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const EMOJI_SETS = [
  ["🎨","🎭","🎪","🎯","🎲","🎸","🎺","🎻"],
  ["🌿","🍃","🌸","🌺","🦋","🐝","🌻","🍂"],
  ["🦁","🐬","🦊","🐸","🦄","🐼","🦅","🐙"],
];

export default function MemoryMatch() {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [won, setWon] = useState(false);
  const [level, setLevel] = useState(0);
  const [wrong, setWrong] = useState([]);

  const initGame = (lvl = level) => {
    const emojis = EMOJI_SETS[lvl % EMOJI_SETS.length];
    const deck = [...emojis, ...emojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({ id: i, emoji }));
    setCards(deck);
    setFlipped([]); setMatched([]); setWrong([]);
    setMoves(0); setTime(0);
    setWon(false); setGameActive(true);
  };

  useEffect(() => {
    if (!gameActive || won) return;
    const t = setInterval(() => setTime(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [gameActive, won]);

  useEffect(() => {
    if (flipped.length !== 2) return;
    const [a, b] = flipped;
    setMoves(m => m + 1);
    if (cards[a].emoji === cards[b].emoji) {
      const newMatched = [...matched, a, b];
      setMatched(newMatched);
      setFlipped([]);
      if (newMatched.length === cards.length) {
        setWon(true); setGameActive(false);
      }
    } else {
      setWrong([a, b]);
      const t = setTimeout(() => { setFlipped([]); setWrong([]); }, 800);
      return () => clearTimeout(t);
    }
  }, [flipped]);

  const tap = (i) => {
    if (!gameActive || flipped.length === 2 || flipped.includes(i) || matched.includes(i)) return;
    setFlipped(f => [...f, i]);
  };

  const fmt = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;

  if (!gameActive && !won && cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 pb-6 pt-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="text-6xl mb-4">🧠</div>
          <h3 className="text-xl font-bold mb-1" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Memory Match</h3>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Flip & match all pairs as fast as you can!</p>
        </motion.div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => initGame(0)}
          className="px-8 py-3.5 rounded-2xl font-semibold text-white"
          style={{ backgroundColor: "var(--accent-primary)", boxShadow: "0 4px 16px rgba(60,110,90,0.4)" }}>
          Start Game
        </motion.button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Moves", val: moves, color: "var(--accent-primary)" },
          { label: "Time", val: fmt(time), color: "var(--accent-secondary)" },
          { label: "Pairs", val: `${matched.length/2}/8`, color: "#5579A6" },
        ].map(s => (
          <div key={s.label} className="p-3 rounded-2xl text-center" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
            <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>{s.label}</p>
            <p className="text-xl font-bold" style={{ color: s.color }}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Win banner */}
      <AnimatePresence>
        {won && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="p-4 rounded-2xl text-center font-bold"
            style={{ backgroundColor: "rgba(60,110,90,0.12)", color: "var(--accent-primary)" }}>
            🎉 Done in {moves} moves • {fmt(time)}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Board */}
      <div className="grid grid-cols-4 gap-2 p-3 rounded-3xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
        {cards.map((card, i) => {
          const isFlipped = flipped.includes(i) || matched.includes(i);
          const isMatch = matched.includes(i);
          const isWrong = wrong.includes(i);
          return (
            <motion.button
              key={card.id}
              onClick={() => tap(i)}
              whileTap={{ scale: isFlipped ? 1 : 0.88 }}
              className="aspect-square rounded-xl flex items-center justify-center text-2xl relative overflow-hidden"
              style={{
                backgroundColor: isMatch ? "rgba(60,110,90,0.12)" : isWrong ? "rgba(224,92,122,0.12)" : isFlipped ? "white" : "var(--bg-app)",
                border: `2px solid ${isMatch ? "var(--accent-primary)" : isWrong ? "#E05C7A" : isFlipped ? "var(--border-medium)" : "var(--border-light)"}`,
                transition: "background 0.2s, border 0.2s",
              }}
            >
              <AnimatePresence mode="wait">
                {isFlipped ? (
                  <motion.span key="face"
                    initial={{ rotateY: 90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    transition={{ duration: 0.2 }}>
                    {card.emoji}
                  </motion.span>
                ) : (
                  <motion.span key="back"
                    initial={{ rotateY: -90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    style={{ color: "var(--text-hint)", fontSize: "1rem" }}>?</motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      <motion.button whileTap={{ scale: 0.96 }} onClick={() => initGame()}
        className="w-full py-3.5 rounded-2xl font-semibold text-white text-sm"
        style={{ backgroundColor: "var(--accent-primary)", boxShadow: "0 4px 14px rgba(60,110,90,0.35)" }}>
        {won ? "▶  Next Level" : "↺  Restart"}
      </motion.button>
    </div>
  );
}