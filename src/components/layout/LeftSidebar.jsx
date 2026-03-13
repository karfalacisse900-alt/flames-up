import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Home, Search, Users, User, Flame, PenSquare, MapPin, MessageSquare } from "lucide-react";

const navItems = [
  { name: "Home",        icon: Home,          page: "Home" },
  { name: "Messages",    icon: MessageSquare, page: "Messages" },
  { name: "Discover",    icon: Search,        page: "Discover" },
  { name: "Places",      icon: MapPin,        page: "Places" },
  { name: "Groups",      icon: Users,         page: "Groups" },
  { name: "Profile",     icon: User,          page: "Profile" },
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
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #E05C2A, #F97316)" }}
        >
          <Flame className="w-4 h-4 text-white fill-white" />
        </div>
        <span
          className="text-base font-bold tracking-tight"
          style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}
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