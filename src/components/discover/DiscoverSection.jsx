import React, { useRef } from "react";
import { ChevronRight } from "lucide-react";

export default function DiscoverSection({ title, subtitle, children, onSeeAll }) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const scrollAmount = direction === "left" ? -300 : 300;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  return (
    <div className="mb-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4 px-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm mt-0.5" style={{ color: "var(--text-hint)" }}>{subtitle}</p>
          )}
        </div>
        {onSeeAll && (
          <button
            onClick={onSeeAll}
            className="flex items-center gap-1 text-sm font-semibold transition-transform hover:translate-x-1"
            style={{ color: "var(--accent-primary)" }}>
            See All
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Scrollable Content */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide px-4 snap-x snap-mandatory"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}>
        {children}
      </div>
    </div>
  );
}