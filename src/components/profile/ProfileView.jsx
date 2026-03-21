import React from "react";
import { Link2 } from "lucide-react";

export default function ProfileView({ user }) {
  const getInitials = () => {
    const name = user?.display_name || user?.full_name || user?.username || "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const displayName = user?.display_name || user?.full_name || user?.username || "User";
  const bio = user?.bio || user?.headline || user?.about_me || "";
  const websiteUrl = user?.website_url || user?.portfolio_url || user?.website || "";

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="relative rounded-2xl overflow-hidden" style={{ height: "120px", backgroundColor: "var(--bg-subtle)" }}>
        {user?.banner_url ? (
          <img src={user.banner_url} alt="Banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))" }} />
        )}
      </div>

      {/* Avatar + Name */}
      <div className="flex items-end gap-4 -mt-12 px-4">
        <div className="w-20 h-20 rounded-full border-4 overflow-hidden shrink-0"
          style={{ borderColor: "var(--bg-card)", backgroundColor: "var(--bg-subtle)" }}>
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl font-bold"
              style={{ color: "var(--text-primary)", backgroundColor: "var(--accent-primary-light)" }}>
              {getInitials()}
            </div>
          )}
        </div>
        <div className="flex-1 pb-1 min-w-0">
          <h1 className="text-lg font-bold truncate flex items-center gap-1.5"
            style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
            {displayName}
            {user?.is_verified && <span className="text-blue-500 text-sm">✓</span>}
          </h1>
          {user?.username && (
            <p className="text-sm" style={{ color: "var(--text-hint)" }}>{user.username}</p>
          )}
        </div>
      </div>

      {/* Bio */}
      {bio ? (
        <div className="px-4">
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{bio}</p>
        </div>
      ) : null}

      {/* Website */}
      {websiteUrl ? (
        <div className="px-4">
          <a
            href={websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm font-medium"
            style={{ color: "var(--accent-primary)" }}>
            <Link2 className="w-3.5 h-3.5" />
            {websiteUrl.replace(/^https?:\/\//, "")}
          </a>
        </div>
      ) : null}
    </div>
  );
}