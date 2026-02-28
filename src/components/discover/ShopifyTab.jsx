import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Search, ExternalLink, ShoppingBag, ChevronRight } from "lucide-react";

function ShopifyProductCard({ product }) {
  const price = parseFloat(product.minPrice || 0).toFixed(2);
  const currency = product.currency === "USD" ? "$" : product.currency;
  const hasVariants = product.variants?.length > 1;

  return (
    <a href={product.url} target="_blank" rel="noopener noreferrer"
      className="block rounded-2xl overflow-hidden active:scale-[0.98] transition-all"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
      <div className="w-full h-44 bg-gray-100 overflow-hidden flex items-center justify-center">
        {product.image ? (
          <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
        ) : (
          <ShoppingBag className="w-12 h-12" style={{ color: "var(--text-hint)" }} />
        )}
      </div>
      <div className="p-3">
        {product.vendor && (
          <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--accent-secondary)" }}>{product.vendor}</p>
        )}
        <p className="text-sm font-semibold leading-snug line-clamp-2" style={{ color: "var(--text-primary)" }}>{product.title}</p>
        <div className="flex items-center justify-between mt-2">
          <p className="text-base font-bold" style={{ color: "var(--accent-primary)" }}>
            {currency}{price}
            {hasVariants && product.maxPrice !== product.minPrice && (
              <span className="text-xs font-normal" style={{ color: "var(--text-hint)" }}> – {currency}{parseFloat(product.maxPrice).toFixed(2)}</span>
            )}
          </p>
          <ExternalLink className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
        </div>
        {product.tags?.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-2">
            {product.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </a>
  );
}

export default function ShopifyTab() {
  const [search, setSearch] = useState("");
  const [inputVal, setInputVal] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["shopify", search],
    queryFn: () => base44.functions.invoke("shopifyProducts", { query: search, first: 20 }).then(r => r.data),
    staleTime: 20 * 60 * 1000,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(inputVal.trim());
  };

  const products = data?.products || [];

  if (data?.error === "Shopify not configured") {
    return (
      <div className="px-4 py-16 text-center">
        <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: "var(--text-hint)" }} />
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Shopify Not Connected</p>
        <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_ACCESS_TOKEN in secrets.</p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🏪</span>
        <div>
          <h2 className="text-base font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Creator Shop</h2>
          <p className="text-xs" style={{ color: "var(--text-hint)" }}>Powered by Shopify</p>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-hint)" }} />
          <input value={inputVal} onChange={e => setInputVal(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
        </div>
        <button type="submit"
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--accent-secondary)" }}>
          Search
        </button>
      </form>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-60 rounded-2xl animate-pulse" style={{ backgroundColor: "var(--bg-subtle)" }} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: "var(--text-hint)" }} />
          <p className="text-sm" style={{ color: "var(--text-hint)" }}>No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {products.map(p => <ShopifyProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}