import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Users, Shuffle, ChevronRight, Gamepad2 } from "lucide-react";

const games = [
  { id: "rock-paper-scissors", name: "Rock Paper Scissors", desc: "Beat the AI at the classic game", emoji: "✊", gradient: "from-amber-400 to-orange-400" },
  { id: "tic-tac-toe", name: "Tic-Tac-Toe", desc: "Classic three in a row", emoji: "❌", gradient: "from-indigo-400 to-violet-500" },
  { id: "memory", name: "Memory Match", desc: "Flip and match pairs of cards", emoji: "🧠", gradient: "from-blue-400 to-cyan-400" },
  { id: "math-speed", name: "Math Speed", desc: "Solve equations as fast as you can", emoji: "🔢", gradient: "from-green-400 to-emerald-500" },
  { id: "trivia", name: "Trivia Battle", desc: "Test your knowledge across topics", emoji: "❓", gradient: "from-pink-400 to-rose-400" },
  { id: "reaction", name: "Reaction Speed", desc: "Test your reflexes against the clock", emoji: "⚡", gradient: "from-yellow-400 to-amber-400" },
  { id: "maze", name: "Maze Runner", desc: "Navigate the maze before time runs out", emoji: "🏃", gradient: "from-orange-400 to-red-400" },
  { id: "color-connect", name: "Color Connect", desc: "Match and connect the right colors", emoji: "🎨", gradient: "from-violet-400 to-purple-500" },
  { id: "checkers", name: "Checkers", desc: "Strategic board game classic", emoji: "⬛", gradient: "from-red-400 to-pink-500" },
  { id: "chess", name: "Chess", desc: "The ultimate strategy game", emoji: "♟️", gradient: "from-stone-400 to-stone-600" },
];

const modes = [
  { id: "ai", label: "vs AI", icon: Bot, color: "var(--accent-primary)" },
  { id: "friend", label: "vs Friend", icon: Users, color: "#5579A6" },
  { id: "random", label: "vs Random", icon: Shuffle, color: "var(--accent-secondary)" },
];

export default function Games() {
  const [expanded, setExpanded] = useState(null);

  return (
    <div style={{ minHeight: "100dvh", backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-5 pt-6 pb-4" style={{ backgroundColor: "var(--bg-nav)", borderBottom: "1px solid var(--border-light)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(60,110,90,0.12)" }}>
            <Gamepad2 className="w-5 h-5" style={{ color: "var(--accent-primary)" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Games</h1>
            <p className="text-xs" style={{ color: "var(--text-hint)" }}>Play, compete & win coins</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 pb-32 space-y-3">
        {games.map((game, gi) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: gi * 0.02, duration: 0.2 }}
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
          >
            <motion.button
              onClick={() => setExpanded(expanded === game.id ? null : game.id)}
              className="w-full p-4 flex items-center gap-3 text-left"
              whileTap={{ scale: 0.98 }}
            >
              {/* Emoji badge */}
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-gradient-to-br ${game.gradient} shadow-sm shrink-0`}>
                {game.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{game.name}</h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>{game.desc}</p>
              </div>
              <motion.div animate={{ rotate: expanded === game.id ? 90 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronRight className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {expanded === game.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeInOut" }}
                  style={{ overflow: "hidden" }}
                >
                  <div className="px-4 pb-4 flex gap-2">
                    {modes.map((mode) => (
                      <Link
                        key={mode.id}
                        to={createPageUrl("GamePlay") + `?game=${game.id}&mode=${mode.id}`}
                        className="flex-1 flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all active:scale-95"
                        style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-app)" }}
                      >
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${mode.color}18` }}>
                          <mode.icon className="w-4 h-4" style={{ color: mode.color }} />
                        </div>
                        <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{mode.label}</span>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}