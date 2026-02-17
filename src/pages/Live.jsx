import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Radio, Plus, Users, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

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
  const [creating, setCreating] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ["liveRooms"],
    queryFn: () => base44.entities.LiveRoom.filter({ is_active: true }, "-created_date"),
    refetchInterval: 5000,
  });

  const handleCreateRoom = async () => {
    if (!title.trim()) return;
    setCreating(true);
    const room = await base44.entities.LiveRoom.create({
      title: title.trim(),
      category,
      host_email: user?.email || "",
      host_name: user?.full_name || "Host",
      is_active: true,
      viewer_count: 0,
      viewers: [],
    });
    setTitle("");
    setShowCreate(false);
    setCreating(false);
    queryClient.invalidateQueries({ queryKey: ["liveRooms"] });
    window.location.href = createPageUrl("LiveRoomView") + `?id=${room.id}`;
  };

  return (
    <div className="min-h-screen">
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>Live</h1>
          <p className="text-xs text-[#9B9B9B] mt-0.5">Join or start a live session</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#7C8C6E] text-white text-sm shadow-md hover:bg-[#6B7B5E] transition-colors"
        >
          <Radio className="w-4 h-4" /> Go Live
        </button>
      </div>

      <div className="px-5 space-y-3 pb-24 mt-2">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#7C8C6E] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🎙️</p>
            <p className="font-serif text-lg text-[#6B6B6B]" style={{ fontFamily: "var(--font-serif)" }}>No live sessions right now</p>
            <p className="text-sm text-[#9B9B9B] mt-1">Be the first to go live!</p>
          </div>
        ) : (
          rooms.map((room) => (
            <Link
              key={room.id}
              to={createPageUrl("LiveRoomView") + `?id=${room.id}`}
              className="block bg-white rounded-2xl p-4 border border-[#EDE9E3] hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#F5F0EB] flex items-center justify-center text-xl">
                  {categoryEmoji[room.category] || "🎙️"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-[#2C2C2C] truncate">{room.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-[#9B9B9B]">{room.host_name}</span>
                    <span className="text-xs text-[#9B9B9B] flex items-center gap-0.5">
                      <Users className="w-3 h-3" /> {room.viewer_count || 0}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5F0EB] text-[#6B6B6B]">
                      {categoryLabel[room.category]}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                  <ChevronRight className="w-4 h-4 text-[#9B9B9B]" />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-serif)" }}>Start Live Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Session title" value={title} onChange={(e) => setTitle(e.target.value)} className="border-[#EDE9E3] rounded-xl" />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="border-[#EDE9E3] rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(categoryLabel).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{categoryEmoji[val]} {label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleCreateRoom} disabled={!title.trim() || creating} className="w-full bg-[#7C8C6E] hover:bg-[#6B7B5E] rounded-xl">
              {creating ? "Starting..." : "Go Live"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}