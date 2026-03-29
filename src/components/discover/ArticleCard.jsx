import React from "react";
import { Minus, MoreHorizontal, Star } from "lucide-react";

const avatarColors = ["#7C69C4", "#D98B62", "#3C6E5A", "#E05C7A", "#4A7FC1", "#B07843"];
const getColor = (name) => avatarColors[(name || "U").charCodeAt(0) % avatarColors.length];

export default function ArticleCard({ article, onClick }) {
  const color = getColor(article.author);

  return (
    <div
      onClick={onClick}
      className="flex flex-col gap-3 px-4 py-5 cursor-pointer active:opacity-80"
      style={{ backgroundColor: "var(--bg-app)" }}
    >
      {/* Author row */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
          style={{ background: `linear-gradient(135deg, ${color}44, ${color}88)`, color }}>
          {article.author[0]}
        </div>
        <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
          {article.author}
          {article.publication && (
            <span style={{ color: "var(--text-hint)" }}> · In <span style={{ color: "var(--text-secondary)" }}>{article.publication}</span></span>
          )}
        </span>
      </div>

      {/* Main content row */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold leading-snug mb-1"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
            {article.title}
          </h2>
          <p className="text-sm leading-relaxed line-clamp-2"
            style={{ color: "var(--text-secondary)" }}>
            {article.subtitle}
          </p>
        </div>
        {article.image && (
          <img
            src={article.image}
            alt={article.title}
            className="w-20 h-16 object-cover rounded-md shrink-0"
          />
        )}
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {article.isMemberOnly && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3" style={{ color: "#F59E0B", fill: "#F59E0B" }} />
              <span className="text-xs font-semibold" style={{ color: "#F59E0B" }}>Member-only</span>
            </div>
          )}
          <span className="text-xs" style={{ color: "var(--text-hint)" }}>{article.date}</span>
          <span className="text-xs flex items-center gap-1" style={{ color: "var(--text-hint)" }}>
            👏 {article.reads}
          </span>
          <span className="text-xs flex items-center gap-1" style={{ color: "var(--text-hint)" }}>
            💬 {article.responses}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={e => e.stopPropagation()}
            className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{ color: "var(--text-hint)", minHeight: "unset", minWidth: "unset" }}>
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={e => e.stopPropagation()}
            className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{ color: "var(--text-hint)", minHeight: "unset", minWidth: "unset" }}>
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}