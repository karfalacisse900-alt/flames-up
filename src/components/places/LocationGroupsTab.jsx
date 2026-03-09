import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, Globe, Lock, MapPin } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

const CATEGORY_COLORS = {
  fitness: "#E05C2A", food: "#D98B62", travel: "#1D4ED8", study: "#7C69C4",
  tech: "#2E6B4F", art: "#9333EA", music: "#E05C7A", gaming: "#0891B2",
  books: "#92400E", movies: "#DC2626", health: "#16A34A", sports: "#EA580C",
  general: "#5C5C5C",
};

export default function LocationGroupsTab({ locationName, locationData, onGroupSelect }) {
  const navigate = useNavigate();

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["locationGroups", locationName, locationData?.city],
    queryFn: async () => {
      const all = await base44.entities.Group.list("-member_count", 200);
      const locLower = locationName.toLowerCase();
      const cityLower = (locationData?.city || "").toLowerCase();
      return all.filter(g =>
        g.is_active !== false && (
          (g.location_name && g.location_name.toLowerCase().includes(locLower)) ||
          (cityLower && g.location_city && g.location_city.toLowerCase().includes(cityLower)) ||
          (g.location_city && g.location_city.toLowerCase() === locLower)
        )
      );
    },
    enabled: !!locationName,
  });

  if (isLoading) return (
    <div className="py-8 text-center text-sm" style={{ color: "var(--text-hint)" }}>Loading groups…</div>
  );

  if (groups.length === 0) return (
    <div className="p-4 pb-28">
      <div className="py-12 text-center">
        <Users className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-hint)" }} />
        <p className="text-sm font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>No groups based here yet</p>
        <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>Create a group and set this as your meeting location!</p>
        <button onClick={() => navigate(createPageUrl("Groups"))}
          className="mt-3 px-4 py-2 rounded-xl text-sm font-bold text-white"
          style={{ backgroundColor: "var(--accent-primary)" }}>
          Browse All Groups
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-4 pb-28 space-y-3">
      <p className="text-xs font-semibold" style={{ color: "var(--text-hint)" }}>
        {groups.length} group{groups.length !== 1 ? "s" : ""} based here
      </p>
      {groups.map(g => {
        const color = CATEGORY_COLORS[g.category] || "#5C5C5C";
        return (
          <button key={g.id} onClick={() => onGroupSelect?.(g)}
            className="w-full text-left p-4 rounded-2xl transition-all active:scale-[0.99] flex items-center gap-3"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
            {g.cover_image_url ? (
              <img src={g.cover_image_url} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-2xl"
                style={{ background: g.cover_color || `linear-gradient(135deg, ${color}22, ${color}44)` }}>
                {g.emoji || "💬"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>{g.name}</p>
                {g.is_private ? <Lock className="w-3 h-3 shrink-0" style={{ color: "var(--text-hint)" }} /> : <Globe className="w-3 h-3 shrink-0" style={{ color: "var(--text-hint)" }} />}
              </div>
              {g.description && (
                <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-secondary)" }}>{g.description}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="flex items-center gap-0.5 text-xs" style={{ color: "var(--text-hint)" }}>
                  <Users className="w-3 h-3" /> {g.member_count || 0}
                </span>
                {g.location_city && (
                  <span className="flex items-center gap-0.5 text-xs" style={{ color: "var(--text-hint)" }}>
                    <MapPin className="w-3 h-3" /> {g.location_city}
                  </span>
                )}
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold capitalize"
                  style={{ backgroundColor: `${color}18`, color }}>
                  {g.category}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}