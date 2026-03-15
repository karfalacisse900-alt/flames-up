import React from "react";
import { ExternalLink, Star } from "lucide-react";

export default function WideCard({ item, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex-shrink-0 snap-start cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
      style={{ width: 320 }}>
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-light)",
          boxShadow: "var(--elevation-2)",
        }}>
        {/* 16:9 Image */}
        <div className="relative w-full" style={{ aspectRatio: "16/9", backgroundColor: "var(--bg-subtle)" }}>
          {item.logo_url ? (
            <img
              src={item.logo_url}
              alt={item.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "var(--accent-primary)" }}>
                <span className="text-2xl font-bold text-white">{item.title?.[0] || "?"}</span>
              </div>
            </div>
          )}
          {item.is_featured && (
            <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: "rgba(79,70,229,0.9)" }}>
              ⭐ Featured
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-bold text-base line-clamp-1" style={{ color: "var(--text-primary)" }}>
              {item.title}
            </h3>
            {item.avg_rating > 0 && (
              <div className="flex items-center gap-1 shrink-0">
                <Star className="w-3.5 h-3.5 fill-amber-400" style={{ color: "#FBBF24" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {item.avg_rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>
          <p className="text-sm line-clamp-2 mb-3" style={{ color: "var(--text-secondary)" }}>
            {item.description}
          </p>
          <div className="flex items-center gap-2">
            {item.category && (
              <span className="px-2 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
                {item.category.replace(/_/g, " ")}
              </span>
            )}
            {item.pricing && (
              <span className="px-2 py-1 rounded-lg text-xs font-semibold" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
                {item.pricing}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}