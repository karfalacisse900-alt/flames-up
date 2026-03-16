import React, { useState } from "react";
import { MapPin, Clock, MessageCircle, Heart, Users, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const CATEGORY_CONFIG = {
  food:    { emoji: "🍕", label: "Food", color: "#f97316" },
  sports:  { emoji: "⚽", label: "Sports", color: "#22c55e" },
  music:   { emoji: "🎵", label: "Music", color: "#a855f7" },
  market:  { emoji: "🛍️", label: "Market", color: "#06b6d4" },
  study:   { emoji: "📚", label: "Study", color: "#3b82f6" },
  social:  { emoji: "🎉", label: "Social", color: "#ec4899" },
  other:   { emoji: "📍", label: "Local", color: "#6366f1" },
};

function timeLeft(expiresAt) {
  const diff = new Date(expiresAt) - Date.now();
  if (diff <= 0) return "Expired";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export default function LiveActivityCard({ activity, user, onUpdate }) {
  const navigate = useNavigate();
  const cat = CATEGORY_CONFIG[activity.category] || CATEGORY_CONFIG.other;
  const hasReacted = user?.email && activity.reacted_by?.includes(user.email);
  const isGoing = user?.email && activity.going_by?.includes(user.email);
  const [loading, setLoading] = useState(false);

  const handleReact = async (e) => {
    e.stopPropagation();
    if (!user || loading) return;
    setLoading(true);
    const reacted = activity.reacted_by?.includes(user.email);
    await base44.entities.LiveActivity.update(activity.id, {
      reaction_count: reacted ? Math.max(0, (activity.reaction_count || 0) - 1) : (activity.reaction_count || 0) + 1,
      reacted_by: reacted
        ? (activity.reacted_by || []).filter(e => e !== user.email)
        : [...(activity.reacted_by || []), user.email],
    });
    onUpdate?.();
    setLoading(false);
  };

  const handleGoing = async (e) => {
    e.stopPropagation();
    if (!user || loading) return;
    setLoading(true);
    const going = activity.going_by?.includes(user.email);
    await base44.entities.LiveActivity.update(activity.id, {
      going_count: going ? Math.max(0, (activity.going_count || 0) - 1) : (activity.going_count || 0) + 1,
      going_by: going
        ? (activity.going_by || []).filter(e => e !== user.email)
        : [...(activity.going_by || []), user.email],
    });
    onUpdate?.();
    setLoading(false);
  };

  const expired = new Date(activity.expires_at) < new Date();

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-light)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        opacity: expired ? 0.5 : 1,
      }}
    >
      {/* Image */}
      {activity.image_url && (
        <div className="relative w-full" style={{ height: 180 }}>
          <img src={activity.image_url} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      )}

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-3">
          {/* Category badge */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ backgroundColor: `${cat.color}18` }}
          >
            {cat.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                {activity.title}
              </h3>
              <span
                className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${cat.color}18`, color: cat.color }}
              >
                {cat.label}
              </span>
            </div>
            {activity.description && (
              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {activity.description}
              </p>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          {activity.location_name && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" style={{ color: "var(--text-hint)" }} />
              <span className="text-[11px]" style={{ color: "var(--text-hint)" }}>{activity.location_name}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" style={{ color: expired ? "#ef4444" : "#f97316" }} />
            <span className="text-[11px] font-semibold" style={{ color: expired ? "#ef4444" : "#f97316" }}>
              {expired ? "Expired" : timeLeft(activity.expires_at)}
            </span>
          </div>
          <span className="text-[11px]" style={{ color: "var(--text-hint)" }}>
            {activity.is_anonymous ? "Anonymous" : activity.author_name} · {timeAgo(activity.created_date)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2 border-t" style={{ borderColor: "var(--border-subtle)" }}>
          <button onClick={handleReact} className="flex items-center gap-1.5 text-sm pt-1" style={{ color: hasReacted ? "#e11d48" : "var(--text-hint)" }}>
            <Heart className="w-4 h-4" style={{ fill: hasReacted ? "#e11d48" : "none" }} />
            <span className="text-xs font-semibold">{activity.reaction_count || 0}</span>
          </button>

          <button
            onClick={handleGoing}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full mt-1 transition-all"
            style={{
              backgroundColor: isGoing ? "#22c55e" : "var(--bg-subtle)",
              color: isGoing ? "#fff" : "var(--text-secondary)",
              border: `1px solid ${isGoing ? "#22c55e" : "var(--border-light)"}`,
            }}
          >
            <Users className="w-3.5 h-3.5" />
            {isGoing ? "Going" : "I'm going"} {activity.going_count > 0 ? `· ${activity.going_count}` : ""}
          </button>

          {!activity.is_anonymous && activity.author_email !== user?.email && (
            <button
              onClick={() => navigate(createPageUrl("Messages") + `?dm=${activity.author_email}`)}
              className="flex items-center gap-1 text-xs font-semibold mt-1 ml-auto"
              style={{ color: "var(--text-hint)" }}
            >
              <Send className="w-3.5 h-3.5" />
              DM
            </button>
          )}
        </div>
      </div>
    </div>
  );
}