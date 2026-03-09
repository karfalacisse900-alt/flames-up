import React from "react";
import { Star } from "lucide-react";

export default function HostReputationBadge({ avgRating, reviewCount, eventsCount, compact = false }) {
  if (!avgRating || !reviewCount) return null;

  const avg = Math.round(avgRating * 10) / 10;

  if (compact) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold" style={{ color: "#D97706" }}>
        <Star className="w-3 h-3" style={{ fill: "#D97706", color: "#D97706" }} />
        {avg}
        <span className="font-normal" style={{ color: "var(--text-hint)" }}>({reviewCount})</span>
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            className="w-3.5 h-3.5"
            style={{
              color: "#D97706",
              fill: i <= Math.round(avg) ? "#D97706" : "none",
            }}
          />
        ))}
      </div>
      <span className="font-bold" style={{ color: "var(--text-primary)" }}>{avg}</span>
      <span style={{ color: "var(--text-hint)" }}>({reviewCount} review{reviewCount !== 1 ? "s" : ""})</span>
      {eventsCount > 0 && (
        <span style={{ color: "var(--text-hint)" }}>· {eventsCount} event{eventsCount !== 1 ? "s" : ""} hosted</span>
      )}
    </div>
  );
}