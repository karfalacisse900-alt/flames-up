import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send, Mic, Square, Play, Pause } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function ConversationList({ user, onSelect }) {
  const { data: sentMessages = [] } = useQuery({
    queryKey: ["dmSent", user?.email],
    queryFn: () => base44.entities.DirectMessage.filter({ sender_email: user.email }, "-created_date", 100),
    enabled: !!user?.email,
  });
  const { data: receivedMessages = [] } = useQuery({
    queryKey: ["dmReceived", user?.email],
    queryFn: () => base44.entities.DirectMessage.filter({ receiver_email: user.email }, "-created_date", 100),
    enabled: !!user?.email,
  });

  // Derive unique conversations
  const conversations = {};
  [...sentMessages, ...receivedMessages].forEach((m) => {
    const otherEmail = m.sender_email === user.email ? m.receiver_email : m.sender_email;
    const otherName = m.sender_email === user.email ? m.receiver_email : m.sender_name || m.sender_email;
    if (!conversations[otherEmail]) {
      conversations[otherEmail] = { email: otherEmail, name: otherName, lastMessage: m };
    } else if (new Date(m.created_date) > new Date(conversations[otherEmail].lastMessage.created_date)) {
      conversations[otherEmail].lastMessage = m;
    }
  });

  const convList = Object.values(conversations).sort(
    (a, b) => new Date(b.lastMessage.created_date) - new Date(a.lastMessage.created_date)
  );

  return (
    <div className="px-5 space-y-2 mt-4">
      {convList.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-3xl mb-3">💬</p>
          <p className="text-sm" style={{ color: "var(--text-hint)" }}>No conversations yet</p>
        </div>
      ) : (
        convList.map((conv) => (
          <button
            key={conv.email}
            onClick={() => onSelect(conv)}
            className="w-full flex items-center gap-3 rounded-xl p-4 text-left hover:shadow-sm transition-shadow"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--accent-primary)" }}>
              {conv.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{conv.name}</p>
              <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-hint)" }}>
                {conv.lastMessage.audio_url ? "🎤 Voice message" : conv.lastMessage.text}
              </p>
            </div>
          </button>
        ))
      )}
    </div>
  );
}

function ChatView({ user, conversation, onBack }) {
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [sending, setSending] = useState(false);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const endRef = useRef(null);
  const queryClient = useQueryClient();

  const convId = [user.email, conversation.email].sort().join("_");

  const { data: messages = [] } = useQuery({
    queryKey: ["dm", convId],
    queryFn: () => base44.entities.DirectMessage.filter({ conversation_id: convId }, "created_date", 100),
    refetchInterval: 3000,
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendText = async () => {
    if (!text.trim()) return;
    setSending(true);
    await base44.entities.DirectMessage.create({
      conversation_id: convId,
      sender_email: user.email,
      sender_name: user.full_name || user.email,
      receiver_email: conversation.email,
      text: text.trim(),
      is_read: false,
    });
    setText("");
    setSending(false);
    queryClient.invalidateQueries({ queryKey: ["dm", convId] });
    queryClient.invalidateQueries({ queryKey: ["dmSent", user.email] });
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRef.current = new MediaRecorder(stream);
    chunksRef.current = [];
    mediaRef.current.ondataavailable = (e) => chunksRef.current.push(e.data);
    mediaRef.current.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const file = new File([blob], "voice.webm", { type: "audio/webm" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.DirectMessage.create({
        conversation_id: convId,
        sender_email: user.email,
        sender_name: user.full_name || user.email,
        receiver_email: conversation.email,
        text: "",
        audio_url: file_url,
        is_read: false,
      });
      stream.getTracks().forEach((t) => t.stop());
      queryClient.invalidateQueries({ queryKey: ["dm", convId] });
    };
    mediaRef.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  return (
    <div className="flex flex-col" style={{ height: "100dvh", backgroundColor: "var(--bg-app)" }}>
      <div className="px-4 py-3 flex items-center gap-3 shrink-0" style={{ backgroundColor: "var(--bg-nav)", borderBottom: "1px solid var(--border-light)" }}>
        <button onClick={onBack} className="p-2 rounded-full" style={{ backgroundColor: "var(--bg-subtle)" }}>
          <ArrowLeft className="w-5 h-5" style={{ color: "var(--text-primary)" }} />
        </button>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--accent-primary)" }}>
          {conversation.name?.[0]?.toUpperCase() || "?"}
        </div>
        <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{conversation.name}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.map((msg) => {
          const isMe = msg.sender_email === user.email;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div
                className="max-w-[75%] rounded-2xl px-4 py-2.5"
                style={{
                  backgroundColor: isMe ? "var(--accent-primary)" : "var(--bg-card)",
                  color: isMe ? "#fff" : "var(--text-primary)",
                  border: isMe ? "none" : "1px solid var(--border-light)",
                }}
              >
                {msg.audio_url ? (
                  <audio src={msg.audio_url} controls className="h-8" style={{ filter: isMe ? "invert(1)" : "none" }} />
                ) : (
                  <p className="text-sm">{msg.text}</p>
                )}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="p-3 flex gap-2 shrink-0" style={{ backgroundColor: "var(--bg-nav)", borderTop: "1px solid var(--border-light)" }}>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message..."
          className="flex-1 rounded-xl"
          onKeyDown={(e) => e.key === "Enter" && sendText()}
        />
        <button
          onPointerDown={startRecording}
          onPointerUp={stopRecording}
          className={`p-2.5 rounded-xl transition-colors ${recording ? "animate-pulse" : ""}`}
          style={{ backgroundColor: recording ? "rgba(224,92,122,0.15)" : "var(--bg-subtle)", color: recording ? "#E05C7A" : "var(--text-secondary)" }}
        >
          {recording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
        <Button onClick={sendText} disabled={!text.trim() || sending} size="icon" className="rounded-xl shrink-0" style={{ backgroundColor: "var(--accent-primary)" }}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default function Messages() {
  const [user, setUser] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Support deep-linking to a specific user via ?with=email&name=name
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const withEmail = params.get("with");
    const withName = params.get("name");
    if (withEmail) setActiveConversation({ email: withEmail, name: withName || withEmail });
  }, []);

  if (!user) return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
    </div>
  );

  if (activeConversation) {
    return <ChatView user={user} conversation={activeConversation} onBack={() => setActiveConversation(null)} />;
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-app)" }}>
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center gap-3" style={{ backgroundColor: "var(--bg-nav)", borderBottom: "1px solid var(--border-light)" }}>
        <Link to={createPageUrl("Profile")} className="p-2 rounded-full" style={{ backgroundColor: "var(--bg-subtle)" }}>
          <ArrowLeft className="w-5 h-5" style={{ color: "var(--text-primary)" }} />
        </Link>
        <h2 className="font-semibold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Messages</h2>
      </div>
      <ConversationList user={user} onSelect={setActiveConversation} />
    </div>
  );
}