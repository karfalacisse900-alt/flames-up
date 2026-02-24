import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

const TYPE_SPOTLIGHT = {
  quote_of_day:    { label: "Quote of the Day",    emoji: "✦",  grad: "linear-gradient(135deg, #FAF5EC, #EDE0C8)" },
  question_of_day: { label: "Question of the Day", emoji: "🌟", grad: "linear-gradient(135deg, #EEF3F0, #d4e8dc)" },
  concern_of_day:  { label: "Concern of the Day",  emoji: "🔴", grad: "linear-gradient(135deg, #FFF0F0, #FDDEDE)" },
  review:          { label: "Featured Review",      emoji: "⭐", grad: "linear-gradient(135deg, #FFF3E8, #FAE0C8)" },
  opinion:         { label: "Featured Opinion",     emoji: "💬", grad: "linear-gradient(135deg, #EEF3F0, #DFF0E8)" },
  debate:          { label: "Debate of the Day",    emoji: "⚔️", grad: "linear-gradient(135deg, #F5F0E8, #EDE0C8)" },
  question:        { label: "Question of the Day",  emoji: "❓", grad: "linear-gradient(135deg, #F0EEF8, #E0DCFA)" },
};

export default function DailySpotlight({ posts, user }) {
  const [idx, setIdx] = useState(0);
  const post = posts[idx];
  if (!post) return null;

  const cfg = TYPE_SPOTLIGHT[post.type] || TYPE_SPOTLIGHT.opinion;

  return (
    <div className="px-4 pt-3 pb-1">
      {/* Section label */}
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--accent-secondary)" }} />
        <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--accent-secondary)" }}>Daily Spotlight</p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={post.id}
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.28 }}
          className="rounded-2xl p-4"
          style={{ background: cfg.grad, border: "1px solid rgba(0,0,0,0.06)" }}>

          {/* Label */}
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "rgba(0,0,0,0.45)" }}>
            {cfg.emoji} {cfg.label}
          </p>

          {/* Content */}
          {post.title && (
            <p className="font-semibold text-sm mb-1" style={{ fontFamily: "var(--font-serif)", color: "#2F2F2F" }}>{post.title}</p>
          )}
          <p className="text-sm leading-relaxed" style={{ fontFamily: "var(--font-serif)", color: "#3a3a3a" }}>
            "{post.body}"
          </p>

          {/* Author & engagement */}
          <div className="flex items-center justify-between mt-3">
            <p className="text-[11px]" style={{ color: "rgba(0,0,0,0.4)" }}>
              — {post.is_anonymous ? "Anonymous" : (post.author_name || "Community")}
            </p>
            <div className="flex items-center gap-3 text-xs" style={{ color: "rgba(0,0,0,0.4)" }}>
              <span>▲ {post.upvotes || 0}</span>
              <span>💬 {post.comment_count || 0}</span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation dots */}
      {posts.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-2">
          <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0}
            className="p-1 disabled:opacity-30">
            <ChevronLeft className="w-3.5 h-3.5" style={{ color: "var(--text-hint)" }} />
          </button>
          {posts.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className="rounded-full transition-all"
              style={{ width: i === idx ? 16 : 6, height: 6, backgroundColor: i === idx ? "var(--accent-primary)" : "var(--border-medium)" }} />
          ))}
          <button onClick={() => setIdx(i => Math.min(posts.length - 1, i + 1))} disabled={idx === posts.length - 1}
            className="p-1 disabled:opacity-30">
            <ChevronRight className="w-3.5 h-3.5" style={{ color: "var(--text-hint)" }} />
          </button>
        </div>
      )}
    </div>
  );
}