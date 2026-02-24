import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Send } from "lucide-react";
import MuteBlockMenu from "./MuteBlockMenu";
import { checkContent, createModerationReport } from "../moderation/moderationHelper";

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

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: "#FDFAF3", border: "1px solid #EDE0C8", boxShadow: "0 2px 10px rgba(139,105,20,0.06)" }}>

      {/* Top accent stripe */}
      <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${cfg.color}90, ${cfg.color}20)` }} />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-center gap-2 mb-2.5">
          {/* Type badge */}
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide"
            style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
            {cfg.emoji} {cfg.label}
          </span>

          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-[11px] font-medium" style={{ color: "#A08060" }}>
              {post.is_anonymous ? "Anonymous" : (post.author_name || "User")}
            </span>
            {!post.is_anonymous && post.author_email && (
              <MuteBlockMenu
                targetEmail={post.author_email}
                targetName={post.author_name}
                user={user}
                onReport={handleReport}
              />
            )}
          </div>
        </div>

        {/* Title */}
        {post.title && (
          <p className="font-bold text-[15px] mb-1.5 leading-snug" style={{ color: "#2C1A00", fontFamily: "var(--font-serif)" }}>
            {post.title}
          </p>
        )}

        {/* Body */}
        <p className="text-sm leading-relaxed" style={{ color: "#4A3520", fontFamily: post.type === "quote_of_day" ? "var(--font-serif)" : "var(--font-sans)" }}>
          {post.type === "quote_of_day" ? `"${post.body}"` : post.body}
        </p>

        {/* List items */}
        {post.type === "list" && post.list_items?.length > 0 && (
          <ol className="mt-2.5 space-y-1.5">
            {post.list_items.map((item, i) => (
              <li key={i} className="text-sm flex gap-2 items-start">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5"
                  style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                  {i + 1}
                </span>
                <span style={{ color: "#4A3520" }}>{item}</span>
              </li>
            ))}
          </ol>
        )}

        {/* Voting + comment row */}
        <div className="flex items-center gap-2 mt-3.5 pt-3" style={{ borderTop: "1px solid #EDE0C8" }}>
          <button onClick={onUpvote} disabled={hasUpvoted}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-90"
            style={{
              backgroundColor: hasUpvoted ? "#B07843" : "#F5EDDB",
              color: hasUpvoted ? "#fff" : "#8B6914",
              border: `1px solid ${hasUpvoted ? "#B07843" : "#DDD0B0"}`,
            }}>
            ▲ {post.upvotes || 0}
          </button>

          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: score >= 0 ? "#EEF7F2" : "#FFF0F0", color: score >= 0 ? "#3C6E5A" : "#C86B6B" }}>
            {score > 0 ? `+${score}` : score}
          </span>

          <button onClick={onDownvote} disabled={hasDownvoted}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-90"
            style={{
              backgroundColor: hasDownvoted ? "#C86B6B22" : "#F5EDDB",
              color: hasDownvoted ? "#C86B6B" : "#A08060",
              border: `1px solid ${hasDownvoted ? "#C86B6B55" : "#DDD0B0"}`,
            }}>
            ▼ {post.downvotes || 0}
          </button>

          <button onClick={onToggle}
            className="ml-auto flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all active:scale-90"
            style={{ backgroundColor: isExpanded ? "#E8D8BE" : "#F5EDDB", color: "#8B6914", border: "1px solid #DDD0B0" }}>
            💬 {post.comment_count || 0}
            <ChevronDown className="w-3.5 h-3.5 transition-transform" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }} />
          </button>
        </div>

        {/* Comments section */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }} className="overflow-hidden">
              <div className="pt-3 space-y-2.5 mt-2" style={{ borderTop: "1px solid #EDE0C8" }}>
                {comments.length === 0 && (
                  <p className="text-center text-xs py-3" style={{ color: "#A08060" }}>No comments yet — be first!</p>
                )}
                {comments.map(c => (
                  <div key={c.id} className="flex gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                      style={{ backgroundColor: "#EDE0C8", color: "#8B6914" }}>
                      {(c.is_anonymous ? "A" : (c.author_name?.[0] || "U")).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-semibold mb-0.5" style={{ color: "#A08060" }}>
                        {c.is_anonymous ? "Anonymous" : c.author_name}
                      </p>
                      <p className="text-xs leading-relaxed" style={{ color: "#4A3520" }}>{c.body}</p>
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
                      style={{ backgroundColor: "#F5EDDB", border: "1px solid #DDD0B0", color: "#2C1A00" }}
                    />
                    <button onClick={() => commentText.trim() && commentMut.mutate()}
                      disabled={commentMut.isPending}
                      className="p-2 rounded-xl transition-all active:scale-90"
                      style={{ backgroundColor: "#B07843", color: "#fff" }}>
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