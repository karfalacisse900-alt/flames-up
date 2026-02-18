import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";

export default function ArtFightLeaderboard() {
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["artfight-leaderboard"],
    queryFn: () => base44.entities.ArtFightEntry.filter({ status: "approved" }, "-fight_score", 50),
  });

  const ranked = entries
    .filter(e => (e.wins || 0) + (e.losses || 0) >= 1)
    .sort((a, b) => (b.fight_score || 1000) - (a.fight_score || 1000));

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (ranked.length === 0) {
    return (
      <div className="text-center py-16">
        <Trophy className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-hint)" }} />
        <p className="text-sm" style={{ color: "var(--text-hint)" }}>No fights yet. Start voting!</p>
      </div>
    );
  }

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="px-4 pb-24 space-y-3 pt-2">
      {ranked.map((entry, i) => {
        const total = (entry.wins || 0) + (entry.losses || 0);
        const winRate = total > 0 ? Math.round((entry.wins / total) * 100) : 0;
        return (
          <div key={entry.id} className="flex items-center gap-3 p-3 rounded-2xl"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
            <span className="text-xl w-7 text-center shrink-0">{medals[i] || `#${i + 1}`}</span>
            <img src={entry.image_url} alt={entry.title} className="w-12 h-12 rounded-xl object-cover shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{entry.title}</p>
              <p className="text-xs truncate" style={{ color: "var(--text-hint)" }}>by {entry.owner_name}</p>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
                {entry.wins || 0}W · {entry.losses || 0}L · {winRate}% win rate
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold" style={{ color: "var(--accent-primary)" }}>⚡ {entry.fight_score || 1000}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}