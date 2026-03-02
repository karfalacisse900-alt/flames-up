import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Search, ShoppingCart, Sparkles } from "lucide-react";

const FEATURED_CATEGORIES = [
  { emoji: "🎧", label: "Headphones", color: "#7c3aed" },
  { emoji: "👟", label: "Sneakers", color: "#db2777" },
  { emoji: "📱", label: "iPhone 15", color: "#0284c7" },
  { emoji: "🎮", label: "Gaming", color: "#16a34a" },
  { emoji: "⌚", label: "Watches", color: "#d97706" },
  { emoji: "💻", label: "Laptops", color: "#0891b2" },
];

function EbayCard({ item, index }) {
  return (
    <motion.a
      href={item.url} target="_blank" rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(0,0,0,0.13)" }}
      whileTap={{ scale: 0.97 }}
      className="block rounded-2xl overflow-hidden break-inside-avoid mb-3"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", display: "inline-block", width: "100%" }}
    >
      <img
        src={item.image}
        alt={item.title}
        className="w-full object-cover"
        style={{ height: index % 3 === 0 ? 200 : 150 }}
        onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
      />
      <div className="w-full h-32 items-center justify-center" style={{ display: "none", backgroundColor: "var(--bg-subtle)" }}>
        <ShoppingCart className="w-8 h-8" style={{ color: "var(--text-hint)" }} />
      </div>
      <div className="p-2.5">
        <p className="text-xs font-medium leading-snug line-clamp-2 mb-1.5" style={{ color: "var(--text-primary)" }}>{item.title}</p>
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold" style={{ color: "var(--accent-primary)" }}>
            {item.currency === "USD" ? "$" : (item.currency || "$")}{parseFloat(item.price || 0).toFixed(2)}
          </p>
          {item.condition && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>
              {item.condition.split(" ")[0]}
            </span>
          )}
        </div>
      </div>
    </motion.a>
  );
}

export default function EbayShopTab() {
  const [query, setQuery] = useState("Headphones");
  const [inputVal, setInputVal] = useState("");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("Headphones");
  const LIMIT = 20;

  const search = async (q, off = 0) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    const res = await base44.functions.invoke("ebaySearch", { query: q, limit: LIMIT, offset: off });
    setLoading(false);
    if (res.data?.error) { setError(res.data.error); return; }
    // Filter only items that have images
    const withImages = (res.data?.items || []).filter(item => item.image && item.image.trim() !== "");
    setItems(withImages);
    setTotal(res.data?.total || 0);
    setOffset(off);
    setQuery(q);
  };

  // Auto-load on mount
  useEffect(() => {
    search("Headphones", 0);
  }, []);

  const handleCategoryClick = (label) => {
    setActiveCategory(label);
    setInputVal("");
    search(label, 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    setActiveCategory(null);
    search(inputVal, 0);
  };

  const col1 = items.filter((_, i) => i % 2 === 0);
  const col2 = items.filter((_, i) => i % 2 === 1);

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-2xl">🛒</span>
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>eBay Shop</h2>
          <Sparkles className="w-4 h-4 ml-auto" style={{ color: "var(--accent-secondary)" }} />
        </div>
        <p className="text-xs" style={{ color: "var(--text-hint)" }}>Millions of products, best deals</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSubmit} className="px-4 mb-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-hint)" }} />
            <input value={inputVal} onChange={e => setInputVal(e.target.value)}
              placeholder="Search eBay..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
          </div>
          <button type="submit" className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: "var(--accent-primary)" }}>
            Search
          </button>
        </div>
      </form>

      {/* Category pills */}
      <div className="px-4 mb-4 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {FEATURED_CATEGORIES.map(cat => (
          <button key={cat.label} onClick={() => handleCategoryClick(cat.label)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl shrink-0 text-xs font-semibold transition-all"
            style={{
              background: activeCategory === cat.label ? `linear-gradient(135deg, ${cat.color}33, ${cat.color}11)` : "var(--bg-card)",
              border: `1.5px solid ${activeCategory === cat.label ? cat.color + "88" : "var(--border-light)"}`,
              color: activeCategory === cat.label ? cat.color : "var(--text-secondary)",
            }}>
            <span>{cat.emoji}</span> {cat.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
            className="w-7 h-7 border-2 rounded-full"
            style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
          <p className="text-xs" style={{ color: "var(--text-hint)" }}>Loading products...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mx-4 p-4 rounded-2xl text-sm text-center" style={{ backgroundColor: "#FEF2F2", color: "#EF4444" }}>
          {error}
        </div>
      )}

      {/* Results — Masonry */}
      {!loading && items.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          <div className="px-4 mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold" style={{ color: "var(--text-hint)" }}>
              Showing results for <span style={{ color: "var(--text-primary)" }}>"{query}"</span>
            </p>
          </div>

          {/* 2-col masonry */}
          <div className="px-4 flex gap-3">
            <div className="flex-1 flex flex-col">
              {col1.map((item, i) => <EbayCard key={item.id} item={item} index={i * 2} />)}
            </div>
            <div className="flex-1 flex flex-col mt-5">
              {col2.map((item, i) => <EbayCard key={item.id} item={item} index={i * 2 + 1} />)}
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-3 px-4 mt-4">
            <button onClick={() => search(query, Math.max(0, offset - LIMIT))} disabled={offset === 0}
              className="px-5 py-2 rounded-xl text-sm font-semibold border disabled:opacity-40 transition-all active:scale-95"
              style={{ backgroundColor: "var(--bg-card)", color: "var(--text-secondary)", borderColor: "var(--border-light)" }}>
              ← Prev
            </button>
            <span className="text-xs" style={{ color: "var(--text-hint)" }}>
              {offset + 1}–{Math.min(offset + LIMIT, total)}
            </span>
            <button onClick={() => search(query, offset + LIMIT)} disabled={offset + LIMIT >= total || items.length < LIMIT}
              className="px-5 py-2 rounded-xl text-sm font-semibold border disabled:opacity-40 transition-all active:scale-95"
              style={{ backgroundColor: "var(--bg-card)", color: "var(--text-secondary)", borderColor: "var(--border-light)" }}>
              Next →
            </button>
          </div>
        </motion.div>
      )}

      {/* Empty */}
      {!loading && !error && items.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-sm" style={{ color: "var(--text-hint)" }}>No results found for "{query}"</p>
        </div>
      )}
    </div>
  );
}