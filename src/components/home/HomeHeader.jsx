import React from "react";
import { Bell, Search, Flame } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

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
      className="px-5 pt-5 pb-4"
      style={{
        background: "linear-gradient(135deg, #2E6B4F10 0%, #D98B6208 100%)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <div className="flex items-center justify-between">
        {/* Left: logo + greeting */}
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #E05C2A, #F97316)" }}>
              <Flame className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>flames-up</span>
          </div>
          <p className="text-xs font-medium" style={{ color: "var(--text-hint)" }}>
            {greeting()}{firstName ? `, ${firstName}` : ""}
          </p>
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-2">
          <Link
            to={createPageUrl("Discover")}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--accent-primary)" }}
          >
            <Search className="w-4 h-4" />
          </Link>
          <Link
            to={createPageUrl("Notifications")}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-secondary)" }}
          >
            <Bell className="w-4 h-4" />
          </Link>
          {user && (
            <Link to={createPageUrl("Profile")}>
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)" }}
              >
                {user.full_name?.[0]?.toUpperCase() || "?"}
              </div>
            </Link>
          )}
        </div>
      </div>


    </div>
  );
}