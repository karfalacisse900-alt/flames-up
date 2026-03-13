import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const COLORS = ["#25D366", "#128C7E", "#075E54", "#34B7F1", "#7B68EE", "#FF6B6B", "#FFA500"];
const avatarColor = (str) => COLORS[(str || "a").charCodeAt(0) % COLORS.length];
const getName = (name, email) => (!name || name === email) ? (email?.split("@")[0] || "User") : name;

const formatTime = (date) => {
  try {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    if (diff < 86400000 && d.getDate() === now.getDate()) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    if (diff < 604800000) {
      return ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()];
    }
    return d.toLocaleDateString([], { day: "2-digit", month: "2-digit" });
  } catch { return ""; }
};

const getPreview = (msg) => {
  if (!msg) return "";
  if (msg.is_deleted) return "🚫 Deleted message";
  if (msg.audio_url || msg.message_type === "voice") return "🎤 Voice message";
  if (msg.gif_url) return "🎞 GIF";
  if (msg.media_urls?.length) return "📷 Photo";
  if (msg.message_type === "location") return "📍 Location";
  return msg.text || "";
};

export default function ConversationListTab({ user, tab, onSelect }) {
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
        ? getName(m.receiver_name || m.receiver_email, m.receiver_email)
        : getName(m.sender_name || m.sender_email, m.sender_email);
      if (!map[otherEmail]) {
        map[otherEmail] = { email: otherEmail, name: otherName, lastMessage: m, unread: 0 };
      } else if (new Date(m.created_date) > new Date(map[otherEmail].lastMessage.created_date)) {
        map[otherEmail].lastMessage = m;
        if (!map[otherEmail].name) map[otherEmail].name = otherName;
      }
      if (m.receiver_email === user.email && !m.is_read) {
        map[otherEmail].unread = (map[otherEmail].unread || 0) + 1;
      }
    });

    return Object.values(map)
      .map(c => ({
        ...c,
        isRequest: !followingEmails.has(c.email) && c.lastMessage.sender_email !== user.email && c.unread > 0,
      }))
      .sort((a, b) => new Date(b.lastMessage.created_date) - new Date(a.lastMessage.created_date));
  }, [sentMessages, receivedMessages, followingEmails, user.email]);

  const filtered = conversations.filter(c =>
    tab === "requests" ? c.isRequest : !c.isRequest
  );

  if (filtered.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: "#F0F8F0" }}>
        <span className="text-4xl">{tab === "requests" ? "📩" : "💬"}</span>
      </div>
      <p className="text-base font-semibold mb-1" style={{ color: "#333" }}>
        {tab === "requests" ? "No message requests" : "No conversations yet"}
      </p>
      <p className="text-sm text-center px-8" style={{ color: "#999" }}>
        {tab === "requests" ? "Messages from people you don't follow appear here" : "Start a new conversation using the pencil icon above"}
      </p>
    </div>
  );

  return (
    <div className="space-y-3">
      {filtered.map((conv) => (
        <button key={conv.email} onClick={() => onSelect({ type: "dm", data: conv })}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left rounded-[24px]"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "var(--elevation-1)" }}>

          {/* Avatar */}
          <div className="w-[54px] h-[54px] rounded-2xl flex items-center justify-center text-xl font-bold shrink-0"
            style={{ background: `linear-gradient(135deg, ${avatarColor(conv.email)}, var(--accent-primary))`, color: "#fff" }}>
            {conv.name?.[0]?.toUpperCase() || "?"}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <p className="font-semibold text-[15px] truncate" style={{ color: "#111" }}>{conv.name}</p>
              <span className="text-[12px] shrink-0 ml-2" style={{ color: conv.unread > 0 ? "#25D366" : "#999", fontWeight: conv.unread > 0 ? 600 : 400 }}>
                {formatTime(conv.lastMessage.created_date)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[13px] truncate flex-1" style={{ color: conv.unread > 0 ? "#333" : "#999", fontWeight: conv.unread > 0 ? 500 : 400 }}>
                {conv.lastMessage.sender_email === user.email
                  ? <span style={{ color: "#999" }}>You: </span>
                  : null}
                {getPreview(conv.lastMessage)}
              </p>
              {conv.unread > 0 && (
                <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-bold text-white ml-2 shrink-0"
                  style={{ backgroundColor: "#25D366" }}>
                  {conv.unread > 9 ? "9+" : conv.unread}
                </div>
              )}
              {tab === "requests" && conv.unread === 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full ml-2 font-semibold shrink-0"
                  style={{ backgroundColor: "#FFF3E0", color: "#E65100" }}>Req</span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}