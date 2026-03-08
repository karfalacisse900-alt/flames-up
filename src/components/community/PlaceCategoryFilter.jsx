import React from "react";

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "food", label: "🍔 Food" },
  { key: "events", label: "🎉 Events" },
  { key: "park", label: "🌳 Parks" },
  { key: "coffee", label: "☕ Cafes" },
  { key: "study_spot", label: "📚 Study" },
  { key: "hidden_spot", label: "🔍 Hidden" },
  { key: "free_activities", label: "🆓 Free" },
  { key: "travel", label: "✈️ Travel" },
  { key: "art", label: "🎨 Art" },
  { key: "nightlife", label: "🌙 Nightlife" },
];

export default function PlaceCategoryFilter({ active, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-2.5">
      {CATEGORIES.map(cat => (
        <button key={cat.key} onClick={() => onChange(cat.key)}
          className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all chip"
          style={{
            backgroundColor: active === cat.key ? "var(--accent-primary)" : "var(--bg-card)",
            borderColor: active === cat.key ? "var(--accent-primary)" : "var(--border-light)",
            color: active === cat.key ? "#fff" : "var(--text-secondary)",
          }}>
          {cat.label}
        </button>
      ))}
    </div>
  );
}