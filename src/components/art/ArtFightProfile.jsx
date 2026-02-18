import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Trophy, TrendingUp, Heart } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ArtFightProfile({ entry, user, open, onClose }) {
  const { data: favorites = [] } = useQuery({
    queryKey: ["artfight-favorites", entry?.id],
    queryFn: () => base44.entities.ArtFightFavorite.filter({ entry_id: entry.id }),
    enabled: !!entry?.id,
  });

  const { data: history = [] } = useQuery({
    queryKey: ["artfight-history", entry?.id],
    queryFn: () => base44.entities.ArtFightHistory.filter({ entry_id: entry.id }, "-created_date", 20),
    enabled: !!entry?.id,
  });

  if (!entry) return null;

  const total = (entry.wins || 0) + (entry.losses || 0);
  const winRate = total > 0 ? Math.round((entry.wins / total) * 100) : 0;
  const rank = entry.fight_score || 1000;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "var(--font-serif)" }}>Art Fighter Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          {/* Artwork preview */}
          <div className="rounded-2xl overflow-hidden aspect-video">
            <img src={entry.image_url} alt={entry.title} className="w-full h-full object-cover" />
          </div>

          {/* Title & Artist */}
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{entry.title}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>by {entry.owner_name}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-xl text-center" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
              <p className="text-lg font-bold" style={{ color: "var(--accent-primary)" }}>⚡ {rank}</p>
              <p className="text-[10px] mt-1" style={{ color: "var(--text-hint)" }}>Rating</p>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
              <p className="text-lg font-bold" style={{ color: "#10B981" }}>{entry.wins || 0}</p>
              <p className="text-[10px] mt-1" style={{ color: "var(--text-hint)" }}>Wins</p>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
              <p className="text-lg font-bold" style={{ color: "#EF4444" }}>{entry.losses || 0}</p>
              <p className="text-[10px] mt-1" style={{ color: "var(--text-hint)" }}>Losses</p>
            </div>
          </div>

          {/* Win Rate */}
          {total > 0 && (
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Win Rate</span>
              </div>
              <span className="text-sm font-bold" style={{ color: "var(--accent-primary)" }}>{winRate}%</span>
            </div>
          )}

          {/* Favorites */}
          {favorites.length > 0 && (
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 fill-red-400" style={{ color: "#EF4444" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Favorites</span>
              </div>
              <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{favorites.length}</span>
            </div>
          )}

          {/* Recent Fights */}
          {history.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--text-hint)" }}>Recent Fights</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {history.slice(0, 10).map((fight) => (
                  <div key={fight.id} className="flex items-center justify-between text-xs p-2 rounded-lg" style={{ backgroundColor: "var(--bg-card)" }}>
                    <span style={{ color: "var(--text-secondary)" }}>
                      {fight.winner_id === entry.id ? "✓ Won" : "✗ Lost"}
                    </span>
                    <span style={{ color: "var(--text-hint)" }}>
                      {fight.score_before} → {fight.score_after}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}