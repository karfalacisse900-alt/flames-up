import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { ChevronDown, ChevronUp, Flag, Send, Loader2, Share2, Check, X, MapPin, Bell, BellOff, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── High-risk zones for geolocation alerts ────────────────────────────────────
const HIGH_RISK_ZONES = [
  { name: "Times Square", lat: 40.758, lng: -73.9855, radius: 0.4, scams: ["Costumed Character Photo", "CD / Mixtape Hustle", "Fake Monk Bracelet", "Phone Snatch Setup"] },
  { name: "Grand Central Terminal", lat: 40.7527, lng: -73.9772, radius: 0.3, scams: ["Fake Monk Bracelet", "Petition / Signature Trap"] },
  { name: "Penn Station", lat: 40.7506, lng: -73.9936, radius: 0.3, scams: ["3-Card Monte", "Fake Uber / Ride Pickup"] },
  { name: "Brooklyn Bridge", lat: 40.7061, lng: -73.9969, radius: 0.35, scams: ["Fake Monk Bracelet", '"Found Ring" Trick'] },
  { name: "Central Park South", lat: 40.7673, lng: -73.9764, radius: 0.4, scams: ["Overfriendly Stranger Setup", "Street Performer Pressure"] },
  { name: "Union Square", lat: 40.7359, lng: -73.9911, radius: 0.3, scams: ["Petition / Signature Trap", "Fake Charity Collectors"] },
];

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Golden Rules ──────────────────────────────────────────────────────────────
const RULES = [
  { id: "slow_down", step: "RULE 1", icon: "⏸️", title: "Slow Down", desc: "Scammers create urgency. If someone is rushing you, that's a red flag.", detail: "Real opportunities don't disappear in 30 seconds. Whether it's a 'free gift', a deal, or someone asking for help — pressure is the scammer's #1 tool. Step back, think, and walk away if needed." },
  { id: "spot_check", step: "RULE 2", icon: "🔍", title: "Spot Check", desc: "Look for signs. Does the situation feel off? Trust your gut.", detail: "Ask yourself: Why is this stranger approaching me? Would a legitimate business operate this way? If something feels wrong, it probably is. Scammers rely on confusion and distraction." },
  { id: "never_pay", step: "RULE 3", icon: "🛑", title: "Never Pay Unexpectedly", desc: "If you didn't agree to pay something upfront, don't. Surprise bills are a scam tactic.", detail: "Whether it's a bracelet placed on your wrist, a CD forced into your hand, or a photo taken without asking — you owe nothing. Say 'No thank you' firmly and walk away." },
];

// ── Scam Data ─────────────────────────────────────────────────────────────────
const SCAMS = [
  { id: 1, cat: "street", emoji: "📿", title: "Fake Monk Bracelet", what: "Someone puts a bracelet on your wrist 'for free', then aggressively demands money.", avoid: "Never let strangers place anything on your body. Say 'No thank you' firmly and walk away immediately.", spots: ["Times Square", "Grand Central"] },
  { id: 2, cat: "street", emoji: "💿", title: "CD / Mixtape Hustle", what: "Person hands you a CD, signs it, chats you up — then pressures you to pay for it.", avoid: "Don't accept CDs or physical items from strangers on the street. Keep walking.", spots: ["Times Square", "Herald Square"] },
  { id: 3, cat: "street", emoji: "📋", title: "Petition / Signature Trap", what: "Someone asks you to sign a petition for a cause, then pressures you for a cash donation.", avoid: "Don't stop for clipboard people. If you want to donate, do it online to verified orgs.", spots: ["Midtown", "Union Square"] },
  { id: 4, cat: "street", emoji: "🎭", title: "Costumed Character Photo", what: "People in costumes (Elmo, Spider-Man) offer free photos — then demand large tips or get aggressive.", avoid: "Only take photos if you've agreed on a price beforehand. It is never truly free.", spots: ["Times Square"] },
  { id: 5, cat: "street", emoji: "🃏", title: "3-Card Monte", what: "A street card game that looks easy to win. It's always rigged with a hired crowd.", avoid: "Never play street gambling games. The house always wins, no exceptions.", spots: ["Midtown", "Penn Station area"] },
  { id: 6, cat: "street", emoji: "💍", title: '"Found Ring" Trick', what: "Stranger 'finds' a ring near you and offers to sell it cheap. It's fake jewelry.", avoid: "Ignore it completely. Don't engage or make eye contact.", spots: ["Midtown", "Lower Manhattan"] },
  { id: 7, cat: "street", emoji: "🎁", title: "Free Gift Trap", what: "Stranger gives a gift to your child or you 'for free', then pressures you to pay.", avoid: "Politely decline anything offered for free by strangers on the street.", spots: ["Tourist areas"] },
  { id: 8, cat: "street", emoji: "🪣", title: "Fake Charity Collectors", what: "People collecting for 'kids' or 'schools' with no real organization behind them.", avoid: "Only donate online to verified charities. Ask for official credentials if unsure.", spots: ["Busy intersections", "Shopping areas"] },
  { id: 9, cat: "street", emoji: "🎪", title: "Street Performer Pressure", what: "Performers ask aggressively for tips after uninvited performances near you.", avoid: "You are not obligated to tip. Move on confidently without engaging.", spots: ["Times Square", "Subway stations"] },
  { id: 10, cat: "transit", emoji: "🚇", title: "Subway Swipe Scam", what: "Person offers to swipe you into the subway cheaper using a stolen or invalid MetroCard.", avoid: "Always use your own payment. Using a stolen card is also illegal for the passenger.", spots: ["Busy subway stations"] },
  { id: 11, cat: "transit", emoji: "🚗", title: "Fake Uber / Ride Pickup", what: "Someone near an airport or venue pretends to be your Uber or Lyft driver.", avoid: "Always verify license plate, car model, and driver photo in your app before getting in.", spots: ["JFK", "LaGuardia", "Penn Station"] },
  { id: 12, cat: "transit", emoji: "🚕", title: "Broken Taxi Meter", what: "Driver claims meter is broken and charges a high random price at destination.", avoid: "Insist on using the meter or agree on price before the ride. Exit immediately if refused.", spots: ["Airports", "Midtown"] },
  { id: 13, cat: "transit", emoji: "🅿️", title: "Fake Parking Attendant", what: "Unofficial person guides you to park, then demands cash payment.", avoid: "Only pay official parking meters or clearly marked attendant booths.", spots: ["Brooklyn", "Queens"] },
  { id: 14, cat: "tickets", emoji: "🎟️", title: "Fake Event Tickets", what: "Scalpers outside venues sell fake or invalid tickets at discounted prices.", avoid: "Buy only from official box offices or verified apps like Ticketmaster.", spots: ["MSG", "Barclays Center", "Broadway"] },
  { id: 15, cat: "tickets", emoji: "🏠", title: "Fake Apartment Rental", what: "Cheap listing online asking for deposit before you can view the place.", avoid: "Never pay before viewing in person. Use only verified rental platforms.", spots: ["Online listings"] },
  { id: 16, cat: "tickets", emoji: "🍺", title: "Bar Overcharge Scam", what: "Prices not shown clearly. You get hit with a huge bill at the end.", avoid: "Always ask for the price before ordering. Check the bill item by item.", spots: ["Lower East Side", "Meatpacking District"] },
  { id: 17, cat: "theft", emoji: "🏧", title: "ATM Distraction Theft", what: "Someone distracts you at an ATM while an accomplice steals your card or cash.", avoid: "Use ATMs in well-lit areas. Don't engage strangers. Always cover your PIN.", spots: ["Busy ATM locations"] },
  { id: 18, cat: "theft", emoji: "📱", title: "Phone Snatch Setup", what: "Someone bumps into you while another grabs your phone in a crowd.", avoid: "Keep phone in your pocket in crowded areas. Be aware of deliberate distractions.", spots: ["Times Square", "Subway", "Concerts"] },
  { id: 19, cat: "theft", emoji: "☎️", title: '"Can I Use Your Phone?"', what: "Stranger asks urgently to borrow your phone, then runs away with it.", avoid: "Never hand your phone to a stranger. Offer to dial the number for them instead.", spots: ["Tourist areas"] },
  { id: 20, cat: "theft", emoji: "🤝", title: "Overfriendly Stranger Setup", what: "An overly friendly stranger builds quick trust, then scams or steals from you.", avoid: "Be polite but cautious. Genuine locals rarely approach tourists with unusual urgency.", spots: ["Times Square", "Central Park"] },
];

const CATS = [
  { value: "all", label: "All", color: "#1C1C1E" },
  { value: "street", label: "Street", color: "#EA580C" },
  { value: "transit", label: "Transit", color: "#2563EB" },
  { value: "tickets", label: "Tickets", color: "#7C3AED" },
  { value: "theft", label: "Theft", color: "#DC2626" },
];

export default function ListenDontJudge() {
  const [user, setUser] = useState(null);
  const [activeCat, setActiveCat] = useState("all");
  const [selectedScam, setSelectedScam] = useState(null);
  const [expandedRule, setExpandedRule] = useState(null);
  const [activeTab, setActiveTab] = useState("scams");
  const [geoAlert, setGeoAlert] = useState(null); // { zone, scams }
  const [notifPermission, setNotifPermission] = useState("default");
  const alertedZonesRef = useRef(new Set());

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    if ("Notification" in window) setNotifPermission(Notification.permission);
  }, []);

  // Geolocation proximity check
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(pos => {
      const { latitude, longitude } = pos.coords;
      HIGH_RISK_ZONES.forEach(zone => {
        const dist = haversineKm(latitude, longitude, zone.lat, zone.lng);
        if (dist <= zone.radius && !alertedZonesRef.current.has(zone.name)) {
          alertedZonesRef.current.add(zone.name);
          setGeoAlert({ zone: zone.name, scams: zone.scams });
          // Push notification
          if (Notification.permission === "granted") {
            new Notification(`⚠️ Scam Alert: ${zone.name}`, {
              body: `Watch out for: ${zone.scams.join(", ")}. Stay aware!`,
              icon: "/favicon.ico",
            });
          }
        }
      });
    }, null, { enableHighAccuracy: false, maximumAge: 30000 });
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const requestNotifPermission = async () => {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
  };

  const filtered = activeCat === "all" ? SCAMS : SCAMS.filter(s => s.cat === activeCat);

  const share = () => {
    if (navigator.share) navigator.share({ title: "Stay Safe NYC", text: "Know the most common NYC scams and how to avoid them!" });
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "#FAFAF7" }}>
      {/* Geo Alert Banner */}
      <AnimatePresence>
        {geoAlert && (
          <motion.div initial={{ y: -80 }} animate={{ y: 0 }} exit={{ y: -80 }}
            className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-start gap-3"
            style={{ backgroundColor: "#DC2626", color: "#fff" }}>
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold">⚠️ Scam alert: {geoAlert.zone}</p>
              <p className="text-xs opacity-90">Watch for: {geoAlert.scams.slice(0, 2).join(", ")}…</p>
            </div>
            <button onClick={() => setGeoAlert(null)} className="p-1" style={{ minWidth: 28, minHeight: 28 }}>
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Tab Bar */}
      <div className="sticky top-0 z-30" style={{ backgroundColor: "rgba(250,250,247,0.96)", backdropFilter: "blur(20px)", borderBottom: "1px solid #E5E5E0" }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex gap-1">
          {[
            { id: "scams", label: "Scams" },
            { id: "rules", label: "3 Rules" },
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
          <div className="pt-8 pb-5 text-center">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#EA580C" }}>NYC Safety Alerts & Scam Awareness</p>
            <h1 className="text-3xl font-black leading-tight mb-3" style={{ color: "#1C1C1E", fontFamily: "var(--font-serif)", letterSpacing: "-0.03em" }}>
              No matter the scheme, we can <span style={{ borderBottom: "3px solid #FBBF24" }}>spot the scam.</span>
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>
              Tap any scam below to learn what happens and how to protect yourself.
            </p>
          </div>

          {/* Notification permission prompt */}
          {notifPermission !== "granted" && (
            <button onClick={requestNotifPermission}
              className="w-full mb-4 p-3 rounded-2xl flex items-center gap-3 text-left"
              style={{ backgroundColor: "#FEF3C7", border: "1px solid #FCD34D" }}>
              <Bell className="w-5 h-5 shrink-0" style={{ color: "#92400E" }} />
              <div className="flex-1">
                <p className="text-xs font-bold" style={{ color: "#92400E" }}>Enable scam zone alerts</p>
                <p className="text-xs" style={{ color: "#B45309" }}>Get notified when you enter a high-risk area</p>
              </div>
              <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ backgroundColor: "#92400E", color: "#fff" }}>Enable</span>
            </button>
          )}
          {notifPermission === "granted" && (
            <div className="w-full mb-4 p-3 rounded-2xl flex items-center gap-3"
              style={{ backgroundColor: "#F0FDF4", border: "1px solid #86EFAC" }}>
              <Bell className="w-4 h-4 shrink-0" style={{ color: "#16A34A" }} />
              <p className="text-xs font-semibold" style={{ color: "#166534" }}>📍 Scam zone alerts are active — you'll be notified near high-risk areas.</p>
            </div>
          )}

          {/* Category chips */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-3 -mx-4 px-4">
            {CATS.map(cat => (
              <button key={cat.value} onClick={() => setActiveCat(cat.value)}
                className="shrink-0 px-4 py-2 rounded-full text-xs font-bold"
                style={{ backgroundColor: activeCat === cat.value ? cat.color : "#F3F4F6", color: activeCat === cat.value ? "#fff" : "#374151" }}>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Scam Cards — horizontal box layout */}
          <div className="space-y-2 mb-6">
            {filtered.map((scam) => {
              const catColor = CATS.find(c => c.value === scam.cat)?.color || "#1C1C1E";
              return (
                <button key={scam.id} onClick={() => setSelectedScam(scam)}
                  className="w-full text-left rounded-2xl flex items-center gap-4 px-4 py-4 transition-all active:scale-98"
                  style={{ backgroundColor: "#fff", border: "1.5px solid #E5E5E0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                  {/* Left: icon */}
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                    style={{ backgroundColor: `${catColor}14` }}>
                    {scam.emoji}
                  </div>
                  {/* Middle: text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: catColor }}>{scam.cat}</p>
                    </div>
                    <p className="font-black text-sm leading-snug" style={{ color: "#1C1C1E", fontFamily: "var(--font-serif)" }}>{scam.title}</p>
                    <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "#9CA3AF" }}>{scam.what}</p>
                  </div>
                  {/* Right: check + arrow */}
                  <div className="flex flex-col items-center gap-1.5 shrink-0">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: catColor }}>
                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                    </div>
                    <p className="text-[10px] font-bold" style={{ color: catColor }}>Read more</p>
                  </div>
                </button>
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
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#EA580C" }}>The Foundation</p>
            <h1 className="text-3xl font-black leading-tight mb-3" style={{ color: "#1C1C1E", fontFamily: "var(--font-serif)", letterSpacing: "-0.03em" }}>
              No matter the scheme, <span style={{ borderBottom: "3px solid #FBBF24" }}>apply these three rules.</span>
            </h1>
          </div>
          <div className="space-y-2 mb-8">
            {RULES.map((rule) => {
              const isExp = expandedRule === rule.id;
              return (
                <div key={rule.id} className="rounded-2xl overflow-hidden"
                  style={{ backgroundColor: "#fff", border: "1.5px solid #E5E5E0" }}>
                  <button className="w-full text-left flex items-center gap-4 px-4 py-4" onClick={() => setExpandedRule(isExp ? null : rule.id)}>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: "#FEFCE8" }}>
                      {rule.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "#FBBF24" }}>{rule.step}</p>
                      <p className="font-black text-sm" style={{ color: "#1C1C1E", fontFamily: "var(--font-serif)" }}>{rule.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{rule.desc}</p>
                    </div>
                    <div className="shrink-0">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center mb-1" style={{ backgroundColor: "#FBBF24" }}>
                        <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                      </div>
                      <p className="text-[10px] font-bold text-center" style={{ color: "#FBBF24" }}>
                        {isExp ? "Less" : "More"}
                      </p>
                    </div>
                  </button>
                  <AnimatePresence>
                    {isExp && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                        <div className="px-4 pb-4 pt-1" style={{ borderTop: "1px dashed #E5E5E0" }}>
                          <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>{rule.detail}</p>
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

      {/* AI TAB */}
      {activeTab === "ai" && <AIAssistant />}

      {/* REPORT TAB */}
      {activeTab === "report" && <ReportForm user={user} />}

      {/* Scam Detail Modal */}
      <AnimatePresence>
        {selectedScam && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
            onClick={() => setSelectedScam(null)}>
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="w-full max-w-2xl rounded-t-3xl overflow-hidden"
              style={{ backgroundColor: "#fff", maxHeight: "90dvh", overflowY: "auto" }}
              onClick={e => e.stopPropagation()}>
              {/* Modal header */}
              <div className="sticky top-0 flex items-center justify-between px-5 pt-5 pb-4"
                style={{ backgroundColor: "#fff", borderBottom: "1px solid #F3F4F6" }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${CATS.find(c => c.value === selectedScam.cat)?.color}14` }}>
                    {selectedScam.emoji}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: CATS.find(c => c.value === selectedScam.cat)?.color }}>
                      {selectedScam.cat}
                    </p>
                    <p className="font-black text-lg leading-tight" style={{ color: "#1C1C1E", fontFamily: "var(--font-serif)" }}>{selectedScam.title}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedScam(null)}
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "#F3F4F6" }}>
                  <X className="w-4 h-4" style={{ color: "#6B7280" }} />
                </button>
              </div>

              {/* Modal body */}
              <div className="px-5 py-5 space-y-4">
                <div className="rounded-2xl p-4" style={{ backgroundColor: "#FFFBEB" }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#92400E" }}>⚠️ What Happens</p>
                  <p className="text-sm leading-relaxed" style={{ color: "#78350F" }}>{selectedScam.what}</p>
                </div>
                <div className="rounded-2xl p-4" style={{ backgroundColor: "#F0FDF4" }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#166534" }}>✅ How to Avoid It</p>
                  <p className="text-sm leading-relaxed" style={{ color: "#15803D" }}>{selectedScam.avoid}</p>
                </div>
                {selectedScam.spots?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#6B7280" }}>📍 Common Locations</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedScam.spots.map(s => (
                        <span key={s} className="text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5"
                          style={{ backgroundColor: "#F3F4F6", color: "#374151" }}>
                          <MapPin className="w-3 h-3" /> {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="rounded-2xl p-4" style={{ backgroundColor: "#EFF6FF" }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#1D4ED8" }}>💡 Golden Rule</p>
                  <p className="text-sm" style={{ color: "#1E40AF" }}>Slow down. Spot the signs. Never pay unexpectedly.</p>
                </div>
                <button onClick={() => { if (navigator.share) navigator.share({ title: selectedScam.title, text: `Watch out for: ${selectedScam.title}. ${selectedScam.avoid}` }); }}
                  className="w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 mt-2"
                  style={{ backgroundColor: "#1C1C1E" }}>
                  <Share2 className="w-4 h-4" /> Share this tip
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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

  const context = SCAMS.map(s => `${s.title}: ${s.what} Avoid: ${s.avoid}. Spots: ${s.spots?.join(", ")}.`).join("\n");

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
              style={{ backgroundColor: msg.role === "user" ? "#1C1C1E" : "#fff", color: msg.role === "user" ? "#fff" : "#1C1C1E", border: msg.role === "assistant" ? "1px solid #E5E5E0" : "none" }}>
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
      <p className="text-sm mb-6" style={{ color: "#6B7280" }}>Thank you for helping keep NYC safer.</p>
      <button onClick={() => setDone(false)} className="px-8 py-3 rounded-2xl text-sm font-bold text-white" style={{ backgroundColor: "#1C1C1E" }}>Submit Another</button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
      <div className="pt-4 pb-2">
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#EA580C" }}>Community Report</p>
        <h2 className="text-2xl font-black" style={{ color: "#1C1C1E", fontFamily: "var(--font-serif)" }}>Report a Scam</h2>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Help others stay safe by sharing what you experienced.</p>
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
        placeholder="Location (optional)"
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