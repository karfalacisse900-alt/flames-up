import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const TYPE_ICONS = {
  direct_message: "💬",
  group_mention: "👥",
  creator_live: "🔴",
  new_follower: "👤",
  post_liked: "❤️",
  post_replied: "💬",
  mention: "🔔",
  friend_request: "🤝",
  friend_accepted: "✅",
};

const TYPE_LABELS = {
  direct_message: "sent you a message",
  group_mention: "mentioned you in a group",
  creator_live: "is now live 🔴",
  new_follower: "started following you",
  post_liked: "liked your post",
  post_replied: "replied to your post",
  mention: "mentioned you",
  friend_request: "sent you a friend request",
  friend_accepted: "accepted your request",
};

export default function GlobalNotificationToast({ user }) {
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();
  const toastTimer = useRef(null);
  const seenIds = useRef(new Set());
  const initialized = useRef(false);

  useEffect(() => {
    if (!user?.email) return;

    // Mark existing notifications as already seen on mount (don't toast old ones)
    base44.entities.Notification.filter({ recipient_email: user.email }, "-created_date", 50)
      .then(ns => {
        ns.forEach(n => seenIds.current.add(n.id));
        initialized.current = true;
      })
      .catch(() => { initialized.current = true; });

    const unsub = base44.entities.Notification.subscribe((event) => {
      if (!initialized.current) return;
      if (event.type !== "create") return;
      if (event.data?.recipient_email !== user.email) return;
      if (seenIds.current.has(event.id)) return;

      seenIds.current.add(event.id);
      const n = event.data;

      // Only toast for the important real-time types
      if (!["direct_message", "group_mention", "creator_live", "new_follower", "post_liked", "post_replied"].includes(n.type)) return;

      setToast({ ...n, id: event.id });
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(null), 4500);
    });

    return () => { unsub(); clearTimeout(toastTimer.current); };
  }, [user?.email]);

  const handleToastClick = () => {
    if (!toast) return;
    setToast(null);
    if (toast.type === "direct_message") {
      navigate(createPageUrl("Messages"));
    } else if (toast.type === "creator_live") {
      navigate(createPageUrl("Live"));
    } else {
      navigate(createPageUrl("Notifications"));
    }
  };

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: -80, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: -80, x: "-50%" }}
          transition={{ type: "spring", damping: 22, stiffness: 300 }}
          onClick={handleToastClick}
          className="fixed z-[9999] cursor-pointer"
          style={{
            top: "max(env(safe-area-inset-top, 0px), 16px)",
            left: "50%",
            maxWidth: 360,
            width: "calc(100vw - 32px)",
          }}
        >
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1.5px solid var(--border-light)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.22)",
              backdropFilter: "blur(20px)",
            }}
          >
            {/* Icon */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{
                backgroundColor: toast.type === "creator_live" ? "#fee2e2"
                  : toast.type === "direct_message" ? "#eff6ff"
                  : "var(--accent-primary-light)",
              }}
            >
              {TYPE_ICONS[toast.type] || "🔔"}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate" style={{ color: "var(--text-primary)" }}>
                <span style={{ color: "var(--accent-primary)" }}>{toast.actor_name || "Someone"}</span>{" "}
                {TYPE_LABELS[toast.type] || "sent you a notification"}
              </p>
              {toast.post_text && (
                <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--text-hint)" }}>
                  {toast.post_text}
                </p>
              )}
            </div>

            {/* Tap hint */}
            <span className="text-[10px] font-semibold shrink-0" style={{ color: "var(--text-hint)" }}>tap</span>
          </div>

          {/* Progress bar */}
          <motion.div
            className="h-0.5 rounded-full mt-1 mx-2"
            style={{ backgroundColor: "var(--accent-primary)", opacity: 0.6 }}
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: 4.5, ease: "linear" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}