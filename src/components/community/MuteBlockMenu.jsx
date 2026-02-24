import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { MoreHorizontal, VolumeX, ShieldOff, Flag } from "lucide-react";

export default function MuteBlockMenu({ targetEmail, targetName, user, onReport }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(null); // "muted" | "blocked"

  if (!user || user.email === targetEmail) return null;

  const handleMute = async () => {
    const mutedList = user.muted_users || [];
    if (!mutedList.includes(targetEmail)) {
      await base44.auth.updateMe({ muted_users: [...mutedList, targetEmail] });
    }
    setDone("muted");
    setOpen(false);
  };

  const handleBlock = async () => {
    const blockedList = user.blocked_users || [];
    if (!blockedList.includes(targetEmail)) {
      await base44.auth.updateMe({ blocked_users: [...blockedList, targetEmail] });
    }
    setDone("blocked");
    setOpen(false);
  };

  if (done) {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>
        {done === "muted" ? "🔇 Muted" : "🚫 Blocked"}
      </span>
    );
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)} className="p-1 rounded-full transition-all"
        style={{ color: "var(--text-hint)" }}>
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-6 z-50 rounded-2xl shadow-xl overflow-hidden min-w-[150px]"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
            <button onClick={handleMute}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-xs text-left transition-colors hover:bg-[var(--bg-subtle)]"
              style={{ color: "var(--text-secondary)" }}>
              <VolumeX className="w-3.5 h-3.5" /> Mute {targetName || "user"}
            </button>
            <button onClick={handleBlock}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-xs text-left transition-colors hover:bg-[var(--bg-subtle)]"
              style={{ color: "#C86B6B" }}>
              <ShieldOff className="w-3.5 h-3.5" /> Block user
            </button>
            {onReport && (
              <button onClick={() => { onReport(); setOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-2.5 text-xs text-left transition-colors hover:bg-[var(--bg-subtle)]"
                style={{ color: "#C86B6B" }}>
                <Flag className="w-3.5 h-3.5" /> Report post
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}