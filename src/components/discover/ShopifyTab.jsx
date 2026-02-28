import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, ExternalLink, ChevronRight, ShoppingBag } from "lucide-react";

export default function ShopifyTab() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [inputVal, setInputVal] = useState("");
  const [pageInfo, setPageInfo] = useState(null);

  const fetchProducts = async (q = "", after = null) => {
    setLoading(true);
    setError(null);
    const res = await base44.functions.invoke("shopifyProducts", { query: q, first: 20, after });
    setLoading(false);
    if (res.data?.error) {
      setError(res.data.error);
      return;
    }
    setProducts(res.data?.products || []);
    setPageInfo(res.data?.pageInfo || null);
    setSearch(q);
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleSubmit = (e) => { e.preventDefault(); fetchProducts(inputVal); };

  if (loading && products.length === 0) return (
    <div className="flex justify-center py-20">
      <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
    </div>
  );

  if (error) return (
    <div className="px-4 py-10 text-center">
      <p className="text-4xl mb-3">🛍️</p>
      <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Shop coming soon</p>
      <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>Store not yet configured</p>
    </div>
  );

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">🛍️</span>
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Creator Shop</h2>
        </div>
        <p className="text-xs" style={{ color: "var(--text-hint)" }}>Exclusive products & collaborations</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSubmit} className="px-4 mb-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-hint)" }} />
            <input value={inputVal} onChange={e => setInputVal(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
          </div>
          <button type="submit" className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: "var(--accent-primary)" }}>
            Search
          </button>
        </div>
      </form>

      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
        </div>
      )}

      {!loading && (
        <>
          {products.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: "var(--text-hint)" }} />
              <p className="text-sm" style={{ color: "var(--text-hint)" }}>No products found</p>
            </div>
          ) : (
            <div className="px-4 grid grid-cols-2 gap-3">
              {products.map(product => (
                <div key={product.id} className="rounded-2xl overflow-hidden"
                  style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                  {product.image ? (
                    <div className="aspect-square overflow-hidden">
                      <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="aspect-square flex items-center justify-center" style={{ backgroundColor: "var(--bg-subtle)" }}>
                      <ShoppingBag className="w-10 h-10" style={{ color: "var(--text-hint)" }} />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-xs font-semibold line-clamp-2 mb-1" style={{ color: "var(--text-primary)" }}>{product.title}</p>
                    {product.vendor && <p className="text-[10px] mb-1" style={{ color: "var(--text-hint)" }}>{product.vendor}</p>}
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-sm font-bold" style={{ color: "var(--accent-primary)" }}>
                        {product.minPrice === product.maxPrice
                          ? `$${parseFloat(product.minPrice).toFixed(2)}`
                          : `$${parseFloat(product.minPrice).toFixed(2)}+`}
                      </p>
                      <a href={product.url} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-white"
                        style={{ backgroundColor: "var(--accent-primary)" }}>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pageInfo?.hasNextPage && (
            <div className="px-4 mt-4">
              <button onClick={() => fetchProducts(search, pageInfo.endCursor)}
                className="w-full py-3 rounded-xl text-sm font-semibold border"
                style={{ backgroundColor: "var(--bg-card)", color: "var(--text-secondary)", borderColor: "var(--border-light)" }}>
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}