import React from "react";
import { motion } from "framer-motion";
import StarRating from "./StarRating";
import { MapPin } from "lucide-react";
import BookmarkButton from "./BookmarkButton";

const platformColors = {
  Fiverr: { bg: "#e8f7f0", text: "#1dbf73" },
  Upwork: { bg: "#e8f0ff", text: "#14a800" },
  Independent: { bg: "#f5f2e8", text: "#6e6e6e" },
  Coach: { bg: "#fdf3ed", text: "#d98b62" },
  Other: { bg: "#f5f2e8", text: "#6e6e6e" },
};

export default function ServicePersonCard({ person, onClick }) {
  const initials = person.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const plt = platformColors[person.platform] || platformColors.Other;

  return (
    <motion.div
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className="rounded-2xl p-4 cursor-pointer active:scale-[0.99] transition-all"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-2xl shrink-0 overflow-hidden flex items-center justify-center text-lg font-bold"
          style={{ backgroundColor: "var(--bg-app)", color: "var(--accent-primary)" }}>
          {person.image_url
            ? <img src={person.image_url} alt={person.name} className="w-full h-full object-cover" />
            : initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{person.name}</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: plt.bg, color: plt.text }}>
              {person.platform}
            </span>
          </div>
          <p className="text-xs mt-0.5 font-medium" style={{ color: "var(--accent-primary)" }}>{person.headline}</p>
          <p className="text-xs mt-1 line-clamp-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{person.short_description}</p>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <StarRating value={person.avg_rating || 0} showCount count={person.review_count || 0} />
            {person.starting_price && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">{person.starting_price}</span>
            )}
            {person.location && (
              <span className="text-[10px] flex items-center gap-0.5" style={{ color: "var(--text-hint)" }}>
                <MapPin className="w-3 h-3" />{person.location}
              </span>
            )}
          </div>
          {person.skills?.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-2">
              {person.skills.slice(0, 3).map(s => (
                <span key={s} className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--bg-app)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}>{s}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      <button className="mt-3 w-full py-2 rounded-xl text-xs font-semibold text-white"
        style={{ backgroundColor: "var(--accent-primary)" }}>
        View Profile
      </button>
    </motion.div>
  );
}