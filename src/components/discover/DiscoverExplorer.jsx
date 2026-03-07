import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Shuffle, Sparkles, ChevronRight, Star, Bookmark } from "lucide-react";
import DiscoverLogo from "./DiscoverLogo";
import BookmarkButton from "./BookmarkButton";

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

function getGradient(cat) {
  const g = CATEGORY_GRADIENTS[cat] || CATEGORY_GRADIENTS.general;
  return `linear-gradient(135deg, ${g[0]}, ${g[1]})`;
}

const CATEGORY_ROWS = [
  { label: "🔥 Trending Tools",     filter: i => i.is_featured },
  { label: "🤖 AI Tools",           filter: i => i.tags?.some(t => /ai|gpt|llm|artificial/i.test(t)) || i.description?.toLowerCase().includes("ai") },
  { label: "⚡ Productivity Apps",  filter: i => i.category === "productivity" },
  { label: "📚 Study Tools",        filter: i => i.category === "learning" },
  { label: "🎬 Entertainment",      filter: i => i.category === "entertainment" },
  { label: "🛠️ Developer Tools",    filter: i => i.category === "developer_tools" },
  { label: "💪 Health & Wellness",  filter: i => i.category === "health" },
  { label: "🌿 Lifestyle",          filter: i => i.category === "lifestyle" },
];

const QUICK_CHIPS = [
  { label: "🤖 AI Tools",         search: "ai" },
  { label: "📚 Study Tools",      search: "study" },
  { label: "✈️ Travel Apps",      search: "travel" },
  { label: "⚡ Productivity",     search: "productivity" },
  { label: "🎬 Free Movies",      search: "movie" },
  { label: "🛠️ Dev Tools",        search: "developer" },
  { label: "💰 Finance",          search: "finance" },
  { label: "💪 Health",           search: "health" },
];

// ── Large Hero Discovery Card ──────────────────────────────────────────────
function HeroCard({ item, user, onOpen, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      onClick={onOpen}
      className="shrink-0 cursor-pointer"
      style={{ width: 280 }}
    >
      <div
        className="rounded-3xl overflow-hidden relative"
        style={{
          background: getGradient(item.category),
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          height: 200,
        }}
      >
        {/* Background blur orb */}
        <div style={{
          position: "absolute", top: -20, right: -20,
          width: 120, height: 120, borderRadius: "50%",
          background: "rgba(255,255,255,0.1)", filter: "blur(20px)",
        }} />

        {/* Logo */}
        <div className="absolute top-5 left-5">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}>
            <DiscoverLogo item={item} size="lg" />
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-5 right-4 flex flex-col gap-1 items-end">
          {item.is_featured && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.25)", color: "#fff" }}>🔥 HOT</span>
          )}
          {item.is_new && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.25)", color: "#fff" }}>✨ NEW</span>
          )}
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-5" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent)" }}>
          <h3 className="font-bold text-white text-base leading-tight mb-0.5 truncate">{item.title}</h3>
          <p className="text-white/75 text-xs leading-snug line-clamp-2 mb-3">{item.description}</p>
          <div className="flex gap-2" onClick={e => e.stopPropagation()}>
            {user && (
              <div className="rounded-full overflow-hidden">
                <BookmarkButton user={user} itemType="app" itemId={item.id} itemTitle={item.title} itemSubtitle={item.brand_name} itemImageUrl={item.logo_url} compact />
              </div>
            )}
            {item.link && (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-full text-white"
                style={{ backgroundColor: "rgba(255,255,255,0.25)", backdropFilter: "blur(8px)" }}
              >
                Try Tool <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Small Row Card ──────────────────────────────────────────────────────────
function SmallCard({ item, onOpen }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onOpen}
      className="shrink-0 flex flex-col text-left rounded-2xl overflow-hidden"
      style={{ width: 130, backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
    >
      <div className="h-20 flex items-center justify-center relative" style={{ background: getGradient(item.category) }}>
        <div className="w-11 h-11 rounded-xl overflow-hidden bg-white/20 flex items-center justify-center">
          <DiscoverLogo item={item} size="sm" />
        </div>
        {item.is_new && (
          <span className="absolute top-2 right-2 text-[8px] font-bold bg-white/90 text-emerald-700 px-1.5 py-0.5 rounded-full">NEW</span>
        )}
      </div>
      <div className="p-2">
        <p className="text-[11px] font-bold leading-tight truncate" style={{ color: "var(--text-primary)" }}>{item.title}</p>
        {item.pricing && <p className="text-[9px] mt-0.5 truncate" style={{ color: "var(--text-hint)" }}>{item.pricing}</p>}
        {(item.avg_rating || 0) > 0 && (
          <div className="flex items-center gap-0.5 mt-1">
            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
            <span className="text-[9px] font-semibold" style={{ color: "var(--text-secondary)" }}>{item.avg_rating?.toFixed(1)}</span>
          </div>
        )}
      </div>
    </motion.button>
  );
}

// ── Category Row ────────────────────────────────────────────────────────────
function CategoryRow({ label, items, onOpen, onSeeAll }) {
  if (!items.length) return null;
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{label}</h2>
        <button onClick={onSeeAll} className="flex items-center gap-0.5 text-xs font-semibold" style={{ color: "var(--accent-primary)" }}>
          See all <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-1">
        {items.slice(0, 10).map(item => (
          <SmallCard key={item.id} item={item} onOpen={() => onOpen(item)} />
        ))}
      </div>
    </div>
  );
}

// ── Try Something New Card ──────────────────────────────────────────────────
function TryNewCard({ item, onOpen }) {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onOpen}
      className="flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
    >
      <div className="w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden" style={{ background: getGradient(item.category) }}>
        <DiscoverLogo item={item} size="sm" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>{item.title}</p>
        <p className="text-xs line-clamp-1 mt-0.5" style={{ color: "var(--text-secondary)" }}>{item.description}</p>
      </div>
      {item.link && (
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-full text-white"
          style={{ backgroundColor: "var(--accent-primary)" }}
        >
          Try
        </a>
      )}
    </motion.div>
  );
}

// ── Main DiscoverExplorer ───────────────────────────────────────────────────
export default function DiscoverExplorer({ items, isLoading, user, onItemClick, onChipSearch, greeting }) {
  const [surpriseItem, setSurpriseItem] = useState(null);

  const featured = useMemo(() => items.filter(i => i.is_featured || (i.avg_rating || 0) >= 4), [items]);

  const tryNew = useMemo(() => {
    const lesserKnown = items.filter(i => !i.is_featured && (i.avg_rating || 0) < 3.5);
    return lesserKnown.sort(() => Math.random() - 0.5).slice(0, 6);
  }, [items]);

  const handleSurprise = () => {
    if (!items.length) return;
    const pick = items[Math.floor(Math.random() * items.length)];
    setSurpriseItem(pick);
    onItemClick(pick);
  };

  if (isLoading) {
    return (
      <div className="px-4 pt-4 space-y-4">
        <div className="h-8 w-48 rounded-xl animate-pulse" style={{ backgroundColor: "var(--bg-card)" }} />
        <div className="h-[200px] rounded-3xl animate-pulse" style={{ backgroundColor: "var(--bg-card)" }} />
        <div className="flex gap-3">
          {[1,2,3].map(i => <div key={i} className="h-36 w-32 rounded-2xl animate-pulse shrink-0" style={{ backgroundColor: "var(--bg-card)" }} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-28">
      {/* ── Hero featured cards ── */}
      {featured.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 px-4 mb-3">
            <Sparkles className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
            <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Featured for You</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide px-4 pb-2">
            {featured.slice(0, 8).map((item, i) => (
              <HeroCard key={item.id} item={item} user={user} onOpen={() => onItemClick(item)} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* ── Category rows ── */}
      {CATEGORY_ROWS.map(row => {
        const rowItems = items.filter(row.filter);
        return (
          <CategoryRow
            key={row.label}
            label={row.label}
            items={rowItems}
            onOpen={onItemClick}
            onSeeAll={() => onChipSearch(row.label.replace(/^[\S]+ /, "").toLowerCase())}
          />
        );
      })}

      {/* ── Try Something New ── */}
      {tryNew.length > 0 && (
        <div className="px-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">🌟</span>
            <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Try Something New Today</h2>
          </div>
          <div className="space-y-2.5">
            {tryNew.map(item => (
              <TryNewCard key={item.id} item={item} onOpen={() => onItemClick(item)} />
            ))}
          </div>
        </div>
      )}

      {/* ── Surprise Me ── */}
      <div className="px-4 mb-6">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSurprise}
          className="w-full py-4 rounded-3xl flex items-center justify-center gap-3 font-bold text-sm"
          style={{
            background: "linear-gradient(135deg, var(--accent-primary), #4ade80)",
            color: "#fff",
            boxShadow: "0 4px 20px rgba(46,107,79,0.35)",
          }}
        >
          <Shuffle className="w-5 h-5" />
          Surprise Me — Open a Random Tool
        </motion.button>
      </div>
    </div>
  );
}