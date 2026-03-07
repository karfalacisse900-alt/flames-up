import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Plus, ExternalLink, Star, TrendingUp, Sparkles, Flame } from "lucide-react";
import { base44 } from "@/api/base44Client";
import DiscoverLogo from "./DiscoverLogo";
import StarRating from "./StarRating";
import BookmarkButton from "./BookmarkButton";
import SubmitAppModal from "./SubmitAppModal.jsx";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = [
  { id: null,              label: "✨ All" },
  { id: "productivity",    label: "⚡ Productivity" },
  { id: "finance",         label: "💰 Finance" },
  { id: "learning",        label: "📚 Learning" },
  { id: "lifestyle",       label: "🌿 Lifestyle" },
  { id: "entertainment",   label: "🎬 Entertainment" },
  { id: "health",          label: "💪 Health" },
  { id: "social",          label: "👥 Social" },
  { id: "developer_tools", label: "🛠️ Dev Tools" },
];

const CATEGORY_GRADIENTS = {
  productivity:    ["#6366f1", "#8b5cf6"],
  finance:         ["#10b981", "#059669"],
  learning:        ["#f59e0b", "#d97706"],
  lifestyle:       ["#34d399", "#10b981"],
  entertainment:   ["#f43f5e", "#e11d48"],
  health:          ["#06b6d4", "#0891b2"],
  social:          ["#8b5cf6", "#7c3aed"],
  developer_tools: ["#374151", "#1f2937"],
  general:         ["#2E6B4F", "#1a4230"],
};

function getGradient(category) {
  const g = CATEGORY_GRADIENTS[category] || CATEGORY_GRADIENTS.general;
  return `linear-gradient(135deg, ${g[0]}, ${g[1]})`;
}

// ── Trending strip card ─────────────────────────────────────────────────────
function TrendingCard({ item, onOpen }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onOpen}
      className="shrink-0 w-36 rounded-2xl overflow-hidden flex flex-col text-left"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
    >
      <div className="h-20 flex items-center justify-center relative" style={{ background: getGradient(item.category) }}>
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/20 flex items-center justify-center">
          <DiscoverLogo item={item} size="sm" />
        </div>
        {item.is_new && (
          <span className="absolute top-2 right-2 text-[9px] font-bold bg-white/90 text-emerald-700 px-1.5 py-0.5 rounded-full">NEW</span>
        )}
      </div>
      <div className="p-2.5">
        <p className="text-xs font-bold leading-tight truncate" style={{ color: "var(--text-primary)" }}>{item.title}</p>
        {item.pricing && <p className="text-[10px] mt-0.5" style={{ color: "var(--text-hint)" }}>{item.pricing}</p>}
        {(item.avg_rating || 0) > 0 && (
          <div className="flex items-center gap-0.5 mt-1">
            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
            <span className="text-[10px] font-semibold" style={{ color: "var(--text-secondary)" }}>{item.avg_rating?.toFixed(1)}</span>
          </div>
        )}
      </div>
    </motion.button>
  );
}

// ── Feed card ───────────────────────────────────────────────────────────────
function AppFeedCard({ item, user, onOpen, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3) }}
      className="rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
      onClick={onOpen}
    >
      {/* Banner */}
      <div className="h-16 relative flex items-center px-4 gap-3" style={{ background: getGradient(item.category) }}>
        <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/20 flex items-center justify-center flex-shrink-0 shadow-lg">
          <DiscoverLogo item={item} size="md" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-white leading-tight truncate">{item.title}</h3>
          {item.brand_name && <p className="text-[11px] text-white/70 truncate">{item.brand_name}</p>}
        </div>
        {item.is_featured && (
          <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
            <Flame className="w-3 h-3" /> Hot
          </span>
        )}
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        <p className="text-xs leading-relaxed mb-3 line-clamp-2" style={{ color: "var(--text-secondary)" }}>
          {item.description}
        </p>

        {/* Tags row */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {item.pricing && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
              {item.pricing}
            </span>
          )}
          {item.is_new && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold text-white" style={{ backgroundColor: "var(--accent-primary)" }}>
              NEW
            </span>
          )}
          {item.tags?.slice(0, 3).map((tag, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
              {tag}
            </span>
          ))}
          {item.platforms?.slice(0, 2).map((p, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>
              {p}
            </span>
          ))}
        </div>

        {/* Bottom row: rating + CTA */}
        <div className="flex items-center justify-between">
          <div>
            {(item.avg_rating || 0) > 0 ? (
              <StarRating value={item.avg_rating || 0} showCount count={item.review_count || 0} />
            ) : (
              <span className="text-[10px]" style={{ color: "var(--text-hint)" }}>No reviews yet</span>
            )}
          </div>
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            {user && (
              <BookmarkButton user={user} itemType="app" itemId={item.id} itemTitle={item.title} itemSubtitle={item.brand_name} itemImageUrl={item.logo_url} />
            )}
            {item.link && (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl text-white transition-transform hover:scale-105"
                style={{ backgroundColor: "var(--accent-primary)" }}
              >
                Open <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Section header ─────────────────────────────────────────────────────────
function SectionHeader({ icon, label }) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-5">
      <span className="text-base">{icon}</span>
      <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{label}</h2>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function DiscoverAppsTabNew({ items, isLoading, search, user, onItemClick }) {
  const [category, setCategory] = useState(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);
  const loaderRef = useRef(null);
  const trendingScrollRef = useRef(null);
  const trendingPausedRef = useRef(false);
  const trendingIndexRef = useRef(0);

  // Auto-advance "Apps You Might Need" every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (trendingPausedRef.current || !trendingScrollRef.current) return;
      const container = trendingScrollRef.current;
      const cardWidth = 144 + 12; // w-36 (144px) + gap-3 (12px)
      const maxIndex = Math.floor(container.scrollWidth / cardWidth) - 1;
      trendingIndexRef.current = trendingIndexRef.current >= maxIndex ? 0 : trendingIndexRef.current + 1;
      container.scrollTo({ left: trendingIndexRef.current * cardWidth, behavior: "smooth" });
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    let result = items.filter(item => {
      const catMatch = category === null || item.category === category;
      const searchTerm = (search || "").toLowerCase();
      const searchMatch = !searchTerm ||
        item.title?.toLowerCase().includes(searchTerm) ||
        item.description?.toLowerCase().includes(searchTerm) ||
        item.long_description?.toLowerCase().includes(searchTerm) ||
        item.brand_name?.toLowerCase().includes(searchTerm) ||
        item.tags?.some(t => t.toLowerCase().includes(searchTerm));
      return catMatch && searchMatch;
    });
    return result.sort((a, b) => {
      if (a.is_featured !== b.is_featured) return b.is_featured ? 1 : -1;
      return (b.avg_rating || 0) - (a.avg_rating || 0);
    });
  }, [items, category, search]);

  // Infinite scroll via IntersectionObserver
  const observerRef = useCallback(node => {
    if (!node) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) setVisibleCount(v => v + 10);
    }, { threshold: 0.1 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const trending = useMemo(() =>
    items.filter(i => i.is_featured || (i.avg_rating || 0) >= 4).slice(0, 10),
  [items]);

  const newThisWeek = useMemo(() =>
    items.filter(i => i.is_new).slice(0, 5),
  [items]);

  const visibleItems = filtered.slice(0, visibleCount);

  if (isLoading) {
    return (
      <div className="px-4 pt-2 pb-20 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-40 rounded-2xl animate-pulse" style={{ backgroundColor: "var(--bg-card)" }} />
        ))}
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* ── Category pills ── */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
        {CATEGORIES.map(c => {
          const isActive = category === c.id;
          return (
            <button
              key={String(c.id)}
              onClick={() => { setCategory(c.id); setVisibleCount(12); }}
              className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all chip"
              style={{
                backgroundColor: isActive ? "var(--accent-primary)" : "var(--bg-card)",
                color: isActive ? "#fff" : "var(--text-secondary)",
                border: `1px solid ${isActive ? "var(--accent-primary)" : "var(--border-light)"}`,
                boxShadow: isActive ? "0 2px 8px rgba(46,107,79,0.3)" : "none",
              }}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="px-4">
        {/* ── Apps You Might Need (auto-advance every 10s) ── */}
        {!search && category === null && trending.length > 0 && (
          <>
            <SectionHeader icon="💡" label="Apps You Might Need" />
            <div
              ref={trendingScrollRef}
              className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4"
              onMouseEnter={() => { trendingPausedRef.current = true; }}
              onMouseLeave={() => { trendingPausedRef.current = false; }}
              onTouchStart={() => { trendingPausedRef.current = true; }}
              onTouchEnd={() => { setTimeout(() => { trendingPausedRef.current = false; }, 2000); }}
            >
              {trending.map(item => (
                <TrendingCard key={item.id} item={item} onOpen={() => onItemClick(item)} />
              ))}
            </div>
          </>
        )}

        {/* ── Recommended For You ── */}
        {!search && category === null && newThisWeek.length > 0 && (
          <>
            <SectionHeader icon="⭐" label="Recommended For You" />
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
              {newThisWeek.map(item => (
                <TrendingCard key={item.id} item={item} onOpen={() => onItemClick(item)} />
              ))}
            </div>
          </>
        )}

        {/* ── Main feed ── */}
        <div className="flex items-center justify-between mt-5 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
            <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              {search ? `Results for "${search}"` : category ? CATEGORIES.find(c => c.id === category)?.label : "All Apps & Tools"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "var(--text-hint)" }}>{filtered.length} apps</span>
            {user && (
              <button
                onClick={() => setShowSubmit(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: "var(--accent-primary)" }}
              >
                <Plus className="w-3 h-3" /> Submit
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-sm" style={{ color: "var(--text-hint)" }}>No apps found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleItems.map((item, i) => (
              <AppFeedCard key={item.id} item={item} user={user} index={i} onOpen={() => onItemClick(item)} />
            ))}
            {/* Infinite scroll sentinel */}
            {visibleCount < filtered.length && (
              <div ref={observerRef} className="h-8 flex items-center justify-center">
                <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "var(--border-medium)", borderTopColor: "var(--accent-primary)" }} />
              </div>
            )}
          </div>
        )}
      </div>

      {showSubmit && (
        <SubmitAppModal
          user={user}
          onClose={() => setShowSubmit(false)}
          onSubmitted={() => setShowSubmit(false)}
        />
      )}
    </div>
  );
}