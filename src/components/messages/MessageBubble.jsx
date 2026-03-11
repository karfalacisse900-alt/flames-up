import React, { useState, useRef } from "react";
import { CornerUpLeft, Copy, Trash2 } from "lucide-react";

const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "😡", "👍", "🔥"];

function useLongPress(callback, ms = 550) {
  const timer = useRef(null);
  const start = (e) => {
    e.preventDefault();
    timer.current = setTimeout(callback, ms);
  };
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

  const handleReact = (emoji) => {
    onReact?.(message.id, emoji);
    setShowMenu(false);
  };

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} relative mb-2`} style={{ alignItems: "flex-end", gap: 6 }}>
      {/* Avatar for received messages */}
      {!isMe && (
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mb-1"
          style={{ backgroundColor: "#4A6B9F", color: "#fff" }}>
          {(message.sender_name || "?")[0]?.toUpperCase()}
        </div>
      )}

      <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`} style={{ maxWidth: "72%" }}>

        {/* Reply quote */}
        {message.reply_preview && !isDeleted && (
          <div className="px-3 py-1.5 rounded-xl text-xs mb-1 max-w-full overflow-hidden"
            style={{
              backgroundColor: isMe ? "rgba(255,255,255,0.2)" : "var(--bg-subtle)",
              borderLeft: "3px solid",
              borderLeftColor: isMe ? "rgba(255,255,255,0.6)" : "var(--accent-primary)",
              color: isMe ? "rgba(255,255,255,0.85)" : "var(--text-secondary)",
              whiteSpace: "nowrap", textOverflow: "ellipsis"
            }}>
            ↩ {message.reply_preview}
          </div>
        )}

        {/* Bubble */}
        <div {...longPress}
          className="select-none"
          style={{
            backgroundColor: isDeleted
              ? "transparent"
              : isMe ? "var(--accent-primary)" : "#fff",
            color: isDeleted ? "var(--text-hint)" : isMe ? "#fff" : "var(--text-primary)",
            border: isDeleted
              ? "1px dashed var(--border-medium)"
              : isMe ? "none" : "1px solid var(--border-light)",
            borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
            padding: isVoice && !isDeleted ? "10px 14px" : hasMedia || hasGif ? "6px" : "10px 14px 8px",
            cursor: "pointer",
            boxShadow: isMe ? "none" : "0 1px 3px rgba(0,0,0,0.08)",
          }}>
          {isDeleted ? (
            <p className="text-xs italic" style={{ color: "var(--text-hint)" }}>🚫 This message was deleted</p>
          ) : isVoice ? (
            <audio src={message.audio_url} controls className="h-8"
              style={{ minWidth: 180, maxWidth: 220, filter: isMe ? "invert(1) hue-rotate(180deg)" : "none" }} />
          ) : hasGif ? (
            <img src={message.gif_url} alt="GIF" className="rounded-2xl block" style={{ maxWidth: 220 }} />
          ) : hasMedia ? (
            <div className="grid gap-1" style={{ gridTemplateColumns: message.media_urls.length > 1 ? "1fr 1fr" : "1fr" }}>
              {message.media_urls.map((url, i) => (
                <img key={i} src={url} alt="" className="rounded-2xl w-full object-cover" style={{ maxHeight: 200 }} />
              ))}
            </div>
          ) : isLocation ? (
            <div className="flex items-center gap-2 text-sm">
              <span>📍</span><span>{message.location_data?.name || "Shared location"}</span>
            </div>
          ) : (
            <div>
              <p className="text-[14.5px] leading-snug" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "var(--font-sans)" }}>
                {message.text}
              </p>
              {/* Time inline for text messages */}
              <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : "justify-end"}`}>
                <span style={{ fontSize: 11, color: isMe ? "rgba(255,255,255,0.65)" : "var(--text-hint)", lineHeight: 1 }}>
                  {formatTime(message.created_date)}
                </span>
                {isMe && !isDeleted && (
                  <span style={{ fontSize: 11, color: message.is_read ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.55)", lineHeight: 1 }}>
                    {message.is_read ? "✓✓" : "✓"}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Time for non-text messages */}
        {(isVoice || hasGif || hasMedia || isLocation || isDeleted) && (
          <div className={`flex items-center gap-1 mt-0.5 ${isMe ? "justify-end" : "justify-start"}`}>
            <span className="text-[11px]" style={{ color: "var(--text-hint)" }}>{formatTime(message.created_date)}</span>
            {isMe && !isDeleted && (
              <span className="text-[11px]" style={{ color: message.is_read ? "var(--accent-primary)" : "var(--text-hint)" }}>
                {message.is_read ? "✓✓" : "✓"}
              </span>
            )}
          </div>
        )}

        {/* Reactions */}
        {reactionEntries.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
            {reactionEntries.map(([emoji, emails]) => (
              <button key={emoji} onClick={() => handleReact(emoji)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                style={{
                  backgroundColor: emails.includes(user?.email) ? "var(--accent-primary-light)" : "var(--bg-card)",
                  border: `1px solid ${emails.includes(user?.email) ? "var(--accent-primary)" : "var(--border-light)"}`,
                }}>
                {emoji} <span style={{ color: "var(--text-secondary)" }}>{emails.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Context menu */}
      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className={`absolute z-50 rounded-2xl shadow-xl border overflow-hidden ${isMe ? "right-0" : "left-0"}`}
            style={{ bottom: "calc(100% + 8px)", backgroundColor: "var(--bg-modal)", borderColor: "var(--border-light)", minWidth: 190 }}>
            {/* Emoji row */}
            <div className="flex gap-2 px-3 py-2 border-b" style={{ borderColor: "var(--border-light)" }}>
              {REACTION_EMOJIS.map(e => (
                <button key={e} onClick={() => handleReact(e)} className="text-xl hover:scale-125 transition-transform">{e}</button>
              ))}
            </div>
            {/* Actions */}
            {[
              { icon: CornerUpLeft, label: "Reply", action: () => { onReply?.(message); setShowMenu(false); } },
              { icon: Copy, label: "Copy", action: () => { navigator.clipboard?.writeText(message.text || ""); setShowMenu(false); }, hide: !message.text },
              { icon: Trash2, label: "Delete", action: () => { onDelete?.(message.id); setShowMenu(false); }, hide: !isMe, danger: true },
            ].filter(a => !a.hide).map(({ icon: Icon, label, action, danger }) => (
              <button key={label} onClick={action} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm"
                style={{ color: danger ? "#E05C7A" : "var(--text-primary)" }}>
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}