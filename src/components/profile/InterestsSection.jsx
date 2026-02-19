import React, { useState } from "react";
import { base44 } from "@/api/base44Client";

const ALL_INTERESTS = [
  { id: "gaming", label: "Gaming", emoji: "🎮" },
  { id: "art", label: "Art & Design", emoji: "🎨" },
  { id: "coding", label: "Coding", emoji: "💻" },
  { id: "productivity", label: "Productivity", emoji: "⚡" },
  { id: "music", label: "Music", emoji: "🎵" },
  { id: "fitness", label: "Fitness & Health", emoji: "💪" },
  { id: "learning", label: "Learning", emoji: "📚" },
  { id: "finance", label: "Finance", emoji: "💰" },
  { id: "social", label: "Social", emoji: "👥" },
  { id: "entertainment", label: "Entertainment", emoji: "🎬" },
  { id: "travel", label: "Travel", emoji: "✈️" },
  { id: "food", label: "Food", emoji: "🍜" },
];

export default function InterestsSection({ user, onUpdated }) {
  const selected = user?.interests || [];
  const [saving, setSaving] = useState(false);

  const toggle = async (id) => {
    const updated = selected.includes(id)
      ? selected.filter(i => i !== id)
      : [...selected, id];
    setSaving(true);
    await base44.auth.updateMe({ interests: updated });
    onUpdated({ ...user, interests: updated });
    setSaving(false);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
        Select your interests to personalize your Discover feed and content recommendations.
      </p>
      <div className="flex flex-wrap gap-2">
        {ALL_INTERESTS.map(({ id, label, emoji }) => {
          const active = selected.includes(id);
          return (
            <button
              key={id}
              onClick={() => toggle(id)}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all"
              style={{
                backgroundColor: active ? "rgba(111,143,114,0.15)" : "var(--bg-card)",
                borderColor: active ? "var(--accent-primary)" : "var(--border-medium)",
                color: active ? "var(--accent-primary)" : "var(--text-secondary)",
                boxShadow: active ? "0 1px 6px rgba(111,143,114,0.15)" : "none",
              }}
            >
              <span>{emoji}</span> {label}
            </button>
          );
        })}
      </div>
      {selected.length > 0 && (
        <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>
          {selected.length} interest{selected.length > 1 ? "s" : ""} selected · Discover will personalize based on these
        </p>
      )}
    </div>
  );
}