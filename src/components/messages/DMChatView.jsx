import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MoreVertical, Phone, Video, Ban, VolumeX, AlertTriangle, UserX } from "lucide-react";
import RichMessageBubble from "./RichMessageBubble";
import ChatInputBar from "./ChatInputBar";
import CreatorBadge from "@/components/creators/CreatorBadge.jsx";

const COLORS = ["#25D366", "#128C7E", "#075E54", "#34B7F1", "#7B68EE", "#FF6B6B", "#FFA500"];
const avatarColor = (str) => COLORS[(str || "a").charCodeAt(0) % COLORS.length];
const getName = (name, email) => (!name || name === email) ? (email?.split("@")[0] || "User") : name;

export default function DMChatView({ user, conversation, onBack }) {
  const [replyTo, setReplyTo] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [muted, setMuted] = useState(false);
  // no local showVideoCall needed — calls go through global CallManager

  const [partnerCreator, setPartnerCreator] = useState(null);
  const endRef = useRef(null);
  const queryClient = useQueryClient();
  const convId = [user.email, conversation.email].sort().join("_");
  const displayName = getName(conversation.name, conversation.email);

  useEffect(() => {
    // Check if conversation partner is an approved creator
    base44.entities.Creator.filter({ user_email: conversation.email, approval_status: "approved" })
      .then(rows => setPartnerCreator(rows[0] || null))
      .catch(() => {});
  }, [conversation.email]);

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

    // Send real-time notification to recipient
    const mutedList = JSON.parse(localStorage.getItem("muted_users") || "[]");
    if (!mutedList.includes(conversation.email)) {
      base44.entities.Notification.create({
        recipient_email: conversation.email,
        actor_email: user.email,
        actor_name: user.full_name || user.email?.split("@")[0] || "Someone",
        type: "direct_message",
        post_text: fields.text
          ? fields.text.slice(0, 80)
          : fields.message_type === "voice"
          ? "🎤 Voice message"
          : fields.message_type === "gif"
          ? "🎭 GIF"
          : fields.message_type === "location"
          ? "📍 Location"
          : "📷 Media",
        ref_id: convId,
        is_read: false,
      }).catch(() => {});
    }

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
    reactions[emoji] = existing.includes(user.email)
      ? existing.filter(e => e !== user.email)
      : [...existing, user.email];
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

  return (
    <div className="flex flex-col" style={{ height: "100dvh", background: "linear-gradient(180deg, #f8f5ff 0%, #eef2ff 45%, #ecfeff 100%)" }}>

      {/* Header */}
      <div className="mx-3 mt-3 flex items-center gap-2 px-3 shrink-0 rounded-[24px]"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-light)",
          boxShadow: "var(--elevation-2)",
          paddingTop: "max(env(safe-area-inset-top, 0px), 16px)",
          paddingBottom: 12,
        }}>
        <button onClick={onBack} className="p-1 mr-1">
          <ArrowLeft className="w-6 h-6" style={{ color: "var(--text-primary)" }} />
        </button>

        {/* Avatar */}
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-base font-bold shrink-0"
          style={{ background: `linear-gradient(135deg, ${avatarColor(conversation.email)}, #7C3AED)`, color: "#fff" }}>
          {conversation.avatar_url
            ? <img src={conversation.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            : displayName[0]?.toUpperCase() || "?"}
        </div>

        {/* Name + status */}
        <div className="flex-1 min-w-0 ml-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-semibold text-[16px] truncate" style={{ color: "var(--text-primary)" }}>{displayName}</p>
            {partnerCreator && <CreatorBadge category={partnerCreator.category} size="xs" />}
          </div>
          <p className="text-[12px]" style={{ color: "var(--text-hint)" }}>
            {partnerCreator?.status_message
              ? `💬 ${partnerCreator.status_message}`
              : muted ? "🔇 Muted" : "tap here for contact info"}
          </p>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button className="w-9 h-9 flex items-center justify-center rounded-full"
            onClick={() => window.__callManager?.startCall({ calleeEmail: conversation.email, calleeName: displayName, callType: "video" })}
            style={{ backgroundColor: "#f3ecff" }}>
            <Video className="w-5 h-5" style={{ color: "#7C3AED" }} />
          </button>
          <button className="w-9 h-9 flex items-center justify-center rounded-full"
            onClick={() => window.__callManager?.startCall({ calleeEmail: conversation.email, calleeName: displayName, callType: "audio" })}
            style={{ backgroundColor: "#ecfeff" }}>
            <Phone className="w-5 h-5" style={{ color: "#0F766E" }} />
          </button>
          <div className="relative">
            <button className="w-9 h-9 flex items-center justify-center rounded-full" onClick={() => setShowMenu(v => !v)} style={{ backgroundColor: "#f8fafc" }}>
              <MoreVertical className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-10 z-50 rounded-xl shadow-xl overflow-hidden"
                  style={{ backgroundColor: "#fff", minWidth: 200 }}>
                  {[
                    { icon: VolumeX, label: muted ? "Unmute" : "Mute notifications", action: handleMute },
                    { icon: Ban, label: blocked ? "Unblock" : "Block", action: handleBlock, danger: !blocked },
                    { icon: AlertTriangle, label: "Report", action: () => setShowMenu(false), danger: true },
                  ].map(({ icon: Icon, label, action, danger }) => (
                    <button key={label} onClick={action}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-[14px]"
                      style={{ color: danger ? "#E53935" : "#333", borderBottom: "1px solid #F5F5F5" }}>
                      <Icon className="w-4 h-4" /> {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Blocked banner */}
      {blocked && (
        <div className="mx-4 mt-2 px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm shrink-0"
          style={{ backgroundColor: "#FFEBEE", color: "#C62828" }}>
          <UserX className="w-4 h-4 shrink-0" />
          You have blocked this user. Unblock to send messages.
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-2 py-3" style={{ scrollbarWidth: "none" }}>
        {/* Encrypted notice */}
        <div className="flex justify-center mb-4">
          <div className="px-4 py-1.5 rounded-lg text-[12px] text-center max-w-[280px]"
            style={{ backgroundColor: "rgba(255,248,196,0.9)", color: "#7B6914" }}>
            🔒 Messages are private
          </div>
        </div>

        {visibleMessages.length === 0 && !blocked && (
          <div className="flex justify-center">
            <div className="px-5 py-3 rounded-2xl text-[13px]"
              style={{ backgroundColor: "rgba(255,255,255,0.85)", color: "#555" }}>
              👋 Say hello to <strong>{displayName}</strong>!
            </div>
          </div>
        )}

        {/* Group messages by date */}
        {visibleMessages.map((msg, idx) => {
          const prevMsg = visibleMessages[idx - 1];
          const showDate = !prevMsg || new Date(msg.created_date).toDateString() !== new Date(prevMsg.created_date).toDateString();
          return (
            <React.Fragment key={msg.id}>
              {showDate && (
                <div className="flex justify-center my-3">
                  <span className="px-3 py-1 rounded-full text-[12px] font-medium"
                    style={{ backgroundColor: "rgba(255,255,255,0.85)", color: "#666" }}>
                    {new Date(msg.created_date).toDateString() === new Date().toDateString()
                      ? "Today"
                      : new Date(msg.created_date).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
                  </span>
                </div>
              )}
              <RichMessageBubble
                message={msg}
                isMe={msg.sender_email === user.email}
                user={user}
                onReply={setReplyTo}
                onReact={handleReact}
                onDelete={handleDelete}
              />
            </React.Fragment>
          );
        })}
        <div ref={endRef} />
      </div>

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