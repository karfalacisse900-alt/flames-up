import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Clock, MapPin, Users, User, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ACTIVITY_EMOJI = {
  study: "📚",
  sports: "⚽",
  coffee: "☕",
  hangout: "🎉",
  gaming: "🎮",
  other: "✨",
};

export default function LivePostCard({ post, user, onUpdate }) {
  const [joining, setJoining] = useState(false);

  const timeRemaining = () => {
    const expires = new Date(post.expires_at);
    const now = new Date();
    const diff = expires - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m left`;
    if (minutes > 0) return `${minutes}m left`;
    return "Expiring soon";
  };

  const isJoined = post.participants?.some(p => p.email === user?.email);
  const participantCount = post.participants?.length || 0;
  const isFull = post.participant_limit && participantCount >= post.participant_limit;
  const isCreator = post.author_email === user?.email;

  const handleJoin = async () => {
    if (!user?.email) return;
    setJoining(true);

    try {
      if (isJoined) {
        // Leave
        const updated = post.participants.filter(p => p.email !== user.email);
        await base44.entities.LivePost.update(post.id, {
          participants: updated,
          is_full: post.participant_limit ? updated.length >= post.participant_limit : false,
        });
      } else {
        // Join
        if (isFull) return;
        const updated = [
          ...(post.participants || []),
          {
            email: user.email,
            name: user.full_name || user.username,
            avatar_url: user.avatar_url || "",
            joined_at: new Date().toISOString(),
          }
        ];
        await base44.entities.LivePost.update(post.id, {
          participants: updated,
          is_full: post.participant_limit ? updated.length >= post.participant_limit : false,
        });
      }
      onUpdate?.();
    } catch (err) {
      console.error("Join/leave failed:", err);
    }
    setJoining(false);
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this live post?")) return;
    await base44.entities.LivePost.delete(post.id);
    onUpdate?.();
  };

  return (
    <div className="rounded-2xl p-4" style={{ 
      backgroundColor: "var(--bg-card)", 
      border: "2px solid var(--accent-primary)",
      boxShadow: "0 4px 12px rgba(46, 107, 79, 0.15)"
    }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-lg font-bold"
            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--accent-primary)" }}>
            {post.is_anonymous ? (
              <User className="w-5 h-5" />
            ) : post.author_avatar_url ? (
              <img src={post.author_avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              (post.author_name?.[0] || "U").toUpperCase()
            )}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {post.is_anonymous ? "Anonymous" : post.author_name}
            </p>
            <p className="text-xs flex items-center gap-1" style={{ color: "var(--text-hint)" }}>
              <Clock className="w-3 h-3" />
              {timeRemaining()}
            </p>
          </div>
        </div>
        <Badge variant="secondary" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
          <span className="mr-1">{ACTIVITY_EMOJI[post.activity_type] || "✨"}</span>
          Live
        </Badge>
      </div>

      {/* Content */}
      <h3 className="text-base font-bold mb-2" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
        {post.title}
      </h3>
      {post.description && (
        <p className="text-sm mb-3 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {post.description}
        </p>
      )}

      {/* Location */}
      {post.location_name && (
        <div className="flex items-center gap-2 mb-3 text-sm" style={{ color: "var(--text-secondary)" }}>
          <MapPin className="w-4 h-4" />
          <span>{post.location_name}</span>
          {post.location_city && <span className="text-xs">• {post.location_city}</span>}
        </div>
      )}

      {/* Participants */}
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {participantCount} {participantCount === 1 ? "person" : "people"} joined
          {post.participant_limit && ` • ${post.participant_limit} max`}
        </p>
      </div>

      {/* Participant avatars */}
      {participantCount > 0 && (
        <div className="flex items-center gap-1 mb-3 flex-wrap">
          {post.participants.slice(0, 8).map((p, i) => (
            <div key={i} className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-xs font-semibold"
              style={{ backgroundColor: "var(--bg-subtle)", color: "var(--accent-primary)", border: "2px solid var(--bg-card)" }}>
              {p.avatar_url ? (
                <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                (p.name?.[0] || "?").toUpperCase()
              )}
            </div>
          ))}
          {participantCount > 8 && (
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: "var(--accent-primary)", color: "white" }}>
              +{participantCount - 8}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {!isCreator && (
          <Button
            onClick={handleJoin}
            disabled={joining || (isFull && !isJoined)}
            className="flex-1"
            variant={isJoined ? "outline" : "default"}
            style={{
              backgroundColor: isJoined ? "transparent" : (isFull ? "var(--border-medium)" : "var(--accent-primary)"),
              color: isJoined ? "var(--accent-primary)" : "white",
              borderColor: isJoined ? "var(--accent-primary)" : "transparent"
            }}>
            {joining ? "..." : isFull && !isJoined ? "Full" : isJoined ? "Leave" : "Join"}
          </Button>
        )}
        {isCreator && (
          <Button onClick={handleDelete} variant="outline" className="flex-1" style={{ color: "var(--text-secondary)" }}>
            Delete Post
          </Button>
        )}
      </div>

      {isFull && !isJoined && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(229, 62, 62, 0.1)" }}>
          <AlertCircle className="w-4 h-4" style={{ color: "#E53E3E" }} />
          <p className="text-xs font-semibold" style={{ color: "#E53E3E" }}>Event full</p>
        </div>
      )}
    </div>
  );
}