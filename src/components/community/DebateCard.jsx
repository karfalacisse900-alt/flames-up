import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { MessageCircle, Share2, Bookmark } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import MuteBlockMenu from "./MuteBlockMenu";
import CommentModal from "./CommentModal";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

const avatarColors = ["#7C69C4", "#D98B62", "#3C6E5A", "#E05C7A", "#4A7FC1", "#B07843"];
const getAvatarColor = (name) => avatarColors[(name || "U").charCodeAt(0) % avatarColors.length];

export default function DebateCard({ post, debate, user, onUpvote }) {
  const qc = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reported, setReported] = useState(false);

  const avatarColor = getAvatarColor(post.author_name);
  const initials = post.is_anonymous ? "?" : (post.author_name?.[0] || "U").toUpperCase();
  const hasLiked = user?.email && post.upvoted_by?.includes(user.email);

  const totalVotes = debate ? (debate.side_a_votes || 0) + (debate.side_b_votes || 0) : 0;
  const pctA = totalVotes > 0 ? Math.round(((debate.side_a_votes || 0) / totalVotes) * 100) : 50;
  const pctB = 100 - pctA;

  const hasVotedA = user?.email && debate?.side_a_voters?.includes(user.email);
  const hasVotedB = user?.email && debate?.side_b_voters?.includes(user.email);
  const hasVoted = hasVotedA || hasVotedB;

  const voteDebateMut = useMutation({
    mutationFn: async (side) => {
      if (!debate) return;
      if (side === "a") {
        await base44.entities.CommunityDebate.update(debate.id, {
          side_a_votes: (debate.side_a_votes || 0) + 1,
          side_a_voters: [...(debate.side_a_voters || []), user.email],
        });
      } else {
        await base44.entities.CommunityDebate.update(debate.id, {
          side_b_votes: (debate.side_b_votes || 0) + 1,
          side_b_voters: [...(debate.side_b_voters || []), user.email],
        });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["communityDebates"] }),
  });

  const handleReport = async () => {
    if (!user || reported) return;
    await base44.entities.Report.create({ content_type: "post", content_id: post.id, reason: "Community report", reporter_email: user.email, status: "pending" });
    await base44.entities.CommunityPost.update(post.id, { is_reported: true });
    setReported(true);
  };

  const handleShare = () => {
    const url = `${window.location.origin}?post=${post.id}`;
    if (navigator.share) navigator.share({ title: "Post", url });
    else navigator.clipboard.writeText(url);
  };

  return (
    <div>
      <div className="flex gap-3 px-4 py-4">
        <div className="shrink-0 flex flex-col items-center">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ backgroundColor: `${avatarColor}22`, color: avatarColor, border: `2px solid ${avatarColor}33` }}>
            {initials}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>
                {post.is_anonymous ? "Anonymous" : (post.author_name || "User")}
              </span>
              <span className="text-xs shrink-0" style={{ color: "var(--text-hint)" }}>· {timeAgo(post.created_date)}</span>
              <span className="text-xs px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: "#D98B6222", color: "#D98B62", fontWeight: 600 }}>
                {post.type === "debate" ? "⚔️ Debate" : "❓ Question"}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => setSaved(v => !v)} className="p-1 rounded-full transition-all active:scale-90">
                <Bookmark className="w-3.5 h-3.5" style={{ color: saved ? "var(--accent-primary)" : "var(--text-hint)", fill: saved ? "var(--accent-primary)" : "none" }} />
              </button>
              {!post.is_anonymous && post.author_email && (
                <MuteBlockMenu targetEmail={post.author_email} targetName={post.author_name} user={user} onReport={handleReport} />
              )}
            </div>
          </div>

          <p className="font-bold text-sm mb-1 leading-snug" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
            {debate?.topic || post.title || post.body}
          </p>
          {post.body && post.body !== debate?.topic && (
            <p className="text-xs leading-relaxed mb-2" style={{ color: "var(--text-secondary)" }}>{post.body}</p>
          )}

          {debate && (
            <div className="mb-2">
              <div className="h-1.5 rounded-full overflow-hidden flex mb-2" style={{ backgroundColor: "var(--bg-subtle)" }}>
                <div className="h-full" style={{ width: `${pctA}%`, backgroundColor: "#3C6E5A" }} />
                <div className="h-full" style={{ width: `${pctB}%`, backgroundColor: "#D98B62" }} />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => user && !hasVoted && voteDebateMut.mutate("a")}
                  disabled={hasVoted}
                  className="flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
                  style={{
                    backgroundColor: hasVotedA ? "#3C6E5A" : "var(--bg-subtle)",
                    color: hasVotedA ? "#fff" : "var(--text-secondary)",
                    border: hasVotedA ? "none" : "1px solid var(--border-light)"
                  }}>
                  <p className="text-sm mb-0.5">🟢 {debate.side_a_label}</p>
                  <p className="font-bold" style={{ color: hasVotedA ? "#fff" : "#3C6E5A" }}>{pctA}%</p>
                </button>
                <button
                  onClick={() => user && !hasVoted && voteDebateMut.mutate("b")}
                  disabled={hasVoted}
                  className="flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
                  style={{
                    backgroundColor: hasVotedB ? "#D98B62" : "var(--bg-subtle)",
                    color: hasVotedB ? "#fff" : "var(--text-secondary)",
                    border: hasVotedB ? "none" : "1px solid var(--border-light)"
                  }}>
                  <p className="text-sm mb-0.5">🟠 {debate.side_b_label}</p>
                  <p className="font-bold" style={{ color: hasVotedB ? "#fff" : "#D98B62" }}>{pctB}%</p>
                </button>
              </div>
              <p className="text-[10px] text-center mt-1" style={{ color: "var(--text-hint)" }}>
                {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
              </p>
            </div>
          )}

          <div className="flex items-center gap-1 -ml-1.5">
            <button onClick={onUpvote} disabled={hasLiked}
              className="flex items-center gap-1 px-2 py-1.5 rounded-full text-xs font-medium transition-all active:scale-90"
              style={{ color: hasLiked ? "#E05C7A" : "var(--text-hint)" }}>
              <span className="text-base leading-none">{hasLiked ? "❤️" : "🤍"}</span>
              {(post.upvotes || 0) > 0 && <span>{post.upvotes}</span>}
            </button>

            <button onClick={() => setShowComments(true)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-full text-xs font-medium transition-all active:scale-90"
              style={{ color: "var(--text-hint)" }}>
              <MessageCircle className="w-4 h-4" />
              {(post.comment_count || 0) > 0 && <span>{post.comment_count}</span>}
            </button>

            <button onClick={handleShare}
              className="flex items-center gap-1 px-2 py-1.5 rounded-full text-xs font-medium transition-all active:scale-90"
              style={{ color: "var(--text-hint)" }}>
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          <AnimatePresence>
            {showComments && <CommentModal post={post} debate={debate} user={user} onClose={() => setShowComments(false)} />}
          </AnimatePresence>
        </div>
      </div>

      <div style={{ height: 1, backgroundColor: "var(--border-subtle)", marginLeft: 60 }} />
    </div>
  );
}