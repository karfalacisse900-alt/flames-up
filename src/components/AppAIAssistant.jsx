import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";

const QUICK_PROMPTS = [
  "How do I post anonymously?",
  "How do I earn coins?",
  "What are Live Rooms?",
  "How do I follow someone?",
  "How do I boost a post?",
  "How does the music preview work?",
];

const APP_CONTEXT = `You are a helpful assistant for a community social app. Here's what the app has:
- Home Feed: Post questions, quotes, concerns. Like/reply to posts. Swipe mode. Boost posts with coins.
- Discover: Find apps, products, services, media (movies, books, music, games). Rate, save, share items.
- Music tab: Spotify-powered music discovery with 70+ preloaded songs, audio previews, search.
- Gallery/Art: Upload, buy, sell digital art using coins. Art Fight arena.
- Live Rooms: Real-time chat rooms. Host or join. Send virtual gifts.
- Games: Mini-games to win coins.
- Profile: Edit bio, avatar, theme. View posts, liked posts, badges, media lists, interests, activity.
- Wallet: Buy coin packs. Coins used for boosts, gifts, art purchases, paid rooms.
- Notifications: Stay updated on likes, replies, follows.
- Messages: Direct messages with other users.
- Help & Guide: Onboarding walkthrough and FAQ (accessible from Profile → ··· menu → Help & Guide).
Answer questions about these features concisely and helpfully. If asked to do something, guide the user step by step.`;

export default function AppAIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm your app assistant. Ask me anything about how the app works, or pick a quick question below 👇" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  // Draggable position state — start bottom-right
  const [pos, setPos] = useState({ x: null, y: null }); // null = use CSS default
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const btnRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const handleDragStart = (e) => {
    dragging.current = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const rect = btnRef.current.getBoundingClientRect();
    dragOffset.current = { x: clientX - rect.left, y: clientY - rect.top };
    e.preventDefault();
  };

  const handleDragMove = (e) => {
    if (!dragging.current) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const newX = clientX - dragOffset.current.x;
    const newY = clientY - dragOffset.current.y;
    // Clamp to viewport
    const btn = btnRef.current;
    const w = btn ? btn.offsetWidth : 48;
    const h = btn ? btn.offsetHeight : 48;
    setPos({
      x: Math.max(8, Math.min(window.innerWidth - w - 8, newX)),
      y: Math.max(8, Math.min(window.innerHeight - h - 8, newY)),
    });
  };

  const handleDragEnd = () => { dragging.current = false; };

  useEffect(() => {
    window.addEventListener("mousemove", handleDragMove);
    window.addEventListener("mouseup", handleDragEnd);
    window.addEventListener("touchmove", handleDragMove, { passive: false });
    window.addEventListener("touchend", handleDragEnd);
    return () => {
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleDragMove);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, []);

  const btnStyle = pos.x !== null
    ? { position: "fixed", left: pos.x, top: pos.y, bottom: "auto", right: "auto", zIndex: 50, touchAction: "none" }
    : { position: "fixed", bottom: "80px", right: "16px", zIndex: 50, touchAction: "none" };

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: msg }]);
    setLoading(true);

    try {
      const history = messages.map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n");
      const prompt = `${APP_CONTEXT}\n\nConversation so far:\n${history}\n\nUser: ${msg}\n\nAssistant:`;
      const reply = await base44.integrations.Core.InvokeLLM({ prompt });
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I couldn't process that. Please try again." }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Draggable floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            ref={btnRef}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            style={btnStyle}
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            onClick={() => !dragging.current && setOpen(true)}
            className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing select-none"
            style={{ ...btnStyle, backgroundColor: "var(--accent-primary)", color: "#fff" }}
          >
            <Sparkles className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="fixed bottom-20 right-3 left-3 z-50 max-w-sm mx-auto rounded-3xl flex flex-col overflow-hidden"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-light)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
              maxHeight: "70vh",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 shrink-0"
              style={{ backgroundColor: "var(--accent-primary)", borderRadius: "24px 24px 0 0" }}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-white" />
                <p className="text-sm font-semibold text-white">App Assistant</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-white opacity-80 hover:opacity-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-0"
              style={{ backgroundColor: "var(--bg-card)" }}>
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className="max-w-[82%] px-3 py-2 rounded-2xl text-sm leading-relaxed"
                    style={{
                      backgroundColor: m.role === "user" ? "var(--accent-primary)" : "var(--bg-subtle)",
                      color: m.role === "user" ? "#fff" : "var(--text-primary)",
                      borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    }}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="px-3 py-2 rounded-2xl" style={{ backgroundColor: "var(--bg-subtle)" }}>
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--text-hint)" }} />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick prompts */}
            {messages.length <= 1 && (
              <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto scrollbar-hide shrink-0"
                style={{ backgroundColor: "var(--bg-card)" }}>
                {QUICK_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(p)}
                    className="whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-medium shrink-0 border transition-all active:scale-95"
                    style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)", borderColor: "var(--border-light)" }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-3 pb-3 pt-1 shrink-0"
              style={{ borderTop: "1px solid var(--border-light)", backgroundColor: "var(--bg-card)" }}>
              <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask me anything…"
                  className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-40"
                  style={{ backgroundColor: "var(--accent-primary)", color: "#fff" }}
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}