import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, EyeOff, User, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * Privacy settings panel specifically for real-world event attendance:
 * - Toggle show real first name on RSVP lists
 */
export default function EventSafetySettings({ user, onClose }) {
  const [showRealName, setShowRealName] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    base44.entities.User.filter({ email: user.email })
      .then(records => {
        if (records.length > 0) setShowRealName(!!records[0].show_real_name_at_events);
      })
      .catch(() => {});
  }, [user.email]);

  const handleSave = async () => {
    setSaving(true);
    const records = await base44.entities.User.filter({ email: user.email });
    if (records.length > 0) {
      await base44.entities.User.update(records[0].id, { show_real_name_at_events: showRealName });
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 800);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-lg rounded-t-3xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-card)" }}
        onClick={e => e.stopPropagation()}>
        <div className="h-1.5 w-12 rounded-full mx-auto mt-3" style={{ backgroundColor: "var(--border-medium)" }} />
        <div className="px-5 py-4 pb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" style={{ color: "#2E6B4F" }} />
              <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
                Event Privacy
              </h2>
            </div>
            <button onClick={onClose}><X className="w-5 h-5" style={{ color: "var(--text-hint)" }} /></button>
          </div>

          <div className="space-y-3">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Control how your name appears on real-world event attendance lists.
            </p>

            <div className="flex items-start gap-4 px-4 py-4 rounded-2xl"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: showRealName ? "#E8F2EC" : "var(--border-light)" }}>
                <User className="w-5 h-5" style={{ color: showRealName ? "#2E6B4F" : "var(--text-hint)" }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold mb-0.5" style={{ color: "var(--text-primary)" }}>
                  Show real first name at events
                </p>
                <p className="text-xs" style={{ color: "var(--text-hint)" }}>
                  When on, your real first name (e.g. "Sarah") is shown on event RSVP lists instead of your username. Only applies to real-world meetups.
                </p>
                <button
                  onClick={() => setShowRealName(v => !v)}
                  className="mt-2.5 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                  style={{
                    backgroundColor: showRealName ? "var(--accent-primary)" : "var(--bg-card)",
                    color: showRealName ? "#fff" : "var(--text-secondary)",
                    border: "1px solid var(--border-light)",
                  }}>
                  {showRealName ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {showRealName ? "Showing real name" : "Using username"}
                </button>
              </div>
            </div>

            <div className="px-3 py-2.5 rounded-xl text-xs" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE" }}>
              🔒 Your username is always used elsewhere in the app. This setting only affects event attendance lists.
            </div>

            <button onClick={handleSave} disabled={saving}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-60 transition-all active:scale-95 mt-2"
              style={{ backgroundColor: "var(--accent-primary)", boxShadow: "0 4px 16px rgba(46,107,79,0.3)" }}>
              {saved ? "✓ Saved!" : saving ? "Saving…" : "Save Settings"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}