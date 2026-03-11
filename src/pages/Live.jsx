import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Heart, Users, Send, Globe, MapPin, Radio, Eye } from "lucide-react";
import LiveStreamChat from "../components/live/LiveStreamChat.jsx";
import TipNotification from "../components/live/TipNotification.jsx";

const LOCATION_TABS = [
  { id: "global", label: "Global", icon: Globe },
  { id: "nearby", label: "Nearby", icon: MapPin },
];

const categoryEmoji = {
  music: "🎵",
  gaming: "🎮",
  creative: "🎨",
  educational: "📚",
  just_chatting: "💬",
  business: "💼",
};

export default function Live() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentStream, setCurrentStream] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState("global");
  const qc = useQueryClient();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => navigate(createPageUrl("Home")));
  }, []);

  const { data: allLiveStreams = [] } = useQuery({
    queryKey: ["liveStreams"],
    queryFn: () => base44.entities.LiveStream.filter({ is_active: true }, "-created_date", 20),
    refetchInterval: 15000,
  });

  const liveStreams = allLiveStreams.filter((stream) => {
    if (activeTab === "nearby") return stream.host_city === user?.location_city;
    return true;
  });

  const { data: streamMessages = [] } = useQuery({
    queryKey: ["streamMessages", currentStream?.id],
    queryFn: () =>
      currentStream
        ? base44.entities.LiveStreamChat.filter({ stream_id: currentStream.id }, "created_date", 100)
        : [],
    enabled: !!currentStream?.id,
    refetchInterval: 2000,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [streamMessages]);

  useEffect(() => {
    setMessages(streamMessages);
  }, [streamMessages]);

  useEffect(() => {
    if (!currentStream) return;
    const unsubscribe = base44.entities.LiveStreamChat.subscribe((event) => {
      if (event.data?.stream_id === currentStream.id) {
        qc.invalidateQueries({ queryKey: ["streamMessages", currentStream.id] });
      }
    });
    return unsubscribe;
  }, [currentStream, qc]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !user || !currentStream) return;
    await base44.entities.LiveStreamChat.create({
      stream_id: currentStream.id,
      sender_email: user.email,
      sender_name: user.display_name || user.full_name || "User",
      message: chatInput,
      type: "message",
    });
    setChatInput("");
    qc.invalidateQueries({ queryKey: ["streamMessages", currentStream.id] });
  };

  const handleTip = async (amount) => {
    if (!user || !currentStream) return;
    await base44.entities.LiveStreamChat.create({
      stream_id: currentStream.id,
      sender_email: user.email,
      sender_name: user.display_name || user.full_name || "User",
      message: `Tipped ${amount} coins!`,
      type: "tip_notification",
      tip_amount: amount,
    });
    const notifId = Date.now();
    setNotifications((prev) => [...prev, { id: notifId, sender: user.display_name || user.full_name || "User", amount }]);
    setTimeout(() => setNotifications((prev) => prev.filter((n) => n.id !== notifId)), 5000);
    qc.invalidateQueries({ queryKey: ["streamMessages", currentStream.id] });
    qc.invalidateQueries({ queryKey: ["liveStreams"] });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)" }} />
      </div>
    );
  }

  // ── Stream Viewer ───────────────────────────────────────────────────────────
  if (currentStream) {
    return (
      <div className="flex flex-col h-screen" style={{ backgroundColor: "#0a0a0a" }}>
        {/* Stream Video Area */}
        <div className="relative flex-shrink-0" style={{ height: "42vh", backgroundColor: "#000" }}>
          {currentStream.stream_thumbnail ? (
            <img src={currentStream.stream_thumbnail} alt="stream" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)" }}>
              <div className="text-center">
                <div className="text-5xl mb-2">{categoryEmoji[currentStream.category] || "📺"}</div>
              </div>
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 40%, rgba(0,0,0,0.7) 100%)" }} />

          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4">
            <button onClick={() => setCurrentStream(null)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}>
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: "#E05C2A" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" /> LIVE
              </span>
            </div>
          </div>

          {/* Bottom stream info */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
            <h2 className="font-bold text-white text-base leading-tight">{currentStream.title}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-white/70 font-medium">{currentStream.host_name}</span>
              <span className="flex items-center gap-1 text-xs text-white/60">
                <Eye className="w-3 h-3" /> {currentStream.viewer_count || 0}
              </span>
            </div>
          </div>

          {/* Tip notifications */}
          <div className="absolute top-16 right-4 space-y-2">
            {notifications.map((n) => (
              <TipNotification key={n.id} sender={n.sender} amount={n.amount} />
            ))}
          </div>
        </div>

        {/* Chat + Input */}
        <div className="flex-1 flex flex-col min-h-0" style={{ backgroundColor: "#0f0f0f" }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>No messages yet — say hi! 👋</p>
              </div>
            )}
            {messages.map((msg) => (
              <LiveStreamChat key={msg.id} message={msg} currentUser={user} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div className="px-3 pb-4 pt-2 flex items-center gap-2" style={{ backgroundColor: "#0f0f0f", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <input
              type="text"
              placeholder="Say something..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1 px-4 py-2.5 rounded-full text-sm text-white placeholder-white/30 outline-none"
              style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
            <button
              onClick={handleSendMessage}
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "var(--accent-primary)" }}
            >
              <Send className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={() => handleTip(10)}
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#E05C7A20", border: "1px solid #E05C7A50" }}
            >
              <Heart className="w-4 h-4" style={{ color: "#E05C7A", fill: "#E05C7A" }} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Stream Browser ──────────────────────────────────────────────────────────
  return (
    <div style={{ backgroundColor: "var(--bg-app)", minHeight: "100dvh" }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 pt-4 pb-0" style={{ backgroundColor: "var(--bg-app)" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #E05C2A, #F97316)" }}>
              <Radio className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Live</h1>
          </div>
          <Link
            to={createPageUrl("GoLive")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white"
            style={{ background: "linear-gradient(135deg, #E05C2A, #F97316)", boxShadow: "0 4px 12px rgba(224,92,42,0.35)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Go Live
          </Link>
        </div>

        {/* Location Tabs */}
        <div className="flex gap-1 pb-1">
          {LOCATION_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all"
                style={{
                  backgroundColor: isActive ? "var(--accent-primary)" : "var(--bg-card)",
                  color: isActive ? "#fff" : "var(--text-secondary)",
                  border: isActive ? "none" : "1px solid var(--border-light)",
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: "var(--border-light)", marginTop: 12 }} />
      </div>

      {/* Streams */}
      <div className="px-4 pt-4 space-y-3 pb-8">
        {liveStreams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
              <Radio className="w-7 h-7" style={{ color: "var(--text-hint)" }} />
            </div>
            <p className="font-semibold" style={{ color: "var(--text-secondary)" }}>No live streams right now</p>
            <p className="text-sm text-center" style={{ color: "var(--text-hint)" }}>
              {activeTab === "nearby" ? "No streams nearby. Try switching to Global." : "Be the first to go live!"}
            </p>
            <Link
              to={createPageUrl("GoLive")}
              className="mt-2 px-5 py-2.5 rounded-full text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #E05C2A, #F97316)" }}
            >
              Start Streaming
            </Link>
          </div>
        ) : (
          liveStreams.map((stream) => (
            <button
              key={stream.id}
              onClick={() => setCurrentStream(stream)}
              className="w-full text-left rounded-2xl overflow-hidden transition-all active:scale-[0.98]"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
            >
              {/* Thumbnail */}
              <div className="relative w-full" style={{ paddingBottom: "52%", backgroundColor: "#111" }}>
                {stream.stream_thumbnail ? (
                  <img src={stream.stream_thumbnail} alt={stream.title} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-4xl" style={{ background: "linear-gradient(135deg, #1a1a2e, #16213e)" }}>
                    {categoryEmoji[stream.category] || "📺"}
                  </div>
                )}
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)" }} />
                {/* LIVE badge */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold text-white" style={{ backgroundColor: "#E05C2A" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
                </div>
                {/* Viewer count */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold text-white" style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
                  <Eye className="w-3 h-3" /> {stream.viewer_count || 0}
                </div>
              </div>
              {/* Info */}
              <div className="px-3 py-2.5 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0 font-bold text-white" style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)" }}>
                  {(stream.host_name?.[0] || "?").toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm truncate" style={{ color: "var(--text-primary)" }}>{stream.title}</p>
                  <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{stream.host_name}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>
                  {stream.category?.replace("_", " ") || "chat"}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}