import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { MessageCircle, Share2, ExternalLink, CheckCircle, Users, AlertTriangle, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DYKComments from "./DYKComments";

const CATEGORY_META = {
  save_money:     { emoji: "💰", label: "Finance",       gradient: ["#10b981", "#059669"] },
  apps_tech:      { emoji: "📱", label: "Tech",          gradient: ["#6366f1", "#4f46e5"] },
  travel:         { emoji: "🌎", label: "World",         gradient: ["#0ea5e9", "#0284c7"] },
  city_services:  { emoji: "🏙", label: "City",          gradient: ["#8b5cf6", "#7c3aed"] },
  entertainment:  { emoji: "🎬", label: "Entertainment", gradient: ["#f43f5e", "#e11d48"] },
  jobs:           { emoji: "🔬", label: "Science",       gradient: ["#f97316", "#ea580c"] },
};

const QUALITY_META = {
  verified:      { icon: CheckCircle,   label: "Verified",      bg: "bg-emerald-100 text-emerald-700" },
  community_tip: { icon: Users,         label: "Community Tip", bg: "bg-blue-100 text-blue-700" },
  needs_source:  { icon: AlertTriangle, label: "Needs Source",  bg: "bg-amber-100 text-amber-600" },
};

export default function DYKCard({ fact, user, onVoted }) {
  const [showComments, setShowComments] = useState(false);
  const [voting, setVoting] = useState(false);
  const [localFact, setLocalFact] = useState(fact);

  const myVote = localFact.voted_by?.[user?.email];
  const cat = CATEGORY_META[localFact.category] || CATEGORY_META.apps_tech;
  const quality = localFact.quality_label ? QUALITY_META[localFact.quality_label] : null;
  const gradient = `linear-gradient(135deg, ${cat.gradient[0]}, ${cat.gradient[1]})`;

  const totalEngagement = (localFact.useful_count || 0) + (localFact.didnt_know_count || 0) + (localFact.comment_count || 0);

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

    await base44.entities.DidYouKnow.update(localFact.id, {
      useful_count: useful, didnt_know_count: didnt, knew_count: knew, voted_by,
    });
    setVoting(false);
    onVoted?.();
  }

  function handleShare() {
    const text = localFact.content;
    if (navigator.share) navigator.share({ text });
    else navigator.clipboard.writeText(text);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      className="rounded-3xl overflow-hidden"
      style={{ backgroundColor: "var(--bg-card)", border: "1.5px solid var(--border-light)", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}
    >
      {/* Organic header band */}
      <div className="relative overflow-hidden px-4 pt-4 pb-5" style={{ background: `linear-gradient(135deg, ${cat.gradient[0]}18, ${cat.gradient[1]}30)` }}>
        {/* Decorative blobs */}
        <div className="absolute -top-5 -right-5 w-24 h-24 rounded-full opacity-25" style={{ background: `radial-gradient(circle, ${cat.gradient[0]}, ${cat.gradient[1]})` }} />
        <div className="absolute top-3 right-14 w-8 h-8 rounded-full opacity-15" style={{ background: cat.gradient[1] }} />

        <div className="flex items-center justify-between relative z-10 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-lg shadow-md" style={{ background: gradient }}>
              <span>{cat.emoji}</span>
            </div>
            <div>
              <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: cat.gradient[0] }}>Did You Know</p>
              <p className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>{cat.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {quality && (
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${quality.bg}`}>
                <quality.icon className="w-3 h-3" /> {quality.label}
              </span>
            )}
            {totalEngagement > 0 && (
              <span className="text-[11px] px-2.5 py-1 rounded-full font-bold" style={{ backgroundColor: "rgba(0,0,0,0.07)", color: "var(--text-secondary)" }}>
                🔥 {totalEngagement}
              </span>
            )}
          </div>
        </div>

        {/* Fact content */}
        <p className="text-base leading-relaxed font-bold relative z-10"
          style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
          {localFact.content?.replace(/^(.+?)\n\1$/, "$1")}
        </p>
      </div>

      <div className="px-4 pt-3 pb-3">
        {/* Image */}
        {localFact.image_url && (
          <div className="rounded-2xl overflow-hidden mb-3">
            <img src={localFact.image_url} alt="" className="w-full max-h-52 object-cover" />
          </div>
        )}

        {/* Source link */}
        {localFact.source_link && (
          <a href={localFact.source_link} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs mb-3 font-bold px-3 py-1.5 rounded-full"
            style={{ backgroundColor: `${cat.gradient[0]}18`, color: cat.gradient[0] }}>
            <ExternalLink className="w-3 h-3" /> View Source
          </a>
        )}

        {/* Vote counts */}
        {(localFact.useful_count > 0 || localFact.didnt_know_count > 0 || localFact.knew_count > 0) && (
          <div className="flex gap-3 text-xs mb-2 font-medium" style={{ color: "var(--text-hint)" }}>
            {localFact.useful_count > 0 && <span>👍 {localFact.useful_count.toLocaleString()}</span>}
            {localFact.didnt_know_count > 0 && <span>🤯 {localFact.didnt_know_count.toLocaleString()}</span>}
            {localFact.knew_count > 0 && <span>✅ {localFact.knew_count.toLocaleString()}</span>}
            {localFact.comment_count > 0 && <span>· {localFact.comment_count} comments</span>}
          </div>
        )}
      </div>

      {/* Action row */}
      <div className="flex items-center border-t px-2 py-2 gap-1" style={{ borderColor: "var(--border-subtle)" }}>
        <VoteBtn emoji="👍" label="Useful" active={myVote === "useful"} gradient={gradient} onClick={() => handleVote("useful")} />
        <VoteBtn emoji="🤯" label="Mind blown" active={myVote === "didnt_know"} gradient={gradient} onClick={() => handleVote("didnt_know")} />
        <VoteBtn emoji="✅" label="Knew it" active={myVote === "knew"} gradient={gradient} onClick={() => handleVote("knew")} />
        <button
          onClick={() => setShowComments(v => !v)}
          className="flex-1 flex items-center justify-center gap-1 py-2 rounded-2xl text-xs font-bold"
          style={{ color: showComments ? cat.gradient[0] : "var(--text-hint)", backgroundColor: showComments ? `${cat.gradient[0]}12` : "transparent" }}>
          <MessageCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Comment</span>
        </button>
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-1 py-2 rounded-2xl text-xs font-bold"
          style={{ color: "var(--text-hint)" }}>
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Share</span>
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

function VoteBtn({ emoji, label, active, gradient, onClick }) {
  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-medium transition-all"
      style={{
        color: active ? "white" : "var(--text-hint)",
        background: active ? gradient : "transparent",
        fontWeight: active ? 700 : 500,
      }}>
      <span>{emoji}</span>
    </motion.button>
  );
}