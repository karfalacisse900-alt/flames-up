import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Home, Search, Users, Palette, User, Flame, Bell, PenSquare, MapPin, Sparkles, LayoutDashboard } from "lucide-react";

const navItems = [
  { name: "Home",        icon: Home,       page: "Home" },
  { name: "Discover",    icon: Search,     page: "Discover" },
  { name: "Places",      icon: MapPin,     page: "Places" },
  { name: "Dashboard",   icon: LayoutDashboard, page: "Dashboard" },
  { name: "Groups",      icon: Users,      page: "Groups" },
  { name: "Profile",     icon: User,       page: "Profile" },
];

const createItem = { name: "Create Post", icon: PenSquare, page: "CreatePost" };

export default function LeftSidebar({ currentPageName, unreadCount }) {
  const location = useLocation();

  return (
    <aside
      className="hidden lg:flex flex-col fixed left-0 top-0 h-full z-40 w-60 py-6 px-3 gap-1"
      style={{
        backgroundColor: "var(--bg-nav)",
        borderRight: "1px solid var(--border-light)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 mb-6">
        <div
          className="w-7 h-7 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #1C1A16, #3D3A34)" }}
        >
          <Flame className="w-3.5 h-3.5" style={{ color: "#D4A96A", fill: "#D4A96A" }} />
        </div>
        <span
          className="text-base tracking-tight"
          style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 700, color: "var(--text-primary)" }}
        >
          flames-up
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ name, icon: Icon, page }) => {
          const isActive = currentPageName === page;
          return (
            <Link
              key={name}
              to={createPageUrl(page)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative"
              style={{
                backgroundColor: isActive ? "var(--accent-primary-light)" : "transparent",
                color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
                fontWeight: isActive ? 600 : 400,
              }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.backgroundColor = "var(--bg-subtle)";
              }}
              onMouseLeave={e => {
                if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <Icon
                className="w-5 h-5 flex-shrink-0 transition-transform duration-150 group-hover:scale-110"
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span>{name}</span>
              {name === "Notifications" && unreadCount > 0 && (
                <span
                  className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: "#E05C7A" }}
                >
                  {unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Creator Dashboard link */}
      <div className="px-3 mb-1">
        <Link
          to="/CreatorDashboard"
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-medium transition-all"
          style={{
            backgroundColor: currentPageName === "CreatorDashboard" ? "#FFF7ED" : "transparent",
            color: currentPageName === "CreatorDashboard" ? "#E05C2A" : "var(--text-secondary)",
          }}
          onMouseEnter={e => { if (currentPageName !== "CreatorDashboard") e.currentTarget.style.backgroundColor = "var(--bg-subtle)"; }}
          onMouseLeave={e => { if (currentPageName !== "CreatorDashboard") e.currentTarget.style.backgroundColor = "transparent"; }}
        >
          <Sparkles className="w-5 h-5 flex-shrink-0" strokeWidth={currentPageName === "CreatorDashboard" ? 2.5 : 1.8} />
          <span>Creator Hub</span>
        </Link>
      </div>

      {/* Create Post CTA */}
      <div className="px-3 mb-2">
        <Link
          to={createPageUrl(createItem.page)}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
          style={{ backgroundColor: "var(--accent-primary)", boxShadow: "0 2px 8px rgba(46,107,79,0.25)" }}
        >
          <createItem.icon className="w-4 h-4" />
          Create Post
        </Link>
      </div>

      {/* Bottom accent */}
      <div
        className="mx-3 mt-2 pt-4 text-[11px]"
        style={{ borderTop: "1px solid var(--border-light)", color: "var(--text-hint)" }}
      >
        flames-up © 2026
      </div>
    </aside>
  );
}