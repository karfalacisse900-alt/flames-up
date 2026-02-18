import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ALL_QUESTIONS = [
  { q: "What's the capital of France?", opts: ["Paris","Lyon","Nice","Marseille"], correct: 0, cat: "🌍" },
  { q: "Which planet is closest to the sun?", opts: ["Mercury","Venus","Earth","Mars"], correct: 0, cat: "🚀" },
  { q: "What's the largest ocean?", opts: ["Atlantic","Indian","Arctic","Pacific"], correct: 3, cat: "🌊" },
  { q: "How many continents are there?", opts: ["5","6","7","8"], correct: 2, cat: "🌍" },
  { q: "Chemical symbol for gold?", opts: ["Go","Gd","Au","Ag"], correct: 2, cat: "⚗️" },
  { q: "Who painted the Mona Lisa?", opts: ["Michelangelo","Da Vinci","Raphael","Donatello"], correct: 1, cat: "🎨" },
  { q: "Square root of 144?", opts: ["10","12","14","16"], correct: 1, cat: "🔢" },
  { q: "Most populated country?", opts: ["USA","India","China","Russia"], correct: 2, cat: "🌍" },
  { q: "Fastest land animal?", opts: ["Lion","Cheetah","Antelope","Greyhound"], correct: 1, cat: "🐆" },
  { q: "Strings on a violin?", opts: ["3","4","5","6"], correct: 1, cat: "🎻" },
  { q: "Hardest natural substance?", opts: ["Steel","Ruby","Diamond","Obsidian"], correct: 2, cat: "💎" },
  { q: "How many bones in adult human body?", opts: ["196","206","216","226"], correct: 1, cat: "🦴" },
  { q: "Year World War II ended?", opts: ["1943","1944","1945","1946"], correct: 2, cat: "📅" },
  { q: "Speed of light (km/s)?", opts: ["200,000","300,000","400,000","500,000"], correct: 1, cat: "⚡" },
  { q: "What gas do plants absorb?", opts: ["Oxygen","Nitrogen","CO₂","Helium"], correct: 2, cat: "🌿" },
];

const TOTAL = 10;
const QUESTION_TIME = 15;

export default function Trivia() {
  const [phase, setPhase] = useState("intro");
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [correct, setCorrect] = useState(null); // true | false | null

  const start = () => {
    const shuffled = [...ALL_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, TOTAL);
    setQuestions(shuffled);
    setIdx(0); setScore(0); setSelected(null); setCorrect(null);
    setTimeLeft(QUESTION_TIME);
    setPhase("playing");
  };

  useEffect(() => {
    if (phase !== "playing" || selected !== null) return;
    if (timeLeft <= 0) { handleAnswer(-1); return; }
    const t = setInterval(() => setTimeLeft(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [phase, timeLeft, selected]);

  const handleAnswer = (i) => {
    if (selected !== null) return;
    setSelected(i);
    const isCorrect = i === questions[idx]?.correct;
    setCorrect(isCorrect);
    if (isCorrect) setScore(s => s + Math.ceil((timeLeft / QUESTION_TIME) * 10));
  };

  const next = () => {
    if (idx + 1 >= questions.length) { setPhase("done"); return; }
    setIdx(i => i + 1);
    setSelected(null); setCorrect(null);
    setTimeLeft(QUESTION_TIME);
  };

  const q = questions[idx];
  const progress = ((idx + 1) / TOTAL) * 100;

  if (phase === "intro") return (
    <div className="flex flex-col items-center justify-center space-y-6 pb-6 pt-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="text-6xl mb-4">❓</div>
        <h3 className="text-xl font-bold mb-1" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Trivia Battle</h3>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>10 questions. Answer faster = more points!</p>
      </motion.div>
      <motion.button whileTap={{ scale: 0.95 }} onClick={start}
        className="px-8 py-3.5 rounded-2xl font-semibold text-white"
        style={{ backgroundColor: "var(--accent-primary)", boxShadow: "0 4px 16px rgba(60,110,90,0.4)" }}>
        Start Quiz
      </motion.button>
    </div>
  );

  if (phase === "done") {
    const pct = Math.round((score / (TOTAL * 10)) * 100);
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center space-y-5 pb-6 pt-4">
        <div className="text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}
            className="text-6xl mb-3">{pct >= 80 ? "🏆" : pct >= 50 ? "🎯" : "📚"}</motion.div>
          <h3 className="text-xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Quiz Complete!</h3>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-5xl font-black mt-2" style={{ color: "var(--accent-primary)" }}>{score}</motion.p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>points out of {TOTAL * 10}</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>{pct}% performance</p>
        </div>
        {/* Score bar */}
        <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border-light)" }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.4 }}
            className="h-full rounded-full" style={{ backgroundColor: "var(--accent-primary)" }} />
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={start}
          className="px-8 py-3.5 rounded-2xl font-semibold text-white"
          style={{ backgroundColor: "var(--accent-primary)", boxShadow: "0 4px 16px rgba(60,110,90,0.4)" }}>
          Try Again
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-hint)" }}>
        <span>{q?.cat} Q {idx + 1} / {TOTAL}</span>
        <span style={{ color: "var(--accent-primary)", fontWeight: 600 }}>Score: {score}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border-light)" }}>
        <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }}
          className="h-full rounded-full" style={{ backgroundColor: "var(--accent-primary)" }} />
      </div>

      {/* Timer */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border-light)" }}>
          <motion.div
            animate={{ width: `${(timeLeft / QUESTION_TIME) * 100}%` }}
            transition={{ duration: 0.9, ease: "linear" }}
            className="h-full rounded-full"
            style={{ backgroundColor: timeLeft <= 5 ? "#E05C7A" : "#D98B62" }} />
        </div>
        <motion.span animate={{ color: timeLeft <= 5 ? "#E05C7A" : "var(--text-secondary)" }}
          className="text-xs font-bold w-6 text-right">{timeLeft}s</motion.span>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div key={idx}
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
          className="p-5 rounded-3xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <p className="text-base font-semibold leading-relaxed" style={{ color: "var(--text-primary)" }}>{q?.q}</p>
        </motion.div>
      </AnimatePresence>

      {/* Options */}
      <div className="space-y-2">
        {q?.opts.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrectOpt = i === q.correct;
          let bg = "var(--bg-card)", border = "var(--border-light)", textColor = "var(--text-primary)";
          if (selected !== null) {
            if (isCorrectOpt) { bg = "rgba(60,110,90,0.12)"; border = "var(--accent-primary)"; textColor = "var(--accent-primary)"; }
            else if (isSelected) { bg = "rgba(224,92,122,0.12)"; border = "#E05C7A"; textColor = "#E05C7A"; }
          }
          return (
            <motion.button key={i}
              onClick={() => handleAnswer(i)}
              disabled={selected !== null}
              whileTap={{ scale: selected !== null ? 1 : 0.97 }}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="w-full p-4 rounded-2xl text-left flex items-center gap-3"
              style={{ backgroundColor: bg, border: `2px solid ${border}`, color: textColor, transition: "all 0.2s" }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{ backgroundColor: "var(--bg-app)", color: textColor }}>
                {String.fromCharCode(65 + i)}
              </div>
              <span className="font-medium text-sm">{opt}</span>
              {selected !== null && isCorrectOpt && <span className="ml-auto text-lg">✓</span>}
              {selected !== null && isSelected && !isCorrectOpt && <span className="ml-auto text-lg">✗</span>}
            </motion.button>
          );
        })}
      </div>

      {/* Next */}
      <AnimatePresence>
        {selected !== null && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="p-3 rounded-2xl text-center text-sm font-bold"
              style={{
                backgroundColor: correct ? "rgba(60,110,90,0.1)" : "rgba(224,92,122,0.1)",
                color: correct ? "var(--accent-primary)" : "#E05C7A",
              }}>
              {correct ? `✅ Correct! +${Math.ceil((timeLeft / QUESTION_TIME) * 10)} pts` : `❌ Wrong! Correct: ${q.opts[q.correct]}`}
            </div>
            <motion.button whileTap={{ scale: 0.96 }} onClick={next}
              className="w-full py-3.5 rounded-2xl font-semibold text-white"
              style={{ backgroundColor: "var(--accent-primary)", boxShadow: "0 4px 14px rgba(60,110,90,0.35)" }}>
              {idx + 1 >= TOTAL ? "See Results" : "Next Question →"}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}