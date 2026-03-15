import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Shuffle, Sparkles, Star, SlidersHorizontal, X, TrendingUp } from "lucide-react";
import DiscoverLogo from "./DiscoverLogo";
import BookmarkButton from "./BookmarkButton";
import AppPreviewDrawer from "./AppPreviewDrawer";
import DiscoverSection from "./DiscoverSection";
import CompactToolCard from "./CompactToolCard";

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

const CATEGORY_FILTERS = [
  { id: null,              label: "All",          emoji: "✨" },
  { id: "productivity",    label: "Productivity", emoji: "⚡" },
  { id: "finance",         label: "Finance",      emoji: "💰" },
  { id: "learning",        label: "Learning",     emoji: "📚" },
  { id: "lifestyle",       label: "Lifestyle",    emoji: "🌿" },
  { id: "entertainment",   label: "Entertain.",   emoji: "🎬" },
  { id: "health",          label: "Health",       emoji: "💪" },
  { id: "social",          label: "Social",       emoji: "👥" },
  { id: "developer_tools", label: "Dev Tools",    emoji: "🛠️" },
];

function getGradient(cat) {
  const g = CATEGORY_GRADIENTS[cat] || CATEGORY_GRADIENTS.general;
  return `linear-gradient(135deg, ${g[0]}, ${g[1]})`;
}

// ── Pulse dot for trending items ────────────────────────────────────────────
function PulseDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "#f43f5e" }} />
      <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: "#f43f5e" }} />
    </span>
  );
}

// ── Large Hero Card (for all non-trending sections) ────────────────────────
function HeroCard({ item, onPreview }) {
  return (
    <div
      onClick={() => onPreview(item)}
      className="shrink-0 cursor-pointer active:scale-[0.98] transition-transform duration-150"
      style={{ width: 270 }}
    >
      <div
        className="rounded-3xl overflow-hidden relative"
        style={{
          background: getGradient(item.category),
          boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
          height: 210,
        }}
      >
        {/* Decorative orbs */}
        <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.1)", filter: "blur(25px)" }} />
        <div style={{ position: "absolute", bottom: -20, left: 20, width: 80, height: 80, borderRadius: "50%", background: "rgba(0,0,0,0.12)", filter: "blur(18px)" }} />

        {/* App logo - top left, smaller */}
        <div className="absolute top-5 left-5">
          <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.25)", backdropFilter: "blur(12px)", border: "1.5px solid rgba(255,255,255,0.35)" }}>
            <DiscoverLogo item={item} size="md" />
          </div>
        </div>

        {/* Badges top-right */}
        <div className="absolute top-5 right-4 flex flex-col gap-1 items-end">
          {item.is_featured && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.22)", backdropFilter: "blur(8px)" }}>
              <PulseDot />
              <span className="text-[9px] font-bold text-white">HOT</span>
            </div>
          )}
          {item.is_new && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: "rgba(255,255,255,0.22)" }}>✨ NEW</span>}
        </div>

        {/* Bottom gradient content */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pt-8 pb-5" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.25) 60%, transparent 100%)" }}>
          <h3 className="font-bold text-white text-[15px] leading-tight mb-1 line-clamp-1">{item.title}</h3>
          <p className="text-white/80 text-[11px] leading-snug line-clamp-2 mb-3">{item.description}</p>

          {/* Rating + pricing inline */}
          <div className="flex items-center gap-2 mb-3">
            {(item.avg_rating || 0) > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="text-[11px] font-bold text-white">{item.avg_rating.toFixed(1)}</span>
                {item.review_count > 0 && <span className="text-[9px] text-white/60">({item.review_count})</span>}
              </div>
            )}
            {item.pricing && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.22)", color: "#fff" }}>
                {item.pricing}
              </span>
            )}
          </div>

          {/* Link button */}
          {item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3.5 py-1.5 rounded-full text-white active:scale-95 transition-transform"
              style={{ backgroundColor: "rgba(255,255,255,0.28)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.35)" }}
            >
              {item.pricing === "Free" ? "Try Free" : "Open"} <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Tags below card */}
      {item.tags?.length > 0 && (
        <div className="flex gap-1.5 mt-2 px-1 overflow-hidden">
          {item.tags.slice(0, 3).map((tag, i) => (
            <span key={i} className="text-[9px] px-2 py-0.5 rounded-full truncate" style={{ backgroundColor: "var(--bg-card)", color: "var(--text-hint)", border: "1px solid var(--border-light)" }}>
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Medium Card for category rows ──────────────────────────────────────────
function MediumCard({ item, onPreview }) {
  return (
    <div
      onClick={() => onPreview(item)}
      className="rounded-2xl overflow-hidden cursor-pointer active:scale-95 transition-transform duration-150 w-full"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}
    >
      {/* Gradient banner */}
      <div className="relative flex items-center justify-center" style={{ height: 88, background: getGradient(item.category) }}>
        <div className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.22)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.25)" }}>
          <DiscoverLogo item={item} size="sm" />
        </div>
        {item.is_featured && (
          <div className="absolute top-2 left-2 flex items-center gap-1">
            <PulseDot />
          </div>
        )}
        {item.is_new && (
          <span className="absolute top-2 right-2 text-[8px] font-bold bg-white/90 text-emerald-700 px-1.5 py-0.5 rounded-full">NEW</span>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5">
        <p className="text-[12px] font-bold leading-tight mb-1 truncate" style={{ color: "var(--text-primary)" }}>{item.title}</p>
        <p className="text-[10px] line-clamp-2 leading-snug mb-2" style={{ color: "var(--text-hint)" }}>{item.description}</p>

        <div className="flex items-center justify-between">
          {(item.avg_rating || 0) > 0 ? (
            <div className="flex items-center gap-0.5">
              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
              <span className="text-[10px] font-bold" style={{ color: "var(--text-secondary)" }}>{item.avg_rating.toFixed(1)}</span>
            </div>
          ) : <span />}
          {item.pricing && (
            <span className="text-[9px] font-semibold" style={{ color: item.pricing === "Free" ? "#059669" : "var(--text-hint)" }}>
              {item.pricing === "Free" ? "Free" : item.pricing}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Seamless Category Row ──────────────────────────────────────────────────
function SeamlessRow({ label, emoji, items, onPreview }) {
  if (!items.length) return null;
  return (
    <div className="mb-2">
      <div className="flex items-center gap-2 px-4 mb-3 mt-6">
        <span className="text-base">{emoji}</span>
        <h2 className="text-[13px] font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{label}</h2>
        <span className="text-[10px] ml-auto" style={{ color: "var(--text-hint)" }}>{items.length} apps</span>
      </div>
      <div className="px-4">
        <div className="masonry-grid">
          {items.slice(0, 12).map(item => (
            <div key={item.id} className="masonry-item">
              <MediumCard item={item} onPreview={onPreview} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Surprise Me ─────────────────────────────────────────────────────────────
function SurpriseBtn({ onClick }) {
  return (
    <div className="px-4 mt-6 mb-2">
      <button
        onClick={onClick}
        className="w-full py-4 rounded-3xl flex items-center justify-center gap-3 font-bold text-sm active:scale-95 transition-transform duration-150"
        style={{
          background: "linear-gradient(135deg, #2E6B4F, #4ade80 80%)",
          color: "#fff",
          boxShadow: "0 4px 24px rgba(46,107,79,0.35)",
        }}
      >
        <Shuffle className="w-5 h-5" />
        Surprise Me — Random Tool
      </button>
    </div>
  );
}

// ── Category Filter Bottom Sheet ────────────────────────────────────────────
function CategoryFilterSheet({ activeCategory, onChange, onClose }) {
  return (
    <div
      className="fixed inset-0 flex flex-col justify-end"
      style={{ zIndex: 9998, touchAction: "none" }}
      onMouseDown={onClose}
    >
      <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.45)" }} />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 320 }}
        className="relative rounded-t-3xl pb-8 pt-4 px-4"
        style={{ backgroundColor: "var(--bg-card)", zIndex: 1 }}
        onMouseDown={e => e.stopPropagation()}
      >
          <div className="flex justify-center mb-4">
            <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "var(--border-medium)" }} />
          </div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Filter by Category</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--bg-subtle)" }}>
              <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {CATEGORY_FILTERS.map(cat => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={String(cat.id)}
                  onClick={() => { onChange(cat.id); onClose(); }}
                  className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl font-semibold text-xs active:scale-95 transition-transform duration-150"
                  style={{
                    backgroundColor: isActive ? "var(--accent-primary)" : "var(--bg-subtle)",
                    color: isActive ? "#fff" : "var(--text-secondary)",
                    border: `1.5px solid ${isActive ? "var(--accent-primary)" : "var(--border-light)"}`,
                    boxShadow: isActive ? "0 4px 14px rgba(46,107,79,0.25)" : "none",
                  }}
                >
                  <span className="text-xl">{cat.emoji}</span>
                  <span className="text-[11px] font-semibold leading-tight text-center">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
    </div>
  );
}

// ── MAIN DiscoverExplorer ───────────────────────────────────────────────────
const ROWS = [
  { label: "Trending Tools",    emoji: "🔥", filter: i => i.is_featured },
  { label: "AI-Powered",        emoji: "🤖", filter: i => i.tags?.some(t => /ai|gpt|llm|artificial|ml/i.test(t)) || i.description?.toLowerCase().includes("ai") },
  { label: "Productivity",      emoji: "⚡", filter: i => i.category === "productivity" },
  { label: "Study & Learning",  emoji: "📚", filter: i => i.category === "learning" },
  { label: "Entertainment",     emoji: "🎬", filter: i => i.category === "entertainment" },
  { label: "Developer Tools",   emoji: "🛠️", filter: i => i.category === "developer_tools" },
  { label: "Health & Wellness", emoji: "💪", filter: i => i.category === "health" },
  { label: "Lifestyle",         emoji: "🌿", filter: i => i.category === "lifestyle" },
  { label: "Finance",           emoji: "💰", filter: i => i.category === "finance" },
  { label: "Social",            emoji: "👥", filter: i => i.category === "social" },
];

export default function DiscoverExplorer({ items, isLoading, user, onItemClick, onChipSearch }) {
  const [previewItem, setPreviewItem] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);

  // Clear all overlays when component unmounts (page navigation)
  useEffect(() => {
    return () => {
      setPreviewItem(null);
      setShowFilter(false);
      document.body.style.overflow = "";
    };
  }, []);

  const featured = useMemo(() =>
    items.filter(i => i.is_featured || (i.avg_rating || 0) >= 4).slice(0, 10),
  [items]);

  const filteredItems = useMemo(() =>
    activeCategory ? items.filter(i => i.category === activeCategory) : items,
  [items, activeCategory]);

  const handleSurprise = () => {
    if (!items.length) return;
    const pick = items[Math.floor(Math.random() * items.length)];
    setPreviewItem(pick);
  };

  const activeCatLabel = CATEGORY_FILTERS.find(c => c.id === activeCategory);

  if (isLoading) {
    return (
      <div className="px-4 pt-4 space-y-5 pb-28">
        <div className="flex gap-4 overflow-hidden">
          {[1,2,3].map(i => <div key={i} className="shrink-0 rounded-3xl animate-pulse" style={{ width: 270, height: 210, backgroundColor: "var(--bg-card)" }} />)}
        </div>
        <div className="flex gap-3 overflow-hidden mt-4">
          {[1,2,3,4].map(i => <div key={i} className="shrink-0 rounded-2xl animate-pulse" style={{ width: 148, height: 160, backgroundColor: "var(--bg-card)" }} />)}
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1,2,3,4].map(i => <div key={i} className="shrink-0 rounded-2xl animate-pulse" style={{ width: 148, height: 160, backgroundColor: "var(--bg-card)" }} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-28">
      {/* ── Filter toggle bar ── */}
      <div className="flex items-center justify-between px-4 mb-4">
        <button
          onClick={() => setShowFilter(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold active:scale-95 transition-transform duration-150"
          style={{
            backgroundColor: activeCategory ? "var(--accent-primary)" : "var(--bg-card)",
            color: activeCategory ? "#fff" : "var(--text-secondary)",
            border: `1px solid ${activeCategory ? "var(--accent-primary)" : "var(--border-light)"}`,
            boxShadow: activeCategory ? "0 2px 12px rgba(46,107,79,0.25)" : "none",
          }}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          {activeCatLabel ? `${activeCatLabel.emoji} ${activeCatLabel.label}` : "Filter"}
          {activeCategory && (
            <span onClick={e => { e.stopPropagation(); setActiveCategory(null); }} className="ml-1">
              <X className="w-3 h-3" />
            </span>
          )}
        </button>

        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" style={{ color: "var(--accent-primary)" }} />
          <span className="text-xs font-semibold" style={{ color: "var(--text-hint)" }}>{filteredItems.length} tools</span>
        </div>
      </div>

      {/* ── If category filter active: show flat list ── */}
      {activeCategory ? (
        <div className="px-4 space-y-2.5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setPreviewItem(item)}
              className="flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer active:scale-[0.98] transition-transform duration-150"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
            >
              <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: getGradient(item.category) }}>
                <DiscoverLogo item={item} size="sm" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>{item.title}</p>
                  {item.is_featured && <PulseDot />}
                </div>
                <p className="text-[11px] line-clamp-1" style={{ color: "var(--text-secondary)" }}>{item.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  {(item.avg_rating || 0) > 0 && (
                    <div className="flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      <span className="text-[10px] font-bold" style={{ color: "var(--text-secondary)" }}>{item.avg_rating.toFixed(1)}</span>
                    </div>
                  )}
                  {item.pricing && <span className="text-[10px]" style={{ color: item.pricing === "Free" ? "#059669" : "var(--text-hint)" }}>{item.pricing}</span>}
                  {item.tags?.slice(0, 2).map((t, idx) => (
                    <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>{t}</span>
                  ))}
                </div>
              </div>
              {item.link && (
                <a href={item.link} target="_blank" rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-full text-white"
                  style={{ backgroundColor: "var(--accent-primary)" }}
                >
                  Try
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* ── Featured hero row ── */}
          {featured.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center gap-2 px-4 mb-3">
                <Sparkles className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
                <h2 className="text-[13px] font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Featured for You</h2>
              </div>
              
              {/* Horizontal scroll for featured */}
              <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 snap-x snap-mandatory">
                {featured.map(item => (
                  <div key={item.id} className="snap-start">
                    <HeroCard item={item} onPreview={setPreviewItem} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Trending Tools — Compact 4:5 cards (more items) ── */}
          {(() => {
            const slowlyApp = {
              id: "slowly-app",
              title: "Slowly",
              description: "Pen pal redefined. Connect with people around the world through thoughtful letters.",
              category: "social",
              logo_url: "https://play-lh.googleusercontent.com/9NvLpj8LHYC2C_9_bQhvC0QH3YcLFPaJNQlLQvdnlH9yZfQ_qJW6lHlQKJY8Xnl0MA=w240-h480",
              link: "https://slowly.app",
              is_featured: true,
              is_new: false,
              avg_rating: 4.6,
              review_count: 128000,
              pricing: "Free",
              tags: ["social", "pen-pal", "letters"]
            };
            const trendingItems = [slowlyApp, ...items.filter(i => i.is_featured || i.is_new || (i.avg_rating || 0) >= 4.2)];
            return trendingItems.length > 0 && (
              <DiscoverSection title="🔥 Trending Tools" subtitle="Hot right now">
                <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 snap-x snap-mandatory">
                  {trendingItems.slice(0, 20).map(item => (
                    <div key={item.id} className="snap-start">
                      <CompactToolCard item={item} onClick={() => setPreviewItem(item)} />
                    </div>
                  ))}
                </div>
              </DiscoverSection>
            );
          })()}

          {/* ── All other sections use Hero Cards ── */}
          {(() => {
            const aiItems = items.filter(i => i.tags?.some(t => /ai|gpt|llm|artificial|ml/i.test(t)) || i.description?.toLowerCase().includes("ai"));
            return aiItems.length > 0 && (
              <DiscoverSection title="🤖 AI-Powered" subtitle="Supercharge with AI">
                {aiItems.slice(0, 12).map(item => (
                  <HeroCard key={item.id} item={item} onPreview={setPreviewItem} />
                ))}
              </DiscoverSection>
            );
          })()}

          {(() => {
            const prodItems = items.filter(i => i.category === "productivity");
            return prodItems.length > 0 && (
              <DiscoverSection title="⚡ Productivity" subtitle="Work smarter">
                {prodItems.slice(0, 10).map(item => (
                  <HeroCard key={item.id} item={item} onPreview={setPreviewItem} />
                ))}
              </DiscoverSection>
            );
          })()}

          {(() => {
            const learnItems = items.filter(i => i.category === "learning");
            return learnItems.length > 0 && (
              <DiscoverSection title="📚 Study & Learning" subtitle="Expand your knowledge">
                {learnItems.slice(0, 10).map(item => (
                  <HeroCard key={item.id} item={item} onPreview={setPreviewItem} />
                ))}
              </DiscoverSection>
            );
          })()}

          {(() => {
            const devItems = items.filter(i => i.category === "developer_tools");
            return devItems.length > 0 && (
              <DiscoverSection title="🛠️ Developer Tools" subtitle="Build better">
                {devItems.slice(0, 10).map(item => (
                  <HeroCard key={item.id} item={item} onPreview={setPreviewItem} />
                ))}
              </DiscoverSection>
            );
          })()}

          {(() => {
            const entertainItems = items.filter(i => i.category === "entertainment");
            return entertainItems.length > 0 && (
              <DiscoverSection title="🎬 Entertainment" subtitle="Relax & enjoy">
                {entertainItems.slice(0, 10).map(item => (
                  <HeroCard key={item.id} item={item} onPreview={setPreviewItem} />
                ))}
              </DiscoverSection>
            );
          })()}

          {(() => {
            const healthItems = items.filter(i => i.category === "health");
            return healthItems.length > 0 && (
              <DiscoverSection title="💪 Health & Wellness" subtitle="Stay healthy">
                {healthItems.slice(0, 10).map(item => (
                  <HeroCard key={item.id} item={item} onPreview={setPreviewItem} />
                ))}
              </DiscoverSection>
            );
          })()}

          {(() => {
            const lifestyleItems = items.filter(i => i.category === "lifestyle");
            return lifestyleItems.length > 0 && (
              <DiscoverSection title="🌿 Lifestyle" subtitle="Live better">
                {lifestyleItems.slice(0, 10).map(item => (
                  <HeroCard key={item.id} item={item} onPreview={setPreviewItem} />
                ))}
              </DiscoverSection>
            );
          })()}

          {(() => {
            const financeItems = items.filter(i => i.category === "finance");
            return financeItems.length > 0 && (
              <DiscoverSection title="💰 Finance" subtitle="Manage your money">
                {financeItems.slice(0, 10).map(item => (
                  <HeroCard key={item.id} item={item} onPreview={setPreviewItem} />
                ))}
              </DiscoverSection>
            );
          })()}

          {(() => {
            const socialItems = items.filter(i => i.category === "social");
            return socialItems.length > 0 && (
              <DiscoverSection title="👥 Social" subtitle="Connect with others">
                {socialItems.slice(0, 10).map(item => (
                  <HeroCard key={item.id} item={item} onPreview={setPreviewItem} />
                ))}
              </DiscoverSection>
            );
          })()}

          {/* ── Surprise Me ── */}
          <SurpriseBtn onClick={handleSurprise} />
        </>
      )}

      {/* ── App Preview Drawer ── */}
      <AppPreviewDrawer
        item={previewItem}
        user={user}
        onClose={() => setPreviewItem(null)}
        onFullOpen={() => { onItemClick(previewItem); setPreviewItem(null); }}
      />

      {/* ── Category Filter Sheet ── */}
      <AnimatePresence>
        {showFilter && (
          <CategoryFilterSheet
            activeCategory={activeCategory}
            onChange={setActiveCategory}
            onClose={() => setShowFilter(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}