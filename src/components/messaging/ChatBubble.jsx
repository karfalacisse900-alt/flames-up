import React, { useState } from "react";
import { MoreHorizontal, Reply, Copy, Trash2, Forward, Play } from "lucide-react";
import { format } from "date-fns";

const EMOJIS = ["❤️", "😂", "😮", "😢", "😡", "👍"];

function Avatar({ src, name, size = 32 }) {
  const initials = name ? name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "?";
  return src ? (
    <img src={src} alt={name} className="rounded-full object-cover flex-shrink-0" style={{ width: size, height: size }} />
  ) : (
    <div className="rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white text-xs"
      style={{ width: size, height: size, background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))" }}>
      {initials}
    </div>
  );
}

export default function ChatBubble({ msg, isMine, onReply, onDelete, onReact, showAvatar = false }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  if (msg.is_deleted) {
    return (
      <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-1`}>
        <span className="text-xs italic px-3 py-1.5 rounded-2xl" style={{ color: "var(--text-hint)", backgroundColor: "var(--bg-subtle)" }}>
          Message deleted
        </span>
      </div>
    );
  }

  const bubbleStyle = isMine ? {
    background: "linear-gradient(135deg, var(--accent-primary), #1a5c3a)",
    color: "#fff",
    borderRadius: "18px 18px 4px 18px",
  } : {
    backgroundColor: "var(--bg-card)",
    color: "var(--text-primary)",
    border: "1px solid var(--border-light)",
    borderRadius: "18px 18px 18px 4px",
  };

  const reactions = (msg.reactions || []).reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className={`flex items-end gap-2 mb-1 group ${isMine ? "flex-row-reverse" : "flex-row"}`}>
      {!isMine && showAvatar && <Avatar src={msg.sender_avatar} name={msg.sender_name} size={28} />}
      {!isMine && !showAvatar && <div style={{ width: 28 }} />}

      <div className={`flex flex-col ${isMine ? "items-end" : "items-start"} max-w-[75%]`}>
        {/* Reply preview */}
        {msg.reply_to_id && (
          <div className="mb-1 px-3 py-1.5 rounded-xl text-xs max-w-full"
            style={{ backgroundColor: "var(--bg-subtle)", borderLeft: "3px solid var(--accent-primary)", color: "var(--text-secondary)" }}>
            <span className="font-semibold block">{msg.reply_to_sender}</span>
            <span className="truncate block max-w-[200px]">{msg.reply_to_text}</span>
          </div>
        )}

        {/* Bubble */}
        <div
          className="relative px-3.5 py-2.5 cursor-pointer select-none"
          style={bubbleStyle}
          onContextMenu={e => { e.preventDefault(); setShowMenu(true); }}
          onClick={() => setShowMenu(false)}
          onDoubleClick={() => setShowEmojiPicker(true)}
        >
          {/* Content */}
          {msg.message_type === "image" && msg.image_url && (
            <img src={msg.image_url} alt="" className="rounded-xl max-w-full" style={{ maxHeight: 240 }} />
          )}
          {msg.message_type === "video" && msg.video_url && (
            <video src={msg.video_url} controls className="rounded-xl max-w-full" style={{ maxHeight: 240 }} />
          )}
          {msg.message_type === "gif" && msg.gif_url && (
            <img src={msg.gif_url} alt="GIF" className="rounded-xl max-w-full" style={{ maxHeight: 200 }} />
          )}
          {msg.message_type === "voice" && msg.audio_url && (
            <div className="flex items-center gap-2 min-w-[180px]">
              <button className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: isMine ? "rgba(255,255,255,0.2)" : "var(--accent-primary-light)" }}>
                <Play className="w-3.5 h-3.5" style={{ color: isMine ? "#fff" : "var(--accent-primary)" }} />
              </button>
              <audio src={msg.audio_url} controls className="h-7" style={{ maxWidth: 160 }} />
            </div>
          )}
          {msg.message_type === "location" && (
            <div className="flex items-center gap-1.5 text-sm">
              <span>📍</span>
              <span>{msg.location_name || `${msg.location_lat?.toFixed(4)}, ${msg.location_lng?.toFixed(4)}`}</span>
            </div>
          )}
          {msg.text && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
          )}
          <div className={`flex items-center gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
            <span className="text-[10px]" style={{ color: isMine ? "rgba(255,255,255,0.6)" : "var(--text-hint)" }}>
              {format(new Date(msg.created_date || Date.now()), "h:mm a")}
            </span>
            {isMine && (
              <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.6)" }}>
                {msg.is_read ? "✓✓" : "✓"}
              </span>
            )}
          </div>
        </div>

        {/* Reactions */}
        {Object.keys(reactions).length > 0 && (
          <div className="flex gap-1 mt-1">
            {Object.entries(reactions).map(([emoji, count]) => (
              <span key={emoji} onClick={() => onReact && onReact(emoji)}
                className="text-xs px-2 py-0.5 rounded-full cursor-pointer"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                {emoji} {count > 1 ? count : ""}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Quick react on hover */}
      <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center ${isMine ? "flex-row-reverse" : ""}`}>
        <button onClick={() => setShowEmojiPicker(v => !v)}
          className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
          style={{ backgroundColor: "var(--bg-subtle)" }}>
          😊
        </button>
      </div>

      {/* Context menu */}
      {showMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={() => setShowMenu(false)}>
          <div className="rounded-2xl shadow-xl overflow-hidden w-56"
            style={{ backgroundColor: "var(--bg-modal)" }}
            onClick={e => e.stopPropagation()}>
            {[
              { icon: Reply, label: "Reply", action: () => { onReply && onReply(msg); setShowMenu(false); } },
              { icon: Copy, label: "Copy", action: () => { navigator.clipboard.writeText(msg.text || ""); setShowMenu(false); } },
              ...(isMine ? [{ icon: Trash2, label: "Delete", action: () => { onDelete && onDelete(msg); setShowMenu(false); }, danger: true }] : []),
            ].map(({ icon: Icon, label, action, danger }) => (
              <button key={label} onClick={action}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors"
                style={{ color: danger ? "#ef4444" : "var(--text-primary)", borderBottom: "1px solid var(--border-light)" }}>
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
            {/* Emoji bar */}
            <div className="flex justify-around px-3 py-2">
              {EMOJIS.map(e => (
                <button key={e} onClick={() => { onReact && onReact(e); setShowMenu(false); }}
                  className="text-xl hover:scale-125 transition-transform">{e}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 pb-8"
          onClick={() => setShowEmojiPicker(false)}>
          <div className="flex gap-3 p-4 rounded-3xl shadow-xl"
            style={{ backgroundColor: "var(--bg-modal)" }}
            onClick={e => e.stopPropagation()}>
            {EMOJIS.map(e => (
              <button key={e} onClick={() => { onReact && onReact(e); setShowEmojiPicker(false); }}
                className="text-3xl hover:scale-125 transition-transform">{e}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}