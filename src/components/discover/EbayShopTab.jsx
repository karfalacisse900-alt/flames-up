import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShoppingCart, Sparkles, ExternalLink } from "lucide-react";

const CATEGORIES = [
  { label: "Mix", emoji: "✨", query: null, mixed: true },
  { label: "Headphones", emoji: "🎧", query: "headphones wireless" },
  { label: "Phones", emoji: "📱", query: "smartphone unlocked" },
  { label: "Laptops", emoji: "💻", query: "laptop computer" },
  { label: "Sneakers", emoji: "👟", query: "sneakers nike adidas" },
  { label: "Watches", emoji: "⌚", query: "smartwatch" },
  { label: "Gaming", emoji: "🎮", query: "gaming controller" },
  { label: "Bags", emoji: "👜", query: "designer handbag backpack" },
];

function EbayCard({ item, index }) {
  const heights = [180, 140, 200, 150, 170, 130];
  const h = heights[index % heights.length];

  return (
    <motion.a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      whileTap={{ scale: 0.97 }}
      className="block rounded-2xl overflow-hidden mb-3"
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-light)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        display: "inline-block",
        width: "100%",
      }}
    >
      <div className="relative overflow-hidden" style={{ height: h }}>
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.9)" }}>
          <ExternalLink className="w-3 h-3" style={{ color: "var(--accent-primary)" }} />
        </div>
      </div>
      <div className="p-2.5">
        <p className="text-xs font-medium leading-snug line-clamp-2 mb-1.5"
          style={{ color: "var(--text-primary)" }}>{item.title}</p>
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold" style={{ color: "var(--accent-primary)" }}>
            ${parseFloat(item.price || 0).toFixed(2)}
          </p>
          {item.condition && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>
              {item.condition.split(" ")[0]}
            </span>
          )}
        </div>
      </div>
    </motion.a>
  );
}

export default function EbayShopTab() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [inputVal, setInputVal] = useState("");
  const [searchQuery, setSearchQuery] = useState(null);
  const LIMIT = 20;

  useEffect(() => {
    loadCategory(CATEGORIES[0], 0);
  }, []);

  const loadCategory = async (cat, off = 0) => {
    setLoading(true);
    setError(null);
    setOffset(off);
    setActiveCategory(cat);
    setSearchQuery(null);
    setInputVal("");

    const payload = cat.mixed
      ? { query: "popular products", limit: LIMIT, offset: off, mixed: true }
      : { query: cat.query, limit: LIMIT, offset: off };

    const res = await base44.functions.invoke("ebaySearch", payload);
    setLoading(false);
    if (res.data?.error) { setError(res.data.error); return; }
    const withImages = (res.data?.items || []).filter(i => i.image && i.image.trim() !== "");
    setItems(withImages);
    setTotal(res.data?.total || 0);
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!inputVal.trim()) return;
    setLoading(true);
    setError(null);
    setActiveCategory(null);
    setSearchQuery(inputVal.trim());

    const res = await base44.functions.invoke("ebaySearch", { query: inputVal.trim(), limit: LIMIT, offset: 0 });
    setLoading(false);
    if (res.data?.error) { setError(res.data.error); return; }
    const withImages = (res.data?.items || []).filter(i => i.image && i.image.trim() !== "");
    setItems(withImages);
    setTotal(res.data?.total || 0);
    setOffset(0);
  };

  const handlePaginate = async (newOffset) => {
    setLoading(true);
    const q = searchQuery || activeCategory?.query || "popular products";
    const mixed = !searchQuery && activeCategory?.mixed;
    const res = await base44.functions.invoke("ebaySearch", { query: q, limit: LIMIT, offset: newOffset, mixed: !!mixed });
    setLoading(false);
    const withImages = (res.data?.items || []).filter(i => i.image && i.image.trim() !== "");
    setItems(withImages);
    setOffset(newOffset);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const col1 = items.filter((_, i) => i % 2 === 0);
  const col2 = items.filter((_, i) => i % 2 === 1);

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🛒</span>
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
            eBay Shop
          </h2>
          <Sparkles className="w-4 h-4 ml-auto" style={{ color: "var(--accent-secondary)" }} />
        </div>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>Real products, real prices</p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="px-4 mb-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-hint)" }} />
            <input
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              placeholder="Search anything on eBay..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
            />
          </div>
          <button type="submit"
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: "var(--accent-primary)" }}>
            Go
          </button>
        </div>
      </form>

      {/* Category pills */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {CATEGORIES.map(cat => {
            const isActive = activeCategory?.label === cat.label && !searchQuery;
            return (
              <button key={cat.label} onClick={() => loadCategory(cat, 0)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl shrink-0 text-xs font-semibold transition-all active:scale-95"
                style={{
                  backgroundColor: isActive ? "var(--accent-primary)" : "var(--bg-card)",
                  color: isActive ? "#fff" : "var(--text-secondary)",
                  border: `1.5px solid ${isActive ? "var(--accent-primary)" : "var(--border-light)"}`,
                }}>
                <span className="text-sm">{cat.emoji}</span>
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
            style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }}
          />
          <p className="text-xs" style={{ color: "var(--text-hint)" }}>Loading products...</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="mx-4 p-4 rounded-2xl text-sm text-center" style={{ backgroundColor: "#FEF2F2", color: "#EF4444", border: "1px solid #fecaca" }}>
          <p className="font-semibold mb-1">Could not load products</p>
          <p className="text-xs opacity-80">{error}</p>
          <button onClick={() => loadCategory(CATEGORIES[0], 0)} className="mt-2 px-4 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: "var(--accent-primary)" }}>
            Try Again
          </button>
        </div>
      )}

      {/* Results */}
      {!loading && !error && items.length > 0 && (
        <AnimatePresence mode="wait">
          <motion.div key={`${activeCategory?.label}-${searchQuery}-${offset}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="px-4 mb-2">
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>
                {searchQuery ? <>Results for <strong style={{ color: "var(--text-primary)" }}>"{searchQuery}"</strong></> : activeCategory?.label === "Mix" ? "Trending across all categories" : <>Top <strong style={{ color: "var(--text-primary)" }}>{activeCategory?.label}</strong> deals</>}
              </p>
            </div>

            <div className="px-4 flex gap-3">
              <div className="flex-1 flex flex-col">
                {col1.map((item, i) => <EbayCard key={item.id} item={item} index={i * 2} />)}
              </div>
              <div className="flex-1 flex flex-col mt-6">
                {col2.map((item, i) => <EbayCard key={item.id} item={item} index={i * 2 + 1} />)}
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-3 px-4 mt-4">
              <button
                onClick={() => handlePaginate(Math.max(0, offset - LIMIT))}
                disabled={offset === 0}
                className="px-5 py-2 rounded-xl text-sm font-semibold border disabled:opacity-40"
                style={{ backgroundColor: "var(--bg-card)", color: "var(--text-secondary)", borderColor: "var(--border-light)" }}>
                ← Prev
              </button>
              <span className="text-xs" style={{ color: "var(--text-hint)" }}>
                Page {Math.floor(offset / LIMIT) + 1}
              </span>
              <button
                onClick={() => handlePaginate(offset + LIMIT)}
                disabled={items.length < LIMIT}
                className="px-5 py-2 rounded-xl text-sm font-semibold border disabled:opacity-40"
                style={{ backgroundColor: "var(--bg-card)", color: "var(--text-secondary)", borderColor: "var(--border-light)" }}>
                Next →
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Empty */}
      {!loading && !error && items.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-sm" style={{ color: "var(--text-hint)" }}>No results found</p>
        </div>
      )}
    </div>
  );
}