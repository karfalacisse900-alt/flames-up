import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Zap, MapPin, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";

const ACTIVITIES = [
  { key: "chess", label: "Play chess", emoji: "♟️" },
  { key: "coffee", label: "Grab coffee", emoji: "☕" },
  { key: "run", label: "Morning run", emoji: "🏃" },
  { key: "food", label: "Try this food spot", emoji: "🍕" },
  { key: "sports", label: "Play a sport", emoji: "⚽" },
  { key: "explore", label: "Explore together", emoji: "🗺️" },
  { key: "study", label: "Study session", emoji: "📚" },
  { key: "chill", label: "Just chill", emoji: "😎" },
  { key: "other", label: "Something else", emoji: "💬" },
];

export default function SpontaneousMeetupModal({ locationName, locationData, user, onClose, onCreated }) {
  const [activity, setActivity] = useState("");
  const [customText, setCustomText] = useState("");
  const [saving, setSaving] = useState(false);

  const actInfo = ACTIVITIES.find(a => a.key === activity);
  const defaultText = actInfo ? `${actInfo.emoji} Anyone want to ${actInfo.label.toLowerCase()} at ${locationName}? ${actInfo.emoji}` : "";

  const handlePost = async () => {
    if (!activity) return;
    setSaving(true);
    const text = customText.trim() || defaultText;
    await base44.entities.CommunityPost.create({
      type: "opinion",
      body: `<p>${text}</p>`,
      author_email: user.email,
      author_name: user.display_name || user.full_name || "Someone",
      author_avatar_url: user.avatar_url || "",
      is_anonymous: false,
      location_name: locationName,
      location_city: locationData?.city || "",
      location_region: locationData?.region || "",
      location_country: locationData?.country || "",
      location_lat: locationData?.lat,
      location_lng: locationData?.lng,
      place_tags: ["meetup"],
      tags: ["spontaneous_meetup"],
      upvotes: 0, downvotes: 0, comment_count: 0, engagement_score: 0,
      is_daily_spotlight: false,
    });
    setSaving(false);
    onCreated?.();
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-lg rounded-t-3xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-card)", maxHeight: "88vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>
        <div className="h-1.5 w-12 rounded-full mx-auto mt-3" style={{ backgroundColor: "var(--border-medium)" }} />
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)" }}>
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Spontaneous Meetup</h2>
                <div className="flex items-center gap-1 text-xs" style={{ color: "var(--text-hint)" }}>
                  <MapPin className="w-3 h-3" /> {locationName}
                </div>
              </div>
            </div>
            <button onClick={onClose}><X className="w-5 h-5" style={{ color: "var(--text-hint)" }} /></button>
          </div>

          <p className="text-sm mt-3 mb-4" style={{ color: "var(--text-secondary)" }}>
            Invite people nearby to join you right now. Your post will appear in the location feed.
          </p>

          {/* Activity picker */}
          <p className="text-xs font-bold mb-2" style={{ color: "var(--text-secondary)" }}>What do you want to do?</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {ACTIVITIES.map(a => (
              <button key={a.key} onClick={() => setActivity(a.key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95"
                style={{
                  backgroundColor: activity === a.key ? "var(--accent-primary)" : "var(--bg-subtle)",
                  color: activity === a.key ? "#fff" : "var(--text-secondary)",
                  border: `1px solid ${activity === a.key ? "transparent" : "var(--border-light)"}`,
                }}>
                {a.emoji} {a.label}
              </button>
            ))}
          </div>

          {/* Custom message */}
          {activity && (
            <div className="mb-4">
              <p className="text-xs font-bold mb-2" style={{ color: "var(--text-secondary)" }}>Custom message (optional)</p>
              <textarea value={customText} onChange={e => setCustomText(e.target.value)}
                placeholder={defaultText}
                rows={2} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
            </div>
          )}

          {/* Info */}
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-4"
            style={{ backgroundColor: "var(--accent-primary-light)", border: "1px solid var(--accent-primary)22" }}>
            <Users className="w-4 h-4 shrink-0" style={{ color: "var(--accent-primary)" }} />
            <p className="text-xs" style={{ color: "var(--accent-primary)" }}>
              People at this location and in your groups will see this invite in their nearby feed.
            </p>
          </div>

          <button onClick={handlePost} disabled={!activity || saving}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-50 transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)", boxShadow: "0 4px 16px rgba(46,107,79,0.3)" }}>
            {saving ? "Posting…" : "⚡ Post Meetup Invite"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}