import React from "react";
import { Star, ExternalLink } from "lucide-react";
import DiscoverLogo from "./DiscoverLogo";

// Compact 4:5 card inspired by group swiper design
export default function CompactToolCard({ item, onClick }) {
  return (
    <div
      onClick={onClick}
      className="shrink-0 cursor-pointer active:scale-95 transition-transform duration-150"
      style={{ width: 160 }}
    >
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-light)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
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
          {/* Logo positioned top-left */}
          <div className="absolute top-3 left-3">
            <div
              className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center"
              style={{
                backgroundColor: "rgba(255,255,255,0.25)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.3)",
              }}
            >
              <DiscoverLogo item={item} size="sm" />
            </div>
          </div>

          {/* Badges top-right */}
          {item.is_new && (
            <span
              className="absolute top-3 right-3 text-[8px] font-bold px-1.5 py-0.5 rounded-full text-white"
              style={{ backgroundColor: "rgba(255,255,255,0.25)" }}
            >
              ✨ NEW
            </span>
          )}

          {/* Bottom overlay with title */}
          <div
            className="absolute bottom-0 left-0 right-0 px-3 pt-6 pb-3"
            style={{
              background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)",
            }}
          >
            <h4 className="font-bold text-white text-xs leading-tight line-clamp-2">
              {item.title}
            </h4>
          </div>
        </div>

        {/* Info section */}
        <div className="p-2.5">
          <div className="flex items-center justify-between">
            {item.avg_rating > 0 && (
              <div className="flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                <span className="text-[10px] font-bold" style={{ color: "var(--text-primary)" }}>
                  {item.avg_rating.toFixed(1)}
                </span>
              </div>
            )}
            {item.link && (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-0.5 text-[9px] font-bold px-2 py-1 rounded-full"
                style={{
                  backgroundColor: "var(--accent-primary)",
                  color: "white",
                }}
              >
                Open <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
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