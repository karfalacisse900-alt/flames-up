import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { VolumeX, Ban, Flag, MoreHorizontal, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatMessage({ msg, isHost, currentUser, room, onRoomUpdated }) {
  const [showActions, setShowActions] = useState(false);
  const [reported, setReported] = useState(false);

  const isSelf = msg.author_email === currentUser?.email;
  const isReaction = msg.type === "reaction";

  const muteUser = async () => {
    const muted = room?.muted_users || [];
    if (!muted.includes(msg.author_email)) {
      await base44.entities.LiveRoom.update(room.id, { muted_users: [...muted, msg.author_email] });
      onRoomUpdated?.();
    }
    setShowActions(false);
  };

  const banUser = async () => {
    const banned = room?.banned_users || [];
    if (!banned.includes(msg.author_email)) {
      await base44.entities.LiveRoom.update(room.id, { banned_users: [...banned, msg.author_email] });
      onRoomUpdated?.();
    }
    setShowActions(false);
  };

  const reportMessage = async () => {
    await base44.entities.Report.create({
      content_type: "live_message",
      content_id: msg.id,
      reason: `Live room message: "${msg.text?.slice(0, 80)}"`,
      reporter_email: currentUser?.email || "",
      status: "pending",
    });
    setReported(true);
    setShowActions(false);
  };

  return (
    <div className={`flex items-start gap-2 group relative ${isReaction ? "opacity-70" : ""}`}>
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0"
        style={{ backgroundColor: "var(--bg-subtle)", color: "var(--accent-primary)" }}
      >
        {msg.author_name?.[0]?.toUpperCase() || "?"}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium" style={{ color: "var(--accent-secondary)" }}>{msg.author_name}</span>
        <p className="text-sm mt-0.5 break-words" style={{
          color: isReaction ? "var(--accent-secondary)" : "var(--text-primary)",
          fontStyle: isReaction ? "italic" : "normal",
        }}>
          {msg.text}
        </p>
      </div>

      {/* Action button — only show for other users' messages */}
      {!isSelf && !isReaction && (
        <button
          onClick={() => setShowActions((v) => !v)}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-full transition-opacity shrink-0 mt-0.5"
          style={{ color: "var(--text-hint)" }}
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Action popover */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-6 z-30 rounded-2xl shadow-lg overflow-hidden"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", minWidth: "150px" }}
          >
            {isHost && (
              <>
                <button
                  onClick={muteUser}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-xs transition-colors hover:brightness-95"
                  style={{ color: "var(--text-primary)" }}
                >
                  <VolumeX className="w-3.5 h-3.5" style={{ color: "var(--accent-primary)" }} /> Mute user
                </button>
                <button
                  onClick={banUser}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-xs transition-colors hover:brightness-95"
                  style={{ color: "#E05C5C", borderTop: "1px solid var(--border-subtle)" }}
                >
                  <Ban className="w-3.5 h-3.5" /> Ban user
                </button>
              </>
            )}
            <button
              onClick={reportMessage}
              disabled={reported}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-xs transition-colors hover:brightness-95"
              style={{ color: reported ? "var(--text-hint)" : "var(--accent-secondary)", borderTop: "1px solid var(--border-subtle)" }}
            >
              <Flag className="w-3.5 h-3.5" /> {reported ? "Reported" : "Report"}
            </button>
            <button
              onClick={() => setShowActions(false)}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-xs transition-colors hover:brightness-95"
              style={{ color: "var(--text-hint)", borderTop: "1px solid var(--border-subtle)" }}
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}