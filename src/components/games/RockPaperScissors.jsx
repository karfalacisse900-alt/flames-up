import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw } from "lucide-react";

const choices = ["Rock", "Paper", "Scissors"];
const emojis = { Rock: "✊", Paper: "✋", Scissors: "✌️" };

function getWinner(p, a) {
  if (p === a) return "tie";
  if ((p==="Rock"&&a==="Scissors")||(p==="Paper"&&a==="Rock")||(p==="Scissors"&&a==="Paper")) return "win";
  return "lose";
}

export default function RockPaperScissors() {
  const [player, setPlayer] = useState(null);
  const [ai, setAi] = useState(null);
  const [result, setResult] = useState(null);
  const [scores, setScores] = useState({ player: 0, ai: 0, tie: 0 });
  const [animating, setAnimating] = useState(false);
  const [shake, setShake] = useState(false);

  const play = (choice) => {
    if (animating) return;
    setAnimating(true);
    setPlayer(null); setAi(null); setResult(null);
    setShake(true);
    setTimeout(() => setShake(false), 600);
    setTimeout(() => {
      const aiPick = choices[Math.floor(Math.random() * 3)];
      const outcome = getWinner(choice, aiPick);
      setPlayer(choice); setAi(aiPick); setResult(outcome);
      setScores(s => ({
        ...s,
        player: s.player + (outcome==="win"?1:0),
        ai: s.ai + (outcome==="lose"?1:0),
        tie: s.tie + (outcome==="tie"?1:0),
      }));
      setAnimating(false);
    }, 700);
  };

  const reset = () => { setPlayer(null); setAi(null); setResult(null); setScores({ player:0, ai:0, tie:0 }); };

  return (
    <div className="space-y-5 pb-6">
      {/* Scores */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "You", val: scores.player, color: "var(--accent-primary)" },
          { label: "Tie", val: scores.tie, color: "var(--text-secondary)" },
          { label: "AI", val: scores.ai, color: "#E05C7A" },
        ].map(s => (
          <div key={s.label} className="p-3 rounded-2xl text-center" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
            <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>{s.label}</p>
            <motion.p key={s.val} initial={{ scale: 1.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="text-2xl font-bold" style={{ color: s.color }}>{s.val}</motion.p>
          </div>
        ))}
      </div>

      {/* Battle arena */}
      <div className="grid grid-cols-2 gap-4">
        {/* Player */}
        <div className="p-4 rounded-2xl text-center" style={{ backgroundColor: "rgba(60,110,90,0.08)", border: "2px solid rgba(60,110,90,0.2)" }}>
          <p className="text-[10px] mb-2" style={{ color: "var(--text-hint)" }}>YOU</p>
          <AnimatePresence mode="wait">
            {player ? (
              <motion.div key={player} initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300 }} className="text-5xl">
                {emojis[player]}
              </motion.div>
            ) : animating ? (
              <motion.div key="animating-p" animate={{ rotate: [0, -20, 20, -20, 20, 0] }}
                transition={{ duration: 0.6, ease: "easeInOut" }} className="text-5xl">✊</motion.div>
            ) : (
              <motion.div key="empty-p" className="text-5xl opacity-30">❓</motion.div>
            )}
          </AnimatePresence>
          <p className="text-xs mt-2 font-medium" style={{ color: "var(--text-secondary)" }}>{player || "—"}</p>
        </div>

        {/* AI */}
        <div className="p-4 rounded-2xl text-center" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <p className="text-[10px] mb-2" style={{ color: "var(--text-hint)" }}>AI</p>
          <AnimatePresence mode="wait">
            {ai ? (
              <motion.div key={ai} initial={{ scale: 0, rotate: 20 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300 }} className="text-5xl" style={{ transform: "scaleX(-1)", display: "inline-block" }}>
                {emojis[ai]}
              </motion.div>
            ) : animating ? (
              <motion.div key="animating-a" animate={{ rotate: [0, 20, -20, 20, -20, 0] }}
                transition={{ duration: 0.6, ease: "easeInOut" }} className="text-5xl" style={{ display: "inline-block" }}>✊</motion.div>
            ) : (
              <motion.div key="empty-a" className="text-5xl opacity-30">❓</motion.div>
            )}
          </AnimatePresence>
          <p className="text-xs mt-2 font-medium" style={{ color: "var(--text-secondary)" }}>{ai || "—"}</p>
        </div>
      </div>

      {/* Result banner */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
            className="p-4 rounded-2xl text-center font-bold text-lg"
            style={{
              backgroundColor: result==="win" ? "rgba(60,110,90,0.12)" : result==="lose" ? "rgba(224,92,122,0.12)" : "rgba(245,158,11,0.12)",
              color: result==="win" ? "var(--accent-primary)" : result==="lose" ? "#E05C7A" : "#B45309",
            }}>
            {result==="win" ? "🎉 You Win!" : result==="lose" ? "😢 You Lose!" : "🤝 It's a Tie!"}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Choice buttons */}
      <div>
        <p className="text-xs text-center mb-3" style={{ color: "var(--text-hint)" }}>Pick your move</p>
        <div className="grid grid-cols-3 gap-3">
          {choices.map(c => (
            <motion.button key={c} whileTap={{ scale: 0.88 }} onClick={() => play(c)}
              className="py-4 rounded-2xl flex flex-col items-center gap-2"
              style={{ backgroundColor: "var(--bg-card)", border: "2px solid var(--border-light)" }}>
              <span className="text-3xl">{emojis[c]}</span>
              <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>{c}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <button onClick={reset}
        className="w-full py-2 rounded-xl flex items-center justify-center gap-2 text-xs"
        style={{ color: "var(--text-hint)", border: "1px solid var(--border-light)" }}>
        <RotateCcw className="w-3 h-3" /> Reset Scores
      </button>
    </div>
  );
}