import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";

const COLORS = ["#2E6B4F", "#D98B62", "#6B4F2E", "#4A6B9F", "#8B4F6B"];
const avatarColor = (str) => COLORS[(str || "a").charCodeAt(0) % COLORS.length];
const displayName = (name, email) => {
  if (!name || name === email) return email?.split("@")[0] || "User";
  return name;
};

const timeAgo = (date) => {
  try {
    const diff = (Date.now() - new Date(date)) / 1000;
    if (diff < 60) return "now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  } catch { return ""; }
};

const getPreview = (msg) => {
  if (!msg) return "";
  if (msg.is_deleted) return "Message deleted";
  if (msg.audio_url || msg.message_type === "voice") return "🎤 Voice message";
  if (msg.gif_url) return "GIF";
  if (msg.media_urls?.length) return "📷 Photo";
  if (msg.message_type === "location") return "📍 Location";
  return msg.text || "";
};

export default function ConversationListTab({ user, tab, onSelect }) {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: sentMessages = [] } = useQuery({
    queryKey: ["dmSent", user?.email],
    queryFn: () => base44.entities.DirectMessage.filter({ sender_email: user.email }, "-created_date", 200),
    enabled: !!user?.email,
    refetchInterval: 8000,
  });

  const { data: receivedMessages = [] } = useQuery({
    queryKey: ["dmReceived", user?.email],
    queryFn: () => base44.entities.DirectMessage.filter({ receiver_email: user.email }, "-created_date", 200),
    enabled: !!user?.email,
    refetchInterval: 8000,
  });

  const { data: myFollowing = [] } = useQuery({
    queryKey: ["myFollowing", user?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: user.email }),
    enabled: !!user?.email,
  });

  useEffect(() => {
    if (!user?.email) return;
    const unsub = base44.entities.DirectMessage.subscribe((event) => {
      if (event.data?.receiver_email === user.email || event.data?.sender_email === user.email) {
        queryClient.invalidateQueries({ queryKey: ["dmSent", user.email] });
        queryClient.invalidateQueries({ queryKey: ["dmReceived", user.email] });
      }
    });
    return unsub;
  }, [user?.email, queryClient]);

  const followingEmails = useMemo(() => new Set(myFollowing.map(f => f.following_email)), [myFollowing]);

  const conversations = useMemo(() => {
    const map = {};
    [...sentMessages, ...receivedMessages].forEach((m) => {
      const otherEmail = m.sender_email === user.email ? m.receiver_email : m.sender_email;
      const otherName = m.sender_email === user.email
        ? (m.receiver_name || m.receiver_email)
        : (m.sender_name || m.sender_email);
      if (!map[otherEmail]) {
        map[otherEmail] = { email: otherEmail, name: otherName, lastMessage: m, unread: 0 };
      } else if (new Date(m.created_date) > new Date(map[otherEmail].lastMessage.created_date)) {
        map[otherEmail].lastMessage = m;
        if (!map[otherEmail].name || map[otherEmail].name === otherEmail) {
          map[otherEmail].name = otherName;
        }
      }
      if (m.receiver_email === user.email && !m.is_read) {
        map[otherEmail].unread = (map[otherEmail].unread || 0) + 1;
      }
    });

    return Object.values(map)
      .map(c => ({
        ...c,
        isRequest: !followingEmails.has(c.email)
          && c.lastMessage.sender_email !== user.email
          && c.unread > 0,
      }))
      .sort((a, b) => new Date(b.lastMessage.created_date) - new Date(a.lastMessage.created_date));
  }, [sentMessages, receivedMessages, followingEmails, user.email]);

  const filtered = conversations.filter(c => {
    const matchSearch = !search
      || c.name?.toLowerCase().includes(search.toLowerCase())
      || c.email.toLowerCase().includes(search.toLowerCase());
    if (tab === "requests") return matchSearch && c.isRequest;
    return matchSearch && !c.isRequest;
  });

  return (
    <div>
      {/* Search bar */}
      <div className="px-4 mb-3">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl"
          style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
          <Search className="w-4 h-4 shrink-0" style={{ color: "var(--text-hint)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={tab === "requests" ? "Search requests…" : "Search conversations…"}
            className="flex-1 bg-transparent text-sm outline-none" style={{ color: "var(--text-primary)" }} />
        </div>
      </div>

      {/* List */}
      <div className="space-y-0.5 px-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-3xl mb-3">{tab === "requests" ? "📩" : "💬"}</p>
            <p className="text-sm" style={{ color: "var(--text-hint)" }}>
              {tab === "requests" ? "No message requests" : "No conversations yet"}
            </p>
            {tab === "requests" && (
              <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>
                Messages from people you don't follow appear here
              </p>
            )}
          </div>
        ) : filtered.map(conv => {
          const name = displayName(conv.name, conv.email);
          return (
            <button key={conv.email} onClick={() => onSelect({ type: "dm", data: { ...conv, name } })}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition-colors"
              style={{ backgroundColor: "transparent" }}>
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{ backgroundColor: avatarColor(conv.email), color: "#fff" }}>
                  {name[0]?.toUpperCase() || "?"}
                </div>
                {conv.unread > 0 && (
                  <div className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2"
                    style={{ backgroundColor: "var(--accent-primary)", borderColor: "var(--bg-app)" }}>
                    {conv.unread > 9 ? "9+" : conv.unread}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-[15px] truncate" style={{ color: "var(--text-primary)", fontWeight: conv.unread > 0 ? 700 : 500 }}>
                    {name}
                  </p>
                  <span className="text-[11px] shrink-0 ml-2" style={{ color: conv.unread > 0 ? "var(--accent-primary)" : "var(--text-hint)", fontWeight: conv.unread > 0 ? 600 : 400 }}>
                    {timeAgo(conv.lastMessage.created_date)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-[13px] truncate flex-1"
                    style={{ color: conv.unread > 0 ? "var(--text-secondary)" : "var(--text-hint)", fontWeight: conv.unread > 0 ? 500 : 400 }}>
                    {conv.lastMessage.sender_email === user.email ? "You: " : ""}{getPreview(conv.lastMessage)}
                  </p>
                  {tab === "requests" && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full ml-2 font-semibold shrink-0"
                      style={{ backgroundColor: "#FFF3E0", color: "#E65100" }}>Request</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}