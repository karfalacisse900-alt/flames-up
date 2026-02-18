import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Heart, MessageSquare, UserPlus, Zap, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

const typeConfig = {
  new_follower: { icon: UserPlus, color: "#3C6E5A", bg: "rgba(60,110,90,0.1)", label: "followed you" },
  post_liked: { icon: Heart, color: "#E05C7A", bg: "rgba(224,92,122,0.1)", label: "liked your post" },
  post_replied: { icon: MessageSquare, color: "#5579A6", bg: "rgba(85,121,166,0.1)", label: "replied to your post" },
  post_boosted: { icon: Zap, color: "#F59E0B", bg: "rgba(245,158,11,0.1)", label: "boosted your post" },
};

export default function Notifications() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.email],
    queryFn: () => base44.entities.Notification.filter({ recipient_email: user.email }, "-created_date", 50),
    enabled: !!user?.email,
  });

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

  function timeAgo(date) {
    const diff = (Date.now() - new Date(date)) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex items-center justify-between" style={{ backgroundColor: "var(--bg-nav)", borderBottom: "1px solid var(--border-light)" }}>
        <div className="flex items-center gap-3">
          <Link to={createPageUrl("Home")} className="p-2 rounded-full" style={{ backgroundColor: "var(--bg-app)", color: "var(--text-secondary)" }}>
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Notifications</h1>
            {unreadCount > 0 && <p className="text-xs" style={{ color: "var(--accent-secondary)" }}>{unreadCount} unread</p>}
          </div>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-xs font-medium px-3 py-1.5 rounded-full" style={{ backgroundColor: "rgba(60,110,90,0.1)", color: "var(--accent-primary)" }}>
            Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center pt-20">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-24 px-8 text-center">
          <Bell className="w-12 h-12 mb-4" style={{ color: "var(--border-medium)" }} />
          <p className="text-base font-medium" style={{ color: "var(--text-secondary)" }}>No notifications yet</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-hint)" }}>When people interact with your posts, you'll see it here.</p>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: "var(--border-light)" }}>
          {notifications.map((n) => {
            const cfg = typeConfig[n.type] || typeConfig.post_liked;
            const Icon = cfg.icon;
            return (
              <div
                key={n.id}
                onClick={() => { if (!n.is_read) markRead.mutate(n.id); }}
                className="flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors"
                style={{ backgroundColor: n.is_read ? "var(--bg-nav)" : "rgba(60,110,90,0.04)" }}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: cfg.bg }}>
                  <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-snug" style={{ color: "var(--text-primary)" }}>
                    <span className="font-semibold">{n.actor_name || "Someone"}</span>{" "}
                    <span style={{ color: "var(--text-secondary)" }}>{cfg.label}</span>
                  </p>
                  {n.post_text && (
                    <p className="text-xs mt-1 truncate" style={{ color: "var(--text-hint)", fontFamily: "var(--font-serif)" }}>"{n.post_text}"</p>
                  )}
                  <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>{timeAgo(n.created_date)}</p>
                </div>
                {!n.is_read && (
                  <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ backgroundColor: "var(--accent-primary)" }} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}