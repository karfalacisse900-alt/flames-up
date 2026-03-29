import React, { useState } from "react";
import { Heart, MessageCircle, Link2, BookOpen, Play, MoreHorizontal, Minus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { AnimatePresence } from "framer-motion";
import DiscoverCommentSheet from "./DiscoverCommentSheet";

const avatarColors = ["#7C69C4", "#D98B62", "#3C6E5A", "#E05C7A", "#4A7FC1"];
const getColor = (name) => avatarColors[(name || "U").charCodeAt(0) % avatarColors.length];

export default function DiscoverUserPostCard({ post, user, onUpdate, onPostClick }) {
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);
  const [liked, setLiked] = useState(post.liked_by?.includes(user?.email));
  const [likeCount, setLikeCount] = useState(post.like_count || 0);

  const media = post.media_urls || [];
  const types = post.media_types || [];
  const color = getColor(post.author_name);
  const dateStr = new Date(post.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!user) return;
    const newLiked = liked
      ? (post.liked_by || []).filter(e => e !== user.email)
      : [...(post.liked_by || []), user.email];
    setLiked(!liked);
    setLikeCount(newLiked.length);
    await base44.entities.DiscoverUserPost.update(post.id, { liked_by: newLiked, like_count: newLiked.length });
    onUpdate?.();
  };

  const thumbnail = media[0];
  const thumbType = types[0];

  return (
    <>
      {/* Card — clickable to open detail */}
      <div onClick={() => onPostClick?.(post)} className="flex flex-col gap-3 px-4 py-5 cursor-pointer active:opacity-80"
        style={{ borderBottom: "1px solid var(--border-light)", backgroundColor: "var(--bg-app)" }}>

        {/* Author row — matches ArticleCard exactly */}
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
            <span style={{ color: "var(--text-hint)" }}> · <span style={{ color: "var(--text-secondary)" }}>Community</span></span>
          </span>
        </div>

        {/* Main content row — title + body + thumbnail */}
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
          {thumbnail && thumbType !== "video" && (
            <img src={thumbnail} alt="" className="w-20 h-16 object-cover rounded-md shrink-0" />
          )}
          {thumbnail && thumbType === "video" && (
            <div className="w-20 h-16 rounded-md shrink-0 flex items-center justify-center relative overflow-hidden"
              style={{ backgroundColor: "#000" }}>
              <video src={thumbnail} className="w-full h-full object-cover" muted />
              <div className="absolute inset-0 flex items-center justify-center">
                <Play className="w-5 h-5 text-white fill-white" />
              </div>
            </div>
          )}
        </div>

        {/* Footer — same as ArticleCard */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: "var(--text-hint)" }}>{dateStr}</span>
            <button onClick={handleLike}
              className="flex items-center gap-1 text-xs"
              style={{ color: liked ? "#E05C7A" : "var(--text-hint)", minHeight: "unset", minWidth: "unset" }}>
              <Heart className="w-3.5 h-3.5" style={{ fill: liked ? "#E05C7A" : "none", stroke: "currentColor" }} />
              {likeCount}
            </button>
            <button onClick={e => { e.stopPropagation(); setShowComments(true); }}
              className="flex items-center gap-1 text-xs"
              style={{ color: "var(--text-hint)", minHeight: "unset", minWidth: "unset" }}>
              <MessageCircle className="w-3.5 h-3.5" />
              {commentCount}
            </button>
            {post.book_name && (
              <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-hint)" }}>
                <BookOpen className="w-3 h-3" /> {post.book_name}
              </span>
            )}
            {post.source_link && (
              <a href={post.source_link} target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1 text-xs"
                style={{ color: "var(--accent-primary)" }}>
                <Link2 className="w-3 h-3" /> Source
              </a>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={e => e.stopPropagation()} className="w-8 h-8 flex items-center justify-center rounded-full"
              style={{ color: "var(--text-hint)", minHeight: "unset", minWidth: "unset" }}>
              <Minus className="w-4 h-4" />
            </button>
            <button onClick={e => e.stopPropagation()} className="w-8 h-8 flex items-center justify-center rounded-full"
              style={{ color: "var(--text-hint)", minHeight: "unset", minWidth: "unset" }}>
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Comments sheet */}
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

    </>
  );
}