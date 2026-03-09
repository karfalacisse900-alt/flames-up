import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, MapPin, X } from "lucide-react";

const ACTIVITY_TAGS = [
  { key: "eating", label: "Eating", emoji: "🍔" },
  { key: "studying", label: "Studying", emoji: "📚" },
  { key: "working", label: "Working", emoji: "💻" },
  { key: "meeting_friends", label: "Meeting friends", emoji: "👋" },
  { key: "watching_event", label: "Watching event", emoji: "🎭" },
  { key: "walking", label: "Walking", emoji: "🚶" },
  { key: "exploring", label: "Exploring", emoji: "🔍" },
  { key: "other", label: "Just here", emoji: "📍" },
];

function getInitials(name) {
  return (name || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}
function getAvatarColor(email) {
  const colors = ["#2E6B4F","#D98B62","#7C69C4","#E05C7A","#1D4ED8","#16A34A","#9333EA"];
  let h = 0;
  for (const c of (email || "")) h = (h * 31 + c.charCodeAt(0)) % colors.length;
  return colors[h];
}

export default function PeopleHereNow({ locationName, locationData, user }) {
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const { data: presences = [] } = useQuery({
    queryKey: ["presences", locationName],
    queryFn: async () => {
      const all = await base44.entities.LocationPresence.filter({ location_name: locationName });
      const now = new Date();
      return all.filter(p => p.is_visible && new Date(p.expires_at) > now);
    },
    refetchInterval: 30000,
    enabled: !!locationName,
  });

  const myPresence = presences.find(p => p.user_email === user?.email);

  const checkIn = async (activityTag) => {
    if (!user) return;
    setSaving(true);
    setShowPicker(false);
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    // Remove existing presence first
    const existing = await base44.entities.LocationPresence.filter({ user_email: user.email, location_name: locationName });
    for (const e of existing) await base44.entities.LocationPresence.delete(e.id);
    await base44.entities.LocationPresence.create({
      user_email: user.email,
      user_name: user.display_name || user.full_name || user.email.split("@")[0],
      avatar_url: user.avatar_url || "",
      location_name: locationName,
      location_city: locationData?.city || "",
      location_lat: locationData?.lat,
      location_lng: locationData?.lng,
      activity_tag: activityTag,
      expires_at: expiresAt,
      is_visible: true,
    });
    qc.invalidateQueries({ queryKey: ["presences", locationName] });
    setSaving(false);
  };

  const checkOut = async () => {
    if (!myPresence) return;
    await base44.entities.LocationPresence.delete(myPresence.id);
    qc.invalidateQueries({ queryKey: ["presences", locationName] });
  };

  if (presences.length === 0 && !user) return null;

  return (
    <div className="mx-4 mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
            People Here Now {presences.length > 0 && <span className="font-normal" style={{ color: "var(--text-hint)" }}>({presences.length})</span>}
          </p>
        </div>
        {user && (
          myPresence ? (
            <button onClick={checkOut} className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: "#FEE2E2", color: "#EF4444" }}>
              <X className="w-3 h-3" /> Leave
            </button>
          ) : (
            <button onClick={() => setShowPicker(true)} disabled={saving}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: "var(--accent-primary)" }}>
              <MapPin className="w-3 h-3" /> {saving ? "…" : "I'm Here"}
            </button>
          )
        )}
      </div>

      {/* Activity picker */}
      {showPicker && (
        <div className="mb-2 p-3 rounded-2xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>What are you doing?</p>
          <div className="flex flex-wrap gap-1.5">
            {ACTIVITY_TAGS.map(a => (
              <button key={a.key} onClick={() => checkIn(a.key)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all active:scale-95"
                style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-secondary)" }}>
                {a.emoji} {a.label}
              </button>
            ))}
          </div>
          <button onClick={() => setShowPicker(false)} className="text-xs mt-2 w-full text-center" style={{ color: "var(--text-hint)" }}>Cancel</button>
        </div>
      )}

      {presences.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {presences.map(p => {
            const tag = ACTIVITY_TAGS.find(a => a.key === p.activity_tag);
            const isMe = p.user_email === user?.email;
            return (
              <div key={p.id} className="flex-shrink-0 flex flex-col items-center gap-1">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ backgroundColor: getAvatarColor(p.user_email) }}>
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : getInitials(p.user_name)}
                  </div>
                  {tag && (
                    <span className="absolute -bottom-0.5 -right-0.5 text-[10px]">{tag.emoji}</span>
                  )}
                  {isMe && (
                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                  )}
                </div>
                <p className="text-[10px] font-semibold text-center max-w-[52px] truncate" style={{ color: "var(--text-secondary)" }}>
                  {isMe ? "You" : p.user_name?.split(" ")[0]}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}