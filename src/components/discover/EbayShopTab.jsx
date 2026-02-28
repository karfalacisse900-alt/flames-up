import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Search, ExternalLink, ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";

function EbayProductCard({ item }) {
  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer"
      className="flex gap-3 p-3 rounded-2xl active:scale-[0.98] transition-all"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
      <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center">
        {item.image ? (
          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <ShoppingCart className="w-8 h-8" style={{ color: "var(--text-hint)" }} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug line-clamp-2" style={{ color: "var(--text-primary)" }}>{item.title}</p>
        <div className="flex items-center justify-between mt-2">
          <p className="text-base font-bold" style={{ color: "var(--accent-primary)" }}>
            {item.currency === "USD" ? "$" : item.currency}{parseFloat(item.price || 0).toFixed(2)}
          </p>
          {item.condition && (
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>
              {item.condition}
            </span>
          )}
        </div>
        {item.seller && (
          <p className="text-[10px] mt-0.5" style={{ color: "var(--text-hint)" }}>by {item.seller}</p>
        )}
      </div>
      <ExternalLink className="w-4 h-4 shrink-0 mt-1" style={{ color: "var(--text-hint)" }} />
    </a>
  );
}

export default function EbayShopTab() {
  const [search, setSearch] = useState("trending tech gadgets");
  const [inputVal, setInputVal] = useState("");
  const [offset, setOffset] = useState(0);
  const LIMIT = 20;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["ebay", search, offset],
    queryFn: () => base44.functions.invoke("ebaySearch", { query: search, limit: LIMIT, offset }).then(r => r.data),
    enabled: !!search,
    staleTime: 15 * 60 * 1000,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (inputVal.trim()) {
      setSearch(inputVal.trim());
      setOffset(0);
    }
  };

  const items = data?.items || [];
  const total = data?.total || 0;

  return (
    <div className="px-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🛍</span>
        <div>
          <h2 className="text-base font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Shop</h2>
          <p className="text-xs" style={{ color: "var(--text-hint)" }}>Powered by eBay</p>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-hint)" }} />
          <input
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            placeholder="Search eBay..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
          />
        </div>
        <button type="submit"
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--accent-primary)" }}>
          Search
        </button>
      </form>

      {/* Quick searches */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-5">
        {["Tech Gadgets", "Sneakers", "Vintage", "Gaming", "Fashion", "Home"].map(tag => (
          <button key={tag} onClick={() => { setSearch(tag); setOffset(0); setInputVal(""); }}
            className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all"
            style={{
              backgroundColor: search === tag ? "var(--accent-primary)" : "var(--bg-card)",
              color: search === tag ? "#fff" : "var(--text-secondary)",
              border: "1px solid var(--border-light)",
            }}>
            {tag}
          </button>
        ))}
      </div>

      {/* Results */}
      {isLoading || isFetching ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ backgroundColor: "var(--bg-subtle)" }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🛒</p>
          <p className="text-sm" style={{ color: "var(--text-hint)" }}>No results found</p>
        </div>
      ) : (
        <>
          <p className="text-xs mb-3" style={{ color: "var(--text-hint)" }}>{total.toLocaleString()} results for "{search}"</p>
          <div className="space-y-3">
            {items.map(item => <EbayProductCard key={item.id} item={item} />)}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <button onClick={() => setOffset(Math.max(0, offset - LIMIT))} disabled={offset === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-40"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-secondary)" }}>
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <p className="text-xs" style={{ color: "var(--text-hint)" }}>{offset + 1}–{Math.min(offset + LIMIT, total)}</p>
            <button onClick={() => setOffset(offset + LIMIT)} disabled={offset + LIMIT >= total}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-40"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-secondary)" }}>
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}