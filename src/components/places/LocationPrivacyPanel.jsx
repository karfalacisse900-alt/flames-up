import React, { useState } from "react";
import { Eye, EyeOff, Users, User, Globe, ChevronDown, ChevronUp, Navigation } from "lucide-react";
import { base44 } from "@/api/base44Client";

const MODES = [
  { key: "everyone",     label: "Everyone",      icon: Globe,    desc: "All users can see you" },
  { key: "friends_only", label: "Friends only",  icon: Users,    desc: "Only followers can see you" },
  { key: "invisible",    label: "Invisible",     icon: EyeOff,   desc: "Hidden from the map" },
];

export default function LocationPrivacyPanel({ user, presence, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState(presence?.status_message || "");
  const currentMode = presence?.visibility_mode || "everyone";

  const handleModeChange = async (mode) => {
    if (!user || saving) return;
    setSaving(true);
    try {
      if (presence?.id) {
        await base44.entities.LocationPresence.update(presence.id, { visibility_mode: mode, is_visible: mode !== "invisible" });
      }
      onUpdate?.({ visibility_mode: mode, is_visible: mode !== "invisible" });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusSave = async () => {
    if (!user || !presence?.id) return;
    setSaving(true);
    try {
      await base44.entities.LocationPresence.update(presence.id, { status_message: statusMsg });
      onUpdate?.({ status_message: statusMsg });
    } finally {
      setSaving(false);
    }
  };

  const activeMode = MODES.find(m => m.key === currentMode) || MODES[0];
  const ActiveIcon = activeMode.icon;

  return (
    <div
      className="absolute bottom-20 right-3 z-20"
      style={{ width: 220 }}
    >
      {/* Toggle button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-2xl text-xs font-bold"
        style={{
          backgroundColor: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
          border: "1px solid var(--border-light)",
          color: "var(--text-primary)",
        }}
      >
        <Navigation className="w-3.5 h-3.5" style={{ color: "var(--accent-primary)" }} />
        <span className="flex-1 text-left">Location: {activeMode.label}</span>
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="mt-1.5 rounded-2xl overflow-hidden"
          style={{
            backgroundColor: "rgba(255,255,255,0.98)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
            border: "1px solid var(--border-light)",
          }}
        >
          <div className="p-3 pb-0">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-hint)" }}>
              Who can see you
            </p>
            <div className="space-y-1">
              {MODES.map(({ key, label, icon: Icon, desc }) => (
                <button
                  key={key}
                  onClick={() => handleModeChange(key)}
                  disabled={saving}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all"
                  style={{
                    backgroundColor: currentMode === key ? "var(--accent-primary-light)" : "transparent",
                    color: currentMode === key ? "var(--accent-primary)" : "var(--text-primary)",
                  }}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <div>
                    <p className="text-xs font-bold">{label}</p>
                    <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Status message */}
          <div className="p-3 pt-2 border-t mt-2" style={{ borderColor: "var(--border-subtle)" }}>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-hint)" }}>
              Status message
            </p>
            <div className="flex gap-1.5">
              <input
                value={statusMsg}
                onChange={e => setStatusMsg(e.target.value)}
                placeholder="What are you up to?"
                className="flex-1 text-xs px-2.5 py-1.5 rounded-xl outline-none"
                style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)", minHeight: 32 }}
                maxLength={60}
              />
              <button
                onClick={handleStatusSave}
                disabled={saving}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold"
                style={{ backgroundColor: "var(--accent-primary)", color: "#fff", minHeight: 32 }}
              >
                Set
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}