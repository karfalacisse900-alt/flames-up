import React, { useRef } from "react";
import { ChevronRight } from "lucide-react";

export default function DiscoverSection({ 
  title, 
  subtitle, 
  items = [], 
  cardType = "wide", // wide (16:9), tall (9:16), square (1:1)
  onItemClick 
}) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const getCardStyle = () => {
    switch (cardType) {
      case "wide":
        return { width: "280px", aspectRatio: "16/9" };
      case "tall":
        return { width: "180px", aspectRatio: "9/16" };
      case "square":
        return { width: "160px", aspectRatio: "1/1" };
      default:
        return { width: "280px", aspectRatio: "16/9" };
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="mb-8">
      {/* Section Header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm mt-0.5" style={{ color: "var(--text-hint)" }}>
              {subtitle}
            </p>
          )}
        </div>
        <button
          onClick={() => scroll("right")}
          className="p-2 rounded-full transition-colors"
          style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Row */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2"
        style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}>
        {items.map((item, idx) => (
          <DiscoverCard
            key={item.id || idx}
            item={item}
            style={getCardStyle()}
            onClick={() => onItemClick?.(item)}
          />
        ))}
      </div>
    </div>
  );
}

function DiscoverCard({ item, style, onClick }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 rounded-2xl overflow-hidden transition-all active:scale-95"
      style={{
        ...style,
        scrollSnapAlign: "start",
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-light)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}>
      {/* Preview Image/Video */}
      <div className="w-full h-full relative overflow-hidden">
        {item.logo_url || item.image_url ? (
          <img
            src={item.logo_url || item.image_url}
            alt={item.title || item.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
            <span className="text-4xl">{item.brand_name?.[0] || item.title?.[0] || "?"}</span>
          </div>
        )}

        {/* Overlay Info */}
        <div
          className="absolute inset-x-0 bottom-0 p-3"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)",
          }}>
          <h3 className="text-sm font-bold text-white mb-0.5 line-clamp-1">
            {item.title || item.brand_name || item.name}
          </h3>
          {item.description && (
            <p className="text-xs text-white/70 line-clamp-1">
              {item.description}
            </p>
          )}
          {item.category && (
            <span
              className="inline-block text-[10px] px-2 py-0.5 rounded-full mt-1.5 font-semibold"
              style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white" }}>
              {item.category.replace(/_/g, " ").toUpperCase()}
            </span>
          )}
        </div>

        {/* Badge (if featured, new, etc) */}
        {item.is_featured && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ backgroundColor: "#F59E0B", color: "white" }}>
            ⭐ Featured
          </div>
        )}
        {item.is_new && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ backgroundColor: "#10B981", color: "white" }}>
            ✨ New
          </div>
        )}
      </div>
    </button>
  );
}