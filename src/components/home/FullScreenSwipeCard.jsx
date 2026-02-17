import React, { useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Heart, MessageCircle, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

const typeStyles = {
  question: { label: "Question", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-400" },
  quote:    { label: "Quote",    bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-400" },
  concern:  { label: "Concern",  bg: "bg-rose-50",    border: "border-rose-200",    dot: "bg-rose-400" },
};

export default function FullScreenSwipeCard({ post, onLike, onReply, onSkip, onFavorite, isTop, stackIndex }) {
  const [liked, setLiked] = useState(false);
  const [favorited, setFavorited] = useState(false);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 250], [-12, 12]);
  const likeOpacity = useTransform(x, [40, 140], [0, 1]);
  const skipOpacity = useTransform(x, [-140, -40], [1, 0]);

  const style = typeStyles[post.type] || typeStyles.quote;

  const handleDragEnd = (e, info) => {
    if (info.offset.x > 100) {
      setLiked(true);
      onLike(post);
    } else if (info.offset.x < -100) {
      onSkip(post);
    }
  };

  const handleLike = (e) => {
    e.stopPropagation();
    setLiked(true);
    onLike(post);
  };

  const handleFavorite = (e) => {
    e.stopPropagation();
    setFavorited(true);
    if (onFavorite) onFavorite(post);
  };

  return (
    <motion.div
      className="absolute inset-0"
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        scale: isTop ? 1 : 1 - stackIndex * 0.04,
        zIndex: 10 - stackIndex,
        top: `${stackIndex * 8}px`,
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.5}
      onDragEnd={handleDragEnd}
      exit={{ x: 500, opacity: 0, transition: { duration: 0.22 } }}
    >
      <div
        className="h-full rounded-3xl bg-white flex flex-col"
        style={{ boxShadow: isTop ? "0 8px 32px rgba(0,0,0,0.10)" : "0 2px 12px rgba(0,0,0,0.05)" }}
      >
        {/* Top badge */}
        <div className="px-5 pt-5 pb-2 shrink-0 flex items-center justify-between">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${style.bg} ${style.border} border`}>
            <div className={`w-2 h-2 rounded-full ${style.dot}`} />
            <span className="text-xs font-semibold tracking-wide uppercase" style={{ fontFamily: "var(--font-sans)" }}>
              {style.label}
            </span>
          </div>
          <span className="text-xs text-[#9B9B9B]">
            {post.is_anonymous ? "Anonymous" : post.author_name || "Someone"}
          </span>
        </div>

        {/* Text - scrollable middle */}
        <div className="flex-1 overflow-y-auto px-7 py-2">
          {post.type === "quote" && (
            <div className="text-5xl text-[#C4A882] leading-none mb-1" style={{ fontFamily: "var(--font-serif)" }}>"</div>
          )}
          <p
            className="text-[#2C2C2C] leading-relaxed"
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: post.text?.length > 200 ? "1.05rem" : post.text?.length > 100 ? "1.25rem" : "1.5rem",
              lineHeight: "1.7",
            }}
          >
            {post.text}
          </p>
          {post.type === "quote" && (
            <div className="text-5xl text-[#C4A882] leading-none mt-1 text-right" style={{ fontFamily: "var(--font-serif)" }}>"</div>
          )}
        </div>

        {/* Swipe indicators - only on top card */}
        {isTop && (
          <>
            <motion.div
              className="absolute top-1/3 right-5 pointer-events-none"
              style={{ opacity: likeOpacity }}
            >
              <div className="bg-emerald-100 border-2 border-emerald-300 text-emerald-700 px-4 py-2 rounded-2xl font-semibold text-sm rotate-12">
                ♥ I feel this
              </div>
            </motion.div>
            <motion.div
              className="absolute top-1/3 left-5 pointer-events-none"
              style={{ opacity: skipOpacity }}
            >
              <div className="bg-gray-100 border-2 border-gray-300 text-gray-500 px-4 py-2 rounded-2xl font-semibold text-sm -rotate-12">
                Skip
              </div>
            </motion.div>
          </>
        )}

        {/* Fixed action row */}
        <div className="px-6 pb-5 pt-3 shrink-0 flex items-center justify-between border-t border-[#F0EDE8]">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 transition-colors ${liked ? "text-rose-500" : "text-[#9B9B9B] hover:text-rose-400"}`}
          >
            <Heart className={`w-5 h-5 ${liked ? "fill-rose-500" : ""}`} />
            <span className="text-sm font-medium">{(post.like_count || 0) + (liked ? 1 : 0)}</span>
          </button>

          <Link
            to={createPageUrl("PostDetail") + `?id=${post.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-[#9B9B9B] hover:text-[#7C8C6E] transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{post.reply_count || 0}</span>
          </Link>

          <button
            onClick={handleFavorite}
            className={`flex items-center gap-1.5 transition-colors ${favorited ? "text-amber-400" : "text-[#9B9B9B] hover:text-amber-400"}`}
          >
            <Star className={`w-5 h-5 ${favorited ? "fill-amber-400" : ""}`} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}