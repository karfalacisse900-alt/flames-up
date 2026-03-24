import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import {
  Search, Bell, ChevronLeft, MapPin, Clock, Users, Star,
  Sparkles, X, ArrowRight, Bookmark, Share2, Navigation,
  DollarSign, Calendar, Wand2, ChevronRight, Route, Save,
  Loader2, Plus, Trash2, ArrowUp, ArrowDown
} from "lucide-react";

// NYC-focused places data
const NYC_CATEGORIES = ["All", "Iconic", "Hidden Gems", "Food & Drink", "Parks", "Arts", "Nightlife"];

const NYC_PLACES = [
  {
    id: "central-park",
    name: "Central Park",
    neighborhood: "Midtown / Upper West Side",
    tagline: "843 acres of urban paradise",
    description: "New York City's most iconic green space spans 843 acres in the heart of Manhattan. Home to meadows, lakes, the famous Bethesda Fountain, and year-round events, Central Park is the beating heart of NYC. Perfect for morning jogs, rowboat rides, or simply escaping the city buzz.",
    image: "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=800&q=80",
    badge: "Iconic",
    budget_from: "Free",
    duration: "2–4 hrs",
    activity_level: "Easy",
    best_for: "Families, Couples",
    highlights: ["Bethesda Fountain", "The Mall", "Strawberry Fields", "Bow Bridge"],
    tips: "Visit early morning for stunning light and fewer crowds. Free concerts happen all summer.",
    rating: 4.9,
    reviews: 48200,
  },
  {
    id: "brooklyn-bridge",
    name: "Brooklyn Bridge",
    neighborhood: "Downtown Manhattan",
    tagline: "Walk the world's most iconic bridge",
    description: "One of the oldest suspension bridges in the US, the Brooklyn Bridge connects Manhattan to Brooklyn with breathtaking views of the skyline and the East River. The pedestrian walkway offers unbeatable photo opportunities and a feeling of true New York history.",
    image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80",
    badge: "Iconic",
    budget_from: "Free",
    duration: "1–2 hrs",
    activity_level: "Easy",
    best_for: "Everyone",
    highlights: ["Pedestrian walkway", "DUMBO views", "Brooklyn Bridge Park"],
    tips: "Walk Manhattan → Brooklyn direction for better skyline views. Sunrise is magical.",
    rating: 4.8,
    reviews: 62400,
  },
  {
    id: "high-line",
    name: "The High Line",
    neighborhood: "Chelsea / Meatpacking",
    tagline: "An elevated park above the city",
    description: "A 1.45-mile elevated linear park built on a former freight rail line. The High Line weaves through Chelsea and the Meatpacking District, offering unique city views, public art installations, lush plantings, and access to some of NYC's best restaurants and galleries below.",
    image: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800&q=80",
    badge: "Hidden Gem",
    budget_from: "Free",
    duration: "1–3 hrs",
    activity_level: "Easy",
    best_for: "Art lovers, Couples",
    highlights: ["Hudson Yards views", "Public art", "Chelsea Market access", "Wildflower meadows"],
    tips: "Enter at Gansevoort St for the full experience. Peak sunset views from 10th Ave Square.",
    rating: 4.7,
    reviews: 35600,
  },
  {
    id: "times-square",
    name: "Times Square",
    neighborhood: "Midtown",
    tagline: "The crossroads of the world",
    description: "The dazzling epicenter of New York City, Times Square blazes with LED billboards, Broadway marquees, and millions of visitors. Whether you're catching a show, people-watching, or hunting for a midnight snack, this is the NYC experience everyone knows.",
    image: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80",
    badge: "Iconic",
    budget_from: "$0–$200+",
    duration: "1–3 hrs",
    activity_level: "Easy",
    best_for: "First-timers",
    highlights: ["Broadway shows", "TKTS booth", "Madame Tussauds", "Midnight ball drop"],
    tips: "Grab discounted Broadway tickets at the TKTS booth. Avoid peak dinner rush (6–8pm).",
    rating: 4.5,
    reviews: 89300,
  },
  {
    id: "dumbo",
    name: "DUMBO, Brooklyn",
    neighborhood: "Brooklyn",
    tagline: "NYC's most photographed block",
    description: "Down Under the Manhattan Bridge Overpass — DUMBO is a charming Brooklyn neighborhood known for its cobblestone streets, breathtaking bridge views, and thriving arts scene. The iconic view of Manhattan Bridge framed by Washington Street is one of the most photographed spots in the world.",
    image: "https://images.unsplash.com/photo-1555109307-f7d9da25c244?w=800&q=80",
    badge: "Hidden Gem",
    budget_from: "Free",
    duration: "2–4 hrs",
    activity_level: "Easy",
    best_for: "Photographers, Foodies",
    highlights: ["Washington St photo spot", "Brooklyn Bridge Park", "Jane's Carousel", "Grimaldi's Pizza"],
    tips: "The Manhattan Bridge framing shot is on Washington St between Front & Water. Golden hour is best.",
    rating: 4.8,
    reviews: 28700,
  },
  {
    id: "moma",
    name: "MoMA",
    neighborhood: "Midtown",
    tagline: "Where modern art lives",
    description: "The Museum of Modern Art houses one of the world's greatest collections of modern and contemporary art, featuring works by Van Gogh, Picasso, Warhol, Frida Kahlo, and more. The building itself is an architectural marvel, and the sculpture garden is a peaceful urban retreat.",
    image: "https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&q=80",
    badge: "Arts",
    budget_from: "$30",
    duration: "2–5 hrs",
    activity_level: "Easy",
    best_for: "Art lovers, Culture seekers",
    highlights: ["Van Gogh's Starry Night", "Sculpture Garden", "Picasso collection", "Warhol prints"],
    tips: "Book tickets online in advance. Free on Friday evenings 5:30–9pm (timed entry required).",
    rating: 4.7,
    reviews: 41200,
  },
  {
    id: "chelsea-market",
    name: "Chelsea Market",
    neighborhood: "Chelsea",
    tagline: "NYC's ultimate food hall",
    description: "Built inside the old Nabisco factory where the Oreo cookie was invented, Chelsea Market is a 9-acre indoor food hall and shopping complex. With over 35 vendors — from lobster rolls to ramen, artisan chocolates to vintage books — it's a sensory overload in the best way.",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
    badge: "Food & Drink",
    budget_from: "$15–$40",
    duration: "1–3 hrs",
    activity_level: "Easy",
    best_for: "Foodies",
    highlights: ["The Lobster Place", "Los Tacos No. 1", "Anthropologie", "Artists & Fleas market"],
    tips: "Go for lunch on weekdays to avoid crowds. The Lobster Place has the freshest seafood in NYC.",
    rating: 4.6,
    reviews: 19800,
  },
  {
    id: "williamsburg",
    name: "Williamsburg",
    neighborhood: "Brooklyn",
    tagline: "Brooklyn's coolest neighborhood",
    description: "Once a working-class neighborhood, Williamsburg has transformed into one of NYC's trendiest districts, buzzing with indie boutiques, rooftop bars, farm-to-table restaurants, and live music venues. The waterfront offers stunning Manhattan skyline views, especially at sunset.",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    badge: "Nightlife",
    budget_from: "$20–$80",
    duration: "Half day",
    activity_level: "Easy",
    best_for: "Young adults, Foodies",
    highlights: ["East River waterfront", "Bedford Ave shopping", "Smorgasburg food market", "Live music"],
    tips: "Visit Smorgasburg on weekends (Sat: Prospect Park, Sun: East River). Check for live music at Brooklyn Bowl.",
    rating: 4.6,
    reviews: 22100,
  },
];

const FILTER_CHIPS = ["All", "Iconic", "Hidden Gems", "Food & Drink", "Parks", "Arts", "Nightlife"];

// ── Place Detail View ────────────────────────────────────────────────────────
function PlaceDetail({ place, user, onBack }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPlanTrip, setShowPlanTrip] = useState(false);

  const handleSave = async () => {
    if (!user || saving) return;
    setSaving(true);
    await base44.entities.SavedPlace.create({
      user_email: user.email,
      location_name: place.name,
      location_city: "New York City",
      location_country: "USA",
      save_type: "want_to_go",
    }).catch(() => {});
    setSaved(true);
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: "#0A0A0A" }}
    >
      {/* Hero image */}
      <div className="relative flex-shrink-0" style={{ height: "42vh" }}>
        <img src={place.image} alt={place.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 40%, rgba(10,10,10,0.8) 80%, #0A0A0A 100%)" }} />

        {/* Back + actions */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4" style={{ paddingTop: "max(env(safe-area-inset-top,16px),16px)" }}>
          <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)" }}>
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex gap-2">
            <button onClick={handleSave} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)" }}>
              <Bookmark className={`w-4 h-4 ${saved ? "fill-white text-white" : "text-white"}`} />
            </button>
            <button className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)" }}>
              <Share2 className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-32">
        {/* Badge */}
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3" style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.15)" }}>
          {place.badge}
        </span>

        <h1 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: "var(--font-serif)", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
          {place.name}
        </h1>
        <p className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>
          <MapPin className="w-3 h-3 inline mr-1" />{place.neighborhood}, New York City
        </p>

        {/* Budget */}
        <div className="flex items-baseline gap-1 mb-5 mt-2">
          <span className="text-xl font-bold text-white">{place.budget_from}</span>
          {place.budget_from !== "Free" && <span className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>per person</span>}
        </div>

        {/* Info chips */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
          {[
            { label: "Duration", value: place.duration },
            { label: "Activity", value: place.activity_level },
            { label: "Best For", value: place.best_for },
          ].map(item => (
            <div key={item.label} className="flex-shrink-0 px-4 py-2.5 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <p className="text-[10px] font-medium mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{item.label}</p>
              <p className="text-sm font-semibold text-white whitespace-nowrap">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-5">
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className={`w-4 h-4 ${i <= Math.round(place.rating) ? "fill-white text-white" : "text-white/20"}`} />
            ))}
          </div>
          <span className="text-sm font-semibold text-white">{place.rating}</span>
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>({place.reviews.toLocaleString()} reviews)</span>
        </div>

        {/* Description */}
        <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.65)" }}>
          {place.description}
        </p>

        {/* Highlights */}
        <div className="mb-6">
          <h3 className="text-base font-bold text-white mb-3" style={{ fontFamily: "var(--font-serif)" }}>Highlights</h3>
          <div className="flex flex-wrap gap-2">
            {place.highlights.map(h => (
              <span key={h} className="px-3 py-1.5 rounded-full text-xs font-medium" style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.12)" }}>
                {h}
              </span>
            ))}
          </div>
        </div>

        {/* Local tip */}
        <div className="p-4 rounded-2xl mb-4" style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <p className="text-xs font-bold mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>💡 LOCAL TIP</p>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>{place.tips}</p>
        </div>
      </div>

      {/* Book / Plan CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-5 py-4" style={{ paddingBottom: "max(env(safe-area-inset-bottom,16px),16px)", backgroundColor: "#0A0A0A", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <button
          onClick={() => setShowPlanTrip(true)}
          className="w-full py-4 rounded-2xl text-base font-bold text-black flex items-center justify-center gap-2"
          style={{ backgroundColor: "#FFFFFF" }}
        >
          <Route className="w-5 h-5" /> Add to Trip Plan
        </button>
      </div>

      {/* Quick add to trip */}
      <AnimatePresence>
        {showPlanTrip && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
            onClick={() => setShowPlanTrip(false)}>
            <motion.div initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }}
              className="w-full rounded-t-3xl px-6 py-8" style={{ backgroundColor: "#111111" }}
              onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 rounded-full mx-auto mb-6" style={{ backgroundColor: "rgba(255,255,255,0.2)" }} />
              <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-serif)" }}>Added to your NYC plan</h3>
              <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>Go to Trip Planner to view your full itinerary</p>
              <button onClick={() => setShowPlanTrip(false)}
                className="w-full py-4 rounded-2xl text-base font-bold text-black" style={{ backgroundColor: "#fff" }}>
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main TripPlanner ─────────────────────────────────────────────────────────
export default function TripPlanner() {
  const [user, setUser] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const filtered = NYC_PLACES.filter(p => {
    const matchesFilter = activeFilter === "All" || p.badge === activeFilter ||
      (activeFilter === "Hidden Gems" && p.badge === "Hidden Gem") ||
      (activeFilter === "Parks" && p.name.toLowerCase().includes("park"));
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.neighborhood.toLowerCase().includes(search.toLowerCase()) ||
      p.badge.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#0A0A0A" }}>
      {/* Place Detail Overlay */}
      <AnimatePresence>
        {selectedPlace && (
          <PlaceDetail place={selectedPlace} user={user} onBack={() => setSelectedPlace(null)} />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="px-5 pt-4" style={{ paddingTop: "max(env(safe-area-inset-top,16px),16px)" }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>Good to see you,</p>
            <h1 className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-serif)" }}>
              {user?.full_name?.split(" ")[0] || "Explorer"}
            </h1>
          </div>
          <button className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <Bell className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl mb-4" style={{ backgroundColor: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(255,255,255,0.4)" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Find your next NYC adventure"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "white", border: "none", boxShadow: "none", padding: 0, minHeight: "unset", fontSize: 14 }}
          />
          {search && (
            <button onClick={() => setSearch("")}>
              <X className="w-4 h-4" style={{ color: "rgba(255,255,255,0.4)" }} />
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {FILTER_CHIPS.map(chip => (
            <button
              key={chip}
              onClick={() => setActiveFilter(chip)}
              className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                backgroundColor: activeFilter === chip ? "#FFFFFF" : "rgba(255,255,255,0.07)",
                color: activeFilter === chip ? "#000" : "rgba(255,255,255,0.6)",
                border: `1px solid ${activeFilter === chip ? "transparent" : "rgba(255,255,255,0.12)"}`,
              }}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-32 mt-5">
        {/* Section title */}
        <div className="flex items-center justify-between px-5 mb-4">
          <h2 className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-serif)" }}>
            New York City
          </h2>
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{filtered.length} places</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-20 text-center px-8">
            <p className="text-4xl mb-3">🗽</p>
            <p className="text-base font-bold text-white mb-1" style={{ fontFamily: "var(--font-serif)" }}>No results found</p>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Try a different filter or search term</p>
          </div>
        ) : (
          <>
            {/* Featured card */}
            {featured && (
              <div className="px-5 mb-3">
                <motion.button
                  onClick={() => setSelectedPlace(featured)}
                  className="w-full relative rounded-3xl overflow-hidden"
                  style={{ height: 280 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <img src={featured.image} alt={featured.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)" }} />

                  {/* Badge */}
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "rgba(255,255,255,0.95)", color: "#000" }}>
                      ✦ {featured.badge}
                    </span>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="flex items-end justify-between mb-2">
                      <h3 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-serif)", letterSpacing: "-0.02em" }}>{featured.name}</h3>
                      <span className="text-sm font-semibold text-white">{featured.budget_from}</span>
                    </div>
                    <p className="text-xs text-left" style={{ color: "rgba(255,255,255,0.65)" }}>{featured.tagline}</p>
                  </div>
                </motion.button>
              </div>
            )}

            {/* Grid of other cards */}
            <div className="px-5 grid grid-cols-2 gap-3">
              {rest.map((place, i) => (
                <motion.button
                  key={place.id}
                  onClick={() => setSelectedPlace(place)}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="relative rounded-2xl overflow-hidden text-left"
                  style={{ height: 200 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <img src={place.image} alt={place.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 55%, transparent 100%)" }} />

                  {/* Small badge */}
                  <div className="absolute top-2.5 right-2.5">
                    <span className="px-2 py-1 rounded-full text-[10px] font-semibold" style={{ backgroundColor: "rgba(255,255,255,0.9)", color: "#000" }}>
                      {place.badge === "Hidden Gem" ? "✦ Gem" : place.badge}
                    </span>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-sm font-bold text-white leading-tight mb-0.5" style={{ fontFamily: "var(--font-serif)" }}>{place.name}</p>
                    <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.6)" }}>{place.budget_from}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </>
        )}

        {/* Hero tagline section */}
        <div className="mx-5 mt-6 rounded-3xl overflow-hidden relative" style={{ height: 200 }}>
          <img src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80" alt="NYC skyline" className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex flex-col justify-end p-6" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.2))" }}>
            <h2 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: "var(--font-serif)", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              Explore NYC<br />Without Limits
            </h2>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>Discover every corner of New York City</p>
          </div>
        </div>
      </div>
    </div>
  );
}