import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Image, Smile, Send, MapPin, Shield, BellOff, Ban, MoreVertical, Info } from "lucide-react";
import ChatBubble from "./ChatBubble";
import VoiceRecorder from "./VoiceRecorder";
import GifPicker from "./GifPicker";

function Avatar({ src, name, size = 40 }) {
  const initials = name ? name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "?";
  return src ? (
    <img src={src} alt={name} className="rounded-full object-cover flex-shrink-0" style={{ width: size, height: size }} />
  ) : (
    <div className="rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white text-sm"
      style={{ width: size, height: size, background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))" }}>
      {initials}
    </div>
  );
}

export default function ChatView({ user, conversation, onBack }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [showVoice, setShowVoice] = useState(false);
  const [showGif, setShowGif] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const isGroup = conversation.type === "group";
  const convId = conversation.id;

  const loadMessages = useCallback(async () => {
    if (isGroup) {
      const msgs = await base44.entities.GroupChatMessage.filter({ group_id: convId }, "created_date", 200);
      setMessages(msgs);
    } else {
      const msgs = await base44.entities.DirectMessage.filter({ conversation_id: convId }, "created_date", 200);
      setMessages(msgs);
      // Mark as read
      msgs.filter(m => m.receiver_email === user.email && !m.is_read)
        .forEach(m => base44.entities.DirectMessage.update(m.id, { is_read: true, read_at: new Date().toISOString() }).catch(() => {}));
    }
  }, [convId, isGroup, user.email]);

  useEffect(() => {
    loadMessages();
    const Entity = isGroup ? base44.entities.GroupChatMessage : base44.entities.DirectMessage;
    const unsub = Entity.subscribe(event => {
      const d = event.data;
      if (!d) return;
      if (isGroup ? d.group_id === convId : d.conversation_id === convId) {
        setMessages(prev => {
          if (event.type === "delete") return prev.filter(m => m.id !== event.id);
          const exists = prev.find(m => m.id === (d.id || event.id));
          if (exists) return prev.map(m => m.id === (d.id || event.id) ? { ...m, ...d } : m);
          return [...prev, { ...d, id: d.id || event.id }];
        });
        if (d.receiver_email === user.email && !d.is_read && !isGroup) {
          base44.entities.DirectMessage.update(d.id || event.id, { is_read: true, read_at: new Date().toISOString() }).catch(() => {});
        }
      }
    });
    return () => unsub();
  }, [convId, isGroup, loadMessages, user.email]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (overrides = {}) => {
    const msgText = overrides.text !== undefined ? overrides.text : text;
    if (!msgText && !overrides.audio_url && !overrides.image_url && !overrides.video_url && !overrides.gif_url) return;
    setSending(true);
    const base = {
      sender_email: user.email,
      sender_name: user.full_name,
      sender_avatar: user.avatar_url || "",
      message_type: overrides.message_type || "text",
      text: msgText || undefined,
      ...(replyTo ? { reply_to_id: replyTo.id, reply_to_text: replyTo.text, reply_to_sender: replyTo.sender_name || replyTo.sender_email } : {}),
      ...overrides,
    };
    if (isGroup) {
      await base44.entities.GroupChatMessage.create({ ...base, group_id: convId });
      await base44.entities.GroupChat.update(convId, {
        last_message: msgText || (overrides.message_type === "voice" ? "🎙 Voice" : overrides.message_type === "image" ? "📷 Photo" : "Media"),
        last_message_at: new Date().toISOString(),
        last_sender_name: user.full_name,
      });
    } else {
      await base44.entities.DirectMessage.create({
        ...base,
        conversation_id: convId,
        receiver_email: conversation.otherEmail,
        receiver_name: conversation.otherName,
        receiver_avatar: conversation.otherAvatar || "",
        is_read: false,
        is_request: false,
      });
    }
    setText("");
    setReplyTo(null);
    setSending(false);
  };

  const handleReact = async (msg, emoji) => {
    const reactions = msg.reactions || [];
    const existing = reactions.find(r => r.email === user.email && r.emoji === emoji);
    const updated = existing
      ? reactions.filter(r => !(r.email === user.email && r.emoji === emoji))
      : [...reactions, { email: user.email, emoji }];
    const Entity = isGroup ? base44.entities.GroupChatMessage : base44.entities.DirectMessage;
    await Entity.update(msg.id, { reactions: updated });
  };

  const handleDelete = async (msg) => {
    const Entity = isGroup ? base44.entities.GroupChatMessage : base44.entities.DirectMessage;
    await Entity.update(msg.id, { is_deleted: true, text: "" });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const isVideo = file.type.startsWith("video");
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await sendMessage(isVideo
      ? { message_type: "video", video_url: file_url, text: "" }
      : { message_type: "image", image_url: file_url, text: "" });
  };

  const handleLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      sendMessage({
        message_type: "location",
        location_lat: pos.coords.latitude,
        location_lng: pos.coords.longitude,
        location_name: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
        text: "",
      });
    });
  };

  const title = isGroup ? conversation.name : conversation.otherName;
  const avatar = isGroup ? conversation.photo : conversation.otherAvatar;

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ backgroundColor: "var(--bg-card)", borderBottom: "1px solid var(--border-light)", paddingTop: "max(12px, env(safe-area-inset-top, 12px))" }}>
        <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "var(--bg-subtle)" }}>
          <ArrowLeft className="w-4 h-4" style={{ color: "var(--text-primary)" }} />
        </button>
        <Avatar src={avatar} name={title} size={40} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>{title}</p>
          {isGroup && (
            <p className="text-xs" style={{ color: "var(--text-hint)" }}>
              {conversation.group?.member_emails?.length || 0} members
            </p>
          )}
        </div>
        <button onClick={() => setShowMenu(v => !v)} className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "var(--bg-subtle)" }}>
          <MoreVertical className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
        </button>
      </div>

      {/* Options menu */}
      {showMenu && (
        <div className="absolute top-16 right-4 z-40 rounded-2xl shadow-xl overflow-hidden w-52"
          style={{ backgroundColor: "var(--bg-modal)", border: "1px solid var(--border-light)" }}>
          {[
            { icon: BellOff, label: "Mute Conversation" },
            { icon: Shield, label: "Report" },
            ...(!isGroup ? [{ icon: Ban, label: "Block User", danger: true }] : []),
          ].map(({ icon: Icon, label, danger }) => (
            <button key={label} onClick={() => setShowMenu(false)}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium"
              style={{ color: danger ? "#ef4444" : "var(--text-primary)", borderBottom: "1px solid var(--border-light)" }}>
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5">
        {messages.filter(m => !m.is_deleted || m.is_deleted).map((msg, i) => {
          const isMine = msg.sender_email === user.email;
          const prevMsg = messages[i - 1];
          const showAvatar = !isMine && (isGroup && msg.sender_email !== prevMsg?.sender_email);
          return (
            <div key={msg.id}>
              {isGroup && showAvatar && (
                <p className="text-[10px] ml-10 mb-0.5 mt-2" style={{ color: "var(--text-hint)" }}>{msg.sender_name}</p>
              )}
              <ChatBubble
                msg={msg}
                isMine={isMine}
                showAvatar={showAvatar || (!isMine && isGroup)}
                onReply={setReplyTo}
                onDelete={handleDelete}
                onReact={(emoji) => handleReact(msg, emoji)}
              />
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Reply preview */}
      {replyTo && (
        <div className="mx-4 px-3 py-2 rounded-xl flex items-center gap-2 mb-1"
          style={{ backgroundColor: "var(--accent-primary-light)", borderLeft: "3px solid var(--accent-primary)" }}>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold" style={{ color: "var(--accent-primary)" }}>{replyTo.sender_name}</p>
            <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{replyTo.text}</p>
          </div>
          <button onClick={() => setReplyTo(null)} className="text-xs" style={{ color: "var(--text-hint)" }}>✕</button>
        </div>
      )}

      {/* GIF Picker */}
      {showGif && (
        <GifPicker onSelect={url => { sendMessage({ message_type: "gif", gif_url: url, text: "" }); setShowGif(false); }}
          onClose={() => setShowGif(false)} />
      )}

      {/* Input bar */}
      <div className="flex-shrink-0 px-3 py-2 flex items-end gap-2"
        style={{ backgroundColor: "var(--bg-card)", borderTop: "1px solid var(--border-light)", paddingBottom: "max(8px, env(safe-area-inset-bottom, 8px))" }}>
        {showVoice ? (
          <VoiceRecorder onSend={url => { sendMessage({ message_type: "voice", audio_url: url, text: "" }); setShowVoice(false); }}
            onCancel={() => setShowVoice(false)} />
        ) : (
          <>
            {/* Attach buttons */}
            <div className="flex gap-1 pb-1">
              <button onClick={() => fileRef.current?.click()} className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--bg-subtle)" }}>
                <Image className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
              </button>
              <button onClick={() => setShowGif(v => !v)} className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--bg-subtle)" }}>
                <Smile className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
              </button>
              <button onClick={handleLocation} className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--bg-subtle)" }}>
                <MapPin className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileUpload} />

            {/* Text input */}
            <div className="flex-1 flex items-center rounded-2xl px-3 py-2"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Message…"
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: "var(--text-primary)" }}
              />
            </div>

            {text.trim() ? (
              <button onClick={() => sendMessage()} disabled={sending}
                className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-50"
                style={{ backgroundColor: "var(--accent-primary)" }}>
                <Send className="w-4 h-4 text-white" />
              </button>
            ) : (
              <button onClick={() => setShowVoice(true)} className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "var(--accent-primary)" }}>
                🎙️
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}