import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Send, MessageCircle, Share2, Bookmark, MoreHorizontal } from "lucide-react";
import MuteBlockMenu from "./MuteBlockMenu";
import { checkContent, createModerationReport } from "../moderation/moderationHelper";
import { requireVerified } from "../auth/EmailVerificationGate";

const REACTIONS = ["👍","❤️","🔥","😂","😮","👏"];

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

const TYPE_CONFIG = {
  opinion:         { label: "Opinion",     emoji: "💬", color: "#8B6914", bg: "#FBF5E6" },
  question:        { label: "Question",    emoji: "❓", color: "#7C69C4", bg: "#F3F0FC" },
  list:            { label: "List",        emoji: "📋", color: "#4A7FC1", bg: "#EFF5FE" },
  quote_of_day:    { label: "Quote",       emoji: "✦",  color: "#B07843", bg: "#FDF3E7" },
  question_of_day: { label: "Q of Day",   emoji: "🌟", color: "#8B6914", bg: "#FBF5E6" },
  concern_of_day:  { label: "Concern",     emoji: "🔴", color: "#C86B6B", bg: "#FFF4F4" },
  discussion:      { label: "Discussion",  emoji: "🗣",  color: "#5B7FA6", bg: "#EFF5FB" },
};

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
    mutationFn: async () => {
      if (!requireVerified(user)) throw new Error("Email not verified");
      const mod = await checkContent(commentText.trim());
      const comment = await base44.entities.CommunityComment.create({
        post_id: post.id,
        author_email: user?.email || "",
        author_name: user?.display_name || user?.full_name || "Anonymous",
        is_anonymous: false,
        body: commentText.trim(),
      });
      if (!mod.safe) {
        await createModerationReport("reply", comment.id, user?.email, user?.display_name || user?.full_name, mod.flags, mod.confidence);
      }
      return comment;
    },
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

  const initials = post.is_anonymous ? "?" : (post.author_name?.[0] || "U").toUpperCase();
  const avatarColors = ["#7C69C4","#D98B62","#3C6E5A","#E05C7A","#4A7FC1","#B07843"];
  const avatarColor = avatarColors[(post.author_name || "").charCodeAt(0) % avatarColors.length] || avatarColors[0];

  return (
    <div style={{ borderBottom: "1px solid var(--border-subtle)" }}>
      <div className="px-4 py-3.5">
        {/* Avatar + author + type */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5"
            style={{ backgroundColor: `${avatarColor}22`, color: avatarColor, border: `1.5px solid ${avatarColor}44` }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {post.is_anonymous ? "Anonymous" : (post.author_name || "User")}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                {cfg.emoji} {cfg.label}
              </span>
            </div>

            {/* Title */}
            {post.title && (
              <p className="font-bold text-[15px] mt-1.5 leading-snug" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                {post.title}
              </p>
            )}

            {/* Body */}
            <p className="text-sm leading-relaxed mt-1" style={{ color: "var(--text-secondary)", fontFamily: post.type === "quote_of_day" ? "var(--font-serif)" : "var(--font-sans)" }}>
              {post.type === "quote_of_day" ? `"${post.body}"` : post.body}
            </p>

            {/* List items */}
            {post.type === "list" && post.list_items?.length > 0 && (
              <ol className="mt-2 space-y-1">
                {post.list_items.map((item, i) => (
                  <li key={i} className="text-sm flex gap-2 items-start">
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                      style={{ backgroundColor: cfg.bg, color: cfg.color }}>{i + 1}</span>
                    <span style={{ color: "var(--text-secondary)" }}>{item}</span>
                  </li>
                ))}
              </ol>
            )}

            {/* Action row */}
            <div className="flex items-center gap-3 mt-3">
              <button onClick={onUpvote} disabled={hasUpvoted}
                className="flex items-center gap-1 text-xs font-semibold transition-all active:scale-90"
                style={{ color: hasUpvoted ? "var(--accent-primary)" : "var(--text-hint)" }}>
                ▲ <span>{post.upvotes || 0}</span>
              </button>

              <span className="text-xs font-bold" style={{ color: score >= 0 ? "var(--accent-primary)" : "#C86B6B" }}>
                {score > 0 ? `+${score}` : score}
              </span>

              <button onClick={onDownvote} disabled={hasDownvoted}
                className="flex items-center gap-1 text-xs font-semibold transition-all active:scale-90"
                style={{ color: hasDownvoted ? "#C86B6B" : "var(--text-hint)" }}>
                ▼ <span>{post.downvotes || 0}</span>
              </button>

              <button onClick={onToggle}
                className="flex items-center gap-1 text-xs font-medium transition-all active:scale-90 ml-1"
                style={{ color: isExpanded ? "var(--accent-primary)" : "var(--text-hint)" }}>
                💬 {post.comment_count || 0}
                <ChevronDown className="w-3 h-3 transition-transform" style={{ transform: isExpanded ? "rotate(180deg)" : "none" }} />
              </button>

              <div className="ml-auto">
                {!post.is_anonymous && post.author_email && (
                  <MuteBlockMenu targetEmail={post.author_email} targetName={post.author_name} user={user} onReport={handleReport} />
                )}
              </div>
            </div>

            {/* Comments */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }} className="overflow-hidden">
                  <div className="pt-3 space-y-3 mt-1">
                    {comments.length === 0 && (
                      <p className="text-xs py-1" style={{ color: "var(--text-hint)" }}>No comments yet — be first!</p>
                    )}
                    {comments.map(c => (
                      <div key={c.id} className="flex gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                          style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
                          {(c.is_anonymous ? "A" : (c.author_name?.[0] || "U")).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <span className="text-[11px] font-semibold mr-1.5" style={{ color: "var(--text-secondary)" }}>
                            {c.is_anonymous ? "Anonymous" : c.author_name}
                          </span>
                          <span className="text-xs leading-relaxed" style={{ color: "var(--text-primary)" }}>{c.body}</span>
                        </div>
                      </div>
                    ))}
                    {user && (
                      <div className="flex gap-2 pt-1">
                        <input value={commentText} onChange={e => setCommentText(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && commentText.trim() && commentMut.mutate()}
                          placeholder="Add a comment..."
                          className="flex-1 text-xs px-3 py-2 rounded-xl outline-none"
                          style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
                        />
                        <button onClick={() => commentText.trim() && commentMut.mutate()}
                          disabled={commentMut.isPending}
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
      </div>
    </div>
  );
}