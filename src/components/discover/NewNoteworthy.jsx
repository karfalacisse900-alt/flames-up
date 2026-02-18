import React from "react";
import { Sparkles } from "lucide-react";
import DiscoverLogo from "./DiscoverLogo";
import StarRating from "./StarRating";

export default function NewNoteworthy({ items, onItemClick }) {
  if (!items.length) return null;

  return (
    <div className="mb-5">
      <div className="px-5 flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4" style={{ color: "var(--accent-secondary)" }} />
        <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>New & Noteworthy</h2>
      </div>
      <div className="px-5 flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {items.map(item => (
          <div
            key={item.id}
            onClick={() => onItemClick(item)}
            className="flex-shrink-0 w-40 p-3 rounded-2xl cursor-pointer transition-shadow hover:shadow-md"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
          >
            <DiscoverLogo item={item} size="sm" />
            <h3 className="text-xs font-semibold mt-2 line-clamp-1" style={{ color: "var(--text-primary)" }}>{item.title}</h3>
            <p className="text-[10px] mt-0.5 line-clamp-2 leading-relaxed" style={{ color: "var(--text-hint)" }}>{item.description}</p>
            <div className="mt-1.5">
              <StarRating value={item.avg_rating || 0} size="sm" showCount count={item.review_count || 0} />
            </div>
            <div className="mt-1.5 inline-flex items-center">
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: "rgba(217,139,98,0.12)", color: "var(--accent-secondary)", border: "1px solid rgba(217,139,98,0.25)" }}>
                ✦ New
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}