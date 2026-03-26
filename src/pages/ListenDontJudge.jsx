import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { ChevronDown, ChevronUp, Flag, Bot, Send, Loader2, Share2, X, Check, MapPin, Bell, BellOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Data ──────────────────────────────────────────────────────────────────────
const RULES = [
  { id: "slow", step: "RULE 1", icon: "⏸️", title: "Slow Down", desc: "Scammers create urgency. If someone is rushing you, that's a red flag. Take a breath before you act.", detail: "Real opportunities don't disappear in 30 seconds. Whether it's a 'free gift', a deal, or someone asking for help — pressure is the scammer's #1 tool. Step back, think, and walk away if needed." },
  { id: "check", step: "RULE 2", icon: "🔍", title: "Spot Check", desc: "Look for signs. Does the situation feel off? Is someone too friendly? Trust your gut.", detail: "Ask yourself: Why is this stranger approaching me? Would a legitimate business operate this way? If something feels wrong, it probably is. Scammers rely on confusion and distraction." },
  { id: "pay", step: "RULE 3", icon: "🛑", title: "Never Pay Unexpectedly", desc: "If you didn't agree to pay something upfront, don't. Surprise bills and cash demands are scam tactics.", detail: "Whether it's a bracelet placed on your wrist, a CD forced into your hand, or a photo taken without asking — you owe nothing. Say 'No thank you' firmly and walk away." },
];

const SCAMS = [
  { id: 1, cat: "street", emoji: "📿", title: "Fake Monk Bracelet", what: "Someone puts a bracelet on your wrist 'for free', then demands money aggressively.", avoid: "Never let strangers place anything on your body. Walk away firmly and say 'No thank you'.", spots: ["Times Square", "Grand Central"], lat: 40.758, lng: -73.9855 },
  { id: 2, cat: "street", emoji: "💿", title: "CD / Mixtape Hustle", what: "Person hands you a CD, signs it, chats you up — then demands payment.", avoid: "Don't accept CDs or physical items from strangers. Keep walking.", spots: ["Times Square", "Herald Square"], lat: 40.756, lng: -73.989 },
  { id: 3, cat: "street", emoji: "📋", title: "Petition / Signature Trap", what: "Someone asks you to sign a petition, then pressures you for a cash donation.", avoid: "Don't stop for clipboard people. Donate online to verified orgs only.", spots: ["Midtown", "Union Square"], lat: 40.7359, lng: -73.9911 },
  { id: 4, cat: "street", emoji: "🎭", title: "Costumed Character Photo", what: "Elmo, Spider-Man, etc. offer free photos — then demand large tips aggressively.", avoid: "Agree on price before any photo. It is never truly free.", spots: ["Times Square"], lat: 40.758, lng: -73.9855 },
  { id: 5, cat: "street", emoji: "🃏", title: "3-Card Monte", what: "A street card game that looks easy to win. It's always rigged with a hired crowd.", avoid: "Never play street gambling games. The house always wins.", spots: ["Midtown", "Penn Station area"], lat: 40.7506, lng: -73.9936 },
  { id: 6, cat: "street", emoji: "💍", title: '"Found Ring" Trick', what: "Stranger 'finds' a ring near you and offers to sell it cheap. It's always fake jewelry.", avoid: "Ignore it completely. Don't engage or make eye contact.", spots: ["Midtown", "Lower Manhattan"], lat: 40.7127, lng: -74.0059 },
  { id: 7, cat: "street", emoji: "🎁", title: "Free Gift Trap", what: "Stranger gives a gift to your child or you 'for free', then pressures you to pay.", avoid: "Politely decline anything offered for free by strangers on the street.", spots: ["Tourist areas"], lat: 40.754, lng: -73.984 },
  { id: 8, cat: "street", emoji: "🪣", title: "Fake Charity Collectors", what: "Collecting for 'kids' or 'schools' with no real registered organization.", avoid: "Only donate online to verified charities. Ask for official credentials.", spots: ["Busy intersections"], lat: 40.748, lng: -73.985 },
  { id: 9, cat: "street", emoji: "🎪", title: "Street Performer Pressure", what: "Performers demand large tips after uninvited performances near you.", avoid: "You are not obligated to tip. Move on without engaging.", spots: ["Times Square", "Subway stations"], lat: 40.758, lng: -73.9855 },
  { id: 10, cat: "transit", emoji: "🚇", title: "Subway Swipe Scam", what: "Person offers to swipe you in cheaper using a stolen or invalid MetroCard.", avoid: "Always use your own payment. Using a stolen card is also illegal for you.", spots: ["Busy subway stations"], lat: 40.7506, lng: -73.9971 },
  { id: 11, cat: "transit", emoji: "🚗", title: "Fake Uber / Ride Pickup", what: "Someone near an airport pretends to be your Uber or Lyft driver.", avoid: "Always verify license plate, car model, and driver photo in the app before entering.", spots: ["JFK", "LaGuardia", "Penn Station"], lat: 40.7484, lng: -73.9967 },
  { id: 12, cat: "transit", emoji: "🚕", title: "Broken Taxi Meter", what: "Driver claims meter is broken and charges a random high price at destination.", avoid: "Insist on using the meter or agree on price before the ride. Exit if refused.", spots: ["Airports", "Midtown"], lat: 40.7549, lng: -73.9840 },
  { id: 13, cat: "transit", emoji: "🅿️", title: "Fake Parking Attendant", what: "Unofficial person guides you to park, then demands cash payment.", avoid: "Only pay official parking meters or clearly marked attendant booths.", spots: ["Brooklyn", "Queens"], lat: 40.678, lng: -73.944 },
  { id: 14, cat: "tickets", emoji: "🎟️", title: "Fake Event Tickets", what: "Scalpers outside venues sell fake or already-used tickets.", avoid: "Buy only from official box offices or verified apps like Ticketmaster.", spots: ["MSG", "Barclays Center", "Broadway"], lat: 40.7505, lng: -73.9934 },
  { id: 15, cat: "tickets", emoji: "🏠", title: "Fake Apartment Rental", what: "Cheap listing asking for deposit before you can even see the place. It's fake.", avoid: "Never pay before viewing in person. Use verified platforms only.", spots: ["Online listings"], lat: 40.730, lng: -73.935 },
  { id: 16, cat: "tickets", emoji: "🍺", title: "Bar Overcharge Scam", what: "Prices aren't shown. You get hit with a huge unexpected bill at the end.", avoid: "Always ask for the price before ordering. Check every item on the bill.", spots: ["Lower East Side", "Meatpacking District"], lat: 40.7408, lng: -74.0042 },
  { id: 17, cat: "theft", emoji: "🏧", title: "ATM Distraction Theft", what: "Someone distracts you at an ATM while an accomplice steals your card or cash.", avoid: "Use ATMs in well-lit areas. Cover your PIN. Never engage strangers at ATMs.", spots: ["Busy ATM locations"], lat: 40.752, lng: -73.977 },
  { id: 18, cat: "theft", emoji: "📱", title: "Phone Snatch Setup", what: "Someone bumps you while an accomplice grabs your phone from your hand.", avoid: "Keep phone in pocket in crowded areas. Be aware of staged distractions.", spots: ["Times Square", "Subway", "Concerts"], lat: 40.758, lng: -73.9855 },
  { id: 19, cat: "theft", emoji: "☎️", title: '"Can I Use Your Phone?"', what: "Stranger asks to borrow your phone urgently, then runs away with it.", avoid: "Never hand your phone to a stranger. Offer to dial a number for them instead.", spots: ["Tourist areas"], lat: 40.755, lng: -73.986 },
  { id: 20, cat: "theft", emoji: "🤝", title: "Overfriendly Stranger Setup", what: "Extremely friendly stranger builds quick trust, then scams or robs you.", avoid: "Be polite but cautious. Genuine locals don't approach tourists this way.", spots: ["Times Square", "Central Park"], lat: 40.7851, lng: -73.9683 },
];

// High-risk zones for geofencing notifications
const HIGH_RISK_ZONES = [
  { name: "Times Square", lat: 40.758, lng: -73.9855, radius: 0.4, tip: "You're near Times Square — common area for bracelet scams, costumed characters, and CD hustles. Stay alert!" },
  { name: "Penn Station", lat: 40.7506, lng: -73.9971, radius: 0.3, tip: "Near Penn Station — watch out for fake ride pickups and unofficial ticket sellers." },
  { name: "Grand Central", lat: 40.7527, lng: -73.9772, radius: 0.3, tip: "Near Grand Central — common area for petition traps and fake charity collectors." },
  { name: "Central Park", lat: 40.7851, lng: -73.9683, radius: 0.5, tip: "Entering Central Park area — be cautious of overly friendly strangers and unofficial tour guides." },
  { name: "Brooklyn Bridge", lat: 40.7061, lng: -73.9969, radius: 0.3, tip: "Near Brooklyn Bridge — watch for bracelet scams and photo trap scams." },
];

const CATS = [
  { value: "all", label: "All" },
  { value: "street", label: "Street" },
  { value: "transit", label: "Transit" },
  { value: "tickets", label: "Tickets & Online" },
  { value: "theft", label: "Theft" },
];
const CAT_COLOR = { street: "#EA580C", transit: "#2563EB", tickets: "#7C3AED", theft: "#DC2626", all: "#1C1C1E" };

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function ListenDontJudge() {
  const [user, setUser] = useState(null);
  const [activeCat, setActiveCat] = useState("all");
  const [activeTab, setActiveTab] = useState("scams");
  const [selectedScam, setSelectedScam] = useState(null);
  const [selectedRule, setSelectedRule] = useState(null);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifBanner, setNotifBanner] = useState(null);
  const alertedZones = useRef(new Set());
  const watchRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    setNotifEnabled(localStorage.getItem("scam_notif") === "1");
  }, []);

  // Geolocation + push notification logic
  const enableNotifications = async () => {
    const perm = await Notification.requestPermission();
    if (perm !== "granted") { alert("Please allow notifications to receive safety alerts."); return; }
    localStorage.setItem("scam_notif", "1");
    setNotifEnabled(true);
    startWatching();
  };

  const disableNotifications = () => {
    if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    localStorage.removeItem("scam_notif");
    setNotifEnabled(false);
  };

  const startWatching = () => {
    if (!navigator.geolocation) return;
    watchRef.current = navigator.geolocation.watchPosition(
      pos => checkZones(pos.coords.latitude, pos.coords.longitude),
      null,
      { enableHighAccuracy: false, maximumAge: 30000 }
    );
  };

  const checkZones = (lat, lng) => {
    HIGH_RISK_ZONES.forEach(zone => {
      const dist = haversineKm(lat, lng, zone.lat, zone.lng);
      if (dist <= zone.radius && !alertedZones.current.has(zone.name)) {
        alertedZones.current.add(zone.name);
        // In-app banner
        setNotifBanner({ title: `⚠️ High-Risk Area: ${zone.name}`, body: zone.tip });
        setTimeout(() => setNotifBanner(null), 8000);
        // Push notification
        if (Notification.permission === "granted") {
          new Notification(`⚠️ Safety Alert: ${zone.name}`, { body: zone.tip, icon: "/favicon.ico" });
        }
      }
    });
  };

  useEffect(() => {
    if (notifEnabled && Notification.permission === "granted") startWatching();
    return () => { if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current); };
  }, [notifEnabled]);

  const share = () => {
    if (navigator.share) navigator.share({ title: "Stay Safe NYC", text: "Know the most common NYC scams and how to avoid them!", url: window.location.href });
  };

  const filtered = activeCat === "all" ? SCAMS : SCAMS.filter(s => s.cat === activeCat);

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "#FAFAF7" }}>
      {/* Sticky header */}
      <div className="sticky top-0 z-30" style={{ backgroundColor: "rgba(250,250,247,0.97)", backdropFilter: "blur(20px)", borderBottom: "1px solid #E5E5E0" }}>
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

      {/* Geolocation alert banner */}
      <AnimatePresence>
        {notifBanner && (
          <motion.div initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }}
            className="fixed top-16 left-4 right-4 z-50 rounded-2xl p-4 flex gap-3 items-start shadow-xl"
            style={{ backgroundColor: "#FEF3C7", border: "1.5px solid #F59E0B" }}>
            <span className="text-xl shrink-0">⚠️</span>
            <div className="flex-1">
              <p className="text-sm font-bold" style={{ color: "#92400E" }}>{notifBanner.title}</p>
              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#78350F" }}>{notifBanner.body}</p>
            </div>
            <button onClick={() => setNotifBanner(null)} className="shrink-0">
              <X className="w-4 h-4" style={{ color: "#92400E" }} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SCAMS TAB */}
      {activeTab === "scams" && (
        <div className="max-w-2xl mx-auto px-4">
          {/* Hero */}
          <div className="pt-8 pb-5 text-center">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#EA580C" }}>NYC Safety Alerts & Scam Awareness</p>
            <h1 className="text-3xl font-black leading-tight mb-3" style={{ color: "#1C1C1E", fontFamily: "var(--font-serif)", letterSpacing: "-0.03em" }}>
              No matter the scheme, we can{" "}
              <span style={{ textDecoration: "underline", textDecorationStyle: "wavy", textDecorationColor: "#FBBF24" }}>spot the scam.</span>
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>
              Tap any card to learn what happens and how to protect yourself.
            </p>
          </div>

          {/* Geolocation toggle */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-4"
            style={{ backgroundColor: notifEnabled ? "#F0FDF4" : "#F9FAFB", border: `1.5px solid ${notifEnabled ? "#86EFAC" : "#E5E7EB"}` }}>
            <div className="flex-1">
              <p className="text-sm font-bold" style={{ color: notifEnabled ? "#166534" : "#374151" }}>
                {notifEnabled ? "🔔 Safety alerts are ON" : "🔕 Enable safety alerts"}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                {notifEnabled ? "You'll be notified when entering high-risk areas." : "Get notified when entering known scam hotspots."}
              </p>
            </div>
            <button onClick={notifEnabled ? disableNotifications : enableNotifications}
              className="px-4 py-2 rounded-full text-xs font-bold shrink-0"
              style={{ backgroundColor: notifEnabled ? "#DC2626" : "#1C1C1E", color: "#fff" }}>
              {notifEnabled ? "Turn Off" : "Enable"}
            </button>
          </div>

          {/* Category chips */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-4 px-4">
            {CATS.map(cat => (
              <button key={cat.value} onClick={() => setActiveCat(cat.value)}
                className="shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all"
                style={{ backgroundColor: activeCat === cat.value ? (CAT_COLOR[cat.value] || "#1C1C1E") : "#F3F4F6", color: activeCat === cat.value ? "#fff" : "#374151" }}>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Scam list */}
          <div className="mb-4" style={{ border: "1.5px solid #E5E5E0", borderRadius: 20, overflow: "hidden", backgroundColor: "#fff" }}>
            {filtered.map((scam, idx) => {
              const color = CAT_COLOR[scam.cat] || "#1C1C1E";
              return (
                <button key={scam.id} onClick={() => setSelectedScam(scam)}
                  className="w-full text-left"
                  style={{ borderTop: idx === 0 ? "none" : "1px solid #F3F4F6", display: "block" }}>
                  <div className="flex items-start gap-4 px-5 py-4">
                    {/* Icon + check */}
                    <div className="flex flex-col items-center gap-1.5 shrink-0 pt-0.5">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: "#F9FAFB" }}>
                        {scam.emoji}
                      </div>
                      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: color }}>
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    </div>
                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color }}>{scam.cat}</p>
                      <p className="font-black text-[15px] leading-snug mb-1" style={{ color: "#1C1C1E", fontFamily: "var(--font-serif)" }}>{scam.title}</p>
                      <p className="text-sm leading-relaxed line-clamp-2" style={{ color: "#6B7280" }}>{scam.what}</p>
                      <div className="flex items-center gap-1 mt-2" style={{ color }}>
                        <span className="text-xs font-bold">Read more</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </div>
                    </div>
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
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#EA580C" }}>The Foundation</p>
            <h1 className="text-3xl font-black leading-tight mb-3" style={{ color: "#1C1C1E", fontFamily: "var(--font-serif)", letterSpacing: "-0.03em" }}>
              Three golden rules to{" "}
              <span style={{ textDecoration: "underline", textDecorationStyle: "wavy", textDecorationColor: "#FBBF24" }}>spot any scam.</span>
            </h1>
          </div>
          <div className="mb-8" style={{ border: "1.5px solid #E5E5E0", borderRadius: 20, overflow: "hidden", backgroundColor: "#fff" }}>
            {RULES.map((rule, idx) => (
              <button key={rule.id} onClick={() => setSelectedRule(rule)}
                className="w-full text-left"
                style={{ borderTop: idx === 0 ? "none" : "1px solid #F3F4F6", display: "block" }}>
                <div className="flex items-start gap-4 px-5 py-5">
                  <div className="flex flex-col items-center gap-1.5 shrink-0 pt-0.5">
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
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </button>
            ))}
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

      {/* SCAM DETAIL MODAL */}
      <AnimatePresence>
        {selectedScam && (
          <ScamModal scam={selectedScam} onClose={() => setSelectedScam(null)} />
        )}
      </AnimatePresence>

      {/* RULE DETAIL MODAL */}
      <AnimatePresence>
        {selectedRule && (
          <RuleModal rule={selectedRule} onClose={() => setSelectedRule(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Scam Detail Modal ─────────────────────────────────────────────────────────
function ScamModal({ scam, onClose }) {
  const color = CAT_COLOR[scam.cat] || "#1C1C1E";
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)" }}
      onClick={onClose}>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="w-full max-w-2xl rounded-t-3xl overflow-y-auto"
        style={{ backgroundColor: "#fff", maxHeight: "88dvh" }}
        onClick={e => e.stopPropagation()}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "#E5E7EB" }} />
        </div>
        <div className="px-6 pb-10 pt-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ backgroundColor: `${color}15` }}>
                {scam.emoji}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color }}>{scam.cat}</p>
                <h2 className="text-xl font-black leading-tight" style={{ color: "#1C1C1E", fontFamily: "var(--font-serif)" }}>{scam.title}</h2>
              </div>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-1"
              style={{ backgroundColor: "#F3F4F6" }}>
              <X className="w-4 h-4" style={{ color: "#6B7280" }} />
            </button>
          </div>

          {/* What happens */}
          <div className="rounded-2xl p-4 mb-4" style={{ backgroundColor: "#FFFBEB", border: "1px solid #FDE68A" }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#92400E" }}>⚠️ What Happens</p>
            <p className="text-sm leading-relaxed" style={{ color: "#78350F" }}>{scam.what}</p>
          </div>

          {/* How to avoid */}
          <div className="rounded-2xl p-4 mb-4" style={{ backgroundColor: "#F0FDF4", border: "1px solid #86EFAC" }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#166534" }}>✅ How to Avoid It</p>
            <p className="text-sm leading-relaxed" style={{ color: "#15803D" }}>{scam.avoid}</p>
          </div>

          {/* Locations */}
          {scam.spots?.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#6B7280" }}>📍 Common Locations</p>
              <div className="flex flex-wrap gap-2">
                {scam.spots.map(s => (
                  <span key={s} className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: "#F3F4F6", color: "#374151" }}>
                    <MapPin className="w-3 h-3" /> {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Rule Detail Modal ─────────────────────────────────────────────────────────
function RuleModal({ rule, onClose }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)" }}
      onClick={onClose}>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="w-full max-w-2xl rounded-t-3xl"
        style={{ backgroundColor: "#fff", maxHeight: "80dvh" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "#E5E7EB" }} />
        </div>
        <div className="px-6 pb-10 pt-3">
          <div className="flex items-start justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ backgroundColor: "#FFFBEB" }}>
                {rule.icon}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "#FBBF24" }}>{rule.step}</p>
                <h2 className="text-xl font-black" style={{ color: "#1C1C1E", fontFamily: "var(--font-serif)" }}>{rule.title}</h2>
              </div>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-1"
              style={{ backgroundColor: "#F3F4F6" }}>
              <X className="w-4 h-4" style={{ color: "#6B7280" }} />
            </button>
          </div>
          <p className="text-base leading-relaxed mb-3" style={{ color: "#374151" }}>{rule.desc}</p>
          <div className="rounded-2xl p-4" style={{ backgroundColor: "#FFFBEB", border: "1px solid #FDE68A" }}>
            <p className="text-sm leading-relaxed" style={{ color: "#78350F" }}>{rule.detail}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── AI Assistant ──────────────────────────────────────────────────────────────
function AIAssistant() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "👋 Hi! I'm your NYC Safety Assistant.\n\nAsk me anything:\n• \"Is Times Square safe at night?\"\n• \"What scams happen near the subway?\"\n• \"How do I spot a fake ticket seller?\"" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const context = SCAMS.map(s => `${s.title}: ${s.what} Avoid: ${s.avoid}. Common at: ${s.spots?.join(", ")}.`).join("\n");

  const send = async () => {
    if (!input.trim() || loading) return;
    const q = input.trim(); setInput("");
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
    setLoading(false); setDone(true);
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