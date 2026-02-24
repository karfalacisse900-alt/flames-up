import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Send } from "lucide-react";
import MuteBlockMenu from "./MuteBlockMenu";

const TYPE_CONFIG = {
  opinion:         { label: "Opinion",     emoji: "💬", color: "#3C6E5A", bg: "#EEF3F0" },
  question:        { label: "Question",    emoji: "❓", color: "#7C69C4", bg: "#F0EEF8" },
  list:            { label: "List",        emoji: "📋", color: "#4A7FC1", bg: "#F0F5FE" },
  quote_of_day:    { label: "Quote",       emoji: "✦",  color: "#BF9E79", bg: "#FAF5EC" },
  question_of_day: { label: "Q of Day",   emoji: "🌟", color: "#3C6E5A", bg: "#EEF3F0" },
  concern_of_day:  { label: "Concern",     emoji: "🔴", color: "#C86B6B", bg: "#FFF0F0" },
  discussion:      { label: "Discussion",  emoji: "🗣",  color: "#5B7FA6", bg: "#EFF5FB" },
};

const MEDIA_EMOJI = { movie: "🎬", show: "📺", book: "📚", game: "🎮", music: "🎵", general: "💬" };

export default function CommunityPostCard({ post, user, onUpvote, onDownvote, isExpanded, onToggle }) {
  const cfg = TYPE_CONFIG[post.type] || TYPE_CONFIG.opinion;
  const hasUpvoted = user?.email && post.upvoted_by?.includes(user.email);
  const hasDownvoted = user?.email && post.downvoted_by?.includes(user.email);
  const score = (post.upvotes || 0) - (post.downvotes || 0);
  const qc = useQueryClient();

  const [commentText, setCommentText] = useState("");
  const [reported, setReported] = useState(false);

  const { data: comments = [] } = useQuery({
    queryKey: ["communityComments", post.id],
    queryFn: () => base44.entities.CommunityComment.filter({ post_id: post.id }, "-created_date", 20),
    enabled: isExpanded,
  });

  const commentMut = useMutation({
    mutationFn: () => base44.entities.CommunityComment.create({
      post_id: post.id,
      author_email: user?.email || "",
      author_name: user?.display_name || user?.full_name || "Anonymous",
      is_anonymous: false,
      body: commentText.trim(),
    }),
    onSuccess: async () => {
      setCommentText("");
      await base44.entities.CommunityPost.update(post.id, { comment_count: (post.comment_count || 0) + 1 });
      qc.invalidateQueries({ queryKey: ["communityComments", post.id] });
      qc.invalidateQueries({ queryKey: ["communityPosts"] });
    },
  });

  const handleReport = async () => {
    if (!user || reported) return;
    await base44.entities.Report.create({
      content_type: "post",
      content_id: post.id,
      reason: "Community report",
      reporter_email: user.email,
      status: "pending",
    });
    await base44.entities.CommunityPost.update(post.id, { is_reported: true });
    setReported(true);
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
      <div className="h-1" style={{ backgroundColor: cfg.color + "44" }} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">{cfg.emoji}</span>
          <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: cfg.color }}>{cfg.label}</span>
          {post.media_type && post.media_type !== "general" && (
            <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>
              {MEDIA_EMOJI[post.media_type]} {post.media_ref_title || post.media_type}
            </span>
          )}
          <span className="ml-auto text-[11px]" style={{ color: "var(--text-hint)" }}>
            {post.is_anonymous ? "Anonymous" : (post.author_name || "User")}
          </span>
        </div>

        {/* Title */}
        {post.title && (
          <p className="font-semibold text-sm mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{post.title}</p>
        )}

        {/* Body */}
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{post.body}</p>

        {/* List items */}
        {post.type === "list" && post.list_items?.length > 0 && (
          <ol className="mt-2 space-y-1">
            {post.list_items.map((item, i) => (
              <li key={i} className="text-xs flex gap-2" style={{ color: "var(--text-secondary)" }}>
                <span className="font-bold w-4 shrink-0" style={{ color: "var(--accent-primary)" }}>{i + 1}.</span>
                {item}
              </li>
            ))}
          </ol>
        )}

        {/* Voting + comments row */}
        <div className="flex items-center gap-2 mt-3">
          <button onClick={onUpvote} disabled={hasUpvoted}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all active:scale-90 disabled:opacity-60"
            style={{ backgroundColor: hasUpvoted ? "var(--accent-primary)" : "var(--bg-subtle)", color: hasUpvoted ? "#fff" : "var(--text-secondary)" }}>
            ▲ {post.upvotes || 0}
          </button>

          <span className="text-xs font-medium" style={{ color: score >= 0 ? "var(--accent-primary)" : "#C86B6B" }}>
            {score > 0 ? `+${score}` : score}
          </span>

          <button onClick={onDownvote} disabled={hasDownvoted}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all active:scale-90 disabled:opacity-60"
            style={{ backgroundColor: hasDownvoted ? "#C86B6B22" : "var(--bg-subtle)", color: hasDownvoted ? "#C86B6B" : "var(--text-hint)" }}>
            ▼ {post.downvotes || 0}
          </button>

          <button onClick={onToggle} className="ml-auto flex items-center gap-1.5 text-xs" style={{ color: "var(--text-hint)" }}>
            💬 {post.comment_count || 0}
            <ChevronDown className="w-3.5 h-3.5 transition-transform" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }} />
          </button>

          <button onClick={handleReport} title="Report post"
            className="p-1 rounded-full transition-all"
            style={{ color: reported ? "#C86B6B" : "var(--text-hint)" }}>
            <Flag className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Comments section */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }} className="overflow-hidden">
              <div className="pt-3 space-y-2 mt-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                {comments.map(c => (
                  <div key={c.id} className="flex gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--accent-primary)" }}>
                      {(c.is_anonymous ? "A" : (c.author_name?.[0] || "U")).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-medium mb-0.5" style={{ color: "var(--text-hint)" }}>
                        {c.is_anonymous ? "Anonymous" : c.author_name}
                      </p>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{c.body}</p>
                    </div>
                  </div>
                ))}

                {user && (
                  <div className="flex gap-2 pt-1">
                    <input
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && commentText.trim() && commentMut.mutate()}
                      placeholder="Add a comment..."
                      className="flex-1 text-xs px-3 py-2 rounded-xl outline-none"
                      style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
                    />
                    <button onClick={() => commentText.trim() && commentMut.mutate()}
                      className="p-2 rounded-xl transition-all active:scale-90"
                      style={{ backgroundColor: "var(--accent-primary)", color: "#fff" }}>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}