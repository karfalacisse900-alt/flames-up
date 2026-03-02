import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, Plus, Trophy, X, Check } from "lucide-react";

const GAME_TYPES = [
  { key: "true_false", label: "True or False", emoji: "🤔", desc: "Host a True/False question" },
  { key: "poll_battle", label: "Poll Battle", emoji: "⚔️", desc: "Let members vote on options" },
  { key: "rating_challenge", label: "Rating Challenge", emoji: "⭐", desc: "Rate outfits, food, memes" },
  { key: "truth_dare", label: "Truth or Dare", emoji: "🎯", desc: "Classic T or D for the group" },
  { key: "comedy_react", label: "Comedy React", emoji: "😂", desc: "Share a joke, group reacts" },
];

function CreateGameModal({ group, user, onClose, onCreated }) {
  const [gameType, setGameType] = useState("poll_battle");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [saving, setSaving] = useState(false);

  const needsOptions = ["poll_battle", "rating_challenge", "truth_dare"].includes(gameType);

  const handleCreate = async () => {
    if (!question.trim()) return;
    setSaving(true);
    const opts = gameType === "true_false" ? ["True", "False"] : needsOptions ? options.filter(o => o.trim()) : [];
    await base44.entities.GroupGame.create({
      group_id: group.id,
      group_name: group.name,
      game_type: gameType,
      question: question.trim(),
      options: opts,
      votes: {},
      host_email: user.email,
      host_name: user.full_name || user.email,
      is_active: true,
    });
    setSaving(false);
    onCreated();
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={onClose}>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-lg mx-auto rounded-t-3xl overflow-hidden"
        style={{ backgroundColor: "#F2EDE4", maxHeight: "90vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>
        <div className="h-1.5 w-12 rounded-full mx-auto mt-3 mb-1" style={{ backgroundColor: "var(--border-medium)" }} />
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Start a Game</h2>
            <button onClick={onClose}><X className="w-5 h-5" style={{ color: "var(--text-hint)" }} /></button>
          </div>

          <div className="space-y-4 pb-8">
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Game Type</p>
              <div className="space-y-2">
                {GAME_TYPES.map(g => (
                  <button key={g.key} onClick={() => setGameType(g.key)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all"
                    style={{
                      backgroundColor: gameType === g.key ? "var(--accent-primary-light)" : "var(--bg-subtle)",
                      borderColor: gameType === g.key ? "var(--accent-primary)" : "var(--border-light)",
                    }}>
                    <span className="text-xl">{g.emoji}</span>
                    <div>
                      <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{g.label}</p>
                      <p className="text-xs" style={{ color: "var(--text-hint)" }}>{g.desc}</p>
                    </div>
                    {gameType === g.key && <Check className="w-4 h-4 ml-auto" style={{ color: "var(--accent-primary)" }} />}
                  </button>
                ))}
              </div>
            </div>

            <textarea value={question} onChange={e => setQuestion(e.target.value)} rows={3}
              placeholder={gameType === "truth_dare" ? "Write the truth or dare prompt..." : "Write your question..."}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />

            {needsOptions && gameType !== "true_false" && (
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Options</p>
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <input value={opt} onChange={e => { const o = [...options]; o[i] = e.target.value; setOptions(o); }}
                      placeholder={`Option ${i + 1}`}
                      className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
                    {options.length > 2 && (
                      <button onClick={() => setOptions(options.filter((_, idx) => idx !== i))}>
                        <X className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
                      </button>
                    )}
                  </div>
                ))}
                {options.length < 6 && (
                  <button onClick={() => setOptions([...options, ""])}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl"
                    style={{ backgroundColor: "var(--bg-subtle)", color: "var(--accent-primary)" }}>
                    + Add Option
                  </button>
                )}
              </div>
            )}

            <button onClick={handleCreate} disabled={saving || !question.trim()}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)" }}>
              {saving ? "Starting..." : "🎮 Start Game"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function GameCard({ game, user }) {
  const qc = useQueryClient();
  const myVote = game.votes?.[user?.email];
  const totalVotes = Object.keys(game.votes || {}).length;

  const vote = async (optionIdx) => {
    if (!user?.email || !game.is_active) return;
    const newVotes = { ...(game.votes || {}), [user.email]: optionIdx };
    await base44.entities.GroupGame.update(game.id, { votes: newVotes });
    qc.invalidateQueries({ queryKey: ["groupGames", game.group_id] });
  };

  const getVoteCount = (idx) => Object.values(game.votes || {}).filter(v => v === idx).length;
  const getVotePct = (idx) => totalVotes > 0 ? Math.round((getVoteCount(idx) / totalVotes) * 100) : 0;

  const typeInfo = GAME_TYPES.find(g => g.key === game.game_type);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="mx-4 mb-3 rounded-2xl overflow-hidden"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{typeInfo?.emoji || "🎮"}</span>
          <div>
            <p className="text-xs font-bold" style={{ color: "var(--accent-primary)" }}>{typeInfo?.label}</p>
            <p className="text-xs" style={{ color: "var(--text-hint)" }}>by {game.host_name}</p>
          </div>
          {!game.is_active && (
            <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>Ended</span>
          )}
        </div>

        <p className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{game.question}</p>

        {game.options?.length > 0 && (
          <div className="space-y-2">
            {game.options.map((opt, idx) => {
              const voted = myVote === idx;
              const revealed = myVote !== undefined;
              const pct = getVotePct(idx);
              return (
                <button key={idx} onClick={() => vote(idx)} disabled={!game.is_active}
                  className="w-full relative overflow-hidden rounded-xl transition-all"
                  style={{ border: `1.5px solid ${voted ? "var(--accent-primary)" : "var(--border-light)"}` }}>
                  {revealed && (
                    <div className="absolute inset-y-0 left-0 transition-all" style={{ width: `${pct}%`, backgroundColor: voted ? "var(--accent-primary)" : "var(--bg-subtle)" }} />
                  )}
                  <div className="relative flex items-center justify-between px-3 py-2.5">
                    <span className="text-sm font-semibold" style={{ color: voted ? (revealed ? "#fff" : "var(--accent-primary)") : "var(--text-primary)" }}>{opt}</span>
                    {revealed && <span className="text-xs font-bold" style={{ color: voted ? "#fff" : "var(--text-hint)" }}>{pct}%</span>}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <p className="text-xs mt-2" style={{ color: "var(--text-hint)" }}>{totalVotes} vote{totalVotes !== 1 ? "s" : ""}</p>
      </div>
    </motion.div>
  );
}

export default function GroupGamesTab({ group, user, isMember }) {
  const [showCreate, setShowCreate] = useState(false);
  const qc = useQueryClient();

  const { data: games = [] } = useQuery({
    queryKey: ["groupGames", group.id],
    queryFn: () => base44.entities.GroupGame.filter({ group_id: group.id }, "-created_date", 30),
  });

  return (
    <div className="pb-28">
      {isMember && user && (
        <div className="px-4 mt-3 mb-3">
          <button onClick={() => setShowCreate(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4338ca)", boxShadow: "0 4px 16px rgba(124,58,237,0.3)" }}>
            <Gamepad2 className="w-4 h-4" /> Start a Game
          </button>
        </div>
      )}

      {games.length === 0 ? (
        <div className="py-12 text-center px-8">
          <div className="text-5xl mb-3">🎮</div>
          <p className="font-bold text-sm mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>No games yet</p>
          <p className="text-xs" style={{ color: "var(--text-hint)" }}>Start a fun game for the group!</p>
        </div>
      ) : (
        games.map(g => <GameCard key={g.id} game={g} user={user} />)
      )}

      <AnimatePresence>
        {showCreate && (
          <CreateGameModal group={group} user={user} onClose={() => setShowCreate(false)}
            onCreated={() => { qc.invalidateQueries({ queryKey: ["groupGames", group.id] }); }} />
        )}
      </AnimatePresence>
    </div>
  );
}