import React, { useState } from "react";
import { ArrowLeft, Heart, MessageCircle, Link2, BookOpen, Play, ChevronLeft, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { AnimatePresence } from "framer-motion";
import DiscoverCommentSheet from "./DiscoverCommentSheet";

const avatarColors = ["#7C69C4", "#D98B62", "#3C6E5A", "#E05C7A", "#4A7FC1"];
const getColor = (name) => avatarColors[(name || "U").charCodeAt(0) % avatarColors.length];

export default function DiscoverUserPostDetail({ post, user, onClose, onUpdate }) {
  const [mediaIdx, setMediaIdx] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);
  const [liked, setLiked] = useState(post.liked_by?.includes(user?.email));
  const [likeCount, setLikeCount] = useState(post.like_count || 0);

  const media = post.media_urls || [];
  const types = post.media_types || [];
  const color = getColor(post.author_name);
  const dateStr = new Date(post.created_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const handleLike = async () => {
    if (!user) return;
    const newLiked = liked
      ? (post.liked_by || []).filter(e => e !== user.email)
      : [...(post.liked_by || []), user.email];
    setLiked(!liked);
    setLikeCount(newLiked.length);
    await base44.entities.DiscoverUserPost.update(post.id, { liked_by: newLiked, like_count: newLiked.length });
    onUpdate?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 sticky top-0 z-10"
        style={{ backgroundColor: "var(--bg-app)", borderBottom: "1px solid var(--border-light)", paddingTop: "max(env(safe-area-inset-top, 12px), 12px)" }}>
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--bg-subtle)", minHeight: "unset", minWidth: "unset" }}>
          <ArrowLeft className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
        </button>
        <span className="text-sm font-semibold" style={{ color: "var(--text-hint)" }}>Community</span>
      </div>

      {/* Author */}
      <div className="flex items-center gap-3 px-4 py-4">
        {post.author_avatar ? (
          <img src={post.author_avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-base"
            style={{ background: `linear-gradient(135deg, ${color}44, ${color}88)`, color }}>
            {(post.author_name?.[0] || "U").toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{post.author_name}</p>
          <p className="text-xs" style={{ color: "var(--text-hint)" }}>{dateStr}</p>
        </div>
      </div>

      {/* Title */}
      {post.title && (
        <h1 className="px-4 pb-3 text-2xl font-bold leading-tight" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
          {post.title}
        </h1>
      )}

      {/* Body */}
      <p className="px-4 pb-4 text-base leading-relaxed" style={{ color: "var(--text-primary)" }}>
        {post.body}
      </p>

      {/* Media */}
      {media.length > 0 && (
        <div className="px-4 pb-4">
          <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: "4/3", backgroundColor: "#000" }}>
            {types[mediaIdx] === "video" ? (
              <video src={media[mediaIdx]} className="w-full h-full object-cover" controls playsInline />
            ) : (
              <img src={media[mediaIdx]} alt="" className="w-full h-full object-cover" />
            )}
            {media.length > 1 && (
              <>
                {mediaIdx > 0 && (
                  <button onClick={() => setMediaIdx(i => i - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)", minHeight: "unset", minWidth: "unset" }}>
                    <ChevronLeft className="w-4 h-4 text-white" />
                  </button>
                )}
                {mediaIdx < media.length - 1 && (
                  <button onClick={() => setMediaIdx(i => i + 1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)", minHeight: "unset", minWidth: "unset" }}>
                    <ChevronRight className="w-4 h-4 text-white" />
                  </button>
                )}
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                  {media.map((_, i) => (
                    <button key={i} onClick={() => setMediaIdx(i)}
                      className="rounded-full"
                      style={{ width: i === mediaIdx ? 16 : 6, height: 6, backgroundColor: i === mediaIdx ? "#fff" : "rgba(255,255,255,0.5)", minHeight: "unset", minWidth: "unset" }} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Source */}
      {(post.book_name || post.source_link) && (
        <div className="mx-4 mb-4 p-4 rounded-2xl flex flex-col gap-2"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          {post.book_name && (
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <BookOpen className="w-4 h-4" /> {post.book_name}
            </div>
          )}
          {post.source_link && (
            <a href={post.source_link} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-semibold"
              style={{ color: "var(--accent-primary)" }}>
              <Link2 className="w-4 h-4" /> View source
            </a>
          )}
        </div>
      )}

      {/* Actions bar */}
      <div className="mx-4 mb-6 flex items-center gap-4 py-3 px-4 rounded-2xl"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
        <button onClick={handleLike}
          className="flex items-center gap-1.5 text-sm font-semibold"
          style={{ color: liked ? "#E05C7A" : "var(--text-secondary)", minHeight: "unset", minWidth: "unset" }}>
          <Heart className="w-5 h-5" style={{ fill: liked ? "#E05C7A" : "none", stroke: "currentColor" }} />
          {likeCount}
        </button>
        <button onClick={() => setShowComments(true)}
          className="flex items-center gap-1.5 text-sm font-semibold"
          style={{ color: "var(--text-secondary)", minHeight: "unset", minWidth: "unset" }}>
          <MessageCircle className="w-5 h-5" />
          {commentCount}
        </button>
      </div>

      {/* Comments overlay */}
      <AnimatePresence>
        {showComments && (
          <>
            <div className="fixed inset-0 z-40" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} onClick={() => setShowComments(false)} />
            <DiscoverCommentSheet
              postId={post.id}
              postTitle={post.title || post.body?.slice(0, 60)}
              user={user}
              onClose={() => setShowComments(false)}
              onCountChange={setCommentCount}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}