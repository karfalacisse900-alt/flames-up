import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ThumbsUp, ThumbsDown, Star, Bookmark, Gamepad2, Palette } from "lucide-react";

const activityIcon = (type) => {
  if (type === "feedback_up") return <ThumbsUp className="w-3.5 h-3.5" style={{ color: "var(--accent-primary)" }} />;
  if (type === "feedback_down") return <ThumbsDown className="w-3.5 h-3.5" style={{ color: "#B86B4B" }} />;
  if (type === "review") return <Star className="w-3.5 h-3.5" style={{ color: "#F59E0B" }} />;
  if (type === "save") return <Bookmark className="w-3.5 h-3.5" style={{ color: "var(--accent-secondary)" }} />;
  if (type === "game") return <Gamepad2 className="w-3.5 h-3.5" style={{ color: "var(--accent-primary)" }} />;
  if (type === "art") return <Palette className="w-3.5 h-3.5" style={{ color: "#B86B4B" }} />;
  return null;
};

const activityLabel = (item) => {
  if (item.type === "feedback_up") return `Liked "${item.title}"`;
  if (item.type === "feedback_down") return `Disliked "${item.title}"`;
  if (item.type === "review") return `Reviewed "${item.title}" (${item.rating}★)`;
  if (item.type === "save") return `Saved "${item.title}"`;
  if (item.type === "game") return `Played ${item.title}`;
  if (item.type === "art") return `Created art: "${item.title}"`;
  return item.title;
};

export default function ActivityHistory({ user }) {
  const { data: feedbacks = [] } = useQuery({
    queryKey: ["userFeedbacks", user?.email],
    queryFn: () => base44.entities.DiscoverFeedback.filter({ user_email: user.email }, "-created_date", 30),
    enabled: !!user?.email,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["userReviewsActivity", user?.email],
    queryFn: () => base44.entities.DiscoverReview.filter({ user_email: user.email }, "-created_date", 20),
    enabled: !!user?.email,
  });

  const { data: savedItems = [] } = useQuery({
    queryKey: ["savedItemsActivity", user?.email],
    queryFn: () => base44.entities.SavedItem.filter({ user_email: user.email }, "-created_date", 20),
    enabled: !!user?.email,
  });

  const { data: gameStats = [] } = useQuery({
    queryKey: ["gameStatsActivity", user?.email],
    queryFn: () => base44.entities.GameStats.filter({ player_email: user.email }, "-updated_date", 10),
    enabled: !!user?.email,
  });

  const { data: artPieces = [] } = useQuery({
    queryKey: ["artActivity", user?.email],
    queryFn: () => base44.entities.ArtPiece.filter({ creator_email: user.email }, "-created_date", 10),
    enabled: !!user?.email,
  });

  const combined = [
    ...feedbacks.map(f => ({ type: f.vote === "up" ? "feedback_up" : "feedback_down", title: f.item_title, date: f.created_date, id: f.id })),
    ...reviews.map(r => ({ type: "review", title: r.item_id, rating: r.rating, date: r.created_date, id: r.id })),
    ...savedItems.map(s => ({ type: "save", title: s.item_title, date: s.created_date, id: s.id })),
    ...gameStats.map(g => ({ type: "game", title: g.game_name?.replace(/-/g, " "), date: g.updated_date, id: g.id })),
    ...artPieces.map(a => ({ type: "art", title: a.title, date: a.created_date, id: a.id })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 40);

  if (combined.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-3xl mb-2">📋</p>
        <p className="text-sm" style={{ color: "var(--text-hint)" }}>No activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {combined.map((item) => (
        <div key={`${item.type}-${item.id}`}
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: "var(--bg-app)" }}>
            {activityIcon(item.type)}
          </div>
          <p className="flex-1 text-xs leading-snug" style={{ color: "var(--text-secondary)" }}>
            {activityLabel(item)}
          </p>
          <p className="text-[10px] shrink-0" style={{ color: "var(--text-hint)" }}>
            {new Date(item.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </p>
        </div>
      ))}
    </div>
  );
}