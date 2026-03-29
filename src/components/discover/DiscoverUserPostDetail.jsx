import React, { useState } from "react";
import { ArrowLeft, MoreHorizontal, Bookmark, Share2, Heart, MessageCircle, Link2, BookOpen, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { AnimatePresence } from "framer-motion";
import DiscoverCommentSheet from "./DiscoverCommentSheet";

const avatarColors = ["#7C69C4", "#D98B62", "#3C6E5A", "#E05C7A", "#4A7FC1"];
const getColor = (name) => avatarColors[(name || "U").charCodeAt(0) % avatarColors.length];

export default function DiscoverUserPostDetail({ post, user, onClose, onUpdate }) {
  const [mediaIdx, setMediaIdx] = useState(0);
  const touchStartX = React.useRef(null);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);
  const [liked, setLiked] = useState(post.liked_by?.includes(user?.email));
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [bookmarked, setBookmarked] = useState(false);

  const media = post.media_urls || [];
  const types = post.media_types || [];
  const color = getColor(post.author_name);
  const dateStr = new Date(post.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

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

  // Estimate read time
  const wordCount = post.body?.split(/\s+/).length || 0;
  const readTime = Math.max(1, Math.round(wordCount / 200));

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Top nav — same as ArticleDetail */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3"
        style={{ backgroundColor: "var(--bg-app)", borderBottom: "1px solid var(--border-light)", paddingTop: "max(env(safe-area-inset-top, 12px), 12px)" }}>
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--bg-subtle)", minHeight: "unset", minWidth: "unset" }}>
          <ArrowLeft className="w-5 h-5" style={{ color: "var(--text-primary)" }} />
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => setBookmarked(v => !v)} className="w-10 h-10 flex items-center justify-center rounded-full"
            style={{ backgroundColor: "var(--bg-subtle)", minHeight: "unset", minWidth: "unset" }}>
            <Bookmark className="w-4 h-4" style={{ color: bookmarked ? "var(--accent-primary)" : "var(--text-secondary)", fill: bookmarked ? "var(--accent-primary)" : "none" }} />
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-full"
            style={{ backgroundColor: "var(--bg-subtle)", minHeight: "unset", minWidth: "unset" }}>
            <MoreHorizontal className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>
      </div>

      <div className="px-4 py-6 pb-32 max-w-xl mx-auto">
        {/* Title */}
        {post.title && (
          <h1 className="text-2xl font-bold leading-tight mb-3"
            style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
            {post.title}
          </h1>
        )}

        {/* Body preview as subtitle (italic) — first sentence only */}
        {post.body && (
          <p className="text-lg leading-relaxed mb-6" style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>
            {post.body.split(".")[0]}.
          </p>
        )}

        {/* Meta */}
        <p className="text-sm mb-4" style={{ color: "var(--text-hint)" }}>
          {readTime} min read · {dateStr}
        </p>

        {/* Author row — matches ArticleDetail */}
        <div className="flex items-center justify-between mb-6 pb-5" style={{ borderBottom: "1px solid var(--border-light)" }}>
          <div className="flex items-center gap-3">
            {post.author_avatar ? (
              <img src={post.author_avatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                style={{ background: `linear-gradient(135deg, ${color}44, ${color}88)`, color }}>
                {(post.author_name?.[0] || "U").toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{post.author_name}</p>
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>Community</p>
            </div>
          </div>
          <button className="px-4 py-1.5 rounded-full text-sm font-semibold"
            style={{ backgroundColor: "var(--accent-primary)", color: "#fff", minHeight: "unset", minWidth: "unset" }}>
            Follow
          </button>
        </div>

        {/* Hero media — first item full width like ArticleDetail */}
        {media.length > 0 && (
          <div className="mb-6 -mx-4 relative"
            onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
            onTouchEnd={e => {
              if (touchStartX.current === null) return;
              const diff = touchStartX.current - e.changedTouches[0].clientX;
              if (Math.abs(diff) > 40) {
                if (diff > 0) setMediaIdx(i => Math.min(i + 1, media.length - 1));
                else setMediaIdx(i => Math.max(i - 1, 0));
              }
              touchStartX.current = null;
            }}
          >
            {types[mediaIdx] === "video" ? (
              <video src={media[mediaIdx]} className="w-full object-cover" style={{ maxHeight: 280 }} controls playsInline />
            ) : (
              <img src={media[mediaIdx]} alt={post.title} className="w-full object-cover" style={{ maxHeight: 280 }} />
            )}
            {media.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-2">
                {media.map((_, i) => (
                  <button key={i} onClick={() => setMediaIdx(i)}
                    className="rounded-full"
                    style={{ width: i === mediaIdx ? 16 : 6, height: 6, backgroundColor: i === mediaIdx ? "var(--accent-primary)" : "var(--border-medium)", minHeight: "unset", minWidth: "unset" }} />
                ))}
              </div>
            )}
            <p className="text-xs text-center mt-2 px-4" style={{ color: "var(--text-hint)" }}>
              {post.title || "Community post"}
            </p>
          </div>
        )}

        {/* Full body */}
        <div className="space-y-4">
          {post.body?.split("\n").filter(p => p.trim()).map((para, i) => (
            <p key={i} className="text-base leading-relaxed" style={{ color: "var(--text-primary)", lineHeight: 1.8 }}>
              {para}
            </p>
          ))}
        </div>

        {/* Source */}
        {(post.book_name || post.source_link || post.source_label) && (
          <div className="mt-6 p-4 rounded-2xl flex flex-col gap-2"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
            {post.source_label && <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-hint)" }}>{post.source_label}</p>}
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
      </div>

      {/* Bottom action bar — matches ArticleDetail */}
      <div className="fixed bottom-0 left-0 right-0 flex items-center justify-between px-6 py-3"
        style={{ backgroundColor: "var(--bg-card)", borderTop: "1px solid var(--border-light)", paddingBottom: "max(env(safe-area-inset-bottom, 12px), 12px)" }}>
        <button onClick={handleLike}
          className="flex items-center gap-2 text-sm font-semibold"
          style={{ color: liked ? "#E05C7A" : "var(--text-secondary)", minHeight: "unset", minWidth: "unset" }}>
          <Heart className="w-5 h-5" style={{ fill: liked ? "#E05C7A" : "none", stroke: "currentColor" }} />
          {likeCount}
        </button>
        <button onClick={() => setShowComments(true)}
          className="flex items-center gap-2 text-sm font-semibold"
          style={{ color: "var(--text-secondary)", minHeight: "unset", minWidth: "unset" }}>
          <MessageCircle className="w-5 h-5" />
          {commentCount}
        </button>
        <button onClick={() => setBookmarked(v => !v)}
          className="flex items-center gap-2 text-sm font-semibold"
          style={{ color: bookmarked ? "var(--accent-primary)" : "var(--text-secondary)", minHeight: "unset", minWidth: "unset" }}>
          <Bookmark className="w-5 h-5" style={{ fill: bookmarked ? "currentColor" : "none" }} />
        </button>
        <button className="flex items-center gap-2 text-sm font-semibold"
          style={{ color: "var(--text-secondary)", minHeight: "unset", minWidth: "unset" }}>
          <Share2 className="w-5 h-5" />
        </button>
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
    </div>
  );
}