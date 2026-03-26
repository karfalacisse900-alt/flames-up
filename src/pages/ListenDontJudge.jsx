import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { X, ChevronRight, Flag, Bot, Send, Loader2, Share2, Check, MapPin, Bell, BellOff, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── High-risk zones for geofence notifications ────────────────────────────────
const HIGH_RISK_ZONES = [
  { name: "Times Square", lat: 40.758, lng: -73.9855, radius: 400, scams: ["Costumed Character Photo", "Fake Monk Bracelet", "CD / Mixtape Hustle", "Phone Snatch Setup"] },
  { name: "Grand Central Terminal", lat: 40.7527, lng: -73.9772, radius: 300, scams: ["Fake Monk Bracelet", "Petition / Signature Trap"] },
  { name: "Herald Square", lat: 40.7502, lng: -73.9883, radius: 300, scams: ["CD / Mixtape Hustle", "Fake Charity Collectors"] },
  { name: "Union Square", lat: 40.7359, lng: -73.9911, radius: 300, scams: ["Petition / Signature Trap", "3-Card Monte"] },
  { name: "Central Park South", lat: 40.7641, lng: -73.9730, radius: 350, scams: ["Overfriendly Stranger Setup", "Costumed Character Photo"] },
  { name: "Brooklyn Bridge", lat: 40.7061, lng: -73.9969, radius: 350, scams: ["Fake Monk Bracelet", '"Found Ring" Trick'] },
];

function haversineM(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Golden Rules ──────────────────────────────────────────────────────────────
const RULES = [
  { id: "r1", step: "RULE 1", icon: "⏸️", title: "Slow Down", desc: "Scammers create urgency. If someone is rushing you, that's a red flag.", detail: "Real opportunities don't disappear in 30 seconds. Whether it's a 'free gift', a deal, or someone asking for help — pressure is the scammer's #1 tool. Step back, think, and walk away if needed." },
  { id: "r2", step: "RULE 2", icon: "🔍", title: "Spot Check", desc: "Look for signs. Does the situation feel off? Is someone too friendly? Trust your gut.", detail: "Ask yourself: Why is this stranger approaching me? Would a legitimate business operate this way? If something feels wrong, it probably is. Scammers rely on confusion and distraction." },
  { id: "r3", step: "RULE 3", icon: "🛑", title: "Never Pay Unexpectedly", desc: "If you didn't agree to pay something upfront, don't. Surprise bills are scam tactics.", detail: "Whether it's a bracelet placed on your wrist, a CD forced into your hand, or a photo taken without asking — you owe nothing. Say 'No thank you' firmly and walk away." },
];

// ── Scam Data ─────────────────────────────────────────────────────────────────
const SCAMS = [
  { id: 1, cat: "street", emoji: "📿", title: "Fake Monk Bracelet", what: "Someone puts a bracelet on your wrist 'for free', then aggressively demands money. They may follow you if you try to leave.", avoid: "Never let strangers place anything on your body. Say 'No thank you' firmly and keep walking. Do not make eye contact or slow down.", spots: ["Times Square", "Grand Central"] },
  { id: 2, cat: "street", emoji: "💿", title: "CD / Mixtape Hustle", what: "A person hands you a CD, signs it, engages you in conversation — then demands you pay for it, often aggressively.", avoid: "Don't accept CDs or physical items from strangers. If someone hands you something, hand it right back and keep moving.", spots: ["Times Square", "Herald Square"] },
  { id: 3, cat: "street", emoji: "📋", title: "Petition / Signature Trap", what: "Someone asks you to sign a petition for a cause (children, environment, etc.), then pressures you for a cash donation.", avoid: "Don't stop for clipboard people. If you want to donate, do it online to verified organizations.", spots: ["Midtown", "Union Square"] },
  { id: 4, cat: "street", emoji: "🎭", title: "Costumed Character Photo", what: "People in Elmo, Spider-Man, or other costumes offer free photos, then demand large tips or become aggressive when you don't pay.", avoid: "Only take photos if you've agreed on a price beforehand. It is never truly free.", spots: ["Times Square"] },
  { id: 5, cat: "street", emoji: "🃏", title: "3-Card Monte", what: "A street card game that looks easy to win. The dealer, shills in the crowd, and lookouts all work together. It's always rigged.", avoid: "Never play street gambling games. The house always wins. Walk past without stopping.", spots: ["Midtown", "Penn Station area"] },
  { id: 6, cat: "street", emoji: "💍", title: '"Found Ring" Trick', what: "A stranger 'finds' a ring near you and tries to sell it cheaply, claiming it's gold. It's always fake costume jewelry.", avoid: "Ignore it completely. Don't engage or make eye contact.", spots: ["Midtown", "Lower Manhattan"] },
  { id: 7, cat: "street", emoji: "🎁", title: "Free Gift Trap", what: "A stranger places a gift or item in your hands or near your child 'for free', then immediately pressures you to pay.", avoid: "Politely decline anything offered for free by strangers. 'No thank you' and keep walking.", spots: ["Tourist areas", "Midtown"] },
  { id: 8, cat: "street", emoji: "🪣", title: "Fake Charity Collectors", what: "People collecting for 'sick kids', 'local schools', or other causes with no real organization behind them.", avoid: "Only donate online to verified charities. Ask for official credentials — legitimate collectors always have them.", spots: ["Busy intersections", "Shopping areas"] },
  { id: 9, cat: "street", emoji: "🎪", title: "Street Performer Pressure", what: "Performers ask aggressively for tips after uninvited performances near you or involving you in their act.", avoid: "You are not obligated to tip for an uninvited performance. Move on without engaging.", spots: ["Times Square", "Subway stations"] },
  { id: 10, cat: "transit", emoji: "🚇", title: "Subway Swipe Scam", what: "A person offers to swipe you into the subway cheaper using what they claim is a spare MetroCard. The card is stolen or invalid.", avoid: "Always use your own payment method. Using a stolen MetroCard is illegal for you too.", spots: ["Busy subway stations"] },
  { id: 11, cat: "transit", emoji: "🚗", title: "Fake Uber / Ride Pickup", what: "Someone near an airport or venue pretends to be your Uber or Lyft driver, often holding a generic sign.", avoid: "Always verify license plate, car model, and driver photo in your app before getting in.", spots: ["JFK", "LaGuardia", "Penn Station"] },
  { id: 12, cat: "transit", emoji: "🚕", title: "Broken Taxi Meter", what: "Driver claims the meter is broken and will charge a flat (high) rate, or the meter 'accidentally' runs faster than normal.", avoid: "Insist on using the meter. If the driver refuses, exit the cab. Always confirm the fare before riding.", spots: ["Airports", "Midtown"] },
  { id: 13, cat: "transit", emoji: "🅿️", title: "Fake Parking Attendant", what: "An unofficial person guides you into a parking spot then demands cash payment, claiming it's a paid lot.", avoid: "Only pay official parking meters or clearly marked attendant booths. Unofficial attendants have no authority.", spots: ["Brooklyn", "Queens"] },
  { id: 14, cat: "tickets", emoji: "🎟️", title: "Fake Event Tickets", what: "Scalpers outside venues sell fake, photocopied, or already-used tickets at a 'discount' price.", avoid: "Buy only from official box offices or verified apps like Ticketmaster. Check barcodes at entry.", spots: ["MSG", "Barclays Center", "Broadway"] },
  { id: 15, cat: "tickets", emoji: "🏠", title: "Fake Apartment Rental", what: "An online listing offers a suspiciously cheap apartment and requires a deposit before you can view or apply.", avoid: "Never pay before viewing in person. Use verified platforms only. Legitimate landlords never ask for wire transfers.", spots: ["Online listings"] },
  { id: 16, cat: "tickets", emoji: "🍺", title: "Bar Overcharge Scam", what: "Prices aren't displayed. You're charged a massive bill at the end for drinks or 'table service' you didn't explicitly order.", avoid: "Always ask for a menu with prices before ordering. Check your bill carefully before paying.", spots: ["Lower East Side", "Meatpacking District"] },
  { id: 17, cat: "theft", emoji: "🏧", title: "ATM Distraction Theft", what: "Someone distracts you at an ATM (asking directions, dropping coins) while an accomplice steals your card or cash.", avoid: "Use ATMs in well-lit, indoor locations. Cover your PIN. Don't interact with strangers while at the ATM.", spots: ["Busy ATM locations"] },
  { id: 18, cat: "theft", emoji: "📱", title: "Phone Snatch Setup", what: "One person bumps into you while a second person grabs your phone in the chaos. Common in crowded areas.", avoid: "Keep your phone in your pocket in crowded areas. Put it away when not actively using it.", spots: ["Times Square", "Subway platforms"] },
  { id: 19, cat: "theft", emoji: "☎️", title: '"Can I Use Your Phone?"', what: "A stranger urgently needs to make a call or check directions on your phone — then runs away with it.", avoid: "Never hand your phone to a stranger. If someone needs help, offer to dial the number yourself while holding the phone.", spots: ["Tourist areas", "Midtown"] },
  { id: 20, cat: "theft", emoji: "🤝", title: "Overfriendly Stranger Setup", what: "An extremely friendly stranger builds quick rapport, then asks for money, 'borrows' your phone, or leads you into another scam.", avoid: "Be polite but cautious. Genuine locals rarely approach tourists the way scammers do.", spots: ["Times Square", "Central Park"] },
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
  const [activeTab, setActiveTab] = useState("scams");
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [nearbyAlert, setNearbyAlert] = useState(null);
  const alertedZones = useRef(new Set());
  const watchRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    // Check if notifications already granted
    if ("Notification" in window && Notification.permission === "granted") {
      setNotifEnabled(true);
      startGeofencing();
    }
  }, []);

  const requestNotifications = async () => {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      setNotifEnabled(true);
      startGeofencing();
    }
  };

  const startGeofencing = () => {
    if (!navigator.geolocation || watchRef.current) return;
    watchRef.current = navigator.geolocation.watchPosition(pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      HIGH_RISK_ZONES.forEach(zone => {
        if (alertedZones.current.has(zone.name)) return;
        const dist = haversineM(lat, lng, zone.lat, zone.lng);
        if (dist <= zone.radius) {
          alertedZones.current.add(zone.name);
          const msg = `⚠️ You're near ${zone.name}! Watch out for: ${zone.scams.slice(0, 2).join(", ")} and more.`;
          setNearbyAlert({ zone: zone.name, scams: zone.scams, msg });
          if (Notification.permission === "granted") {
            new Notification("🚨 Safety Alert — NYC Scam Zone", { body: msg, icon: "/favicon.ico" });
          }
          setTimeout(() => alertedZones.current.delete(zone.name), 10 * 60 * 1000); // re-alert after 10min
        }
      });
    }, null, { enableHighAccuracy: true, maximumAge: 15000, timeout: 10000 });
  };

  useEffect(() => () => { if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current); }, []);

  const filtered = activeCat === "all" ? SCAMS : SCAMS.filter(s => s.cat === activeCat);

  const share = () => {
    if (navigator.share) navigator.share({ title: "Stay Safe NYC", text: "Know the most common NYC scams and how to avoid them." });
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "#FAFAF7", fontFamily: "var(--font-sans)" }}>
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

      {/* Nearby alert banner */}
      <AnimatePresence>
        {nearbyAlert && (
          <motion.div initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }}
            className="sticky top-14 z-20 mx-4 mt-2 rounded-2xl px-4 py-3 flex items-start gap-3"
            style={{ backgroundColor: "#FEF2F2", border: "1.5px solid #FECACA" }}>
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#DC2626" }} />
            <div className="flex-1">
              <p className="text-sm font-bold" style={{ color: "#DC2626" }}>⚠️ You're near {nearbyAlert.zone}!</p>
              <p className="text-xs mt-0.5" style={{ color: "#7F1D1D" }}>Watch for: {nearbyAlert.scams.join(", ")}</p>
            </div>
            <button onClick={() => setNearbyAlert(null)} className="shrink-0">
              <X className="w-4 h-4" style={{ color: "#DC2626" }} />
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
              No matter the scheme,{" "}
              <span style={{ textDecoration: "underline", textDecorationStyle: "wavy", textDecorationColor: "#FBBF24" }}>know the signs</span>{" "}
              to stay safe in NYC.
            </h1>
            <p className="text-sm leading-relaxed mb-4" style={{ color: "#6B7280" }}>
              Scammers are working every day targeting tourists and new residents. Tap any scam below to learn how to spot and avoid it.
            </p>
            {/* Notification enable button */}
            <button onClick={notifEnabled ? undefined : requestNotifications}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-1"
              style={{ backgroundColor: notifEnabled ? "#F0FDF4" : "#FEF9C3", color: notifEnabled ? "#16A34A" : "#92400E", border: `1.5px solid ${notifEnabled ? "#BBF7D0" : "#FDE68A"}` }}>
              {notifEnabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
              {notifEnabled ? "Area alerts ON — stay safe!" : "Enable area safety alerts"}
            </button>
          </div>

          {/* Category chips */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-4 px-4">
            {CATS.map(cat => (
              <button key={cat.value} onClick={() => setActiveCat(cat.value)}
                className="shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all"
                style={{ backgroundColor: activeCat === cat.value ? cat.color : "#F3F4F6", color: activeCat === cat.value ? "#fff" : "#374151" }}>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Horizontal scam cards — ScamSpotter style */}
          <div className="mb-6" style={{ border: "1.5px solid #E5E5E0", borderRadius: 20, overflow: "hidden", backgroundColor: "#fff" }}>
            {filtered.map((scam, idx) => {
              const catColor = CATS.find(c => c.value === scam.cat)?.color || "#1C1C1E";
              return (
                <button key={scam.id} onClick={() => setSelectedScam(scam)}
                  className="w-full text-left flex items-center gap-4 px-5 py-4 transition-colors active:bg-gray-50"
                  style={{ borderTop: idx === 0 ? "none" : "1px solid #F3F4F6" }}>
                  {/* Emoji circle */}
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                    style={{ backgroundColor: `${catColor}14` }}>
                    {scam.emoji}
                  </div>
                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: catColor }}>{scam.cat}</p>
                    <p className="font-black text-base leading-tight" style={{ color: "#1C1C1E", fontFamily: "var(--font-serif)" }}>{scam.title}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: "#9CA3AF" }}>{scam.what.slice(0, 60)}…</p>
                  </div>
                  {/* Arrow + checkmark */}
                  <div className="flex flex-col items-center gap-1.5 shrink-0">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: catColor }}>
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                    <ChevronRight className="w-4 h-4" style={{ color: "#D1D5DB" }} />
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
              No matter the scheme, we can{" "}
              <span style={{ textDecoration: "underline", textDecorationStyle: "wavy", textDecorationColor: "#FBBF24" }}>apply</span>{" "}
              the three golden rules.
            </h1>
          </div>
          <div className="mb-8" style={{ border: "1.5px solid #E5E5E0", borderRadius: 20, overflow: "hidden", backgroundColor: "#fff" }}>
            {RULES.map((rule, idx) => (
              <button key={rule.id} onClick={() => setSelectedScam({ ...rule, isRule: true })}
                className="w-full text-left flex items-center gap-4 px-5 py-5 transition-colors active:bg-gray-50"
                style={{ borderTop: idx === 0 ? "none" : "1px solid #F3F4F6" }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: "#FFFBEB" }}>
                  {rule.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "#FBBF24" }}>{rule.step}</p>
                  <p className="font-black text-base leading-tight" style={{ color: "#1C1C1E", fontFamily: "var(--font-serif)" }}>{rule.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{rule.desc.slice(0, 60)}…</p>
                </div>
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: "#FBBF24" }}>
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                  <ChevronRight className="w-4 h-4" style={{ color: "#D1D5DB" }} />
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

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedScam && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
            onClick={() => setSelectedScam(null)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="w-full max-w-2xl rounded-t-3xl overflow-hidden"
              style={{ backgroundColor: "#fff", maxHeight: "88dvh", overflowY: "auto" }}
              onClick={e => e.stopPropagation()}>
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "#E5E7EB" }} />
              </div>
              {/* Modal header */}
              <div className="px-6 pt-3 pb-5">
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                      style={{ backgroundColor: selectedScam.isRule ? "#FFFBEB" : `${(CATS.find(c => c.value === selectedScam.cat)?.color || "#1C1C1E")}14` }}>
                      {selectedScam.emoji || selectedScam.icon}
                    </div>
                    <div>
                      {selectedScam.step && <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#FBBF24" }}>{selectedScam.step}</p>}
                      {selectedScam.cat && <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: CATS.find(c => c.value === selectedScam.cat)?.color }}>{selectedScam.cat}</p>}
                      <h2 className="text-xl font-black leading-tight" style={{ color: "#1C1C1E", fontFamily: "var(--font-serif)" }}>{selectedScam.title}</h2>
                    </div>
                  </div>
                  <button onClick={() => setSelectedScam(null)} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#F3F4F6" }}>
                    <X className="w-4 h-4" style={{ color: "#6B7280" }} />
                  </button>
                </div>

                {/* What happens */}
                <div className="rounded-2xl p-4 mb-3" style={{ backgroundColor: "#FEF9C3" }}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: "#92400E" }}>⚠️ What happens</p>
                  <p className="text-sm leading-relaxed" style={{ color: "#78350F" }}>{selectedScam.what || selectedScam.desc}</p>
                </div>

                {/* How to avoid */}
                <div className="rounded-2xl p-4 mb-3" style={{ backgroundColor: "#F0FDF4" }}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: "#166534" }}>✅ How to avoid it</p>
                  <p className="text-sm leading-relaxed" style={{ color: "#15803D" }}>{selectedScam.avoid || selectedScam.detail}</p>
                </div>

                {/* Locations */}
                {selectedScam.spots?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#9CA3AF" }}>📍 Common locations</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedScam.spots.map(s => (
                        <span key={s} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-medium"
                          style={{ backgroundColor: "#F3F4F6", color: "#374151" }}>
                          <MapPin className="w-3 h-3" /> {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={() => setSelectedScam(null)}
                  className="w-full py-4 rounded-2xl text-sm font-bold text-white mt-2"
                  style={{ backgroundColor: "#1C1C1E" }}>
                  Got it — Stay Safe!
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