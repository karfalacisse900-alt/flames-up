import React, { useState, useRef } from "react";
import { CornerUpLeft, Copy, Trash2, Check } from "lucide-react";

const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "👍", "🔥", "🎉"];

function useLongPress(callback, ms = 500) {
  const timer = useRef(null);
  const start = (e) => { e.preventDefault(); timer.current = setTimeout(callback, ms); };
  const stop = () => clearTimeout(timer.current);
  return { onMouseDown: start, onMouseUp: stop, onMouseLeave: stop, onTouchStart: start, onTouchEnd: stop };
}

function formatTime(date) {
  try { return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}

const COLORS = ["#C026D3", "#7C3AED", "#2563EB", "#059669", "#D97706"];
const avatarColor = (str) => COLORS[(str || "a").charCodeAt(0) % COLORS.length];
const getInitials = (name) => (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

export default function MessageBubble({ message, isMe, user, onReply, onReact, onDelete, partnerAvatar, partnerName }) {
  const [showMenu, setShowMenu] = useState(false);
  const longPress = useLongPress(() => setShowMenu(true));

  const reactions = message.reactions || {};
  const reactionEntries = Object.entries(reactions).filter(([, emails]) => emails?.length > 0);

  const isDeleted = message.is_deleted;
  const isVoice = !!message.audio_url || message.message_type === "voice";
  const hasGif = !!message.gif_url;
  const hasMedia = message.media_urls?.length > 0;
  const isLocation = message.message_type === "location";
  const isOnlyMedia = !message.text && (hasMedia || hasGif);

  const handleReact = (emoji) => { onReact?.(message.id, emoji); setShowMenu(false); };

  const bubbleBg = isDeleted
    ? "#f1f5f9"
    : isMe
    ? "linear-gradient(135deg, #C026D3, #9333EA)"
    : "#FFFFFF";

  const bubbleShadow = isDeleted ? "none" : isMe
    ? "0 4px 16px rgba(192,38,211,0.25)"
    : "0 2px 8px rgba(0,0,0,0.07)";

  const bubbleRadius = isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px";

  return (
    <div className={`flex items-end gap-2 mb-2 ${isMe ? "justify-end" : "justify-start"}`}
      style={{ paddingLeft: isMe ? 52 : 0, paddingRight: isMe ? 0 : 52 }}>

      {/* Left avatar for received */}
      {!isMe && (
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 self-end mb-5 text-xs font-bold text-white overflow-hidden"
          style={{ background: partnerAvatar ? "transparent" : `linear-gradient(135deg, ${avatarColor(message.sender_email)}, #9333EA)`, minWidth: 32 }}>
          {partnerAvatar
            ? <img src={partnerAvatar} alt="" className="w-full h-full object-cover" />
            : getInitials(partnerName || message.sender_name || message.sender_email)}
        </div>
      )}

      <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`} style={{ maxWidth: "72%", position: "relative" }}>

        {/* Reply quote */}
        {message.reply_preview && !isDeleted && (
          <div className="w-full mb-1 px-3 py-2 rounded-2xl text-xs overflow-hidden"
            style={{
              backgroundColor: isMe ? "rgba(255,255,255,0.18)" : "#fdf4ff",
              borderLeft: `3px solid ${isMe ? "#F9A8D4" : "#C026D3"}`,
              color: isMe ? "rgba(255,255,255,0.88)" : "#7e22ce",
              maxWidth: 260,
            }}>
            <span style={{ color: isMe ? "#fff" : "#C026D3", fontWeight: 700 }}>↩ Reply</span>
            <p className="truncate mt-0.5">{message.reply_preview}</p>
          </div>
        )}

        {/* Main bubble */}
        <div
          {...longPress}
          className="select-none relative"
          style={{
            background: bubbleBg,
            borderRadius: bubbleRadius,
            border: isMe ? "none" : (isDeleted ? "1px solid #e2e8f0" : "1px solid #f1f5f9"),
            boxShadow: bubbleShadow,
            padding: isOnlyMedia ? 4 : isVoice ? "10px 14px" : "10px 14px 8px",
            cursor: "pointer",
            minWidth: isVoice ? 180 : undefined,
          }}>

          {isDeleted ? (
            <p className="text-sm italic px-1" style={{ color: "#94A3B8" }}>🚫 This message was deleted</p>

          ) : isVoice ? (
            <audio src={message.audio_url} controls style={{ height: 32, minWidth: 180, maxWidth: 240 }} />

          ) : hasGif ? (
            <img src={message.gif_url} alt="GIF" className="rounded-2xl block" style={{ maxWidth: 220 }} />

          ) : hasMedia ? (
            <div className={message.media_urls.length > 1 ? "grid grid-cols-2 gap-0.5" : ""}>
              {message.media_urls.map((url, i) => (
                <img key={i} src={url} alt="" className="rounded-xl object-cover w-full"
                  style={{ maxHeight: 220 }} />
              ))}
            </div>

          ) : isLocation ? (
            <div className="flex items-center gap-2 text-sm py-1" style={{ color: isMe ? "#fff" : "#1e293b" }}>
              <span className="text-lg">📍</span>
              <span>{message.location_data?.name || "Shared location"}</span>
            </div>

          ) : (
            <p style={{ fontSize: 14.5, lineHeight: 1.5, color: isDeleted ? "#94A3B8" : isMe ? "#fff" : "#1e293b", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {message.text}
            </p>
          )}
        </div>

        {/* Timestamp + read receipt outside bubble */}
        {!isDeleted && (
          <div className={`flex items-center gap-1 mt-1 px-1 ${isMe ? "justify-end" : "justify-start"}`}>
            <span style={{ fontSize: 11, color: "#94A3B8" }}>{formatTime(message.created_date)}</span>
            {isMe && (
              <span className="flex items-center" style={{ color: message.is_read ? "#3B82F6" : "#94A3B8" }}>
                <Check className="w-3 h-3" strokeWidth={3} />
                {message.is_read && <Check className="w-3 h-3 -ml-1.5" strokeWidth={3} />}
              </span>
            )}
          </div>
        )}

        {/* Reactions */}
        {reactionEntries.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {reactionEntries.map(([emoji, emails]) => (
              <button key={emoji} onClick={() => handleReact(emoji)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px]"
                style={{
                  backgroundColor: emails.includes(user?.email) ? "#fdf4ff" : "#fff",
                  border: `1px solid ${emails.includes(user?.email) ? "#C026D3" : "#e2e8f0"}`,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                }}>
                {emoji} <span style={{ color: "#555" }}>{emails.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Context menu */}
      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="fixed z-50 rounded-2xl shadow-2xl overflow-hidden"
            style={{
              bottom: "30%",
              [isMe ? "right" : "left"]: 16,
              backgroundColor: "#fff",
              minWidth: 200,
              border: "1px solid #f1f5f9",
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            }}>
            {/* Emoji bar */}
            <div className="flex gap-2 px-4 py-3" style={{ borderBottom: "1px solid #f8fafc" }}>
              {REACTION_EMOJIS.map(e => (
                <button key={e} onClick={() => handleReact(e)} className="text-2xl" style={{ lineHeight: 1 }}>{e}</button>
              ))}
            </div>
            {[
              { icon: CornerUpLeft, label: "Reply", action: () => { onReply?.(message); setShowMenu(false); } },
              { icon: Copy, label: "Copy text", action: () => { navigator.clipboard?.writeText(message.text || ""); setShowMenu(false); }, hide: !message.text },
              { icon: Trash2, label: "Delete message", action: () => { onDelete?.(message.id); setShowMenu(false); }, hide: !isMe, danger: true },
            ].filter(a => !a.hide).map(({ icon: Icon, label, action, danger }) => (
              <button key={label} onClick={action}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-[14px]"
                style={{ color: danger ? "#E53935" : "#333", borderBottom: "1px solid #f8fafc" }}>
                <Icon className="w-4 h-4 shrink-0" /> {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}