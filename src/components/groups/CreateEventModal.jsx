import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, MapPin, Link as LinkIcon, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";

const EVENT_TYPES = [
  { key: "meetup", label: "Meetup", emoji: "🤝" },
  { key: "watch_party", label: "Watch Party", emoji: "🎬" },
  { key: "discussion", label: "Discussion", emoji: "💬" },
  { key: "qa_session", label: "Q&A", emoji: "❓" },
  { key: "other", label: "Other", emoji: "📅" },
];

const VENUE_TYPES = [
  { key: "park", label: "Park", emoji: "🌳" },
  { key: "cafe", label: "Café", emoji: "☕" },
  { key: "library", label: "Library", emoji: "📚" },
  { key: "community", label: "Community Space", emoji: "🏛️" },
  { key: "venue", label: "Public Venue", emoji: "🎪" },
  { key: "other", label: "Other", emoji: "📍" },
];

export default function CreateEventModal({ group, user, onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState("meetup");
  const [eventDate, setEventDate] = useState("");
  const [duration, setDuration] = useState(60);
  const [locationName, setLocationName] = useState(group.location_name || "");
  const [locationAddress, setLocationAddress] = useState("");
  const [venueType, setVenueType] = useState("other");
  const [locationUrl, setLocationUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const isRealWorld = group.group_type === "realworld";

  const handleSubmit = async () => {
    if (!title.trim() || !eventDate) return;
    setSaving(true);

    // Fetch current user's verification status
    let hostIsVerified = false;
    let hostAvgRating = 0;
    let hostReviewCount = 0;
    try {
      const userRecords = await base44.entities.User.filter({ email: user.email });
      if (userRecords.length > 0) {
        hostIsVerified = !!userRecords[0].is_verified_host;
        hostAvgRating = userRecords[0].host_avg_rating || 0;
        hostReviewCount = userRecords[0].host_review_count || 0;
      }
    } catch (_) {}

    await base44.entities.GroupEvent.create({
      group_id: group.id,
      group_name: group.name,
      title: title.trim(),
      description: description.trim() || undefined,
      event_type: eventType,
      event_date: new Date(eventDate).toISOString(),
      duration_minutes: duration,
      location_name: locationName.trim() || undefined,
      location_address: locationAddress.trim() || undefined,
      location_url: locationUrl.trim() || undefined,
      venue_type: isRealWorld ? venueType : "online",
      creator_email: user.email,
      creator_name: user.full_name || user.email,
      host_is_verified: hostIsVerified,
      host_avg_rating: hostAvgRating,
      host_review_count: hostReviewCount,
      rsvp_yes: [user.email],
      rsvp_interested: [],
      rsvp_no: [],
      is_active: true,
    });
    setSaving(false);
    onCreated();
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={onClose}>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-lg mx-auto rounded-t-3xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-card)", maxHeight: "92vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>
        <div className="h-1.5 w-12 rounded-full mx-auto mt-3" style={{ backgroundColor: "var(--border-medium)" }} />
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Create Event</h2>
            <button onClick={onClose}><X className="w-5 h-5" style={{ color: "var(--text-hint)" }} /></button>
          </div>

          <div className="space-y-4 pb-8">
            {/* Type */}
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Event Type</p>
              <div className="flex flex-wrap gap-2">
                {EVENT_TYPES.map(t => (
                  <button key={t.key} onClick={() => setEventType(t.key)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                    style={{
                      backgroundColor: eventType === t.key ? "var(--accent-primary)" : "transparent",
                      color: eventType === t.key ? "#fff" : "var(--text-secondary)",
                      borderColor: eventType === t.key ? "var(--accent-primary)" : "var(--border-light)",
                    }}>
                    {t.emoji} {t.label}
                  </button>
                ))}
              </div>
            </div>

            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Event title *"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />

            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" rows={2}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Date & Time *</p>
                <input type="datetime-local" value={eventDate} onChange={e => setEventDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
              </div>
              <div>
                <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Duration (min)</p>
                <input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} min={15} step={15}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
              </div>
            </div>

            {/* Location fields */}
            {isRealWorld ? (
              <div className="space-y-3 p-3 rounded-xl" style={{ backgroundColor: "#E8F2EC", border: "1px solid #2E6B4F30" }}>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" style={{ color: "#2E6B4F" }} />
                  <p className="text-xs font-bold" style={{ color: "#2E6B4F" }}>Physical Location</p>
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold"
                    style={{ backgroundColor: "rgba(46,107,79,0.12)", color: "#2E6B4F" }}>
                    Choose a public place
                  </span>
                </div>
                {/* Venue type picker */}
                <div>
                  <p className="text-[11px] font-semibold mb-1.5" style={{ color: "#2E6B4F" }}>Venue type</p>
                  <div className="flex flex-wrap gap-1.5">
                    {VENUE_TYPES.map(v => (
                      <button key={v.key} onClick={() => setVenueType(v.key)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
                        style={{
                          backgroundColor: venueType === v.key ? "#2E6B4F" : "rgba(255,255,255,0.6)",
                          color: venueType === v.key ? "#fff" : "#2E6B4F",
                          border: `1px solid ${venueType === v.key ? "#2E6B4F" : "#2E6B4F30"}`,
                        }}>
                        {v.emoji} {v.label}
                      </button>
                    ))}
                  </div>
                </div>
                <input value={locationName} onChange={e => setLocationName(e.target.value)}
                  placeholder="Location name (e.g. Central Park, Sunrise Café)"
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: "rgba(255,255,255,0.7)", border: "1px solid #2E6B4F30", color: "var(--text-primary)" }} />
                <input value={locationAddress} onChange={e => setLocationAddress(e.target.value)}
                  placeholder="Address (optional, but recommended)"
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: "rgba(255,255,255,0.7)", border: "1px solid #2E6B4F30", color: "var(--text-primary)" }} />
                <div className="text-[11px] px-2 py-1.5 rounded-lg" style={{ backgroundColor: "rgba(46,107,79,0.1)", color: "#2E6B4F" }}>
                  🛡️ We recommend public spaces like parks, cafés, or libraries for safety.
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 shrink-0" style={{ color: "var(--text-hint)" }} />
                <input value={locationUrl} onChange={e => setLocationUrl(e.target.value)}
                  placeholder="Meeting link (Zoom, Google Meet, etc.) – optional"
                  className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
              </div>
            )}

            <button onClick={handleSubmit} disabled={saving || !title.trim() || !eventDate}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-50 transition-all active:scale-95"
              style={{ backgroundColor: "var(--accent-primary)", boxShadow: "0 4px 16px rgba(46,107,79,0.3)" }}>
              {saving ? "Creating..." : "📅 Create Event"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}