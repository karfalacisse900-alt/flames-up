import React, { useState, useEffect, useRef } from "react";
import { X, Heart, Send, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";

const avatarColors = ["#7C69C4", "#D98B62", "#3C6E5A", "#E05C7A", "#4A7FC1"];
const getColor = (name) => avatarColors[(name || "U").charCodeAt(0) % avatarColors.length];

function CommentItem({ comment, user, onLike }) {
  const liked = comment.liked_by?.includes(user?.email);
  const color = getColor(comment.author_name);
  const date = new Date(comment.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div className="flex gap-3 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
        style={{ background: `linear-gradient(135deg, ${color}44, ${color}88)`, color }}>
        {(comment.author_name?.[0] || "U").toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{comment.author_name}</span>
          <span className="text-xs" style={{ color: "var(--text-hint)" }}>{date}</span>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{comment.body}</p>
        <button onClick={() => onLike(comment)}
          className="flex items-center gap-1 mt-2 text-xs"
          style={{ color: liked ? "#E05C7A" : "var(--text-hint)", minHeight: "unset", minWidth: "unset" }}>
          <Heart className="w-3.5 h-3.5" style={{ fill: liked ? "#E05C7A" : "none" }} />
          {comment.like_count || 0}
        </button>
      </div>
    </div>
  );
}

export default function DiscoverCommentSheet({ postId, postTitle, user, onClose, onCountChange }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  const load = async () => {
    try {
      const data = await base44.entities.DiscoverPostReply.filter({ post_id: postId }, "-created_date", 100);
      setComments(data);
      onCountChange?.(data.length);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    load();
    const unsub = base44.entities.DiscoverPostReply.subscribe(e => {
      if (e.data?.post_id === postId) load();
    });
    return unsub;
  }, [postId]);

  const handleSubmit = async () => {
    if (!text.trim() || !user || submitting) return;
    setSubmitting(true);
    try {
      await base44.entities.DiscoverPostReply.create({
        post_id: postId,
        author_email: user.email,
        author_name: user.display_name || user.full_name || "Anonymous",
        body: text.trim(),
        like_count: 0,
        liked_by: [],
      });
      // Update comment_count on the post
      await base44.entities.DiscoverUserPost.update(postId, { comment_count: comments.length + 1 });
      setText("");
    } catch {}
    setSubmitting(false);
  };

  const handleLike = async (comment) => {
    if (!user) return;
    const liked = comment.liked_by?.includes(user.email);
    const newLiked = liked
      ? (comment.liked_by || []).filter(e => e !== user.email)
      : [...(comment.liked_by || []), user.email];
    await base44.entities.DiscoverPostReply.update(comment.id, { liked_by: newLiked, like_count: newLiked.length });
    setComments(prev => prev.map(c => c.id === comment.id ? { ...c, liked_by: newLiked, like_count: newLiked.length } : c));
  };

  return (
    <motion.div
      initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-3xl"
      style={{ backgroundColor: "var(--bg-card)", maxHeight: "85vh", boxShadow: "0 -8px 40px rgba(0,0,0,0.2)" }}>

      {/* Handle */}
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "var(--border-medium)" }} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border-light)" }}>
        <div>
          <h3 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>Comments</h3>
          {postTitle && <p className="text-xs line-clamp-1" style={{ color: "var(--text-hint)" }}>{postTitle}</p>}
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--bg-subtle)", minHeight: "unset", minWidth: "unset" }}>
          <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
        </button>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto px-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--text-hint)" }} />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: "var(--text-hint)" }}>No comments yet. Be the first!</p>
          </div>
        ) : (
          comments.map(c => <CommentItem key={c.id} comment={c} user={user} onLike={handleLike} />)
        )}
      </div>

      {/* Input */}
      <div className="flex items-center gap-3 px-4 py-3"
        style={{ borderTop: "1px solid var(--border-light)", paddingBottom: "max(env(safe-area-inset-bottom, 12px), 12px)", backgroundColor: "var(--bg-card)" }}>
        <input
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
          placeholder="Write a comment…"
          className="flex-1 text-sm px-4 py-2.5 rounded-2xl"
          style={{ backgroundColor: "var(--bg-subtle)", border: "1.5px solid var(--border-light)", color: "var(--text-primary)" }}
        />
        <button onClick={handleSubmit} disabled={!text.trim() || submitting}
          className="w-10 h-10 flex items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--accent-primary)", minHeight: "unset", minWidth: "unset", opacity: !text.trim() ? 0.4 : 1 }}>
          {submitting ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
        </button>
      </div>
    </motion.div>
  );
}