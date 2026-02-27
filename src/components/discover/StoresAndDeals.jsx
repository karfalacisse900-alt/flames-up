import React, { useState, useMemo } from "react";
import { Share2, MapPin, ExternalLink, ShoppingBag, Cpu, Sparkles, Home, ShoppingCart, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ShareModal from "./ShareModal";
import WorthItButton from "./WorthItButton";

const STORES = [
  { id: "burlington", name: "Burlington", category: "Outlet / Discount", description: "Save up to 60% on designer and brand-name clothing, accessories, and home décor.", website: "https://www.burlington.com", color: "#E53E3E", bg: "#FFF5F5", icon: "🏬" },
  { id: "tjmaxx", name: "TJ Maxx", category: "Outlet / Discount", description: "Discover designer handbags, apparel, shoes, and home goods at 20-60% off.", website: "https://www.tjmaxx.com", color: "#D53F8C", bg: "#FFF0F6", icon: "🏬" },
  { id: "ross", name: "Ross Dress for Less", category: "Outlet / Discount", description: "Off-price fashion leader offering clearance on designer and brand-name apparel.", website: "https://www.rossstores.com", color: "#805AD5", bg: "#FAF5FF", icon: "🏬" },
  { id: "marshalls", name: "Marshalls", category: "Outlet / Discount", description: "Premium off-price retailer featuring discounted designer fashion and home furnishings.", website: "https://www.marshallsonline.com", color: "#3182CE", bg: "#EBF8FF", icon: "🏬" },
  { id: "target", name: "Target", category: "Department Store", description: "One-stop shop for clothing, household essentials, electronics, and more.", website: "https://www.target.com", color: "#E53E3E", bg: "#FFF5F5", icon: "🎯" },
  { id: "walmart", name: "Walmart", category: "Department Store", description: "America's leading retailer with everyday low prices on groceries and more.", website: "https://www.walmart.com", color: "#3182CE", bg: "#EBF8FF", icon: "🏢" },
  { id: "kohls", name: "Kohl's", category: "Department Store", description: "Fashion-focused retailer offering apparel, accessories, and beauty with rewards.", website: "https://www.kohls.com", color: "#9F7AEA", bg: "#FAF5FF", icon: "🏢" },
  { id: "bestbuy", name: "Best Buy", category: "Tech", description: "Your destination for latest electronics, appliances, and tech gadgets.", website: "https://www.bestbuy.com", color: "#3182CE", bg: "#EBF8FF", icon: "💻" },
  { id: "apple", name: "Apple", category: "Tech", description: "Official Apple store for authentic iPhones, Macs, iPads, and accessories.", website: "https://www.apple.com", color: "#718096", bg: "#F7FAFC", icon: "🍎" },
  { id: "sephora", name: "Sephora", category: "Beauty", description: "Beauty paradise with 20,000+ products from 500+ brands.", website: "https://www.sephora.com", color: "#E53E3E", bg: "#FFF5F5", icon: "💄" },
  { id: "ulta", name: "Ulta Beauty", category: "Beauty", description: "Complete beauty destination featuring prestige and drugstore makeup.", website: "https://www.ulta.com", color: "#D53F8C", bg: "#FFF0F6", icon: "💅" },
  { id: "homedepot", name: "Home Depot", category: "Home", description: "Premier DIY and professional-grade home improvement store.", website: "https://www.homedepot.com", color: "#DD6B20", bg: "#FFFAF0", icon: "🔨" },
  { id: "lowes", name: "Lowe's", category: "Home", description: "Home improvement leader offering building materials, appliances, and tools.", website: "https://www.lowes.com", color: "#3182CE", bg: "#EBF8FF", icon: "🏡" },
  { id: "costco", name: "Costco", category: "Grocery", description: "Wholesale membership club offering bulk groceries at incredible savings.", website: "https://www.costco.com", color: "#E53E3E", bg: "#FFF5F5", icon: "🛒" },
  { id: "traderjoes", name: "Trader Joe's", category: "Grocery", description: "Specialty grocer curating natural, organic, and gourmet products.", website: "https://www.traderjoes.com", color: "#DD6B20", bg: "#FFFAF0", icon: "🌿" },
];

const CATEGORIES = [
  { key: "All", icon: <ShoppingBag className="w-3.5 h-3.5" />, color: "#667EEA" },
  { key: "Outlet / Discount", icon: <Tag className="w-3.5 h-3.5" />, color: "#E53E3E" },
  { key: "Department Store", icon: <ShoppingCart className="w-3.5 h-3.5" />, color: "#3182CE" },
  { key: "Tech", icon: <Cpu className="w-3.5 h-3.5" />, color: "#9F7AEA" },
  { key: "Beauty", icon: <Sparkles className="w-3.5 h-3.5" />, color: "#D53F8C" },
  { key: "Home", icon: <Home className="w-3.5 h-3.5" />, color: "#DD6B20" },
  { key: "Grocery", icon: <ShoppingCart className="w-3.5 h-3.5" />, color: "#38A169" },
];

function StoreCard({ store, onShare }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: "#fff", border: `1px solid ${store.color}25`, boxShadow: `0 2px 16px ${store.color}10` }}>
      {/* Color accent bar */}
      <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${store.color}, ${store.color}80)` }} />
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-sm" style={{ backgroundColor: store.bg }}>
            {store.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm" style={{ color: "#1E293B" }}>{store.name}</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: store.bg, color: store.color }}>
                {store.category}
              </span>
            </div>
            <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "#64748B" }}>{store.description}</p>
          </div>
        </div>

        <WorthItButton contentType="store" contentId={store.id} />

        <div className="flex gap-2 mt-3">
          <a href={store.website} target="_blank" rel="noopener noreferrer"
            className="flex-1 py-2 rounded-xl text-xs font-bold text-center text-white transition-all"
            style={{ background: `linear-gradient(135deg, ${store.color}, ${store.color}BB)`, boxShadow: `0 2px 10px ${store.color}30` }}>
            Visit Website
          </a>
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.name)}+near+me`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{ backgroundColor: "#F1F5F9", color: "#475569", border: "1px solid #E2E8F0" }}>
            <MapPin className="w-3.5 h-3.5" /> Find
          </a>
          <button onClick={() => onShare(store)}
            className="p-2 rounded-xl transition-all"
            style={{ backgroundColor: "#F1F5F9", color: "#475569", border: "1px solid #E2E8F0" }}>
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function StoresAndDeals() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [shareItem, setShareItem] = useState(null);

  const filtered = useMemo(() =>
    activeCategory === "All" ? STORES : STORES.filter(s => s.category === activeCategory),
    [activeCategory]
  );

  return (
    <div className="pb-10">
      {/* Hero header */}
      <div className="mx-4 mb-4 rounded-3xl p-5 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #667EEA, #764BA2)" }}>
        <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-20" style={{ background: "radial-gradient(circle, white, transparent)" }} />
        <div className="absolute -bottom-3 -left-3 w-16 h-16 rounded-full opacity-15" style={{ background: "radial-gradient(circle, white, transparent)" }} />
        <p className="text-white font-bold text-lg" style={{ fontFamily: "var(--font-serif)" }}>🛍 Stores & Deals</p>
        <p className="text-white/70 text-xs mt-1">Discover the best places to shop near you</p>
        <div className="flex items-center gap-3 mt-3">
          <div className="bg-white/20 rounded-xl px-3 py-1.5 text-center">
            <p className="text-white font-bold text-sm">{STORES.length}</p>
            <p className="text-white/60 text-[10px]">Stores</p>
          </div>
          <div className="bg-white/20 rounded-xl px-3 py-1.5 text-center">
            <p className="text-white font-bold text-sm">{CATEGORIES.length - 1}</p>
            <p className="text-white/60 text-[10px]">Categories</p>
          </div>
        </div>
      </div>

      {/* Category chips with icons */}
      <div className="px-4 mb-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 w-max pb-1">
          {CATEGORIES.map(cat => (
            <button key={cat.key} onClick={() => setActiveCategory(cat.key)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all"
              style={{
                background: activeCategory === cat.key ? `linear-gradient(135deg, ${cat.color}, ${cat.color}BB)` : "#fff",
                color: activeCategory === cat.key ? "#fff" : cat.color,
                border: `1.5px solid ${activeCategory === cat.key ? cat.color : cat.color + "40"}`,
                boxShadow: activeCategory === cat.key ? `0 2px 12px ${cat.color}35` : "none",
              }}>
              {cat.icon} {cat.key === "Outlet / Discount" ? "Outlet" : cat.key}
            </button>
          ))}
        </div>
      </div>

      {/* Stores */}
      <div className="px-4 space-y-3">
        <AnimatePresence>
          {filtered.map(store => (
            <StoreCard key={store.id} store={store} onShare={setShareItem} />
          ))}
        </AnimatePresence>
      </div>

      <p className="text-[10px] text-center px-5 mt-6 leading-relaxed" style={{ color: "#94A3B8" }}>
        All trademarks belong to their respective owners. Not affiliated with listed companies.
      </p>

      {shareItem && <ShareModal item={shareItem} onClose={() => setShareItem(null)} />}
    </div>
  );
}