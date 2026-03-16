import React from "react";

export const MAP_CATEGORIES = [
  { key: "all",          label: "All",          emoji: "🗺️",  color: "#4F46E5" },
  { key: "food",         label: "Food",          emoji: "🍔",  color: "#EF4444" },
  { key: "cafe",         label: "Café",          emoji: "☕",  color: "#92400E" },
  { key: "park",         label: "Park",          emoji: "🌳",  color: "#16A34A" },
  { key: "events",       label: "Events",        emoji: "🎉",  color: "#7C3AED" },
  { key: "hidden_spot",  label: "Hidden",        emoji: "🔍",  color: "#0891B2" },
  { key: "shopping",     label: "Shopping",      emoji: "🛍️",  color: "#DB2777" },
  { key: "study_spot",   label: "Study",         emoji: "📚",  color: "#D97706" },
  { key: "travel",       label: "Travel",        emoji: "✈️",  color: "#0284C7" },
];

export default function MapCategoryCarousel({ active, onChange }) {
  return (
    <div
      className="absolute top-4 left-0 right-0 z-20 px-3"
      style={{ pointerEvents: "none" }}
    >
      <div
        className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
        style={{ pointerEvents: "auto" }}
      >
        {MAP_CATEGORIES.map(cat => {
          const isActive = active.includes(cat.key);
          return (
            <button
              key={cat.key}
              onClick={() => {
                if (cat.key === "all") {
                  onChange(["all"]);
                } else {
                  const next = active.includes("all")
                    ? [cat.key]
                    : isActive
                    ? active.filter(k => k !== cat.key).length === 0
                      ? ["all"]
                      : active.filter(k => k !== cat.key)
                    : [...active.filter(k => k !== "all"), cat.key];
                  onChange(next);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full whitespace-nowrap shrink-0 text-xs font-bold transition-all"
              style={{
                backgroundColor: isActive ? cat.color : "rgba(255,255,255,0.9)",
                color: isActive ? "#fff" : "#374151",
                backdropFilter: "blur(12px)",
                boxShadow: isActive
                  ? `0 4px 16px ${cat.color}55`
                  : "0 2px 8px rgba(0,0,0,0.12)",
                border: isActive ? `2px solid ${cat.color}` : "2px solid transparent",
                transform: isActive ? "scale(1.04)" : "scale(1)",
                transition: "all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}