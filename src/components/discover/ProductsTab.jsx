import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import QuickVote from "./QuickVote";
import { Smartphone, Monitor, Headphones, Droplets, Cpu, Sprout } from "lucide-react";

const PRODUCT_CATEGORIES = [
  { key: "all", label: "All" },
  { key: "perfume", label: "🌸 Perfume" },
  { key: "laptop", label: "💻 Laptop" },
  { key: "earbuds", label: "🎧 Earbuds" },
  { key: "phone", label: "📱 Phone" },
  { key: "skincare", label: "✨ Skincare" },
  { key: "tech_accessories", label: "🔌 Tech Acc." },
];

const CATEGORY_ICONS = {
  perfume: "🌸",
  laptop: "💻",
  earbuds: "🎧",
  phone: "📱",
  skincare: "✨",
  tech_accessories: "🔌",
};

// Static sample products since entity may be empty initially
const SAMPLE_PRODUCTS = [
  { id: "p1", name: "Sony WH-1000XM5", category: "earbuds", description: "Over-ear wireless headphones with industry-leading noise cancellation and up to 30-hour battery life. Well regarded for long listening sessions.", insight: "Most praised for noise cancellation" },
  { id: "p2", name: "Framework Laptop 13", category: "laptop", description: "A fully modular, repairable laptop that lets you upgrade individual components. Popular with users who want longevity and control.", insight: "Popular for repairability" },
  { id: "p3", name: "Pixel 8a", category: "phone", description: "Mid-range Android phone with strong camera performance, 7 years of OS updates, and clean software. Community liked its value proposition.", insight: "Praised for camera and software" },
  { id: "p4", name: "CeraVe Moisturizing Cream", category: "skincare", description: "A fragrance-free moisturizer with ceramides, commonly recommended for dry and sensitive skin types.", insight: "Loved for gentleness and affordability" },
  { id: "p5", name: "Anker Nano Charger 30W", category: "tech_accessories", description: "Compact USB-C charger that can fast-charge most phones and small laptops. Fits easily in a bag or pocket.", insight: "Popular for travel use" },
  { id: "p6", name: "Maison Margiela Replica Beach Walk", category: "perfume", description: "A light, fresh fragrance with coconut and white musk notes. Often described as a warm-weather, everyday scent.", insight: "Popular for long-lasting scent" },
  { id: "p7", name: "Jabra Evolve2 55", category: "earbuds", description: "Business-focused wireless headset with good microphone quality and ANC. Used heavily in remote-work setups.", insight: "Top pick for call quality" },
  { id: "p8", name: "Acer Swift Go 14", category: "laptop", description: "Lightweight OLED laptop with a solid battery, competitive pricing, and a bright display. Liked by students and creators.", insight: "Noted for display quality" },
];

export default function ProductsTab() {
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: dbProducts = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.Product.list("-created_date", 100),
  });

  const allProducts = dbProducts.length > 0 ? dbProducts : SAMPLE_PRODUCTS;

  const filtered = activeCategory === "all"
    ? allProducts
    : allProducts.filter(p => p.category === activeCategory);

  return (
    <div className="pb-24">
      {/* Category chips */}
      <div className="px-5 mb-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 w-max">
          {PRODUCT_CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => setActiveCategory(c.key)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-all active:scale-95"
              style={{
                backgroundColor: activeCategory === c.key ? "var(--accent-primary)" : "var(--bg-card)",
                color: activeCategory === c.key ? "#fff" : "var(--text-secondary)",
                borderColor: activeCategory === c.key ? "var(--accent-primary)" : "var(--border-light)",
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product cards */}
      <div className="px-5 space-y-3">
        {filtered.map(product => (
          <div
            key={product.id}
            className="rounded-2xl p-4"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                style={{ backgroundColor: "var(--accent-primary-light)" }}
              >
                {CATEGORY_ICONS[product.category] || "📦"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{product.name}</p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{product.description}</p>
                {product.insight && (
                  <p className="text-[10px] mt-1.5 italic" style={{ color: "var(--accent-primary)" }}>💡 {product.insight}</p>
                )}
                <QuickVote item={product} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legal notice */}
      <p className="text-[10px] text-center px-5 mt-6" style={{ color: "var(--text-hint)" }}>
        All product names and trademarks belong to their respective owners. This platform is community-driven and not affiliated with any brand.
      </p>
    </div>
  );
}