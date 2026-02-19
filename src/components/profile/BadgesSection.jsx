import React from "react";

export const BADGE_DEFINITIONS = {
  first_post:       { label: "First Post",         emoji: "✍️",  desc: "Published your first post",           color: "#7BA7D4" },
  popular_post:     { label: "Popular Post",        emoji: "🔥",  desc: "Post received 10+ likes",             color: "#E07B54" },
  helpful:          { label: "Helpful",             emoji: "🤝",  desc: "Gave 20+ replies",                    color: "#6F8F72" },
  art_creator:      { label: "Art Creator",         emoji: "🎨",  desc: "Uploaded first artwork",              color: "#B07ACC" },
  game_champion:    { label: "Game Champion",       emoji: "🏆",  desc: "Won 10+ games",                       color: "#B7A67A" },
  community_pillar: { label: "Community Pillar",   emoji: "🏛️",  desc: "Active for 30+ days",                  color: "#6F8F72" },
  moderator:        { label: "Moderator",           emoji: "🛡️",  desc: "Trusted community moderator",         color: "#4A90D9" },
  early_adopter:    { label: "Early Adopter",       emoji: "⭐",  desc: "Joined in the early days",            color: "#F0C040" },
  referral_star:    { label: "Referral Star",       emoji: "🌟",  desc: "Referred 5+ friends",                 color: "#FFB347" },
  voice_of_reason:  { label: "Voice of Reason",    emoji: "🎙️",  desc: "10+ voice replies posted",            color: "#9B8EAD" },
};

export default function BadgesSection({ badges = [] }) {
  if (badges.length === 0) return (
    <p className="text-sm text-center py-6" style={{ color: "var(--text-hint)" }}>No badges earned yet</p>
  );

  return (
    <div className="grid grid-cols-3 gap-3 mt-2">
      {badges.map((key) => {
        const badge = BADGE_DEFINITIONS[key];
        if (!badge) return null;
        return (
          <div key={key} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl text-center"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl"
              style={{ backgroundColor: badge.color + "22", border: `2px solid ${badge.color}55` }}>
              {badge.emoji}
            </div>
            <p className="text-[11px] font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>{badge.label}</p>
            <p className="text-[9px] leading-tight" style={{ color: "var(--text-hint)" }}>{badge.desc}</p>
          </div>
        );
      })}
    </div>
  );
}