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

  const [showReactions, setShowReactions] = useState(false);
  const [savedLocally, setSavedLocally] = useState(false);

  const initials = post.is_anonymous ? "?" : (post.author_name?.[0] || "U").toUpperCase();
  const avatarColors = ["#7C69C4","#D98B62","#3C6E5A","#E05C7A","#4A7FC1","#B07843"];
  const avatarColor = avatarColors[(post.author_name || "U").charCodeAt(0) % avatarColors.length];

  const handleShare = () => {
    const url = `${window.location.origin}?post=${post.id}`;
    if (navigator.share) navigator.share({ title: post.title || "Post", url });
    else navigator.clipboard.writeText(url);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white mx-3 my-2 rounded-2xl overflow-hidden"
      style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.06)", border: "1px solid var(--border-subtle)" }}>

      {/* ── Header ── */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-2">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
          style={{ backgroundColor: `${avatarColor}22`, color: avatarColor, border: `2px solid ${avatarColor}33` }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              {post.is_anonymous ? "Anonymous" : (post.author_name || "User")}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
              style={{ backgroundColor: cfg.bg, color: cfg.color }}>
              {cfg.emoji} {cfg.label}
            </span>
          </div>
          <p className="text-[11px]" style={{ color: "var(--text-hint)" }}>{timeAgo(post.created_date)}</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setSavedLocally(v => !v)} className="p-1.5 rounded-full transition-all active:scale-90">
            <Bookmark className="w-4 h-4" style={{ color: savedLocally ? "var(--accent-primary)" : "var(--text-hint)", fill: savedLocally ? "var(--accent-primary)" : "none" }} />
          </button>
          {!post.is_anonymous && post.author_email && (
            <MuteBlockMenu targetEmail={post.author_email} targetName={post.author_name} user={user} onReport={handleReport} />
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-4 pb-2">
        {post.title && (
          <p className="font-bold text-base mb-1 leading-snug" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
            {post.title}
          </p>
        )}
        <p className="text-sm leading-relaxed" style={{
          color: "var(--text-primary)",
          fontFamily: post.type === "quote_of_day" ? "var(--font-serif)" : "var(--font-sans)",
          fontStyle: post.type === "quote_of_day" ? "italic" : "normal",
        }}>
          {post.type === "quote_of_day" ? `"${post.body}"` : post.body}
        </p>

        {post.type === "list" && post.list_items?.length > 0 && (
          <ol className="mt-2 space-y-1">
            {post.list_items.map((item, i) => (
              <li key={i} className="text-sm flex gap-2 items-start">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                  style={{ backgroundColor: cfg.bg, color: cfg.color }}>{i + 1}</span>
                <span style={{ color: "var(--text-secondary)" }}>{item}</span>
              </li>
            ))}
          </ol>
        )}

        {/* Media ref tag */}
        {post.media_ref_title && (
          <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
            🎬 {post.media_ref_title}
          </div>
        )}
      </div>

      {/* ── Score bar ── */}
      <div className="mx-4 mb-2 h-1 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-subtle)" }}>
        {(post.upvotes || 0) + (post.downvotes || 0) > 0 && (
          <div className="h-full rounded-full" style={{
            width: `${Math.round(((post.upvotes||0)/((post.upvotes||0)+(post.downvotes||0)))*100)}%`,
            backgroundColor: "var(--accent-primary)",
          }} />
        )}
      </div>

      {/* ── Action row ── */}
      <div className="flex items-center px-3 py-2.5" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        {/* Reactions */}
        <div className="relative">
          <button onTouchStart={() => setShowReactions(true)} onMouseEnter={() => setShowReactions(true)}
            onMouseLeave={() => setShowReactions(false)}
            onClick={onUpvote} disabled={hasUpvoted}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-90"
            style={{ backgroundColor: hasUpvoted ? "var(--accent-primary-light)" : "transparent", color: hasUpvoted ? "var(--accent-primary)" : "var(--text-hint)" }}>
            {hasUpvoted ? "👍" : "👍"} <span>{post.upvotes || 0}</span>
          </button>
          <AnimatePresence>
            {showReactions && (
              <motion.div initial={{ opacity: 0, scale: 0.8, y: 4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8 }}
                className="absolute bottom-full left-0 mb-2 flex gap-1 p-2 rounded-2xl z-30"
                style={{ backgroundColor: "var(--bg-card)", boxShadow: "0 4px 20px rgba(0,0,0,0.12)", border: "1px solid var(--border-light)" }}
                onMouseEnter={() => setShowReactions(true)} onMouseLeave={() => setShowReactions(false)}>
                {REACTIONS.map(r => (
                  <button key={r} onClick={() => { onUpvote(); setShowReactions(false); }}
                    className="text-xl w-9 h-9 flex items-center justify-center rounded-full transition-all hover:scale-125 active:scale-90"
                    style={{ backgroundColor: "var(--bg-subtle)" }}>
                    {r}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button onClick={onDownvote} disabled={hasDownvoted}
          className="flex items-center gap-1 px-2 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-90"
          style={{ color: hasDownvoted ? "#C86B6B" : "var(--text-hint)" }}>
          👎 <span>{post.downvotes || 0}</span>
        </button>

        <button onClick={onToggle}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-90 ml-1"
          style={{ color: isExpanded ? "var(--accent-primary)" : "var(--text-hint)", backgroundColor: isExpanded ? "var(--accent-primary-light)" : "transparent" }}>
          <MessageCircle className="w-3.5 h-3.5" /> {post.comment_count || 0}
        </button>

        <button onClick={handleShare}
          className="flex items-center gap-1 px-2 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-90"
          style={{ color: "var(--text-hint)" }}>
          <Share2 className="w-3.5 h-3.5" />
        </button>

        <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: score > 0 ? "#EEF7F2" : score < 0 ? "#FFF0F0" : "var(--bg-subtle)", color: score > 0 ? "var(--accent-primary)" : score < 0 ? "#C86B6B" : "var(--text-hint)" }}>
          {score > 0 ? `+${score}` : score}
        </span>
      </div>

      {/* ── Comments ── */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }} className="overflow-hidden">
            <div className="px-4 pb-4 pt-2 space-y-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              {comments.length === 0 && (
                <p className="text-xs py-1" style={{ color: "var(--text-hint)" }}>No comments yet — be first!</p>
              )}
              {comments.map(c => {
                const cColor = avatarColors[(c.author_name || "U").charCodeAt(0) % avatarColors.length];
                return (
                  <div key={c.id} className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                      style={{ backgroundColor: `${cColor}22`, color: cColor }}>
                      {(c.is_anonymous ? "A" : (c.author_name?.[0] || "U")).toUpperCase()}
                    </div>
                    <div className="flex-1 px-3 py-2 rounded-2xl rounded-tl-sm" style={{ backgroundColor: "var(--bg-subtle)" }}>
                      <p className="text-[11px] font-bold mb-0.5" style={{ color: "var(--text-secondary)" }}>
                        {c.is_anonymous ? "Anonymous" : c.author_name}
                      </p>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--text-primary)" }}>{c.body}</p>
                    </div>
                  </div>
                );
              })}
              {user && (
                <div className="flex gap-2.5 pt-1">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                    style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>
                    {user?.full_name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 flex gap-2">
                    <input value={commentText} onChange={e => setCommentText(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && commentText.trim() && commentMut.mutate()}
                      placeholder="Write a comment..."
                      className="flex-1 text-xs px-3 py-2 rounded-full outline-none"
                      style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
                    />
                    <button onClick={() => commentText.trim() && commentMut.mutate()}
                      disabled={commentMut.isPending || !commentText.trim()}
                      className="p-2 rounded-full transition-all active:scale-90 disabled:opacity-40"
                      style={{ backgroundColor: "var(--accent-primary)", color: "#fff" }}>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}