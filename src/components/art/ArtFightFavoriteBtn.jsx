import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";

export default function ArtFightFavoriteBtn({ entry, user }) {
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  const { data: favorites = [] } = useQuery({
    queryKey: ["artfight-favorites", entry?.id, user?.email],
    queryFn: () => user?.email ? base44.entities.ArtFightFavorite.filter({ entry_id: entry.id, user_email: user.email }) : Promise.resolve([]),
    enabled: !!entry?.id && !!user?.email,
  });

  const isFavorited = favorites.length > 0;

  const toggleFavorite = async (e) => {
    e.stopPropagation();
    if (!user?.email) return;
    setLoading(true);
    
    if (isFavorited) {
      await base44.entities.ArtFightFavorite.delete(favorites[0].id);
    } else {
      await base44.entities.ArtFightFavorite.create({
        user_email: user.email,
        entry_id: entry.id,
      });
    }
    
    qc.invalidateQueries({ queryKey: ["artfight-favorites"] });
    setLoading(false);
  };

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className="p-2 rounded-full transition-all"
      style={{
        color: isFavorited ? "#EF4444" : "var(--text-hint)",
        opacity: loading ? 0.6 : 1,
      }}
    >
      <Heart className="w-4 h-4" fill={isFavorited ? "currentColor" : "none"} />
    </button>
  );
}