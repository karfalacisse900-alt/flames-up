import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Search, ExternalLink, List, Layers, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

const categories = ["all", "productivity", "finance", "learning", "lifestyle", "entertainment", "health", "social", "developer_tools"];

const catColors = {
  productivity: "bg-[#EEF3F0] text-[#3C6E5A]",
  finance: "bg-[#EEF3F0] text-[#3C6E5A]",
  learning: "bg-[#EDF2F7] text-[#5579A6]",
  lifestyle: "bg-[#FDF3ED] text-[#D98B62]",
  entertainment: "bg-[#FDF3ED] text-[#D98B62]",
  health: "bg-[#EEF3F0] text-[#3C6E5A]",
  social: "bg-[#EDF2F7] text-[#5579A6]",
  developer_tools: "bg-[#F2F0EC] text-[#6E6E6E]",
};

function SwipeDiscoverCard({ item }) {
  return (
    <div className="h-full bg-white rounded-3xl p-7 flex flex-col" style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.10)" }}>
      {item.is_sponsored && (
        <span className="self-start text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 mb-4">
          Sponsored
        </span>
      )}
      <div className="flex items-center gap-4 mb-5">
        {item.logo_url ? (
          <img src={item.logo_url} alt="" className="w-16 h-16 rounded-2xl object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-[#F5F0EB] flex items-center justify-center text-2xl font-bold text-[#7C8C6E]">
            {item.title?.[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <h2 className="text-xl font-semibold text-[#2C2C2C]" style={{ fontFamily: "var(--font-serif)" }}>{item.title}</h2>
          <p className="text-sm text-[#9B9B9B]">{item.brand_name}</p>
        </div>
      </div>

      <p className="text-base text-[#6B6B6B] leading-relaxed flex-1">{item.description}</p>

      <div className="flex flex-wrap gap-2 mt-5">
        <span className={`text-xs px-3 py-1 rounded-full ${catColors[item.category] || "bg-gray-100 text-gray-700"}`}>
          {item.category?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
        </span>
        {item.promo && (
          <span className="text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
            ✓ {item.promo}
          </span>
        )}
      </div>

      {item.link && (
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-[#7C8C6E] text-white text-sm font-medium hover:bg-[#6B7B5E] transition-colors"
        >
          Visit {item.brand_name} <ExternalLink className="w-4 h-4" />
        </a>
      )}
    </div>
  );
}

export default function Discover() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("list"); // "list" | "swipe"
  const [swipeIndex, setSwipeIndex] = useState(0);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["discover"],
    queryFn: () => base44.entities.DiscoverItem.list("-created_date", 50),
  });

  const filtered = items.filter((item) => {
    const catMatch = activeCategory === "all" || item.category === activeCategory;
    const searchMatch = !search || item.title?.toLowerCase().includes(search.toLowerCase()) || item.description?.toLowerCase().includes(search.toLowerCase());
    return catMatch && searchMatch;
  });

  const prevCard = () => setSwipeIndex((i) => Math.max(0, i - 1));
  const nextCard = () => setSwipeIndex((i) => Math.min(filtered.length - 1, i + 1));

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between" style={{ backgroundColor: "var(--bg-nav)", borderBottom: "1px solid var(--border-light)" }}>
        <div>
          <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Discover</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>Curated tools, apps & services</p>
        </div>
        <button
          onClick={() => { setViewMode(viewMode === "list" ? "swipe" : "list"); setSwipeIndex(0); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)", color: "var(--text-secondary)" }}
        >
          {viewMode === "list" ? <><Layers className="w-3.5 h-3.5" /> Swipe</> : <><List className="w-3.5 h-3.5" /> List</>}
        </button>
      </div>

      {/* Search (list mode only) */}
      {viewMode === "list" && (
        <div className="px-5 mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B9B9B]" />
            <Input
              placeholder="Search tools & services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 border-[#EDE9E3] rounded-xl bg-white"
            />
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="px-5 mb-4 overflow-x-auto scrollbar-hide mt-3">
        <div className="flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setSwipeIndex(0); }}
              className="px-3 py-1.5 text-xs rounded-full border whitespace-nowrap transition-all"
              style={{
                backgroundColor: activeCategory === cat ? "var(--accent-primary)" : "var(--bg-nav)",
                color: activeCategory === cat ? "#fff" : "var(--text-secondary)",
                borderColor: activeCategory === cat ? "var(--accent-primary)" : "var(--border-light)",
              }}
            >
              {cat === "all" ? "All" : cat.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
        </div>
      ) : viewMode === "swipe" ? (
        /* ---- SWIPE VIEW ---- */
        <div className="px-5 pb-24">
          {filtered.length === 0 ? (
            <div className="text-center py-16"><p className="text-sm text-[#9B9B9B]">Nothing found</p></div>
          ) : (
            <>
              <div style={{ height: "60vh" }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={filtered[swipeIndex]?.id}
                    className="h-full"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.2 }}
                  >
                    {filtered[swipeIndex] && <SwipeDiscoverCard item={filtered[swipeIndex]} />}
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="flex items-center justify-center gap-6 mt-4">
                <button onClick={prevCard} disabled={swipeIndex === 0} className="p-3 rounded-full bg-white border border-[#EDE9E3] disabled:opacity-30">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-xs text-[#9B9B9B]">{swipeIndex + 1} / {filtered.length}</span>
                <button onClick={nextCard} disabled={swipeIndex === filtered.length - 1} className="p-3 rounded-full bg-white border border-[#EDE9E3] disabled:opacity-30">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        /* ---- LIST VIEW ---- */
        <div className="px-5 space-y-3 pb-24">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-sm text-[#9B9B9B]">No items found</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div key={item.id} className="rounded-2xl p-4 hover:shadow-sm transition-shadow" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                <div className="flex items-start gap-3">
                  {item.logo_url ? (
                    <img src={item.logo_url} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold shrink-0" style={{ backgroundColor: "var(--bg-app)", color: "var(--accent-primary)" }}>
                      {item.title?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>{item.title}</h3>
                      {item.is_sponsored && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: "rgba(217,139,98,0.1)", color: "var(--accent-secondary)", border: "1px solid rgba(217,139,98,0.3)" }}>Sponsored</span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>{item.brand_name}</p>
                    <p className="text-sm mt-1.5 line-clamp-2" style={{ color: "var(--text-secondary)" }}>{item.description}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${catColors[item.category] || "bg-[#F2F0EC] text-[#6E6E6E]"}`} style={{ borderColor: "var(--border-medium)" }}>
                        {item.category?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                      {item.promo && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(60,110,90,0.08)", color: "var(--accent-primary)", border: "1px solid rgba(60,110,90,0.2)" }}>
                          ✓ {item.promo}
                        </span>
                      )}
                    </div>
                  </div>
                  {item.link && (
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="p-2 shrink-0 transition-colors" style={{ color: "var(--text-hint)" }}>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}