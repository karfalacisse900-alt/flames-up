import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, MapPin, Link as LinkIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";

const EVENT_TYPES = [
  { key: "meetup", label: "Meetup", emoji: "🤝" },
  { key: "watch_party", label: "Watch Party", emoji: "🎬" },
  { key: "discussion", label: "Discussion", emoji: "💬" },
  { key: "qa_session", label: "Q&A", emoji: "❓" },
  { key: "other", label: "Other", emoji: "📅" },
];

export default function CreateEventModal({ group, user, onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState("meetup");
  const [eventDate, setEventDate] = useState("");
  const [duration, setDuration] = useState(60);
  const [locationName, setLocationName] = useState(group.location_name || "");
  const [locationAddress, setLocationAddress] = useState("");
  const [locationUrl, setLocationUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const isRealWorld = group.group_type === "realworld";

  const handleSubmit = async () => {
    if (!title.trim() || !eventDate) return;
    setSaving(true);
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
      creator_email: user.email,
      creator_name: user.full_name || user.email,
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
        style={{ backgroundColor: "var(--bg-card)", maxHeight: "90vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>
        <div className="h-1.5 w-12 rounded-full mx-auto mt-3" style={{ backgroundColor: "var(--border-medium)" }} />
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Create Event</h2>
            <button onClick={onClose}><X className="w-5 h-5" style={{ color: "var(--text-hint)" }} /></button>
          </div>

          <div className="space-y-4 pb-6">
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
              <div className="space-y-2 p-3 rounded-xl" style={{ backgroundColor: "#E8F2EC", border: "1px solid #2E6B4F30" }}>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" style={{ color: "#2E6B4F" }} />
                  <p className="text-xs font-bold" style={{ color: "#2E6B4F" }}>Physical Location</p>
                </div>
                <input value={locationName} onChange={e => setLocationName(e.target.value)}
                  placeholder="Location name (e.g. Central Park, Sunrise Yoga Studio)"
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: "rgba(255,255,255,0.7)", border: "1px solid #2E6B4F30", color: "var(--text-primary)" }} />
                <input value={locationAddress} onChange={e => setLocationAddress(e.target.value)}
                  placeholder="Address (optional)"
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: "rgba(255,255,255,0.7)", border: "1px solid #2E6B4F30", color: "var(--text-primary)" }} />
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