import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, MapPin, Bot, Flag, ChevronDown, ChevronUp, X, Send, Loader2, ArrowLeft, ShieldCheck, Eye, Navigation } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Scam Data ─────────────────────────────────────────────────────────────────
const SCAMS = [
  { id: 1, category: "street", title: "Fake Monk Bracelet", emoji: "📿", what: "Someone puts a bracelet on your wrist 'for free', then aggressively demands money.", avoid: "Never let strangers place anything on your body. Say 'No thank you' firmly and walk away.", hotspots: ["Times Square", "Grand Central", "Brooklyn Bridge"], lat: 40.758, lng: -73.9855 },
  { id: 2, category: "street", title: "CD / Mixtape Hustle", emoji: "💿", what: "Person hands you a CD, signs it, chats you up — then pressures you to pay for it.", avoid: "Don't accept CDs or physical items from strangers. Keep walking.", hotspots: ["Times Square", "Herald Square"], lat: 40.756, lng: -73.989 },
  { id: 3, category: "street", title: "Petition / Signature Trap", emoji: "📋", what: "Someone asks you to sign a petition for a cause, then pressures you for a cash donation.", avoid: "Don't stop for clipboard people. If you want to donate, do it online to verified orgs.", hotspots: ["Midtown", "Union Square"], lat: 40.7359, lng: -73.9911 },
  { id: 4, category: "street", title: "Costumed Character Photo", emoji: "🎭", what: "People in costumes (Elmo, Spider-Man) offer free photos — then demand large tips or get aggressive.", avoid: "Only take photos if you've agreed on a price beforehand. It's never truly free.", hotspots: ["Times Square"], lat: 40.758, lng: -73.9855 },
  { id: 5, category: "street", title: "3-Card Monte", emoji: "🃏", what: "A street card game that looks easy to win. It's always rigged with a hired crowd.", avoid: "Never play street gambling games. The house always wins.", hotspots: ["Midtown", "Penn Station area"], lat: 40.7506, lng: -73.9936 },
  { id: 6, category: "street", title: '"Found Ring" Trick', emoji: "💍", what: "Stranger 'finds' a ring near you and offers to sell it cheap. It's fake jewelry.", avoid: "Ignore it. Don't engage.", hotspots: ["Midtown", "Lower Manhattan"], lat: 40.7127, lng: -74.0059 },
  { id: 7, category: "street", title: "Free Gift Trap", emoji: "🎁", what: "Stranger gives a gift to your child or you 'for free', then pressures you to pay.", avoid: "Politely decline anything offered for free by strangers.", hotspots: ["Midtown", "Tourist areas"], lat: 40.754, lng: -73.984 },
  { id: 8, category: "transit", title: "Subway Swipe Scam", emoji: "🚇", what: "Person offers to swipe you into the subway cheaper using a stolen or invalid MetroCard.", avoid: "Always use your own payment. Using a stolen card is also illegal for you.", hotspots: ["Busy subway stations"], lat: 40.7506, lng: -73.9971 },
  { id: 9, category: "transit", title: "Fake Uber / Ride Pickup", emoji: "🚗", what: "Someone near an airport or venue pretends to be your Uber or Lyft driver.", avoid: "Always verify license plate, car model, and driver photo in your app before getting in.", hotspots: ["JFK Airport", "LaGuardia", "Penn Station"], lat: 40.7484, lng: -73.9967 },
  { id: 10, category: "transit", title: "Broken Taxi Meter", emoji: "🚕", what: "Driver claims meter is broken and charges a high random price at destination.", avoid: "Insist on using the meter or agree on price before the ride. Exit if refused.", hotspots: ["Airports", "Midtown"], lat: 40.7549, lng: -73.9840 },
  { id: 11, category: "digital", title: "Fake Event Tickets", emoji: "🎟️", what: "Scalpers outside venues sell fake or invalid tickets at discounted prices.", avoid: "Buy only from official box offices or verified apps like Ticketmaster.", hotspots: ["Madison Square Garden", "Barclays Center", "Broadway"], lat: 40.7505, lng: -73.9934 },
  { id: 12, category: "digital", title: "Fake Apartment Rental", emoji: "🏠", what: "Cheap listing online asking for deposit before you can see the place. It's fake.", avoid: "Never pay before viewing in person. Use verified platforms only.", hotspots: ["Online listings"], lat: 40.730, lng: -73.935 },
  { id: 13, category: "digital", title: "Bar Overcharge Scam", emoji: "🍺", what: "Prices aren't shown clearly. You get hit with a huge bill at the end.", avoid: "Always ask for the price before ordering. Check the bill carefully.", hotspots: ["Nightlife areas", "Lower East Side", "Meatpacking District"], lat: 40.7408, lng: -74.0042 },
  { id: 14, category: "theft", title: "ATM Distraction Theft", emoji: "🏧", what: "Someone distracts you at an ATM while an accomplice steals your card or cash.", avoid: "Use ATMs in well-lit areas. Don't engage strangers. Cover your PIN.", hotspots: ["Busy ATM locations"], lat: 40.752, lng: -73.977 },
  { id: 15, category: "theft", title: "Phone Snatch Setup", emoji: "📱", what: "Someone bumps into you while another grabs your phone. Happens in crowds.", avoid: "Keep phone in pocket in crowded areas. Be aware of distractions.", hotspots: ["Times Square", "Subway platforms", "Concerts"], lat: 40.758, lng: -73.9855 },
  { id: 16, category: "theft", title: '"Can I Use Your Phone?"', emoji: "☎️", what: "Stranger asks to borrow your phone urgently, then runs away with it.", avoid: "Never hand your phone to a stranger. Offer to dial a number yourself instead.", hotspots: ["Tourist areas", "Midtown"], lat: 40.755, lng: -73.986 },
  { id: 17, category: "street", title: "Fake Charity Collectors", emoji: "🪣", what: "People collecting for 'kids' or 'schools' with no real organization behind them.", avoid: "Only donate online to verified charities. Ask for official credentials.", hotspots: ["Busy intersections", "Shopping areas"], lat: 40.748, lng: -73.985 },
  { id: 18, category: "street", title: "Street Performer Pressure", emoji: "🎪", what: "Performers asking aggressively for tips after uninvited performances near you.", avoid: "You're not obligated to tip. Move on if pressured.", hotspots: ["Times Square", "Subway stations"], lat: 40.758, lng: -73.9855 },
  { id: 19, category: "transit", title: "Fake Parking Attendant", emoji: "🅿️", what: "Unofficial person guides you to park, then demands cash payment.", avoid: "Only pay official parking meters or marked attendant booths.", hotspots: ["Brooklyn", "Queens parking areas"], lat: 40.678, lng: -73.944 },
  { id: 20, category: "theft", title: "Overfriendly Stranger Setup", emoji: "🤝", what: "An extremely friendly stranger builds quick trust, then steals from you or leads you into a scam.", avoid: "Be polite but cautious with overly friendly strangers in tourist areas.", hotspots: ["Times Square", "Central Park", "Popular tourist spots"], lat: 40.7851, lng: -73.9683 },
];

const CATEGORIES = [
  { value: "all", label: "All Alerts", emoji: "🚨", color: "#DC2626" },
  { value: "street", label: "Street Scams", emoji: "🏙️", color: "#EA580C" },
  { value: "transit", label: "Transit", emoji: "🚇", color: "#2563EB" },
  { value: "digital", label: "Tickets & Online", emoji: "💻", color: "#7C3AED" },
  { value: "theft", label: "Theft & Pickpocket", emoji: "👜", color: "#DC2626" },
];

const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.value, c]));

export default function ListenDontJudge() {
  const [user, setUser] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [activeTab, setActiveTab] = useState("alerts"); // alerts | map | ai | report
  const [mapReady, setMapReady] = useState(false);
  const [apiKey, setApiKey] = useState(null);
  const mapRef = useRef(null);
  const mapInst = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    base44.functions.invoke("googleMapsToken", {}).then(res => setApiKey(res.data?.key || res.data)).catch(() => {});
  }, []);

  const filtered = activeCategory === "all" ? SCAMS : SCAMS.filter(s => s.category === activeCategory);

  // Init map when tab switches to map
  useEffect(() => {
    if (activeTab !== "map" || !apiKey || mapInst.current) return;
    let destroyed = false;
    const init = async () => {
      if (!window.google?.maps) {
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
          s.async = true; s.onload = resolve; s.onerror = reject;
          document.head.appendChild(s);
        });
      }
      if (destroyed || !mapRef.current) return;
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 40.7549, lng: -73.984 }, zoom: 13,
        disableDefaultUI: true, gestureHandling: "greedy",
        styles: [{ featureType: "poi", elementType: "labels.icon", stylers: [{ visibility: "simplified" }] }],
      });
      mapInst.current = map;

      // Add scam pins
      SCAMS.forEach(scam => {
        const cat = CAT_MAP[scam.category] || CAT_MAP.all;
        const markerHtml = `<div style="background:${cat.color};color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${scam.emoji}</div>`;
        const el = document.createElement("div");
        el.innerHTML = markerHtml;
        const marker = new window.google.maps.Marker({
          position: { lat: scam.lat, lng: scam.lng },
          map,
          icon: { url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><circle cx="20" cy="20" r="18" fill="${cat.color}" stroke="white" stroke-width="3"/><text x="20" y="26" font-size="14" text-anchor="middle">${scam.emoji}</text></svg>`)}`, scaledSize: new window.google.maps.Size(40, 40), anchor: new window.google.maps.Point(20, 20) },
          title: scam.title,
        });
        const infoWindow = new window.google.maps.InfoWindow({
          content: `<div style="max-width:220px;font-family:sans-serif;padding:4px 0"><div style="font-weight:700;font-size:14px;margin-bottom:4px">${scam.emoji} ${scam.title}</div><div style="font-size:12px;color:#555;margin-bottom:6px">${scam.what.slice(0, 100)}…</div><div style="font-size:11px;color:#16a34a;font-weight:600">✅ ${scam.avoid.slice(0, 80)}…</div></div>`,
        });
        marker.addListener("click", () => infoWindow.open(map, marker));
      });
      setMapReady(true);
    };
    init().catch(console.error);
    return () => { destroyed = true; };
  }, [activeTab, apiKey]);

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="sticky top-0 z-30" style={{ backgroundColor: "var(--bg-nav)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--border-light)" }}>
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0" style={{ background: "linear-gradient(135deg,#DC2626,#EA580C)" }}>
              🛡️
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold leading-tight" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Stay Safe NYC</h1>
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>Safety alerts & scam awareness</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold" style={{ backgroundColor: "rgba(220,38,38,0.1)", color: "#DC2626" }}>
              <AlertTriangle className="w-3.5 h-3.5" /> {SCAMS.length} alerts
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-2xl" style={{ backgroundColor: "var(--bg-subtle)" }}>
            {[
              { id: "alerts", label: "Alerts", icon: ShieldCheck },
              { id: "map", label: "Map", icon: MapPin },
              { id: "ai", label: "Ask AI", icon: Bot },
              { id: "report", label: "Report", icon: Flag },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all"
                  style={{ backgroundColor: isActive ? "#DC2626" : "transparent", color: isActive ? "#fff" : "var(--text-secondary)" }}>
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Alerts Tab */}
      {activeTab === "alerts" && (
        <div className="max-w-2xl mx-auto px-4 py-4">
          {/* Warning banner */}
          <div className="rounded-2xl p-4 mb-4 flex gap-3" style={{ background: "linear-gradient(135deg, rgba(220,38,38,0.08), rgba(234,88,12,0.08))", border: "1px solid rgba(220,38,38,0.2)" }}>
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#DC2626" }} />
            <div>
              <p className="text-sm font-bold mb-0.5" style={{ color: "#DC2626" }}>Common NYC Scams</p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Stay aware of these common situations targeting tourists and new residents in New York City.
              </p>
            </div>
          </div>

          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            {CATEGORIES.map(cat => {
              const isActive = activeCategory === cat.value;
              return (
                <button key={cat.value} onClick={() => setActiveCategory(cat.value)}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold"
                  style={{ backgroundColor: isActive ? cat.color : "var(--bg-card)", color: isActive ? "#fff" : "var(--text-secondary)", border: `1.5px solid ${isActive ? cat.color : "var(--border-light)"}` }}>
                  {cat.emoji} {cat.label}
                </button>
              );
            })}
          </div>

          {/* Alert cards */}
          <div className="flex flex-col gap-3">
            {filtered.map(scam => {
              const cat = CAT_MAP[scam.category];
              const isExp = expandedId === scam.id;
              return (
                <motion.div key={scam.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl overflow-hidden"
                  style={{ backgroundColor: "var(--bg-card)", border: `1px solid var(--border-light)`, boxShadow: "var(--elevation-1)" }}>
                  <button className="w-full text-left p-4" onClick={() => setExpandedId(isExp ? null : scam.id)}>
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0"
                        style={{ backgroundColor: `${cat?.color}18` }}>
                        {scam.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{scam.title}</p>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                            style={{ backgroundColor: `${cat?.color}18`, color: cat?.color }}>
                            {cat?.emoji} {cat?.label}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                          {isExp ? scam.what : scam.what.slice(0, 80) + (scam.what.length > 80 ? "…" : "")}
                        </p>
                      </div>
                      <div className="shrink-0 mt-0.5">
                        {isExp ? <ChevronUp className="w-4 h-4" style={{ color: "var(--text-hint)" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "var(--text-hint)" }} />}
                      </div>
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExp && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                        <div className="px-4 pb-4 space-y-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                          <div className="pt-3">
                            <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-hint)" }}>⚠️ What Happens</p>
                            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{scam.what}</p>
                          </div>
                          <div className="p-3 rounded-xl" style={{ backgroundColor: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)" }}>
                            <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#16A34A" }}>✅ How to Avoid</p>
                            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{scam.avoid}</p>
                          </div>
                          {scam.hotspots?.length > 0 && (
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-hint)" }}>📍 Common Locations</p>
                              <div className="flex flex-wrap gap-1.5">
                                {scam.hotspots.map(h => (
                                  <span key={h} className="text-xs px-2 py-1 rounded-full font-medium"
                                    style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}>
                                    {h}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Map Tab */}
      {activeTab === "map" && (
        <div className="relative" style={{ height: "calc(100dvh - 130px)" }}>
          {!apiKey && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "var(--bg-app)" }}>
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--accent-primary)" }} />
            </div>
          )}
          <div ref={mapRef} style={{ position: "absolute", inset: 0 }} />
          {/* Legend */}
          {apiKey && (
            <div className="absolute top-3 left-3 right-3 z-10">
              <div className="rounded-2xl p-3 flex flex-wrap gap-2" style={{ backgroundColor: "rgba(255,255,255,0.96)", backdropFilter: "blur(16px)", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
                <p className="w-full text-xs font-bold mb-1" style={{ color: "#0F172A" }}>🗺️ Scam hotspot map — tap a pin for details</p>
                {CATEGORIES.filter(c => c.value !== "all").map(cat => (
                  <div key={cat.value} className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: "#374151" }}>
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    {cat.label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Tab */}
      {activeTab === "ai" && <AIAssistant user={user} />}

      {/* Report Tab */}
      {activeTab === "report" && <ReportForm user={user} />}
    </div>
  );
}

// ── AI Safety Assistant ───────────────────────────────────────────────────────
function AIAssistant({ user }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "👋 Hi! I'm your NYC Safety Assistant. Ask me anything like:\n\n• \"Is Times Square safe at night?\"\n• \"What scams happen near Central Park?\"\n• \"How do I avoid getting scammed on the subway?\"" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const scamContext = SCAMS.map(s => `${s.title}: ${s.what} Avoid: ${s.avoid}. Common at: ${s.hotspots?.join(", ")}.`).join("\n");

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an NYC safety expert helping tourists and new residents avoid scams. Answer concisely and helpfully based on this scam database:\n\n${scamContext}\n\nUser question: ${userMsg}`,
      });
      setMessages(prev => [...prev, { role: "assistant", content: res }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I couldn't get a response. Please try again." }]);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: "calc(100dvh - 140px)" }}>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line`}
              style={{
                backgroundColor: msg.role === "user" ? "#DC2626" : "var(--bg-card)",
                color: msg.role === "user" ? "#fff" : "var(--text-primary)",
                border: msg.role === "assistant" ? "1px solid var(--border-light)" : "none",
              }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl flex items-center gap-2" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#DC2626" }} />
              <span className="text-sm" style={{ color: "var(--text-hint)" }}>Thinking…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 flex gap-2" style={{ borderTop: "1px solid var(--border-light)", backgroundColor: "var(--bg-nav)", backdropFilter: "blur(16px)" }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder='Ask: "Is this area safe?"'
          className="flex-1 px-4 py-2.5 rounded-2xl text-sm outline-none"
          style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
        <button onClick={send} disabled={!input.trim() || loading}
          className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: "#DC2626", opacity: input.trim() ? 1 : 0.4 }}>
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}

// ── Report Form ───────────────────────────────────────────────────────────────
function ReportForm({ user }) {
  const [form, setForm] = useState({ title: "", description: "", location: "", category: "street" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.title.trim() || !form.description.trim()) return;
    setLoading(true);
    await base44.entities.Report.create({
      content_type: "user",
      content_id: "scam_report",
      reason: `[${form.category}] ${form.title}: ${form.description} | Location: ${form.location}`,
      reporter_email: user?.email || "anonymous",
      status: "pending",
    });
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="text-6xl mb-4">✅</div>
      <h3 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Report Submitted</h3>
      <p className="text-sm mb-6" style={{ color: "var(--text-hint)" }}>Thank you for helping keep NYC safer. Our team will review your report.</p>
      <button onClick={() => setSubmitted(false)} className="px-6 py-3 rounded-2xl text-sm font-bold text-white" style={{ backgroundColor: "#DC2626" }}>Submit Another</button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
      <div className="rounded-2xl p-4 flex gap-3" style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)" }}>
        <Flag className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#DC2626" }} />
        <div>
          <p className="text-sm font-bold mb-0.5" style={{ color: "#DC2626" }}>Report a Scam or Safety Issue</p>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Help others stay safe by reporting scams you've witnessed or experienced.</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{ color: "var(--text-hint)" }}>Category</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.filter(c => c.value !== "all").map(cat => (
              <button key={cat.value} onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                className="px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ backgroundColor: form.category === cat.value ? cat.color : "var(--bg-card)", color: form.category === cat.value ? "#fff" : "var(--text-secondary)", border: `1.5px solid ${form.category === cat.value ? cat.color : "var(--border-light)"}` }}>
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{ color: "var(--text-hint)" }}>Title *</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Bracelet scam near Times Square"
            className="w-full px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{ color: "var(--text-hint)" }}>What happened? *</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Describe what you saw or experienced in detail…"
            rows={4} className="w-full px-4 py-3 rounded-xl text-sm resize-none"
            style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{ color: "var(--text-hint)" }}>Location (optional)</label>
          <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
            placeholder="e.g. Near Times Square subway entrance"
            className="w-full px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
        </div>

        <button onClick={submit} disabled={!form.title.trim() || !form.description.trim() || loading}
          className="w-full py-4 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2"
          style={{ backgroundColor: "#DC2626", opacity: form.title.trim() && form.description.trim() ? 1 : 0.45 }}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
          Submit Report
        </button>
      </div>
    </div>
  );
}