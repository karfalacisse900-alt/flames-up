import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Search, ShoppingCart, Sparkles } from "lucide-react";

const CATEGORIES = [
  { label: "Mixed", emoji: "✨", q: null, mixed: true },
  { label: "Headphones", emoji: "🎧", q: "wireless headphones" },
  { label: "Laptops", emoji: "💻", q: "laptop computer" },
  { label: "Phones", emoji: "📱", q: "smartphone" },
  { label: "Gaming", emoji: "🎮", q: "gaming console" },
  { label: "Watches", emoji: "⌚", q: "smartwatch" },
  { label: "Speakers", emoji: "🔊", q: "bluetooth speaker" },
];

function EbayCard({ item, index }) {
  const heights = [180, 140, 200, 160, 190, 145, 175];
  const imgHeight = heights[index % heights.length];

  return (
    <motion.a
      href={item.url} target="_blank" rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.5) }}
      whileTap={{ scale: 0.97 }}
      className="block rounded-2xl overflow-hidden mb-3"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
    >
      <div style={{ height: imgHeight, overflow: "hidden", backgroundColor: "var(--bg-subtle)" }}>
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover"
          onError={e => {
            e.target.style.display = "none";
            e.target.parentNode.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:32px;">🛒</div>`;
          }}
        />
      </div>
      <div className="p-2.5">
        <p className="text-xs font-medium leading-snug line-clamp-2 mb-1.5" style={{ color: "var(--text-primary)" }}>{item.title}</p>
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold" style={{ color: "var(--accent-primary)" }}>
            ${parseFloat(item.price || 0).toFixed(2)}
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
  const [query, setQuery] = useState("Featured");
  const [inputVal, setInputVal] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("mixed");

  const doSearch = async ({ q, mixed = false }) => {
    setLoading(true);
    setError(null);
    const res = await base44.functions.invoke("ebaySearch", {
      query: q || "electronics",
      limit: 20,
      offset: 0,
      mixed,
    });
    setLoading(false);
    if (res.data?.error) { setError(res.data.error); return; }
    const withImages = (res.data?.items || []).filter(i => i.image && i.url && !i.url.includes("sandbox"));
    setItems(withImages);
  };

  // Load mixed feed on mount
  useEffect(() => {
    doSearch({ q: "electronics", mixed: true });
  }, []);

  const handleCategoryClick = (cat) => {
    setInputVal("");
    if (cat.mixed) {
      setActiveCategory("mixed");
      setQuery("Featured Mix");
      doSearch({ q: "electronics", mixed: true });
    } else {
      setActiveCategory(cat.q);
      setQuery(cat.label);
      doSearch({ q: cat.q });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    setActiveCategory(null);
    setQuery(inputVal);
    doSearch({ q: inputVal });
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
        <p className="text-xs" style={{ color: "var(--text-hint)" }}>Millions of real products, best deals</p>
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
            Go
          </button>
        </div>
      </form>

      {/* Category pills */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {CATEGORIES.map(cat => {
            const key = cat.mixed ? "mixed" : cat.q;
            const isActive = activeCategory === key;
            return (
              <button key={key} onClick={() => handleCategoryClick(cat)}
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
          <p className="text-xs" style={{ color: "var(--text-hint)" }}>Loading products...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mx-4 p-4 rounded-2xl text-sm text-center" style={{ backgroundColor: "#FEF2F2", color: "#EF4444" }}>
          ⚠️ {error}
        </div>
      )}

      {/* Results */}
      {!loading && items.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="px-4 mb-3">
            <p className="text-xs font-semibold" style={{ color: "var(--text-hint)" }}>
              Showing <span style={{ color: "var(--text-primary)" }}>"{query}"</span> · {items.length} items
            </p>
          </div>
          <div className="px-4 flex gap-3">
            <div className="flex-1 flex flex-col">
              {col1.map((item, i) => <EbayCard key={item.id} item={item} index={i * 2} />)}
            </div>
            <div className="flex-1 flex flex-col mt-5">
              {col2.map((item, i) => <EbayCard key={item.id} item={item} index={i * 2 + 1} />)}
            </div>
          </div>
        </motion.div>
      )}

      {/* Empty */}
      {!loading && !error && items.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-sm" style={{ color: "var(--text-hint)" }}>No results for "{query}"</p>
        </div>
      )}
    </div>
  );
}