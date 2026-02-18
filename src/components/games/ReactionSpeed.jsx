import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";

export default function ReactionSpeed({ onEnd }) {
  const [state, setState] = useState("waiting");
  const [reactionTime, setReactionTime] = useState(0);
  const [best, setBest] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const startTime = useRef(0);
  const timeoutRef = useRef(null);

  const start = () => {
    setState("ready");
    const delay = 1500 + Math.random() * 3500;
    timeoutRef.current = setTimeout(() => {
      startTime.current = Date.now();
      setState("go");
    }, delay);
  };

  const handleTap = () => {
    if (state === "waiting") { start(); return; }
    if (state === "ready") {
      clearTimeout(timeoutRef.current);
      setState("toosoon");
      setTimeout(() => setState("waiting"), 1200);
      return;
    }
    if (state === "go") {
      const t = Date.now() - startTime.current;
      setReactionTime(t);
      setAttempts(a => [...a.slice(-4), t]);
      if (!best || t < best) { setBest(t); }
      setState("done");
      onEnd?.(true, t);
    }
  };

  const rating = reactionTime < 180 ? { label: "⚡ Superhuman!", color: "#8B5CF6" }
    : reactionTime < 250 ? { label: "🏆 Excellent!", color: "var(--accent-primary)" }
    : reactionTime < 350 ? { label: "👍 Good!", color: "#5579A6" }
    : reactionTime < 500 ? { label: "😊 Average", color: "var(--accent-secondary)" }
    : { label: "🐢 Keep going!", color: "var(--text-secondary)" };

  const bgMap = { waiting: "var(--bg-card)", ready: "#FFF0F0", go: "#F0FFF8", done: "var(--bg-card)", toosoon: "#FFF8F0" };
  const borderMap = { waiting: "var(--border-light)", ready: "#FCA5A5", go: "#6EE7B7", done: "var(--accent-primary)", toosoon: "#FCD34D" };

  return (
    <div className="space-y-4 pb-6">
      {/* Best & Attempts */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-2xl text-center" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>Best</p>
          <p className="text-xl font-bold" style={{ color: "var(--accent-primary)" }}>{best ? `${best}ms` : "—"}</p>
        </div>
        <div className="p-3 rounded-2xl text-center" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>Attempts</p>
          <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{attempts.length}</p>
        </div>
      </div>

      {/* Main tap area */}
      <motion.button
        onClick={handleTap}
        animate={state === "go" ? { scale: [1, 1.02, 1] } : {}}
        transition={{ repeat: state === "go" ? Infinity : 0, duration: 0.5 }}
        className="w-full rounded-3xl flex flex-col items-center justify-center"
        style={{
          minHeight: "42vw",
          backgroundColor: bgMap[state],
          border: `3px solid ${borderMap[state]}`,
          transition: "background 0.3s, border 0.3s",
        }}
      >
        <AnimatePresence mode="wait">
          {state === "waiting" && (
            <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-8">
              <Zap className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-hint)" }} />
              <p className="font-semibold" style={{ color: "var(--text-secondary)" }}>Tap to Start</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>Tap when it turns green!</p>
            </motion.div>
          )}
          {state === "ready" && (
            <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-8">
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}>
                <p className="text-2xl font-black text-rose-500">Wait…</p>
              </motion.div>
              <p className="text-sm text-rose-400 mt-2">Don't tap yet!</p>
            </motion.div>
          )}
          {state === "go" && (
            <motion.div key="go" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 500 }} className="text-center py-8">
              <p className="text-5xl font-black text-emerald-600">TAP!</p>
            </motion.div>
          )}
          {state === "done" && (
            <motion.div key="done" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring" }} className="text-center py-8">
              <p className="text-5xl font-black" style={{ color: "var(--accent-primary)" }}>
                {reactionTime}<span className="text-2xl">ms</span>
              </p>
              <p className="text-sm mt-2 font-semibold" style={{ color: rating.color }}>{rating.label}</p>
            </motion.div>
          )}
          {state === "toosoon" && (
            <motion.div key="toosoon" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }} className="text-center py-8">
              <p className="text-3xl font-black text-amber-500">Too Soon! 😅</p>
              <p className="text-sm mt-2 text-amber-400">Wait for green…</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Last attempts */}
      {attempts.length > 0 && (
        <div>
          <p className="text-xs mb-2" style={{ color: "var(--text-hint)" }}>Recent attempts</p>
          <div className="flex gap-2">
            {attempts.map((t, i) => (
              <div key={i} className="flex-1 p-2 rounded-xl text-center" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                <p className="text-xs font-bold" style={{ color: t === best ? "var(--accent-primary)" : "var(--text-secondary)" }}>{t}ms</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {state === "done" && (
        <motion.button whileTap={{ scale: 0.96 }} onClick={() => setState("waiting")}
          className="w-full py-3 rounded-2xl font-semibold text-white"
          style={{ backgroundColor: "var(--accent-primary)" }}>
          Try Again
        </motion.button>
      )}
    </div>
  );
}