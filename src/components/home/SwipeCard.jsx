import React, { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Share2, Eye, ChevronUp } from "lucide-react";

const typeStyles = {
  question: { label: "Question", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-400" },
  quote: { label: "Quote", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-400" },
  concern: { label: "Concern", bg: "bg-rose-50", border: "border-rose-200", dot: "bg-rose-400" },
};

export default function SwipeCard({ post, onLike, onReply, onSkip, isTop }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const skipOpacity = useTransform(x, [-100, 0], [1, 0]);
  const upOpacity = useTransform(y, [-100, 0], [1, 0]);

  const style = typeStyles[post.type] || typeStyles.quote;

  const handleDragEnd = (e, info) => {
    if (info.offset.x > 100) {
      onLike(post);
    } else if (info.offset.x < -100) {
      onSkip(post);
    } else if (info.offset.y < -80) {
      onReply(post);
    }
  };

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      drag={isTop}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      style={{ x, y, rotate }}
      initial={{ scale: isTop ? 1 : 0.95, opacity: isTop ? 1 : 0.5 }}
      animate={{ scale: isTop ? 1 : 0.95, opacity: isTop ? 1 : 0.7 }}
      exit={{ x: 300, opacity: 0, transition: { duration: 0.3 } }}
    >
      <div className="h-full rounded-2xl bg-white shadow-sm border border-[#EDE9E3] flex flex-col overflow-hidden">
        {/* Type badge */}
        <div className="p-5 pb-0 flex items-center justify-between">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${style.bg} ${style.border} border`}>
            <div className={`w-2 h-2 rounded-full ${style.dot}`} />
            <span className="text-xs font-medium text-[#2C2C2C]">{style.label}</span>
          </div>
          <span className="text-xs text-[#9B9B9B]">
            {post.is_anonymous ? "Anonymous" : post.author_name || "Someone"}
          </span>
        </div>

        {/* Main text */}
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="font-serif text-xl md:text-2xl leading-relaxed text-center text-[#2C2C2C]" style={{ fontFamily: "var(--font-serif)" }}>
            {post.type === "quote" && <span className="text-4xl text-[#C4A882] leading-none">"</span>}
            {post.text}
            {post.type === "quote" && <span className="text-4xl text-[#C4A882] leading-none">"</span>}
          </p>
        </div>

        {/* Swipe hints */}
        <motion.div className="absolute top-1/2 right-6 -translate-y-1/2" style={{ opacity: likeOpacity }}>
          <div className="bg-emerald-100 text-emerald-600 px-4 py-2 rounded-full font-medium text-sm">
            I feel this ♥
          </div>
        </motion.div>
        <motion.div className="absolute top-1/2 left-6 -translate-y-1/2" style={{ opacity: skipOpacity }}>
          <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded-full font-medium text-sm">
            Skip →
          </div>
        </motion.div>
        <motion.div className="absolute top-16 left-1/2 -translate-x-1/2" style={{ opacity: upOpacity }}>
          <div className="bg-blue-50 text-blue-500 px-4 py-2 rounded-full font-medium text-sm flex items-center gap-1">
            <ChevronUp className="w-4 h-4" /> View Thread
          </div>
        </motion.div>

        {/* Bottom actions */}
        <div className="p-5 pt-0 flex items-center justify-center gap-8">
          <button onClick={() => onLike(post)} className="flex items-center gap-1.5 text-[#9B9B9B] hover:text-rose-400 transition-colors">
            <Heart className="w-5 h-5" />
            <span className="text-sm">{post.like_count || 0}</span>
          </button>
          <button onClick={() => onReply(post)} className="flex items-center gap-1.5 text-[#9B9B9B] hover:text-blue-400 transition-colors">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">{post.reply_count || 0}</span>
          </button>
          <button className="flex items-center gap-1.5 text-[#9B9B9B] hover:text-[#7C8C6E] transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}