import React from "react";
import { Heart } from "lucide-react";

export default function LiveStreamChat({ message, currentUser }) {
  const isOwnMessage = currentUser?.email === message.sender_email;
  const isTip = message.type === "tip_notification";

  if (message.type === "join_notification") {
    return (
      <div className="text-center py-1">
        <p className="text-xs" style={{ color: "var(--text-hint)" }}>
          {message.sender_name} joined
        </p>
      </div>
    );
  }

  if (isTip) {
    return (
      <div className="flex justify-center py-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold" style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#ef4444" }}>
          <Heart className="w-3 h-3 fill-current" />
          <span>{message.sender_name} tipped {message.tip_amount} coins!</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-xs px-3 py-1.5 rounded-xl text-xs font-medium leading-tight`}
        style={{
          backgroundColor: isOwnMessage ? "var(--accent-primary)" : "var(--bg-subtle)",
          color: isOwnMessage ? "#fff" : "var(--text-secondary)",
        }}>
        {!isOwnMessage && <p className="font-bold text-[10px]" style={{ color: isOwnMessage ? "#fff" : "var(--accent-primary)", opacity: 0.8, marginBottom: "2px" }}>
          {message.sender_name}
        </p>}
        <p style={{ wordBreak: "break-word" }}>{message.message}</p>
      </div>
    </div>
  );
}