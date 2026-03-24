import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import {
  MapPin, Plus, X, Trash2, ArrowUp, ArrowDown, Share2,
  Navigation, Search, Loader2, ChevronRight, Map, List,
  Route, Save, Users, UserPlus, Sparkles, ChevronLeft,
  DollarSign, Calendar, Heart, Briefcase, Star, Wand2
} from "lucide-react";

function formatKm(km) {
  if (!km) return "—";
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

// ── AI Onboarding Wizard ──────────────────────────────────────────────────────
const INTERESTS = ["🍽️ Food & Dining", "🏛️ Culture & History", "🌿 Nature & Outdoors", "🛍️ Shopping", "🎭 Nightlife & Entertainment", "🏖️ Beach & Relaxation", "🎨 Art & Museums", "⛪ Religious & Spiritual", "🏋️ Adventure & Sports", "📸 Photography Spots"];
const BUDGETS = [{ label: "Budget", icon: "$", desc: "Hostels, local eats" }, { label: "Mid-range", icon: "$$", desc: "Hotels, casual dining" }, { label: "Luxury", icon: "$$$", desc: "Premium stays & dining" }];
const TRAVEL_STYLES = [{ label: "Relaxed", emoji: "😌", desc: "Slow pace, less stops" }, { label: "Balanced", emoji: "🚶", desc: "Mix of everything" }, { label: "Packed", emoji: "⚡", desc: "See as much as possible" }];

function AIWizard({ user, onTripGenerated, onClose }) {
  const [step, setStep] = useState(0);
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState(3);
  const [budget, setBudget] = useState("Mid-range");
  const [groupSize, setGroupSize] = useState(2);
  const [interests, setInterests] = useState([]);
  const [travelStyle, setTravelStyle] = useState("Balanced");
  const [generating, setGenerating] = useState(false);

  const toggleInterest = (i) => setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);

  const generate = async () => {
    if (!destination.trim()) return;
    setGenerating(true);
    const prompt = `You are an expert travel planner AI called Trippin'. Create a hyper-personalized ${days}-day trip itinerary for: ${destination}.
Traveler profile:
- Budget: ${budget}
- Group size: ${groupSize} people
- Travel style: ${travelStyle}
- Interests: ${interests.join(", ") || "general sightseeing"}

Return a JSON object with this exact schema:
{
  "title": "Creative trip title",
  "description": "2-sentence compelling description",
  "highlights": ["highlight1", "highlight2", "highlight3"],
  "stops": [
    {
      "name": "Place name",
      "address": "Full address",
      "category": "restaurant|museum|park|hotel|attraction|bar|cafe",
      "note": "Why visit + tip (1-2 sentences)",
      "day": 1,
      "type": "accommodation|activity|dining|transport"
    }
  ],
  "budget_tip": "Budget-specific money-saving or splurge tip",
  "best_time": "Best time to visit each attraction",
  "local_tip": "Insider local tip"
}
Include ${Math.min(days * 4, 16)} stops total spread across ${days} days. Mix accommodation, dining, and activities. Tailor everything to the ${budget} budget and ${interests.join(", ")} interests.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          highlights: { type: "array", items: { type: "string" } },
          stops: { type: "array", items: { type: "object" } },
          budget_tip: { type: "string" },
          best_time: { type: "string" },
          local_tip: { type: "string" },
        }
      }
    });

    const trip = {
      title: result.title || `${destination} Trip`,
      description: result.description || "",
      creator_email: user.email,
      creator_name: user.full_name || user.email.split("@")[0],
      stops: (result.stops || []).map(s => ({ name: s.name, address: s.address || "", category: s.category || "place", note: s.note || "", lat: null, lng: null, photo: null, day: s.day, type: s.type })),
      is_public: false,
      ai_highlights: result.highlights || [],
      ai_budget_tip: result.budget_tip || "",
      ai_best_time: result.best_time || "",
      ai_local_tip: result.local_tip || "",
      ai_generated: true,
    };

    const created = await base44.entities.Trip.create(trip);
    setGenerating(false);
    onTripGenerated(created);
  };

  const steps = [
    {
      title: "Where to?",
      subtitle: "Tell me your dream destination",
      content: (
        <div>
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl mb-4" style={{ backgroundColor: "var(--bg-card)", border: "2px solid var(--accent-primary)", boxShadow: "0 0 0 3px rgba(79,70,229,0.1)" }}>
            <MapPin className="w-5 h-5 shrink-0" style={{ color: "var(--accent-primary)" }} />
            <input value={destination} onChange={e => setDestination(e.target.value)}
              placeholder="Paris, Tokyo, New York…"
              autoFocus
              className="flex-1 bg-transparent text-base font-semibold outline-none"
              style={{ color: "var(--text-primary)", border: "none", boxShadow: "none", minHeight: "unset", padding: 0 }} />
          </div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>How many days?</p>
            <div className="flex items-center gap-3">
              <button onClick={() => setDays(d => Math.max(1, d - 1))}
                className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg"
                style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", minWidth: 36, minHeight: 36 }}>−</button>
              <span className="text-xl font-black w-8 text-center" style={{ color: "var(--accent-primary)" }}>{days}</span>
              <button onClick={() => setDays(d => Math.min(14, d + 1))}
                className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg"
                style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", minWidth: 36, minHeight: 36 }}>+</button>
            </div>
          </div>
        </div>
      ),
      valid: destination.trim().length > 0,
    },
    {
      title: "Travel Style",
      subtitle: "Pick your budget & pace",
      content: (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: "var(--text-hint)" }}>Budget</p>
            <div className="grid grid-cols-3 gap-2">
              {BUDGETS.map(b => (
                <button key={b.label} onClick={() => setBudget(b.label)}
                  className="flex flex-col items-center p-3 rounded-2xl transition-all"
                  style={{ backgroundColor: budget === b.label ? "#4F46E5" : "var(--bg-card)", border: `2px solid ${budget === b.label ? "#4F46E5" : "var(--border-light)"}`, color: budget === b.label ? "#fff" : "var(--text-primary)" }}>
                  <span className="text-lg font-black">{b.icon}</span>
                  <span className="text-xs font-bold mt-1">{b.label}</span>
                  <span className="text-[10px] mt-0.5 opacity-75">{b.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: "var(--text-hint)" }}>Travel Pace</p>
            <div className="grid grid-cols-3 gap-2">
              {TRAVEL_STYLES.map(s => (
                <button key={s.label} onClick={() => setTravelStyle(s.label)}
                  className="flex flex-col items-center p-3 rounded-2xl transition-all"
                  style={{ backgroundColor: travelStyle === s.label ? "#7C3AED" : "var(--bg-card)", border: `2px solid ${travelStyle === s.label ? "#7C3AED" : "var(--border-light)"}`, color: travelStyle === s.label ? "#fff" : "var(--text-primary)" }}>
                  <span className="text-2xl">{s.emoji}</span>
                  <span className="text-xs font-bold mt-1">{s.label}</span>
                  <span className="text-[10px] mt-0.5 opacity-75">{s.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Group size</p>
            <div className="flex items-center gap-3">
              <button onClick={() => setGroupSize(g => Math.max(1, g - 1))}
                className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg"
                style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", minWidth: 36, minHeight: 36 }}>−</button>
              <span className="text-xl font-black w-8 text-center" style={{ color: "var(--accent-primary)" }}>{groupSize}</span>
              <button onClick={() => setGroupSize(g => Math.min(20, g + 1))}
                className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg"
                style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", minWidth: 36, minHeight: 36 }}>+</button>
            </div>
          </div>
        </div>
      ),
      valid: true,
    },
    {
      title: "Interests",
      subtitle: "What excites you most?",
      content: (
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map(interest => (
            <button key={interest} onClick={() => toggleInterest(interest)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-sm font-semibold transition-all"
              style={{ backgroundColor: interests.includes(interest) ? "#4F46E5" : "var(--bg-card)", border: `2px solid ${interests.includes(interest) ? "#4F46E5" : "var(--border-light)"}`, color: interests.includes(interest) ? "#fff" : "var(--text-primary)" }}>
              {interest}
            </button>
          ))}
        </div>
      ),
      valid: true,
    },
  ];

  const current = steps[step];

  if (generating) return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-8"
      style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #0F172A 100%)" }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-20 h-20 rounded-3xl mb-6 flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED, #EC4899)" }}>
        <Sparkles className="w-10 h-10 text-white" />
      </motion.div>
      <h2 className="text-2xl font-black text-white mb-2 text-center" style={{ fontFamily: "var(--font-serif)" }}>
        Crafting your perfect trip…
      </h2>
      <p className="text-sm text-center" style={{ color: "rgba(255,255,255,0.6)" }}>
        AI is personalizing {days} days in {destination} just for you
      </p>
      <div className="mt-8 flex gap-1.5">
        {[0,1,2,3,4].map(i => (
          <motion.div key={i} animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18 }}
            className="w-2 h-2 rounded-full" style={{ backgroundColor: "#818CF8" }} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-4" style={{ paddingTop: "max(env(safe-area-inset-top, 16px), 16px)", background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)" }}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={step > 0 ? () => setStep(s => s - 1) : onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div key={i} className="h-1.5 rounded-full transition-all"
                style={{ width: i === step ? 24 : 8, backgroundColor: i <= step ? "#fff" : "rgba(255,255,255,0.3)" }} />
            ))}
          </div>
          <div className="w-9" />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
            <Wand2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white" style={{ fontFamily: "var(--font-serif)" }}>{current.title}</h2>
            <p className="text-xs text-white opacity-75">{current.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}>
            {current.content}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* CTA */}
      <div className="px-4 pb-8 pt-3" style={{ paddingBottom: "max(env(safe-area-inset-bottom, 24px), 24px)" }}>
        {step < steps.length - 1 ? (
          <button onClick={() => setStep(s => s + 1)} disabled={!current.valid}
            className="w-full py-4 rounded-2xl text-base font-black"
            style={{ background: current.valid ? "linear-gradient(135deg,#4F46E5,#7C3AED)" : "var(--bg-subtle)", color: current.valid ? "#fff" : "var(--text-hint)", boxShadow: current.valid ? "0 8px 24px rgba(79,70,229,0.4)" : "none" }}>
            Continue →
          </button>
        ) : (
          <button onClick={generate}
            className="w-full py-4 rounded-2xl text-base font-black flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#4F46E5,#7C3AED,#EC4899)", color: "#fff", boxShadow: "0 8px 24px rgba(79,70,229,0.4)" }}>
            <Sparkles className="w-5 h-5" /> Generate My Trip ✨
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main TripPlanner ──────────────────────────────────────────────────────────
export default function TripPlanner() {
  const [user, setUser] = useState(null);
  const [apiKey, setApiKey] = useState(null);
  const [view, setView] = useState("list");
  const [myTrips, setMyTrips] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [showAIWizard, setShowAIWizard] = useState(false);
  const [showNewTripForm, setShowNewTripForm] = useState(false);
  const [newTripTitle, setNewTripTitle] = useState("");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [distances, setDistances] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [collabEmail, setCollabEmail] = useState("");
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [sharedTrips, setSharedTrips] = useState([]);
  const [activeTab, setActiveTab] = useState("my");

  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);
  const autocompleteRef = useRef(null);
  const searchDebounce = useRef(null);
  const placesServiceRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    base44.functions.invoke("googleMapsToken", {}).then(r => setApiKey(r.data?.key || r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user?.email) return;
    base44.entities.Trip.filter({ creator_email: user.email }, "-created_date", 50).then(setMyTrips).catch(() => {});
    base44.entities.Trip.list("-created_date", 200).then(all => {
      setSharedTrips(all.filter(t => t.creator_email !== user.email && (t.collaborators || []).includes(user.email)));
    }).catch(() => {});
  }, [user?.email]);

  // Init Google Maps
  useEffect(() => {
    if (view !== "map" || !apiKey || mapInst.current) return;
    let destroyed = false;
    const init = async () => {
      if (!window.google?.maps) {
        await new Promise((res, rej) => {
          if (document.querySelector(`script[src*="maps.googleapis.com"]`)) { res(); return; }
          const s = document.createElement("script");
          s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
          s.async = true; s.onload = res; s.onerror = rej;
          document.head.appendChild(s);
        });
      }
      if (destroyed || !mapRef.current) return;
      const center = await new Promise(res => {
        navigator.geolocation?.getCurrentPosition(
          p => res({ lat: p.coords.latitude, lng: p.coords.longitude }),
          () => res({ lat: 40.7128, lng: -74.006 }),
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
        );
        if (!navigator.geolocation) res({ lat: 40.7128, lng: -74.006 });
      });
      const map = new window.google.maps.Map(mapRef.current, { center, zoom: 12, disableDefaultUI: true, gestureHandling: "greedy" });
      mapInst.current = map;
      placesServiceRef.current = new window.google.maps.places.PlacesService(map);
      autocompleteRef.current = new window.google.maps.places.AutocompleteService();
      setMapReady(true);
    };
    init().catch(console.error);
    return () => { destroyed = true; };
  }, [view, apiKey]);

  // Draw stops
  useEffect(() => {
    if (!mapReady || !mapInst.current || !activeTrip) return;
    const map = mapInst.current;
    markersRef.current.forEach(m => m.setMap(null)); markersRef.current = [];
    if (polylineRef.current) { polylineRef.current.setMap(null); polylineRef.current = null; }
    const stops = activeTrip.stops || [];
    const path = [];
    stops.forEach((stop, i) => {
      if (!stop.lat || !stop.lng) return;
      const pos = { lat: stop.lat, lng: stop.lng };
      path.push(pos);
      const marker = new window.google.maps.Marker({
        position: pos, map,
        icon: { url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="14" fill="#4F46E5"/><text x="16" y="21" font-size="13" text-anchor="middle" fill="white" font-weight="bold">${i + 1}</text></svg>`)}`, scaledSize: new window.google.maps.Size(32, 32), anchor: new window.google.maps.Point(16, 16) },
      });
      markersRef.current.push(marker);
    });
    if (path.length > 1) polylineRef.current = new window.google.maps.Polyline({ path, geodesic: true, strokeColor: "#4F46E5", strokeOpacity: 0.85, strokeWeight: 3, map });
    if (path.length > 0) { const b = new window.google.maps.LatLngBounds(); path.forEach(p => b.extend(p)); map.fitBounds(b, { top: 60, bottom: 80, left: 20, right: 20 }); }
  }, [mapReady, activeTrip?.stops]);

  const calcDistances = useCallback((stops) => {
    if (!stops || stops.length < 2 || !window.google?.maps?.geometry) { setDistances([]); return []; }
    const dists = [];
    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i], b = stops[i + 1];
      if (!a.lat || !a.lng || !b.lat || !b.lng) { dists.push(null); continue; }
      const d = window.google.maps.geometry.spherical.computeDistanceBetween(new window.google.maps.LatLng(a.lat, a.lng), new window.google.maps.LatLng(b.lat, b.lng));
      dists.push(d / 1000);
    }
    setDistances(dists); return dists;
  }, []);

  useEffect(() => { if (activeTrip?.stops) calcDistances(activeTrip.stops); }, [activeTrip?.stops]);

  const handleSearch = (val) => {
    setSearch(val); setShowSearch(true);
    clearTimeout(searchDebounce.current);
    if (!val.trim()) { setSearchResults([]); return; }
    searchDebounce.current = setTimeout(() => {
      if (!autocompleteRef.current) return;
      setSearchLoading(true);
      autocompleteRef.current.getPlacePredictions({ input: val }, (preds, status) => {
        setSearchLoading(false);
        setSearchResults(status === "OK" ? (preds || []) : []);
      });
    }, 350);
  };

  const addStop = (pred) => {
    if (!placesServiceRef.current && apiKey) {
      const div = document.createElement("div");
      div.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;visibility:hidden";
      document.body.appendChild(div);
      const tempMap = new window.google.maps.Map(div, { center: { lat: 0, lng: 0 }, zoom: 1 });
      placesServiceRef.current = new window.google.maps.places.PlacesService(tempMap);
    }
    if (!placesServiceRef.current) return;
    setSearch(""); setSearchResults([]); setShowSearch(false);
    placesServiceRef.current.getDetails(
      { placeId: pred.place_id, fields: ["name", "formatted_address", "geometry", "photos", "types"] },
      (place, status) => {
        if (status !== "OK" || !place) return;
        const stop = { name: place.name, address: place.formatted_address, lat: place.geometry.location.lat(), lng: place.geometry.location.lng(), photo: place.photos?.[0]?.getUrl({ maxWidth: 400 }) || null, category: place.types?.[0] || "place", note: "" };
        setActiveTrip(prev => ({ ...prev, stops: [...(prev?.stops || []), stop] }));
      }
    );
  };

  const removeStop = (idx) => setActiveTrip(prev => ({ ...prev, stops: prev.stops.filter((_, i) => i !== idx) }));
  const moveStop = (idx, dir) => {
    setActiveTrip(prev => {
      const s = [...(prev.stops || [])]; const t = idx + dir;
      if (t < 0 || t >= s.length) return prev;
      [s[idx], s[t]] = [s[t], s[idx]]; return { ...prev, stops: s };
    });
  };
  const updateNote = (idx, note) => setActiveTrip(prev => { const s = [...(prev.stops || [])]; s[idx] = { ...s[idx], note }; return { ...prev, stops: s }; });

  const createTrip = async () => {
    if (!newTripTitle.trim() || !user) return;
    const created = await base44.entities.Trip.create({ title: newTripTitle.trim(), creator_email: user.email, creator_name: user.full_name || user.email.split("@")[0], stops: [], is_public: false });
    setMyTrips(prev => [created, ...prev]);
    setActiveTrip(created); setShowNewTripForm(false); setNewTripTitle("");
  };

  const saveTrip = async () => {
    if (!activeTrip?.id) return; setSaving(true);
    const dists = calcDistances(activeTrip.stops) || distances;
    const totalKm = dists.filter(Boolean).reduce((a, b) => a + b, 0);
    const updated = await base44.entities.Trip.update(activeTrip.id, { ...activeTrip, total_distance_km: totalKm });
    setMyTrips(prev => prev.map(t => t.id === updated.id ? updated : t));
    setActiveTrip(updated); setSaving(false);
  };

  const shareTrip = async () => {
    if (!shareEmail.trim() || !activeTrip?.id) return;
    const shared = [...(activeTrip.shared_with || []), shareEmail.trim()];
    await base44.entities.Trip.update(activeTrip.id, { shared_with: shared });
    setActiveTrip(prev => ({ ...prev, shared_with: shared }));
    setShareEmail(""); setShowShareModal(false);
  };

  const addCollaborator = async () => {
    if (!collabEmail.trim() || !activeTrip?.id) return;
    const collabs = [...new Set([...(activeTrip.collaborators || []), collabEmail.trim()])];
    await base44.entities.Trip.update(activeTrip.id, { collaborators: collabs });
    setActiveTrip(prev => ({ ...prev, collaborators: collabs }));
    setMyTrips(prev => prev.map(t => t.id === activeTrip.id ? { ...t, collaborators: collabs } : t));
    setCollabEmail("");
  };

  const removeCollaborator = async (email) => {
    if (!activeTrip?.id) return;
    const collabs = (activeTrip.collaborators || []).filter(e => e !== email);
    await base44.entities.Trip.update(activeTrip.id, { collaborators: collabs });
    setActiveTrip(prev => ({ ...prev, collaborators: collabs }));
  };

  const isOwner = activeTrip?.creator_email === user?.email;
  const totalDist = distances.filter(Boolean).reduce((a, b) => a + b, 0);
  const stops = activeTrip?.stops || [];
  const collabs = activeTrip?.collaborators || [];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg-app)", paddingBottom: "env(safe-area-inset-bottom, 16px)" }}>
      {/* AI Wizard */}
      <AnimatePresence>
        {showAIWizard && user && (
          <AIWizard user={user} onClose={() => setShowAIWizard(false)}
            onTripGenerated={(trip) => { setMyTrips(prev => [trip, ...prev]); setActiveTrip(trip); setShowAIWizard(false); setView("list"); }} />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="sticky top-0 z-30 px-4 pt-4 pb-3" style={{ backgroundColor: "var(--bg-nav)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--border-subtle)", paddingTop: "max(env(safe-area-inset-top, 16px), 16px)" }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-md" style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
              <Route className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                {activeTrip ? activeTrip.title : "Trippin'"}
              </h1>
              <p className="text-[11px] font-semibold" style={{ color: "var(--text-hint)" }}>
                {activeTrip ? `${stops.length} stops · ${formatKm(totalDist)}` : "AI-powered travel planning ✦"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeTrip ? (
              <>
                <button onClick={() => setShowShareModal(true)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                  <Share2 className="w-4 h-4" style={{ color: "var(--text-primary)" }} />
                </button>
                <button onClick={saveTrip} disabled={saving} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold" style={{ background: "linear-gradient(135deg,#4F46E5,#7C3AED)", color: "#fff" }}>
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                </button>
                <button onClick={() => setActiveTrip(null)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                  <X className="w-4 h-4" style={{ color: "var(--text-primary)" }} />
                </button>
              </>
            ) : (
              <button onClick={() => setShowNewTripForm(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}>
                <Plus className="w-4 h-4" /> Manual
              </button>
            )}
          </div>
        </div>

        {activeTrip && (
          <div className="flex gap-2">
            <div className="flex gap-1 p-1 rounded-2xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", width: "fit-content" }}>
              {[{ key: "list", icon: List }, { key: "map", icon: Map }].map(({ key, icon: Icon }) => (
                <button key={key} onClick={() => setView(key)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                  style={{ backgroundColor: view === key ? "#4F46E5" : "transparent", color: view === key ? "#fff" : "var(--text-hint)" }}>
                  <Icon className="w-3.5 h-3.5" /> {key === "list" ? "Itinerary" : "Map"}
                </button>
              ))}
            </div>
            {isOwner && (
              <button onClick={() => setShowCollabModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                style={{ backgroundColor: collabs.length > 0 ? "#EEF2FF" : "var(--bg-card)", border: "1px solid var(--border-light)", color: collabs.length > 0 ? "#4F46E5" : "var(--text-secondary)" }}>
                <Users className="w-3.5 h-3.5" /> {collabs.length > 0 ? `${collabs.length} Collab${collabs.length > 1 ? "s" : ""}` : "Invite"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* New Trip Form */}
      <AnimatePresence>
        {showNewTripForm && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="mx-4 mt-4 p-4 rounded-2xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
            <p className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>Trip name</p>
            <input value={newTripTitle} onChange={e => setNewTripTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && createTrip()}
              placeholder="e.g. NYC Weekend Adventure"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none mb-3"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
            <div className="flex gap-2">
              <button onClick={createTrip} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: "linear-gradient(135deg,#4F46E5,#7C3AED)", color: "#fff" }}>Create</button>
              <button onClick={() => setShowNewTripForm(false)} className="px-4 py-2.5 rounded-xl text-sm font-bold" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ACTIVE TRIP — LIST VIEW */}
      {activeTrip && view === "list" && (
        <div className="flex-1 overflow-y-auto pb-32">
          {/* AI-generated highlights banner */}
          {activeTrip.ai_generated && activeTrip.ai_highlights?.length > 0 && (
            <div className="mx-4 mt-4 p-4 rounded-2xl" style={{ background: "linear-gradient(135deg, #1E1B4B, #2E1065)", border: "1px solid rgba(129,140,248,0.3)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4" style={{ color: "#818CF8" }} />
                <span className="text-xs font-bold" style={{ color: "#818CF8" }}>AI-Curated for you</span>
              </div>
              <p className="text-sm text-white mb-3 leading-relaxed">{activeTrip.description}</p>
              <div className="space-y-1.5">
                {activeTrip.ai_highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Star className="w-3 h-3 shrink-0" style={{ color: "#F59E0B" }} />
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.8)" }}>{h}</span>
                  </div>
                ))}
              </div>
              {activeTrip.ai_budget_tip && (
                <div className="mt-3 p-2.5 rounded-xl" style={{ backgroundColor: "rgba(79,70,229,0.3)" }}>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.75)" }}>💡 {activeTrip.ai_budget_tip}</p>
                </div>
              )}
            </div>
          )}

          {/* Search to add stops */}
          <div className="px-4 pt-4 pb-2">
            <div className="relative">
              <div className="flex items-center gap-2 px-4 py-3 rounded-2xl" style={{ backgroundColor: "var(--bg-card)", border: "1.5px solid var(--accent-primary)", boxShadow: "0 0 0 3px rgba(79,70,229,0.08)" }}>
                <Search className="w-4 h-4 shrink-0" style={{ color: "var(--accent-primary)" }} />
                <input value={search} onChange={e => handleSearch(e.target.value)} onFocus={() => setShowSearch(true)}
                  placeholder="Search & add a place…"
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: "var(--text-primary)", border: "none", minHeight: "unset", boxShadow: "none", fontSize: 14, padding: 0 }} />
                {searchLoading && <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--text-hint)" }} />}
                {search && <button onClick={() => { setSearch(""); setSearchResults([]); }}><X className="w-4 h-4" style={{ color: "var(--text-hint)" }} /></button>}
              </div>
              {showSearch && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 rounded-2xl overflow-hidden z-40" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 12px 40px rgba(0,0,0,0.15)" }}>
                  {searchResults.map((pred, i) => (
                    <button key={pred.place_id} onClick={() => addStop(pred)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left"
                      style={{ borderBottom: i < searchResults.length - 1 ? "1px solid var(--border-subtle)" : "none", backgroundColor: "transparent" }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--accent-primary-light)" }}>
                        <MapPin className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{pred.structured_formatting?.main_text}</p>
                        <p className="text-xs truncate" style={{ color: "var(--text-hint)" }}>{pred.structured_formatting?.secondary_text}</p>
                      </div>
                      <Plus className="w-4 h-4 shrink-0" style={{ color: "var(--accent-primary)" }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {stops.length === 0 ? (
            <div className="py-12 text-center px-8">
              <div className="text-5xl mb-4">🗺️</div>
              <p className="text-base font-bold mb-2" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>No stops yet</p>
              <p className="text-sm" style={{ color: "var(--text-hint)" }}>Search for places above to build your itinerary</p>
            </div>
          ) : (
            <div className="px-4 pt-2 space-y-1">
              {/* Group by day for AI trips */}
              {stops.map((stop, i) => (
                <React.Fragment key={i}>
                  {/* Day header for AI trips */}
                  {activeTrip.ai_generated && (i === 0 || stop.day !== stops[i - 1]?.day) && stop.day && (
                    <div className="flex items-center gap-2 pt-2 pb-1">
                      <div className="px-3 py-1 rounded-full text-xs font-black" style={{ background: "linear-gradient(135deg,#4F46E5,#7C3AED)", color: "#fff" }}>
                        Day {stop.day}
                      </div>
                      <div className="h-px flex-1" style={{ backgroundColor: "var(--border-subtle)" }} />
                    </div>
                  )}
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.3) }}
                    className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                    {stop.photo && (
                      <div className="relative" style={{ height: 90 }}>
                        <img src={stop.photo} alt={stop.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.55) 0%, transparent 60%)" }} />
                        <div className="absolute top-2 left-3 w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm" style={{ backgroundColor: "#4F46E5", color: "#fff" }}>{i + 1}</div>
                        {stop.type && (
                          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold capitalize" style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "#fff" }}>{stop.type}</div>
                        )}
                      </div>
                    )}
                    <div className="p-3">
                      <div className="flex items-start gap-2">
                        {!stop.photo && (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0" style={{ backgroundColor: "#4F46E5", color: "#fff" }}>{i + 1}</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>{stop.name}</p>
                          <p className="text-xs truncate" style={{ color: "var(--text-hint)" }}>{stop.address}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => moveStop(i, -1)} disabled={i === 0} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--bg-subtle)", opacity: i === 0 ? 0.3 : 1, minWidth: 28, minHeight: 28 }}>
                            <ArrowUp className="w-3.5 h-3.5" style={{ color: "var(--text-secondary)" }} />
                          </button>
                          <button onClick={() => moveStop(i, 1)} disabled={i === stops.length - 1} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--bg-subtle)", opacity: i === stops.length - 1 ? 0.3 : 1, minWidth: 28, minHeight: 28 }}>
                            <ArrowDown className="w-3.5 h-3.5" style={{ color: "var(--text-secondary)" }} />
                          </button>
                          <button onClick={() => removeStop(i)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#FEE2E2", minWidth: 28, minHeight: 28 }}>
                            <Trash2 className="w-3.5 h-3.5" style={{ color: "#DC2626" }} />
                          </button>
                        </div>
                      </div>
                      <input value={stop.note} onChange={e => updateNote(i, e.target.value)}
                        placeholder="Add a note… (optional)"
                        className="w-full mt-2 px-3 py-2 rounded-xl text-xs outline-none"
                        style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }} />
                    </div>
                  </motion.div>
                  {i < stops.length - 1 && (
                    <div className="flex items-center justify-center gap-2 py-0.5">
                      <div className="h-px flex-1" style={{ backgroundColor: "var(--border-subtle)" }} />
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
                        <Navigation className="w-3 h-3" />
                        {distances[i] != null ? formatKm(distances[i]) : "—"}
                      </div>
                      <div className="h-px flex-1" style={{ backgroundColor: "var(--border-subtle)" }} />
                    </div>
                  )}
                </React.Fragment>
              ))}

              {stops.length > 1 && (
                <div className="mt-4 p-4 rounded-2xl" style={{ background: "linear-gradient(135deg, rgba(79,70,229,0.08), rgba(124,58,237,0.08))", border: "1px solid rgba(79,70,229,0.15)" }}>
                  <div className="flex items-center justify-between">
                    <div><p className="text-xs font-semibold" style={{ color: "var(--text-hint)" }}>TOTAL ROUTE</p><p className="text-xl font-bold" style={{ color: "var(--accent-primary)", fontFamily: "var(--font-serif)" }}>{formatKm(totalDist)}</p></div>
                    <div className="text-right"><p className="text-xs font-semibold" style={{ color: "var(--text-hint)" }}>STOPS</p><p className="text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{stops.length}</p></div>
                    <button onClick={() => window.open(`https://www.google.com/maps/dir/${stops.filter(s => s.lat && s.lng).map(s => `${s.lat},${s.lng}`).join("/")}`, "_blank")}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold"
                      style={{ background: "linear-gradient(135deg,#4F46E5,#7C3AED)", color: "#fff" }}>
                      <Navigation className="w-4 h-4" /> Go
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ACTIVE TRIP — MAP VIEW */}
      {activeTrip && view === "map" && (
        <div style={{ position: "relative", height: "calc(100dvh - 140px)", overflow: "hidden" }}>
          <div ref={mapRef} style={{ position: "absolute", inset: 0, zIndex: 0 }} />
          {!mapReady && (
            <div className="absolute inset-0 flex items-center justify-center z-10" style={{ backgroundColor: "var(--bg-app)" }}>
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--accent-primary)" }} />
            </div>
          )}
          {stops.length > 0 && (
            <div className="absolute bottom-4 left-3 right-3 z-10 rounded-2xl p-3 overflow-x-auto scrollbar-hide"
              style={{ backgroundColor: "rgba(255,255,255,0.97)", backdropFilter: "blur(16px)", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
              <div className="flex gap-2">
                {stops.map((stop, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-3 py-2 rounded-xl shrink-0" style={{ backgroundColor: "#EEF2FF", border: "1px solid #C7D2FE" }}>
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" style={{ backgroundColor: "#4F46E5", color: "#fff" }}>{i + 1}</span>
                    <span className="text-xs font-semibold truncate" style={{ maxWidth: 80, color: "#1E1B4B" }}>{stop.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MY TRIPS / LANDING */}
      {!activeTrip && (
        <div className="flex-1 overflow-y-auto pb-32">
          {/* Hero AI Banner */}
          <div className="mx-4 mt-4 rounded-3xl overflow-hidden" style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E1B4B 60%, #2E1065 100%)" }}>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4" style={{ color: "#818CF8" }} />
                <span className="text-xs font-bold tracking-wide" style={{ color: "#818CF8" }}>AI-POWERED TRIP PLANNER</span>
              </div>
              <h2 className="text-xl font-black text-white mb-1" style={{ fontFamily: "var(--font-serif)" }}>Plan your perfect trip in seconds ✨</h2>
              <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.6)" }}>Tell our AI your preferences, budget & interests — get a hyper-personalized itinerary instantly.</p>
              <div className="flex gap-2 flex-wrap mb-3">
                {["🍽️ Curated dining", "🏨 Accommodations", "🎭 Activities", "💰 Budget-smart"].map(tag => (
                  <span key={tag} className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: "rgba(129,140,248,0.2)", color: "#818CF8" }}>{tag}</span>
                ))}
              </div>
              <button onClick={() => setShowAIWizard(true)}
                className="w-full py-3.5 rounded-2xl text-base font-black flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg,#4F46E5,#7C3AED,#EC4899)", color: "#fff", boxShadow: "0 8px 24px rgba(124,58,237,0.5)" }}>
                <Wand2 className="w-5 h-5" /> Generate AI Trip Plan
              </button>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 mx-4 mt-4 mb-3 p-1 rounded-2xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
            {[{ key: "my", label: "My Trips" }, { key: "shared", label: `Shared (${sharedTrips.length})` }].map(({ key, label }) => (
              <button key={key} onClick={() => setActiveTab(key)} className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                style={{ backgroundColor: activeTab === key ? "#4F46E5" : "transparent", color: activeTab === key ? "#fff" : "var(--text-hint)" }}>
                {label}
              </button>
            ))}
          </div>

          {activeTab === "my" && (
            <div className="px-4 space-y-3">
              {myTrips.length === 0 && !showNewTripForm ? (
                <div className="py-12 text-center">
                  <div className="text-5xl mb-3">✈️</div>
                  <p className="text-base font-bold mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>No trips yet</p>
                  <p className="text-sm" style={{ color: "var(--text-hint)" }}>Use the AI wizard above or create manually</p>
                </div>
              ) : (
                myTrips.map(trip => <TripCard key={trip.id} trip={trip} onClick={() => { setActiveTrip(trip); setView("list"); }} />)
              )}
            </div>
          )}

          {activeTab === "shared" && (
            <div className="px-4 space-y-3">
              {sharedTrips.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="text-5xl mb-3">🤝</div>
                  <p className="text-base font-bold mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>No shared trips yet</p>
                  <p className="text-sm" style={{ color: "var(--text-hint)" }}>When someone adds you as a collaborator, trips appear here</p>
                </div>
              ) : (
                sharedTrips.map(trip => <TripCard key={trip.id} trip={trip} onClick={() => { setActiveTrip(trip); setView("list"); }} shared />)
              )}
            </div>
          )}
        </div>
      )}

      {/* Collaborators Modal */}
      <AnimatePresence>
        {showCollabModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            onClick={() => setShowCollabModal(false)}>
            <motion.div initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }}
              className="w-full max-w-md rounded-3xl p-6" style={{ backgroundColor: "var(--bg-card)" }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-2 mb-1"><Users className="w-4 h-4" style={{ color: "var(--accent-primary)" }} /><h3 className="text-base font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Collaborators</h3></div>
              <p className="text-xs mb-4" style={{ color: "var(--text-hint)" }}>Collaborators can view, edit stops, add notes, and save this trip.</p>
              {collabs.length > 0 && (
                <div className="mb-4 space-y-2">
                  {collabs.map(email => (
                    <div key={email} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ backgroundColor: "var(--bg-subtle)" }}>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: "#4F46E5" }}>{email[0].toUpperCase()}</div>
                        <span className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)", maxWidth: 200 }}>{email}</span>
                      </div>
                      <button onClick={() => removeCollaborator(email)} className="w-6 h-6 flex items-center justify-center rounded-full" style={{ backgroundColor: "#FEE2E2", minWidth: 24, minHeight: 24 }}>
                        <X className="w-3 h-3" style={{ color: "#DC2626" }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input value={collabEmail} onChange={e => setCollabEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && addCollaborator()}
                  placeholder="Add by email…" className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
                <button onClick={addCollaborator} className="px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-1" style={{ background: "linear-gradient(135deg,#4F46E5,#7C3AED)", color: "#fff" }}>
                  <UserPlus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            onClick={() => setShowShareModal(false)}>
            <motion.div initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }}
              className="w-full max-w-md rounded-3xl p-6" style={{ backgroundColor: "var(--bg-card)" }}
              onClick={e => e.stopPropagation()}>
              <h3 className="text-base font-bold mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Share Trip</h3>
              <p className="text-xs mb-4" style={{ color: "var(--text-hint)" }}>Share "{activeTrip?.title}"</p>
              <input value={shareEmail} onChange={e => setShareEmail(e.target.value)} placeholder="Friend's email"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none mb-3"
                style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
              <button onClick={shareTrip} className="w-full py-3 rounded-2xl text-sm font-bold" style={{ background: "linear-gradient(135deg,#4F46E5,#7C3AED)", color: "#fff" }}>Share</button>
              <button onClick={() => window.open(`https://www.google.com/maps/dir/${(activeTrip?.stops || []).filter(s => s.lat).map(s => `${s.lat},${s.lng}`).join("/")}`, "_blank")}
                className="w-full mt-2 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
                style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)" }}>
                <Navigation className="w-4 h-4" /> Open in Google Maps
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TripCard({ trip, onClick, shared }) {
  return (
    <motion.button onClick={onClick} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all active:scale-[0.98]"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-2xl"
        style={{ background: shared ? "linear-gradient(135deg,rgba(20,184,166,0.12),rgba(16,185,129,0.12))" : trip.ai_generated ? "linear-gradient(135deg,rgba(79,70,229,0.2),rgba(236,72,153,0.2))" : "linear-gradient(135deg,rgba(79,70,229,0.12),rgba(124,58,237,0.12))", border: `1px solid ${shared ? "rgba(20,184,166,0.2)" : trip.ai_generated ? "rgba(129,140,248,0.3)" : "rgba(79,70,229,0.2)"}` }}>
        {shared ? "🤝" : trip.ai_generated ? "✨" : "🗺️"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="font-bold text-sm truncate" style={{ color: "var(--text-primary)" }}>{trip.title}</p>
          {trip.ai_generated && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0" style={{ background: "linear-gradient(135deg,#4F46E5,#EC4899)", color: "#fff" }}>AI</span>}
        </div>
        <p className="text-xs" style={{ color: "var(--text-hint)" }}>
          {trip.stops?.length || 0} stop{(trip.stops?.length || 0) !== 1 ? "s" : ""}
          {trip.total_distance_km ? ` · ${trip.total_distance_km.toFixed(1)}km` : ""}
          {shared ? ` · by ${trip.creator_name || trip.creator_email?.split("@")[0]}` : ""}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "var(--text-hint)" }} />
    </motion.button>
  );
}