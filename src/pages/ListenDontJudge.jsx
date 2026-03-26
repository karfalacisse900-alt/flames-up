import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { ChevronDown, ChevronUp, Flag, Bot, Send, Loader2, Share2, ShieldCheck, MapPin, AlertTriangle, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Golden Rules ──────────────────────────────────────────────────────────────
const RULES = [
  {
    id: "slow_down",
    step: "RULE 1",
    icon: "⏸️",
    title: "Slow Down",
    desc: "Scammers create urgency. If someone is rushing you, that's a red flag. Take a breath before you act.",
    detail: "Real opportunities don't disappear in 30 seconds. Whether it's a 'free gift', a deal, or someone asking for help — pressure is the scammer's #1 tool. Step back, think, and walk away if needed.",
  },
  {
    id: "spot_check",
    step: "RULE 2",
    icon: "🔍",
    title: "Spot Check",
    desc: "Look for signs. Does the situation feel off? Is someone too friendly? Are prices not shown? Trust your gut.",
    detail: "Ask yourself: Why is this stranger approaching me? Would a legitimate business operate this way? If something feels wrong, it probably is. Scammers rely on confusion and distraction.",
  },
  {
    id: "never_pay",
    step: "RULE 3",
    icon: "🛑",
    title: "Never Pay Unexpectedly",
    desc: "If you didn't agree to pay something upfront, don't. Surprise bills, 'free' items with fees, and cash demands are all scam tactics.",
    detail: "Whether it's a bracelet placed on your wrist, a CD forced into your hand, or a photo taken without asking — you owe nothing. Say 'No thank you' firmly and walk away. You are not obligated.",
  },
];

// ── Scam Data ─────────────────────────────────────────────────────────────────
const SCAMS = [
  { id: 1, cat: "street", emoji: "📿", title: "Fake Monk Bracelet", what: "Someone puts a bracelet on your wrist 'for free', then demands money.", avoid: "Never let strangers place anything on your body. Walk away firmly.", spots: ["Times Square", "Grand Central"] },
  { id: 2, cat: "street", emoji: "💿", title: "CD / Mixtape Hustle", what: "Person hands you a CD, signs it, chats you up — then demands payment.", avoid: "Don't accept CDs or physical items from strangers.", spots: ["Times Square", "Herald Square"] },
  { id: 3, cat: "street", emoji: "📋", title: "Petition / Signature Trap", what: "Someone asks you to sign a petition, then pressures you for a cash donation.", avoid: "Don't stop for clipboard people. Donate online to verified orgs only.", spots: ["Midtown", "Union Square"] },
  { id: 4, cat: "street", emoji: "🎭", title: "Costumed Character Photo", what: "Elmo, Spider-Man, etc. offer free photos — then demand tips aggressively.", avoid: "Agree on price before any photo. It is never truly free.", spots: ["Times Square"] },
  { id: 5, cat: "street", emoji: "🃏", title: "3-Card Monte", what: "A street card game that looks easy to win. It's always rigged with a hired crowd.", avoid: "Never play street gambling games. The house always wins.", spots: ["Midtown", "Penn Station area"] },
  { id: 6, cat: "street", emoji: "💍", title: '"Found Ring" Trick', what: "Stranger 'finds' a ring near you and offers to sell it cheap. It's fake jewelry.", avoid: "Ignore it. Don't engage or make eye contact.", spots: ["Midtown", "Lower Manhattan"] },
  { id: 7, cat: "street", emoji: "🎁", title: "Free Gift Trap", what: "Stranger gives a gift to your child or you 'for free', then pressures you to pay.", avoid: "Politely decline anything offered for free by strangers.", spots: ["Tourist areas"] },
  { id: 8, cat: "street", emoji: "🪣", title: "Fake Charity Collectors", what: "Collecting for 'kids' or 'schools' with no real organization behind them.", avoid: "Only donate online to verified charities.", spots: ["Busy intersections"] },
  { id: 9, cat: "transit", emoji: "🚇", title: "Subway Swipe Scam", what: "Person offers to swipe you in cheaper using a stolen or invalid MetroCard.", avoid: "Always use your own payment. Using a stolen card is illegal for you too.", spots: ["Busy subway stations"] },
  { id: 10, cat: "transit", emoji: "🚗", title: "Fake Uber / Ride Pickup", what: "Someone near an airport pretends to be your Uber driver.", avoid: "Always verify license plate, car model, and driver photo in the app.", spots: ["JFK", "LaGuardia", "Penn Station"] },
  { id: 11, cat: "transit", emoji: "🚕", title: "Broken Taxi Meter", what: "Driver claims meter is broken and charges a random high price.", avoid: "Insist on the meter or agree price before the ride. Exit if refused.", spots: ["Airports", "Midtown"] },
  { id: 12, cat: "transit", emoji: "🅿️", title: "Fake Parking Attendant", what: "Unofficial person guides you to park, then demands cash.", avoid: "Only pay official machines or marked attendant booths.", spots: ["Brooklyn", "Queens"] },
  { id: 13, cat: "tickets", emoji: "🎟️", title: "Fake Event Tickets", what: "Scalpers outside venues sell fake or invalid tickets.", avoid: "Buy only from official box offices or verified apps.", spots: ["MSG", "Barclays Center", "Broadway"] },
  { id: 14, cat: "tickets", emoji: "🏠", title: "Fake Apartment Rental", what: "Cheap listing online asking for deposit before you can view the place.", avoid: "Never pay before viewing in person. Use verified platforms only.", spots: ["Online listings"] },
  { id: 15, cat: "tickets", emoji: "🍺", title: "Bar Overcharge Scam", what: "Prices not shown clearly. You get hit with a huge bill at the end.", avoid: "Always ask for the price before ordering. Check the bill.", spots: ["Lower East Side", "Meatpacking District"] },
  { id: 16, cat: "theft", emoji: "🏧", title: "ATM Distraction Theft", what: "Someone distracts you at an ATM while an accomplice steals your card or cash.", avoid: "Use ATMs in well-lit areas. Cover your PIN. Don't engage strangers.", spots: ["Busy ATM locations"] },
  { id: 17, cat: "theft", emoji: "📱", title: "Phone Snatch Setup", what: "Someone bumps you while another grabs your phone in crowds.", avoid: "Keep phone in pocket in crowded areas. Be aware of distractions.", spots: ["Times Square", "Subway", "Concerts"] },
  { id: 18, cat: "theft", emoji: "☎️", title: '"Can I Use Your Phone?"', what: "Stranger asks to borrow your phone urgently, then runs away with it.", avoid: "Never hand your phone to a stranger. Offer to dial for them instead.", spots: ["Tourist areas"] },
  { id: 19, cat: "theft", emoji: "🤝", title: "Overfriendly Stranger Setup", what: "An extremely friendly stranger builds trust quickly, then scams you.", avoid: "Be polite but cautious. Genuine locals don't approach tourists this way.", spots: ["Times Square", "Central Park"] },
  { id: 20, cat: "street", emoji: "🎪", title: "Street Performer Pressure", what: "Performers ask aggressively for tips after uninvited performances.", avoid: "You are not obligated to tip. Move on without engaging.", spots: ["Times Square", "Subway stations"] },
];

const CATS = [
  { value: "all", label: "All Scams", color: "#1C1C1E" },
  { value: "street", label: "Street", color: "#EA580C" },
  { value: "transit", label: "Transit", color: "#2563EB" },
  { value: "tickets", label: "Tickets & Online", color: "#7C3AED" },
  { value: "theft", label: "Theft", color: "#DC2626" },
];

export default function ListenDontJudge() {
  const [user, setUser] = useState(null);
  const [activeCat, setActiveCat] = useState("all");
  const [expandedScam, setExpandedScam] = useState(null);
  const [expandedRule, setExpandedRule] = useState(null);
  const [activeTab, setActiveTab] = useState("scams"); // scams | map | ai | report

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const filtered = activeCat === "all" ? SCAMS : SCAMS.filter(s => s.cat === activeCat);

  const share = () => {
    if (navigator.share) navigator.share({ title: "Stay Safe NYC", text: "Know the most common NYC scams and how to avoid them. Stay safe!" });
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "#FAFAF7", fontFamily: "var(--font-sans)" }}>
      {/* Sticky Tab Bar */}
      <div className="sticky top-0 z-30" style={{ backgroundColor: "rgba(250,250,247,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid #E5E5E0" }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex gap-1">
          {[
            { id: "scams", label: "Scams" },
            { id: "rules", label: "3 Rules" },
            { id: "map", label: "Map" },
            { id: "ai", label: "Ask AI" },
            { id: "report", label: "Report" },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
              style={{ backgroundColor: activeTab === tab.id ? "#1C1C1E" : "transparent", color: activeTab === tab.id ? "#fff" : "#6B7280" }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SCAMS TAB */}
      {activeTab === "scams" && (
        <div className="max-w-2xl mx-auto px-4">
          {/* Hero */}
          <div className="pt-8 pb-6 text-center">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#EA580C" }}>NYC Safety Alerts</p>
            <h1 className="text-3xl font-black leading-tight mb-3" style={{ color: "#1C1C1E", fontFamily: "var(--font-serif)", letterSpacing: "-0.03em" }}>
              No matter the scam, <span style={{ textDecoration: "underline", textDecorationStyle: "wavy", textDecorationColor: "#FBBF24" }}>know the signs</span> to stay safe in NYC.
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>
              Protect yourself and others from common street scams, transit tricks, and tourist traps across New York City.
            </p>
          </div>

          {/* Category chips */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-4 px-4">
            {CATS.map(cat => (
              <button key={cat.value} onClick={() => setActiveCat(cat.value)}
                className="shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all"
                style={{ backgroundColor: activeCat === cat.value ? cat.color : "#F3F4F6", color: activeCat === cat.value ? "#fff" : "#374151", border: "none" }}>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Scam Cards — ScamSpotter style */}
          <div className="space-y-0 mb-6" style={{ border: "1.5px solid #E5E5E0", borderRadius: 20, overflow: "hidden" }}>
            {filtered.map((scam, idx) => {
              const isExp = expandedScam === scam.id;
              const catColor = CATS.find(c => c.value === scam.cat)?.color || "#1C1C1E";
              return (
                <div key={scam.id} style={{ borderTop: idx === 0 ? "none" : "1px solid #E5E5E0", backgroundColor: "#fff" }}>
                  <button className="w-full text-left px-5 py-4" onClick={() => setExpandedScam(isExp ? null : scam.id)}>
                    <div className="flex items-start gap-4">
                      {/* Check + Icon column */}
                      <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{ backgroundColor: "#F9FAFB" }}>
                          {scam.emoji}
                        </div>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: catColor }}>
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: catColor }}>{scam.cat}</p>
                        <p className="font-black text-base leading-snug mb-1" style={{ color: "#1C1C1E", fontFamily: "var(--font-serif)" }}>{scam.title}</p>
                        <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>{scam.what}</p>
                        <div className="flex items-center gap-1 mt-2" style={{ color: catColor }}>
                          <span className="text-xs font-bold">Read more</span>
                          {isExp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    </div>
                  </button>
                  <AnimatePresence>
                    {isExp && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                        <div className="px-5 pb-5 ml-12" style={{ borderTop: "1px dashed #E5E5E0" }}>
                          <div className="pt-4 space-y-3">
                            <div className="p-3 rounded-2xl" style={{ backgroundColor: "#FEF9C3" }}>
                              <p className="text-xs font-bold mb-1" style={{ color: "#92400E" }}>⚠️ What happens</p>
                              <p className="text-sm leading-relaxed" style={{ color: "#78350F" }}>{scam.what}</p>
                            </div>
                            <div className="p-3 rounded-2xl" style={{ backgroundColor: "#F0FDF4" }}>
                              <p className="text-xs font-bold mb-1" style={{ color: "#166534" }}>✅ How to avoid it</p>
                              <p className="text-sm leading-relaxed" style={{ color: "#15803D" }}>{scam.avoid}</p>
                            </div>
                            {scam.spots?.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {scam.spots.map(s => (
                                  <span key={s} className="text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1" style={{ backgroundColor: "#F3F4F6", color: "#374151" }}>
                                    <MapPin className="w-2.5 h-2.5" /> {s}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Share CTA */}
          <button onClick={share}
            className="w-full py-4 rounded-2xl text-sm font-bold text-white mb-8 flex items-center justify-center gap-2"
            style={{ backgroundColor: "#1C1C1E" }}>
            <Share2 className="w-4 h-4" />
            SHARE THESE TIPS
          </button>
        </div>
      )}

      {/* 3 RULES TAB */}
      {activeTab === "rules" && (
        <div className="max-w-2xl mx-auto px-4">
          <div className="pt-8 pb-6 text-center">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#EA580C" }}>The Foundation</p>
            <h1 className="text-3xl font-black leading-tight mb-3" style={{ color: "#1C1C1E", fontFamily: "var(--font-serif)", letterSpacing: "-0.03em" }}>
              No matter the scheme, we can <span style={{ textDecoration: "underline", textDecorationStyle: "wavy", textDecorationColor: "#FBBF24" }}>apply</span> the three golden rules to spot the scam.
            </h1>
          </div>

          <div className="space-y-0 mb-8" style={{ border: "1.5px solid #E5E5E0", borderRadius: 20, overflow: "hidden" }}>
            {RULES.map((rule, idx) => {
              const isExp = expandedRule === rule.id;
              return (
                <div key={rule.id} style={{ borderTop: idx === 0 ? "none" : "1px solid #E5E5E0", backgroundColor: "#fff" }}>
                  <button className="w-full text-left px-5 py-5" onClick={() => setExpandedRule(isExp ? null : rule.id)}>
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: "#F9FAFB" }}>
                          {rule.icon}
                        </div>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: "#FBBF24" }}>
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "#FBBF24" }}>{rule.step}</p>
                        <p className="font-black text-xl leading-snug mb-1" style={{ color: "#1C1C1E", fontFamily: "var(--font-serif)" }}>{rule.title}</p>
                        <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>{rule.desc}</p>
                        <div className="flex items-center gap-1 mt-2" style={{ color: "#FBBF24" }}>
                          <span className="text-xs font-bold">Read more</span>
                          {isExp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    </div>
                  </button>
                  <AnimatePresence>
                    {isExp && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                        <div className="px-5 pb-5 ml-14" style={{ borderTop: "1px dashed #E5E5E0" }}>
                          <p className="pt-4 text-sm leading-relaxed" style={{ color: "#374151" }}>{rule.detail}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          <button onClick={share}
            className="w-full py-4 rounded-2xl text-sm font-bold text-white mb-8 flex items-center justify-center gap-2"
            style={{ backgroundColor: "#1C1C1E" }}>
            <Share2 className="w-4 h-4" />
            SHARE THESE TIPS
          </button>
        </div>
      )}

      {/* MAP TAB */}
      {activeTab === "map" && <ScamMap />}

      {/* AI TAB */}
      {activeTab === "ai" && <AIAssistant />}

      {/* REPORT TAB */}
      {activeTab === "report" && <ReportForm user={user} />}
    </div>
  );
}

// ── Scam Map ─────────────────────────────────────────────────────────────────
function ScamMap() {
  const [apiKey, setApiKey] = useState(null);
  const [ready, setReady] = useState(false);
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    base44.functions.invoke("googleMapsToken", {}).then(res => {
      if (mountedRef.current) setApiKey(res.data?.key || res.data);
    }).catch(() => {});
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!apiKey || !mapRef.current || mapInst.current) return;

    const init = async () => {
      if (!window.google?.maps) {
        await new Promise((resolve, reject) => {
          if (document.querySelector('script[src*="maps.googleapis.com"]')) { resolve(); return; }
          const s = document.createElement("script");
          s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
          s.async = true; s.defer = true;
          s.onload = resolve; s.onerror = reject;
          document.head.appendChild(s);
        });
      }
      if (!mountedRef.current || !mapRef.current) return;

      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 40.7549, lng: -73.984 },
        zoom: 13,
        disableDefaultUI: true,
        gestureHandling: "greedy",
        clickableIcons: false,
      });
      mapInst.current = map;

      // Cluster scams by location (group same lat/lng nearby)
      const placed = new Set();
      SCAMS.forEach(scam => {
        const catColor = { street: "#EA580C", transit: "#2563EB", tickets: "#7C3AED", theft: "#DC2626" }[scam.cat] || "#1C1C1E";
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44"><circle cx="22" cy="22" r="20" fill="${catColor}" stroke="white" stroke-width="3"/><text x="22" y="29" font-size="16" text-anchor="middle">${scam.emoji}</text></svg>`;
        const marker = new window.google.maps.Marker({
          position: { lat: scam.lat || 40.7549 + (scam.id * 0.0023 % 0.04 - 0.02), lng: scam.lng || -73.984 + (scam.id * 0.0031 % 0.04 - 0.02) },
          map,
          icon: { url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`, scaledSize: new window.google.maps.Size(44, 44), anchor: new window.google.maps.Point(22, 22) },
          title: scam.title,
          optimized: true,
        });
        const info = new window.google.maps.InfoWindow({
          content: `<div style="max-width:200px;padding:4px 0;font-family:sans-serif"><b style="font-size:13px">${scam.emoji} ${scam.title}</b><p style="font-size:11px;color:#555;margin:4px 0">${scam.what}</p><p style="font-size:11px;color:#16a34a;font-weight:600">✅ ${scam.avoid}</p></div>`,
        });
        marker.addListener("click", () => info.open(map, marker));
      });

      if (mountedRef.current) setReady(true);
    };

    init().catch(console.error);
  }, [apiKey]);

  return (
    <div style={{ height: "calc(100dvh - 108px)", position: "relative", overflow: "hidden" }}>
      {/* Map container — GPU-composited, never remounted */}
      <div
        ref={mapRef}
        style={{
          position: "absolute", inset: 0,
          transform: "translateZ(0)",
          willChange: "transform",
          backfaceVisibility: "hidden",
        }}
      />
      {/* Legend overlay */}
      {ready && (
        <div style={{ position: "absolute", bottom: 16, left: 12, right: 12, zIndex: 10, pointerEvents: "none" }}>
          <div className="rounded-2xl p-3 flex flex-wrap gap-x-4 gap-y-1.5"
            style={{ backgroundColor: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
            <p className="w-full text-xs font-bold mb-0.5" style={{ color: "#1C1C1E" }}>🗺️ Tap a pin to see scam details</p>
            {[{ c: "#EA580C", l: "Street" }, { c: "#2563EB", l: "Transit" }, { c: "#7C3AED", l: "Tickets" }, { c: "#DC2626", l: "Theft" }].map(item => (
              <div key={item.l} className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: "#374151" }}>
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.c }} /> {item.l}
              </div>
            ))}
          </div>
        </div>
      )}
      {!ready && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#FAFAF7", zIndex: 5 }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#EA580C" }} />
        </div>
      )}
    </div>
  );
}

// ── AI Assistant ──────────────────────────────────────────────────────────────
function AIAssistant() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "👋 Hi! I'm your NYC Safety Assistant.\n\nAsk me anything:\n• \"Is Times Square safe at night?\"\n• \"What scams happen near the subway?\"\n• \"How do I spot a ticket scam?\"" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const context = SCAMS.map(s => `${s.title}: ${s.what} Avoid: ${s.avoid}. Common at: ${s.spots?.join(", ")}.`).join("\n");

  const send = async () => {
    if (!input.trim() || loading) return;
    const q = input.trim();
    setInput("");
    setMessages(p => [...p, { role: "user", content: q }]);
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an NYC safety expert. Answer concisely using this scam database:\n\n${context}\n\nQuestion: ${q}`,
      });
      setMessages(p => [...p, { role: "assistant", content: res }]);
    } catch {
      setMessages(p => [...p, { role: "assistant", content: "Sorry, couldn't get a response. Please try again." }]);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: "calc(100dvh - 108px)" }}>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line"
              style={{
                backgroundColor: msg.role === "user" ? "#1C1C1E" : "#fff",
                color: msg.role === "user" ? "#fff" : "#1C1C1E",
                border: msg.role === "assistant" ? "1px solid #E5E5E0" : "none",
              }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl flex items-center gap-2" style={{ backgroundColor: "#fff", border: "1px solid #E5E5E0" }}>
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#EA580C" }} />
              <span className="text-sm" style={{ color: "#9CA3AF" }}>Thinking…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="px-4 py-3 flex gap-2" style={{ borderTop: "1px solid #E5E5E0", backgroundColor: "rgba(250,250,247,0.96)", backdropFilter: "blur(16px)" }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
          placeholder='Ask: "Is this area safe?"'
          className="flex-1 px-4 py-2.5 rounded-2xl text-sm outline-none"
          style={{ backgroundColor: "#F3F4F6", border: "1px solid #E5E5E0", color: "#1C1C1E" }} />
        <button onClick={send} disabled={!input.trim() || loading}
          className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: "#1C1C1E", opacity: input.trim() ? 1 : 0.35 }}>
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}

// ── Report Form ───────────────────────────────────────────────────────────────
function ReportForm({ user }) {
  const [form, setForm] = useState({ title: "", description: "", location: "", cat: "street" });
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.title.trim() || !form.description.trim()) return;
    setLoading(true);
    await base44.entities.Report.create({
      content_type: "user", content_id: "scam_report",
      reason: `[${form.cat}] ${form.title}: ${form.description} | Location: ${form.location}`,
      reporter_email: user?.email || "anonymous", status: "pending",
    });
    setLoading(false);
    setDone(true);
  };

  if (done) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="text-6xl mb-4">✅</div>
      <h3 className="text-2xl font-black mb-2" style={{ color: "#1C1C1E", fontFamily: "var(--font-serif)" }}>Report Submitted</h3>
      <p className="text-sm mb-6" style={{ color: "#6B7280" }}>Thank you for helping keep NYC safer. Our team will review your submission.</p>
      <button onClick={() => setDone(false)} className="px-8 py-3 rounded-2xl text-sm font-bold text-white" style={{ backgroundColor: "#1C1C1E" }}>Submit Another</button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
      <div className="pt-4 pb-2">
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#EA580C" }}>Community Report</p>
        <h2 className="text-2xl font-black" style={{ color: "#1C1C1E", fontFamily: "var(--font-serif)" }}>Report a Scam</h2>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Help others stay safe by reporting what you saw or experienced.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {[{ v: "street", l: "Street" }, { v: "transit", l: "Transit" }, { v: "tickets", l: "Tickets" }, { v: "theft", l: "Theft" }].map(c => (
          <button key={c.v} onClick={() => setForm(f => ({ ...f, cat: c.v }))}
            className="px-4 py-2 rounded-full text-xs font-bold"
            style={{ backgroundColor: form.cat === c.v ? "#1C1C1E" : "#F3F4F6", color: form.cat === c.v ? "#fff" : "#374151" }}>
            {c.l}
          </button>
        ))}
      </div>
      <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
        placeholder="Title (e.g. Bracelet scam near Times Square)"
        className="w-full px-4 py-3 rounded-2xl text-sm" style={{ backgroundColor: "#F3F4F6", border: "1px solid #E5E5E0", color: "#1C1C1E" }} />
      <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        placeholder="Describe what happened in detail…" rows={4}
        className="w-full px-4 py-3 rounded-2xl text-sm resize-none"
        style={{ backgroundColor: "#F3F4F6", border: "1px solid #E5E5E0", color: "#1C1C1E" }} />
      <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
        placeholder="Location (optional, e.g. Times Square)"
        className="w-full px-4 py-3 rounded-2xl text-sm" style={{ backgroundColor: "#F3F4F6", border: "1px solid #E5E5E0", color: "#1C1C1E" }} />
      <button onClick={submit} disabled={!form.title.trim() || !form.description.trim() || loading}
        className="w-full py-4 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2"
        style={{ backgroundColor: "#1C1C1E", opacity: form.title.trim() && form.description.trim() ? 1 : 0.4 }}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
        SUBMIT REPORT
      </button>
    </div>
  );
}