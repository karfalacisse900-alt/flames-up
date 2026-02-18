import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

function generateQ(level) {
  const ops = level < 2 ? ["+", "-"] : ["+", "-", "×"];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a, b;
  if (op === "×") { a = Math.floor(Math.random() * 10) + 2; b = Math.floor(Math.random() * 10) + 2; }
  else if (op === "+") { a = Math.floor(Math.random() * (20 * (level+1))) + 5; b = Math.floor(Math.random() * (20 * (level+1))) + 5; }
  else { a = Math.floor(Math.random() * 50) + 20; b = Math.floor(Math.random() * 20) + 1; }
  const result = op === "+" ? a + b : op === "-" ? a - b : a * b;
  return { text: `${a} ${op} ${b}`, result };
}

export default function MathSpeed() {
  const [phase, setPhase] = useState("intro"); // intro | playing | done
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [time, setTime] = useState(30);
  const [feedback, setFeedback] = useState(null); // null | "correct" | "wrong"
  const [level] = useState(1);
  const inputRef = useRef(null);

  useEffect(() => {
    if (phase !== "playing") return;
    const t = setInterval(() => setTime(s => {
      if (s <= 1) { setPhase("done"); clearInterval(t); return 0; }
      return s - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const start = () => {
    setQuestion(generateQ(level));
    setScore(0); setStreak(0); setTime(30);
    setAnswer(""); setFeedback(null);
    setPhase("playing");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const submit = () => {
    if (!answer || phase !== "playing") return;
    if (parseInt(answer) === question.result) {
      const ns = streak + 1;
      setScore(s => s + 1 + (ns >= 3 ? 1 : 0)); // bonus for streak ≥ 3
      setStreak(ns);
      if (ns > bestStreak) setBestStreak(ns);
      setFeedback("correct");
    } else {
      setStreak(0);
      setFeedback("wrong");
    }
    setTimeout(() => { setFeedback(null); setQuestion(generateQ(level)); }, 250);
    setAnswer("");
    inputRef.current?.focus();
  };

  const timerColor = time <= 5 ? "#E05C7A" : time <= 10 ? "#D98B62" : "var(--accent-primary)";
  const timerPct = (time / 30) * 100;

  if (phase === "intro") return (
    <div className="flex flex-col items-center justify-center space-y-6 pb-6 pt-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="text-6xl mb-4">🔢</div>
        <h3 className="text-xl font-bold mb-1" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Math Speed</h3>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Solve as many equations as you can in 30 seconds!</p>
        <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>Streak bonus: 3+ in a row = extra point</p>
      </motion.div>
      <motion.button whileTap={{ scale: 0.95 }} onClick={start}
        className="px-8 py-3.5 rounded-2xl font-semibold text-white"
        style={{ backgroundColor: "var(--accent-primary)", boxShadow: "0 4px 16px rgba(60,110,90,0.4)" }}>
        Start Game
      </motion.button>
    </div>
  );

  if (phase === "done") return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center space-y-5 pb-6 pt-4">
      <div className="text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}
          className="text-6xl mb-3">{score >= 15 ? "🏆" : score >= 8 ? "🎯" : "💪"}</motion.div>
        <h3 className="text-xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Time's Up!</h3>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="text-5xl font-black mt-2" style={{ color: "var(--accent-primary)" }}>{score}</motion.p>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>correct answers</p>
        {bestStreak >= 3 && <p className="text-xs mt-1" style={{ color: "var(--accent-secondary)" }}>🔥 Best streak: {bestStreak}</p>}
      </div>
      <motion.button whileTap={{ scale: 0.95 }} onClick={start}
        className="px-8 py-3.5 rounded-2xl font-semibold text-white"
        style={{ backgroundColor: "var(--accent-primary)", boxShadow: "0 4px 16px rgba(60,110,90,0.4)" }}>
        ▶  Play Again
      </motion.button>
    </motion.div>
  );

  return (
    <div className="space-y-5 pb-6">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-2xl text-center" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>Score</p>
          <motion.p key={score} initial={{ scale: 1.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="text-2xl font-bold" style={{ color: "var(--accent-primary)" }}>{score}</motion.p>
        </div>
        <div className="p-3 rounded-2xl text-center" style={{ backgroundColor: streak >= 3 ? "rgba(217,139,98,0.12)" : "var(--bg-card)", border: `1px solid ${streak >= 3 ? "var(--accent-secondary)" : "var(--border-light)"}` }}>
          <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>Streak {streak >= 3 ? "🔥" : ""}</p>
          <motion.p key={streak} initial={{ scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="text-2xl font-bold" style={{ color: streak >= 3 ? "var(--accent-secondary)" : "var(--text-secondary)" }}>{streak}</motion.p>
        </div>
        <div className="p-3 rounded-2xl text-center" style={{ backgroundColor: time <= 5 ? "rgba(224,92,122,0.1)" : "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>Time</p>
          <motion.p key={time} animate={{ scale: time <= 5 ? [1, 1.2, 1] : 1 }} transition={{ duration: 0.3 }}
            className="text-2xl font-bold" style={{ color: timerColor }}>{time}s</motion.p>
        </div>
      </div>

      {/* Timer bar */}
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border-light)" }}>
        <motion.div animate={{ width: `${timerPct}%` }} transition={{ duration: 0.9, ease: "linear" }}
          className="h-full rounded-full" style={{ backgroundColor: timerColor }} />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div key={question?.text}
          initial={{ opacity: 0, y: -12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.18 }}
          className="p-6 rounded-3xl text-center"
          style={{
            backgroundColor: feedback === "correct" ? "rgba(60,110,90,0.1)" : feedback === "wrong" ? "rgba(224,92,122,0.1)" : "var(--bg-card)",
            border: `2px solid ${feedback === "correct" ? "var(--accent-primary)" : feedback === "wrong" ? "#E05C7A" : "var(--border-light)"}`,
            transition: "background 0.15s, border 0.15s",
          }}>
          <p className="text-xs mb-1" style={{ color: "var(--text-hint)" }}>What is…</p>
          <p className="text-5xl font-black" style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
            {question?.text}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="number"
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
          placeholder="Answer…"
          className="flex-1 px-4 py-3.5 rounded-2xl border text-center text-xl font-bold outline-none"
          style={{ borderColor: "var(--border-medium)", backgroundColor: "white", color: "var(--text-primary)" }}
        />
        <motion.button whileTap={{ scale: 0.93 }} onClick={submit}
          className="px-5 py-3 rounded-2xl font-semibold text-white"
          style={{ backgroundColor: "var(--accent-primary)" }}>
          ✓
        </motion.button>
      </div>
    </div>
  );
}