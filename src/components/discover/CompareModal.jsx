import React, { useEffect } from "react";
import { X, Star, Globe, Smartphone, Monitor, Check, Minus } from "lucide-react";
import DiscoverLogo from "./DiscoverLogo";

const ROWS = [
  { label: "Category", key: "category", format: v => v?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "—" },
  { label: "Pricing", key: "pricing", format: v => v || "—" },
  { label: "Rating", key: "avg_rating", format: v => v ? `${v} / 5` : "No ratings" },
  { label: "Reviews", key: "review_count", format: v => v || 0 },
  { label: "Platforms", key: "platforms", format: v => v?.join(", ") || "—" },
  { label: "Promo", key: "promo", format: v => v || "—" },
  { label: "New", key: "is_new", format: v => v ? "✓ Yes" : "No" },
  { label: "Sponsored", key: "is_sponsored", format: v => v ? "Yes" : "No" },
];

export default function CompareModal({ items, onClose }) {
  // highlight best values
  const getBest = (key) => {
    if (key === "avg_rating" || key === "review_count") {
      const vals = items.map(i => Number(i[key] || 0));
      const max = Math.max(...vals);
      return items.map(i => Number(i[key] || 0) === max && max > 0);
    }
    return items.map(() => false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" style={{ backgroundColor: "rgba(0,0,0,0.65)" }} onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl"
        style={{ backgroundColor: "#FFFFFF", boxShadow: "0 -4px 40px rgba(0,0,0,0.2)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 px-5 pt-5 pb-3 flex items-center justify-between bg-white" style={{ borderBottom: "1px solid #E5DFD0" }}>
          <h2 className="font-semibold text-base" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Compare Tools</h2>
          <button onClick={onClose} className="p-2 rounded-full" style={{ backgroundColor: "var(--bg-app)" }}>
            <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>

        <div className="px-4 pb-8">
          {/* Tool headers */}
          <div className={`grid gap-3 pt-4 pb-3`} style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
            {items.map(item => (
              <div key={item.id} className="flex flex-col items-center text-center gap-1">
                <DiscoverLogo item={item} size="md" />
                <p className="text-xs font-semibold mt-1 leading-tight" style={{ color: "var(--text-primary)" }}>{item.title}</p>
                <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>{item.brand_name}</p>
              </div>
            ))}
          </div>

          {/* Comparison rows */}
          <div className="space-y-1">
            {ROWS.map((row, ri) => {
              const best = getBest(row.key);
              return (
                <div key={row.key} className={`rounded-xl ${ri % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide px-3 pt-2 pb-0.5" style={{ color: "var(--text-hint)" }}>{row.label}</p>
                  <div className={`grid gap-2 px-3 pb-2`} style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
                    {items.map((item, idx) => (
                      <div
                        key={item.id}
                        className={`text-xs font-medium rounded-lg px-2 py-1 text-center ${best[idx] ? "text-emerald-700 bg-emerald-50 border border-emerald-200" : "text-gray-600"}`}
                      >
                        {row.format(item[row.key])}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Description comparison */}
          <div className="mt-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide mb-2 px-1" style={{ color: "var(--text-hint)" }}>About</p>
            <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
              {items.map(item => (
                <div key={item.id} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[11px] leading-relaxed text-gray-600">{item.long_description || item.description || "—"}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Visit links */}
          <div className={`grid gap-3 mt-4`} style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
            {items.map(item => item.link ? (
              <a
                key={item.id}
                href={item.link} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center py-2.5 rounded-xl text-xs font-medium"
                style={{ backgroundColor: "var(--accent-primary)", color: "#fff" }}
              >
                Visit
              </a>
            ) : <div key={item.id} />)}
          </div>
        </div>
      </div>
    </div>
  );
}