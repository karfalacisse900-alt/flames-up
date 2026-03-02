import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Check, Trophy, Flame, Users, Gamepad2 } from "lucide-react";

const GAME_TYPES = [
  { key: "true_false",       label: "True or False",     emoji: "🤔", desc: "True/False question",      color: "#7C3AED" },
  { key: "poll_battle",      label: "Poll Battle",        emoji: "⚔️", desc: "Vote on options",          color: "#2E6B4F" },
  { key: "rating_challenge", label: "Rating Challenge",   emoji: "⭐", desc: "Rate outfits, food, memes", color: "#D97706" },
  { key: "truth_dare",       label: "Truth or Dare",      emoji: "🎯", desc: "Classic T or D",           color: "#DC2626" },
  { key: "comedy_react",     label: "Comedy React",       emoji: "😂", desc: "Share a joke",             color: "#0891B2" },
];

function CreateGameModal({ group, user, onClose, onCreated }) {
  const [gameType, setGameType] = useState("poll_battle");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [saving, setSaving] = useState(false);
  const needsOptions = ["poll_battle", "rating_challenge"].includes(gameType);
  const selectedType = GAME_TYPES.find(g => g.key === gameType);

  const handleCreate = async () => {
    if (!question.trim()) return;
    setSaving(true);
    const opts = gameType === "true_false" ? ["True ✅", "False ❌"] :
                 gameType === "truth_dare" ? ["Truth 🙊", "Dare 😈"] :
                 needsOptions ? options.filter(o => o.trim()) : [];
    await base44.entities.GroupGame.create({
      group_id: group.id, group_name: group.name,
      game_type: gameType, question: question.trim(),
      options: opts, votes: {},
      host_email: user.email, host_name: user.full_name || user.email, is_active: true,
    });
    setSaving(false);
    onCreated(); onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-lg mx-auto rounded-t-3xl"
        style={{ backgroundColor: "#F2EDE4", maxHeight: "92vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>
        <div className="h-1.5 w-12 rounded-full mx-auto mt-3 mb-1" style={{ backgroundColor: "var(--border-medium)" }} />
        <div className="px-5 pb-8">
          <div className="flex items-center justify-between py-4">
            <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>🎮 Start a Game</h2>
            <button onClick={onClose} className="p-2 rounded-full" style={{ backgroundColor: "var(--bg-subtle)" }}>
              <X className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
            </button>
          </div>

          {/* Game type grid */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {GAME_TYPES.map(g => (
              <button key={g.key} onClick={() => setGameType(g.key)}
                className="p-3 rounded-2xl text-left transition-all active:scale-95 relative"
                style={{ backgroundColor: gameType === g.key ? `${g.color}15` : "var(--bg-subtle)", border: `2px solid ${gameType === g.key ? g.color : "var(--border-light)"}` }}>
                <span className="text-2xl block mb-1">{g.emoji}</span>
                <p className="text-xs font-bold" style={{ color: gameType === g.key ? g.color : "var(--text-primary)" }}>{g.label}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--text-hint)" }}>{g.desc}</p>
                {gameType === g.key && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: g.color }}>
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="mb-3">
            <label className="text-xs font-bold mb-1.5 block" style={{ color: "var(--text-secondary)" }}>Your question</label>
            <textarea value={question} onChange={e => setQuestion(e.target.value)} rows={3}
              placeholder={gameType === "true_false" ? "State something for True/False..." : gameType === "comedy_react" ? "Share your joke..." : "Write your question..."}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ backgroundColor: "var(--bg-subtle)", border: `1px solid ${selectedType?.color}44`, color: "var(--text-primary)" }} />
          </div>

          {needsOptions && (
            <div className="mb-4">
              <label className="text-xs font-bold mb-1.5 block" style={{ color: "var(--text-secondary)" }}>Answer options</label>
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ backgroundColor: `${selectedType?.color}20`, color: selectedType?.color }}>{i + 1}</div>
                  <input value={opt} onChange={e => { const o = [...options]; o[i] = e.target.value; setOptions(o); }}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
                  {options.length > 2 && (
                    <button onClick={() => setOptions(options.filter((_, idx) => idx !== i))}><X className="w-3.5 h-3.5" style={{ color: "var(--text-hint)" }} /></button>
                  )}
                </div>
              ))}
              {options.length < 6 && (
                <button onClick={() => setOptions([...options, ""])}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl mt-1"
                  style={{ backgroundColor: `${selectedType?.color}15`, color: selectedType?.color }}>+ Add Option</button>
              )}
            </div>
          )}

          <button onClick={handleCreate} disabled={saving || !question.trim()}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-50"
            style={{ background: `linear-gradient(135deg, ${selectedType?.color}, ${selectedType?.color}99)` }}>
            {saving ? "Starting..." : `${selectedType?.emoji} Launch Game`}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function GameItem({ game, user }) {
  const qc = useQueryClient();
  const myVote = game.votes?.[user?.email];
  const totalVotes = Object.keys(game.votes || {}).length;
  const typeInfo = GAME_TYPES.find(g => g.key === game.game_type);
  const color = typeInfo?.color || "#2E6B4F";
  const revealed = myVote !== undefined;
  const reactionEmojis = ["😂", "🔥", "💀", "😭", "👏", "🤣"];
  const isReaction = game.game_type === "comedy_react";

  const vote = async (optionIdx) => {
    if (!user?.email || !game.is_active || myVote !== undefined) return;
    const newVotes = { ...(game.votes || {}), [user.email]: optionIdx };
    await base44.entities.GroupGame.update(game.id, { votes: newVotes });
    qc.invalidateQueries({ queryKey: ["groupGames", game.group_id] });
  };

  const getVoteCount = (idx) => Object.values(game.votes || {}).filter(v => v === idx).length;
  const getVotePct = (idx) => totalVotes > 0 ? Math.round((getVoteCount(idx) / totalVotes) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="px-4 py-3"
      style={{ borderBottom: "1px solid var(--border-subtle)" }}>
      {/* Game meta row */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{typeInfo?.emoji || "🎮"}</span>
        <span className="text-[11px] font-bold" style={{ color }}>{typeInfo?.label}</span>
        <span className="text-[10px]" style={{ color: "var(--text-hint)" }}>· by {game.host_name}</span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-[10px] font-semibold flex items-center gap-0.5" style={{ color: "var(--text-hint)" }}>
            <Users className="w-3 h-3" /> {totalVotes}
          </span>
          {game.is_active
            ? <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${color}15`, color }}>Live</span>
            : <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>Ended</span>
          }
        </div>
      </div>

      {/* Question */}
      <p className="text-sm font-semibold mb-2.5 leading-snug" style={{ color: "var(--text-primary)" }}>{game.question}</p>

      {/* Comedy React */}
      {isReaction && (
        <div className="flex gap-2 flex-wrap">
          {reactionEmojis.map((emoji, idx) => {
            const voted = myVote === idx;
            const count = getVoteCount(idx);
            return (
              <button key={idx} onClick={() => vote(idx)} disabled={revealed || !game.is_active}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full transition-all active:scale-90"
                style={{ backgroundColor: voted ? `${color}20` : "var(--bg-subtle)", border: `1.5px solid ${voted ? color : "var(--border-light)"}` }}>
                <span className="text-base">{emoji}</span>
                {revealed && count > 0 && <span className="text-[10px] font-bold" style={{ color }}>{count}</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Vote options */}
      {!isReaction && game.options?.length > 0 && (
        <div className="space-y-1.5">
          {game.options.map((opt, idx) => {
            const voted = myVote === idx;
            const pct = getVotePct(idx);
            const isWinning = revealed && pct === Math.max(...game.options.map((_, i) => getVotePct(i)));
            return (
              <button key={idx} onClick={() => vote(idx)} disabled={revealed || !game.is_active}
                className="w-full relative overflow-hidden rounded-xl transition-all active:scale-99 text-left"
                style={{ border: `1.5px solid ${voted ? color : "var(--border-light)"}` }}>
                {revealed && (
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="absolute inset-y-0 left-0 rounded-l-xl"
                    style={{ backgroundColor: voted ? `${color}25` : `${color}0D` }} />
                )}
                <div className="relative flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    {voted && <Check className="w-3 h-3" style={{ color }} />}
                    <span className="text-sm font-medium" style={{ color: voted ? color : "var(--text-primary)" }}>{opt}</span>
                  </div>
                  {revealed && (
                    <div className="flex items-center gap-1">
                      {isWinning && <Trophy className="w-3 h-3" style={{ color: "#D97706" }} />}
                      <span className="text-xs font-bold" style={{ color: voted ? color : "var(--text-hint)" }}>{pct}%</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {!revealed && game.is_active && !isReaction && (
        <p className="text-[10px] mt-2" style={{ color: "var(--text-hint)" }}>Tap to vote · results shown after</p>
      )}
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

  const activeGames = games.filter(g => g.is_active);
  const pastGames = games.filter(g => !g.is_active);

  return (
    <div className="pb-28">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Group Games</p>
          <p className="text-[11px]" style={{ color: "var(--text-hint)" }}>{activeGames.length} active · {pastGames.length} ended</p>
        </div>
        {isMember && user && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4338ca)", boxShadow: "0 3px 12px rgba(124,58,237,0.25)" }}>
            <Plus className="w-3.5 h-3.5" /> New Game
          </button>
        )}
      </div>

      {games.length === 0 ? (
        <div className="py-16 text-center px-8">
          <motion.div animate={{ y: [-4, 4, -4] }} transition={{ repeat: Infinity, duration: 2 }}>
            <div className="text-5xl mb-4">🎮</div>
          </motion.div>
          <p className="font-bold text-sm mb-1.5" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>No games yet</p>
          <p className="text-xs mb-4" style={{ color: "var(--text-hint)" }}>Start a fun game and get the group engaged!</p>
          {isMember && user && (
            <button onClick={() => setShowCreate(true)}
              className="px-5 py-2.5 rounded-2xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4338ca)" }}>
              🎮 Start First Game
            </button>
          )}
        </div>
      ) : (
        <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 16, margin: "0 16px" }}>
          {activeGames.length > 0 && (
            <div>
              <div className="px-4 pt-3 pb-1 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" style={{ color: "#EF4444" }} />
                <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>Active Games</p>
              </div>
              {activeGames.map(g => <GameItem key={g.id} game={g} user={user} />)}
            </div>
          )}
          {pastGames.length > 0 && (
            <div>
              <div className="px-4 pt-3 pb-1 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" style={{ color: "#D97706" }} />
                <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>Past Games</p>
              </div>
              {pastGames.map(g => <GameItem key={g.id} game={g} user={user} />)}
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showCreate && (
          <CreateGameModal group={group} user={user} onClose={() => setShowCreate(false)}
            onCreated={() => qc.invalidateQueries({ queryKey: ["groupGames", group.id] })} />
        )}
      </AnimatePresence>
    </div>
  );
}