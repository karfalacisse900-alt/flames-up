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
      className="relative overflow-hidden px-5 pb-4"
      style={{ borderBottom: "1px solid var(--border-subtle)", paddingTop: "max(env(safe-area-inset-top, 16px), 16px)" }}
    >
      {/* Subtle grain overlay for premium feel */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.025]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
      <div className="flex items-center justify-between relative z-10">
        {/* Left: logo + greeting */}
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <motion.div
              whileTap={{ scale: 0.9, rotate: -8 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="w-7 h-7 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #1C1A16, #3D3A34)" }}
            >
              <Flame style={{ width: 14, height: 14, color: "#D4A96A", fill: "#D4A96A" }} />
            </motion.div>
            <span className="text-lg tracking-[-0.03em]" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)", fontWeight: 700, fontStyle: "italic" }}>
              flames-up
            </span>
          </div>
          <p className="text-[11px] font-medium pl-0.5 tracking-wide uppercase" style={{ color: "var(--text-hint)", letterSpacing: "0.06em" }}>
            {greeting()}{firstName ? `, ${firstName}` : ""}
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