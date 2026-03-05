import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ThumbsUp, Brain, ThumbsDown, MessageCircle, Share2, ExternalLink, CheckCircle, Users, AlertTriangle } from "lucide-react";
import DYKComments from "./DYKComments";

const CATEGORY_META = {
  save_money:     { emoji: "💰", label: "Save Money",       color: "bg-green-100 text-green-700" },
  apps_tech:      { emoji: "📱", label: "Apps & Tech",      color: "bg-blue-100 text-blue-700" },
  travel:         { emoji: "🌎", label: "Travel",           color: "bg-sky-100 text-sky-700" },
  city_services:  { emoji: "🏙", label: "City Services",    color: "bg-purple-100 text-purple-700" },
  entertainment:  { emoji: "🎬", label: "Entertainment",    color: "bg-pink-100 text-pink-700" },
  jobs:           { emoji: "💼", label: "Jobs & Opportunities", color: "bg-orange-100 text-orange-700" },
};

const QUALITY = {
  verified:      { icon: CheckCircle,    label: "Verified",       color: "text-emerald-600" },
  community_tip: { icon: Users,          label: "Community Tip",  color: "text-blue-600" },
  needs_source:  { icon: AlertTriangle,  label: "Needs Source",   color: "text-amber-500" },
};

export default function DYKCard({ fact, user, onVoted }) {
  const [showComments, setShowComments] = useState(false);
  const [voting, setVoting] = useState(false);

  const myVote = fact.voted_by?.[user?.email];
  const cat = CATEGORY_META[fact.category] || CATEGORY_META.apps_tech;
  const quality = fact.quality_label ? QUALITY[fact.quality_label] : null;

  async function handleVote(voteType) {
    if (!user || voting) return;
    setVoting(true);
    const voted_by = { ...(fact.voted_by || {}) };
    const prev = voted_by[user.email];

    let useful = fact.useful_count || 0;
    let didnt = fact.didnt_know_count || 0;
    let knew = fact.knew_count || 0;

    // Remove previous vote
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

    await base44.entities.DidYouKnow.update(fact.id, {
      useful_count: useful,
      didnt_know_count: didnt,
      knew_count: knew,
      voted_by,
    });
    setVoting(false);
    onVoted?.();
  }

  function handleShare() {
    const text = fact.content;
    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
    }
  }

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm border" style={{ backgroundColor: "var(--bg-card, #fff)", borderColor: "var(--border-light, #e5e7eb)" }}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold tracking-widest" style={{ color: "var(--accent-primary, #6366f1)" }}>💡 DID YOU KNOW</span>
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${cat.color}`}>
            {cat.emoji} {cat.label}
          </span>
        </div>
        {quality && (
          <div className={`flex items-center gap-1 text-[11px] font-medium ${quality.color}`}>
            <quality.icon className="w-3 h-3" />
            {quality.label}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-base leading-relaxed font-medium" style={{ color: "var(--text-primary, #111)" }}>
          {fact.content}
        </p>
        {fact.source_link && (
          <a href={fact.source_link} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs mt-2 underline"
            style={{ color: "var(--accent-primary, #6366f1)" }}>
            <ExternalLink className="w-3 h-3" /> Source
          </a>
        )}
      </div>

      {fact.image_url && (
        <img src={fact.image_url} alt="" className="w-full max-h-52 object-cover" />
      )}

      {/* Vote counts bar */}
      <div className="px-4 py-1 flex gap-3 text-xs" style={{ color: "var(--text-hint, #9ca3af)" }}>
        {(fact.useful_count > 0) && <span>👍 {fact.useful_count.toLocaleString()} useful</span>}
        {(fact.didnt_know_count > 0) && <span>🤯 {fact.didnt_know_count.toLocaleString()}</span>}
        {(fact.knew_count > 0) && <span>👎 {fact.knew_count.toLocaleString()} knew</span>}
        {(fact.comment_count > 0) && <span>· {fact.comment_count} comments</span>}
      </div>

      {/* Action row */}
      <div className="flex items-center border-t px-2 py-1" style={{ borderColor: "var(--border-light, #e5e7eb)" }}>
        <VoteBtn
          icon="👍" label="Useful"
          active={myVote === "useful"}
          onClick={() => handleVote("useful")}
        />
        <VoteBtn
          icon="🤯" label="I didn't know!"
          active={myVote === "didnt_know"}
          onClick={() => handleVote("didnt_know")}
        />
        <VoteBtn
          icon="👎" label="Knew this"
          active={myVote === "knew"}
          onClick={() => handleVote("knew")}
        />
        <button
          onClick={() => setShowComments(v => !v)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-colors"
          style={{ color: showComments ? "var(--accent-primary, #6366f1)" : "var(--text-secondary, #6b7280)" }}>
          <MessageCircle className="w-4 h-4" />
          Comment
        </button>
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-colors"
          style={{ color: "var(--text-secondary, #6b7280)" }}>
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t px-4 py-3" style={{ borderColor: "var(--border-light, #e5e7eb)" }}>
          <DYKComments factId={fact.id} user={user} onCommented={() => onVoted?.()} />
        </div>
      )}
    </div>
  );
}

function VoteBtn({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-colors"
      style={{ color: active ? "var(--accent-primary, #6366f1)" : "var(--text-secondary, #6b7280)", fontWeight: active ? 700 : 500 }}>
      <span>{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}