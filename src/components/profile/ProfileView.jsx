import React from "react";

export default function ProfileView({ user }) {
  const getInitials = () => {
    const name = user?.display_name || user?.full_name || user?.username || "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-4">
      {/* Banner & Avatar */}
      <div>
        <div className="relative rounded-2xl overflow-hidden" style={{ height: "140px", backgroundColor: "var(--bg-subtle)" }}>
          {user?.banner_url ? (
            <img src={user.banner_url} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full" style={{ background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))" }} />
          )}
        </div>

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
          <div className="flex-1 pb-2 min-w-0">
            <h1 className="text-lg font-bold truncate flex items-center gap-1.5" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
              {user?.display_name || user?.full_name || user?.username || "User"}
              {user?.is_verified && <span className="text-blue-500 text-base">✓</span>}
            </h1>
            {user?.username && (
              <p className="text-sm" style={{ color: "var(--text-hint)" }}>{user.username}</p>
            )}
            {user?.bio && (
              <p className="text-sm mt-1 leading-snug" style={{ color: "var(--text-secondary)" }}>{user.bio}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}