import React from "react";
import { Star, Sparkles } from "lucide-react";

export default function SquareCard({ item, onClick }) {
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
          {item.tags?.includes("AI-powered") && (
            <div className="absolute top-2 right-2 p-1 rounded-full" style={{ backgroundColor: "rgba(79,70,229,0.9)" }}>
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          <h3 className="font-bold text-sm line-clamp-2 mb-1" style={{ color: "var(--text-primary)" }}>
            {item.title}
          </h3>
          {item.avg_rating > 0 ? (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400" style={{ color: "#FBBF24" }} />
              <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                {item.avg_rating.toFixed(1)}
              </span>
            </div>
          ) : (
            <p className="text-xs line-clamp-2" style={{ color: "var(--text-hint)" }}>
              {item.category?.replace(/_/g, " ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}