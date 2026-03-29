import React, { useState, useRef } from "react";
import { Heart, MessageCircle, Link2, BookOpen, Play, ChevronLeft, ChevronRight, MoreHorizontal, Minus } from "lucide-react";
import { base44 } from "@/api/base44Client";

const avatarColors = ["#7C69C4", "#D98B62", "#3C6E5A", "#E05C7A", "#4A7FC1"];
const getColor = (name) => avatarColors[(name || "U").charCodeAt(0) % avatarColors.length];

export default function DiscoverUserPostCard({ post, user, onUpdate }) {
  const [mediaIdx, setMediaIdx] = useState(0);
  const media = post.media_urls || [];
  const types = post.media_types || [];
  const hasMedia = media.length > 0;
  const color = getColor(post.author_name);
  const liked = post.liked_by?.includes(user?.email);
  const currentType = types[mediaIdx] || "photo";

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

  const dateStr = new Date(post.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div className="flex flex-col gap-3 px-4 py-5" style={{ borderBottom: "1px solid var(--border-light)" }}>
      {/* Author row — same style as ArticleCard */}
      <div className="flex items-center gap-2">
        {post.author_avatar ? (
          <img src={post.author_avatar} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
            style={{ background: `linear-gradient(135deg, ${color}44, ${color}88)`, color }}>
            {(post.author_name?.[0] || "U").toUpperCase()}
          </div>
        )}
        <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
          {post.author_name}
          <span style={{ color: "var(--text-hint)" }}>
            {" · "}<span style={{ color: "var(--text-secondary)" }}>Community</span>
          </span>
        </span>
      </div>

      {/* Main content row */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          {post.title && (
            <h2 className="text-base font-bold leading-snug mb-1"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              {post.title}
            </h2>
          )}
          <p className="text-sm leading-relaxed line-clamp-3" style={{ color: "var(--text-secondary)" }}>
            {post.body}
          </p>
        </div>
        {/* Show first image as thumbnail if available */}
        {hasMedia && currentType === "photo" && (
          <img src={media[0]} alt="" className="w-20 h-16 object-cover rounded-md shrink-0" />
        )}
        {hasMedia && currentType === "video" && (
          <div className="w-20 h-16 rounded-md shrink-0 flex items-center justify-center relative overflow-hidden"
            style={{ backgroundColor: "#000" }}>
            <video src={media[0]} className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Play className="w-6 h-6 text-white fill-white" />
            </div>
          </div>
        )}
      </div>

      {/* Full media carousel if multiple */}
      {media.length > 1 && (
        <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: "16/9", backgroundColor: "#000" }}>
          {types[mediaIdx] === "video" ? (
            <video src={media[mediaIdx]} className="w-full h-full object-cover" controls playsInline />
          ) : (
            <img src={media[mediaIdx]} alt="" className="w-full h-full object-cover" />
          )}
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
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
            {media.map((_, i) => (
              <button key={i} onClick={() => setMediaIdx(i)}
                className="rounded-full"
                style={{ width: i === mediaIdx ? 16 : 6, height: 6, backgroundColor: i === mediaIdx ? "#fff" : "rgba(255,255,255,0.5)", minHeight: "unset", minWidth: "unset" }} />
            ))}
          </div>
        </div>
      )}

      {/* Footer — same style as ArticleCard */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: "var(--text-hint)" }}>{dateStr}</span>
          <button onClick={handleLike}
            className="flex items-center gap-1 text-xs"
            style={{ color: liked ? "#E05C7A" : "var(--text-hint)", minHeight: "unset", minWidth: "unset" }}>
            <Heart className="w-3.5 h-3.5" style={{ fill: liked ? "#E05C7A" : "none", stroke: "currentColor" }} />
            {post.like_count || 0}
          </button>
          <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-hint)" }}>
            <MessageCircle className="w-3.5 h-3.5" />
            {post.comment_count || 0}
          </span>
          {/* Source badges */}
          {post.book_name && (
            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-hint)" }}>
              <BookOpen className="w-3 h-3" /> {post.book_name}
            </span>
          )}
          {post.source_link && (
            <a href={post.source_link} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs"
              style={{ color: "var(--accent-primary)", textDecoration: "none" }}>
              <Link2 className="w-3 h-3" /> Source
            </a>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{ color: "var(--text-hint)", minHeight: "unset", minWidth: "unset" }}>
            <Minus className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{ color: "var(--text-hint)", minHeight: "unset", minWidth: "unset" }}>
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}