import React, { useState } from "react";
import { Heart, MessageCircle, Share2, MoreHorizontal, BadgeCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";

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

export default function LocalPublisherCard({ post, user }) {
  const hasLiked = user?.email && post.liked_by?.includes(user.email);
  const [liked, setLiked] = useState(hasLiked);
  const [likeCount, setLikeCount] = useState(post.like_count || 0);

  const handleLike = async () => {
    if (!user) return;
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(c => newLiked ? c + 1 : Math.max(0, c - 1));
    await base44.entities.LocalPublisherPost.update(post.id, {
      like_count: newLiked ? (post.like_count || 0) + 1 : Math.max(0, (post.like_count || 0) - 1),
      liked_by: newLiked
        ? [...(post.liked_by || []), user.email]
        : (post.liked_by || []).filter(e => e !== user.email),
    });
  };

  const initials = (post.publisher_name || "P")[0].toUpperCase();

  return (
    <div className="w-full" style={{
      backgroundColor: "var(--bg-card)",
      borderTop: "1px solid var(--border-subtle)",
      borderBottom: "1px solid var(--border-subtle)",
    }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2.5">
          {post.publisher_logo ? (
            <img src={post.publisher_logo} alt={post.publisher_name}
              className="w-10 h-10 rounded-xl object-cover"
              style={{ border: "1px solid var(--border-light)" }} />
          ) : (
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #1a3a5c, #2d6a9f)" }}>
              {initials}
            </div>
          )}
          <div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{post.publisher_name}</span>
              <BadgeCheck className="w-4 h-4" style={{ color: "#1D9BF0" }} />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold" style={{ color: "var(--text-hint)" }}>Local publisher</span>
              <span className="text-xs" style={{ color: "var(--text-hint)" }}>· {timeAgo(post.created_date)}</span>
            </div>
          </div>
        </div>
        <button className="p-2 rounded-full" style={{ color: "var(--text-hint)" }}>
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Headline */}
      <div className="px-4 pb-3">
        <h3 className="text-base font-bold leading-snug" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
          {post.headline}
        </h3>
        {post.body && (
          <p className="text-sm mt-1 leading-relaxed line-clamp-2" style={{ color: "var(--text-secondary)" }}>
            {post.body}
          </p>
        )}
      </div>

      {/* Image with domain watermark */}
      {post.image_url && (
        <div className="relative w-full mb-3" style={{ aspectRatio: "16/9", overflow: "hidden" }}>
          <img src={post.image_url} alt={post.headline} className="w-full h-full object-cover" />
          {post.website_domain && (
            <div className="absolute bottom-2 left-2 px-2 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: "rgba(255,255,255,0.9)", color: "#333", backdropFilter: "blur(4px)" }}>
              {post.website_domain}
            </div>
          )}
        </div>
      )}

      {/* Engagement prompt */}
      {post.engagement_prompt && (
        <div className="flex items-start gap-2 mx-4 mb-3 px-3 py-2 rounded-xl"
          style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-subtle)" }}>
          <span className="text-base shrink-0">✦</span>
          <p className="text-sm leading-snug" style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>
            {post.engagement_prompt}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center px-3 pb-3 gap-1">
        <button onClick={handleLike}
          className="flex items-center gap-1.5 px-2.5 py-2 rounded-full"
          style={{ color: liked ? "#E05C7A" : "var(--text-secondary)" }}>
          <Heart className="w-5 h-5" style={{ fill: liked ? "#E05C7A" : "none", strokeWidth: liked ? 0 : 2 }} />
          {likeCount > 0 && <span className="text-sm font-semibold">{likeCount}</span>}
        </button>
        <button className="flex items-center gap-1.5 px-2.5 py-2 rounded-full" style={{ color: "var(--text-secondary)" }}>
          <MessageCircle className="w-5 h-5" strokeWidth={2} />
          {(post.comment_count || 0) > 0 && <span className="text-sm font-semibold">{post.comment_count}</span>}
        </button>
        <button className="flex items-center gap-1.5 px-2.5 py-2 rounded-full" style={{ color: "var(--text-secondary)" }}>
          <Share2 className="w-5 h-5" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}