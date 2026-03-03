import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Share2, Bookmark, UserPlus, UserCheck, Trash2 } from "lucide-react";
import MuteBlockMenu from "./MuteBlockMenu";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const REACTIONS = ["❤️", "🔥", "😂", "😮", "👏", "💯"];

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

export default function CommunityPostCard({ post, user, onUpvote }) {
  const hasLiked = user?.email && post.upvoted_by?.includes(user.email);
  const [showReactions, setShowReactions] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reported, setReported] = useState(false);
  const [likeBounce, setLikeBounce] = useState(false);
  const longPressTimer = useRef(null);
  const qc = useQueryClient();

  const avatarColor = getAvatarColor(post.author_name);
  const initials = (post.author_name?.[0] || "U").toUpperCase();
  // Never reveal author info when anonymous
  const showAuthor = !post.is_anonymous && !!post.author_email;

  const isOwnPost = user?.email && post.author_email === user.email;

  const handleDelete = async () => {
    if (!window.confirm("Delete this post?")) return;
    await base44.entities.CommunityPost.delete(post.id);
    qc.invalidateQueries({ queryKey: ["communityPosts"] });
  };

  const { data: followRecord } = useQuery({
    queryKey: ["followStatus", user?.email, post.author_email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: user.email, following_email: post.author_email }),
    enabled: !!user?.email && !isOwnPost && !post.is_anonymous,
    select: (data) => data[0] || null,
  });

  const isFollowing = !!followRecord;

  const handleFollow = async () => {
    if (!user || isOwnPost) return;
    if (isFollowing && followRecord) {
      await base44.entities.Follow.delete(followRecord.id);
    } else {
      await base44.entities.Follow.create({
        follower_email: user.email,
        follower_name: user.full_name || user.email,
        following_email: post.author_email,
        following_name: post.author_name,
      });
    }
    qc.invalidateQueries({ queryKey: ["followStatus", user?.email, post.author_email] });
    qc.invalidateQueries({ queryKey: ["myFollows", user?.email] });
  };

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

  const handleLike = () => {
    if (hasLiked) return;
    setLikeBounce(true);
    setTimeout(() => setLikeBounce(false), 500);
    onUpvote();
  };

  const handlePressStart = () => { longPressTimer.current = setTimeout(() => setShowReactions(true), 400); };
  const handlePressEnd = () => { clearTimeout(longPressTimer.current); };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      <div className="flex gap-3 px-4 py-3.5">
        {/* Avatar - clickable to profile (only if NOT anonymous) */}
        <div className="shrink-0">
          {!post.is_anonymous && post.author_email ? (
            <Link to={createPageUrl(`UserProfile?email=${post.author_email}`)}>
              {post.author_avatar_url ? (
                <img src={post.author_avatar_url} alt={post.author_name} className="w-9 h-9 rounded-full object-cover ring-2 ring-transparent hover:ring-[var(--accent-primary)] transition-all" />
              ) : (
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold hover:opacity-80 transition-opacity"
                  style={{ background: `linear-gradient(135deg, ${avatarColor}33, ${avatarColor}55)`, color: avatarColor }}>
                  {initials}
                </div>
              )}
            </Link>
          ) : (
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: `linear-gradient(135deg, #ccc3, #ccc5)`, color: "#999" }}>
              ?
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 min-w-0">
              {!post.is_anonymous && post.author_email ? (
                <Link to={createPageUrl(`UserProfile?email=${post.author_email}`)}
                  className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>
                  {post.author_name || "User"}
                </Link>
              ) : (
                <span className="text-sm font-bold truncate" style={{ color: "var(--text-secondary)" }}>Anonymous</span>
              )}
              <span className="text-[11px] shrink-0" style={{ color: "var(--text-hint)" }}>· {timeAgo(post.created_date)}</span>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              {!isOwnPost && !post.is_anonymous && !!post.author_email && !!user && (
                <button onClick={handleFollow}
                  className="p-1.5 rounded-full transition-all chip"
                  style={{ color: isFollowing ? "var(--accent-primary)" : "var(--text-hint)" }}>
                  {isFollowing ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                </button>
              )}
              <button onClick={() => setSaved(v => !v)}
                className="p-1.5 rounded-full transition-all chip"
                style={{ color: saved ? "var(--accent-primary)" : "var(--text-hint)" }}>
                <Bookmark className="w-3.5 h-3.5" style={{ fill: saved ? "var(--accent-primary)" : "none" }} />
              </button>
              {isOwnPost && (
                <button onClick={handleDelete} className="p-1.5 rounded-full transition-all chip" style={{ color: "#E05C7A" }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              {!post.is_anonymous && post.author_email && !isOwnPost && (
                <MuteBlockMenu targetEmail={post.author_email} targetName={post.author_name} user={user} onReport={handleReport} />
              )}
            </div>
          </div>

          {/* Title */}
          {post.title && (
            <p className="font-bold text-sm mb-1 leading-snug" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              {post.title}
            </p>
          )}

          {/* Body */}
          <p className="text-sm leading-relaxed mb-2.5" style={{
            color: "var(--text-secondary)",
            fontFamily: post.type === "quote_of_day" ? "var(--font-serif)" : "var(--font-sans)",
            fontStyle: post.type === "quote_of_day" ? "italic" : "normal",
          }}>
            {post.type === "quote_of_day" ? `"${post.body}"` : post.body}
          </p>

          {/* Image */}
          {post.image_url && (
            <img src={post.image_url} alt="" loading="lazy"
              className="w-full rounded-2xl mb-2.5 object-cover"
              style={{ maxHeight: 280, border: "1px solid var(--border-subtle)" }} />
          )}

          {/* Video */}
          {post.video_url && (
            <video src={post.video_url} controls playsInline preload="metadata"
              className="w-full rounded-2xl mb-2.5"
              style={{ maxHeight: 320, border: "1px solid var(--border-subtle)", backgroundColor: "#000" }} />
          )}

          {/* List items */}
          {post.type === "list" && post.list_items?.length > 0 && (
            <ol className="mb-2.5 space-y-1">
              {post.list_items.map((item, i) => (
                <li key={i} className="text-sm flex gap-2 items-start">
                  <span className="text-xs font-bold shrink-0 mt-0.5" style={{ color: "var(--text-hint)" }}>{i + 1}.</span>
                  <span style={{ color: "var(--text-secondary)" }}>{item}</span>
                </li>
              ))}
            </ol>
          )}

          {/* Media ref tag */}
          {post.media_ref_title && (
            <div className="mb-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px]"
              style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>
              🎬 {post.media_ref_title}
            </div>
          )}

          {/* ── Action row ── */}
          <div className="flex items-center gap-0.5 -ml-1.5">
            {/* Like */}
            <div className="relative">
              <button
                onTouchStart={handlePressStart} onTouchEnd={handlePressEnd}
                onMouseDown={handlePressStart} onMouseUp={handlePressEnd}
                onClick={handleLike} disabled={hasLiked}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-full text-xs font-medium transition-all ${likeBounce ? "heart-bounce" : ""}`}
                style={{ color: hasLiked ? "#E05C7A" : "var(--text-hint)" }}>
                <span className="text-[15px] leading-none">{hasLiked ? "❤️" : "🤍"}</span>
                {(post.upvotes || 0) > 0 && <span>{post.upvotes}</span>}
              </button>
              <AnimatePresence>
                {showReactions && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.7, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                    className="absolute bottom-full left-0 mb-2 flex gap-1 p-2 rounded-2xl z-30"
                    style={{ backgroundColor: "var(--bg-card)", boxShadow: "0 8px 32px rgba(0,0,0,0.18)", border: "1px solid var(--border-light)" }}
                    onMouseLeave={() => setShowReactions(false)}>
                    {REACTIONS.map(r => (
                      <motion.button key={r}
                        whileHover={{ scale: 1.3 }} whileTap={{ scale: 0.85 }}
                        onClick={() => { handleLike(); setShowReactions(false); }}
                        className="text-xl w-9 h-9 flex items-center justify-center rounded-full"
                        style={{ backgroundColor: "var(--bg-subtle)" }}>
                        {r}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Comment */}
            <Link to={createPageUrl(`PostComments?postId=${post.id}`)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-full text-xs font-medium chip"
              style={{ color: "var(--text-hint)" }}>
              <MessageCircle className="w-4 h-4" />
              {(post.comment_count || 0) > 0 && <span>{post.comment_count}</span>}
            </Link>

            {/* Share */}
            <button onClick={handleShare}
              className="flex items-center gap-1 px-2 py-1.5 rounded-full text-xs font-medium chip"
              style={{ color: "var(--text-hint)" }}>
              <Share2 className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "linear-gradient(to right, transparent 48px, var(--border-subtle) 60px, var(--border-subtle) 90%, transparent)", margin: "0 0 0 0" }} />
    </motion.div>
  );
}