import React, { useState, useMemo } from "react";
import { Share2, ArrowUpDown, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ShareModal from "./ShareModal";
import WorthItButton from "./WorthItButton";

const STORES = [
  { name: "Burlington", category: "Outlet / Discount", description: "Save up to 60% on designer and brand-name clothing, accessories, and home décor. Find premium brands at fraction of retail prices with constantly rotating inventory.", website: "https://www.burlington.com", icon: "🏬" },
  { name: "TJ Maxx", category: "Outlet / Discount", description: "Discover designer handbags, apparel, shoes, and home goods at 20-60% off. Updated multiple times daily with new treasures from top brands.", website: "https://www.tjmaxx.com", icon: "🏬" },
  { name: "Ross Dress for Less", category: "Outlet / Discount", description: "Off-price fashion leader offering clearance on designer and brand-name apparel, shoes, and accessories. Expert curation for budget-conscious shoppers.", website: "https://www.rossstores.com", icon: "🏬" },
  { name: "Marshalls", category: "Outlet / Discount", description: "Premium off-price retailer featuring discounted designer fashion, footwear, and home furnishings. Shop brand names you love at prices you'll love more.", website: "https://www.marshallsonline.com", icon: "🏬" },
  { name: "Target", category: "Department Store", description: "One-stop shop for clothing, household essentials, electronics, and more. Same-day delivery, price matching, and exclusive designer collaborations.", website: "https://www.target.com", icon: "🏢" },
  { name: "Walmart", category: "Department Store", description: "America's leading retailer with everyday low prices on groceries, apparel, electronics, and home goods. Free 2-day shipping for members.", website: "https://www.walmart.com", icon: "🏢" },
  { name: "Kohl's", category: "Department Store", description: "Fashion-focused retailer offering apparel, accessories, and beauty with Kohl's Cash rewards. Exclusive brands and frequent promotions for smart shoppers.", website: "https://www.kohls.com", icon: "🏢" },
  { name: "Best Buy", category: "Tech", description: "Your destination for latest electronics, appliances, and tech gadgets. Expert staff, price guarantee, and extended warranties for peace of mind.", website: "https://www.bestbuy.com", icon: "💻" },
  { name: "Apple", category: "Tech", description: "Official Apple store for authentic iPhones, Macs, iPads, and accessories. Expert support, trade-in programs, and exclusive product launches.", website: "https://www.apple.com", icon: "💻" },
  { name: "Sephora", category: "Beauty", description: "Beauty paradise with 20,000+ products from 500+ brands. Beauty experts, free samples, and loyalty rewards make every purchase special.", website: "https://www.sephora.com", icon: "💄" },
  { name: "Ulta Beauty", category: "Beauty", description: "Complete beauty destination featuring prestige and drugstore makeup, skincare, and fragrance. Exclusive brands, free beauty consultations, and rewards program.", website: "https://www.ulta.com", icon: "💄" },
  { name: "Home Depot", category: "Home", description: "Premier DIY and professional-grade home improvement store. Expert advice, tool rentals, and delivery services for all your project needs.", website: "https://www.homedepot.com", icon: "🔨" },
  { name: "Lowe's", category: "Home", description: "Home improvement leader offering building materials, appliances, and tools. Project inspiration, contractor services, and same-day delivery available.", website: "https://www.lowes.com", icon: "🔨" },
  { name: "Costco", category: "Grocery", description: "Wholesale membership club offering bulk groceries, electronics, furniture, and home essentials at incredible savings. Premium quality at wholesale prices.", website: "https://www.costco.com", icon: "🛒" },
  { name: "Trader Joe's", category: "Grocery", description: "Specialty grocer curating natural, organic, and gourmet products from around the world. Unique finds and reasonable prices for conscious shoppers.", website: "https://www.traderjoes.com", icon: "🛒" },
];

const CATEGORIES = ["All", "Outlet / Discount", "Department Store", "Tech", "Beauty", "Home", "Grocery"];

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
          <p className="text-xs mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {store.description}
          </p>
        </div>
      </div>

      {/* Action buttons */}
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