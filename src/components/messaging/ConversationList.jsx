import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Edit, Users, MessageCircle, UserPlus } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d");
}

function Avatar({ src, name, size = 44 }) {
  const initials = name ? name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "?";
  return src ? (
    <img src={src} alt={name} className="rounded-full object-cover flex-shrink-0"
      style={{ width: size, height: size }} />
  ) : (
    <div className="rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white text-sm"
      style={{ width: size, height: size, background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))" }}>
      {initials}
    </div>
  );
}

export default function ConversationList({ user, activeTab, onSelectConversation, activeConvId, typingMap = {} }) {
  const [search, setSearch] = useState("");
  const [messages, setMessages] = useState([]);
  const [groupChats, setGroupChats] = useState([]);
  const [follows, setFollows] = useState([]);

  useEffect(() => {
    if (!user?.email) return;
    const load = async () => {
      const [msgs, groups, followList] = await Promise.all([
        base44.entities.DirectMessage.filter({ receiver_email: user.email }, "-created_date", 200)
          .then(recv => base44.entities.DirectMessage.filter({ sender_email: user.email }, "-created_date", 200)
            .then(sent => [...recv, ...sent])),
        base44.entities.GroupChat.list("-last_message_at", 50),
        base44.entities.Follow.filter({ follower_email: user.email }, "-created_date", 200),
      ]);
      setMessages(msgs);
      setGroupChats(groups.filter(g => g.member_emails?.includes(user.email)));
      setFollows(followList);
    };
    load();
    const unsub = base44.entities.DirectMessage.subscribe(() => load());
    const unsub2 = base44.entities.GroupChatMessage.subscribe(() => load());
    return () => { unsub(); unsub2(); };
  }, [user?.email]);

  const followingEmails = useMemo(() => new Set(follows.map(f => f.following_email)), [follows]);

  // Build conversations map
  const conversations = useMemo(() => {
    const map = {};
    messages.forEach(msg => {
      const convId = msg.conversation_id;
      if (!map[convId] || new Date(msg.created_date) > new Date(map[convId].lastMsg.created_date)) {
        const otherEmail = msg.sender_email === user.email ? msg.receiver_email : msg.sender_email;
        const otherName = msg.sender_email === user.email ? (msg.receiver_name || otherEmail) : (msg.sender_name || otherEmail);
        const otherAvatar = msg.sender_email === user.email ? msg.receiver_avatar : msg.sender_avatar;
        const isRequest = msg.receiver_email === user.email && !followingEmails.has(msg.sender_email) && msg.is_request !== false;
        map[convId] = {
          id: convId,
          type: "dm",
          otherEmail,
          otherName,
          otherAvatar,
          lastMsg: msg,
          unread: messages.filter(m => m.conversation_id === convId && m.receiver_email === user.email && !m.is_read).length,
          isRequest,
        };
      }
    });
    return Object.values(map).sort((a, b) => new Date(b.lastMsg.created_date) - new Date(a.lastMsg.created_date));
  }, [messages, user?.email, followingEmails]);

  const filtered = useMemo(() => {
    let list;
    if (activeTab === "groups") {
      return groupChats.filter(g => !search || g.name?.toLowerCase().includes(search.toLowerCase()));
    }
    if (activeTab === "requests") {
      list = conversations.filter(c => c.isRequest);
    } else {
      list = conversations.filter(c => !c.isRequest);
    }
    if (search) list = list.filter(c => c.otherName?.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [conversations, groupChats, activeTab, search]);

  const requestCount = conversations.filter(c => c.isRequest).length;

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Search */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl"
          style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-hint)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search messages…"
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "var(--text-primary)" }} />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <MessageCircle className="w-12 h-12" style={{ color: "var(--text-hint)" }} />
            <p className="text-sm" style={{ color: "var(--text-hint)" }}>
              {activeTab === "requests" ? "No message requests" : activeTab === "groups" ? "No group chats yet" : "No conversations yet"}
            </p>
          </div>
        )}

        {activeTab !== "groups" && filtered.map(conv => {
          const isTyping = typingMap[conv.id];
          const isActive = activeConvId === conv.id;
          const preview = conv.lastMsg.is_deleted ? "Message deleted" :
            conv.lastMsg.message_type === "voice" ? "🎙 Voice message" :
            conv.lastMsg.message_type === "image" ? "📷 Photo" :
            conv.lastMsg.message_type === "video" ? "🎥 Video" :
            conv.lastMsg.message_type === "gif" ? "GIF" :
            conv.lastMsg.text || "";

          return (
            <button key={conv.id} onClick={() => onSelectConversation({ ...conv, type: "dm" })}
              className="w-full flex items-center gap-3 px-4 py-3 transition-all text-left"
              style={{ backgroundColor: isActive ? "var(--accent-primary-light)" : "transparent" }}>
              <div className="relative">
                <Avatar src={conv.otherAvatar} name={conv.otherName} size={52} />
                {conv.unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                    style={{ backgroundColor: "var(--accent-primary)" }}>
                    {conv.unread > 9 ? "9+" : conv.unread}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{conv.otherName}</span>
                  <span className="text-[11px] flex-shrink-0 ml-2" style={{ color: "var(--text-hint)" }}>{formatTime(conv.lastMsg.created_date)}</span>
                </div>
                {isTyping ? (
                  <span className="text-xs font-medium" style={{ color: "var(--accent-primary)" }}>typing…</span>
                ) : (
                  <p className="text-xs truncate" style={{ color: conv.unread > 0 ? "var(--text-primary)" : "var(--text-hint)", fontWeight: conv.unread > 0 ? 600 : 400 }}>
                    {conv.lastMsg.sender_email === user.email ? "You: " : ""}{preview}
                  </p>
                )}
              </div>
            </button>
          );
        })}

        {activeTab === "groups" && filtered.map(group => (
          <button key={group.id} onClick={() => onSelectConversation({ id: group.id, type: "group", name: group.name, photo: group.photo_url, group })}
            className="w-full flex items-center gap-3 px-4 py-3 transition-all text-left"
            style={{ backgroundColor: activeConvId === group.id ? "var(--accent-primary-light)" : "transparent" }}>
            <Avatar src={group.photo_url} name={group.name} size={52} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{group.name}</span>
                <span className="text-[11px]" style={{ color: "var(--text-hint)" }}>{formatTime(group.last_message_at)}</span>
              </div>
              <p className="text-xs truncate" style={{ color: "var(--text-hint)" }}>
                {group.last_sender_name ? `${group.last_sender_name}: ` : ""}{group.last_message || "No messages yet"}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}