import React, { useState, useCallback } from "react";
import { usePullToRefresh } from "../components/hooks/usePullToRefresh";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Search, ExternalLink, SlidersHorizontal, X, Sparkles, ArrowUpDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DiscoverLogo from "../components/discover/DiscoverLogo";
import StarRating from "../components/discover/StarRating";
import DiscoverBillboard from "../components/discover/DiscoverBillboard";
import NewNoteworthy from "../components/discover/NewNoteworthy";
import DiscoverItemModal from "../components/discover/DiscoverItemModal";
import CompareBar from "../components/discover/CompareBar";
import CompareModal from "../components/discover/CompareModal";
import ServicePersonModal from "../components/discover/ServicePersonModal";
import BookmarkButton from "../components/discover/BookmarkButton";
import LocalServices from "../components/discover/LocalServices";
import WhyTheseApps from "../components/discover/WhyTheseApps";
import SmartFilters from "../components/discover/SmartFilters";
import QuickVote from "../components/discover/QuickVote";
import MediaTab from "../components/discover/MediaTab";
import OpenLibraryBooksTab from "../components/discover/OpenLibraryBooksTab";
import StoresAndDeals from "../components/discover/StoresAndDeals";
import GamesTab from "../components/discover/GamesTab";
import SubmitMediaForm from "../components/discover/SubmitMediaForm";

const CAT_META = {
  all:            { label: "All",         emoji: "✨", from: "#667EEA", to: "#764BA2" },
  productivity:   { label: "Productive",  emoji: "⚡", from: "#667EEA", to: "#764BA2" },
  finance:        { label: "Finance",     emoji: "💰", from: "#11998E", to: "#38EF7D" },
  learning:       { label: "Learning",    emoji: "📚", from: "#F093FB", to: "#F5576C" },
  lifestyle:      { label: "Lifestyle",   emoji: "✨", from: "#4FACFE", to: "#00F2FE" },
  entertainment:  { label: "Fun",         emoji: "🎬", from: "#FA709A", to: "#FEE140" },
  health:         { label: "Health",      emoji: "💪", from: "#43E97B", to: "#38F9D7" },
  social:         { label: "Social",      emoji: "💬", from: "#F7971E", to: "#FFD200" },
  developer_tools:{ label: "Dev Tools",   emoji: "🛠",  from: "#30CFD0", to: "#667EEA" },
};

const TABS = [
  { key: "apps",   label: "Apps",   emoji: "🛠",  from: "#667EEA", to: "#764BA2" },
  { key: "media",  label: "Media",  emoji: "🎬",  from: "#FA709A", to: "#FEE140" },
  { key: "books",  label: "Books",  emoji: "📚",  from: "#F093FB", to: "#F5576C" },
  { key: "games",  label: "Games",  emoji: "🎮",  from: "#43E97B", to: "#38F9D7" },
  { key: "stores", label: "Stores", emoji: "🛍",  from: "#F7971E", to: "#FFD200" },
  { key: "local",  label: "Local",  emoji: "📍",  from: "#4FACFE", to: "#00F2FE" },
];

function DiscoverListItem({ item, onOpen, compareMode, isSelected, onToggleCompare, user }) {
  const cc = CAT_META[item.category] || CAT_META.all;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={compareMode ? onToggleCompare : onOpen}
      className="cursor-pointer active:scale-[0.98] transition-all"
      style={{
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: "14px 14px",
        marginBottom: 10,
        border: isSelected ? `2px solid ${cc.from}` : "1.5px solid #F0F4F8",
        boxShadow: isSelected ? `0 0 0 3px ${cc.from}20` : "0 2px 12px rgba(0,0,0,0.05)",
      }}>
      <div className="flex items-start gap-3">
        {/* Logo with gradient ring */}
        <div className="shrink-0 relative">
          <div className="w-[54px] h-[54px] rounded-[14px] p-[2px]" style={{ background: `linear-gradient(135deg, ${cc.from}, ${cc.to})` }}>
            <div className="w-full h-full rounded-[12px] bg-white overflow-hidden flex items-center justify-center">
              <DiscoverLogo item={item} size="md" />
            </div>
          </div>
          {item.is_new && (
            <span className="absolute -top-1.5 -right-1.5 text-[8px] font-black px-1 py-0.5 rounded-full text-white leading-none" style={{ background: `linear-gradient(135deg, ${cc.from}, ${cc.to})` }}>NEW</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm leading-tight truncate" style={{ color: "#1A202C" }}>{item.title}</h3>
                {item.is_sponsored && <span className="text-[9px] px-1 py-0.5 rounded font-bold shrink-0" style={{ backgroundColor: "#FFF7ED", color: "#C2410C" }}>AD</span>}
              </div>
              {item.brand_name && <p className="text-[11px] mt-0.5 truncate" style={{ color: "#A0AEC0" }}>{item.brand_name}</p>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {user && (
                <BookmarkButton user={user} itemType="app" itemId={item.id}
                  itemTitle={item.title} itemSubtitle={item.brand_name} itemImageUrl={item.logo_url} />
              )}
              {item.link && (
                <a href={item.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm"
                  style={{ background: `linear-gradient(135deg, ${cc.from}, ${cc.to})` }}>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          <p className="text-[12px] mt-1.5 line-clamp-2 leading-relaxed" style={{ color: "#64748B" }}>{item.description}</p>

          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: `linear-gradient(135deg, ${cc.from}20, ${cc.to}20)`, color: cc.from }}>
              {cc.emoji} {cc.label}
            </span>
            {item.pricing && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: "#F8FAFC", color: "#64748B", border: "1px solid #E8EDF2" }}>
                {item.pricing}
              </span>
            )}
            {item.promo && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: "#ECFDF5", color: "#059669" }}>
                🎁 {item.promo}
              </span>
            )}
            <StarRating value={item.avg_rating || 0} showCount count={item.review_count || 0} />
          </div>
          <QuickVote item={item} />
        </div>
      </div>
    </motion.div>
  );
}

export default function Discover() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedServicePerson, setSelectedServicePerson] = useState(null);
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

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: items = [], isLoading, refetch: refetchItems } = useQuery({
    queryKey: ["discover"],
    queryFn: () => base44.entities.DiscoverItem.list("-created_date", 500),
  });

  const { data: servicePeople = [], isLoading: spLoading, refetch: refetchPeople } = useQuery({
    queryKey: ["servicepeople"],
    queryFn: () => base44.entities.ServicePerson.list("-created_date", 200),
  });

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetchItems(), refetchPeople()]);
  }, [refetchItems, refetchPeople]);

  const { containerRef, PullIndicator, handleTouchStart, handleTouchMove, handleTouchEnd } = usePullToRefresh(handleRefresh);

  const newItems = items.filter(i => i.is_new).slice(0, 10);
  const pricingOptions = ["all", "Free", "Freemium", "Paid"];
  const platformOptions = ["all", "Web", "iOS", "Android", "Desktop"];

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
  const showSections = activeCategory === "all" && !search && smartFilter === "all";
  const activeTab = TABS.find(t => t.key === contentTab) || TABS[0];

  return (
    <div
      ref={containerRef}
      className="overflow-y-auto overscroll-contain"
      style={{ backgroundColor: "#F6F8FC", minHeight: "100%" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <PullIndicator />

      {/* ── HERO HEADER ── */}
      <div className="relative overflow-hidden px-4 pt-5 pb-4"
        style={{ background: `linear-gradient(135deg, ${activeTab.from}, ${activeTab.to})` }}>
        {/* decorative blobs */}
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-20" style={{ background: "radial-gradient(circle, white, transparent)" }} />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-15" style={{ background: "radial-gradient(circle, white, transparent)" }} />

        {/* Title row */}
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">{activeTab.emoji} {activeTab.label}</p>
            <h1 className="text-2xl font-bold text-white mt-0.5" style={{ fontFamily: "var(--font-serif)" }}>Discover</h1>
          </div>
          {contentTab === "apps" && (
            <button onClick={() => { setCompareMode(m => !m); setCompareList([]); }}
              className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{ backgroundColor: compareMode ? "#fff" : "rgba(255,255,255,0.25)", color: compareMode ? activeTab.from : "#fff" }}>
              {compareMode ? "✕ Compare" : "⇄ Compare"}
            </button>
          )}
        </div>

        {/* Tab pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 relative z-10">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setContentTab(tab.key)}
              className="flex items-center gap-1 px-3 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shrink-0"
              style={{
                backgroundColor: contentTab === tab.key ? "#fff" : "rgba(255,255,255,0.18)",
                color: contentTab === tab.key ? tab.from : "rgba(255,255,255,0.85)",
                boxShadow: contentTab === tab.key ? "0 2px 12px rgba(0,0,0,0.12)" : "none",
              }}>
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ===== APPS TAB ===== */}
      {contentTab === "apps" && (
        <>
          {/* Smart filters row */}
          <div className="pt-3">
            <WhyTheseApps />
            <SmartFilters active={smartFilter} onChange={f => { setSmartFilter(f); setActiveCategory("all"); }} />
          </div>

          {/* Search + Filter row */}
          <div className="px-4 pb-2 space-y-2.5">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#A0AEC0" }} />
                <input
                  placeholder="Search apps, tools, services..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-2xl text-sm outline-none"
                  style={{ backgroundColor: "#fff", border: "1.5px solid #E8EDF2", color: "#1A202C", fontSize: "16px" }}
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="w-3.5 h-3.5" style={{ color: "#A0AEC0" }} />
                  </button>
                )}
              </div>
              <button onClick={() => setShowFilters(f => !f)}
                className="relative flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all"
                style={{
                  background: showFilters ? `linear-gradient(135deg, ${activeTab.from}, ${activeTab.to})` : "#fff",
                  color: showFilters ? "#fff" : "#64748B",
                  border: showFilters ? "none" : "1.5px solid #E8EDF2",
                }}>
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center bg-orange-500 text-white">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>

            {/* Filter panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="rounded-2xl p-4 space-y-3"
                  style={{ backgroundColor: "#fff", border: "1.5px solid #E8EDF2", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
                  {[
                    { label: "Sort", options: [["default","Default"],["rating","⭐ Top Rated"],["newest","🆕 Newest"]], value: sortBy, onChange: setSortBy },
                    { label: "Platform", options: platformOptions.map(p => [p, p === "all" ? "All" : p]), value: filterPlatform, onChange: setFilterPlatform },
                    { label: "Pricing", options: pricingOptions.map(p => [p, p === "all" ? "All" : p]), value: filterPricing, onChange: setFilterPricing },
                  ].map(group => (
                    <div key={group.label}>
                      <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "#94A3B8" }}>{group.label}</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {group.options.map(([val, label]) => (
                          <button key={val} onClick={() => group.onChange(val)}
                            className="text-xs px-3 py-1 rounded-full font-semibold transition-all"
                            style={{
                              background: group.value === val ? `linear-gradient(135deg, ${activeTab.from}, ${activeTab.to})` : "#F6F8FC",
                              color: group.value === val ? "#fff" : "#64748B",
                              border: group.value === val ? "none" : "1px solid #E8EDF2",
                            }}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {activeFiltersCount > 0 && (
                    <button onClick={() => { setSortBy("default"); setFilterPlatform("all"); setFilterPricing("all"); }}
                      className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#EF4444" }}>
                      <X className="w-3 h-3" /> Reset all
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Category chips */}
          <div className="px-4 mb-3 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 w-max pb-1">
              {Object.entries(CAT_META).map(([key, meta]) => (
                <button key={key} onClick={() => setActiveCategory(key)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all"
                  style={{
                    background: activeCategory === key ? `linear-gradient(135deg, ${meta.from}, ${meta.to})` : "#fff",
                    color: activeCategory === key ? "#fff" : "#64748B",
                    border: activeCategory === key ? "none" : `1.5px solid ${meta.from}30`,
                    boxShadow: activeCategory === key ? `0 2px 10px ${meta.from}40` : "none",
                  }}>
                  {meta.emoji} {meta.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: `${activeTab.from}40`, borderTopColor: activeTab.from }} />
              <p className="text-xs font-semibold" style={{ color: "#94A3B8" }}>Loading apps...</p>
            </div>
          ) : (
            <div className="pb-28 px-4">
              {showSections && (
                <div className="mb-4">
                  <DiscoverBillboard items={items} user={user} onItemClick={setSelectedItem} />
                </div>
              )}
              {showSections && newItems.length > 0 && (
                <div className="mb-4">
                  <NewNoteworthy items={newItems} onItemClick={setSelectedItem} />
                </div>
              )}

              {/* Section header */}
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold" style={{ color: "#1A202C" }}>
                  {activeCategory === "all" ? "All Tools" : CAT_META[activeCategory]?.label || activeCategory}
                </h2>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: `linear-gradient(135deg, ${activeTab.from}20, ${activeTab.to}20)`, color: activeTab.from }}>
                  {filtered.length} apps
                </span>
              </div>

              {filtered.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 text-3xl" style={{ background: `linear-gradient(135deg, ${activeTab.from}20, ${activeTab.to}20)` }}>🔍</div>
                  <p className="text-sm font-semibold" style={{ color: "#94A3B8" }}>No apps found</p>
                  <p className="text-xs mt-1" style={{ color: "#CBD5E1" }}>Try a different search or filter</p>
                </div>
              ) : (
                <div>
                  {filtered.map(item => (
                    <DiscoverListItem key={item.id} item={item} user={user}
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

      {/* ===== MEDIA TAB ===== */}
      {contentTab === "media" && (
        <div className="pb-24"><MediaTab user={user} /></div>
      )}

      {/* ===== BOOKS TAB ===== */}
      {contentTab === "books" && (
        <div className="pb-24"><OpenLibraryBooksTab /></div>
      )}

      {/* ===== GAMES TAB ===== */}
      {contentTab === "games" && (
        <div className="pb-24 pt-2">
          <div className="px-4 flex items-center justify-between mb-3">
            <h2 className="text-base font-bold" style={{ color: "#1A202C" }}>🎮 Steam Games</h2>
            <button onClick={() => setShowSubmitForm(true)}
              className="px-3 py-1.5 rounded-full text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, #43E97B, #38F9D7)" }}>
              + Submit
            </button>
          </div>
          <GamesTab />
        </div>
      )}

      {/* ===== STORES TAB ===== */}
      {contentTab === "stores" && (
        <div className="pb-24"><StoresAndDeals /></div>
      )}

      {/* ===== LOCAL TAB ===== */}
      {contentTab === "local" && (
        <div className="pb-24 pt-3">
          <div className="px-4 mb-3">
            <div className="rounded-2xl p-3 flex items-start gap-2" style={{ background: "linear-gradient(135deg, #4FACFE20, #00F2FE20)", border: "1.5px solid #4FACFE30" }}>
              <span className="text-lg">🗺️</span>
              <p className="text-xs leading-relaxed font-medium" style={{ color: "#0369A1" }}>
                Tap any category to find local services near you — opens directly in <span className="font-bold">Google Maps</span>.
              </p>
            </div>
          </div>
          <LocalServices />
        </div>
      )}

      {/* Modals */}
      {selectedItem && !compareMode && (
        <DiscoverItemModal item={selectedItem} user={user} allItems={items}
          onClose={() => setSelectedItem(null)}
          onOpenRelated={rel => setSelectedItem(rel)} />
      )}
      {selectedServicePerson && (
        <ServicePersonModal person={selectedServicePerson} user={user}
          onClose={() => setSelectedServicePerson(null)} />
      )}
      <AnimatePresence>
        {showSubmitForm && (
          <SubmitMediaForm onClose={() => setShowSubmitForm(false)} onSuccess={() => setShowSubmitForm(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}