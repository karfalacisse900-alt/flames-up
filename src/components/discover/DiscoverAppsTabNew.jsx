import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Plus, ExternalLink, Star, Sparkles, Flame } from "lucide-react";
import { base44 } from "@/api/base44Client";
import DiscoverLogo from "./DiscoverLogo";
import StarRating from "./StarRating";
import BookmarkButton from "./BookmarkButton";
import SubmitAppModal from "./SubmitAppModal.jsx";
import { motion } from "framer-motion";

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
  const [a, b] = CATEGORY_GRADIENTS[item.category] || CATEGORY_GRADIENTS.general;
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onOpen}
      className="shrink-0 rounded-3xl overflow-hidden flex flex-col text-left relative"
      style={{ width: 148, background: `linear-gradient(150deg, ${a}18, ${b}30)`, border: `1.5px solid ${a}40` }}
    >
      <div className="px-3 pt-3 pb-2">
        <div className="w-11 h-11 rounded-2xl overflow-hidden mb-2 shadow-md flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}>
          <DiscoverLogo item={item} size="sm" />
        </div>
        <p className="text-xs font-bold leading-tight" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{item.title}</p>
        {item.pricing && <p className="text-[10px] mt-0.5 font-medium" style={{ color: a }}>{item.pricing}</p>}
        {(item.avg_rating || 0) > 0 && (
          <div className="flex items-center gap-0.5 mt-1.5">
            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
            <span className="text-[10px] font-bold" style={{ color: "var(--text-secondary)" }}>{item.avg_rating?.toFixed(1)}</span>
          </div>
        )}
      </div>
      {item.is_new && (
        <span className="absolute top-2.5 right-2.5 text-[9px] font-black px-1.5 py-0.5 rounded-full text-white" style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}>NEW</span>
      )}
    </motion.button>
  );
}

// ── Feed card ───────────────────────────────────────────────────────────────
function AppFeedCard({ item, user, onOpen, index }) {
  const [a, b] = CATEGORY_GRADIENTS[item.category] || CATEGORY_GRADIENTS.general;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), type: "spring", stiffness: 280, damping: 24 }}
      className="rounded-3xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform h-full flex flex-col"
      style={{ backgroundColor: "var(--bg-card)", border: "1.5px solid var(--border-light)", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}
      onClick={onOpen}
    >
      {/* Top organic shape */}
      <div className="relative h-24 overflow-hidden flex items-end px-4 pb-3" style={{ background: `linear-gradient(135deg, ${a}22, ${b}44)` }}>
        {/* Blob decoration */}
        <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-30" style={{ background: `radial-gradient(circle, ${a}, ${b})` }} />
        <div className="absolute top-2 right-8 w-8 h-8 rounded-full opacity-20" style={{ background: b }} />

        <div className="flex items-end gap-3 z-10 w-full">
          <div className="w-13 h-13 rounded-2xl overflow-hidden shadow-lg flex-shrink-0" style={{ background: `linear-gradient(135deg, ${a}, ${b})`, width: 52, height: 52 }}>
            <DiscoverLogo item={item} size="md" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm leading-tight" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{item.title}</h3>
            {item.brand_name && <p className="text-[11px] mt-0.5 font-medium" style={{ color: a }}>{item.brand_name}</p>}
          </div>
          {item.is_featured && (
            <span className="shrink-0 flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full text-white" style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}>
              🔥 Hot
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pt-3 pb-4 flex flex-col flex-1">
        <p className="text-[13px] leading-relaxed mb-3 line-clamp-2 flex-1" style={{ color: "var(--text-secondary)" }}>
          {item.description}
        </p>

        {/* Tags row */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {item.pricing && (
            <span className="text-[11px] px-2.5 py-1 rounded-full font-bold" style={{ backgroundColor: `${a}18`, color: a }}>
              {item.pricing}
            </span>
          )}
          {item.is_new && (
            <span className="text-[11px] px-2.5 py-1 rounded-full font-black text-white" style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}>
              ✦ NEW
            </span>
          )}
          {item.tags?.slice(0, 2).map((tag, i) => (
            <span key={i} className="text-[11px] px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
              {tag}
            </span>
          ))}
        </div>

        {/* Bottom row: rating + CTA */}
        <div className="flex items-center justify-between">
          <div>
            {(item.avg_rating || 0) > 0 ? (
              <StarRating value={item.avg_rating || 0} showCount count={item.review_count || 0} />
            ) : (
              <span className="text-[10px]" style={{ color: "var(--text-hint)" }}>Be first to review</span>
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
                className="flex items-center gap-1 text-xs font-black px-4 py-2 rounded-full text-white"
                style={{ background: `linear-gradient(135deg, ${a}, ${b})`, boxShadow: `0 4px 12px ${a}44` }}
                onClick={e => e.stopPropagation()}
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
    <div className="flex items-center gap-2 mb-3 mt-6">
      <span className="text-base">{icon}</span>
      <h2 className="text-base font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)", letterSpacing: "-0.3px" }}>{label}</h2>
      <div className="flex-1 h-px ml-1" style={{ backgroundColor: "var(--border-subtle)" }} />
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
// category / onCategoryChange are now lifted from the parent (Discover page).
// hideCategoryPills = true means the parent already rendered pills (desktop sidebar).
export default function DiscoverAppsTabNew({ items, isLoading, search, user, onItemClick, category = null, onCategoryChange, hideCategoryPills = false }) {
  const [internalCategory, setInternalCategory] = useState(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);
  const trendingScrollRef = useRef(null);
  const trendingPausedRef = useRef(false);
  const trendingIndexRef = useRef(0);

  // If category is controlled externally use it, else use internal
  const activeCategory = onCategoryChange ? category : internalCategory;
  const setActiveCategory = onCategoryChange ? onCategoryChange : setInternalCategory;

  // Auto-advance "Apps You Might Need" every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (trendingPausedRef.current || !trendingScrollRef.current) return;
      const container = trendingScrollRef.current;
      const cardWidth = 144 + 12;
      const maxIndex = Math.floor(container.scrollWidth / cardWidth) - 1;
      trendingIndexRef.current = trendingIndexRef.current >= maxIndex ? 0 : trendingIndexRef.current + 1;
      container.scrollTo({ left: trendingIndexRef.current * cardWidth, behavior: "smooth" });
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    let result = items.filter(item => {
      const catMatch = activeCategory === null || item.category === activeCategory;
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
  }, [items, activeCategory, search]);

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
      <div className="px-4 pt-2 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-44 rounded-2xl animate-pulse" style={{ backgroundColor: "var(--bg-card)" }} />
        ))}
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* ── Category pills — mobile only (desktop uses sidebar) ── */}
      {!hideCategoryPills && (
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide lg:hidden">
          {CATEGORIES.map(c => {
            const isActive = activeCategory === c.id;
            return (
              <button
                key={String(c.id)}
                onClick={() => { setActiveCategory(c.id); setVisibleCount(12); }}
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
      )}

      <div className="px-4">
        {/* ── Apps You Might Need ── */}
        {!search && activeCategory === null && trending.length > 0 && (
          <>
            <SectionHeader icon="💡" label="Apps You Might Need" />
            {/* Mobile: horizontal scroll. Desktop: 5-col grid */}
            <div className="hidden lg:grid grid-cols-5 gap-3 mb-2">
              {trending.slice(0, 5).map(item => (
                <TrendingCard key={item.id} item={item} onOpen={() => onItemClick(item)} />
              ))}
            </div>
            <div
              className="lg:hidden flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4"
              ref={trendingScrollRef}
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
        {!search && activeCategory === null && newThisWeek.length > 0 && (
          <>
            <SectionHeader icon="⭐" label="Recommended For You" />
            <div className="hidden lg:grid grid-cols-5 gap-3 mb-2">
              {newThisWeek.slice(0, 5).map(item => (
                <TrendingCard key={item.id} item={item} onOpen={() => onItemClick(item)} />
              ))}
            </div>
            <div className="lg:hidden flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
              {newThisWeek.map(item => (
                <TrendingCard key={item.id} item={item} onOpen={() => onItemClick(item)} />
              ))}
            </div>
          </>
        )}

        {/* ── Main feed header ── */}
        <div className="flex items-center justify-between mt-5 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
            <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              {search ? `Results for "${search}"` : activeCategory ? CATEGORIES.find(c => c.id === activeCategory)?.label : "All Apps & Tools"}
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

        {/* ── Grid: 1 col mobile, 2 col desktop ── */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-sm" style={{ color: "var(--text-hint)" }}>No apps found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {visibleItems.map((item, i) => (
              <AppFeedCard key={item.id} item={item} user={user} index={i} onOpen={() => onItemClick(item)} />
            ))}
            {/* Infinite scroll sentinel — spans full width */}
            {visibleCount < filtered.length && (
              <div ref={observerRef} className="col-span-full h-8 flex items-center justify-center">
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