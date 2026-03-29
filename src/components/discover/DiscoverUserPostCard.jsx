import React, { useState, useRef } from "react";
import { Heart, MessageCircle, Link2, BookOpen, Play, ChevronLeft, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";

const avatarColors = ["#7C69C4", "#D98B62", "#3C6E5A", "#E05C7A", "#4A7FC1"];
const getColor = (name) => avatarColors[(name || "U").charCodeAt(0) % avatarColors.length];

export default function DiscoverUserPostCard({ post, user, onUpdate }) {
  const [mediaIdx, setMediaIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const videoRef = React.useRef(null);
  const media = post.media_urls || [];
  const types = post.media_types || [];
  const hasMedia = media.length > 0;
  const color = getColor(post.author_name);
  const liked = post.liked_by?.includes(user?.email);

  const handleLike = async () => {
    if (!user) return;
    const newLiked = liked
      ? (post.liked_by || []).filter(e => e !== user.email)
      : [...(post.liked_by || []), user.email];
    await base44.entities.DiscoverUserPost.update(post.id, {
      liked_by: newLiked,
      like_count: newLiked.length,
    });
    onUpdate?.();
  };

  const currentType = types[mediaIdx] || "photo";

  return (
    <div className="px-4 py-4" style={{ borderBottom: "1px solid var(--border-light)" }}>
      {/* Author */}
      <div className="flex items-center gap-3 mb-3">
        {post.author_avatar ? (
          <img src={post.author_avatar} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
            style={{ background: `linear-gradient(135deg, ${color}44, ${color}88)`, color }}>
            {(post.author_name?.[0] || "U").toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{post.author_name}</p>
          <p className="text-xs" style={{ color: "var(--text-hint)" }}>
            {new Date(post.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            {" · "}
            <span style={{ color: "var(--accent-secondary)" }}>Community</span>
          </p>
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
          {post.tab || "foryou"}
        </span>
      </div>

      {/* Title */}
      {post.title && (
        <h3 className="text-base font-bold mb-1.5" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
          {post.title}
        </h3>
      )}

      {/* Body */}
      <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-primary)", lineHeight: 1.7 }}>
        {post.body}
      </p>

      {/* Media carousel */}
      {hasMedia && (
        <div className="relative mb-3 rounded-2xl overflow-hidden" style={{ aspectRatio: "16/9", backgroundColor: "#000" }}>
          {currentType === "video" ? (
            <div className="w-full h-full relative">
              <video
                ref={videoRef}
                src={media[mediaIdx]}
                className="w-full h-full object-cover"
                controls
                playsInline
              />
            </div>
          ) : (
            <img src={media[mediaIdx]} alt="" className="w-full h-full object-cover" />
          )}

          {/* Nav arrows */}
          {media.length > 1 && (
            <>
              <button onClick={() => setMediaIdx(i => Math.max(0, i - 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(0,0,0,0.5)", display: mediaIdx === 0 ? "none" : "flex", minHeight: "unset", minWidth: "unset" }}>
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              <button onClick={() => setMediaIdx(i => Math.min(media.length - 1, i + 1))}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(0,0,0,0.5)", display: mediaIdx === media.length - 1 ? "none" : "flex", minHeight: "unset", minWidth: "unset" }}>
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
              {/* Dots */}
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                {media.map((_, i) => (
                  <button key={i} onClick={() => setMediaIdx(i)}
                    className="rounded-full transition-all"
                    style={{ width: i === mediaIdx ? 16 : 6, height: 6, backgroundColor: i === mediaIdx ? "#fff" : "rgba(255,255,255,0.5)", minHeight: "unset", minWidth: "unset" }} />
                ))}
              </div>
              {/* Type badge */}
              <span className="absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: "rgba(0,0,0,0.55)", color: "#fff" }}>
                {currentType === "video" ? "VIDEO" : "PHOTO"} {mediaIdx + 1}/{media.length}
              </span>
            </>
          )}
        </div>
      )}

      {/* Source attribution */}
      {(post.source_link || post.book_name || post.source_label) && (
        <div className="flex flex-wrap gap-2 mb-3">
          {post.source_label && (
            <span className="text-xs font-semibold px-2 py-1 rounded-full"
              style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}>
              📌 {post.source_label}
            </span>
          )}
          {post.book_name && (
            <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full"
              style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}>
              <BookOpen className="w-3 h-3" /> {post.book_name}
            </span>
          )}
          {post.source_link && (
            <a href={post.source_link} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full"
              style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)", border: "1px solid var(--accent-primary)", textDecoration: "none" }}>
              <Link2 className="w-3 h-3" /> Source
            </a>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button onClick={handleLike}
          className="flex items-center gap-1.5 text-sm font-semibold"
          style={{ color: liked ? "#E05C7A" : "var(--text-hint)", minHeight: "unset", minWidth: "unset" }}>
          <Heart className="w-4 h-4" style={{ fill: liked ? "#E05C7A" : "none", stroke: liked ? "#E05C7A" : "currentColor" }} />
          {post.like_count || 0}
        </button>
        <button className="flex items-center gap-1.5 text-sm font-semibold"
          style={{ color: "var(--text-hint)", minHeight: "unset", minWidth: "unset" }}>
          <MessageCircle className="w-4 h-4" />
          {post.comment_count || 0}
        </button>
      </div>
    </div>
  );
}