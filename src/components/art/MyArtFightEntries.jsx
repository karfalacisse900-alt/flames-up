import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";

const statusBadge = {
  pending: { bg: "#FFF7ED", text: "#C2670A", label: "Pending" },
  approved: { bg: "#ECFDF5", text: "#065F46", label: "Approved" },
  rejected: { bg: "#FEF2F2", text: "#991B1B", label: "Rejected" },
};

export default function MyArtFightEntries({ user }) {
  const qc = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["artfight-mine", user?.email],
    queryFn: () => base44.entities.ArtFightEntry.filter({ owner_email: user.email }, "-created_date"),
    enabled: !!user?.email,
  });

  const handleDelete = async (id) => {
    await base44.entities.ArtFightEntry.update(id, { status: "rejected" });
    qc.invalidateQueries({ queryKey: ["artfight-mine", user.email] });
    qc.invalidateQueries({ queryKey: ["artfight-approved"] });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 px-5">
        <p className="text-3xl mb-3">🎨</p>
        <p className="text-sm" style={{ color: "var(--text-hint)" }}>You haven't submitted any art yet.</p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-24 pt-2 space-y-3">
      {entries.map(entry => {
        const badge = statusBadge[entry.status] || statusBadge.pending;
        const total = (entry.wins || 0) + (entry.losses || 0);
        const winRate = total > 0 ? Math.round((entry.wins / total) * 100) : null;
        return (
          <div key={entry.id} className="flex gap-3 p-3 rounded-2xl items-center"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
            <img src={entry.image_url} alt={entry.title} className="w-14 h-14 rounded-xl object-cover shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{entry.title}</p>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                  style={{ backgroundColor: badge.bg, color: badge.text }}>{badge.label}</span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>
                ⚡ {entry.fight_score || 1000} · {entry.wins || 0}W {entry.losses || 0}L
                {winRate !== null && ` · ${winRate}% win rate`}
              </p>
            </div>
            {entry.status !== "rejected" && (
              <button onClick={() => handleDelete(entry.id)} className="p-2 rounded-full shrink-0"
                style={{ color: "var(--text-hint)" }}>
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}