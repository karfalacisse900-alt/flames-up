import React, { useState, useMemo } from "react";
import { Share2, ExternalLink, MapPin, Star, TrendingUp, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ShareModal from "./ShareModal";

const STORES = [
  { id: "burlington", name: "Burlington", category: "Outlet", description: "Save up to 60% on designer and brand-name clothing, accessories, and home décor.", website: "https://www.burlington.com", emoji: "🏷️", color: "#E63946", light: "#FFE8E9", rating: 85, badge: "Up to 60% off" },
  { id: "tjmaxx", name: "TJ Maxx", category: "Outlet", description: "Designer handbags, apparel, shoes, and home goods at 20-60% off.", website: "https://www.tjmaxx.com", emoji: "💎", color: "#E76F51", light: "#FFF0EB", rating: 82, badge: "Designer deals" },
  { id: "ross", name: "Ross Dress for Less", category: "Outlet", description: "Off-price fashion with clearance on designer and brand-name apparel.", website: "https://www.rossstores.com", emoji: "🛍️", color: "#2A9D8F", light: "#E8F8F7", rating: 78, badge: "Everyday savings" },
  { id: "target", name: "Target", category: "Department", description: "One-stop shop for clothing, household essentials, electronics, and more.", website: "https://www.target.com", emoji: "🎯", color: "#CC0000", light: "#FFE8E8", rating: 88, badge: "Fan favorite" },
  { id: "walmart", name: "Walmart", category: "Department", description: "America's leading retailer with everyday low prices on groceries and more.", website: "https://www.walmart.com", emoji: "🛒", color: "#0071CE", light: "#E8F4FF", rating: 80, badge: "Low prices" },
  { id: "bestbuy", name: "Best Buy", category: "Tech", description: "Latest electronics, appliances, and tech gadgets with expert service.", website: "https://www.bestbuy.com", emoji: "💻", color: "#003087", light: "#E8EEFF", rating: 84, badge: "Tech hub" },
  { id: "apple", name: "Apple Store", category: "Tech", description: "Authentic iPhones, Macs, iPads, and accessories with in-store support.", website: "https://www.apple.com", emoji: "🍎", color: "#1D1D1F", light: "#F5F5F7", rating: 90, badge: "Premium tech" },
  { id: "sephora", name: "Sephora", category: "Beauty", description: "20,000+ beauty products from 500+ brands in one destination.", website: "https://www.sephora.com", emoji: "💄", color: "#D4004C", light: "#FFE8F0", rating: 87, badge: "Beauty paradise" },
  { id: "ulta", name: "Ulta Beauty", category: "Beauty", description: "Prestige and drugstore makeup with rewards and salon services.", website: "https://www.ulta.com", emoji: "✨", color: "#B8007A", light: "#FFE8F8", rating: 86, badge: "Earn rewards" },
  { id: "homedepot", name: "Home Depot", category: "Home", description: "Premier DIY and professional-grade home improvement store.", website: "https://www.homedepot.com", emoji: "🔨", color: "#F96302", light: "#FFF3E8", rating: 83, badge: "DIY expert" },
  { id: "costco", name: "Costco", category: "Grocery", description: "Wholesale club offering bulk groceries at incredible savings.", website: "https://www.costco.com", emoji: "📦", color: "#005DAA", light: "#E8F2FF", rating: 91, badge: "Bulk savings" },
  { id: "traderjoes", name: "Trader Joe's", category: "Grocery", description: "Curated natural, organic, and gourmet products at fair prices.", website: "https://www.traderjoes.com", emoji: "🌿", color: "#B5451B", light: "#FFF0EB", rating: 89, badge: "Organic finds" },
];

const CATEGORIES = [
  { key: "All", emoji: "🛍️" },
  { key: "Outlet", emoji: "🏷️" },
  { key: "Department", emoji: "🏢" },
  { key: "Tech", emoji: "💻" },
  { key: "Beauty", emoji: "💄" },
  { key: "Home", emoji: "🔨" },
  { key: "Grocery", emoji: "🛒" },
];

function StoreRow({ store, onShare }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 px-4 py-3.5 rounded-2xl mb-2 relative overflow-hidden"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
    >
      {/* Left accent bar */}
      <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full" style={{ backgroundColor: store.color }} />

      {/* Emoji icon */}
      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ml-2"
        style={{ backgroundColor: store.light }}>
        {store.emoji}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold leading-tight" style={{ color: "var(--text-primary)" }}>{store.name}</p>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
            style={{ backgroundColor: store.light, color: store.color }}>{store.badge}</span>
        </div>
        <p className="text-[11px] mt-0.5 line-clamp-1" style={{ color: "var(--text-secondary)" }}>{store.description}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center gap-0.5">
            <Star className="w-3 h-3" style={{ color: "#F5A623", fill: "#F5A623" }} />
            <span className="text-[10px] font-semibold" style={{ color: "var(--text-secondary)" }}>{store.rating}%</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>{store.category}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1.5 shrink-0">
        <a href={store.website} target="_blank" rel="noopener noreferrer"
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: store.color }}>
          <ExternalLink className="w-3.5 h-3.5 text-white" />
        </a>
        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.name)}+near+me`}
          target="_blank" rel="noopener noreferrer"
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
          <MapPin className="w-3.5 h-3.5" style={{ color: "var(--text-secondary)" }} />
        </a>
      </div>
    </motion.div>
  );
}

function FeaturedStore({ store }) {
  return (
    <a href={store.website} target="_blank" rel="noopener noreferrer"
      className="shrink-0 w-44 rounded-2xl overflow-hidden block mr-3"
      style={{ border: "1px solid var(--border-light)" }}>
      <div className="h-20 flex items-center justify-center text-4xl"
        style={{ backgroundColor: store.light }}>{store.emoji}</div>
      <div className="p-2.5" style={{ backgroundColor: "var(--bg-card)" }}>
        <p className="text-xs font-bold truncate" style={{ color: "var(--text-primary)" }}>{store.name}</p>
        <p className="text-[10px] mt-0.5 line-clamp-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{store.description}</p>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px] font-semibold" style={{ color: store.color }}>{store.badge}</span>
          <ArrowRight className="w-3 h-3" style={{ color: "var(--text-hint)" }} />
        </div>
      </div>
    </a>
  );
}

export default function StoresAndDealsRedesigned() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [shareItem, setShareItem] = useState(null);

  const topRated = useMemo(() => [...STORES].sort((a, b) => b.rating - a.rating).slice(0, 5), []);

  const filtered = useMemo(() =>
    activeCategory === "All" ? STORES : STORES.filter(s => s.category === activeCategory),
    [activeCategory]
  );

  return (
    <div className="pb-10">
      {/* Hero */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-0.5">
          <TrendingUp className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
          <p className="text-base font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Stores & Deals</p>
        </div>
        <p className="text-xs" style={{ color: "var(--text-hint)" }}>Discover top stores · Find best deals</p>
      </div>

      {/* Featured horizontal scroll */}
      <div className="mb-4">
        <div className="flex items-center gap-2 px-4 mb-2">
          <Star className="w-3.5 h-3.5" style={{ color: "#F5A623", fill: "#F5A623" }} />
          <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Top Rated</p>
        </div>
        <div className="flex overflow-x-auto scrollbar-hide pl-4 pr-2">
          {topRated.map(store => <FeaturedStore key={store.id} store={store} />)}
        </div>
      </div>

      {/* Category filter pills */}
      <div className="flex overflow-x-auto scrollbar-hide px-4 gap-2 mb-4 pb-1">
        {CATEGORIES.map(cat => (
          <button key={cat.key} onClick={() => setActiveCategory(cat.key)}
            className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all border"
            style={{
              backgroundColor: activeCategory === cat.key ? "var(--accent-primary)" : "var(--bg-card)",
              color: activeCategory === cat.key ? "#fff" : "var(--text-secondary)",
              borderColor: activeCategory === cat.key ? "var(--accent-primary)" : "var(--border-light)",
            }}>
            <span>{cat.emoji}</span> {cat.key}
          </button>
        ))}
      </div>

      {/* Count */}
      <div className="px-4 mb-2 flex items-center justify-between">
        <p className="text-xs font-medium" style={{ color: "var(--text-hint)" }}>{filtered.length} stores</p>
      </div>

      {/* List */}
      <div className="px-4">
        <AnimatePresence>
          {filtered.map(store => (
            <StoreRow key={store.id} store={store} onShare={setShareItem} />
          ))}
        </AnimatePresence>
      </div>

      <p className="text-[9px] text-center px-5 mt-6 leading-relaxed" style={{ color: "var(--text-hint)" }}>
        All trademarks belong to their respective owners. Not affiliated with listed companies.
      </p>

      {shareItem && <ShareModal item={shareItem} onClose={() => setShareItem(null)} />}
    </div>
  );
}