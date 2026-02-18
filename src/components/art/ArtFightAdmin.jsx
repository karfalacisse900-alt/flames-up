import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle } from "lucide-react";

export default function ArtFightAdmin({ user }) {
  const qc = useQueryClient();

  const { data: pending = [], isLoading } = useQuery({
    queryKey: ["artfight-pending"],
    queryFn: () => base44.entities.ArtFightEntry.filter({ status: "pending" }, "-created_date"),
  });

  const approve = async (id) => {
    await base44.entities.ArtFightEntry.update(id, { status: "approved" });
    qc.invalidateQueries({ queryKey: ["artfight-pending"] });
    qc.invalidateQueries({ queryKey: ["artfight-approved"] });
  };

  const reject = async (id) => {
    await base44.entities.ArtFightEntry.update(id, { status: "rejected" });
    qc.invalidateQueries({ queryKey: ["artfight-pending"] });
  };

  if (user?.role !== "admin") return null;

  return (
    <div className="px-4 pb-24 pt-2">
      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-hint)" }}>
        Pending Review ({pending.length})
      </p>
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
        </div>
      ) : pending.length === 0 ? (
        <p className="text-center text-sm py-8" style={{ color: "var(--text-hint)" }}>No pending submissions ✓</p>
      ) : (
        <div className="space-y-3">
          {pending.map(entry => (
            <div key={entry.id} className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
              <img src={entry.image_url} alt={entry.title} className="w-full aspect-video object-cover" />
              <div className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{entry.title}</p>
                  <p className="text-xs" style={{ color: "var(--text-hint)" }}>by {entry.owner_name}</p>
                  {entry.description && <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{entry.description}</p>}
                </div>
                <div className="flex gap-2 ml-3 shrink-0">
                  <button onClick={() => approve(entry.id)} className="p-2 rounded-full bg-green-100 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                  </button>
                  <button onClick={() => reject(entry.id)} className="p-2 rounded-full bg-red-100 text-red-500">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}