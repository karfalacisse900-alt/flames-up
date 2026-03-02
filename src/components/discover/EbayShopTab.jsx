import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShoppingCart, Sparkles, TrendingUp } from "lucide-react";

const DEFAULT_QUERIES = ["Headphones", "Sneakers", "Gaming Chair", "Watches", "AirPods"];


const PLACEHOLDER_IMAGES = {
  "Headphones": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80",
  "Sneakers": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
  "Gaming Chair": "https://images.unsplash.com/photo-1616599382690-e14de6b74e17?w=400&q=80",
  "Watches": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80",
  "AirPods": "https://images.unsplash.com/photo-1588423771073-b8903fead85b?w=400&q=80",
};

function getPlaceholderImage(title, query) {
  // Try to match a keyword from the query or title
  const key = Object.keys(PLACEHOLDER_IMAGES).find(k =>
    query?.toLowerCase().includes(k.toLowerCase()) || title?.toLowerCase().includes(k.toLowerCase())
  );
  return key
    ? PLACEHOLDER_IMAGES[key]
    : `https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&q=80`; // generic shopping
}

function EbayCard({ item, index, query }) {
  const imgSrc = item.image || item.thumbnail || getPlaceholderImage(item.title, query);
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
      <img src={imgSrc} alt={item.title} className="w-full object-cover"
        style={{ height: index % 3 === 0 ? 200 : 150 }}
        onError={e => { e.target.src = getPlaceholderImage(item.title, query); }} />
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
  const [query, setQuery] = useState("");
  const [inputVal, setInputVal] = useState("");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const LIMIT = 20;

  const CATEGORIES = [
    { label: "Headphones", emoji: "🎧", q: "Headphones" },
    { label: "Sneakers", emoji: "👟", q: "Sneakers" },
    { label: "Gaming", emoji: "🎮", q: "Gaming Chair" },
    { label: "Watches", emoji: "⌚", q: "Watches" },
    { label: "AirPods", emoji: "🎵", q: "AirPods" },
    { label: "iPhone", emoji: "📱", q: "iPhone" },
  ];

  // Auto-load default products on mount
  useEffect(() => {
    const randomQ = DEFAULT_QUERIES[Math.floor(Math.random() * DEFAULT_QUERIES.length)];
    search(randomQ, 0, true);
  }, []);

  const search = async (q, off = 0, isDefault = false) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    if (!isDefault) setInputVal(q);
    const res = await base44.functions.invoke("ebaySearch", { query: q, limit: LIMIT, offset: off });
    setLoading(false);
    if (res.data?.error) { setError(res.data.error); return; }
    setItems(res.data?.items || []);
    setTotal(res.data?.total || 0);
    setOffset(off);
    setQuery(q);
  };

  const handleSubmit = (e) => { e.preventDefault(); search(inputVal); };

  const handleCategory = (cat) => {
    setActiveCategory(cat.q);
    search(cat.q);
  };

  // Split items into two columns for masonry
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
      <form onSubmit={handleSubmit} className="px-4 mb-3">
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
      <div className="px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.q;
            return (
              <button key={cat.q} onClick={() => handleCategory(cat)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl shrink-0 text-xs font-semibold transition-all active:scale-95"
                style={{
                  backgroundColor: isActive ? "var(--accent-primary)" : "var(--bg-card)",
                  color: isActive ? "#fff" : "var(--text-secondary)",
                  border: `1.5px solid ${isActive ? "var(--accent-primary)" : "var(--border-light)"}`,
                }}>
                <span className="text-base">{cat.emoji}</span>
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
            className="w-7 h-7 border-2 rounded-full"
            style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
          <p className="text-xs" style={{ color: "var(--text-hint)" }}>Searching eBay...</p>
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
              {total.toLocaleString()} results for <span style={{ color: "var(--text-primary)" }}>"{query}"</span>
            </p>
          </div>

          {/* 2-col masonry */}
          <div className="px-4 flex gap-3">
            <div className="flex-1 flex flex-col">
              {col1.map((item, i) => <EbayCard key={item.id} item={item} index={i * 2} query={query} />)}
            </div>
            <div className="flex-1 flex flex-col mt-5">
              {col2.map((item, i) => <EbayCard key={item.id} item={item} index={i * 2 + 1} query={query} />)}
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
            <button onClick={() => search(query, offset + LIMIT)} disabled={offset + LIMIT >= total}
              className="px-5 py-2 rounded-xl text-sm font-semibold border disabled:opacity-40 transition-all active:scale-95"
              style={{ backgroundColor: "var(--bg-card)", color: "var(--text-secondary)", borderColor: "var(--border-light)" }}>
              Next →
            </button>
          </div>
        </motion.div>
      )}

      {/* Empty */}
      {!loading && !error && query && items.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-sm" style={{ color: "var(--text-hint)" }}>No results for "{query}"</p>
        </div>
      )}
    </div>
  );
}