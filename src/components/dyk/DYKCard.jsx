import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { MessageCircle, Share2, ExternalLink, CheckCircle, Users, AlertTriangle, Lightbulb, Bookmark } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DYKComments from "./DYKComments";

const CATEGORY_META = {
  save_money:     { emoji: "💰", label: "Finance",       color: "#10b981", bg: "#d1fae5" },
  apps_tech:      { emoji: "📱", label: "Tech",          color: "#6366f1", bg: "#ede9fe" },
  travel:         { emoji: "🌎", label: "World",         color: "#0ea5e9", bg: "#e0f2fe" },
  city_services:  { emoji: "🏙", label: "City",          color: "#8b5cf6", bg: "#f3e8ff" },
  entertainment:  { emoji: "🎬", label: "Entertainment", color: "#f43f5e", bg: "#ffe4e6" },
  jobs:           { emoji: "🔬", label: "Science",       color: "#f97316", bg: "#ffedd5" },
};

const QUALITY_META = {
  verified:      { icon: CheckCircle,   label: "Verified",      style: { backgroundColor: "#d1fae5", color: "#059669" } },
  community_tip: { icon: Users,         label: "Community Tip", style: { backgroundColor: "#dbeafe", color: "#2563eb" } },
  needs_source:  { icon: AlertTriangle, label: "Needs Source",  style: { backgroundColor: "#fef3c7", color: "#d97706" } },
};

export default function DYKCard({ fact, user, onVoted }) {
  const [showComments, setShowComments] = useState(false);
  const [voting, setVoting] = useState(false);
  const [localFact, setLocalFact] = useState(fact);
  const [saved, setSaved] = useState(false);

  const myVote = localFact.voted_by?.[user?.email];
  const cat = CATEGORY_META[localFact.category] || CATEGORY_META.apps_tech;
  const quality = localFact.quality_label ? QUALITY_META[localFact.quality_label] : null;

  async function handleVote(voteType) {
    if (!user || voting) return;
    setVoting(true);
    const voted_by = { ...(localFact.voted_by || {}) };
    const prev = voted_by[user.email];

    let useful = localFact.useful_count || 0;
    let didnt = localFact.didnt_know_count || 0;
    let knew = localFact.knew_count || 0;

    if (prev === "useful") useful = Math.max(0, useful - 1);
    if (prev === "didnt_know") didnt = Math.max(0, didnt - 1);
    if (prev === "knew") knew = Math.max(0, knew - 1);

    if (prev === voteType) {
      delete voted_by[user.email];
    } else {
      voted_by[user.email] = voteType;
      if (voteType === "useful") useful++;
      if (voteType === "didnt_know") didnt++;
      if (voteType === "knew") knew++;
    }

    const updated = { ...localFact, useful_count: useful, didnt_know_count: didnt, knew_count: knew, voted_by };
    setLocalFact(updated);
    await base44.entities.DidYouKnow.update(localFact.id, { useful_count: useful, didnt_know_count: didnt, knew_count: knew, voted_by });
    setVoting(false);
    onVoted?.();
  }

  function handleShare() {
    const text = localFact.content;
    if (navigator.share) navigator.share({ text, title: "Did You Know?" });
    else navigator.clipboard.writeText(text);
  }

  const reactions = [
    { key: "useful",    emoji: "👍", label: "Useful",      count: localFact.useful_count || 0 },
    { key: "didnt_know",emoji: "🤯", label: "Mind blown",  count: localFact.didnt_know_count || 0 },
    { key: "knew",      emoji: "✅", label: "Knew it",     count: localFact.knew_count || 0 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="overflow-hidden"
      style={{
        backgroundColor: "var(--bg-card)",
        borderRadius: 24,
        border: "1.5px solid var(--border-light)",
        boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
      }}
    >
      {/* Color accent bar */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${cat.color}, ${cat.color}88)` }} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-lg"
            style={{ backgroundColor: cat.bg }}>
            {cat.emoji}
          </div>
          <div>
            <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: cat.color }}>Did You Know</p>
            <p className="text-xs font-semibold" style={{ color: "var(--text-hint)" }}>{cat.label}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {quality && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1" style={quality.style}>
              <quality.icon className="w-3 h-3" /> {quality.label}
            </span>
          )}
          <button onClick={() => setSaved(v => !v)} className="p-1.5 rounded-full"
            style={{ backgroundColor: saved ? `${cat.color}18` : "transparent" }}>
            <Bookmark className="w-4 h-4" style={{ color: saved ? cat.color : "var(--text-hint)", fill: saved ? cat.color : "none" }} />
          </button>
        </div>
      </div>

      {/* Optional image */}
      {localFact.image_url && (
        <div className="mx-4 rounded-2xl overflow-hidden mb-3" style={{ maxHeight: 200 }}>
          <img src={localFact.image_url} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Fact content */}
      <div className="px-4 pb-3">
        <p className="text-[17px] leading-relaxed font-bold"
          style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)", lineHeight: 1.55 }}>
          <span style={{ color: cat.color, fontSize: 20, fontFamily: "serif", marginRight: 4 }}>"</span>
          {localFact.content?.replace(/^(.+?)\n\1$/, "$1")}
          <span style={{ color: cat.color, fontSize: 20, fontFamily: "serif", marginLeft: 4 }}>"</span>
        </p>

        {localFact.source_link && (
          <a href={localFact.source_link} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs mt-3 font-semibold px-3 py-1.5 rounded-full"
            style={{ backgroundColor: cat.bg, color: cat.color }}>
            <ExternalLink className="w-3 h-3" /> View Source
          </a>
        )}
      </div>

      {/* Reaction counts */}
      {(localFact.useful_count > 0 || localFact.didnt_know_count > 0 || localFact.knew_count > 0) && (
        <div className="flex gap-3 px-4 pb-3 text-xs font-semibold" style={{ color: "var(--text-hint)" }}>
          {localFact.useful_count > 0 && <span>👍 {localFact.useful_count.toLocaleString()}</span>}
          {localFact.didnt_know_count > 0 && <span>🤯 {localFact.didnt_know_count.toLocaleString()}</span>}
          {localFact.knew_count > 0 && <span>✅ {localFact.knew_count.toLocaleString()}</span>}
          {(localFact.comment_count || 0) > 0 && <span>💬 {localFact.comment_count}</span>}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center border-t px-2 py-2 gap-0.5" style={{ borderColor: "var(--border-subtle)" }}>
        {reactions.map(r => (
          <motion.button
            key={r.key}
            whileTap={{ scale: 0.88 }}
            onClick={() => handleVote(r.key)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-bold transition-all"
            style={{
              backgroundColor: myVote === r.key ? `${cat.color}18` : "transparent",
              color: myVote === r.key ? cat.color : "var(--text-hint)",
              border: myVote === r.key ? `1.5px solid ${cat.color}44` : "1.5px solid transparent",
            }}>
            <span>{r.emoji}</span>
            <span className="hidden sm:inline">{r.label}</span>
          </motion.button>
        ))}

        <button
          onClick={() => setShowComments(v => !v)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-bold transition-all"
          style={{
            backgroundColor: showComments ? `${cat.color}18` : "transparent",
            color: showComments ? cat.color : "var(--text-hint)",
            border: showComments ? `1.5px solid ${cat.color}44` : "1.5px solid transparent",
          }}>
          <MessageCircle className="w-3.5 h-3.5" />
          {(localFact.comment_count || 0) > 0 && <span>{localFact.comment_count}</span>}
        </button>

        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-bold transition-all"
          style={{ color: "var(--text-hint)" }}>
          <Share2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t overflow-hidden"
            style={{ borderColor: "var(--border-subtle)" }}>
            <div className="px-4 py-3">
              <DYKComments factId={localFact.id} user={user} onCommented={() => onVoted?.()} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}