import React, { useState, useRef } from "react";
import { MessageCircle, Bookmark, Share2, Heart, Play } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";

// Aspect ratio rules by media type
function getAspectStyle(mediaType) {
  if (mediaType === "video") return { aspectRatio: "4/5" }; // 4:5
  return { aspectRatio: "1/1" }; // 1:1 for images and GIFs
}

function AvatarPlaceholder({ name, size = 36 }) {
  const colors = ["#2E6B4F", "#D98B62", "#6366f1", "#f43f5e", "#06b6d4", "#f59e0b"];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.38 }}
    >
      {name?.[0]?.toUpperCase() || "?"}
    </div>
  );
}

function MediaContent({ post }) {
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const videoRef = useRef(null);

  if (post.video_url) {
    return (
      <div className="relative w-full overflow-hidden rounded-xl bg-black" style={getAspectStyle("video")}>
        <video
          ref={videoRef}
          src={post.video_url}
          className="w-full h-full object-cover transition-opacity duration-300"
          style={{ opacity: loaded ? 1 : 0 }}
          loop
          muted
          playsInline
          onLoadedData={() => setLoaded(true)}
          onMouseEnter={() => { videoRef.current?.play(); setVideoPlaying(true); }}
          onMouseLeave={() => { videoRef.current?.pause(); setVideoPlaying(false); videoRef.current && (videoRef.current.currentTime = 0); }}
        />
        {!loaded && <div className="absolute inset-0 animate-pulse" style={{ backgroundColor: "var(--bg-subtle)" }} />}
        {!videoPlaying && loaded && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            </div>
          </div>
        )}
      </div>
    );
  }

  const src = post.image_url || post.image_urls?.[0];
  if (src) {
    return (
      <div className="relative w-full overflow-hidden rounded-xl" style={getAspectStyle("image")}>
        <img
          src={src}
          alt="post media"
          loading="lazy"
          className="w-full h-full object-cover transition-all duration-500"
          style={{ opacity: loaded ? 1 : 0, transform: loaded ? "scale(1)" : "scale(1.02)" }}
          onLoad={() => setLoaded(true)}
        />
        {!loaded && <div className="absolute inset-0 animate-pulse" style={{ backgroundColor: "var(--bg-subtle)" }} />}
      </div>
    );
  }

  return null;
}

export default function DesktopPostCard({ post, user, index }) {
  const [liked, setLiked] = useState(post.upvoted_by?.includes(user?.email));
  const [likeCount, setLikeCount] = useState(post.upvotes || 0);
  const [saved, setSaved] = useState(false);
  const [copying, setCopying] = useState(false);

  const hasMedia = post.video_url || post.image_url || post.image_urls?.length > 0;

  const handleLike = async () => {
    if (!user) return;
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(c => newLiked ? c + 1 : c - 1);
    const upvoted_by = newLiked
      ? [...(post.upvoted_by || []), user.email]
      : (post.upvoted_by || []).filter(e => e !== user.email);
    await base44.entities.CommunityPost.update(post.id, {
      upvotes: newLiked ? likeCount + 1 : likeCount - 1,
      upvoted_by,
    }).catch(() => {});
  };

  const handleShare = async () => {
    const url = window.location.origin + createPageUrl("PostDetail") + `?id=${post.id}`;
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopying(true);
    setTimeout(() => setCopying(false), 1500);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.4), ease: "easeOut" }}
      className="group rounded-2xl overflow-hidden transition-shadow duration-200 hover:shadow-lg"
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-light)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        {post.author_avatar_url ? (
          <img src={post.author_avatar_url} alt={post.author_name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
        ) : (
          <AvatarPlaceholder name={post.is_anonymous ? "?" : post.author_name} size={36} />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight truncate" style={{ color: "var(--text-primary)" }}>
            {post.is_anonymous ? "Anonymous" : post.author_name || "Unknown"}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--text-hint)" }}>
            {post.media_ref_title || post.type}
          </p>
        </div>
        {post.is_sponsored && (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0"
            style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
            Sponsored
          </span>
        )}
      </div>

      {/* Caption (above media if no media, else before media) */}
      {post.body && !hasMedia && (
        <div className="px-4 pb-3">
          <p className="text-sm leading-relaxed line-clamp-4" style={{ color: "var(--text-primary)" }}
            dangerouslySetInnerHTML={{ __html: post.body }} />
        </div>
      )}

      {/* Media */}
      {hasMedia && (
        <div className="px-4 pb-3">
          <MediaContent post={post} />
        </div>
      )}

      {/* Caption below media */}
      {post.body && hasMedia && (
        <div className="px-4 pb-2">
          <p className="text-sm leading-relaxed line-clamp-2" style={{ color: "var(--text-primary)" }}
            dangerouslySetInnerHTML={{ __html: post.body }} />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 px-4 pb-4 pt-1">
        {/* Like */}
        <button
          onClick={handleLike}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 hover:scale-105"
          style={{
            backgroundColor: liked ? "#fef2f2" : "transparent",
            color: liked ? "#e11d48" : "var(--text-secondary)",
          }}
        >
          <Heart className={`w-4 h-4 transition-all ${liked ? "fill-rose-500 text-rose-500" : ""}`} />
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>

        {/* Comment */}
        <Link
          to={createPageUrl("PostComments") + `?id=${post.id}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 hover:scale-105"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-subtle)"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
        >
          <MessageCircle className="w-4 h-4" />
          {(post.comment_count || 0) > 0 && <span>{post.comment_count}</span>}
        </Link>

        <div className="flex-1" />

        {/* Save */}
        <button
          onClick={() => setSaved(s => !s)}
          className="p-2 rounded-xl transition-all duration-150 hover:scale-105"
          style={{ color: saved ? "var(--accent-primary)" : "var(--text-secondary)" }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-subtle)"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
        >
          <Bookmark className={`w-4 h-4 ${saved ? "fill-current" : ""}`} />
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="p-2 rounded-xl transition-all duration-150 hover:scale-105"
          style={{ color: copying ? "var(--accent-primary)" : "var(--text-secondary)" }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-subtle)"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </motion.article>
  );
}