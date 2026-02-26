import React, { useState, useMemo } from "react";
import { Share2, ArrowUpDown, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ShareModal from "./ShareModal";
import WorthItButton from "./WorthItButton";

const STORES = [
  { id: "burlington", name: "Burlington", category: "Outlet / Discount", description: "Save up to 60% on designer and brand-name clothing, accessories, and home décor.", website: "https://www.burlington.com", icon: "🏬" },
  { id: "tjmaxx", name: "TJ Maxx", category: "Outlet / Discount", description: "Discover designer handbags, apparel, shoes, and home goods at 20-60% off.", website: "https://www.tjmaxx.com", icon: "🏬" },
  { id: "ross", name: "Ross Dress for Less", category: "Outlet / Discount", description: "Off-price fashion leader offering clearance on designer and brand-name apparel.", website: "https://www.rossstores.com", icon: "🏬" },
  { id: "marshalls", name: "Marshalls", category: "Outlet / Discount", description: "Premium off-price retailer featuring discounted designer fashion and home furnishings.", website: "https://www.marshallsonline.com", icon: "🏬" },
  { id: "target", name: "Target", category: "Department Store", description: "One-stop shop for clothing, household essentials, electronics, and more.", website: "https://www.target.com", icon: "🏢" },
  { id: "walmart", name: "Walmart", category: "Department Store", description: "America's leading retailer with everyday low prices on groceries and more.", website: "https://www.walmart.com", icon: "🏢" },
  { id: "kohls", name: "Kohl's", category: "Department Store", description: "Fashion-focused retailer offering apparel, accessories, and beauty with rewards.", website: "https://www.kohls.com", icon: "🏢" },
  { id: "bestbuy", name: "Best Buy", category: "Tech", description: "Your destination for latest electronics, appliances, and tech gadgets.", website: "https://www.bestbuy.com", icon: "💻" },
  { id: "apple", name: "Apple", category: "Tech", description: "Official Apple store for authentic iPhones, Macs, iPads, and accessories.", website: "https://www.apple.com", icon: "💻" },
  { id: "sephora", name: "Sephora", category: "Beauty", description: "Beauty paradise with 20,000+ products from 500+ brands.", website: "https://www.sephora.com", icon: "💄" },
  { id: "ulta", name: "Ulta Beauty", category: "Beauty", description: "Complete beauty destination featuring prestige and drugstore makeup.", website: "https://www.ulta.com", icon: "💄" },
  { id: "homedepot", name: "Home Depot", category: "Home", description: "Premier DIY and professional-grade home improvement store.", website: "https://www.homedepot.com", icon: "🔨" },
  { id: "lowes", name: "Lowe's", category: "Home", description: "Home improvement leader offering building materials, appliances, and tools.", website: "https://www.lowes.com", icon: "🔨" },
  { id: "costco", name: "Costco", category: "Grocery", description: "Wholesale membership club offering bulk groceries at incredible savings.", website: "https://www.costco.com", icon: "🛒" },
  { id: "traderjoes", name: "Trader Joe's", category: "Grocery", description: "Specialty grocer curating natural, organic, and gourmet products.", website: "https://www.traderjoes.com", icon: "🛒" },
];

const CATEGORIES = ["All", "Outlet / Discount", "Department Store", "Tech", "Beauty", "Home", "Grocery"];

const SORT_OPTIONS = ["Popular", "Top Rated", "A-Z"];

function StoreCard({ store, onShare, onRatingChange }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
    >
      {/* Header */}
      <div className="flex items-start gap-2 mb-3">
        <span className="text-2xl shrink-0">{store.icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
            {store.name}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>
            {store.category}
          </p>
          <p className="text-xs mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {store.description}
          </p>
        </div>
      </div>

      {/* Worth it button and actions */}
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
            className="flex-1 py-2 rounded-lg text-xs font-medium text-center transition-all"
            style={{ backgroundColor: "#2E6B4F", color: "#fff" }}
          >
            Website
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
            className="p-2 rounded-lg transition-all"
            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function StoresAndDeals() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("Popular");
  const [shareItem, setShareItem] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const filtered = useMemo(() => {
    let result = activeCategory === "All"
      ? STORES
      : STORES.filter(s => s.category === activeCategory);

    if (sortBy === "A-Z") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [activeCategory, sortBy]);

  const handleRatingChange = () => {
    setRefreshKey(k => k + 1);
  };

  return (
    <div className="pb-10" key={refreshKey}>
      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        <p className="text-base font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
          🛍 Stores & Deals
        </p>
        <p className="text-[11px]" style={{ color: "var(--text-hint)" }}>
          Discover stores and find the best deals
        </p>
      </div>

      {/* Category filter */}
      <div className="px-5 mb-3 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 w-max pb-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-all"
              style={{
                backgroundColor: activeCategory === cat ? "var(--accent-primary)" : "var(--bg-card)",
                color: activeCategory === cat ? "#fff" : "var(--text-secondary)",
                borderColor: activeCategory === cat ? "var(--accent-primary)" : "var(--border-light)",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div className="px-5 mb-3 flex justify-end">
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="text-xs font-medium outline-none"
          style={{ backgroundColor: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border-light)", padding: "6px 10px", borderRadius: "8px" }}
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      {/* Stores grid */}
      <div className="px-5 space-y-2">
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

      {/* Legal disclaimer */}
      <p className="text-[9px] text-center px-5 mt-6 leading-relaxed" style={{ color: "var(--text-hint)" }}>
        All trademarks belong to their respective owners. This platform is not affiliated with listed companies. Links provided for user convenience only.
      </p>

      {shareItem && <ShareModal item={shareItem} onClose={() => setShareItem(null)} />}
    </div>
  );
}