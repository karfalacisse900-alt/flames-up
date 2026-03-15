import React from "react";
import { Star, TrendingUp } from "lucide-react";

export default function VerticalCard({ item, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex-shrink-0 snap-start cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
      style={{ width: 180 }}>
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-light)",
          boxShadow: "var(--elevation-2)",
        }}>
        {/* 4:5 Image */}
        <div className="relative w-full" style={{ aspectRatio: "4/5", backgroundColor: "var(--bg-subtle)" }}>
          {item.logo_url ? (
            <img
              src={item.logo_url}
              alt={item.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--accent-primary)" }}>
                <span className="text-lg font-bold text-white">{item.title?.[0] || "?"}</span>
              </div>
            </div>
          )}
          {item.is_new && (
            <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: "rgba(239,68,68,0.9)" }}>
              🆕 New
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          <h3 className="font-bold text-sm line-clamp-2 mb-1" style={{ color: "var(--text-primary)" }}>
            {item.title}
          </h3>
          {item.avg_rating > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <Star className="w-3 h-3 fill-amber-400" style={{ color: "#FBBF24" }} />
              <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                {item.avg_rating.toFixed(1)}
              </span>
              <span className="text-xs" style={{ color: "var(--text-hint)" }}>
                ({item.review_count || 0})
              </span>
            </div>
          )}
          {item.pricing && (
            <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
              {item.pricing}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}