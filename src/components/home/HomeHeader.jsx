import React from "react";
import { Search, Flame } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import NotificationBell from "@/components/notifications/NotificationBell";

export default function HomeHeader({ user }) {
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const firstName = user?.full_name?.split(" ")[0] || null;

  return (
    <div
      className="relative overflow-hidden px-5 pb-5"
      style={{ borderBottom: "1px solid var(--border-subtle)", paddingTop: "max(env(safe-area-inset-top, 16px), 16px)" }}
    >
      {/* Organic background blobs */}
      <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, #E05C2A, #F97316)" }} />
      <div className="absolute -top-2 right-20 w-14 h-14 rounded-full opacity-10 pointer-events-none" style={{ background: "#2E6B4F" }} />
      <div className="absolute top-8 -left-4 w-20 h-20 rounded-full opacity-10 pointer-events-none" style={{ background: "radial-gradient(circle, #2E6B4F, #4CAF7D)" }} />

      <div className="flex items-center justify-between relative z-10">
        {/* Left: logo + greeting */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <motion.div
              whileTap={{ scale: 0.9, rotate: -8 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="w-8 h-8 rounded-2xl flex items-center justify-center shadow-md"
              style={{ background: "linear-gradient(135deg, #E05C2A, #F97316)" }}
            >
              <Flame style={{ width: 18, height: 18, color: "#fff", fill: "#fff" }} />
            </motion.div>
            <span className="text-xl font-bold tracking-tight" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)", letterSpacing: "-0.4px" }}>
              flames-up
            </span>
          </div>
          <p className="text-xs font-semibold pl-1" style={{ color: "var(--text-hint)" }}>
            {greeting()}{firstName ? `, ${firstName} ✦` : " ✦"}
          </p>
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-2">
          <motion.div whileTap={{ scale: 0.88 }} transition={{ duration: 0.12 }}>
            <Link
              to={createPageUrl("Discover")}
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1.5px solid var(--border-light)",
                color: "var(--accent-primary)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <Search className="w-4 h-4" />
            </Link>
          </motion.div>

          <motion.div whileTap={{ scale: 0.88 }} transition={{ duration: 0.12 }}>
            <NotificationBell user={user} />
          </motion.div>

          {user && (
            <motion.div whileTap={{ scale: 0.88 }} transition={{ duration: 0.12 }}>
              <Link to={createPageUrl("Profile")}>
                <div
                  className="w-10 h-10 rounded-2xl overflow-hidden flex items-center justify-center text-sm font-black text-white shadow-md"
                  style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)", boxShadow: "0 4px 12px rgba(46,107,79,0.35)" }}
                >
                  {user.avatar_url
                    ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                    : user.full_name?.[0]?.toUpperCase() || "?"}
                </div>
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}