import React, { useState, useCallback } from "react";
import { usePullToRefresh } from "../components/hooks/usePullToRefresh";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Search, List, Layers, ChevronLeft, ChevronRight, ExternalLink, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import DiscoverLogo from "../components/discover/DiscoverLogo";
import StarRating from "../components/discover/StarRating";
import DiscoverBillboard from "../components/discover/DiscoverBillboard";
import NewNoteworthy from "../components/discover/NewNoteworthy";
import DiscoverItemModal from "../components/discover/DiscoverItemModal";
import DiscoverAIAssistant from "../components/discover/DiscoverAIAssistant";
import CompareBar from "../components/discover/CompareBar";
import CompareModal from "../components/discover/CompareModal";
import ServicePersonCard from "../components/discover/ServicePersonCard";
import ServicePersonModal from "../components/discover/ServicePersonModal";
import BookmarkButton from "../components/discover/BookmarkButton";
import LocalServices from "../components/discover/LocalServices";
import WhyTheseApps from "../components/discover/WhyTheseApps";
import SmartFilters from "../components/discover/SmartFilters";
import QuickVote from "../components/discover/QuickVote";
import ProductsTab from "../components/discover/ProductsTab";
import MediaTab from "../components/discover/MediaTab";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Users } from "lucide-react";

const categories = ["all", "productivity", "finance", "learning", "lifestyle", "entertainment", "health", "social", "developer_tools"];

const catColors = {
  productivity: "",
  finance: "",
  learning: "",
  lifestyle: "",
  entertainment: "",
  health: "",
  social: "",
  developer_tools: "",
};

function SwipeDiscoverCard({ item, onOpen }) {
  return (
    <div className="h-full rounded-3xl p-6 flex flex-col cursor-pointer" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 8px 40px rgba(0,0,0,0.08)" }} onClick={onOpen}>
      {item.is_sponsored && (
        <span className="self-start text-[10px] px-2 py-0.5 rounded-full mb-3" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--accent-secondary)", border: "1px solid var(--border-light)" }}>Sponsored</span>
      )}
      <div className="flex items-center gap-4 mb-4">
        <DiscoverLogo item={item} size="lg" />
        <div>
          <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>{item.title}</h2>
          <p className="text-sm" style={{ color: "var(--text-hint)" }}>{item.brand_name}</p>
          <StarRating value={item.avg_rating || 0} showCount count={item.review_count || 0} />
        </div>
      </div>
      <p className="text-sm leading-relaxed flex-1" style={{ color: "var(--text-secondary)" }}>{item.description}</p>
      {item.long_description && (
        <p className="text-xs mt-2 line-clamp-2 leading-relaxed" style={{ color: "var(--text-hint)" }}>{item.long_description}</p>
      )}
      <div className="flex flex-wrap gap-2 mt-4">
        <span className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)", border: "1px solid var(--border-light)" }}>
          {item.category?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
        </span>
        {item.pricing && <span className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--accent-secondary)", border: "1px solid var(--border-light)" }}>{item.pricing}</span>}
        {item.promo && (
          <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)", border: "1px solid var(--border-light)" }}>✓ {item.promo}</span>
        )}
      </div>
      <div className="flex gap-2 mt-4">
        <button className="flex-1 py-2.5 rounded-2xl text-sm font-medium" style={{ backgroundColor: "var(--bg-app)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}>
          Read More
        </button>
        {item.link && (
          <a href={item.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-medium"
            style={{ backgroundColor: "var(--accent-primary)", color: "#fff" }}>
            Visit <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

function DiscoverListItem({ item, onOpen, compareMode, isSelected, onToggleCompare, user }) {
  return (
    <div onClick={compareMode ? onToggleCompare : onOpen}
      className="rounded-2xl p-4 hover:shadow-sm transition-all cursor-pointer active:scale-[0.99] relative"
      style={{ backgroundColor: "var(--bg-card)", border: isSelected ? "2px solid var(--accent-primary)" : "1px solid var(--border-light)" }}>
      {compareMode && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
          style={{ borderColor: isSelected ? "var(--accent-primary)" : "var(--border-medium)", backgroundColor: isSelected ? "var(--accent-primary)" : "transparent" }}>
          {isSelected && <span className="text-white text-[10px] font-bold">✓</span>}
        </div>
      )}
      <div className="flex items-start gap-3">
        <DiscoverLogo item={item} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{item.title}</h3>
            {item.is_new && <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: "rgba(217,139,98,0.12)", color: "var(--accent-secondary)" }}>New</span>}
            {item.is_sponsored && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: "rgba(217,139,98,0.1)", color: "var(--accent-secondary)", border: "1px solid rgba(217,139,98,0.3)" }}>Sponsored</span>}
          </div>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>{item.brand_name}</p>
          <p className="text-xs mt-1.5 line-clamp-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{item.description}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-[10px] px-2 py-0.5 rounded-full border" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)", borderColor: "var(--border-medium)" }}>
              {item.category?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
            </span>
            {item.pricing && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--accent-secondary)", border: "1px solid var(--border-light)" }}>{item.pricing}</span>}
            {item.promo && (
              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(60,110,90,0.08)", color: "var(--accent-primary)", border: "1px solid rgba(60,110,90,0.2)" }}>
                ✓ {item.promo}
              </span>
            )}
            <StarRating value={item.avg_rating || 0} showCount count={item.review_count || 0} />
          </div>
          <QuickVote item={item} />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {user && (
            <BookmarkButton user={user} itemType="app" itemId={item.id}
              itemTitle={item.title} itemSubtitle={item.brand_name} itemImageUrl={item.logo_url} />
          )}
          {item.link && (
            <a href={item.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
              className="p-2 shrink-0 transition-colors rounded-full"
              style={{ color: "var(--text-hint)", backgroundColor: "var(--bg-app)" }}>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Discover() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [swipeIndex, setSwipeIndex] = useState(0);
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

  const filteredServicePeople = servicePeople.filter(p =>
    !search ||
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.headline?.toLowerCase().includes(search.toLowerCase()) ||
    p.short_description?.toLowerCase().includes(search.toLowerCase()) ||
    p.skills?.some(s => s.toLowerCase().includes(search.toLowerCase()))
  ).sort((a, b) => sortBy === "rating" ? (b.avg_rating || 0) - (a.avg_rating || 0) : 0);

  const activeFiltersCount = [filterPlatform !== "all", filterPricing !== "all", sortBy !== "default"].filter(Boolean).length;
  const showSections = activeCategory === "all" && !search;

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

      {/* Header */}
      <div className="px-4 pt-3 pb-3" style={{ backgroundColor: "var(--bg-nav)", borderBottom: "1px solid var(--border-light)" }}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Discover</h1>
          <div className="flex items-center gap-2 shrink-0">
  
            {contentTab === "apps" && (
              <>
                <button onClick={() => { setCompareMode(m => !m); setCompareList([]); }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border text-xs"
                  style={{ backgroundColor: compareMode ? "var(--accent-primary)" : "var(--bg-card)", borderColor: compareMode ? "var(--accent-primary)" : "var(--border-light)", color: compareMode ? "#fff" : "var(--text-secondary)" }}>
                  Compare
                </button>
                <button onClick={() => { setViewMode(viewMode === "list" ? "swipe" : "list"); setSwipeIndex(0); }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs"
                  style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)", color: "var(--text-secondary)" }}>
                  {viewMode === "list" ? <><Layers className="w-3.5 h-3.5" /> Swipe</> : <><List className="w-3.5 h-3.5" /> List</>}
                </button>
              </>
            )}
          </div>
        </div>
        {/* Content type tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: "var(--bg-app)", border: "1px solid var(--border-light)" }}>
          {[["apps", "🛠 Apps"], ["products", "📦 Products"], ["media", "🎬 Media"], ["services", "👤 Services"], ["local", "📍 Local"]].map(([val, label]) => (
            <button key={val} onClick={() => setContentTab(val)}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                backgroundColor: contentTab === val ? "var(--bg-card)" : "transparent",
                color: contentTab === val ? "var(--accent-primary)" : "var(--text-hint)",
                boxShadow: contentTab === val ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ===== APPS TAB ===== */}
      {contentTab === "apps" && (
        <>
          {/* Why these apps collapsible */}
          <div className="pt-3">
            <WhyTheseApps />
          </div>

          {/* Smart filters */}
          <SmartFilters active={smartFilter} onChange={f => { setSmartFilter(f); setActiveCategory("all"); }} />

          {/* Search + Filter */}
          {viewMode === "list" && (
            <div className="px-5 pt-1 space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B9B9B]" />
                  <Input placeholder="Search tools, apps, services..." value={search}
                    onChange={e => { setSearch(e.target.value); setSwipeIndex(0); }}
                    className="pl-10 rounded-xl text-sm" />
                </div>
                <button onClick={() => setShowFilters(f => !f)}
                  className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-colors"
                  style={{ backgroundColor: showFilters ? "var(--accent-primary)" : "var(--bg-card)", borderColor: showFilters ? "var(--accent-primary)" : "var(--border-light)", color: showFilters ? "#fff" : "var(--text-secondary)" }}>
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                      style={{ backgroundColor: "var(--accent-secondary)", color: "#fff" }}>
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              </div>
              {showFilters && (
                <div className="p-3 rounded-2xl space-y-3" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-hint)" }}>Sort by</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {[["default","Default"],["rating","Top Rated"],["newest","Newest"]].map(([val, label]) => (
                        <button key={val} onClick={() => setSortBy(val)}
                          className="text-xs px-3 py-1 rounded-full border transition-colors"
                          style={{ backgroundColor: sortBy === val ? "var(--accent-primary)" : "var(--bg-nav)", color: sortBy === val ? "#fff" : "var(--text-secondary)", borderColor: sortBy === val ? "var(--accent-primary)" : "var(--border-light)" }}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-hint)" }}>Platform</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {platformOptions.map(p => (
                        <button key={p} onClick={() => setFilterPlatform(p)}
                          className="text-xs px-3 py-1 rounded-full border transition-colors"
                          style={{ backgroundColor: filterPlatform === p ? "var(--accent-primary)" : "var(--bg-nav)", color: filterPlatform === p ? "#fff" : "var(--text-secondary)", borderColor: filterPlatform === p ? "var(--accent-primary)" : "var(--border-light)" }}>
                          {p === "all" ? "All" : p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-hint)" }}>Pricing</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {pricingOptions.map(p => (
                        <button key={p} onClick={() => setFilterPricing(p)}
                          className="text-xs px-3 py-1 rounded-full border transition-colors"
                          style={{ backgroundColor: filterPricing === p ? "var(--accent-primary)" : "var(--bg-nav)", color: filterPricing === p ? "#fff" : "var(--text-secondary)", borderColor: filterPricing === p ? "var(--accent-primary)" : "var(--border-light)" }}>
                          {p === "all" ? "All" : p}
                        </button>
                      ))}
                    </div>
                  </div>
                  {activeFiltersCount > 0 && (
                    <button onClick={() => { setSortBy("default"); setFilterPlatform("all"); setFilterPricing("all"); }}
                      className="flex items-center gap-1 text-xs" style={{ color: "var(--accent-secondary)" }}>
                      <X className="w-3 h-3" /> Reset filters
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Categories */}
          <div className="px-5 mb-2 overflow-x-auto scrollbar-hide mt-3">
            <div className="flex gap-2">
              {categories.map(cat => (
                <button key={cat} onClick={() => { setActiveCategory(cat); setSwipeIndex(0); }}
                  className="px-3 py-1.5 text-xs rounded-full border whitespace-nowrap transition-all"
                  style={{ backgroundColor: activeCategory === cat ? "var(--accent-primary)" : "var(--bg-nav)", color: activeCategory === cat ? "#fff" : "var(--text-secondary)", borderColor: activeCategory === cat ? "var(--accent-primary)" : "var(--border-light)" }}>
                  {cat === "all" ? "All" : cat.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
            </div>
          ) : viewMode === "swipe" ? (
            <div className="px-5 pb-24 mt-4">
              {filtered.length === 0 ? (
                <div className="text-center py-16"><p className="text-sm" style={{ color: "var(--text-hint)" }}>Nothing found</p></div>
              ) : (
                <>
                  <div style={{ height: "65vh" }}>
                    <AnimatePresence mode="wait">
                      <motion.div key={filtered[swipeIndex]?.id} className="h-full"
                        initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.2 }}>
                        {filtered[swipeIndex] && (
                          <SwipeDiscoverCard item={filtered[swipeIndex]} onOpen={() => setSelectedItem(filtered[swipeIndex])} />
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  <div className="flex items-center justify-center gap-6 mt-4">
                    <button onClick={() => setSwipeIndex(i => Math.max(0, i - 1))} disabled={swipeIndex === 0} className="p-3 rounded-full disabled:opacity-30" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                      <ChevronLeft className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
                    </button>
                    <span className="text-xs" style={{ color: "var(--text-hint)" }}>{swipeIndex + 1} / {filtered.length}</span>
                    <button onClick={() => setSwipeIndex(i => Math.min(filtered.length - 1, i + 1))} disabled={swipeIndex === filtered.length - 1} className="p-3 rounded-full disabled:opacity-30" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                      <ChevronRight className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="pb-24 mt-4">
              {showSections && (
                <DiscoverBillboard items={items} user={user} onItemClick={setSelectedItem} />
              )}
              {showSections && newItems.length > 0 && (
                <NewNoteworthy items={newItems} onItemClick={setSelectedItem} />
              )}
              {showSections && (
                <div className="px-5 flex items-center gap-2 mb-3">
                  <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                    {activeCategory === "all" ? "All Tools & Services" : activeCategory.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                  </h2>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--bg-app)", color: "var(--text-hint)", border: "1px solid var(--border-light)" }}>
                    {filtered.length}
                  </span>
                </div>
              )}
              {filtered.length === 0 ? (
                <div className="text-center py-16 px-5">
                  <p className="text-4xl mb-3">🔍</p>
                  <p className="text-sm" style={{ color: "var(--text-hint)" }}>No items found</p>
                </div>
              ) : (
                <div className="px-5 space-y-3">
                  {filtered.map(item => (
                    <DiscoverListItem key={item.id} item={item}
                      user={user}
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

          {!isLoading && !compareMode && <DiscoverAIAssistant items={items} onItemClick={setSelectedItem} />}
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
        <div className="mt-3">
          <MediaTab user={user} />
        </div>
      )}

      {/* ===== PRODUCTS TAB ===== */}
      {contentTab === "products" && (
        <div className="mt-4">
          <ProductsTab />
        </div>
      )}

      {/* ===== SERVICE PEOPLE TAB ===== */}
      {contentTab === "services" && (
        <div className="pb-24 mt-4">
          <div className="px-5 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B9B9B]" />
              <Input placeholder="Search by name, skill, role..." value={search}
               onChange={e => setSearch(e.target.value)}
               className="pl-10 rounded-xl text-sm" />
            </div>
          </div>
          {spLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
            </div>
          ) : filteredServicePeople.length === 0 ? (
            <div className="text-center py-16 px-5">
              <p className="text-4xl mb-3">👤</p>
              <p className="text-sm" style={{ color: "var(--text-hint)" }}>{search ? "No people found" : "No service people listed yet"}</p>
            </div>
          ) : (
            <div className="px-5 space-y-3">
              {filteredServicePeople.map(person => (
                <ServicePersonCard key={person.id} person={person} user={user} onClick={() => setSelectedServicePerson(person)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== LOCAL SERVICES TAB ===== */}
      {contentTab === "local" && (
        <div className="pb-24 mt-4">
          <div className="px-5 mb-4">
            <div className="rounded-2xl p-3" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                🗺️ Discover everyday local services in your neighborhood — tapping any category opens <span className="font-semibold">Google Maps</span> with nearby results.
              </p>
            </div>
          </div>
          <LocalServices />
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedItem && !compareMode && (
        <DiscoverItemModal item={selectedItem} user={user} allItems={items}
          onClose={() => setSelectedItem(null)}
          onOpenRelated={rel => setSelectedItem(rel)} />
      )}

      {/* Service Person Modal */}
      {selectedServicePerson && (
        <ServicePersonModal person={selectedServicePerson} user={user}
          onClose={() => setSelectedServicePerson(null)} />
      )}
    </div>
  );
}