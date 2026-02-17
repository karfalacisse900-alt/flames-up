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
    <div className="min-h-screen">
      <div className="px-5 pt-5 pb-3">
        <h1 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>Games</h1>
        <p className="text-xs text-[#9B9B9B] mt-0.5">Play, compete & have fun</p>
      </div>

      <div className="px-5 space-y-3 pb-24 mt-2">
        {games.map((game) => (
          <div key={game.id} className="bg-white rounded-2xl border border-[#EDE9E3] overflow-hidden transition-all">
            <button
              onClick={() => setExpandedGame(expandedGame === game.id ? null : game.id)}
              className="w-full p-4 flex items-center gap-3 text-left"
            >
              <div className={`w-12 h-12 rounded-xl ${game.color} border flex items-center justify-center text-xl`}>
                {game.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-[#2C2C2C]">{game.name}</h3>
                <p className="text-xs text-[#9B9B9B] mt-0.5">{game.desc}</p>
              </div>
              <ChevronRight className={`w-4 h-4 text-[#9B9B9B] transition-transform ${expandedGame === game.id ? "rotate-90" : ""}`} />
            </button>

            {expandedGame === game.id && (
              <div className="px-4 pb-4 flex gap-2">
                {modes.map((mode) => (
                  <Link
                    key={mode.id}
                    to={createPageUrl("GamePlay") + `?game=${game.id}&mode=${mode.id}`}
                    className="flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl border border-[#EDE9E3] hover:border-[#7C8C6E] hover:bg-[#7C8C6E]/5 transition-all"
                  >
                    <mode.icon className="w-5 h-5 text-[#7C8C6E]" />
                    <span className="text-xs font-medium text-[#6B6B6B]">{mode.label}</span>
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