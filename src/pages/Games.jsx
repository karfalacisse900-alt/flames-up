import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Gamepad2, Bot, Users, Shuffle, ChevronRight } from "lucide-react";

const games = [
  { id: "maze", name: "Maze Runner", desc: "Navigate the maze before time runs out", emoji: "🏃", color: "bg-amber-50 border-amber-200" },
  { id: "color-connect", name: "Color Connect", desc: "Match and connect the right colors", emoji: "🎨", color: "bg-violet-50 border-violet-200" },
  { id: "reaction", name: "Reaction Speed", desc: "Test your reflexes against the clock", emoji: "⚡", color: "bg-yellow-50 border-yellow-200" },
  { id: "memory", name: "Memory Match", desc: "Flip and match pairs of cards", emoji: "🧠", color: "bg-blue-50 border-blue-200" },
  { id: "math-speed", name: "Math Speed", desc: "Solve equations faster than your opponent", emoji: "🔢", color: "bg-green-50 border-green-200" },
  { id: "trivia", name: "Trivia Battle", desc: "Test your knowledge across topics", emoji: "❓", color: "bg-pink-50 border-pink-200" },
  { id: "tic-tac-toe", name: "Tic-Tac-Toe", desc: "Classic three in a row", emoji: "❌", color: "bg-indigo-50 border-indigo-200" },
  { id: "checkers", name: "Checkers", desc: "Strategic board game classic", emoji: "⬛", color: "bg-red-50 border-red-200" },
  { id: "chess", name: "Chess", desc: "The ultimate strategy game", emoji: "♟️", color: "bg-stone-100 border-stone-300" },
  { id: "ping-pong", name: "Ping Pong", desc: "Simple and addictive table tennis", emoji: "🏓", color: "bg-emerald-50 border-emerald-200" },
];

const modes = [
  { id: "ai", label: "vs AI", icon: Bot },
  { id: "friend", label: "vs Friend", icon: Users },
  { id: "random", label: "vs Random", icon: Shuffle },
];

export default function Games() {
  const [expandedGame, setExpandedGame] = useState(null);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
      <div className="px-5 pt-5 pb-3" style={{ backgroundColor: "var(--bg-nav)", borderBottom: "1px solid var(--border-light)" }}>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Games</h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>Play, compete & have fun</p>
      </div>

      <div className="px-5 space-y-3 pb-24 mt-4">
        {games.map((game) => (
          <div key={game.id} className="rounded-2xl overflow-hidden transition-all" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
            <button
              onClick={() => setExpandedGame(expandedGame === game.id ? null : game.id)}
              className="w-full p-4 flex items-center gap-3 text-left"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: "var(--bg-app)", border: "1px solid var(--border-light)" }}>
                {game.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium" style={{ color: "var(--text-primary)" }}>{game.name}</h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>{game.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 transition-transform" style={{ color: "var(--text-hint)", transform: expandedGame === game.id ? "rotate(90deg)" : "none" }} />
            </button>

            {expandedGame === game.id && (
              <div className="px-4 pb-4 flex gap-2">
                {modes.map((mode) => (
                  <Link
                    key={mode.id}
                    to={createPageUrl("GamePlay") + `?game=${game.id}&mode=${mode.id}`}
                    className="flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all"
                    style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-nav)" }}
                  >
                    <mode.icon className="w-5 h-5" style={{ color: "var(--accent-primary)" }} />
                    <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{mode.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}