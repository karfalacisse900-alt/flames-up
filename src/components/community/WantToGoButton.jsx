import React, { useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function WantToGoButton({ post, user, compact = false }) {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);

  const locationName = post.location_name || post.location_city;
  if (!locationName || !user?.email) return null;

  const { data: existing } = useQuery({
    queryKey: ["savedPlace", user.email, locationName],
    queryFn: () => base44.entities.SavedPlace.filter({ user_email: user.email, location_name: locationName }),
    select: d => d[0] || null,
    enabled: !!user?.email && !!locationName,
  });

  const saved = !!existing;

  const toggle = async (e) => {
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    if (saved && existing) {
      await base44.entities.SavedPlace.delete(existing.id);
    } else {
      await base44.entities.SavedPlace.create({
        user_email: user.email,
        location_name: post.location_name || post.location_city,
        location_city: post.location_city || "",
        location_region: post.location_region || "",
        location_country: post.location_country || "",
        location_lat: post.location_lat,
        location_lng: post.location_lng,
        save_type: "want_to_go",
      });
    }
    await qc.invalidateQueries({ queryKey: ["savedPlace", user.email, locationName] });
    await qc.invalidateQueries({ queryKey: ["savedPlaces", user.email] });
    setLoading(false);
  };

  if (compact) {
    return (
      <button onClick={toggle} disabled={loading}
        className="p-1.5 rounded-full transition-all"
        style={{ color: saved ? "var(--accent-primary)" : "var(--text-hint)" }}
        title={saved ? "Saved to Want to Go" : "Want to Go"}>
        {saved
          ? <BookmarkCheck className="w-4 h-4" />
          : <Bookmark className="w-4 h-4" />
        }
      </button>
    );
  }

  return (
    <button onClick={toggle} disabled={loading}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-all chip"
      style={{
        backgroundColor: saved ? "var(--accent-primary-light)" : "transparent",
        borderColor: saved ? "var(--accent-primary)" : "var(--border-light)",
        color: saved ? "var(--accent-primary)" : "var(--text-hint)",
      }}>
      {saved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
      {saved ? "Saved" : "Want to go"}
    </button>
  );
}