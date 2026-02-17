import React, { useState, useRef } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Heart, MessageCircle, Share2, ChevronUp, Mic } from "lucide-react";

const typeStyles = {
  question: { label: "Question", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-400", textAccent: "text-amber-500" },
  quote: { label: "Quote", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-400", textAccent: "text-[#C4A882]" },
  concern: { label: "Concern", bg: "bg-rose-50", border: "border-rose-200", dot: "bg-rose-400", textAccent: "text-rose-400" },
};

export default function FullScreenSwipeCard({ post, onLike, onReply, onSkip, isTop, stackIndex }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-18, 18]);
  const likeOpacity = useTransform(x, [30, 150], [0, 1]);
  const skipOpacity = useTransform(x, [-150, -30], [1, 0]);
  const replyOpacity = useTransform(y, [-120, -40], [1, 0]);
  const cardOpacity = useTransform(x, [-300, 0, 300], [0.4, 1, 0.4]);

  const style = typeStyles[post.type] || typeStyles.quote;
  const isLiked = false;

  const handleDragEnd = (e, info) => {
    if (info.offset.x > 120) onLike(post);
    else if (info.offset.x < -120) onSkip(post);
    else if (info.offset.y < -100) onReply(post);
  };

  return (
    <motion.div
      className="absolute inset-0"
      style={{
        x: isTop ? x : 0,
        y: isTop ? y : 0,
        rotate: isTop ? rotate : 0,
        opacity: isTop ? cardOpacity : 1,
        scale: isTop ? 1 : 1 - stackIndex * 0.04,
        zIndex: 10 - stackIndex,
        top: `${stackIndex * 10}px`,
      }}
      drag={isTop ? true : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.6}
      onDragEnd={handleDragEnd}
      initial={{ scale: isTop ? 1 : 1 - stackIndex * 0.04 }}
      exit={{ x: 400, opacity: 0, transition: { duration: 0.25 } }}
    >
      <div
        className="h-full rounded-3xl bg-white flex flex-col overflow-hidden"
        style={{ boxShadow: isTop ? "0 8px 40px rgba(0,0,0,0.12)" : "0 4px 20px rgba(0,0,0,0.06)" }}
      >
        {/* Top bar */}
        <div className="px-6 pt-6 pb-2 flex items-center justify-between shrink-0">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${style.bg} ${style.border} border`}>
            <div className={`w-2 h-2 rounded-full ${style.dot}`} />
            <span className="text-xs font-semibold tracking-wide uppercase" style={{ fontFamily: "var(--font-sans)" }}>
              {style.label}
            </span>
          </div>
          <span className="text-xs text-[#9B9B9B]" style={{ fontFamily: "var(--font-sans)" }}>
            {post.is_anonymous ? "Anonymous" : post.author_name || "Someone"}
          </span>
        </div>

        {/* Main text - fills remaining space */}
        <div className="flex-1 flex items-center justify-center px-8 py-4">
          <div className="text-center">
            {post.type === "quote" && (
              <div className="text-6xl text-[#C4A882] leading-none mb-2 font-serif" style={{ fontFamily: "var(--font-serif)" }}>"</div>
            )}
            <p
              className="leading-relaxed text-[#2C2C2C]"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: post.text.length > 150 ? "1.15rem" : post.text.length > 80 ? "1.35rem" : "1.6rem",
                lineHeight: "1.65",
              }}
            >
              {post.text}
            </p>
            {post.type === "quote" && (
              <div className="text-6xl text-[#C4A882] leading-none mt-2 font-serif" style={{ fontFamily: "var(--font-serif)" }}>"</div>
            )}
          </div>
        </div>

        {/* Swipe indicators */}
        {isTop && (
          <>
            <motion.div
              className="absolute top-1/2 right-5 -translate-y-1/2 pointer-events-none"
              style={{ opacity: likeOpacity }}
            >
              <div className="bg-emerald-100 border-2 border-emerald-300 text-emerald-700 px-4 py-2 rounded-2xl font-semibold text-sm rotate-12">
                ♥ I feel this
              </div>
            </motion.div>
            <motion.div
              className="absolute top-1/2 left-5 -translate-y-1/2 pointer-events-none"
              style={{ opacity: skipOpacity }}
            >
              <div className="bg-gray-100 border-2 border-gray-300 text-gray-500 px-4 py-2 rounded-2xl font-semibold text-sm -rotate-12">
                Skip
              </div>
            </motion.div>
            <motion.div
              className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none"
              style={{ opacity: replyOpacity }}
            >
              <div className="bg-blue-50 border border-blue-200 text-blue-600 px-4 py-2 rounded-2xl text-sm flex items-center gap-1">
                <ChevronUp className="w-4 h-4" /> Open Thread
              </div>
            </motion.div>
          </>
        )}

        {/* Bottom actions */}
        <div className="px-6 pb-6 pt-2 flex items-center justify-between shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onLike(post); }}
            className="flex items-center gap-2 text-[#9B9B9B] hover:text-rose-400 transition-colors"
          >
            <Heart className="w-5 h-5" />
            <span className="text-sm font-medium">{post.like_count || 0}</span>
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onReply(post); }}
            className="flex flex-col items-center gap-1 px-5 py-2.5 rounded-2xl bg-[#7C8C6E]/10 hover:bg-[#7C8C6E]/20 transition-colors"
          >
            <MessageCircle className="w-5 h-5 text-[#7C8C6E]" />
            <span className="text-[10px] text-[#7C8C6E] font-medium">{post.reply_count || 0} replies</span>
          </button>

          <button className="flex items-center gap-2 text-[#9B9B9B] hover:text-[#7C8C6E] transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}