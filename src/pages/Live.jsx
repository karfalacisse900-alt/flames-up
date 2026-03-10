import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Heart, Users, Send } from "lucide-react";
import LiveStreamChat from "../components/live/LiveStreamChat.jsx";
import TipNotification from "../components/live/TipNotification.jsx";

export default function Live() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentStream, setCurrentStream] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [notifications, setNotifications] = useState([]);
  const qc = useQueryClient();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => navigate(createPageUrl("Home")));
  }, []);

  const { data: liveStreams = [] } = useQuery({
    queryKey: ["liveStreams"],
    queryFn: () => base44.entities.LiveStream.filter({ is_active: true }, "-created_date", 20),
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

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [streamMessages]);

  useEffect(() => {
    setMessages(streamMessages);
  }, [streamMessages]);

  // Subscribe to real-time chat updates
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

    try {
      await base44.entities.LiveStreamChat.create({
        stream_id: currentStream.id,
        sender_email: user.email,
        sender_name: user.display_name || user.full_name || "User",
        message: chatInput,
        type: "message",
      });
      setChatInput("");
      qc.invalidateQueries({ queryKey: ["streamMessages", currentStream.id] });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleTip = async (amount) => {
    if (!user || !currentStream) return;

    try {
      // Create tip notification in chat
      await base44.entities.LiveStreamChat.create({
        stream_id: currentStream.id,
        sender_email: user.email,
        sender_name: user.display_name || user.full_name || "User",
        message: `Tipped ${amount} coins!`,
        type: "tip_notification",
        tip_amount: amount,
      });

      // Show notification
      setNotifications((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: user.display_name || user.full_name || "User",
          amount,
        },
      ]);

      // Remove notification after 5 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== Date.now()));
      }, 5000);

      qc.invalidateQueries({ queryKey: ["streamMessages", currentStream.id] });
      qc.invalidateQueries({ queryKey: ["liveStreams"] });
    } catch (error) {
      console.error("Error sending tip:", error);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)" }} />
      </div>
    );
  }

  if (!currentStream) {
    return (
      <div style={{ backgroundColor: "var(--bg-app)", minHeight: "100dvh" }}>
        {/* Header */}
        <div className="sticky top-0 z-10 px-4 py-3 border-b flex items-center gap-3" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)" }}>
          <Link to={createPageUrl("Home")} className="p-2 rounded-lg">
            <ArrowLeft className="w-5 h-5" style={{ color: "var(--text-primary)" }} />
          </Link>
          <h1 className="text-lg font-bold flex-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
            🔴 Live Streams
          </h1>
        </div>

        {/* Streams list */}
        <div className="px-4 py-4 space-y-3">
          {liveStreams.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">📺</p>
              <p style={{ color: "var(--text-hint)" }}>No live streams right now</p>
            </div>
          ) : (
            liveStreams.map((stream) => (
              <button
                key={stream.id}
                onClick={() => setCurrentStream(stream)}
                className="w-full text-left rounded-2xl p-4 border transition-all active:scale-95"
                style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)" }}
              >
                <div className="flex items-start gap-3">
                  {stream.stream_thumbnail ? (
                    <img src={stream.stream_thumbnail} alt={stream.title} className="w-20 h-20 rounded-xl object-cover" />
                  ) : (
                    <div className="w-20 h-20 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: "var(--bg-subtle)" }}>
                      📺
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-red-600 text-sm font-bold">● LIVE</span>
                      <span className="text-xs" style={{ color: "var(--text-hint)" }}>
                        {stream.viewer_count} viewers
                      </span>
                    </div>
                    <h3 className="font-bold truncate" style={{ color: "var(--text-primary)" }}>
                      {stream.title}
                    </h3>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      {stream.host_name}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)" }}>
        <button onClick={() => setCurrentStream(null)} className="p-2 rounded-lg">
          <ArrowLeft className="w-5 h-5" style={{ color: "var(--text-primary)" }} />
        </button>
        <div className="flex-1">
          <h2 className="font-bold text-sm truncate" style={{ color: "var(--text-primary)" }}>
            {currentStream.title}
          </h2>
          <p className="text-xs flex items-center gap-1" style={{ color: "var(--text-hint)" }}>
            <Users className="w-3 h-3" /> {currentStream.viewer_count} viewers
          </p>
        </div>
      </div>

      {/* Live stream video placeholder */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: "#000" }}>
        {currentStream.stream_thumbnail && (
          <img src={currentStream.stream_thumbnail} alt="stream" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-white text-3xl">🔴</p>
            <p className="text-white text-sm mt-2">Live Video Stream</p>
            <p className="text-gray-400 text-xs mt-1">{currentStream.host_name}</p>
          </div>
        </div>

        {/* Floating tip notifications */}
        <div className="absolute top-4 right-4 space-y-2">
          {notifications.map((notif) => (
            <TipNotification key={notif.id} sender={notif.sender} amount={notif.amount} />
          ))}
        </div>
      </div>

      {/* Chat section */}
      <div className="flex-1 flex flex-col border-t" style={{ borderColor: "var(--border-light)" }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {messages.map((msg) => (
            <LiveStreamChat key={msg.id} message={msg} currentUser={user} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat input */}
        <div className="px-3 py-3 border-t flex gap-2" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)" }}>
          <input
            type="text"
            placeholder="Send a message..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            className="flex-1 px-3 py-2 rounded-xl text-sm"
            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", border: "1px solid var(--border-light)" }}
          />
          <button onClick={handleSendMessage} className="p-2 rounded-xl text-white" style={{ backgroundColor: "var(--accent-primary)" }}>
            <Send className="w-4 h-4" />
          </button>
          <button onClick={() => handleTip(10)} className="p-2 rounded-xl" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
            <Heart className="w-4 h-4 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
}