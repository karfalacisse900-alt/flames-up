import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { MessageSquare } from "lucide-react";

export default function GroupMessageBubble({ groupId }) {
  const [lastMessage, setLastMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLastMessage = () => {
      base44.entities.GroupMessage.filter({ group_id: groupId }, "-created_date", 1)
        .then(msgs => {
          if (msgs.length > 0) {
            setLastMessage(msgs[0]);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    };

    fetchLastMessage();

    // Subscribe to new messages
    const unsub = base44.entities.GroupMessage.subscribe((event) => {
      if (event.data?.group_id === groupId && event.type === "create") {
        setLastMessage(event.data);
      }
    });

    return unsub;
  }, [groupId]);

  if (loading || !lastMessage) {
    return (
      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-2xl"
        style={{ backgroundColor: "rgba(0,0,0,0.08)" }}>
        <MessageSquare className="w-3.5 h-3.5" style={{ color: "rgba(0,0,0,0.4)" }} />
        <span className="text-[10px] font-medium" style={{ color: "rgba(0,0,0,0.4)" }}>No messages</span>
      </div>
    );
  }

  const preview = lastMessage.text || (lastMessage.message_type === "voice" ? "🎤 Voice message" : "📸 Media");
  const truncated = preview.length > 28 ? preview.slice(0, 28) + "…" : preview;

  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-2xl"
      style={{ backgroundColor: "rgba(0,0,0,0.08)" }}>
      <MessageSquare className="w-3.5 h-3.5 shrink-0" style={{ color: "rgba(0,0,0,0.5)" }} />
      <span className="text-[10px] font-medium line-clamp-1" style={{ color: "rgba(0,0,0,0.5)" }}>
        {truncated}
      </span>
    </div>
  );
}