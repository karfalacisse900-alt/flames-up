import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send, Users } from "lucide-react";
import { addCoins, getBalance } from "../components/coins/coinsHelper";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import TopSupportersTicker from "../components/live/TopSupportersTicker";
import GiftPanel from "../components/live/GiftPanel";
import HostModerationPanel from "../components/live/HostModerationPanel";
import ChatMessage from "../components/live/ChatMessage";

export default function LiveRoomView() {
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get("id");
  const [user, setUser] = useState(null);
  const [userBalance, setUserBalance] = useState(0);
  const [messageText, setMessageText] = useState("");
  const [floatingGifts, setFloatingGifts] = useState([]);
  const chatEndRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      if (u?.email) {
        const bal = await getBalance(u.email);
        setUserBalance(bal);
      }
    }).catch(() => {});
  }, []);

  const { data: room, refetch: refetchRoom } = useQuery({
    queryKey: ["room", roomId],
    queryFn: async () => {
      const rooms = await base44.entities.LiveRoom.filter({ id: roomId });
      return rooms[0];
    },
    enabled: !!roomId,
    refetchInterval: 8000,
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
    const text = messageText.trim();
    if (!text) return;

    // Check if user is muted or banned
    const muted = room?.muted_users || [];
    const banned = room?.banned_users || [];
    if (banned.includes(user?.email)) {
      alert("You have been banned from this room.");
      return;
    }
    if (muted.includes(user?.email)) {
      alert("You are muted in this room.");
      return;
    }

    // Keyword filter check
    const filters = room?.keyword_filters || [];
    const lowerText = text.toLowerCase();
    const blocked = filters.some((kw) => lowerText.includes(kw));
    if (blocked) {
      alert("Your message contains blocked content.");
      return;
    }

    await base44.entities.LiveMessage.create({
      room_id: roomId,
      text,
      author_email: user?.email || "",
      author_name: user?.full_name || "User",
      type: "message",
    });
    setMessageText("");
    queryClient.invalidateQueries({ queryKey: ["liveMessages", roomId] });
  };

  const spawnFloatingGift = (emoji) => {
    const id = Date.now() + Math.random();
    const x = 20 + Math.random() * 60; // percent from left
    setFloatingGifts((prev) => [...prev, { id, emoji, x }]);
    setTimeout(() => {
      setFloatingGifts((prev) => prev.filter((r) => r.id !== id));
    }, 2200);
  };

  const handleSendGift = async (emoji, cost, label) => {
    if (!user?.email) return;
    const bal = await getBalance(user.email);
    if (bal < cost) {
      alert(`You need ⬡${cost} coins to send ${label}. You have ⬡${bal}.`);
      return;
    }

    // Deduct from sender
    await addCoins(user.email, -cost, "gift_sent", `Sent ${label} ${emoji} in live room`, roomId);

    // Award to host
    if (room?.host_email && room.host_email !== user.email) {
      await addCoins(room.host_email, cost, "gift_received", `${label} ${emoji} gift from ${user.full_name || user.email}`, roomId);
    }

    // Update top supporters on the room
    const existingSupports = room?.top_supporters || [];
    const idx = existingSupports.findIndex((s) => s.email === user.email);
    let updated;
    if (idx >= 0) {
      updated = existingSupports.map((s, i) => i === idx ? { ...s, total_coins: (s.total_coins || 0) + cost } : s);
    } else {
      updated = [...existingSupports, { email: user.email, name: user.full_name || user.email, total_coins: cost }];
    }
    updated.sort((a, b) => (b.total_coins || 0) - (a.total_coins || 0));
    const top5 = updated.slice(0, 5);

    await base44.entities.LiveRoom.update(roomId, {
      top_supporters: top5,
      total_gifts_received: (room?.total_gifts_received || 0) + cost,
    });

    // Post gift message in chat
    await base44.entities.LiveMessage.create({
      room_id: roomId,
      text: `${emoji} ${user.full_name || "Someone"} sent a ${label}! (⬡${cost})`,
      author_email: user?.email || "",
      author_name: user?.full_name || "User",
      type: "reaction",
    });

    setUserBalance((prev) => prev - cost);
    spawnFloatingGift(emoji);
    queryClient.invalidateQueries({ queryKey: ["liveMessages", roomId] });
    refetchRoom();
  };

  const handleReaction = (emoji) => spawnFloatingGift(emoji);

  const endSession = async () => {
    if (room && user?.email === room.host_email) {
      await base44.entities.LiveRoom.update(roomId, { is_active: false });
      window.location.href = createPageUrl("Live");
    }
  };

  if (!room) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  const isHost = user?.email === room.host_email;

  return (
    <div className="flex flex-col" style={{ height: "100dvh", backgroundColor: "var(--bg-app)" }}>

      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between shrink-0"
        style={{ backgroundColor: "var(--bg-card)", borderBottom: "1px solid var(--border-light)" }}
      >
        <div className="flex items-center gap-3">
          <Link to={createPageUrl("Live")} className="p-2 rounded-full transition-colors" style={{ backgroundColor: "var(--bg-app)" }}>
            <ArrowLeft className="w-4 h-4" style={{ color: "var(--text-primary)" }} />
          </Link>
          <div className="min-w-0">
            <h2 className="font-medium text-sm truncate" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{room.title}</h2>
            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-hint)" }}>
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              <span>Live · {room.host_name}</span>
              <span className="flex items-center gap-0.5"><Users className="w-3 h-3" /> {room.viewer_count || 0}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isHost && (
            <HostModerationPanel room={room} onRoomUpdated={refetchRoom} />
          )}
          {isHost && (
            <button
              onClick={endSession}
              className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors text-white"
              style={{ backgroundColor: "#C0392B" }}
            >
              End
            </button>
          )}
        </div>
      </div>

      {/* Top Supporters + entry price bar */}
      <div
        className="px-4 py-2 flex items-center justify-between shrink-0"
        style={{ backgroundColor: "var(--bg-app)", borderBottom: "1px solid var(--border-subtle)" }}
      >
        <TopSupportersTicker supporters={room.top_supporters || []} />
        <div className="flex items-center gap-2">
          {room.entry_price > 0 && (
            <span className="text-[10px] px-2 py-1 rounded-full font-medium" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--accent-secondary)", border: "1px solid var(--border-light)" }}>
              ⬡{room.entry_price} entry
            </span>
          )}
          {room.total_gifts_received > 0 && (
            <span className="text-[10px] px-2 py-1 rounded-full" style={{ color: "var(--text-hint)" }}>
              🎁 ⬡{room.total_gifts_received}
            </span>
          )}
          <span className="text-[10px]" style={{ color: "var(--text-hint)" }}>You: ⬡{userBalance}</span>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 relative">
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            msg={msg}
            isHost={isHost}
            currentUser={user}
            room={room}
            onRoomUpdated={refetchRoom}
          />
        ))}
        <div ref={chatEndRef} />

        {/* Floating gift animations */}
        <AnimatePresence>
          {floatingGifts.map((r) => (
            <motion.div
              key={r.id}
              className="absolute text-3xl pointer-events-none"
              style={{ left: `${r.x}%`, bottom: "16px" }}
              initial={{ opacity: 1, y: 0, scale: 1 }}
              animate={{ opacity: 0, y: -160, scale: 2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, ease: "easeOut" }}
            >
              {r.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Bottom panel */}
      <div
        className="shrink-0 px-4 pb-4 pt-3 space-y-3"
        style={{ backgroundColor: "var(--bg-card)", borderTop: "1px solid var(--border-light)" }}
      >
        <GiftPanel onSendGift={handleSendGift} onReaction={handleReaction} userBalance={userBalance} />

        <div className="flex gap-2">
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Say something..."
            className="rounded-xl flex-1"
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <Button onClick={sendMessage} size="icon" className="rounded-xl shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}