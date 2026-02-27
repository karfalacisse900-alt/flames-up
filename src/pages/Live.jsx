import React, { useState, useEffect, useCallback } from "react";
import { usePullToRefresh } from "../components/hooks/usePullToRefresh";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Radio, Users, ChevronRight, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { getBalance, addCoins } from "../components/coins/coinsHelper";

const categoryEmoji = {
  quotes_talk: "💭",
  study_live: "📚",
  advice: "🤝",
  chill: "☕",
  debate: "⚡",
  creative: "🎨",
};

const categoryLabel = {
  quotes_talk: "Quotes Talk",
  study_live: "Study Live",
  advice: "Advice",
  chill: "Chill",
  debate: "Debate",
  creative: "Creative",
};

export default function Live() {
  const [user, setUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("chill");
  const [entryPrice, setEntryPrice] = useState(0);
  const [creating, setCreating] = useState(false);
  const [enteringRoom, setEnteringRoom] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: rooms = [], isLoading, refetch } = useQuery({
    queryKey: ["liveRooms"],
    queryFn: () => base44.entities.LiveRoom.filter({ is_active: true }, "-created_date"),
    refetchInterval: 5000,
  });

  const handleRefresh = useCallback(async () => { await refetch(); }, [refetch]);
  const { containerRef, PullIndicator, handleTouchStart, handleTouchMove, handleTouchEnd } = usePullToRefresh(handleRefresh);

  const handleCreateRoom = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      const room = await base44.entities.LiveRoom.create({
        title: title.trim(),
        category,
        host_email: user?.email || "",
        host_name: user?.full_name || "Host",
        is_active: true,
        viewer_count: 0,
        viewers: [],
        entry_price: Number(entryPrice) || 0,
        top_supporters: [],
        total_gifts_received: 0,
      });
      setTitle("");
      setEntryPrice(0);
      setShowCreate(false);
      queryClient.invalidateQueries({ queryKey: ["liveRooms"] });
      window.location.href = createPageUrl("LiveRoomView") + `?id=${room.id}`;
    } catch (err) {
      console.error("Create room error:", err);
      alert("Failed to create room. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleEnterRoom = async (room) => {
    if (!room.entry_price || room.entry_price === 0 || user?.email === room.host_email) {
      window.location.href = createPageUrl("LiveRoomView") + `?id=${room.id}`;
      return;
    }
    // Paid room — charge coins
    setEnteringRoom(room.id);
    try {
      const bal = await getBalance(user.email);
      if (bal < room.entry_price) {
        alert(`You need ⬡${room.entry_price} coins to enter this room. You have ⬡${bal}.`);
        return;
      }
      await addCoins(user.email, -room.entry_price, "gift_sent", `Entry fee for "${room.title}"`, room.id);
      await addCoins(room.host_email, room.entry_price, "gift_received", `Entry fee from ${user.full_name || user.email}`, room.id);
      window.location.href = createPageUrl("LiveRoomView") + `?id=${room.id}`;
    } catch (err) {
      console.error("Enter room error:", err);
      alert("Failed to enter room. Please try again.");
    } finally {
      setEnteringRoom(null);
    }
  };

  return (
    <div
      ref={containerRef}
      className="overflow-y-auto overscroll-contain"
      style={{ backgroundColor: "var(--bg-app)", minHeight: "calc(100dvh - 64px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <PullIndicator />
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-light)" }}>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Live</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>Join or start a session</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors bg-[#2E6B4F] text-white"
          style={{}}
        >
          <Radio className="w-4 h-4" /> Go Live
        </button>
      </div>

      {/* Room list */}
      <div className="px-5 space-y-3 mt-4">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🎙️</p>
            <p className="text-lg" style={{ fontFamily: "var(--font-serif)", color: "var(--text-secondary)" }}>No live sessions right now</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-hint)" }}>Be the first to go live!</p>
          </div>
        ) : (
          rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => handleEnterRoom(room)}
              disabled={enteringRoom === room.id}
              className="w-full text-left rounded-2xl p-4 transition-all active:scale-[0.98]"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: "var(--bg-app)" }}>
                  {categoryEmoji[room.category] || "🎙️"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{room.title}</h3>
                    {room.entry_price > 0 && (
                      <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "var(--accent-secondary)", color: "#fff" }}>
                        ⬡{room.entry_price}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs" style={{ color: "var(--text-hint)" }}>{room.host_name}</span>
                    <span className="text-xs flex items-center gap-0.5" style={{ color: "var(--text-hint)" }}>
                      <Users className="w-3 h-3" /> {room.viewer_count || 0}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--bg-app)", color: "var(--text-secondary)" }}>
                      {categoryLabel[room.category]}
                    </span>
                  </div>
                  {room.top_supporters?.length > 0 && (
                    <p className="text-[10px] mt-1 truncate" style={{ color: "var(--accent-secondary)" }}>
                      ★ {room.top_supporters.slice(0, 2).map(s => s.name).join(", ")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                  <ChevronRight className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Create room dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-sm p-0 overflow-hidden rounded-3xl" style={{ border: "none" }}>
          {/* Gradient header */}
          <div className="relative px-5 pt-5 pb-6 overflow-hidden" style={{ background: "linear-gradient(135deg, #E53E3E, #FF6B6B)" }}>
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20" style={{ background: "radial-gradient(circle, white, transparent)" }} />
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: "rgba(255,255,255,0.25)" }}>🎙️</div>
              <div>
                <h2 className="text-lg font-bold text-white">Go Live</h2>
                <p className="text-white/60 text-xs">Start a live session for your community</p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4" style={{ backgroundColor: "#FAFAF8" }}>
            <Input
              placeholder="Give your session a title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-2xl text-sm"
              style={{ backgroundColor: "#F1F5F9", border: "1.5px solid #E2E8F0", color: "#1E293B" }}
            />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="rounded-2xl" style={{ backgroundColor: "#F1F5F9", border: "1.5px solid #E2E8F0", color: "#1E293B" }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: "#FAFAF8", borderColor: "#E2E8F0" }}>
                {Object.entries(categoryLabel).map(([val, label]) => (
                  <SelectItem key={val} value={val} style={{ color: "#1E293B" }}>{categoryEmoji[val]} {label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div>
              <label className="text-xs font-bold mb-1.5 block" style={{ color: "#64748B" }}>Entry Price (coins) — 0 = free</label>
              <Input
                type="number" min={0} placeholder="0"
                value={entryPrice}
                onChange={(e) => setEntryPrice(Math.max(0, parseInt(e.target.value) || 0))}
                className="rounded-2xl text-sm"
                style={{ backgroundColor: "#F1F5F9", border: "1.5px solid #E2E8F0", color: "#1E293B" }}
              />
            </div>
            <button onClick={handleCreateRoom} disabled={!title.trim() || creating}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #E53E3E, #FF6B6B)", boxShadow: "0 4px 20px #E53E3E40" }}>
              {creating ? "Starting…" : "🎙️ Go Live"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}