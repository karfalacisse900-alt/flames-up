import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Flame, MessageCircle, HelpCircle, Swords, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const TYPE_CONFIG = {
  question:   { icon: HelpCircle,     color: "#7C69C4", bg: "#F0EEF8", label: "Question" },
  opinion:    { icon: MessageCircle,  color: "#D98B62", bg: "#FFF3E8", label: "Opinion" },
  debate:     { icon: Swords,         color: "#E05C7A", bg: "#FEF0F4", label: "Debate" },
  discussion: { icon: MessageCircle,  color: "var(--accent-primary)", bg: "var(--accent-primary-light)", label: "Discussion" },
  default:    { icon: MessageCircle,  color: "var(--accent-primary)", bg: "var(--accent-primary-light)", label: "Post" },
};

function TrendingCard({ post }) {
  const cfg = TYPE_CONFIG[post.type] || TYPE_CONFIG.default;
  const Icon = cfg.icon;
  const text = post.content || post.body || post.text || "";

  return (
    <motion.div
      key={post.id}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="w-full rounded-2xl p-4"
      style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.color}22` }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Flame className="w-3.5 h-3.5" style={{ color: "#D98B62" }} />
        <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: cfg.color }}>
          {cfg.label}
        </span>
        {post.author_name && (
          <span className="text-[10px] ml-auto" style={{ color: "var(--text-hint)" }}>
            by {post.is_anonymous ? "Anonymous" : post.author_name}
          </span>
        )}
      </div>
      <p className="text-sm font-medium leading-relaxed line-clamp-3" style={{ color: "var(--text-primary)", fontFamily: post.type === "quote_of_day" ? "var(--font-serif)" : "var(--font-sans)" }}>
        {post.type === "quote_of_day" ? `"${text}"` : text}
      </p>
      <div className="flex items-center gap-3 mt-2.5">
        {(post.upvotes || 0) > 0 && (
          <span className="text-[11px]" style={{ color: "var(--text-hint)" }}>▲ {post.upvotes}</span>
        )}
        {(post.comment_count || 0) > 0 && (
          <span className="text-[11px]" style={{ color: "var(--text-hint)" }}>💬 {post.comment_count}</span>
        )}
        <Link to={createPageUrl(`PostDetail?id=${post.id}`)}
          className="ml-auto flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold transition-all active:scale-95"
          style={{ backgroundColor: cfg.color, color: "#fff" }}
          onClick={e => e.stopPropagation()}>
          <Users className="w-3 h-3" /> Join
        </Link>
      </div>
    </motion.div>
  );
}

export default function TrendingCarousel() {
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);

  const { data: posts = [] } = useQuery({
    queryKey: ["trendingCarouselPosts"],
    queryFn: () => base44.entities.CommunityPost.list("-engagement_score", 20),
    staleTime: 60000,
  });

  const featured = posts.filter(p => p.type !== "review" && (p.content || p.body || p.text)).slice(0, 10);

  useEffect(() => {
    if (featured.length === 0) return;
    timerRef.current = setInterval(() => {
      setIndex(i => (i + 1) % featured.length);
    }, 5000);
    return () => clearInterval(timerRef.current);
  }, [featured.length]);

  if (featured.length === 0) return null;

  return (
    <div className="px-4 mb-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Flame className="w-3.5 h-3.5" style={{ color: "#D98B62" }} />
        <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Trending in Community</p>
        {/* Dots */}
        <div className="flex gap-1 ml-auto">
          {featured.slice(0, 8).map((_, i) => (
            <button key={i} onClick={() => setIndex(i)}
              className="rounded-full transition-all"
              style={{ width: i === index % featured.length ? 16 : 5, height: 5, backgroundColor: i === index % featured.length ? "var(--accent-primary)" : "var(--border-medium)" }}
            />
          ))}
        </div>
      </div>
      <div className="relative overflow-hidden" style={{ minHeight: 100 }}>
        <AnimatePresence mode="wait">
          <TrendingCard key={featured[index % featured.length]?.id} post={featured[index % featured.length]} />
        </AnimatePresence>
      </div>
    </div>
  );
}