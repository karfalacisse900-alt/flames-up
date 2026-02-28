import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Search, ExternalLink, ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";

export default function EbayShopTab() {
  const [query, setQuery] = useState("");
  const [inputVal, setInputVal] = useState("");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const LIMIT = 20;

  const search = async (q, off = 0) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    const res = await base44.functions.invoke("ebaySearch", { query: q, limit: LIMIT, offset: off });
    setLoading(false);
    if (res.data?.error) { setError(res.data.error); return; }
    setItems(res.data?.items || []);
    setTotal(res.data?.total || 0);
    setOffset(off);
    setQuery(q);
  };

  const handleSubmit = (e) => { e.preventDefault(); search(inputVal); };

  const POPULAR = ["Headphones", "Sneakers", "iPhone", "Gaming Chair", "Vintage Watch"];

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">🛒</span>
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>eBay Shop</h2>
        </div>
        <p className="text-xs" style={{ color: "var(--text-hint)" }}>Search millions of products from eBay</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSubmit} className="px-4 mb-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-hint)" }} />
            <input value={inputVal} onChange={e => setInputVal(e.target.value)}
              placeholder="Search eBay products..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
          </div>
          <button type="submit" className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: "var(--accent-primary)" }}>
            Search
          </button>
        </div>
      </form>

      {/* Popular searches */}
      {!query && (
        <div className="px-4 mb-6">
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Popular searches</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR.map(p => (
              <button key={p} onClick={() => { setInputVal(p); search(p); }}
                className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                style={{ backgroundColor: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}>
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mx-4 p-4 rounded-2xl text-sm text-center" style={{ backgroundColor: "#FEF2F2", color: "#EF4444" }}>
          {error}
        </div>
      )}

      {/* Results */}
      {!loading && items.length > 0 && (
        <>
          <div className="px-4 mb-3 flex items-center justify-between">
            <p className="text-xs" style={{ color: "var(--text-hint)" }}>{total.toLocaleString()} results for "{query}"</p>
          </div>
          <div className="px-4 grid grid-cols-2 gap-3">
            {items.map(item => (
              <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer"
                className="block rounded-2xl overflow-hidden transition-all active:scale-95"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                <div className="aspect-square w-full overflow-hidden bg-gray-100">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingCart className="w-8 h-8" style={{ color: "var(--text-hint)" }} />
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-medium line-clamp-2 leading-relaxed mb-1" style={{ color: "var(--text-primary)" }}>{item.title}</p>
                  <p className="text-sm font-bold" style={{ color: "var(--accent-primary)" }}>
                    {item.currency === "USD" ? "$" : item.currency}{parseFloat(item.price || 0).toFixed(2)}
                  </p>
                  {item.condition && (
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--text-hint)" }}>{item.condition}</p>
                  )}
                </div>
              </a>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-3 px-4 mt-6">
            <button onClick={() => search(query, Math.max(0, offset - LIMIT))} disabled={offset === 0}
              className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium border disabled:opacity-40"
              style={{ backgroundColor: "var(--bg-card)", color: "var(--text-secondary)", borderColor: "var(--border-light)" }}>
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <span className="text-xs" style={{ color: "var(--text-hint)" }}>
              {offset + 1}–{Math.min(offset + LIMIT, total)} of {total}
            </span>
            <button onClick={() => search(query, offset + LIMIT)} disabled={offset + LIMIT >= total}
              className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium border disabled:opacity-40"
              style={{ backgroundColor: "var(--bg-card)", color: "var(--text-secondary)", borderColor: "var(--border-light)" }}>
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}

      {/* Empty state */}
      {!loading && !error && query && items.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-sm" style={{ color: "var(--text-hint)" }}>No results for "{query}"</p>
        </div>
      )}
    </div>
  );
}