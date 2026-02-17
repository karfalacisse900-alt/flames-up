import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send, Heart, ThumbsUp, Users, X } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function LiveRoomView() {
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get("id");
  const [user, setUser] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [floatingReactions, setFloatingReactions] = useState([]);
  const chatEndRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: room } = useQuery({
    queryKey: ["room", roomId],
    queryFn: async () => {
      const rooms = await base44.entities.LiveRoom.filter({ id: roomId });
      return rooms[0];
    },
    enabled: !!roomId,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["liveMessages", roomId],
    queryFn: () => base44.entities.LiveMessage.filter({ room_id: roomId }, "created_date", 100),
    enabled: !!roomId,
    refetchInterval: 2000,
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!messageText.trim()) return;
    await base44.entities.LiveMessage.create({
      room_id: roomId,
      text: messageText.trim(),
      author_email: user?.email || "",
      author_name: user?.full_name || "User",
      type: "message",
    });
    setMessageText("");
    queryClient.invalidateQueries({ queryKey: ["liveMessages", roomId] });
  };

  const sendReaction = (emoji) => {
    const id = Date.now();
    setFloatingReactions((prev) => [...prev, { id, emoji }]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2000);
  };

  const endSession = async () => {
    if (room && user?.email === room.host_email) {
      await base44.entities.LiveRoom.update(roomId, { is_active: false });
      window.location.href = createPageUrl("Live");
    }
  };

  if (!room) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-[#7C8C6E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isHost = user?.email === room.host_email;

  return (
    <div className="min-h-screen flex flex-col" style={{ height: "100dvh" }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between bg-white border-b border-[#EDE9E3]">
        <div className="flex items-center gap-3">
          <Link to={createPageUrl("Live")} className="p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="font-medium text-sm">{room.title}</h2>
            <div className="flex items-center gap-2 text-xs text-[#9B9B9B]">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              <span>Live • {room.host_name}</span>
              <span className="flex items-center gap-0.5"><Users className="w-3 h-3" /> {room.viewer_count || 0}</span>
            </div>
          </div>
        </div>
        {isHost && (
          <Button size="sm" variant="destructive" onClick={endSession} className="h-8 text-xs rounded-lg">
            End
          </Button>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 relative">
        {messages.map((msg) => (
          <div key={msg.id} className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-full bg-[#F5F0EB] flex items-center justify-center text-xs font-medium">
              {msg.author_name?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <span className="text-xs font-medium text-[#7C8C6E]">{msg.author_name}</span>
              <p className="text-sm text-[#2C2C2C] mt-0.5">{msg.text}</p>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />

        {/* Floating reactions */}
        <AnimatePresence>
          {floatingReactions.map((r) => (
            <motion.div
              key={r.id}
              className="absolute bottom-4 right-4 text-2xl pointer-events-none"
              initial={{ opacity: 1, y: 0, scale: 1 }}
              animate={{ opacity: 0, y: -120, scale: 1.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            >
              {r.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Bottom */}
      <div className="border-t border-[#EDE9E3] bg-white p-3">
        <div className="flex items-center gap-2 mb-2">
          {["❤️", "👍", "🔥", "😂", "🤔"].map((emoji) => (
            <button
              key={emoji}
              onClick={() => sendReaction(emoji)}
              className="w-9 h-9 rounded-full bg-[#F5F0EB] hover:bg-[#EDE9E3] flex items-center justify-center text-sm transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Say something..."
            className="border-[#EDE9E3] rounded-xl"
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <Button onClick={sendMessage} size="icon" className="bg-[#7C8C6E] hover:bg-[#6B7B5E] rounded-xl shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}