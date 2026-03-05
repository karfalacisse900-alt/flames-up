import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Users, Calendar, Clock, ExternalLink, Zap, X, CheckCircle } from "lucide-react";

const EVENT_TYPES = [
  { key: "watch_party", emoji: "🎬", label: "Watch Party", desc: "Watch together in sync" },
  { key: "live_discussion", emoji: "💬", label: "Live Discussion", desc: "Open mic conversation" },
  { key: "debate_room", emoji: "⚔️", label: "Debate Room", desc: "Two sides, one winner" },
  { key: "game_night", emoji: "🎮", label: "Game Night", desc: "Play games together" },
  { key: "qa_session", emoji: "❓", label: "Q&A Session", desc: "Ask me anything" },
];

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function timeUntil(iso) {
  const ms = new Date(iso) - Date.now();
  if (ms <= 0) return "Live now";
  const m = Math.floor(ms / 60000);
  if (m < 60) return `Starts in ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Starts in ${h}h`;
  return `Starts in ${Math.floor(h/24)}d`;
}

function CreateEventSheet({ group, user, onClose, onCreated }) {
  const [step, setStep] = useState(0); // 0 = type, 1 = details
  const [type, setType] = useState(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [link, setLink] = useState("");
  const [duration, setDuration] = useState("60");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim() || !date || !time) return;
    setSaving(true);
    const dt = new Date(`${date}T${time}`).toISOString();
    await base44.entities.GroupEvent.create({
      group_id: group.id,
      group_name: group.name,
      title: title.trim(),
      description: desc.trim(),
      event_type: type,
      event_date: dt,
      duration_minutes: parseInt(duration) || 60,
      location_url: link.trim() || undefined,
      creator_email: user.email,
      creator_name: user.full_name || user.email,
      rsvp_yes: [user.email],
      is_active: true,
    });
    setSaving(false);
    onCreated();
    onClose();
  };

  const typeInfo = EVENT_TYPES.find(e => e.key === type);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 34 }}
        className="w-full max-w-lg mx-auto rounded-t-3xl flex flex-col"
        style={{ backgroundColor: "var(--bg-modal)", maxHeight: "90dvh" }}
        onClick={e => e.stopPropagation()}>
        <div className="h-1.5 w-12 rounded-full mx-auto mt-3 mb-4" style={{ backgroundColor: "var(--border-medium)" }} />

        <div className="px-5 pb-2 flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
            {step === 0 ? "Create Event" : typeInfo?.emoji + " " + typeInfo?.label}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full" style={{ backgroundColor: "var(--bg-subtle)" }}>
            <X className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-6">
          {step === 0 ? (
            <div className="space-y-2 mt-2">
              {EVENT_TYPES.map(et => (
                <button key={et.key} onClick={() => { setType(et.key); setStep(1); }}
                  className="w-full flex items-center gap-3.5 p-4 rounded-2xl text-left transition-all active:scale-[0.98]"
                  style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
                  <span className="text-3xl shrink-0">{et.emoji}</span>
                  <div>
                    <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{et.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>{et.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide mb-1 block" style={{ color: "var(--text-hint)" }}>Event Title *</label>
                <input value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="Give it a great name..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide mb-1 block" style={{ color: "var(--text-hint)" }}>Description</label>
                <textarea value={desc} onChange={e => setDesc(e.target.value)}
                  placeholder="What should people expect?"
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide mb-1 block" style={{ color: "var(--text-hint)" }}>Date *</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide mb-1 block" style={{ color: "var(--text-hint)" }}>Time *</label>
                  <input type="time" value={time} onChange={e => setTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide mb-1 block" style={{ color: "var(--text-hint)" }}>Duration (minutes)</label>
                <input type="number" value={duration} onChange={e => setDuration(e.target.value)}
                  placeholder="60"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide mb-1 block" style={{ color: "var(--text-hint)" }}>Meeting Link (optional)</label>
                <input value={link} onChange={e => setLink(e.target.value)}
                  placeholder="Zoom, Google Meet, Discord..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(0)}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold"
                  style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
                  Back
                </button>
                <button onClick={save} disabled={!title.trim() || !date || !time || saving}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold text-white disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)" }}>
                  {saving ? "Creating…" : "Create Event"}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function EventCard({ event, user, groupId }) {
  const qc = useQueryClient();
  const hasYes = event.rsvp_yes?.includes(user?.email);
  const isPast = new Date(event.event_date) < new Date();
  const typeInfo = EVENT_TYPES.find(e => e.key === event.event_type) || { emoji: "📅", label: "Event" };

  const rsvp = async () => {
    if (!user?.email) return;
    const current = event.rsvp_yes || [];
    await base44.entities.GroupEvent.update(event.id, {
      rsvp_yes: hasYes ? current.filter(e => e !== user.email) : [...current, user.email],
    });
    qc.invalidateQueries({ queryKey: ["groupLiveEvents", groupId] });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden mb-3"
      style={{
        backgroundColor: "var(--bg-card)",
        border: isPast ? "1px solid var(--border-light)" : "1.5px solid var(--accent-primary)",
        opacity: isPast ? 0.7 : 1,
        boxShadow: isPast ? "none" : "0 4px 20px rgba(46,107,79,0.12)",
      }}>
      {/* Top bar */}
      {!isPast && (
        <div className="px-4 py-2 flex items-center gap-2"
          style={{ background: "linear-gradient(135deg, #2E6B4F15, #4CAF7D10)" }}>
          <Zap className="w-3.5 h-3.5" style={{ color: "var(--accent-primary)" }} />
          <span className="text-xs font-bold" style={{ color: "var(--accent-primary)" }}>{timeUntil(event.event_date)}</span>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className="text-3xl shrink-0">{typeInfo.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm leading-tight" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{event.title}</p>
            <p className="text-xs mt-0.5 font-medium" style={{ color: "var(--accent-primary)" }}>{typeInfo.label}</p>
          </div>
          {isPast && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>Past</span>}
        </div>

        {event.description && (
          <p className="text-xs mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{event.description}</p>
        )}

        <div className="flex flex-wrap gap-3 mt-3">
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
            {event.rsvp_yes?.length || 0} attending
          </div>
        </div>

        {!isPast && (
          <div className="flex gap-2 mt-3">
            {event.location_url && (
              <a href={event.location_url} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                style={{ backgroundColor: "var(--accent-primary)", color: "#fff" }}>
                <ExternalLink className="w-3.5 h-3.5" /> Join
              </a>
            )}
            {user && (
              <button onClick={rsvp}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all"
                style={{
                  backgroundColor: hasYes ? "var(--accent-primary-light)" : "transparent",
                  color: hasYes ? "var(--accent-primary)" : "var(--text-secondary)",
                  borderColor: hasYes ? "var(--accent-primary)" : "var(--border-light)",
                }}>
                <CheckCircle className="w-3.5 h-3.5" />
                {hasYes ? "Going ✓" : "RSVP"}
              </button>
            )}
          </div>
        )}

        {/* Attendee avatars */}
        {(event.rsvp_yes?.length || 0) > 0 && (
          <div className="flex items-center gap-1 mt-3">
            {(event.rsvp_yes || []).slice(0, 5).map((email, i) => (
              <div key={i} className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold -ml-1 first:ml-0 ring-2 ring-white"
                style={{ background: `linear-gradient(135deg, ${avatarColors[i % avatarColors.length]}33, ${avatarColors[i % avatarColors.length]}66)`, color: avatarColors[i % avatarColors.length] }}>
                {email[0].toUpperCase()}
              </div>
            ))}
            {(event.rsvp_yes?.length || 0) > 5 && (
              <span className="text-[10px] ml-1" style={{ color: "var(--text-hint)" }}>+{event.rsvp_yes.length - 5} more</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

const avatarColors = ["#7C69C4","#D98B62","#3C6E5A","#E05C7A","#4A7FC1","#B07843"];

export default function GroupLiveEvents({ group, user, isMember, isAdmin }) {
  const [showCreate, setShowCreate] = useState(false);
  const qc = useQueryClient();

  const { data: events = [] } = useQuery({
    queryKey: ["groupLiveEvents", group.id],
    queryFn: () => base44.entities.GroupEvent.filter({ group_id: group.id, is_active: true }, "event_date", 50),
  });

  const upcoming = events.filter(e => new Date(e.event_date) >= new Date());
  const past = events.filter(e => new Date(e.event_date) < new Date());

  return (
    <div className="pb-24">
      {/* Header actions */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-hint)" }}>
          {upcoming.length} upcoming
        </p>
        {(isMember || isAdmin) && user && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white"
            style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)" }}>
            <Plus className="w-3.5 h-3.5" /> Create Event
          </button>
        )}
      </div>

      <div className="px-4">
        {upcoming.length === 0 && past.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-5xl mb-3">📅</div>
            <p className="font-bold text-base mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>No events yet</p>
            <p className="text-sm mb-5" style={{ color: "var(--text-hint)" }}>
              {isMember ? "Create the first event for this community!" : "Join the group to create events."}
            </p>
            {isMember && user && (
              <button onClick={() => setShowCreate(true)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)" }}>
                + Create Event
              </button>
            )}
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-hint)" }}>Upcoming</p>
                {upcoming.map(e => <EventCard key={e.id} event={e} user={user} groupId={group.id} />)}
              </>
            )}
            {past.length > 0 && (
              <>
                <p className="text-xs font-bold uppercase tracking-wider mb-3 mt-4" style={{ color: "var(--text-hint)" }}>Past</p>
                {past.map(e => <EventCard key={e.id} event={e} user={user} groupId={group.id} />)}
              </>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {showCreate && (
          <CreateEventSheet group={group} user={user}
            onClose={() => setShowCreate(false)}
            onCreated={() => qc.invalidateQueries({ queryKey: ["groupLiveEvents", group.id] })} />
        )}
      </AnimatePresence>
    </div>
  );
}