import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { Home, Compass, Palette, Radio, Gamepad2, User, Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";

const navItems = [
  { name: "Home", icon: Home, page: "Home" },
  { name: "Discover", icon: Compass, page: "Discover" },
  { name: "Art", icon: Palette, page: "Art" },
  { name: "Live", icon: Radio, page: "Live" },
  { name: "Games", icon: Gamepad2, page: "Games" },
  { name: "Profile", icon: User, page: "Profile" },
];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const hideNav = ["PostDetail", "LiveRoomView", "GamePlay"].includes(currentPageName);

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
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.page)}
                  className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200"
                  style={{ color: isActive ? "var(--accent-primary)" : "var(--text-hint)" }}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.5]"}`} />
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