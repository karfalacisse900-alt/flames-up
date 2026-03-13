import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const REACTIONS = ["🔥", "😂", "👏", "🤯", "💡"];

export default function NowStatusCard({ status, currentUser, onView, onRefresh }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [userReaction, setUserReaction] = useState(null);

  // Calculate time left
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const expires = new Date(status.expires_at);
      const diff = expires - now;

      if (diff <= 0) {
        setTimeLeft("Expired");
      } else {
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) setTimeLeft(`${days}d`);
        else if (hours > 0) setTimeLeft(`${hours}h`);
        else setTimeLeft(`${minutes}m`);
      }
    }, 60000);

    return () => clearInterval(timer);
  }, [status.expires_at]);

  // Check user reaction
  useEffect(() => {
    if (currentUser && status.reaction_users) {
      for (const [emoji, users] of Object.entries(status.reaction_users)) {
        if (users.includes(currentUser.email)) {
          setUserReaction(emoji);
          break;
        }
      }
    }
  }, [status, currentUser]);

  const handleReaction = async (emoji) => {
    if (!currentUser) return;

    const reactions = { ...status.reactions } || {};
    const reactionUsers = { ...status.reaction_users } || {};

    if (userReaction === emoji) {
      // Remove reaction
      reactions[emoji] = (reactions[emoji] || 1) - 1;
      if (reactions[emoji] === 0) delete reactions[emoji];
      reactionUsers[emoji] = (reactionUsers[emoji] || []).filter(e => e !== currentUser.email);
      if (reactionUsers[emoji].length === 0) delete reactionUsers[emoji];
      setUserReaction(null);
    } else {
      // Add reaction
      if (userReaction) {
        reactions[userReaction] = (reactions[userReaction] || 1) - 1;
        reactionUsers[userReaction] = (reactionUsers[userReaction] || []).filter(e => e !== currentUser.email);
      }
      reactions[emoji] = (reactions[emoji] || 0) + 1;
      reactionUsers[emoji] = [...(reactionUsers[emoji] || []), currentUser.email];
      setUserReaction(emoji);
    }

    await base44.entities.NowStatus.update(status.id, { reactions, reaction_users: reactionUsers });
  };

  // Determine card size based on engagement
  const totalReactions = Object.values(status.reactions || {}).reduce((a, b) => a + b, 0);
  const remixCount = status.remix_count || 0;
  const engagement = totalReactions + remixCount;

  let heightClass = "h-64"; // small
  if (engagement > 10) heightClass = "h-80"; // medium
  if (engagement > 20 || status.content_type === "video") heightClass = "h-96"; // large

  return (
    <div onClick={onView}
      className={`${heightClass} rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-lg active:scale-95`}
      style={{
        backgroundColor: "var(--bg-card)",
        boxShadow: "var(--elevation-2)",
        border: "1px solid var(--border-light)"
      }}>
      
      {/* Media */}
      {status.media_url && (
        <div className="w-full h-3/4 overflow-hidden bg-gray-200">
          <img src={status.media_url} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Content */}
      <div className="p-3 h-1/4 flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <img src={status.author_avatar_url || "https://via.placeholder.com/32"}
            alt="" className="w-6 h-6 rounded-full" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>
              {status.author_name?.split(" ")[0] || "User"}
            </p>
          </div>
          <span className="text-[10px] font-medium" style={{ color: "var(--text-hint)" }}>
            {timeLeft}
          </span>
        </div>

        {/* Text preview */}
        {status.content_type === "text" && (
          <p className="text-xs line-clamp-2 mb-2" style={{ color: "var(--text-secondary)" }}>
            {status.text}
          </p>
        )}

        {/* Reactions */}
        <div className="flex gap-1 flex-wrap">
          {REACTIONS.map(emoji => {
            const count = status.reactions?.[emoji] || 0;
            return (
              <button key={emoji}
                onClick={(e) => {
                  e.stopPropagation();
                  handleReaction(emoji);
                }}
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-all"
                style={{
                  backgroundColor: userReaction === emoji ? "var(--accent-primary)" : "var(--bg-subtle)",
                  border: `1px solid ${userReaction === emoji ? "var(--accent-primary)" : "var(--border-light)"}`
                }}>
                <span>{emoji}</span>
                {count > 0 && <span style={{ color: userReaction === emoji ? "white" : "var(--text-hint)" }} className="text-[10px] font-semibold">{count}</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}