import React from "react";

export default function ProfileView({ user }) {
  const getInitials = () => {
    const name = user?.display_name || user?.full_name || user?.username || "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const displayName = user?.display_name || user?.full_name || user?.username || "User";
  const username = user?.username || user?.email?.split("@")[0] || "";
  const headline = user?.headline || user?.about_me_title || user?.bio_title || "";
  const bio = user?.about_me || user?.bio || "";
  const role = user?.role_label || user?.creator_category || user?.interests?.[0] || user?.role || "";

  return (
    <div className="space-y-3">
      {/* Avatar + Name row */}
      <div className="flex items-center gap-4 px-1">
        {/* Avatar */}
        <div
          className="rounded-full overflow-hidden shrink-0"
          style={{ width: 72, height: 72, border: "3px solid var(--border-light)", backgroundColor: "var(--bg-subtle)" }}
        >
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl font-bold"
              style={{ color: "var(--text-primary)", backgroundColor: "var(--accent-primary-light)" }}>
              {getInitials()}
            </div>
          )}
        </div>

        {/* Name + username + badge */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h2 className="text-lg font-bold leading-tight" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              {displayName}
            </h2>
            {user?.is_verified && (
              <span style={{ color: "#3b82f6", fontSize: 14 }}>✓</span>
            )}
          </div>
          {username && (
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{username}</p>
          )}
          {role && (
            <span
              className="inline-block mt-1 text-xs font-medium px-2.5 py-0.5 rounded-full"
              style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}
            >
              {role}
            </span>
          )}
        </div>
      </div>

      {/* Bio card */}
      {(headline || bio) && (
        <div className="rounded-2xl p-4 space-y-1" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          {headline && (
            <p className="text-sm font-semibold italic" style={{ color: "var(--text-primary)" }}>
              {headline}
            </p>
          )}
          {bio && (
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {bio}
            </p>
          )}
        </div>
      )}
    </div>
  );
}