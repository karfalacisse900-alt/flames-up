import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MoreVertical, Ban, AlertTriangle, UserX, VolumeX } from "lucide-react";
import MessageBubble from "./MessageBubble";
import ChatInputBar from "./ChatInputBar";

const COLORS = ["#2E6B4F", "#D98B62", "#6B4F2E", "#4A6B9F", "#8B4F6B"];
const avatarColor = (str) => COLORS[(str || "a").charCodeAt(0) % COLORS.length];

export default function DMChatView({ user, conversation, onBack }) {
  const [replyTo, setReplyTo] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [muted, setMuted] = useState(false);
  const endRef = useRef(null);
  const queryClient = useQueryClient();
  const convId = [user.email, conversation.email].sort().join("_");

  useEffect(() => {
    const blockedList = JSON.parse(localStorage.getItem("blocked_users") || "[]");
    setBlocked(blockedList.includes(conversation.email));
    const mutedList = JSON.parse(localStorage.getItem("muted_users") || "[]");
    setMuted(mutedList.includes(conversation.email));
  }, [conversation.email]);

  const { data: messages = [] } = useQuery({
    queryKey: ["dm", convId],
    queryFn: () => base44.entities.DirectMessage.filter({ conversation_id: convId }, "created_date", 150),
    refetchInterval: 3000,
  });

  const blockedList = JSON.parse(localStorage.getItem("blocked_users") || "[]");
  const visibleMessages = messages.filter(m =>
    !blockedList.includes(m.sender_email) || m.sender_email === user.email
  );

  useEffect(() => {
    messages.filter(m => m.receiver_email === user.email && !m.is_read)
      .forEach(m => base44.entities.DirectMessage.update(m.id, { is_read: true }));
  }, [messages, user.email]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    const unsub = base44.entities.DirectMessage.subscribe((event) => {
      if (event.data?.conversation_id === convId) {
        queryClient.invalidateQueries({ queryKey: ["dm", convId] });
      }
    });
    return unsub;
  }, [convId, queryClient]);

  const createMsg = async (fields) => {
    await base44.entities.DirectMessage.create({
      conversation_id: convId,
      sender_email: user.email,
      sender_name: user.full_name || user.email,
      receiver_email: conversation.email,
      is_read: false,
      ...(replyTo ? { reply_to_id: replyTo.id, reply_preview: replyTo.text || "Voice message" } : {}),
      ...fields,
    });
    setReplyTo(null);
    queryClient.invalidateQueries({ queryKey: ["dm", convId] });
    queryClient.invalidateQueries({ queryKey: ["dmSent", user.email] });
    queryClient.invalidateQueries({ queryKey: ["dmReceived", user.email] });
  };

  const handleReact = async (msgId, emoji) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;
    const reactions = { ...(msg.reactions || {}) };
    const existing = reactions[emoji] || [];
    if (existing.includes(user.email)) {
      reactions[emoji] = existing.filter(e => e !== user.email);
    } else {
      reactions[emoji] = [...existing, user.email];
    }
    await base44.entities.DirectMessage.update(msgId, { reactions });
    queryClient.invalidateQueries({ queryKey: ["dm", convId] });
  };

  const handleDelete = async (msgId) => {
    await base44.entities.DirectMessage.update(msgId, { is_deleted: true, text: "" });
    queryClient.invalidateQueries({ queryKey: ["dm", convId] });
  };

  const handleBlock = () => {
    const list = JSON.parse(localStorage.getItem("blocked_users") || "[]");
    if (blocked) {
      localStorage.setItem("blocked_users", JSON.stringify(list.filter(e => e !== conversation.email)));
      setBlocked(false);
    } else {
      list.push(conversation.email);
      localStorage.setItem("blocked_users", JSON.stringify(list));
      setBlocked(true);
    }
    setShowMenu(false);
  };

  const handleMute = () => {
    const list = JSON.parse(localStorage.getItem("muted_users") || "[]");
    if (muted) {
      localStorage.setItem("muted_users", JSON.stringify(list.filter(e => e !== conversation.email)));
      setMuted(false);
    } else {
      list.push(conversation.email);
      localStorage.setItem("muted_users", JSON.stringify(list));
      setMuted(true);
    }
    setShowMenu(false);
  };

  const displayName = conversation.name && conversation.name !== conversation.email
    ? conversation.name
    : conversation.email?.split("@")[0] || "User";

  return (
    <div className="flex flex-col" style={{ height: "100dvh", backgroundColor: "#ECE5DD" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-2.5 shrink-0"
        style={{ backgroundColor: "var(--accent-primary)", paddingTop: "max(env(safe-area-inset-top, 0px), 44px)" }}>
        <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" style={{ color: "#fff" }} />
        </button>
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
          style={{ backgroundColor: avatarColor(conversation.email), color: "#fff" }}>
          {conversation.avatar_url
            ? <img src={conversation.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            : displayName[0]?.toUpperCase() || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold truncate" style={{ color: "#fff" }}>{displayName}</p>
          {muted
            ? <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.7)" }}>Muted</p>
            : <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.75)" }}>tap for info</p>}
        </div>
        <div className="relative">
          <button onClick={() => setShowMenu(v => !v)} className="w-9 h-9 rounded-full flex items-center justify-center">
            <MoreVertical className="w-5 h-5" style={{ color: "#fff" }} />
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-10 z-50 rounded-2xl shadow-lg border overflow-hidden"
                style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)", minWidth: 180 }}>
                {[
                  { icon: VolumeX, label: muted ? "Unmute" : "Mute", action: handleMute },
                  { icon: Ban, label: blocked ? "Unblock" : "Block User", action: handleBlock, danger: !blocked },
                  { icon: AlertTriangle, label: "Report", action: () => setShowMenu(false), danger: true },
                ].map(({ icon: Icon, label, action, danger }) => (
                  <button key={label} onClick={action}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm"
                    style={{ color: danger ? "#E05C7A" : "var(--text-primary)" }}>
                    <Icon className="w-4 h-4" /> {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Blocked banner */}
      {blocked && (
        <div className="mx-4 mt-3 px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm"
          style={{ backgroundColor: "rgba(224,92,122,0.08)", color: "#E05C7A", border: "1px solid rgba(224,92,122,0.2)" }}>
          <UserX className="w-4 h-4 shrink-0" />
          You have blocked this user.
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4"
        style={{ scrollbarWidth: "none" }}>
        {visibleMessages.length === 0 && (
          <div className="text-center mt-12">
            <p className="text-3xl mb-2">👋</p>
            <p className="text-sm" style={{ color: "var(--text-hint)" }}>
              Say hi to {conversation.name}
            </p>
          </div>
        )}
        {visibleMessages.map(msg => (
          <MessageBubble key={msg.id}
            message={msg}
            isMe={msg.sender_email === user.email}
            user={user}
            onReply={setReplyTo}
            onReact={handleReact}
            onDelete={handleDelete}
          />
        ))}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <ChatInputBar
        disabled={blocked}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        onSendText={(text) => createMsg({ text, message_type: "text" })}
        onSendVoice={(audio_url) => createMsg({ audio_url, message_type: "voice", text: "" })}
        onSendMedia={(urls) => createMsg({ media_urls: urls, message_type: urls[0]?.match(/video/) ? "video" : "image", text: "" })}
        onSendGif={(gif_url) => createMsg({ gif_url, message_type: "gif", text: "" })}
        onSendLocation={(loc) => createMsg({ location_data: loc, message_type: "location", text: "" })}
      />
    </div>
  );
}