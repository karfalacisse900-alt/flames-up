import React from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Link as LinkIcon, MapPin, Users, CheckCircle, Star, XCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

const EVENT_TYPE_LABELS = {
  meetup: "Meetup", qa_session: "Q&A Session", watch_party: "Watch Party", discussion: "Discussion", other: "Event",
};
const EVENT_TYPE_EMOJIS = {
  meetup: "🤝", qa_session: "❓", watch_party: "🎬", discussion: "💬", other: "📅",
};

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function GroupEventCard({ event, user, groupId }) {
  const qc = useQueryClient();
  const hasYes = event.rsvp_yes?.includes(user?.email);
  const hasInterested = event.rsvp_interested?.includes(user?.email);
  const isPast = new Date(event.event_date) < new Date();

  const rsvp = async (choice) => {
    if (!user?.email) return;
    const fields = { yes: "rsvp_yes", interested: "rsvp_interested", no: "rsvp_no" };
    const updates = {};
    for (const [key, field] of Object.entries(fields)) {
      const current = event[field] || [];
      if (key === choice) {
        updates[field] = current.includes(user.email)
          ? current.filter(e => e !== user.email) // toggle off
          : [...current, user.email];
      } else {
        updates[field] = current.filter(e => e !== user.email); // remove from others
      }
    }
    await base44.entities.GroupEvent.update(event.id, updates);
    qc.invalidateQueries({ queryKey: ["groupEvents", groupId] });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="mx-4 mb-3 rounded-2xl overflow-hidden"
      style={{
        background: isPast ? "var(--bg-subtle)" : "linear-gradient(135deg, #E8F2EC, #F2EDE4)",
        border: `1.5px solid ${isPast ? "var(--border-light)" : "var(--accent-primary)30"}`,
        boxShadow: isPast ? "none" : "0 2px 12px rgba(46,107,79,0.1)",
      }}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-2xl shrink-0">{EVENT_TYPE_EMOJIS[event.event_type] || "📅"}</span>
            <div className="min-w-0">
              <p className="font-bold text-sm truncate" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{event.title}</p>
              <p className="text-[11px] font-medium" style={{ color: "var(--accent-primary)" }}>{EVENT_TYPE_LABELS[event.event_type]}</p>
            </div>
          </div>
          {isPast && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: "var(--border-light)", color: "var(--text-hint)" }}>Past</span>}
        </div>

        {event.description && <p className="text-xs mb-3 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{event.description}</p>}

        <div className="flex flex-wrap gap-x-3 gap-y-1.5 mb-3">
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
            <Calendar className="w-3.5 h-3.5" style={{ color: "var(--accent-primary)" }} />
            {formatDate(event.event_date)}
          </div>
          {event.duration_minutes && (
            <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
              <Clock className="w-3.5 h-3.5" style={{ color: "var(--accent-primary)" }} />
              {event.duration_minutes} min
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
            <Users className="w-3.5 h-3.5" style={{ color: "var(--accent-primary)" }} />
            {event.rsvp_yes?.length || 0} going · {event.rsvp_interested?.length || 0} interested
          </div>
        </div>

        {/* Physical location */}
        {event.location_name && (
          <button
            onClick={() => {
              const q = event.location_address
                ? encodeURIComponent(event.location_address)
                : encodeURIComponent(event.location_name);
              window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
            }}
            className="flex items-center gap-1.5 text-xs font-semibold mb-3"
            style={{ color: "var(--accent-primary)" }}>
            <MapPin className="w-3 h-3" />
            {event.location_name}
            {event.location_address && <span className="font-normal" style={{ color: "var(--text-hint)" }}>· {event.location_address}</span>}
          </button>
        )}

        {/* Online link */}
        {event.location_url && !event.location_name && (
          <a href={event.location_url} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold mb-3 hover:underline"
            style={{ color: "var(--accent-primary)" }}>
            <LinkIcon className="w-3 h-3" /> Join Link
          </a>
        )}

        {!isPast && user && (
          <div className="flex gap-2">
            <button onClick={() => rsvp("yes")}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
              style={{
                backgroundColor: hasYes ? "var(--accent-primary)" : "var(--bg-card)",
                color: hasYes ? "#fff" : "var(--text-secondary)",
                border: "1px solid var(--border-light)",
              }}>
              <CheckCircle className="w-3.5 h-3.5" /> {hasYes ? "Going ✓" : "Going"}
            </button>
            <button onClick={() => rsvp("interested")}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
              style={{
                backgroundColor: hasInterested ? "#FEF3C7" : "var(--bg-card)",
                color: hasInterested ? "#D97706" : "var(--text-secondary)",
                border: "1px solid var(--border-light)",
              }}>
              <Star className="w-3.5 h-3.5" /> {hasInterested ? "Interested ✓" : "Interested"}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}