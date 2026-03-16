import React from "react";
import { MessageCircle, User, X } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function UserPinPopup({ presence, currentUser, onClose }) {
  if (!presence) return null;

  const isSelf = currentUser?.email === presence.user_email;
  const initials = (presence.user_name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const activityEmoji = {
    studying: "📚", eating: "🍽️", watching_event: "🎉",
    walking: "🚶", meeting_friends: "👥", working: "💼",
    exploring: "🔍", other: "📍",
  }[presence.activity_tag] || "📍";

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        width: 220,
        backgroundColor: "var(--bg-card)",
        boxShadow: "0 16px 48px rgba(0,0,0,0.22)",
        border: "1px solid var(--border-light)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 p-3 pb-2">
        {presence.avatar_url ? (
          <img
            src={presence.avatar_url}
            alt={presence.user_name}
            className="w-10 h-10 rounded-full object-cover shrink-0"
            style={{ border: "2px solid var(--accent-primary)" }}
          />
        ) : (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
            style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", color: "#fff" }}
          >
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>
            {isSelf ? "You" : presence.user_name || "User"}
          </p>
          {presence.activity_tag && (
            <p className="text-xs" style={{ color: "var(--text-hint)" }}>
              {activityEmoji} {presence.activity_tag.replace(/_/g, " ")}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--bg-subtle)", minHeight: 24, minWidth: 24 }}
        >
          <X className="w-3 h-3" style={{ color: "var(--text-hint)" }} />
        </button>
      </div>

      {/* Status message */}
      {presence.status_message && (
        <div className="px-3 pb-2">
          <p className="text-xs italic px-2 py-1.5 rounded-xl" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
            "{presence.status_message}"
          </p>
        </div>
      )}

      {/* Location */}
      {presence.location_name && (
        <div className="px-3 pb-2">
          <p className="text-xs" style={{ color: "var(--text-hint)" }}>
            📍 {presence.location_name}
          </p>
        </div>
      )}

      {/* Actions */}
      {!isSelf && (
        <div className="flex gap-2 px-3 pb-3">
          <Link
            to={`/user/${encodeURIComponent(presence.user_email)}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold"
            style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}
          >
            <User className="w-3.5 h-3.5" /> Profile
          </Link>
          <Link
            to={createPageUrl(`Messages?with=${presence.user_email}`)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold"
            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)" }}
          >
            <MessageCircle className="w-3.5 h-3.5" /> Message
          </Link>
        </div>
      )}
    </div>
  );
}