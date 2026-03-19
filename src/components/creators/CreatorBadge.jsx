import React from "react";
import { Sparkles } from "lucide-react";

// Tiny badge shown next to creator names in messages / chats
export default function CreatorBadge({ category, size = "sm" }) {
  const EMOJI = {
    painter: "🎨", dancer: "💃", musician: "🎵", videographer: "🎬",
    photographer: "📸", street_performer: "🎭", comedian: "😂",
    magician: "🪄", tattoo_artist: "✒️", caricaturist: "✏️", other: "🌟"
  };
  const emoji = EMOJI[category] || "🌟";
  if (size === "xs") {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
        style={{ background: "linear-gradient(135deg,#E05C2A,#F97316)", color: "#fff", verticalAlign: "middle" }}>
        {emoji} Creator
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
      style={{ background: "linear-gradient(135deg,#E05C2A,#F97316)", color: "#fff", verticalAlign: "middle" }}>
      <Sparkles className="w-2.5 h-2.5" />
      {emoji} Creator
    </span>
  );
}