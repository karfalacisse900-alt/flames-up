import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SlidersHorizontal, ExternalLink, X, Star, Zap, TrendingUp,
  Gift, Layers, ChevronRight, Search, Sparkles, Clock
} from "lucide-react";
import DiscoverLogo from "./DiscoverLogo";
import StarRating from "./StarRating";
import BookmarkButton from "./BookmarkButton";
import DiscoverBillboard from "./DiscoverBillboard";
import CompareBar from "./CompareBar";
import CompareModal from "./CompareModal";

const CATEGORIES = [
  { id: "all",             label: "All",           emoji: "✨" },
  { id: "productivity",    label: "Productivity",  emoji: "⚡" },
  { id: "finance",         label: "Finance",       emoji: "💰" },
  { id: "learning",        label: "Learning",      emoji: "📚" },
  { id: "lifestyle",       label: "Lifestyle",     emoji: "🌿" },
  { id: "entertainment",   label: "Entertainment", emoji: "🎬" },
  { id: "health",          label: "Health",        emoji: "💪" },
  { id: "social",          label: "Social",        emoji: "👥" },
  { id: "developer_tools", label: "Dev Tools",     emoji: "🛠️" },
];

const CAT_COLORS = {
  productivity:    { from: "#667EEA", to: "#764BA2" },
  finance:         { from: "#11998E", to: "#38EF7D" },
  learning:        { from: "#F093FB", to: "#F5576C" },
  lifestyle:       { from: "#4FACFE", to: "#00F2FE" },
  entertainment:   { from: "#FA709A", to: "#FEE140" },
  health:          { from: "#43E97B", to: "#38F9D7" },
  social:          { from: "#F7971E", to: "#FFD200" },
  developer_tools: { from: "#30CFD0", to: "#330867" },
};

const SMART_FILTERS = [
  { id: "all",               label: "All",           icon: Sparkles },
  { id: "trending",          label: "Trending",      icon: TrendingUp },
  { id: "free",              label: "Free",          icon: Gift },
  { id: "top_rated",         label: "Top Rated",     icon: Star },
  { id: "new",               label: "New",           icon: Clock },
];

// ── Featured Hero Card ────────────────────────────────────────────────────────
function HeroCard({ item, onOpen, user }) {
  const cc = CAT_COLORS[item.category] || { from: "#2E6B4F", to: "#4CAF7D" };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onOpen}
      className="relative rounded-3xl overflow-hidden cursor-pointer mx-4 mb-4"
      style={{
        background: `linear-gradient(135deg, ${cc.from}, ${cc.to})`,
        minHeight: 160,
        boxShadow: `0 8px 32px ${cc.from}55`,
      }}
    >
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: "radial-gradient(circle at 70% 30%, rgba(255,255,255,0.6) 0%, transparent 60%)" }} />

      <div className="relative p-5 flex items-end h-full gap-4">
        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shrink-0">
          <DiscoverLogo item={item} size="lg" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Featured</span>
            {item.is_new && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/25 text-white font-bold">NEW</span>}
          </div>
          <h3 className="text-lg font-bold text-white leading-tight">{item.title}</h3>
          <p className="text-xs text-white/75 mt-0.5 line-clamp-2">{item.description}</p>
          <div className="flex items-center gap-2 mt-2">
            {item.pricing && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-semibold">{item.pricing}</span>
            )}
            {(item.avg_rating || 0) > 0 && (
              <span className="text-[10px] text-white/80 flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-white text-white" />{item.avg_rating?.toFixed(1)}
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 self-center" onClick={e => e.stopPropagation()}>
          {user && <BookmarkButton user={user} itemType="app" itemId={item.id} itemTitle={item.title} itemSubtitle={item.brand_name} itemImageUrl={item.logo_url} />}
        </div>
      </div>

      {/* Tap chevron hint */}
      <div className="absolute bottom-4 right-4">
        <ChevronRight className="w-5 h-5 text-white/50" />
      </div>
    </motion.div>
  );
}

// ── Compact App Row ────────────────────────────────────────────────────────────
function AppRow({ item, onOpen, compareMode, isSelected, onToggleCompare, user, index }) {
  const cc = CAT_COLORS[item.category] || { from: "#2E6B4F", to: "#4CAF7D" };
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={compareMode ? onToggleCompare : onOpen}
      className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all active:scale-[0.99] relative"
      style={{
        borderBottom: "1px solid var(--border-subtle)",
        backgroundColor: isSelected ? `${cc.from}08` : "transparent",
      }}
    >
      {/* Rank or checkmark */}
      <div className="w-6 text-center shrink-0">
        {isSelected
          ? <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold mx-auto" style={{ backgroundColor: cc.from }}>✓</div>
          : <span className="text-[10px] font-bold" style={{ color: "var(--text-hint)" }}>{index + 1}</span>
        }
      </div>

      {/* Logo */}
      <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 border border-white/10"
        style={{ background: `linear-gradient(135deg, ${cc.from}, ${cc.to})`, padding: 2 }}>
        <div className="w-full h-full rounded-[10px] overflow-hidden bg-white flex items-center justify-center">
          <DiscoverLogo item={item} size="sm" />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>{item.title}</span>
          {item.is_new && <span className="text-[8px] px-1 py-0.5 rounded font-bold text-white shrink-0" style={{ background: `linear-gradient(135deg, ${cc.from}, ${cc.to})` }}>NEW</span>}
          {item.is_sponsored && <span className="text-[8px] px-1 py-0.5 rounded font-bold shrink-0" style={{ backgroundColor: "#FFF7ED", color: "#C2410C" }}>AD</span>}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="text-[10px]" style={{ color: "var(--text-hint)" }}>{item.brand_name || item.category?.replace(/_/g, " ")}</span>
          {item.pricing && <span className="text-[10px] px-1.5 py-px rounded-full" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>{item.pricing}</span>}
          {item.promo && <span className="text-[9px] px-1.5 py-px rounded-full" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>🎁 {item.promo}</span>}
        </div>
        {(item.avg_rating || 0) > 0 && (
          <StarRating value={item.avg_rating || 0} showCount count={item.review_count || 0} />
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
        {user && <BookmarkButton user={user} itemType="app" itemId={item.id} itemTitle={item.title} itemSubtitle={item.brand_name} itemImageUrl={item.logo_url} />}
        {item.link && (
          <a href={item.link} target="_blank" rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${cc.from}, ${cc.to})` }}>
            Get
          </a>
        )}
      </div>
    </motion.div>
  );
}

// ── Category Section Header ────────────────────────────────────────────────────
function SectionHeader({ category, count }) {
  const cat = CATEGORIES.find(c => c.id === category);
  const cc = CAT_COLORS[category] || { from: "#2E6B4F", to: "#4CAF7D" };
  if (!cat || category === "all") return null;
  return (
    <div className="flex items-center gap-2.5 px-4 py-3 mt-1" style={{ borderBottom: "1px solid var(--border-light)" }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
        style={{ background: `linear-gradient(135deg, ${cc.from}22, ${cc.to}22)` }}>
        {cat.emoji}
      </div>
      <div>
        <p className="text-sm font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{cat.label}</p>
        <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>{count} apps</p>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function DiscoverAppsTab({ items, isLoading, search, user, onItemClick }) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [smartFilter, setSmartFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [filterPricing, setFilterPricing] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [compareList, setCompareList] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const [compareMode, setCompareMode] = useState(false);

  const applySmartFilter = (item) => {
    switch (smartFilter) {
      case "trending": return item.is_boosted || (item.avg_rating >= 4);
      case "free": return item.pricing === "Free" || item.pricing === "Freemium";
      case "top_rated": return (item.avg_rating || 0) >= 4;
      case "new": return !!item.is_new;
      default: return true;
    }
  };

  const filtered = useMemo(() => items.filter(item => {
    const catMatch = activeCategory === "all" || item.category === activeCategory;
    const searchMatch = !search ||
      item.title?.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase()) ||
      item.brand_name?.toLowerCase().includes(search.toLowerCase()) ||
      item.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const pricingMatch = filterPricing === "all" ||
      (filterPricing === "Paid" ? (item.pricing && !["Free", "Freemium"].includes(item.pricing)) : item.pricing === filterPricing);
    return catMatch && searchMatch && pricingMatch && applySmartFilter(item);
  }).sort((a, b) => {
    if (sortBy === "rating") return (b.avg_rating || 0) - (a.avg_rating || 0);
    if (sortBy === "newest") return (b.is_new ? 1 : 0) - (a.is_new ? 1 : 0);
    if (sortBy === "reviews") return (b.review_count || 0) - (a.review_count || 0);
    // Default: featured first
    if (b.is_featured !== a.is_featured) return b.is_featured ? 1 : -1;
    return (b.avg_rating || 0) - (a.avg_rating || 0);
  }), [items, activeCategory, search, filterPricing, smartFilter, sortBy]);

  const featuredItem = useMemo(() => items.find(i => i.is_featured), [items]);
  const showHero = activeCategory === "all" && !search && smartFilter === "all" && !!featuredItem;
  const activeFiltersCount = [filterPricing !== "all", sortBy !== "default"].filter(Boolean).length;

  if (isLoading) {
    return (
      <div className="space-y-3 px-4 pt-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex gap-3 items-center">
            <div className="skeleton w-12 h-12 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3 w-1/2 rounded" />
              <div className="skeleton h-2 w-3/4 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Smart filter pills */}
      <div className="flex gap-2 px-4 pt-3 pb-2 overflow-x-auto scrollbar-hide">
        {SMART_FILTERS.map(sf => {
          const Icon = sf.icon;
          const isActive = smartFilter === sf.id;
          return (
            <button key={sf.id} onClick={() => { setSmartFilter(sf.id); setActiveCategory("all"); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all border"
              style={{
                backgroundColor: isActive ? "var(--text-primary)" : "var(--bg-card)",
                color: isActive ? "var(--bg-app)" : "var(--text-secondary)",
                borderColor: isActive ? "var(--text-primary)" : "var(--border-light)",
              }}>
              <Icon className="w-3 h-3" />
              {sf.label}
            </button>
          );
        })}
      </div>

      {/* Category chips */}
      <div className="flex gap-1.5 px-4 pb-2 overflow-x-auto scrollbar-hide">
        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat.id;
          return (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 transition-all border"
              style={{
                backgroundColor: isActive ? "var(--accent-primary)" : "transparent",
                color: isActive ? "#fff" : "var(--text-secondary)",
                borderColor: isActive ? "var(--accent-primary)" : "var(--border-light)",
              }}>
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Toolbar: filters + compare */}
      <div className="flex items-center gap-2 px-4 pb-3">
        <button
          onClick={() => { setCompareMode(m => !m); setCompareList([]); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
          style={{ backgroundColor: compareMode ? "var(--accent-primary)" : "var(--bg-card)", color: compareMode ? "#fff" : "var(--text-secondary)", borderColor: compareMode ? "var(--accent-primary)" : "var(--border-light)" }}>
          <Layers className="w-3 h-3" /> Compare
        </button>
        <div className="flex-1" />
        {/* Sort quick buttons */}
        {[["default","Best"],["rating","Rating"],["newest","New"],["reviews","Popular"]].map(([v, l]) => (
          <button key={v} onClick={() => setSortBy(v)}
            className="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all border"
            style={{ backgroundColor: sortBy === v ? "var(--text-primary)" : "var(--bg-card)", color: sortBy === v ? "var(--bg-app)" : "var(--text-secondary)", borderColor: sortBy === v ? "var(--text-primary)" : "var(--border-light)" }}>
            {l}
          </button>
        ))}
        <button
          onClick={() => setShowFilters(f => !f)}
          className="relative w-8 h-8 rounded-full flex items-center justify-center border transition-all"
          style={{ backgroundColor: showFilters || activeFiltersCount > 0 ? "var(--accent-primary)" : "var(--bg-card)", borderColor: showFilters || activeFiltersCount > 0 ? "var(--accent-primary)" : "var(--border-light)", color: showFilters || activeFiltersCount > 0 ? "#fff" : "var(--text-secondary)" }}>
          <SlidersHorizontal className="w-3.5 h-3.5" />
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-[8px] font-bold flex items-center justify-center text-white" style={{ backgroundColor: "var(--accent-secondary)" }}>{activeFiltersCount}</span>
          )}
        </button>
      </div>

      {/* Advanced filters panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden px-4 mb-3">
            <div className="p-3 rounded-2xl space-y-3" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-hint)" }}>Pricing</p>
                <div className="flex gap-1.5 flex-wrap">
                  {[["all","All"],["Free","Free"],["Freemium","Freemium"],["Paid","Paid"]].map(([v, l]) => (
                    <button key={v} onClick={() => setFilterPricing(v)}
                      className="text-xs px-3 py-1 rounded-full border transition-all"
                      style={{ backgroundColor: filterPricing === v ? "var(--accent-primary)" : "var(--bg-subtle)", color: filterPricing === v ? "#fff" : "var(--text-secondary)", borderColor: filterPricing === v ? "var(--accent-primary)" : "var(--border-light)" }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              {activeFiltersCount > 0 && (
                <button onClick={() => { setFilterPricing("all"); setSortBy("default"); }}
                  className="text-xs font-semibold flex items-center gap-1" style={{ color: "var(--accent-secondary)" }}>
                  <X className="w-3 h-3" /> Reset filters
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Featured Hero */}
      {showHero && <HeroCard item={featuredItem} onOpen={() => onItemClick(featuredItem)} user={user} />}

      {/* Billboard for non-search/filter state */}
      {activeCategory === "all" && !search && smartFilter === "all" && (
        <DiscoverBillboard items={items} user={user} onItemClick={onItemClick} />
      )}

      {/* Section header when category selected */}
      <SectionHeader category={activeCategory} count={filtered.length} />

      {/* Results header */}
      {(search || smartFilter !== "all" || activeCategory !== "all") && (
        <div className="flex items-center justify-between px-4 py-2">
          <p className="text-xs font-semibold" style={{ color: "var(--text-hint)" }}>
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* App list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 px-5">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-sm" style={{ color: "var(--text-hint)" }}>No apps found</p>
        </div>
      ) : (
        <div style={{ backgroundColor: "var(--bg-card)", borderRadius: 20, margin: "0 16px 16px", overflow: "hidden", border: "1px solid var(--border-light)" }}>
          {filtered.map((item, i) => (
            <AppRow
              key={item.id}
              item={item}
              user={user}
              index={i}
              onOpen={() => onItemClick(item)}
              compareMode={compareMode}
              isSelected={compareList.some(c => c.id === item.id)}
              onToggleCompare={() => {
                const already = compareList.some(c => c.id === item.id);
                if (already) setCompareList(prev => prev.filter(c => c.id !== item.id));
                else if (compareList.length < 3) setCompareList(prev => [...prev, item]);
              }}
            />
          ))}
        </div>
      )}

      {compareMode && (
        <CompareBar
          selected={compareList}
          onRemove={id => setCompareList(prev => prev.filter(c => c.id !== id))}
          onCompare={() => setShowCompare(true)}
          onClear={() => setCompareList([])}
        />
      )}
      {showCompare && compareList.length >= 2 && (
        <CompareModal items={compareList} onClose={() => setShowCompare(false)} />
      )}
    </>
  );
}