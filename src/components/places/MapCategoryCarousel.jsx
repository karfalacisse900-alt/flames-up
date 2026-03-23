import React, { useState } from "react";

export const MAP_CATEGORIES = [
  { key: "all",         label: "All",         emoji: "🗺️",  color: "#4F46E5" },
  { key: "restaurant",  label: "Restaurants",  emoji: "🍽️",  color: "#EF4444" },
  { key: "cafe",        label: "Cafes",        emoji: "☕",  color: "#92400E" },
  { key: "fast_food",   label: "Fast Food",    emoji: "🍔",  color: "#F97316" },
  { key: "park",        label: "Parks",        emoji: "🌳",  color: "#16A34A" },
  { key: "shopping",    label: "Shopping",     emoji: "🛍️",  color: "#DB2777" },
  { key: "grocery",     label: "Grocery",      emoji: "🛒",  color: "#16A34A" },
  { key: "gas",         label: "Gas Stations", emoji: "⛽",  color: "#64748B" },
  { key: "hotel",       label: "Hotels",       emoji: "🏨",  color: "#0284C7" },
  { key: "bar",         label: "Bars",         emoji: "🍻",  color: "#7C3AED" },
  { key: "hospital",    label: "Hospitals",    emoji: "🏥",  color: "#DC2626" },
  { key: "pharmacy",    label: "Pharmacy",     emoji: "💊",  color: "#059669" },
  { key: "entertainment",label: "Entertainment",emoji: "🎭", color: "#D97706" },
  { key: "gym",         label: "Gyms",         emoji: "💪",  color: "#0891B2" },
  { key: "more",        label: "More",         emoji: "➕",  color: "#475569" },
];

export const MORE_CATEGORIES = [
  { key: "study_spot",  label: "Study Spots",  emoji: "📚",  color: "#D97706" },
  { key: "travel",      label: "Travel",       emoji: "✈️",  color: "#0284C7" },
  { key: "events",      label: "Events",       emoji: "🎉",  color: "#7C3AED" },
  { key: "hidden_spot", label: "Hidden Gems",  emoji: "🔍",  color: "#0891B2" },
  { key: "bank",        label: "Banks/ATM",    emoji: "🏦",  color: "#1D4ED8" },
  { key: "school",      label: "Schools",      emoji: "🏫",  color: "#92400E" },
  { key: "church",      label: "Churches",     emoji: "⛪",  color: "#6B7280" },
  { key: "parking",     label: "Parking",      emoji: "🅿️",  color: "#374151" },
  { key: "spa",         label: "Spa & Wellness",emoji: "💆", color: "#BE185D" },
  { key: "airport",     label: "Airport",      emoji: "🛫",  color: "#0369A1" },
];

export default function MapCategoryCarousel({ active, onChange }) {
  const [showMore, setShowMore] = useState(false);

  const handleSelect = (cat) => {
    if (cat.key === "more") {
      setShowMore(v => !v);
      return;
    }
    if (cat.key === "all") {
      onChange(["all"]);
      return;
    }
    const next = active.includes("all")
      ? [cat.key]
      : active.includes(cat.key)
        ? active.filter(k => k !== cat.key).length === 0 ? ["all"] : active.filter(k => k !== cat.key)
        : [...active.filter(k => k !== "all"), cat.key];
    onChange(next);
  };

  const allCats = showMore ? [...MAP_CATEGORIES.slice(0, -1), ...MORE_CATEGORIES] : MAP_CATEGORIES;

  return (
    <div className="px-3" style={{ pointerEvents: "none" }}>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1" style={{ pointerEvents: "auto" }}>
        {allCats.map(cat => {
          const isActive = active.includes(cat.key);
          const isMore = cat.key === "more";
          return (
            <button
              key={cat.key}
              onClick={() => handleSelect(cat)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full whitespace-nowrap shrink-0 text-xs font-bold transition-all"
              style={{
                backgroundColor: isActive ? cat.color : isMore && showMore ? "#1e293b" : "rgba(255,255,255,0.9)",
                color: isActive || (isMore && showMore) ? "#fff" : "#374151",
                backdropFilter: "blur(12px)",
                boxShadow: isActive ? `0 4px 16px ${cat.color}55` : "0 2px 8px rgba(0,0,0,0.12)",
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