import React, { useState, useEffect } from "react";
import { RotateCcw } from "lucide-react";

const emojis = ["🎨", "🎭", "🎪", "🎯", "🎲", "🎸", "🎺", "🎻"];

export default function MemoryMatch() {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [gameActive, setGameActive] = useState(true);

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    if (!gameActive) return;
    const timer = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, [gameActive]);

  const initializeGame = () => {
    const shuffled = [...emojis, ...emojis].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setTime(0);
    setGameActive(true);
  };

  useEffect(() => {
    if (flipped.length !== 2) return;

    const [first, second] = flipped;
    if (cards[first] === cards[second]) {
      setMatched(prev => [...prev, first, second]);
      setFlipped([]);
      setMoves(prev => prev + 1);

      if (matched.length + 2 === cards.length) {
        setGameActive(false);
      }
    } else {
      const timer = setTimeout(() => setFlipped([]), 600);
      setMoves(prev => prev + 1);
      return () => clearTimeout(timer);
    }
  }, [flipped, cards, matched.length]);

  const handleClick = (index) => {
    if (!gameActive || flipped.length === 2 || flipped.includes(index) || matched.includes(index)) return;
    setFlipped([...flipped, index]);
  };

  const isMatched = (index) => matched.includes(index);
  const isFlipped = (index) => flipped.includes(index);

  const formatTime = (seconds) => {
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-xl text-center" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>Moves</p>
          <p className="text-2xl font-bold" style={{ color: "var(--accent-primary)" }}>{moves}</p>
        </div>
        <div className="p-3 rounded-xl text-center" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>Time</p>
          <p className="text-xl font-bold" style={{ color: "var(--accent-primary)" }}>{formatTime(time)}</p>
        </div>
        <div className="p-3 rounded-xl text-center" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>Matched</p>
          <p className="text-2xl font-bold" style={{ color: "var(--accent-primary)" }}>{matched.length / 2} / 8</p>
        </div>
      </div>

      {/* Game Board */}
      <div className="grid grid-cols-4 gap-2 p-4 rounded-2xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
        {cards.map((emoji, index) => (
          <button
            key={index}
            onClick={() => handleClick(index)}
            className="aspect-square rounded-xl text-2xl font-bold transition-all"
            style={{
              backgroundColor: isFlipped(index) || isMatched(index) ? "var(--accent-primary)" : "var(--bg-app)",
              color: "white",
              border: "1px solid var(--border-light)",
              opacity: isMatched(index) ? 0.5 : 1,
            }}
          >
            {isFlipped(index) || isMatched(index) ? emoji : "?"}
          </button>
        ))}
      </div>

      {/* Status */}
      {!gameActive && matched.length === cards.length && (
        <div className="p-4 rounded-xl text-center font-bold bg-green-100 text-green-700">
          🎉 Complete in {moves} moves and {formatTime(time)}!
        </div>
      )}

      {/* Buttons */}
      <button
        onClick={initializeGame}
        className="w-full p-3 rounded-xl font-medium text-white"
        style={{ backgroundColor: "var(--accent-primary)" }}
      >
        {!gameActive ? "Play Again" : "Restart"}
      </button>
    </div>
  );
}