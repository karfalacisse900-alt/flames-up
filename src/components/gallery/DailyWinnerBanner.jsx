import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Trophy, Clock } from "lucide-react";

function getTimeUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight - now;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m`;
}

export default function DailyWinnerBanner() {
  const today = new Date().toISOString().slice(0, 10);

  const { data: artPieces = [] } = useQuery({
    queryKey: ["dailyWinnerArt"],
    queryFn: () => base44.entities.ArtPiece.list("-like_count", 50),
    staleTime: 60000,
  });

  // Winner = highest liked art uploaded today OR all-time top if none today
  const todayArt = artPieces.filter(a => a.created_date?.startsWith(today));
  const winner = todayArt.length > 0
    ? todayArt.reduce((best, a) => (a.like_count || 0) > (best.like_count || 0) ? a : best, todayArt[0])
    : artPieces[0];

  if (!winner) return null;

  return (
    <div className="mx-4 mb-3 p-3 rounded-2xl flex items-center gap-3"
      style={{ background: "linear-gradient(135deg, #F5A62315, #F5D62315)", border: "1px solid #F5A62340" }}>
      <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
        <img src={winner.image_url} alt={winner.title} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-0.5">
          <Trophy className="w-3.5 h-3.5" style={{ color: "#F5A623" }} />
          <p className="text-[11px] font-bold" style={{ color: "#F5A623" }}>Today's Leader</p>
        </div>
        <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{winner.title}</p>
        <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>
          {winner.like_count || 0} likes · by {winner.creator_name || "Artist"}
        </p>
      </div>
      <div className="text-right shrink-0">
        <div className="flex items-center gap-1 text-[10px]" style={{ color: "var(--text-hint)" }}>
          <Clock className="w-3 h-3" />
          {getTimeUntilMidnight()}
        </div>
        <p className="text-[9px]" style={{ color: "var(--text-hint)" }}>left today</p>
      </div>
    </div>
  );
}