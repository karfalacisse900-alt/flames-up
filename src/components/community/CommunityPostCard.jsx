import React, { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Share2, Bookmark, UserPlus, UserCheck, Trash2, MoreHorizontal, Flag, Eye, Link as LinkIcon, EyeOff } from "lucide-react";
import MuteBlockMenu from "./MuteBlockMenu";
import AutoplayVideo from "./AutoplayVideo";
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

// Detect if body is rich text (HTML/markdown)
function isRichText(text) {
  return text && (/<[a-z][\s\S]*>/i.test(text) || /^#{1,6}\s|^\*\*|^\*[^*]|^- |^\d+\. /m.test(text));
}

export default function CommunityPostCard({ post, user, onUpvote }) {
  const hasLiked = user?.email && post.upvoted_by?.includes(user.email);
  const [showReactions, setShowReactions] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reported, setReported] = useState(false);
  const [likeBounce, setLikeBounce] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const longPressTimer = useRef(null);
  const qc = useQueryClient();

  const avatarColor = getAvatarColor(post.author_name);
  const initials = (post.author_name?.[0] || "U").toUpperCase();
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
    setShowMenu(false);
  };

  const handleShare = () => {
    const url = `${window.location.origin}?post=${post.id}`;
    if (navigator.share) navigator.share({ title: "Post", url });
    else { navigator.clipboard.writeText(url); }
    setShowMenu(false);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}?post=${post.id}`;
    navigator.clipboard.writeText(url);
    setShowMenu(false);
  };

  const [notInterested, setNotInterested] = useState(false);
  if (notInterested) return null;

  const handleLike = () => {
    setLikeBounce(true);
    setTimeout(() => setLikeBounce(false), 500);
    onUpvote();
  };

  const handlePressStart = () => { longPressTimer.current = setTimeout(() => setShowReactions(true), 400); };
  const handlePressEnd = () => { clearTimeout(longPressTimer.current); };

  const bodyIsRich = isRichText(post.body);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="relative"
    >
      <div className="px-3 pt-3 pb-1">
        {/* ── Header ── */}
        <div className="flex items-center gap-2.5 mb-2.5">
          {/* Avatar */}
          <div className="shrink-0">
            {showAuthor ? (
              <Link to={createPageUrl(`UserProfile?email=${post.author_email}`)}>
                {post.author_avatar_url ? (
                  <img src={post.author_avatar_url} alt={post.author_name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent hover:ring-[var(--accent-primary)] transition-all" />
                ) : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: `linear-gradient(135deg, ${avatarColor}33, ${avatarColor}66)`, color: avatarColor }}>
                    {initials}
                  </div>
                )}
              </Link>
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: "linear-gradient(135deg, #ccc3, #ccc5)", color: "#999" }}>
                ?
              </div>
            )}
          </div>

          {/* Name + time */}
          <div className="flex-1 min-w-0">
            {showAuthor ? (
              <Link to={createPageUrl(`UserProfile?email=${post.author_email}`)}
                className="text-sm font-bold block truncate" style={{ color: "var(--text-primary)" }}>
                {post.author_name || "User"}
              </Link>
            ) : (
              <span className="text-sm font-bold block" style={{ color: "var(--text-secondary)" }}>Anonymous</span>
            )}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px]" style={{ color: "var(--text-hint)" }}>{timeAgo(post.created_date)}</span>
              {post.media_ref_title && (
                <span className="text-[11px] px-1.5 py-0.5 rounded-md" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>
                  🎬 {post.media_ref_title}
                </span>
              )}
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 shrink-0">
            {!isOwnPost && showAuthor && !!user && (
              <button onClick={handleFollow}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all"
                style={{
                  borderColor: isFollowing ? "var(--accent-primary)" : "var(--border-light)",
                  color: isFollowing ? "var(--accent-primary)" : "var(--text-secondary)",
                  backgroundColor: isFollowing ? "var(--accent-primary-light)" : "transparent",
                }}>
                {isFollowing ? <UserCheck className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                {isFollowing ? "Following" : "Follow"}
              </button>
            )}
            {isOwnPost && (
              <button onClick={handleDelete} className="p-1.5 rounded-full" style={{ color: "#E05C7A" }}>
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {/* Three-dot menu */}
            <div className="relative">
              <button onClick={() => setShowMenu(v => !v)} className="p-1.5 rounded-full" style={{ color: "var(--text-hint)" }}>
                <MoreHorizontal className="w-4 h-4" />
              </button>
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute right-0 top-full mt-1 rounded-2xl overflow-hidden z-40 min-w-[140px]"
                    style={{ backgroundColor: "var(--bg-card)", boxShadow: "0 8px 32px rgba(0,0,0,0.14)", border: "1px solid var(--border-light)" }}>
                    <button onClick={handleShare} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left" style={{ color: "var(--text-primary)" }}>
                      <Share2 className="w-3.5 h-3.5" /> Share
                    </button>
                    {!isOwnPost && (
                      <button onClick={handleReport} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left" style={{ color: "#E05C7A" }}>
                        <Flag className="w-3.5 h-3.5" /> Report
                      </button>
                    )}
                    {!isOwnPost && post.author_email && (
                      <MuteBlockMenu targetEmail={post.author_email} targetName={post.author_name} user={user} onReport={handleReport} inline />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── Title ── */}
        {post.title && (
          <p className="font-bold text-[15px] mb-1.5 leading-snug" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
            {post.title}
          </p>
        )}

        {/* ── Body ── */}
        {post.body && (
          <div className="mb-2.5">
            {/<[a-z][\s\S]*>/i.test(post.body) ? (
              <div className="prose prose-sm max-w-none text-sm leading-relaxed rich-body"
                style={{ color: "var(--text-secondary)" }}
                dangerouslySetInnerHTML={{ __html: post.body }} />
            ) : /^#{1,6}\s|^\*\*|^\*[^*]|^- |^\d+\. /m.test(post.body) ? (
              <div className="prose prose-sm max-w-none text-sm leading-relaxed rich-body"
                style={{ color: "var(--text-secondary)" }}>
                <ReactMarkdown>{post.body}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm leading-relaxed"
                style={{
                  color: "var(--text-secondary)",
                  fontFamily: post.type === "quote_of_day" ? "var(--font-serif)" : "var(--font-sans)",
                  fontStyle: post.type === "quote_of_day" ? "italic" : "normal",
                }}>
                {post.type === "quote_of_day" ? `"${post.body}"` : post.body}
              </p>
            )}
          </div>
        )}

        {/* ── Image ── */}
        {post.image_url && (
          <img src={post.image_url} alt="" loading="lazy"
            className="w-full mb-2.5 object-cover"
            style={{ borderRadius: 16, maxHeight: 480, width: "100%", display: "block", border: "1px solid var(--border-subtle)" }} />
        )}

        {/* ── Video ── */}
        {post.video_url && (
          <div className="mb-2.5 w-full">
            <AutoplayVideo
              src={post.video_url}
              onDoubleTap={() => { if (!hasLiked) handleLike(); }}
            />
          </div>
        )}

        {/* ── List items ── */}
        {post.type === "list" && post.list_items?.length > 0 && (
          <ol className="mb-2.5 space-y-1.5 pl-1">
            {post.list_items.map((item, i) => (
              <li key={i} className="text-sm flex gap-2.5 items-start">
                <span className="text-xs font-bold shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>{i + 1}</span>
                <span style={{ color: "var(--text-secondary)" }}>{item}</span>
              </li>
            ))}
          </ol>
        )}

        {/* ── Action row ── */}
        <div className="flex items-center gap-0.5 -mx-1.5 mt-1">
          {/* Like */}
          <div className="relative">
            <button
              onTouchStart={handlePressStart} onTouchEnd={handlePressEnd}
              onMouseDown={handlePressStart} onMouseUp={handlePressEnd}
              onClick={handleLike}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-full text-xs font-medium transition-all ${likeBounce ? "heart-bounce" : ""}`}
              style={{ color: hasLiked ? "#E05C7A" : "var(--text-hint)" }}>
              <span className="text-[15px] leading-none" style={{ transition: "transform 0.2s" }}>{hasLiked ? "❤️" : "🤍"}</span>
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

          {/* View count (if available) */}
          {(post.engagement_score || 0) > 0 && (
            <span className="flex items-center gap-1 px-2 py-1.5 text-xs" style={{ color: "var(--text-hint)" }}>
              <Eye className="w-3.5 h-3.5" />
              {post.engagement_score}
            </span>
          )}

          {/* Save — pushed right */}
          <button onClick={() => setSaved(v => !v)}
            className="ml-auto p-1.5 rounded-full transition-all chip"
            style={{ color: saved ? "var(--accent-primary)" : "var(--text-hint)" }}>
            <Bookmark className="w-4 h-4" style={{ fill: saved ? "var(--accent-primary)" : "none" }} />
          </button>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "linear-gradient(to right, transparent 16px, var(--border-subtle) 16px, var(--border-subtle) 90%, transparent)", margin: "4px 0 0 0" }} />

      {/* Backdrop to close menu */}
      {showMenu && <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />}
    </motion.div>
  );
}