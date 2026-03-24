import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import TripDestinationCard from "@/components/TripDestinationCard";
import TripDetailModal from "@/components/TripDetailModal";
import {
  Search, Loader2, ChevronRight, Map, List,
  Route, Save, Users, UserPlus, Sparkles, ChevronLeft,
  DollarSign, Calendar, Heart, Briefcase, Star, Wand2,
  MapPin, Plus, X, Trash2, ArrowUp, ArrowDown, Share2, Navigation
} from "lucide-react";

function formatKm(km) {
  if (!km) return "—";
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

// ── AI Onboarding Wizard (unchanged from original) ──────────────────────────
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
    const prompt = `You are an expert travel planner AI. Create a hyper-personalized ${days}-day trip itinerary for: ${destination}.
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

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}>
            {current.content}
          </motion.div>
        </AnimatePresence>
      </div>

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

// NYC Destinations Database
const NYC_DESTINATIONS = [
  {
    id: 1,
    name: "SoHo",
    description: "Trendy neighborhood with art galleries, boutiques, and world-class dining",
    tagline: "Arts, Culture & Nightlife",
    image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=500&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&h=400&fit=crop",
    ],
    budgetStart: 150,
    duration: 2,
    activityLevel: "Moderate",
    accommodation: "3-4 star hotels",
    fullDescription: "SoHo is Manhattan's most prestigious shopping and dining district. Browse independent boutiques on Spring Street, catch world-class exhibitions at cutting-edge galleries, and enjoy Michelin-starred restaurants alongside casual eateries. The neighborhood's cast-iron architecture and vibrant street life make it perfect for both culture seekers and foodies.",
    highlights: [
      "Gallery hopping on West Broadway",
      "Shopping on Spring Street",
      "Michelin-starred restaurants",
      "Street art and historic architecture",
    ],
    bestTime: "Year-round; best in fall & spring for comfortable weather",
    special: true,
  },
  {
    id: 2,
    name: "Williamsburg",
    description: "Hip Brooklyn neighborhood with rooftop bars, indie coffee shops, and street art",
    tagline: "Hip & Creative Energy",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1489749798305-4fea3ba63d60?w=600&h=400&fit=crop",
    ],
    budgetStart: 120,
    duration: 2,
    activityLevel: "Relaxed",
    accommodation: "Boutique hotels & Airbnb",
    fullDescription: "Williamsburg is Brooklyn's creative heart, known for trendy rooftop bars, vintage fashion boutiques, and Instagram-worthy street murals. Walk the waterfront for Manhattan views, explore the vibrant nightlife scene, and discover emerging artists at independent galleries. The neighborhood perfectly blends hipster cool with authentic community charm.",
    highlights: [
      "Rooftop bars with skyline views",
      "Vintage shopping on Bedford Ave",
      "Street art & murals",
      "Craft breweries and cafés",
    ],
    bestTime: "Summer for outdoor bars; autumn for perfect weather",
  },
  {
    id: 3,
    name: "Upper East Side",
    description: "Upscale Manhattan with world-famous museums, Central Park access, and fine dining",
    tagline: "Culture, History & Elegance",
    image: "https://images.unsplash.com/photo-1516557595335-b1b49fcb5b3d?w=500&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1516557595335-b1b49fcb5b3d?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=400&fit=crop",
    ],
    budgetStart: 200,
    duration: 3,
    activityLevel: "Moderate",
    accommodation: "Luxury hotels",
    fullDescription: "Home to the world's best museums including the Met, MoMA, and Natural History Museum, the Upper East Side is a cultural paradise. Stroll through Central Park, enjoy upscale shopping on Madison Avenue, and dine at renowned restaurants. Perfect for art lovers and those seeking sophisticated NYC experiences.",
    highlights: [
      "Metropolitan Museum of Art",
      "Central Park walks & picnics",
      "Madison Avenue shopping",
      "Fine dining institutions",
    ],
    bestTime: "Spring (cherry blossoms in Park) and fall foliage",
  },
  {
    id: 4,
    name: "Lower East Side",
    description: "Bohemian neighborhood with vintage shops, dive bars, street food, and nightlife",
    tagline: "Budget-Friendly & Eclectic",
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1487659055127-d4b66b1690bb?w=600&h=400&fit=crop",
    ],
    budgetStart: 80,
    duration: 2,
    activityLevel: "High",
    accommodation: "Budget hostels & hotels",
    fullDescription: "The Lower East Side is NYC's most authentic, affordable neighborhood. Explore the historic immigrant tenement buildings, discover tiny vintage shops along Orchard Street, and experience legendary dive bars and underground music venues. Street food vendors offer world-class cuisine at budget prices.",
    highlights: [
      "Vintage shopping on Orchard Street",
      "Legendary dive bars",
      "Street food & ethnic cuisine",
      "Historic tenement museums",
    ],
    bestTime: "Summer (outdoor dining & markets) year-round affordability",
    special: true,
  },
  {
    id: 5,
    name: "Greenwich Village",
    description: "Charming West Village with tree-lined streets, jazz clubs, bookstores, and cafés",
    tagline: "Bohemian & Literary",
    image: "https://images.unsplash.com/photo-1534080564842-39a9e635b032?w=500&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1534080564842-39a9e635b032?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop",
    ],
    budgetStart: 140,
    duration: 2,
    activityLevel: "Relaxed",
    accommodation: "Boutique hotels",
    fullDescription: "Greenwich Village is Manhattan's most picturesque neighborhood with charming brownstones, intimate jazz clubs, and iconic bookstores like The Strand. Walk the tree-lined streets, discover hidden gardens, visit historic cafés where artists once gathered, and catch live jazz in legendary clubs. A romantic escape within NYC.",
    highlights: [
      "Live jazz at Blue Note & Village Vanguard",
      "The Strand Bookstore (18 miles of books)",
      "Hidden gardens & tree-lined streets",
      "Historic cafés & restaurants",
    ],
    bestTime: "Fall for mild weather; summer for outdoor jazz",
  },
];

// ── Main TripPlanner ──────────────────────────────────────────────────────────
export default function TripPlanner() {
  const [user, setUser] = useState(null);
  const [myTrips, setMyTrips] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [showAIWizard, setShowAIWizard] = useState(false);
  const [activeTab, setActiveTab] = useState("browse");
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [showDestinationModal, setShowDestinationModal] = useState(false);
  const [sharedTrips, setSharedTrips] = useState([]);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user?.email) return;
    base44.entities.Trip.filter({ creator_email: user.email }, "-created_date", 50).then(setMyTrips).catch(() => {});
    base44.entities.Trip.list("-created_date", 200).then(all => {
      setSharedTrips(all.filter(t => t.creator_email !== user.email && (t.collaborators || []).includes(user.email)));
    }).catch(() => {});
  }, [user?.email]);

  const handleDestinationClick = (dest) => {
    setSelectedDestination(dest);
    setShowDestinationModal(true);
  };

  const handleBookDestination = () => {
    setShowDestinationModal(false);
    setTimeout(() => setShowAIWizard(true), 300);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg-app)", paddingBottom: "env(safe-area-inset-bottom, 16px)" }}>
      {/* Destination Detail Modal */}
      <AnimatePresence>
        {showDestinationModal && selectedDestination && (
          <TripDetailModal
            destination={selectedDestination}
            onClose={() => setShowDestinationModal(false)}
            onBook={handleBookDestination}
          />
        )}
      </AnimatePresence>

      {/* AI Wizard */}
      <AnimatePresence>
        {showAIWizard && user && (
          <AIWizard user={user} onClose={() => setShowAIWizard(false)}
            onTripGenerated={(trip) => { setMyTrips(prev => [trip, ...prev]); setActiveTrip(trip); setShowAIWizard(false); }} />
        )}
      </AnimatePresence>

      {!activeTrip ? (
        <>
          {/* Header */}
          <div className="sticky top-0 z-30 px-4 pt-4 pb-4" style={{ backgroundColor: "var(--bg-nav)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--border-subtle)", paddingTop: "max(env(safe-area-inset-top, 16px), 16px)" }}>
            {/* Greeting */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold" style={{ color: "var(--text-hint)" }}>Good to see you,</p>
                <h1 className="text-2xl font-black leading-tight" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                  {user?.full_name?.split(" ")[0] || "Explorer"}
                </h1>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
                {user?.full_name?.[0] || "?"}
              </div>
            </div>

            {/* Search bar */}
            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl mb-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
              <Search className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
              <input
                type="text"
                placeholder="Find your next adventure"
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: "var(--text-primary)", border: "none", minHeight: "unset", boxShadow: "none", padding: 0 }}
              />
            </div>

            {/* Tab switcher */}
            <div className="flex gap-1 p-1 rounded-2xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
              {[{ key: "browse", label: "Browse Destinations" }, { key: "my", label: "My Trips" }].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
                  style={{ backgroundColor: activeTab === key ? "#4F46E5" : "transparent", color: activeTab === key ? "#fff" : "var(--text-hint)" }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto pb-32">
            {activeTab === "browse" && (
              <div className="px-4 pt-4 space-y-4">
                {NYC_DESTINATIONS.map(dest => (
                  <div key={dest.id} onClick={() => handleDestinationClick(dest)}>
                    <TripDestinationCard destination={dest} onClick={() => handleDestinationClick(dest)} />
                  </div>
                ))}
              </div>
            )}

            {activeTab === "my" && (
              <div className="px-4 pt-4">
                {myTrips.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="text-5xl mb-3">✈️</div>
                    <p className="text-base font-bold mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>No trips yet</p>
                    <p className="text-sm" style={{ color: "var(--text-hint)" }}>Create your first trip with AI</p>
                    <button onClick={() => setShowAIWizard(true)} className="mt-4 px-4 py-2.5 rounded-2xl text-sm font-bold" style={{ background: "linear-gradient(135deg,#4F46E5,#7C3AED)", color: "#fff" }}>
                      Create Trip
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myTrips.map(trip => (
                      <motion.button
                        key={trip.id}
                        onClick={() => setActiveTrip(trip)}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all active:scale-[0.98]"
                        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
                      >
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: "linear-gradient(135deg,rgba(79,70,229,0.2),rgba(236,72,153,0.2))", border: "1px solid rgba(79,70,229,0.2)" }}>
                          ✨
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{trip.title}</p>
                          <p className="text-xs" style={{ color: "var(--text-hint)" }}>{trip.stops?.length || 0} stops</p>
                        </div>
                        <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "var(--text-hint)" }} />
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        // Active trip view (simplified for space)
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <button onClick={() => setActiveTrip(null)} className="mb-4 px-4 py-2 rounded-xl text-sm font-bold" style={{ backgroundColor: "var(--bg-card)" }}>
            ← Back
          </button>
          <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>{activeTrip.title}</h2>
          <p style={{ color: "var(--text-secondary)" }}>{activeTrip.description}</p>
        </div>
      )}
    </div>
  );
}