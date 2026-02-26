import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ThumbsUp, ThumbsDown } from "lucide-react";

export default function WorthItButton({ contentType, contentId, onRatingChange }) {
  const [user, setUser] = useState(null);
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => setUser(u)).catch(() => {});
  }, []);

  const { data: rating = { worth_it_count: 0, not_really_count: 0, rated_by: [] }, isLoading } = useQuery({
    queryKey: ["contentRating", contentType, contentId],
    queryFn: async () => {
      const ratings = await base44.entities.ContentRating.filter(
        { content_type: contentType, content_id: contentId },
        "-created_date",
        1
      );
      return ratings[0] || { worth_it_count: 0, not_really_count: 0, rated_by: [] };
    },
  });

  const createOrUpdateMutation = useMutation({
    mutationFn: async (voteType) => {
      const existing = await base44.entities.ContentRating.filter(
        { content_type: contentType, content_id: contentId },
        "-created_date",
        1
      );

      const ratingId = existing[0]?.id;
      const alreadyRated = existing[0]?.rated_by?.includes(user?.email);

      if (alreadyRated) {
        return { ...existing[0] }; // Already voted, don't change
      }

      if (ratingId) {
        const newWorthIt = voteType === "worth_it" ? (existing[0].worth_it_count || 0) + 1 : existing[0].worth_it_count || 0;
        const newNotReally = voteType === "not_really" ? (existing[0].not_really_count || 0) + 1 : existing[0].not_really_count || 0;
        const newRatedBy = [...(existing[0].rated_by || []), user?.email];

        return base44.entities.ContentRating.update(ratingId, {
          worth_it_count: newWorthIt,
          not_really_count: newNotReally,
          rated_by: newRatedBy,
        });
      } else {
        return base44.entities.ContentRating.create({
          content_type: contentType,
          content_id: contentId,
          worth_it_count: voteType === "worth_it" ? 1 : 0,
          not_really_count: voteType === "not_really" ? 1 : 0,
          rated_by: [user?.email],
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contentRating", contentType, contentId] });
      onRatingChange?.();
    },
  });

  const handleVote = (voteType) => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }
    createOrUpdateMutation.mutate(voteType);
  };

  const hasRated = user && rating?.rated_by?.includes(user.email);
  const total = (rating?.worth_it_count || 0) + (rating?.not_really_count || 0);
  const worthItPercent = total > 0 ? Math.round(((rating?.worth_it_count || 0) / total) * 100) : 0;

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => handleVote("worth_it")}
        disabled={isLoading || createOrUpdateMutation.isPending || hasRated}
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all active:scale-95 disabled:opacity-50"
        style={{
          backgroundColor: hasRated && rating?.rated_by?.includes(user?.email) ? "#E8F2EC" : "var(--bg-subtle)",
          color: "#2E6B4F",
          border: "1px solid #D0E6D5",
        }}
      >
        <ThumbsUp className="w-3 h-3" />
        {rating?.worth_it_count || 0}
      </button>

      <button
        onClick={() => handleVote("not_really")}
        disabled={isLoading || createOrUpdateMutation.isPending || hasRated}
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all active:scale-95 disabled:opacity-50"
        style={{
          backgroundColor: "var(--bg-subtle)",
          color: "#D98B62",
          border: "1px solid #EDD5C8",
        }}
      >
        <ThumbsDown className="w-3 h-3" />
        {rating?.not_really_count || 0}
      </button>

      {total > 0 && (
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
          style={{ backgroundColor: "#E8F2EC", color: "#2E6B4F" }}
        >
          {worthItPercent}%
        </span>
      )}
    </div>
  );
}