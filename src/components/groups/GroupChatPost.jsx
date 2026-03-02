import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Pin, Reply, ThumbsUp, MoreHorizontal, Check, CheckCheck } from "lucide-react";

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function renderBodyWithMentions(body) {
  const parts = body.split(/(@[\w\s.]+?)(?=\s|$|[^a-zA-Z0-9._\s])/g);
  return parts.map((part, i) =>
    part.startsWith("@") ? (
      <span key={i} className="font-bold" style={{ color: "var(--accent-primary)" }}>{part}</span>
    ) : part
  );
}

export default function GroupChatPost({ post, user, members = [], onReply, isAdmin, groupId }) {
  const [showMenu, setShowMenu] = useState(false);
  const qc = useQueryClient();

  const isMe = post.author_email === user?.email;
  const readCount = post.read_by?.length || 0;
  const iReadIt = post.read_by?.includes(user?.email);
  const isLiked = post.upvoted_by?.includes(user?.email);

  const toggleLike = async () => {
    if (!user?.email) return;
    const liked = post.upvoted_by?.includes(user.email);
    await base44.entities.CommunityPost.update(post.id, {
      upvotes: liked ? Math.max(0, (post.upvotes || 0) - 1) : (post.upvotes || 0) + 1,
      upvoted_by: liked
        ? (post.upvoted_by || []).filter(e => e !== user.email)
        : [...(post.upvoted_by || []), user.email],
    });
    qc.invalidateQueries({ queryKey: ["groupPosts", groupId] });
  };

  const togglePin = async () => {
    await base44.entities.CommunityPost.update(post.id, { is_pinned: !post.is_pinned });
    qc.invalidateQueries({ queryKey: ["groupPosts", groupId] });
    setShowMenu(false);
  };

  // Mark as read on render
  React.useEffect(() => {
    if (user?.email && !iReadIt) {
      const updated = [...(post.read_by || []), user.email];
      base44.entities.CommunityPost.update(post.id, { read_by: updated }).catch(() => {});
    }
  }, [post.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 py-2 group/chatpost"
    >
      {/* Pinned indicator */}
      {post.is_pinned && (
        <div className="flex items-center gap-1 mb-1 text-xs font-semibold" style={{ color: "var(--accent-secondary)" }}>
          <Pin className="w-3 h-3" /> Pinned
        </div>
      )}

      {/* Reply preview */}
      {post.reply_to_id && (
        <div className="ml-10 mb-1 px-3 py-1.5 rounded-lg border-l-2 text-xs"
          style={{ backgroundColor: "var(--bg-subtle)", borderColor: "var(--accent-primary)", color: "var(--text-hint)" }}>
          <span className="font-bold" style={{ color: "var(--accent-primary)" }}>↩ {post.reply_to_author}</span>
          <span className="ml-1 truncate">{post.reply_to_preview}</span>
        </div>
      )}

      <div className="flex items-start gap-2.5">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-sm font-bold text-white"
          style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)" }}>
          {post.is_anonymous ? "?" : (post.author_name?.[0] || "U").toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + time */}
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
              {post.is_anonymous ? "Anonymous" : post.author_name}
            </span>
            <span className="text-[10px]" style={{ color: "var(--text-hint)" }}>{timeAgo(post.created_date)}</span>
            {post.mentions?.length > 0 && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
                @mentioned
              </span>
            )}
          </div>

          {/* Body */}
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
            {renderBodyWithMentions(post.body || "")}
          </p>

          {/* Image or Video */}
          {post.image_url && (
            post.image_url.match(/\.(mp4|mov|webm|avi|mkv)(\?|$)/i) ? (
              <video src={post.image_url} controls preload="metadata" className="mt-2 rounded-xl w-full" style={{ maxHeight: 220 }} />
            ) : (
              <img src={post.image_url} alt="" className="mt-2 rounded-xl max-h-52 object-cover w-full" />
            )
          )}

          {/* Actions row */}
          <div className="flex items-center gap-3 mt-1.5">
            <button onClick={toggleLike}
              className="flex items-center gap-1 text-xs transition-all active:scale-90"
              style={{ color: isLiked ? "var(--accent-primary)" : "var(--text-hint)" }}>
              <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? "fill-current" : ""}`} />
              {post.upvotes > 0 && post.upvotes}
            </button>

            <button onClick={() => onReply(post)}
              className="flex items-center gap-1 text-xs transition-all"
              style={{ color: "var(--text-hint)" }}>
              <Reply className="w-3.5 h-3.5" /> Reply
            </button>

            {/* Read receipts (only on your own posts) */}
            {isMe && (
              <span className="flex items-center gap-0.5 text-[10px] ml-auto" style={{ color: "var(--text-hint)" }}>
                {readCount > 1 ? (
                  <><CheckCheck className="w-3 h-3" style={{ color: "var(--accent-primary)" }} /> {readCount - 1}</>
                ) : (
                  <Check className="w-3 h-3" />
                )}
              </span>
            )}

            {/* Admin menu */}
            {isAdmin && (
              <div className="relative ml-auto">
                <button onClick={() => setShowMenu(v => !v)} className="opacity-0 group-hover/chatpost:opacity-100 transition-opacity">
                  <MoreHorizontal className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
                </button>
                <AnimatePresence>
                  {showMenu && (
                    <motion.div initial={{ opacity: 0, scale: 0.9, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute right-0 top-6 z-20 rounded-xl shadow-lg overflow-hidden"
                      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", minWidth: 130 }}>
                      <button onClick={togglePin}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-left transition-colors hover:bg-[var(--bg-subtle)]"
                        style={{ color: post.is_pinned ? "#dc2626" : "var(--text-primary)" }}>
                        <Pin className="w-3.5 h-3.5" /> {post.is_pinned ? "Unpin" : "Pin Message"}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}