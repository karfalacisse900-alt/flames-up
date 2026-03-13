import React, { useState, useRef } from "react";
import { CornerUpLeft, Copy, Trash2 } from "lucide-react";

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

export default function MessageBubble({ message, isMe, user, onReply, onReact, onDelete }) {
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
    ? "var(--bg-subtle)"
    : isMe
    ? "linear-gradient(135deg, #7C3AED, #DB2777)"
    : "linear-gradient(135deg, #eff6ff, #f5f3ff)";
  const bubbleRadius = isMe
    ? "20px 6px 20px 20px"
    : "6px 20px 20px 20px";

  return (
    <div className={`flex mb-1 ${isMe ? "justify-end" : "justify-start"}`} style={{ paddingLeft: isMe ? 60 : 0, paddingRight: isMe ? 0 : 60 }}>
      <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`} style={{ maxWidth: "100%", position: "relative" }}>

        {/* Reply quote */}
        {message.reply_preview && !isDeleted && (
          <div className="w-full mb-1 px-3 py-2 rounded-2xl text-xs overflow-hidden"
            style={{
              backgroundColor: isMe ? "rgba(255,255,255,0.18)" : "#f3ecff",
              borderLeft: `3px solid ${isMe ? "#F9A8D4" : "#8B5CF6"}`,
              color: isMe ? "rgba(255,255,255,0.88)" : "#5B4B8A",
              maxWidth: 260,
            }}>
            <span style={{ color: isMe ? "#fff" : "#7C3AED", fontWeight: 700 }}>↩ Reply</span>
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
            border: isDeleted ? "1px solid var(--border-light)" : (isMe ? "none" : "1px solid #ede9fe"),
            boxShadow: isDeleted ? "none" : "0 10px 24px rgba(15,23,42,0.08)",
            padding: isOnlyMedia ? 4 : isVoice ? "8px 12px" : "8px 12px 7px",
            cursor: "pointer",
            maxWidth: 280,
            minWidth: isVoice ? 180 : undefined,
          }}>

          {isDeleted ? (
            <p className="text-sm italic px-1" style={{ color: "var(--text-hint)" }}>🚫 This message was deleted</p>

          ) : isVoice ? (
            <audio src={message.audio_url} controls style={{ height: 32, minWidth: 180, maxWidth: 240 }} />

          ) : hasGif ? (
            <img src={message.gif_url} alt="GIF" className="rounded-2xl block" style={{ maxWidth: 220 }} />

          ) : hasMedia ? (
            <div className={message.media_urls.length > 1 ? "grid grid-cols-2 gap-0.5" : ""}>
              {message.media_urls.map((url, i) => (
                <img key={i} src={url} alt="" className="rounded-xl object-cover w-full"
                  style={{ maxHeight: 220, borderRadius: isOnlyMedia ? 14 : undefined }} />
              ))}
            </div>

          ) : isLocation ? (
            <div className="flex items-center gap-2 text-sm py-1" style={{ color: isMe ? "#fff" : "var(--text-primary)" }}>
              <span className="text-lg">📍</span>
              <span>{message.location_data?.name || "Shared location"}</span>
            </div>

          ) : (
            <p style={{ fontSize: 14.5, lineHeight: 1.45, color: isDeleted ? "var(--text-hint)" : isMe ? "#fff" : "var(--text-primary)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {message.text}
            </p>
          )}

          {/* Time + read receipt (inside bubble for text, outside for media) */}
          {!isDeleted && !isOnlyMedia && !hasGif && (
            <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : "justify-end"}`} style={{ minWidth: 50 }}>
              <span style={{ fontSize: 11, color: isMe ? "rgba(255,255,255,0.78)" : "var(--text-hint)", lineHeight: 1 }}>{formatTime(message.created_date)}</span>
              {isMe && (
                <span style={{ fontSize: 11, color: message.is_read ? "#BFDBFE" : "rgba(255,255,255,0.7)", lineHeight: 1, fontWeight: 700 }}>
                  {message.is_read ? "✓✓" : "✓"}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Time outside for media */}
        {!isDeleted && (isOnlyMedia || hasGif) && (
          <div className="flex items-center gap-1 mt-0.5 px-1">
            <span style={{ fontSize: 11, color: "var(--text-hint)" }}>{formatTime(message.created_date)}</span>
            {isMe && (
              <span style={{ fontSize: 11, color: "var(--accent-primary)", fontWeight: 700 }}>
                {message.is_read ? "✓✓" : "✓"}
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
                  backgroundColor: emails.includes(user?.email) ? "#ede9fe" : "#fff",
                  border: `1px solid ${emails.includes(user?.email) ? "#8B5CF6" : "#ddd"}`,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
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
          <div className={`fixed z-50 rounded-2xl shadow-2xl overflow-hidden`}
            style={{
              bottom: "30%",
              [isMe ? "right" : "left"]: 16,
              backgroundColor: "var(--bg-card)",
              minWidth: 200,
              border: "1px solid var(--border-light)",
              boxShadow: "var(--elevation-4)",
            }}>
            {/* Emoji bar */}
            <div className="flex gap-2 px-4 py-3" style={{ borderBottom: "1px solid #F5F5F5" }}>
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
                style={{ color: danger ? "#E53935" : "#333", borderBottom: "1px solid #F5F5F5" }}>
                <Icon className="w-4 h-4 shrink-0" /> {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}