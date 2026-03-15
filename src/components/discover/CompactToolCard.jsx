import React from "react";
import { Star, ExternalLink } from "lucide-react";
import DiscoverLogo from "./DiscoverLogo";

// Compact 4:5 card inspired by group swiper design
export default function CompactToolCard({ item, onClick }) {
  return (
    <div
      onClick={onClick}
      className="shrink-0 cursor-pointer active:scale-[0.98] transition-transform duration-150"
      style={{ width: "calc(100vw - 80px)", maxWidth: 340 }}
    >
      <div
        className="rounded-[32px] overflow-hidden"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-light)",
          boxShadow: "0 20px 48px rgba(15,23,42,0.12)",
        }}
      >
        {/* 4:5 Image container */}
        <div
          className="relative w-full flex items-center justify-center"
          style={{
            aspectRatio: "4/5",
            background: `linear-gradient(135deg, ${getGradient(item.category)[0]}, ${getGradient(item.category)[1]})`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/75" />

          {/* Logo positioned top-left */}
          <div className="absolute top-4 left-4 z-10">
            <div
              className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center backdrop-blur-xl"
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                border: "2px solid rgba(255,255,255,0.3)",
              }}
            >
              <DiscoverLogo item={item} size="md" />
            </div>
          </div>

          {/* Badges top-right */}
          {item.is_new && (
            <span
              className="absolute top-4 right-4 z-10 text-[9px] font-bold px-2 py-1 rounded-full text-white backdrop-blur-xl"
              style={{ backgroundColor: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.3)" }}
            >
              ✨ NEW
            </span>
          )}

          {/* Bottom content */}
          <div className="absolute bottom-0 left-0 right-0 z-10 p-5">
            <div className="mb-4">
              <h3 className="font-bold text-[17px] leading-tight mb-2 text-white drop-shadow-lg" style={{ fontFamily: "var(--font-serif)" }}>
                {item.title}
              </h3>
              {item.description && (
                <p className="text-xs text-white/90 leading-relaxed line-clamp-2 drop-shadow-md">
                  {item.description}
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2.5">
              {item.avg_rating > 0 && (
                <div className="flex items-center gap-1 px-3 py-2 rounded-full backdrop-blur-xl" style={{ backgroundColor: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-bold text-white">{item.avg_rating.toFixed(1)}</span>
                </div>
              )}
              {item.link && (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm font-bold py-3 rounded-full backdrop-blur-xl"
                  style={{
                    backgroundColor: "white",
                    color: "var(--accent-primary)",
                  }}
                >
                  Open <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getGradient(cat) {
  const gradients = {
    productivity: ["#6366f1", "#8b5cf6"],
    finance: ["#10b981", "#059669"],
    learning: ["#f59e0b", "#d97706"],
    lifestyle: ["#34d399", "#10b981"],
    entertainment: ["#f43f5e", "#e11d48"],
    health: ["#06b6d4", "#0891b2"],
    social: ["#8b5cf6", "#7c3aed"],
    developer_tools: ["#374151", "#1f2937"],
  };
  return gradients[cat] || ["#2E6B4F", "#1a4230"];
}