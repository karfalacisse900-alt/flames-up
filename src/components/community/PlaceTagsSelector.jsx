import React from "react";

const PLACE_TAGS = [
  { key: "food", label: "🍔 Food" },
  { key: "events", label: "🎉 Events" },
  { key: "travel", label: "✈️ Travel" },
  { key: "park", label: "🌳 Park" },
  { key: "coffee", label: "☕ Coffee" },
  { key: "hidden_spot", label: "🔍 Hidden Spot" },
  { key: "free_activities", label: "🆓 Free Activities" },
  { key: "study_spot", label: "📚 Study Spot" },
  { key: "nightlife", label: "🌙 Nightlife" },
  { key: "art", label: "🎨 Art" },
];

export default function PlaceTagsSelector({ selected = [], onChange }) {
  const toggle = (key) => {
    if (selected.includes(key)) onChange(selected.filter(k => k !== key));
    else onChange([...selected, key]);
  };

  return (
    <div>
      <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Place tags (optional)</p>
      <div className="flex flex-wrap gap-1.5">
        {PLACE_TAGS.map(t => {
          const active = selected.includes(t.key);
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => toggle(t.key)}
              className="px-2.5 py-1 rounded-full text-xs font-semibold border transition-all active:scale-95"
              style={{
                backgroundColor: active ? "var(--accent-primary)" : "var(--bg-subtle)",
                borderColor: active ? "var(--accent-primary)" : "var(--border-light)",
                color: active ? "#fff" : "var(--text-secondary)",
              }}>
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}