import React, { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";

const TYPE_ICONS = {
  direct_message: "💬",
  group_mention: "👥",
  creator_live: "🔴",
  new_follower: "👤",
  post_liked: "❤️",
  post_replied: "💬",
  mention: "@",
  friend_request: "🤝",
  friend_accepted: "✅",
  friend_nearby: "📍",
};

export default function NotificationBell({ user }) {
  const [unread, setUnread] = useState(0);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const prevIds = useRef(new Set());

  useEffect(() => {
    if (!user?.email) return;

    // Initial fetch
    base44.entities.Notification.filter({ recipient_email: user.email, is_read: false }, "-created_date", 50)
      .then(ns => {
        setUnread(ns.length);
        ns.forEach(n => prevIds.current.add(n.id));
      })
      .catch(() => {});

    // Real-time subscription
    const unsub = base44.entities.Notification.subscribe((event) => {
      if (event.type === "create" && event.data?.recipient_email === user.email && !event.data?.is_read) {
        if (!prevIds.current.has(event.id)) {
          prevIds.current.add(event.id);
          setUnread(v => v + 1);

          // Show toast for important types
          const n = event.data;
          if (["direct_message", "group_mention", "creator_live"].includes(n.type)) {
            setToast(n);
            clearTimeout(toastTimer.current);
            toastTimer.current = setTimeout(() => setToast(null), 4000);
          }
        }
      } else if (event.type === "update" && event.data?.recipient_email === user.email && event.data?.is_read) {
        // Re-fetch count when notifications marked read
        base44.entities.Notification.filter({ recipient_email: user.email, is_read: false }, "-created_date", 50)
          .then(ns => setUnread(ns.length))
          .catch(() => {});
      }
    });

    return () => { unsub(); clearTimeout(toastTimer.current); };
  }, [user?.email]);

  return (
    <>
      {/* Bell icon with badge */}
      <Link
        to={createPageUrl("Notifications")}
        className="relative w-10 h-10 rounded-2xl flex items-center justify-center"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1.5px solid var(--border-light)",
          color: "var(--text-secondary)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <Bell className="w-4 h-4" />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 flex items-center justify-center rounded-full text-white font-black"
              style={{
                backgroundColor: "#E05C2A",
                minWidth: unread > 9 ? 18 : 16,
                height: unread > 9 ? 18 : 16,
                fontSize: 9,
                padding: "0 3px",
                border: "2px solid var(--bg-app)",
              }}
            >
              {unread > 99 ? "99+" : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </Link>

      {/* Toast popup for real-time alerts */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -60, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -60, x: "-50%" }}
            transition={{ type: "spring", damping: 22, stiffness: 300 }}
            onClick={() => setToast(null)}
            className="fixed top-14 left-1/2 z-[999] cursor-pointer"
            style={{ maxWidth: 340, width: "calc(100vw - 32px)" }}
          >
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1.5px solid var(--border-light)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                style={{ backgroundColor: toast.type === "creator_live" ? "#fee2e2" : "var(--accent-primary-light)" }}
              >
                {TYPE_ICONS[toast.type] || "🔔"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate" style={{ color: "var(--text-primary)" }}>
                  {toast.actor_name || "Someone"}
                  {toast.type === "direct_message" && " sent you a message"}
                  {toast.type === "group_mention" && " mentioned you"}
                  {toast.type === "creator_live" && " is now live 🔴"}
                </p>
                {toast.post_text && (
                  <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-hint)" }}>
                    {toast.post_text}
                  </p>
                )}
              </div>
              {/* Progress bar */}
              <motion.div
                className="absolute bottom-0 left-0 h-0.5 rounded-full"
                style={{ backgroundColor: "var(--accent-primary)" }}
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 4, ease: "linear" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}