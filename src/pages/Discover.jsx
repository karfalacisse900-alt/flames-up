import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Search, ExternalLink, Star, Tag, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const categories = ["all", "productivity", "finance", "learning", "lifestyle", "entertainment", "health", "social", "developer_tools"];

const catColors = {
  productivity: "bg-blue-50 text-blue-700",
  finance: "bg-emerald-50 text-emerald-700",
  learning: "bg-violet-50 text-violet-700",
  lifestyle: "bg-pink-50 text-pink-700",
  entertainment: "bg-amber-50 text-amber-700",
  health: "bg-green-50 text-green-700",
  social: "bg-indigo-50 text-indigo-700",
  developer_tools: "bg-gray-100 text-gray-700",
};

export default function Discover() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["discover"],
    queryFn: () => base44.entities.DiscoverItem.list("-created_date", 50),
  });

  const filtered = items.filter((item) => {
    const catMatch = activeCategory === "all" || item.category === activeCategory;
    const searchMatch = !search || item.title?.toLowerCase().includes(search.toLowerCase()) || item.description?.toLowerCase().includes(search.toLowerCase());
    return catMatch && searchMatch;
  });

  return (
    <div className="min-h-screen">
      <div className="px-5 pt-5 pb-3">
        <h1 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>
          Discover
        </h1>
        <p className="text-xs text-[#9B9B9B] mt-0.5">Curated tools, apps & services</p>
      </div>

      {/* Search */}
      <div className="px-5 mb-4">
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

      {/* Categories */}
      <div className="px-5 mb-5 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 text-xs rounded-full border whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? "bg-[#7C8C6E] text-white border-[#7C8C6E]"
                  : "bg-white text-[#6B6B6B] border-[#EDE9E3] hover:border-[#7C8C6E]"
              }`}
            >
              {cat === "all" ? "All" : cat.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {/* Items */}
      <div className="px-5 space-y-3 pb-24">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#7C8C6E] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-sm text-[#9B9B9B]">No items found</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-4 border border-[#EDE9E3] hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-3">
                {item.logo_url ? (
                  <img src={item.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-[#F5F0EB] flex items-center justify-center text-lg">
                    {item.title?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-[#2C2C2C] truncate">{item.title}</h3>
                    {item.is_sponsored && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200">
                        Sponsored
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#9B9B9B] mt-0.5">{item.brand_name}</p>
                  <p className="text-sm text-[#6B6B6B] mt-1.5 line-clamp-2">{item.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${catColors[item.category] || "bg-gray-100 text-gray-700"}`}>
                      {item.category?.replace(/_/g, " ")}
                    </span>
                    {item.promo && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                        {item.promo}
                      </span>
                    )}
                  </div>
                </div>
                {item.link && (
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="p-2 text-[#9B9B9B] hover:text-[#7C8C6E]">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}