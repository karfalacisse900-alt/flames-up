import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Heart, MessageCircle, Share2, Bookmark, MapPin, MoreHorizontal } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import PhotoCarousel from "./PhotoCarousel";
import AutoplayVideo from "./AutoplayVideo";
import CommentsSheet from "./CommentsSheet";
import ShareSheet from "./ShareSheet";
import { normalizeMediaUrl } from "@/utils/normalizeMediaUrl";
import SmartText from "./SmartText";

const avatarColors = ["#7C69C4", "#D98B62", "#3C6E5A", "#E05C7A", "#4A7FC1", "#B07843"];
const getAvatarColor = (name) => avatarColors[(name || "U").charCodeAt(0) % avatarColors.length];

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

function stripHtml(html) {
  if (!html) return "";
  const div = document.createElement("div");
  div.innerHTML = html.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  return (div.textContent || div.innerText || "").trim();
}

export default function CommunityPostDetail({ post, user, onClose, onUpvote }) {
  const [liked, setLiked] = useState(post.upvoted_by?.includes(user?.email) || false);
  const [likeCount, setLikeCount] = useState(post.upvotes || 0);
  const [showComments, setShowComments] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [saved, setSaved] = useState(false);

  const avatarColor = getAvatarColor(post.author_name);
  const showAuthor = !post.is_anonymous && !!post.author_email;

  const imgs = (post.image_urls?.length > 0 ? post.image_urls : post.image_url ? [post.image_url] : [])
    .map(normalizeMediaUrl).filter(Boolean);
  const videoUrl = normalizeMediaUrl(post.video_url);
  const hasMedia = imgs.length > 0 || !!videoUrl;
  const bodyText = /<[a-z][\s\S]*>/i.test(post.body || "") ? stripHtml(post.body) : post.body;

  const handleLike = async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(c => newLiked ? c + 1 : Math.max(0, c - 1));
    if (onUpvote) onUpvote();
    await base44.entities.CommunityPost.update(post.id, {
      upvotes: newLiked ? (post.upvotes || 0) + 1 : Math.max(0, (post.upvotes || 0) - 1),
      upvoted_by: newLiked
        ? [...(post.upvoted_by || []), user?.email].filter(Boolean)
        : (post.upvoted_by || []).filter(e => e !== user?.email),
    }).catch(() => {});
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ backgroundColor: "var(--bg-app)" }}
    >
      {/* Back header */}
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3"
        style={{
          backgroundColor: "var(--bg-nav)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border-light)",
          paddingTop: "max(env(safe-area-inset-top, 12px), 12px)"
        }}>
        <button onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--bg-subtle)", minHeight: "unset", minWidth: "unset" }}>
          <ArrowLeft className="w-5 h-5" style={{ color: "var(--text-primary)" }} />
        </button>
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {showAuthor ? (
            <Link to={`/user/${encodeURIComponent(post.author_email)}`} onClick={onClose}>
              <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: avatarColor, color: "#fff" }}>
                {post.author_avatar_url
                  ? <img src={post.author_avatar_url} className="w-full h-full object-cover" alt="" />
                  : (post.author_name?.[0] || "U").toUpperCase()}
              </div>
            </Link>
          ) : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: "#ccc", color: "#fff" }}>?</div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>
              {post.is_anonymous ? "Anonymous" : post.author_name || "User"}
            </p>
            <p className="text-xs" style={{ color: "var(--text-hint)" }}>{timeAgo(post.created_date)}</p>
          </div>
        </div>
      </div>

      {/* Media */}
      {hasMedia && (
        <div className="w-full" style={{ maxHeight: "60vh", overflow: "hidden" }}>
          {imgs.length > 0 && <PhotoCarousel images={imgs} aspectRatio="4/5" />}
          {!imgs.length && videoUrl && (
            <AutoplayVideo src={videoUrl} postId={post.id} thumbnail={post.video_thumbnail_url} />
          )}
        </div>
      )}

      {/* Content */}
      <div className="px-5 pt-5 pb-4 space-y-3">
        {post.title && (
          <h2 className="text-2xl font-black leading-tight" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
            {post.title}
          </h2>
        )}
        {bodyText && (
          <p className="text-base leading-relaxed whitespace-pre-line" style={{ color: "var(--text-secondary)" }}>
            <SmartText text={bodyText} />
          </p>
        )}

        {/* Location tag */}
        {post.place_id && (post.location_name || post.location_city) && (
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-full w-fit"
            style={{ backgroundColor: "var(--accent-primary-light)" }}>
            <MapPin className="w-3.5 h-3.5" style={{ color: "var(--accent-primary)" }} />
            <span className="text-xs font-semibold" style={{ color: "var(--accent-primary)" }}>
              {post.location_name || post.location_city}
            </span>
          </div>
        )}

        {/* Tags */}
        {post.tags?.filter(t => t !== "daily_challenge" && t !== "listen_dont_judge").length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.filter(t => t !== "daily_challenge" && t !== "listen_dont_judge").map(t => (
              <span key={t} className="text-xs px-2.5 py-1 rounded-full font-semibold"
                style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, backgroundColor: "var(--border-light)", margin: "0 20px" }} />

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 py-4">
        <button onClick={handleLike}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm"
          style={{
            backgroundColor: liked ? "#FEE2E2" : "var(--bg-subtle)",
            color: liked ? "#EF4444" : "var(--text-secondary)",
            minHeight: "unset", minWidth: "unset"
          }}>
          <Heart className="w-5 h-5" style={{ fill: liked ? "#EF4444" : "none" }} />
          {likeCount > 0 && likeCount}
        </button>
        <button onClick={() => setShowComments(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm"
          style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)", minHeight: "unset", minWidth: "unset" }}>
          <MessageCircle className="w-5 h-5" />
          {post.comment_count > 0 && post.comment_count}
        </button>
        <button onClick={() => setShowShareSheet(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm"
          style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)", minHeight: "unset", minWidth: "unset" }}>
          <Share2 className="w-5 h-5" />
        </button>
        <button onClick={() => setSaved(v => !v)}
          className="ml-auto flex items-center justify-center w-11 h-11 rounded-full"
          style={{ backgroundColor: saved ? "var(--accent-primary-light)" : "var(--bg-subtle)", minHeight: "unset", minWidth: "unset" }}>
          <Bookmark className="w-5 h-5" style={{ color: saved ? "var(--accent-primary)" : "var(--text-secondary)", fill: saved ? "var(--accent-primary)" : "none" }} />
        </button>
      </div>

      <AnimatePresence>
        {showComments && <CommentsSheet postId={post.id} user={user} onClose={() => setShowComments(false)} />}
      </AnimatePresence>
      <ShareSheet open={showShareSheet} onClose={() => setShowShareSheet(false)}
        url={`${window.location.origin}?post=${post.id}`} text={post.title || post.body?.slice(0, 100)} />
    </motion.div>
  );
}