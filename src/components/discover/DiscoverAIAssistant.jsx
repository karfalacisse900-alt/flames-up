import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Send, X, ChevronDown, Loader2, Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SUGGESTIONS = [
  "Free project management tool for small teams",
  "Best AI writing assistant",
  "Free budget tracker for personal finance",
  "Cross-platform note-taking app",
  "Developer productivity tools",
];

export default function DiscoverAIAssistant({ items, onItemClick }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! I'm your Discover assistant 🤖 Tell me what you're looking for — I'll find the best tools for you.",
      results: null,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const ask = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: "user", text };
    setMessages(prev => [...prev, userMsg]);
    setQuery("");
    setLoading(true);

    const itemSummaries = items.map(i => ({
      id: i.id,
      title: i.title,
      brand: i.brand_name,
      category: i.category,
      description: i.description,
      pricing: i.pricing,
      platforms: i.platforms,
      tags: i.tags,
      avg_rating: i.avg_rating,
    }));

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a tool recommendation assistant for a curated discovery platform. 
The user said: "${text}"

Here are the available tools (as JSON):
${JSON.stringify(itemSummaries, null, 2)}

Based on the user's query, recommend the most relevant tools. Return a JSON with:
- "reply": a short friendly message (1-2 sentences) explaining your picks
- "recommended_ids": array of up to 5 item IDs from the list above that best match

Only recommend from the provided list. If nothing matches well, say so nicely.`,
      response_json_schema: {
        type: "object",
        properties: {
          reply: { type: "string" },
          recommended_ids: { type: "array", items: { type: "string" } },
        },
      },
    });

    const recommendedItems = (result.recommended_ids || [])
      .map(id => items.find(i => i.id === id))
      .filter(Boolean);

    setMessages(prev => [
      ...prev,
      {
        role: "assistant",
        text: result.reply || "Here's what I found!",
        results: recommendedItems,
      },
    ]);
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ask(query);
    }
  };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-24 right-4 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-sm font-medium"
            style={{ backgroundColor: "var(--accent-primary)", color: "#fff" }}
          >
            <Sparkles className="w-4 h-4" />
            Ask AI
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
            className="fixed bottom-20 left-2 right-2 z-50 max-w-lg mx-auto rounded-3xl overflow-hidden"
            style={{ backgroundColor: "#FFFFFF", boxShadow: "0 8px 50px rgba(0,0,0,0.18)", border: "1px solid #E5DFD0" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: "var(--accent-primary)" }}>
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-white" />
                <span className="text-sm font-semibold text-white">Discover AI</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-white">Beta</span>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 rounded-full hover:bg-white/20 transition-colors">
                <ChevronDown className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Messages */}
            <div className="px-4 py-3 space-y-3 overflow-y-auto" style={{ maxHeight: "45vh" }}>
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] space-y-2`}>
                    <div
                      className="px-3 py-2 rounded-2xl text-sm leading-relaxed"
                      style={{
                        backgroundColor: msg.role === "user" ? "var(--accent-primary)" : "#F5F2E8",
                        color: msg.role === "user" ? "#fff" : "var(--text-primary)",
                        borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      }}
                    >
                      {msg.text}
                    </div>

                    {/* Result cards */}
                    {msg.results?.length > 0 && (
                      <div className="space-y-1.5 mt-1">
                        {msg.results.map(item => (
                          <button
                            key={item.id}
                            onClick={() => { onItemClick(item); setOpen(false); }}
                            className="w-full text-left px-3 py-2.5 rounded-xl border transition-all hover:shadow-sm active:scale-[0.99]"
                            style={{ backgroundColor: "#fff", borderColor: "#E5DFD0" }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{item.title}</span>
                              {item.pricing && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">{item.pricing}</span>
                              )}
                            </div>
                            <p className="text-[11px] mt-0.5 line-clamp-1" style={{ color: "var(--text-hint)" }}>{item.description}</p>
                          </button>
                        ))}
                      </div>
                    )}

                    {msg.results?.length === 0 && msg.role === "assistant" && i > 0 && (
                      <p className="text-[11px] px-1" style={{ color: "var(--text-hint)" }}>Try rephrasing or browsing categories above.</p>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="px-4 py-2.5 rounded-2xl text-sm" style={{ backgroundColor: "#F5F2E8" }}>
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--text-hint)" }} />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggestions */}
            {messages.length === 1 && (
              <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto scrollbar-hide">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => ask(s)}
                    className="shrink-0 text-[11px] px-2.5 py-1 rounded-full border whitespace-nowrap transition-colors"
                    style={{ backgroundColor: "#F5F2E8", borderColor: "#E5DFD0", color: "var(--text-secondary)" }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-3 pb-3 pt-1">
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl" style={{ backgroundColor: "#F5F2E8", border: "1px solid #E5DFD0" }}>
                <input
                  ref={inputRef}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
                  placeholder="Ask me anything..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  style={{ color: "var(--text-primary)" }}
                />
                <button
                  onClick={() => ask(query)}
                  disabled={!query.trim() || loading}
                  className="p-1.5 rounded-full disabled:opacity-40 transition-colors"
                  style={{ backgroundColor: "var(--accent-primary)", color: "#fff" }}
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}