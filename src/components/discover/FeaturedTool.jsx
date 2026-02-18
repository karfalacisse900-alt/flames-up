import React from "react";
import { ExternalLink, Star, Zap } from "lucide-react";
import DiscoverLogo from "./DiscoverLogo";
import StarRating from "./StarRating";

const catColors = {
  productivity: "bg-[#EEF3F0] text-[#3C6E5A]",
  finance: "bg-[#EEF3F0] text-[#3C6E5A]",
  learning: "bg-[#EDF2F7] text-[#5579A6]",
  lifestyle: "bg-[#FDF3ED] text-[#D98B62]",
  entertainment: "bg-[#FDF3ED] text-[#D98B62]",
  health: "bg-[#EEF3F0] text-[#3C6E5A]",
  social: "bg-[#EDF2F7] text-[#5579A6]",
  developer_tools: "bg-[#F2F0EC] text-[#6E6E6E]",
};

export default function FeaturedTool({ item, onClick }) {
  return (
    <div
      onClick={onClick}
      className="mx-5 rounded-3xl overflow-hidden cursor-pointer relative"
      style={{
        background: "linear-gradient(135deg, #3C6E5A 0%, #2E5A47 60%, #1F3D30 100%)",
        boxShadow: "0 8px 32px rgba(60,110,90,0.3)"
      }}
    >
      {/* Badge */}
      <div className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm">
        <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
        <span className="text-xs font-semibold text-white">Tool of the Week</span>
      </div>

      <div className="p-5 pt-6">
        <div className="flex items-center gap-3 mb-3">
          <DiscoverLogo item={item} size="lg" />
          <div>
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-serif)" }}>{item.title}</h2>
            <p className="text-sm text-white/70">{item.brand_name}</p>
          </div>
        </div>

        <p className="text-sm text-white/80 leading-relaxed mb-3 line-clamp-2">{item.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-2.5 py-1 rounded-full bg-white/20 text-white">
              {item.category?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
            </span>
            {item.pricing && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-400/30 text-amber-200">{item.pricing}</span>
            )}
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
              <span className="text-xs text-white/80">{item.avg_rating > 0 ? item.avg_rating.toFixed(1) : "New"}</span>
            </div>
          </div>
          {item.link && (
            <div className="flex items-center gap-1 text-xs text-white/70 bg-white/10 px-3 py-1.5 rounded-full">
              Visit <ExternalLink className="w-3 h-3" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}