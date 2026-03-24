import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Heart, MessageSquare, UserPlus, Zap, Bell, AtSign, Settings, CheckCheck, MapPin, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import FriendRequestsSheet from "@/components/friends/FriendRequestsSheet";

const typeConfig = {
  new_follower:    { color: "#6366f1", bg: "rgba(99,102,241,0.12)",  label: "followed you",                  emoji: "👤" },
  post_liked:      { color: "#f43f5e", bg: "rgba(244,63,94,0.12)",   label: "liked your post",               emoji: "❤️" },
  post_replied:    { color: "#6366f1", bg: "rgba(99,102,241,0.12)",  label: "replied to your post",          emoji: "💬" },
  post_boosted:    { color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  label: "boosted your post",             emoji: "⚡" },
  mention:         { color: "#14b8a6", bg: "rgba(20,184,166,0.12)",  label: "mentioned you",                 emoji: "📣" },
  direct_message:  { color: "#8b5cf6", bg: "rgba(139,92,246,0.12)", label: "sent you a message",            emoji: "✉️" },
  friend_request:  { color: "#4F46E5", bg: "rgba(79,70,229,0.12)",  label: "sent you a friend request",     emoji: "🤝" },
  friend_accepted: { color: "#16A34A", bg: "rgba(22,163,74,0.12)",  label: "accepted your friend request",  emoji: "✅" },
  friend_nearby:   { color: "#F59E0B", bg: "rgba(245,158,11,0.12)", label: "is nearby!",                    emoji: "📍" },
};

const avatarColors = ["#7C3AED","#D98B62","#3C6E5A","#E05C7A","#4A7FC1","#B07843"];
const getAvatarColor = (name) => avatarColors[(name || "U").charCodeAt(0) % avatarColors.length];

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function groupByDate(notifications) {
  const groups = {};
  notifications.forEach(n => {
    const d = new Date(n.created_date);
    const now = new Date();
    let key;
    if (d.toDateString() === now.toDateString()) key = "Today";
    else {
      const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
      if (d.toDateString() === yesterday.toDateString()) key = "Yesterday";
      else key = d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
    }
    if (!groups[key]) groups[key] = [];
    groups[key].push(n);
  });
  return groups;
}

export default function Notifications() {
  const [user, setUser] = useState(null);
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.email],
    queryFn: () => base44.entities.Notification.filter({ recipient_email: user.email }, "-created_date", 80),
    enabled: !!user?.email,
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (!user?.email) return;
    const unsub = base44.entities.Notification.subscribe((event) => {
      if (event.data?.recipient_email === user.email) {
        queryClient.invalidateQueries({ queryKey: ["notifications", user.email] });
      }
    });
    return unsub;
  }, [user?.email]);

  const markRead = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", user?.email] }),
  });

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    queryClient.invalidateQueries({ queryKey: ["notifications", user?.email] });
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const grouped = groupByDate(notifications);

  const handleNotifClick = (n) => {
    if (!n.is_read) markRead.mutate(n.id);
    if (n.ref_id && (n.type === "post_liked" || n.type === "post_replied" || n.type === "post_boosted")) {
      window.location.href = createPageUrl("PostDetail") + `?id=${n.ref_id}`;
    } else if (n.type === "new_follower" && n.actor_email) {
      window.location.href = `/user/${n.actor_email}`;
    } else if (n.type === "direct_message") {
      window.location.href = createPageUrl("Messages");
    } else if ((n.type === "friend_request" || n.type === "friend_accepted" || n.type === "friend_nearby") && n.actor_email) {
      window.location.href = `/user/${n.actor_email}`;
    }
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-app)" }}>
      {showFriendRequests && user && (
        <FriendRequestsSheet currentUser={user} onClose={() => setShowFriendRequests(false)} />
      )}
      {/* Header */}
      <div
        className="sticky top-0 z-30 px-4 pt-5 pb-4"
        style={{ backgroundColor: "var(--bg-app)", borderBottom: "1px solid var(--border-light)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to={createPageUrl("Home")}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold leading-tight" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
                Notifications
              </h1>
              {unreadCount > 0 && (
                <p className="text-xs font-semibold" style={{ color: "#6366f1" }}>{unreadCount} new</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFriendRequests(true)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{ backgroundColor: "rgba(79,70,229,0.1)", color: "#4F46E5" }}
            >
              <Users className="w-3.5 h-3.5" />
              Requests
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{ backgroundColor: "rgba(99,102,241,0.1)", color: "#6366f1" }}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                All read
              </button>
            )}
            <Link
              to={createPageUrl("NotificationSettings")}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="px-4 pt-6 space-y-3">
          {[0,1,2,3,4].map(i => (
            <div key={i} className="flex items-center gap-3 p-4 rounded-2xl" style={{ backgroundColor: "var(--bg-card)" }}>
              <div className="w-11 h-11 rounded-2xl skeleton shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-40 rounded skeleton" />
                <div className="h-2.5 w-24 rounded skeleton" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-28 px-8 text-center">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
            <Bell className="w-9 h-9" style={{ color: "var(--text-hint)" }} />
          </div>
          <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>All caught up!</h3>
          <p className="text-sm" style={{ color: "var(--text-hint)" }}>When people like, reply, or follow — it shows up here.</p>
        </div>
      ) : (
        <div className="pt-2">
          {Object.entries(grouped).map(([dateLabel, notifs]) => (
            <div key={dateLabel}>
              <p className="text-[11px] font-bold uppercase tracking-widest px-4 py-2 mt-3 first:mt-0" style={{ color: "var(--text-hint)" }}>
                {dateLabel}
              </p>
              <div>
                {notifs.map((n) => {
                  const cfg = typeConfig[n.type] || typeConfig.post_liked;
                  const actorInitial = (n.actor_name || "S")[0].toUpperCase();
                  const avatarBg = getAvatarColor(n.actor_name);
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className="flex items-start gap-3.5 px-4 py-3.5 cursor-pointer active:bg-[var(--bg-subtle)] transition-colors"
                      style={{
                        backgroundColor: n.is_read ? "transparent" : cfg.bg.replace("0.12","0.06"),
                        borderBottom: "1px solid var(--border-subtle)",
                      }}
                    >
                      {/* Avatar with type badge */}
                      <div className="relative shrink-0">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold text-white overflow-hidden"
                          style={{ background: `linear-gradient(135deg, ${avatarBg}cc, ${avatarBg})` }}>
                          {n.actor_avatar_url ? (
                            <img src={n.actor_avatar_url} alt={n.actor_name} className="w-full h-full object-cover" />
                          ) : actorInitial}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[11px]"
                          style={{ backgroundColor: "var(--bg-card)", border: "1.5px solid var(--bg-card)" }}>
                          {cfg.emoji}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-snug break-words" style={{ color: "var(--text-primary)" }}>
                          <span className="font-bold">{n.actor_name || "Someone"}</span>{" "}
                          <span style={{ color: "var(--text-secondary)" }}>{cfg.label}</span>
                          {n.post_text && (
                            <span className="font-bold"> "{n.post_text.slice(0,40)}{n.post_text.length>40?"...":""}"</span>
                          )}
                        </p>
                        <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>
                          {timeAgo(n.created_date)}
                        </p>
                        {n.type === "friend_request" && !n.is_read && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={e => { e.stopPropagation(); markRead.mutate(n.id); }}
                              className="px-4 py-1.5 rounded-xl text-xs font-semibold"
                              style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", border: "1px solid var(--border-medium)" }}>
                              Dismiss
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); handleNotifClick(n); }}
                              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white"
                              style={{ backgroundColor: "var(--accent-primary)" }}>
                              View
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Unread dot */}
                      {!n.is_read && (
                        <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ backgroundColor: cfg.color }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}