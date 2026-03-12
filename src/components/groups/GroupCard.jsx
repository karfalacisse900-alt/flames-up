import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Star, Users, DollarSign, ChevronRight, Heart } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function GroupCard({ group, isMember, onJoin, isJoining }) {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: reviews = [] } = useQuery({
    queryKey: ["groupReviews", group.id],
    queryFn: () => base44.entities.GroupReview.filter({ group_id: group.id }, "-created_date", 5),
  });

  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : 0;

  const upvoteMutation = useMutation({
    mutationFn: async () => {
      const isUpvoted = group.upvoted_by?.includes(user.email);
      const newUpvotedBy = isUpvoted
        ? group.upvoted_by.filter((e) => e !== user.email)
        : [...(group.upvoted_by || []), user.email];
      await base44.entities.Group.update(group.id, {
        upvoted_by: newUpvotedBy,
        upvotes: newUpvotedBy.length,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });

  const isUpvoted = group.upvoted_by?.includes(user?.email);

  return (
    <div
      className="p-4 rounded-2xl border transition-all hover:shadow-md"
      style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)" }}>
      <div className="flex gap-3">
        {/* Avatar */}
        <Link
          to={`/GroupHub?id=${group.id}`}
          className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border"
          style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-subtle)" }}>
          {group.avatar_url ? (
            <img src={group.avatar_url} alt={group.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">{group.name.charAt(0)}</div>
          )}
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <Link to={`/GroupHub?id=${group.id}`} className="group">
            <h3 className="font-bold text-sm group-hover:opacity-70 transition-opacity" style={{ color: "var(--text-primary)" }}>
              {group.name}
            </h3>
          </Link>

          {/* Meta */}
          <div className="flex flex-wrap gap-3 mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {group.member_count || 0} members
            </div>
            {group.type === "paid" && (
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                ${group.monthly_fee}/mo
              </div>
            )}
            {reviews.length > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" />
                {avgRating} ({reviews.length})
              </div>
            )}
          </div>

          {/* Tags */}
          {group.tags && group.tags.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {group.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end justify-between">
          <button
            onClick={() => upvoteMutation.mutate()}
            className="p-1.5 rounded-lg transition-all"
            style={{
              backgroundColor: isUpvoted ? "var(--accent-primary-light)" : "var(--bg-subtle)",
            }}
            disabled={!user}>
            <Heart
              className="w-4 h-4"
              style={{
                color: isUpvoted ? "var(--accent-primary)" : "var(--text-hint)",
                fill: isUpvoted ? "var(--accent-primary)" : "none",
              }}
            />
          </button>

          {isMember ? (
            <Link
              to={`/GroupHub?id=${group.id}`}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ backgroundColor: "var(--accent-primary)", color: "#fff" }}>
              Open
              <ChevronRight className="w-3 h-3" />
            </Link>
          ) : (
            <button
              onClick={onJoin}
              disabled={isJoining || !user}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
              style={{
                backgroundColor: "var(--accent-primary)",
                color: "#fff",
              }}>
              {isJoining ? "Joining..." : "Join"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}