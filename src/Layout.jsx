import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { Home, Compass, Palette, Radio, Gamepad2, User, MessageSquare } from "lucide-react";
import { base44 } from "@/api/base44Client";

const navItems = [
  { name: "Home", icon: Home, page: "Home" },
  { name: "Discover", icon: Compass, page: "Discover" },
  { name: "Art", icon: Palette, page: "Art" },
  { name: "Live", icon: Radio, page: "Live" },
  { name: "Messages", icon: MessageSquare, page: "Messages" },
  { name: "Profile", icon: User, page: "Profile" },
];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u?.email) {
        base44.entities.Notification.filter({ recipient_email: u.email, is_read: false }, "-created_date", 50)
          .then(ns => setUnreadCount(ns.length))
          .catch(() => {});
      }
    }).catch(() => {});
  }, []);

  const hideNav = ["PostDetail", "LiveRoomView", "GamePlay", "DiscoverForum", "Shop"].includes(currentPageName);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-app)", fontFamily: "var(--font-sans)" }}>
      <div className="max-w-lg mx-auto relative pb-20">
        {children}
      </div>

      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ backgroundColor: "var(--bg-nav)", backdropFilter: "blur(20px)", borderTop: "1px solid var(--border-light)" }}>
          <div className="max-w-lg mx-auto flex justify-around items-center py-2 px-2">
            {navItems.map((item) => {
              const isActive = currentPageName === item.page;
              const showBadge = item.page === "Notifications" && unreadCount > 0;
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.page)}
                  className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 relative"
                  style={{ color: isActive ? "var(--accent-primary)" : "var(--text-hint)" }}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.5]"}`} />
                  {showBadge && (
                    <span style={{ position: "absolute", top: 2, right: 4, width: 8, height: 8, borderRadius: "50%", backgroundColor: "#E05C7A", border: "2px solid var(--bg-nav)" }} />
                  )}
                  <span className="text-[10px] font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}