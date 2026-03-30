import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Search, Sparkles, X, Loader2, Send, ChevronLeft, MapPin } from "lucide-react";

// ─── AI Chat Modal ─────────────────────────────────────────────────────────────
function AIChatModal({ onClose, cityContext }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: `Hey! I'm your local guide for ${cityContext} 🌍 Ask me anything — where to eat, what to do, hidden spots, date ideas, or help planning your day!` }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;
    const newMessages = [...messages, { role: "user", text: q }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    const history = newMessages.slice(-8).map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`).join("\n");
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        model: "gemini_3_flash",
        prompt: `You are an expert local guide for ${cityContext} — friendly, direct, and specific. Answer ONLY what the user is asking. Write like a knowledgeable friend texting advice. Be concise — 2-3 short paragraphs max. Use **bold** for key place names. Give actionable, specific recommendations with real addresses when helpful.\n\nConversation:\n${history}\n\nRespond now. Stay focused and concise.`,
      });
      setMessages(prev => [...prev, { role: "assistant", text: res }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "Sorry, I couldn't connect. Please try again!" }]);
    }
    setLoading(false);
  };

  const QUICK = ["Things to do today", "Best local food", "Hidden gems", "Free activities"];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-end"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
      onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="w-full max-w-lg flex flex-col"
        style={{ backgroundColor: "#fff", borderRadius: "28px 28px 0 0", height: "80vh", boxShadow: "0 -8px 48px rgba(0,0,0,0.25)" }}
        onClick={e => e.stopPropagation()}>
        <div className="shrink-0 px-5 pt-3 pb-4" style={{ borderBottom: "1px solid #E2E8F0" }}>
          <div className="flex justify-center mb-3">
            <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "var(--border-medium)" }} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-bold text-sm leading-tight" style={{ color: "#0F172A", fontFamily: "var(--font-serif)" }}>AI Local Guide</p>
                <p className="text-xs" style={{ color: "#64748B" }}>Ask me anything about {cityContext}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--bg-subtle)" }}>
              <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="w-7 h-7 rounded-xl shrink-0 mr-2 flex items-center justify-center text-sm" style={{ background: "linear-gradient(135deg,#4F46E5,#7C3AED)" }}>🌍</div>
              )}
              <div className="max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                style={{
                  backgroundColor: m.role === "user" ? "#4F46E5" : "var(--bg-subtle)",
                  color: m.role === "user" ? "#fff" : "var(--text-primary)",
                  borderRadius: m.role === "user" ? "20px 20px 6px 20px" : "20px 20px 20px 6px",
                }}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-xl shrink-0 mr-2 flex items-center justify-center text-sm" style={{ background: "linear-gradient(135deg,#4F46E5,#7C3AED)" }}>🌍</div>
              <div className="px-4 py-3 rounded-2xl flex items-center gap-1.5" style={{ backgroundColor: "#F1F5F9", borderRadius: "20px 20px 20px 6px" }}>
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#4F46E5" }} />
                <span className="text-xs" style={{ color: "var(--text-hint)" }}>Thinking…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        {messages.length <= 1 && (
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide shrink-0">
            {QUICK.map(q => (
              <button key={q} onClick={() => setInput(q)}
                className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ backgroundColor: "#F1F5F9", color: "#475569", border: "1px solid #E2E8F0" }}>
                {q}
              </button>
            ))}
          </div>
        )}
        <div className="shrink-0 px-4 pb-6 pt-2">
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl" style={{ backgroundColor: "#F1F5F9", border: "1px solid #E2E8F0" }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
              placeholder={`Ask about ${cityContext}…`}
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: "#0F172A", border: "none", minHeight: "unset", boxShadow: "none", padding: 0 }} />
            <button onClick={send} disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg,#4F46E5,#7C3AED)", opacity: !input.trim() ? 0.5 : 1 }}>
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Area Detail ───────────────────────────────────────────────────────────────
function AreaDetail({ area, onBack }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
      <div className="sticky top-0 z-30 px-4 pb-3 flex items-center gap-3"
        style={{ paddingTop: "max(env(safe-area-inset-top,16px),16px)", backgroundColor: "var(--bg-card)", borderBottom: "1px solid var(--border-light)" }}>
        <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "var(--bg-subtle)", minHeight: "unset", minWidth: "unset" }}>
          <ChevronLeft className="w-5 h-5" style={{ color: "var(--text-primary)" }} />
        </button>
        <div>
          <h2 className="font-bold text-lg leading-tight" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>{area.name}</h2>
          <p className="text-xs" style={{ color: "var(--text-hint)" }}>{area.description}</p>
        </div>
      </div>
      {area.image && (
        <div className="w-full" style={{ height: 200 }}>
          <img src={area.image} alt={area.name} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="px-4 py-5 space-y-3 pb-28">
        {(area.spots || []).map((spot, i) => (
          <div key={i} className="p-4 rounded-2xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{spot.name}</p>
              <span className="text-xs shrink-0 px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>{spot.type}</span>
            </div>
            {spot.cost && <p className="text-xs font-semibold mb-1" style={{ color: "var(--accent-secondary)" }}>{spot.cost}</p>}
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{spot.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function TripPlanner() {
  const [city, setCity] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [areas, setAreas] = useState([]);
  const [areasLoading, setAreasLoading] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAI, setShowAI] = useState(false);

  // Detect user location
  useEffect(() => {
    if (!navigator.geolocation) { setLocationLoading(false); return; }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
        const data = await res.json();
        const cityName = data.address?.city || data.address?.town || data.address?.village || data.address?.county;
        const country = data.address?.country;
        setCity({ name: cityName, country, full: `${cityName}, ${country}`, lat: pos.coords.latitude, lng: pos.coords.longitude });
      } catch {}
      setLocationLoading(false);
    }, () => setLocationLoading(false), { enableHighAccuracy: false, timeout: 8000 });
  }, []);

  // Generate areas for city using AI
  useEffect(() => {
    if (!city) return;
    setAreasLoading(true);
    base44.integrations.Core.InvokeLLM({
      model: "gemini_3_flash",
      prompt: `Generate a JSON list of 5-6 popular neighborhoods or districts in ${city.full} that a local or tourist should explore. For each area, include 6-8 things to do or visit — mix free and paid, food, parks, culture, and nightlife. Be specific to ${city.full}, NOT generic.

Return ONLY valid JSON like this:
{
  "areas": [
    {
      "name": "Area Name",
      "tagline": "One line description",
      "description": "2-3 sentence description",
      "emoji": "🏙️",
      "image": "https://images.unsplash.com/photo-REAL_PHOTO_ID?w=600&h=400&fit=crop",
      "spots": [
        { "name": "Place Name", "type": "🍽️ Food", "cost": "Free or price", "desc": "2-3 sentence specific description" }
      ]
    }
  ]
}

Use real Unsplash photo URLs relevant to each area. Make everything specific to ${city.full}.`,
      response_json_schema: {
        type: "object",
        properties: {
          areas: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                tagline: { type: "string" },
                description: { type: "string" },
                emoji: { type: "string" },
                image: { type: "string" },
                spots: { type: "array", items: { type: "object", properties: { name: { type: "string" }, type: { type: "string" }, cost: { type: "string" }, desc: { type: "string" } } } }
              }
            }
          }
        }
      }
    }).then(res => {
      if (res?.areas) setAreas(res.areas);
    }).catch(() => {}).finally(() => setAreasLoading(false));
  }, [city]);

  const filtered = searchQuery.trim()
    ? areas.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    : areas;

  if (selectedArea) {
    return <AreaDetail area={selectedArea} onBack={() => setSelectedArea(null)} />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="sticky top-0 z-30 px-4 pb-4"
        style={{ paddingTop: "max(env(safe-area-inset-top, 16px), 16px)", backgroundColor: "var(--bg-card)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <MapPin className="w-3.5 h-3.5" style={{ color: "var(--accent-secondary)" }} />
              <p className="text-xs font-semibold" style={{ color: "var(--text-hint)" }}>
                {locationLoading ? "Detecting location…" : city ? city.country : "Trip Planner"}
              </p>
            </div>
            <h1 className="text-2xl font-black leading-tight" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              {locationLoading ? "Loading…" : city ? city.name : "Your City"}
            </h1>
          </div>
          {city && (
            <button
              onClick={() => setShowAI(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-bold"
              style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", color: "#fff", boxShadow: "0 4px 16px rgba(79,70,229,0.35)" }}>
              <Sparkles className="w-4 h-4" />
              <span>AI Guide</span>
            </button>
          )}
        </div>
        {city && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
            <Search className="w-4 h-4 shrink-0" style={{ color: "var(--text-hint)" }} />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search areas…"
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: "var(--text-primary)", border: "none", minHeight: "unset", boxShadow: "none", padding: 0 }} />
          </div>
        )}
      </div>

      <div className="px-4 pt-5 pb-32">
        {locationLoading ? (
          <div className="flex flex-col items-center gap-3 py-24">
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: "var(--accent-primary)" }} />
            <p className="text-sm" style={{ color: "var(--text-hint)" }}>Getting your location…</p>
          </div>
        ) : !city ? (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <div className="text-5xl">📍</div>
            <p className="font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Location needed</p>
            <p className="text-sm" style={{ color: "var(--text-hint)" }}>Allow location access to explore your city</p>
          </div>
        ) : areasLoading ? (
          <div className="flex flex-col items-center gap-3 py-24">
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: "var(--accent-primary)" }} />
            <p className="text-sm" style={{ color: "var(--text-hint)" }}>Generating your local guide for {city.name}…</p>
          </div>
        ) : (
          <>
            <p className="text-sm mb-5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Discover the best neighborhoods, food, activities, and hidden gems in {city.full}.
            </p>
            <div className="space-y-4">
              {filtered.map((area, idx) => (
                <motion.button
                  key={area.name}
                  onClick={() => setSelectedArea(area)}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full rounded-3xl overflow-hidden text-left relative"
                  style={{ height: 200, display: "block" }}>
                  {area.image ? (
                    <img src={area.image} alt={area.name} className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-6xl" style={{ backgroundColor: "var(--bg-subtle)" }}>
                      {area.emoji || "🗺️"}
                    </div>
                  )}
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.72) 100%)" }} />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">{area.emoji}</span>
                          <h2 className="text-xl font-black text-white" style={{ fontFamily: "var(--font-serif)" }}>{area.name}</h2>
                        </div>
                        <p className="text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>{area.tagline}</p>
                      </div>
                      <div className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold"
                        style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "#fff", backdropFilter: "blur(8px)" }}>
                        {area.spots?.length || 0} spots →
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {showAI && city && <AIChatModal onClose={() => setShowAI(false)} cityContext={city.full} />}
      </AnimatePresence>
    </div>
  );
}