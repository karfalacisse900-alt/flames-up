import React, { useState, useCallback } from "react";
import { usePullToRefresh } from "../components/hooks/usePullToRefresh";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Search, ExternalLink, SlidersHorizontal, X, Star, Zap, BookOpen, Gamepad2, ShoppingBag, Store, MapPin, Music, Film, ChevronRight, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DiscoverLogo from "../components/discover/DiscoverLogo";
import StarRating from "../components/discover/StarRating";
import DiscoverBillboard from "../components/discover/DiscoverBillboard";
import NewNoteworthy from "../components/discover/NewNoteworthy";
import DiscoverItemModal from "../components/discover/DiscoverItemModal";
import CompareBar from "../components/discover/CompareBar";
import CompareModal from "../components/discover/CompareModal";
import BookmarkButton from "../components/discover/BookmarkButton";
import SmartFilters from "../components/discover/SmartFilters";
import QuickVote from "../components/discover/QuickVote";
import MediaTab from "../components/discover/MediaTab";
import OpenLibraryBooksTab from "../components/discover/OpenLibraryBooksTab";
import GamesTab from "../components/discover/GamesTab";
import SubmitMediaForm from "../components/discover/SubmitMediaForm";
import EbayShopTab from "../components/discover/EbayShopTab";
import ShopifyTab from "../components/discover/ShopifyTab";
import MapboxLocal from "../components/discover/MapboxLocal";

const CATEGORIES = ["all", "productivity", "finance", "learning", "lifestyle", "entertainment", "health", "social", "developer_tools"];

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

const CONTENT_TABS = [
  { id: "apps",    label: "Apps",    icon: Zap,         color: "#667EEA" },
  { id: "media",   label: "Media",   icon: Film,        color: "#FA709A" },
  { id: "books",   label: "Books",   icon: BookOpen,    color: "#F093FB" },
  { id: "games",   label: "Games",   icon: Gamepad2,    color: "#43E97B" },
  { id: "shop",    label: "Shop",    icon: ShoppingBag, color: "#F7971E" },
  { id: "shopify", label: "Brands",  icon: Store,       color: "#30CFD0" },
  { id: "local",   label: "Local",   icon: MapPin,      color: "#11998E" },
];

function AppItem({ item, onOpen, compareMode, isSelected, onToggleCompare, user }) {
  const cc = CAT_COLORS[item.category] || { from: "#2E6B4F", to: "#4CAF7D" };
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      onClick={compareMode ? onToggleCompare : onOpen}
      className="flex items-start gap-3 p-3.5 rounded-2xl cursor-pointer relative overflow-hidden"
      style={{
        backgroundColor: "var(--bg-card)",
        border: isSelected ? `2px solid ${cc.from}` : "1px solid var(--border-light)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}>
      {/* gradient accent strip */}
      <div className="absolute top-0 left-0 right-0 h-0.5 opacity-60" style={{ background: `linear-gradient(90deg, ${cc.from}, ${cc.to})` }} />
      {isSelected && <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: cc.from }}>✓</div>}

      <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0" style={{ background: `linear-gradient(135deg, ${cc.from}22, ${cc.to}22)`, border: `1.5px solid ${cc.from}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <DiscoverLogo item={item} size="md" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1.5 mb-0.5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-sm leading-tight" style={{ color: "var(--text-primary)" }}>{item.title}</h3>
              {item.is_new && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold text-white" style={{ background: `linear-gradient(135deg, ${cc.from}, ${cc.to})` }}>NEW</span>}
              {item.is_sponsored && <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: "#FFF7ED", color: "#C2410C" }}>AD</span>}
            </div>
            {item.brand_name && <p className="text-[11px] mt-0.5" style={{ color: "var(--text-hint)" }}>{item.brand_name}</p>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {user && <BookmarkButton user={user} itemType="app" itemId={item.id} itemTitle={item.title} itemSubtitle={item.brand_name} itemImageUrl={item.logo_url} />}
            {item.link && (
              <a href={item.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                className="w-7 h-7 rounded-xl flex items-center justify-center text-white shrink-0"
                style={{ background: `linear-gradient(135deg, ${cc.from}, ${cc.to})` }}>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
        <p className="text-xs leading-relaxed line-clamp-2 mb-2" style={{ color: "var(--text-secondary)" }}>{item.description}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `linear-gradient(135deg, ${cc.from}20, ${cc.to}20)`, color: cc.from }}>
            {item.category?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
          </span>
          {item.pricing && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>{item.pricing}</span>}
          {item.promo && <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>🎁 {item.promo}</span>}
          <StarRating value={item.avg_rating || 0} showCount count={item.review_count || 0} />
        </div>
        <QuickVote item={item} />
      </div>
    </motion.div>
  );
}

export default function Discover() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [sortBy, setSortBy] = useState("default");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [filterPricing, setFilterPricing] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [user, setUser] = useState(null);
  const [compareList, setCompareList] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [contentTab, setContentTab] = useState("apps");
  const [smartFilter, setSmartFilter] = useState("all");
  const [showSubmitForm, setShowSubmitForm] = useState(false);

  React.useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: items = [], isLoading, refetch: refetchItems } = useQuery({
    queryKey: ["discover"],
    queryFn: () => base44.entities.DiscoverItem.list("-created_date", 500),
  });

  const { containerRef, PullIndicator, handleTouchStart, handleTouchMove, handleTouchEnd } = usePullToRefresh(
    useCallback(async () => { await refetchItems(); }, [refetchItems])
  );

  const newItems = items.filter(i => i.is_new).slice(0, 10);

  const applySmartFilter = (item) => {
    switch (smartFilter) {
      case "trending": return item.is_boosted || (item.avg_rating >= 4);
      case "community_favorite": return (item.review_count || 0) >= 3;
      case "underrated": return (item.avg_rating || 0) < 3.5 && (item.review_count || 0) >= 1;
      case "just_launched": return !!item.is_new;
      case "highly_debated": return (item.review_count || 0) >= 5;
      case "low_cost": return item.pricing === "Free" || item.pricing === "Freemium";
      case "no_subscription": return item.pricing === "Free" || (item.pricing && !item.pricing.includes("/"));
      case "hidden_gems": return !item.is_featured && !item.is_sponsored && (item.avg_rating || 0) >= 3.5;
      default: return true;
    }
  };

  const filtered = items.filter(item => {
    const catMatch = activeCategory === "all" || item.category === activeCategory;
    const searchMatch = !search ||
      item.title?.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase()) ||
      item.brand_name?.toLowerCase().includes(search.toLowerCase()) ||
      item.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const platformMatch = filterPlatform === "all" || item.platforms?.includes(filterPlatform);
    const pricingMatch = filterPricing === "all" ||
      (filterPricing === "Paid" ? (item.pricing && !["Free","Freemium"].includes(item.pricing)) : item.pricing === filterPricing);
    return catMatch && searchMatch && platformMatch && pricingMatch && applySmartFilter(item);
  }).sort((a, b) => {
    if (sortBy === "rating") return (b.avg_rating || 0) - (a.avg_rating || 0);
    if (sortBy === "newest") return (b.is_new ? 1 : 0) - (a.is_new ? 1 : 0);
    return 0;
  });

  const activeFiltersCount = [filterPlatform !== "all", filterPricing !== "all", sortBy !== "default"].filter(Boolean).length;
  const showSections = activeCategory === "all" && !search;
  const activeTabMeta = CONTENT_TABS.find(t => t.id === contentTab);

  return (
    <div
      ref={containerRef}
      className="overflow-y-auto"
      style={{ backgroundColor: "var(--bg-app)", minHeight: "100%" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <PullIndicator />

      {/* ── Header ── */}
      <div className="px-4 pt-5 pb-4" style={{ backgroundColor: "var(--bg-app)" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Discover</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>Apps · Media · Books · Games & more</p>
          </div>
          {contentTab === "apps" && (
            <button onClick={() => { setCompareMode(m => !m); setCompareList([]); }}
              className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
              style={{
                backgroundColor: compareMode ? "var(--accent-primary)" : "var(--bg-card)",
                color: compareMode ? "#fff" : "var(--text-secondary)",
                borderColor: compareMode ? "var(--accent-primary)" : "var(--border-light)",
              }}>
              ⚖️ Compare
            </button>
          )}
        </div>

        {/* Tab strip with colored icons */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
          {CONTENT_TABS.map(t => {
            const Icon = t.icon;
            const isActive = contentTab === t.id;
            return (
              <motion.button
                key={t.id}
                onClick={() => setContentTab(t.id)}
                whileTap={{ scale: 0.93 }}
                className="flex flex-col items-center gap-1 px-3.5 py-2.5 rounded-2xl shrink-0 transition-all"
                style={{
                  backgroundColor: isActive ? t.color : "var(--bg-card)",
                  border: `1.5px solid ${isActive ? t.color : "var(--border-light)"}`,
                  boxShadow: isActive ? `0 4px 16px ${t.color}40` : "none",
                  minWidth: 62,
                }}>
                <Icon className="w-4 h-4" style={{ color: isActive ? "#fff" : t.color }} />
                <span className="text-[11px] font-semibold" style={{ color: isActive ? "#fff" : "var(--text-secondary)" }}>{t.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── APPS TAB ── */}
      {contentTab === "apps" && (
        <>
          <SmartFilters active={smartFilter} onChange={f => { setSmartFilter(f); setActiveCategory("all"); }} />

          <div className="px-4 pt-1 pb-2 space-y-2">
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-hint)" }} />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search apps, tools, services…"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
                />
                {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-3.5 h-3.5" style={{ color: "var(--text-hint)" }} /></button>}
              </div>
              <button onClick={() => setShowFilters(f => !f)}
                className="relative flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all"
                style={{ backgroundColor: showFilters ? "var(--accent-primary)" : "var(--bg-card)", borderColor: showFilters ? "var(--accent-primary)" : "var(--border-light)", color: showFilters ? "#fff" : "var(--text-secondary)" }}>
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white" style={{ backgroundColor: "var(--accent-secondary)" }}>{activeFiltersCount}</span>
                )}
              </button>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="p-3 rounded-2xl space-y-3" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                    {[
                      { label: "Sort", items: [["default","Default"],["rating","Top Rated"],["newest","Newest"]], val: sortBy, set: setSortBy },
                      { label: "Platform", items: [["all","All"],["Web","Web"],["iOS","iOS"],["Android","Android"]], val: filterPlatform, set: setFilterPlatform },
                      { label: "Pricing", items: [["all","All"],["Free","Free"],["Freemium","Freemium"],["Paid","Paid"]], val: filterPricing, set: setFilterPricing },
                    ].map(group => (
                      <div key={group.label}>
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-hint)" }}>{group.label}</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {group.items.map(([v, l]) => (
                            <button key={v} onClick={() => group.set(v)}
                              className="text-xs px-3 py-1 rounded-full border transition-all"
                              style={{ backgroundColor: group.val === v ? "var(--accent-primary)" : "var(--bg-subtle)", color: group.val === v ? "#fff" : "var(--text-secondary)", borderColor: group.val === v ? "var(--accent-primary)" : "var(--border-light)" }}>
                              {l}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    {activeFiltersCount > 0 && (
                      <button onClick={() => { setSortBy("default"); setFilterPlatform("all"); setFilterPricing("all"); }}
                        className="text-xs font-semibold flex items-center gap-1" style={{ color: "var(--accent-secondary)" }}>
                        <X className="w-3 h-3" /> Reset
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Category chips */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className="px-3 py-1 text-xs rounded-full border whitespace-nowrap shrink-0 transition-all font-medium"
                  style={{ backgroundColor: activeCategory === cat ? "var(--text-primary)" : "var(--bg-card)", color: activeCategory === cat ? "var(--bg-app)" : "var(--text-secondary)", borderColor: activeCategory === cat ? "var(--text-primary)" : "var(--border-light)", fontWeight: activeCategory === cat ? 700 : 500 }}>
                  {cat === "all" ? "All" : cat.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
            </div>
          ) : (
            <div className="pb-24">
              {showSections && <DiscoverBillboard items={items} user={user} onItemClick={setSelectedItem} />}
              {showSections && newItems.length > 0 && <NewNoteworthy items={newItems} onItemClick={setSelectedItem} />}
              {showSections && (
                <div className="px-4 flex items-center gap-2 mb-3 mt-2">
                  <TrendingUp className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
                  <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                    {activeCategory === "all" ? "All Tools & Services" : activeCategory.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                  </h2>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)", border: "1px solid var(--border-light)" }}>{filtered.length}</span>
                </div>
              )}
              {filtered.length === 0 ? (
                <div className="text-center py-16 px-5">
                  <p className="text-4xl mb-3">🔍</p>
                  <p className="text-sm" style={{ color: "var(--text-hint)" }}>No items found</p>
                </div>
              ) : (
                <div className="px-4 space-y-2.5">
                  {filtered.map(item => (
                    <AppItem key={item.id} item={item} user={user}
                      onOpen={() => setSelectedItem(item)}
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
            </div>
          )}

          {compareMode && (
            <CompareBar selected={compareList}
              onRemove={id => setCompareList(prev => prev.filter(c => c.id !== id))}
              onCompare={() => setShowCompare(true)}
              onClear={() => setCompareList([])} />
          )}
          {showCompare && compareList.length >= 2 && (
            <CompareModal items={compareList} onClose={() => setShowCompare(false)} />
          )}
        </>
      )}

      {/* ── Other tabs with consistent header ── */}
      {contentTab !== "apps" && (
        <div className="px-4 pb-1">
          <div className="flex items-center gap-2.5 py-2 px-3.5 rounded-2xl mb-1"
            style={{ backgroundColor: `${activeTabMeta?.color}15`, border: `1px solid ${activeTabMeta?.color}30` }}>
            {activeTabMeta && React.createElement(activeTabMeta.icon, { className: "w-4 h-4", style: { color: activeTabMeta.color } })}
            <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{activeTabMeta?.label}</span>
            {contentTab === "games" && (
              <button onClick={() => setShowSubmitForm(true)} className="ml-auto px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: activeTabMeta?.color }}>+ Submit</button>
            )}
          </div>
        </div>
      )}

      {contentTab === "media"   && <div className="mt-1"><MediaTab user={user} /></div>}
      {contentTab === "books"   && <div className="mt-1"><OpenLibraryBooksTab /></div>}
      {contentTab === "games"   && <div className="pb-24 mt-1"><GamesTab /></div>}
      {contentTab === "shop"    && <div className="mt-1"><EbayShopTab /></div>}
      {contentTab === "shopify" && <div className="mt-1"><ShopifyTab /></div>}
      {contentTab === "local"   && <div className="mt-1"><MapboxLocal /></div>}

      {selectedItem && !compareMode && (
        <DiscoverItemModal item={selectedItem} user={user} allItems={items}
          onClose={() => setSelectedItem(null)}
          onOpenRelated={rel => setSelectedItem(rel)} />
      )}
      <AnimatePresence>
        {showSubmitForm && (
          <SubmitMediaForm onClose={() => setShowSubmitForm(false)} onSuccess={() => setShowSubmitForm(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}