import React, { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";

export default function NotificationBell({ user }) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user?.email) return;

    base44.entities.Notification.filter({ recipient_email: user.email, is_read: false }, "-created_date", 50)
      .then(ns => setUnread(ns.length))
      .catch(() => {});

    const unsub = base44.entities.Notification.subscribe((event) => {
      if (event.data?.recipient_email === user.email) {
        base44.entities.Notification.filter({ recipient_email: user.email, is_read: false }, "-created_date", 50)
          .then(ns => setUnread(ns.length))
          .catch(() => {});
      }
    });

    return () => unsub();
  }, [user?.email]);

  return (
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
  );
}