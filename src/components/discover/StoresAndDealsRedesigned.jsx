import React, { useState, useMemo } from "react";
import { Share2, ArrowUpDown, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ShareModal from "./ShareModal";
import WorthItButton from "./WorthItButton";

const STORES = [
  { id: "burlington", name: "Burlington", category: "Outlet / Discount", description: "Save up to 60% on designer and brand-name clothing, accessories, and home décor.", website: "https://www.burlington.com", icon: "🏬", rating: 0.85 },
  { id: "tjmaxx", name: "TJ Maxx", category: "Outlet / Discount", description: "Discover designer handbags, apparel, shoes, and home goods at 20-60% off.", website: "https://www.tjmaxx.com", icon: "🏬", rating: 0.82 },
  { id: "ross", name: "Ross Dress for Less", category: "Outlet / Discount", description: "Off-price fashion leader offering clearance on designer and brand-name apparel.", website: "https://www.rossstores.com", icon: "🏬", rating: 0.78 },
  { id: "marshalls", name: "Marshalls", category: "Outlet / Discount", description: "Premium off-price retailer featuring discounted designer fashion and home furnishings.", website: "https://www.marshallsonline.com", icon: "🏬", rating: 0.80 },
  { id: "target", name: "Target", category: "Department Store", description: "One-stop shop for clothing, household essentials, electronics, and more.", website: "https://www.target.com", icon: "🏢", rating: 0.88 },
  { id: "walmart", name: "Walmart", category: "Department Store", description: "America's leading retailer with everyday low prices on groceries and more.", website: "https://www.walmart.com", icon: "🏢", rating: 0.80 },
  { id: "kohls", name: "Kohl's", category: "Department Store", description: "Fashion-focused retailer offering apparel, accessories, and beauty with rewards.", website: "https://www.kohls.com", icon: "🏢", rating: 0.79 },
  { id: "bestbuy", name: "Best Buy", category: "Tech", description: "Your destination for latest electronics, appliances, and tech gadgets.", website: "https://www.bestbuy.com", icon: "💻", rating: 0.84 },
  { id: "apple", name: "Apple", category: "Tech", description: "Official Apple store for authentic iPhones, Macs, iPads, and accessories.", website: "https://www.apple.com", icon: "💻", rating: 0.90 },
  { id: "sephora", name: "Sephora", category: "Beauty", description: "Beauty paradise with 20,000+ products from 500+ brands.", website: "https://www.sephora.com", icon: "💄", rating: 0.87 },
  { id: "ulta", name: "Ulta Beauty", category: "Beauty", description: "Complete beauty destination featuring prestige and drugstore makeup.", website: "https://www.ulta.com", icon: "💄", rating: 0.86 },
  { id: "homedepot", name: "Home Depot", category: "Home", description: "Premier DIY and professional-grade home improvement store.", website: "https://www.homedepot.com", icon: "🔨", rating: 0.83 },
  { id: "lowes", name: "Lowe's", category: "Home", description: "Home improvement leader offering building materials, appliances, and tools.", website: "https://www.lowes.com", icon: "🔨", rating: 0.82 },
  { id: "costco", name: "Costco", category: "Grocery", description: "Wholesale membership club offering bulk groceries at incredible savings.", website: "https://www.costco.com", icon: "🛒", rating: 0.91 },
  { id: "traderjoes", name: "Trader Joe's", category: "Grocery", description: "Specialty grocer curating natural, organic, and gourmet products.", website: "https://www.traderjoes.com", icon: "🛒", rating: 0.89 },
];

const CATEGORIES = ["All", "Outlet / Discount", "Department Store", "Tech", "Beauty", "Home", "Grocery"];
const SORT_OPTIONS = ["Popular", "Top Rated", "A-Z"];

function StoreCard({ store, onShare, onRatingChange }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl backdrop-blur-sm hover:shadow-md transition-all"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="text-2xl shrink-0">{store.icon}</span>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm leading-tight" style={{ color: "var(--text-primary)" }}>
              {store.name}
            </h3>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--text-hint)" }}>
              {store.category}
            </p>
          </div>
        </div>
        {/* Rating */}
        <div className="flex items-center gap-0.5 px-2 py-1 rounded-lg" style={{ backgroundColor: "#E8F2EC" }}>
          <Star className="w-3 h-3" style={{ color: "#2E6B4F", fill: "#2E6B4F" }} />
          <span className="text-xs font-semibold" style={{ color: "#2E6B4F" }}>
            {(store.rating * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
        {store.description}
      </p>

      {/* Rating and Actions */}
      <div className="flex flex-col gap-2">
        <WorthItButton
          contentType="store"
          contentId={store.id}
          onRatingChange={onRatingChange}
        />
        <div className="flex gap-2">
          <a
            href={store.website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex-1 py-2 rounded-lg text-xs font-medium text-center transition-all hover:shadow-sm"
            style={{ backgroundColor: "#2E6B4F", color: "#fff" }}
          >
            Visit
          </a>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.name)}+near+me`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex-1 py-2 rounded-lg text-xs font-medium text-center transition-all"
            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}
          >
            Maps
          </a>
          <button
            onClick={e => { e.stopPropagation(); onShare(store); }}
            className="p-2 rounded-lg transition-all hover:bg-opacity-70"
            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function StoresAndDealsRedesigned() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("Popular");
  const [shareItem, setShareItem] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const filtered = useMemo(() => {
    let result = activeCategory === "All"
      ? STORES
      : STORES.filter(s => s.category === activeCategory);

    // Sort
    if (sortBy === "Top Rated") {
      result = [...result].sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "A-Z") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [activeCategory, sortBy]);

  const handleRatingChange = () => {
    setRefreshKey(k => k + 1);
  };

  return (
    <div className="pb-10" key={refreshKey}>
      {/* Header with gradient accent */}
      <div className="px-5 pt-4 pb-4">
        <p className="text-base font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
          🛍 Stores & Deals
        </p>
        <p className="text-[11px] mt-1" style={{ color: "var(--text-hint)" }}>
          Discover verified stores and find the best deals
        </p>
      </div>

      {/* Category filter - horizontal scroll */}
      <div className="px-5 mb-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 w-max pb-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="px-3.5 py-2 rounded-full text-xs font-semibold border transition-all whitespace-nowrap"
              style={{
                backgroundColor: activeCategory === cat ? "#2E6B4F" : "var(--bg-card)",
                color: activeCategory === cat ? "#fff" : "var(--text-secondary)",
                borderColor: activeCategory === cat ? "#2E6B4F" : "var(--border-light)",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Sort controls */}
      <div className="px-5 mb-4 flex justify-between items-center">
        <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
          {filtered.length} {filtered.length === 1 ? "store" : "stores"}
        </span>
        <div className="flex items-center gap-2 text-xs">
          <ArrowUpDown className="w-3 h-3" style={{ color: "var(--text-hint)" }} />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="bg-transparent text-xs font-medium outline-none"
            style={{ color: "var(--text-secondary)" }}
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stores grid */}
      <div className="px-5 space-y-2.5">
        <AnimatePresence>
          {filtered.map(store => (
            <StoreCard
              key={store.id}
              store={store}
              onShare={setShareItem}
              onRatingChange={handleRatingChange}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-12 px-5">
          <p className="text-2xl mb-2">🏪</p>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>No stores in this category</p>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-[9px] text-center px-5 mt-6 leading-relaxed" style={{ color: "var(--text-hint)" }}>
        All trademarks belong to their respective owners. This platform is not affiliated with listed companies.
      </p>

      {shareItem && <ShareModal item={shareItem} onClose={() => setShareItem(null)} />}
    </div>
  );
}