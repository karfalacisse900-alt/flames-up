import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VolumeX, Ban, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function MuteBlockModal({ open, onClose, targetEmail, targetName, currentUser, onUpdated }) {
  const [loading, setLoading] = useState(null);

  const isMuted = currentUser?.muted_users?.includes(targetEmail);
  const isBlocked = currentUser?.blocked_users?.includes(targetEmail);

  const toggleMute = async () => {
    setLoading("mute");
    const muted = currentUser?.muted_users || [];
    const updated = isMuted ? muted.filter(e => e !== targetEmail) : [...muted, targetEmail];
    await base44.auth.updateMe({ muted_users: updated });
    onUpdated({ ...currentUser, muted_users: updated });
    setLoading(null);
    onClose();
  };

  const toggleBlock = async () => {
    setLoading("block");
    const blocked = currentUser?.blocked_users || [];
    const updated = isBlocked ? blocked.filter(e => e !== targetEmail) : [...blocked, targetEmail];
    await base44.auth.updateMe({ blocked_users: updated });
    onUpdated({ ...currentUser, blocked_users: updated });
    setLoading(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xs rounded-2xl" style={{ backgroundColor: "var(--bg-card)" }}>
        <DialogHeader>
          <DialogTitle style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
            Manage @{targetName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 pt-1">
          <button onClick={toggleMute} disabled={!!loading}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-sm text-left transition-colors"
            style={{ backgroundColor: isMuted ? "rgba(111,143,114,0.12)" : "var(--bg-app)", color: "var(--text-primary)", border: "1px solid var(--border-light)" }}>
            <VolumeX className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
            <div>
              <p className="font-medium">{isMuted ? "Unmute" : "Mute"} user</p>
              <p className="text-[11px]" style={{ color: "var(--text-hint)" }}>
                {isMuted ? "Show their posts again" : "Hide posts without blocking"}
              </p>
            </div>
          </button>
          <button onClick={toggleBlock} disabled={!!loading}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-sm text-left transition-colors"
            style={{ backgroundColor: isBlocked ? "rgba(239,68,68,0.08)" : "var(--bg-app)", color: isBlocked ? "#EF4444" : "var(--text-primary)", border: "1px solid var(--border-light)" }}>
            <Ban className="w-4 h-4" style={{ color: "#EF4444" }} />
            <div>
              <p className="font-medium">{isBlocked ? "Unblock" : "Block"} user</p>
              <p className="text-[11px]" style={{ color: "var(--text-hint)" }}>
                {isBlocked ? "Allow this user to interact with you" : "Completely hide and restrict this user"}
              </p>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}