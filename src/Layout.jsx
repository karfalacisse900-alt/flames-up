import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "./utils";
import { Home, Compass, Palette, Radio, Gamepad2, User, Bell } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { AnimatePresence, motion } from "framer-motion";

const navItems = [
{ name: "Home", icon: Home, page: "Home" },
{ name: "Discover", icon: Compass, page: "Discover" },
{ name: "Art", icon: Palette, page: "Art" },
{ name: "Live", icon: Radio, page: "Live" },
{ name: "Alerts", icon: Bell, page: "Notifications" },
{ name: "Profile", icon: User, page: "Profile" }];


// Persist scroll positions per page
const scrollPositions = {};

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const contentRef = useRef(null);

  // Save scroll on leaving a page, restore on arriving
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    // Restore
    const saved = scrollPositions[currentPageName] || 0;
    el.scrollTop = saved;
    // Save on unmount
    return () => {
      if (el) scrollPositions[currentPageName] = el.scrollTop;
    };
  }, [currentPageName]);

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      if (u?.email) {
        const fetchUnread = () =>
          base44.entities.Notification.filter({ recipient_email: u.email, is_read: false }, "-created_date", 50)
            .then((ns) => setUnreadCount(ns.length))
            .catch(() => {});
        fetchUnread();
        const unsub = base44.entities.Notification.subscribe((event) => {
          if (event.data?.recipient_email === u.email || event.type === "update") {
            fetchUnread();
          }
        });
        return unsub;
      }
    }).catch(() => {});
  }, []);

  const hideNav = ["PostDetail", "LiveRoomView", "GamePlay", "DiscoverForum", "Shop"].includes(currentPageName);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-app)", color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>
        <div className="max-w-lg mx-auto relative" style={{ paddingBottom: hideNav ? 0 : "64px" }}>
          {children}
        </div>

      {!hideNav &&
      <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ backgroundColor: "var(--bg-nav)", backdropFilter: "blur(20px)", borderTop: "1px solid var(--border-light)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
          <div className="max-w-lg mx-auto flex justify-around items-center py-2 px-2">
                {navItems.map((item) => {
                const isActive = currentPageName === item.page;
                const showBadge = item.page === "Notifications" && unreadCount > 0;
                return (
                  <Link
                    key={item.name}
                    to={createPageUrl(item.page)}
                    className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 relative"
                    style={{ color: isActive ? "var(--accent-primary)" : "var(--text-secondary)", fontWeight: isActive ? 600 : 400 }}>

                  <item.icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.5]"}`} />
                  {showBadge &&
                <span style={{ position: "absolute", top: 2, right: 4, width: 8, height: 8, borderRadius: "50%", backgroundColor: "#E05C7A", border: "2px solid var(--bg-nav)" }} />
                }
                  <span className="text-[11px] font-semibold tracking-wide">{item.name}</span>
                </Link>);

          })}
          </div>
        </nav>
      }
    </div>);

}