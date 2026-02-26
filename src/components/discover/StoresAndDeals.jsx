import React, { useState } from "react";
import { Globe, MapPin, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ShareModal from "./ShareModal";

const STORES = [
  { name: "Burlington", category: "Outlet / Discount", description: "Off-price clothing & home goods", website: "https://www.burlington.com", icon: "🏬" },
  { name: "TJ Maxx", category: "Outlet / Discount", description: "Brand-name apparel & accessories discounts", website: "https://www.tjmaxx.com", icon: "🏬" },
  { name: "Ross Dress for Less", category: "Outlet / Discount", description: "Designer clothing at discount prices", website: "https://www.rossstores.com", icon: "🏬" },
  { name: "Marshalls", category: "Outlet / Discount", description: "Off-price fashion & home décor", website: "https://www.marshallsonline.com", icon: "🏬" },
  { name: "Target", category: "Department Store", description: "Everyday essentials & style", website: "https://www.target.com", icon: "🏢" },
  { name: "Walmart", category: "Department Store", description: "Wide variety of products at low prices", website: "https://www.walmart.com", icon: "🏢" },
  { name: "Kohl's", category: "Department Store", description: "Fashion, home & beauty with rewards", website: "https://www.kohls.com", icon: "🏢" },
  { name: "Best Buy", category: "Tech", description: "Electronics & tech products", website: "https://www.bestbuy.com", icon: "💻" },
  { name: "Apple", category: "Tech", description: "Official Apple products & services", website: "https://www.apple.com", icon: "💻" },
  { name: "Sephora", category: "Beauty", description: "Makeup, skincare & beauty products", website: "https://www.sephora.com", icon: "💄" },
  { name: "Ulta Beauty", category: "Beauty", description: "Beauty, cosmetics & haircare", website: "https://www.ulta.com", icon: "💄" },
  { name: "Home Depot", category: "Home", description: "Home improvement & DIY supplies", website: "https://www.homedepot.com", icon: "🔨" },
  { name: "Lowe's", category: "Home", description: "Home improvement & garden supplies", website: "https://www.lowes.com", icon: "🔨" },
  { name: "Costco", category: "Grocery", description: "Bulk groceries & wholesale shopping", website: "https://www.costco.com", icon: "🛒" },
  { name: "Trader Joe's", category: "Grocery", description: "Natural & organic grocery items", website: "https://www.traderjoes.com", icon: "🛒" },
];

const CATEGORIES = ["All", "Outlet / Discount", "Department Store", "Tech", "Beauty", "Home", "Grocery"];

const STORE_TAGS = ["👍 Best Deals", "🔥 Popular", "💰 Budget", "⭐ Quality"];

function StoreCard({ store, onShare }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
    >
      {/* Header with icon */}
      <div className="flex items-start gap-2 mb-3">
        <span className="text-2xl shrink-0">{store.icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
            {store.name}
          </h3>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {store.description}
          </p>
        </div>
      </div>

      {/* Small tags */}
      <div className="flex flex-wrap gap-1 mb-3">
        {STORE_TAGS.map(tag => (
          <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>
            {tag}
          </span>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <a
          href={store.website}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="flex-1 py-2 rounded-lg text-xs font-medium text-center transition-all"
          style={{ backgroundColor: "var(--accent-primary)", color: "#fff" }}
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
    </motion.div>
  );
}

export default function StoresAndDeals() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [shareItem, setShareItem] = useState(null);

  const filtered = activeCategory === "All"
    ? STORES
    : STORES.filter(s => s.category === activeCategory);

  return (
    <div className="pb-10">
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

      {/* Stores grid */}
      <div className="px-5 space-y-2">
        <AnimatePresence>
          {filtered.map(store => (
            <StoreCard
              key={store.name}
              store={store}
              onShare={setShareItem}
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