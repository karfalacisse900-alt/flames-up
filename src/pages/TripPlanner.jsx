import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import {
  Search, Sparkles, MapPin, Loader2, ChevronLeft,
  DollarSign, Clock, Star, Navigation, RefreshCw, Map
} from "lucide-react";
import BoroughDetail from "@/components/explore/BoroughDetail";

// ─── Borough data (browse mode) ───────────────────────────────────────────────
const BOROUGHS = [
  {
    id: "manhattan", name: "Manhattan", tagline: "The heart of New York City",
    description: "World-famous skyline, iconic museums, hidden delis, and neighborhoods full of character",
    image: "https://images.unsplash.com/photo-1485871981521-5b1fd3805bfe?w=600&h=400&fit=crop", emoji: "🏙️",
    neighborhoods: [
      { name: "SoHo", description: "Cast-iron architecture, boutique shopping, indie galleries and coffee shops on cobblestone streets", image: "https://images.unsplash.com/photo-1555529771-835f59fc5ef7?w=400&h=300&fit=crop", spots: [{ name: "McNally Jackson Books", type: "📚 Bookstore", cost: "Free", desc: "Independent bookstore with great reads and a cozy reading nook." }, { name: "Soho Square Park", type: "🌿 Public Space", cost: "Free", desc: "Tiny park perfect for people-watching." }, { name: "Housing Works Bookstore", type: "📚 Thrift + Books", cost: "Free", desc: "Beloved used bookstore & café that funds a great cause." }, { name: "Artists & Fleas Market", type: "🛍️ Market", cost: "Free entry", desc: "Local artisan market with unique jewelry, clothing, and art." }, { name: "Joe Coffee SoHo", type: "☕ Café", cost: "$3–7", desc: "Casual coffee spot perfect for a quick sit between exploring." }, { name: "Spring Street Salt Shed Mural", type: "🎨 Street Art", cost: "Free", desc: "Massive public mural — a great photo op." }, { name: "New York Public Library (Science)", type: "📚 Library", cost: "Free", desc: "Free wifi, AC, and reading chairs for all." }, { name: "Prince Street", type: "🚶 Walk", cost: "Free", desc: "Classic SoHo stroll with street art, buskers, and cast-iron architecture." }] },
      { name: "Greenwich Village", description: "Bohemian brownstones, live jazz clubs, hidden gardens, and NYU energy", image: "https://images.unsplash.com/photo-1534080564842-39a9e635b032?w=400&h=300&fit=crop", spots: [{ name: "Washington Square Park", type: "🌿 Park", cost: "Free", desc: "Iconic arch, chess players, street musicians — always something happening." }, { name: "The Strand Bookstore", type: "📚 Bookstore", cost: "Free to browse", desc: "18 miles of books — legendary indie bookstore since 1927." }, { name: "Village Vanguard", type: "🎵 Jazz Club", cost: "$35 + 2-drink min", desc: "The most storied jazz club in NYC, opened in 1935." }, { name: "Jefferson Market Garden", type: "🌿 Garden", cost: "Free", desc: "Hidden community garden open to public on weekends." }, { name: "White Horse Tavern", type: "🍺 Bar", cost: "$5–15", desc: "Historic bar from 1880 where Dylan Thomas and Jack Kerouac drank." }, { name: "Joe's Pizza (Original)", type: "🍕 Food", cost: "$3–5", desc: "The most iconic NYC slice. No frills, perfect pizza." }] },
      { name: "Harlem", description: "Rich culture, jazz history, gospel brunches, and soul food institutions", image: "https://images.unsplash.com/photo-1571986655572-b26ab95b8bcc?w=400&h=300&fit=crop", spots: [{ name: "Marcus Garvey Park", type: "🌿 Park", cost: "Free", desc: "Historic park with amphitheater and free community events." }, { name: "Studio Museum in Harlem", type: "🎨 Museum", cost: "Free on Sundays", desc: "Celebrates artists of African descent with rotating exhibitions." }, { name: "Apollo Theater", type: "🎭 Landmark", cost: "Free to walk by", desc: "Walk by the legendary marquee or take a tour." }, { name: "Sylvia's Restaurant", type: "🍽️ Dining", cost: "$15–30", desc: "The institution of Harlem soul food since 1962." }] },
    ],
  },
  {
    id: "brooklyn", name: "Brooklyn", tagline: "Creative, cultural, and always evolving",
    description: "Rooftop bars with Manhattan views, street murals, artisan markets, beaches, and world-class dining",
    image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=600&h=400&fit=crop", emoji: "🌉",
    neighborhoods: [
      { name: "Williamsburg", description: "The epicenter of Brooklyn cool — vintage shops, rooftop bars, street art", image: "https://images.unsplash.com/photo-1555529771-835f59fc5ef7?w=400&h=300&fit=crop", spots: [{ name: "Brooklyn Flea Market", type: "🛍️ Market", cost: "Free entry", desc: "One of the best flea markets in the country." }, { name: "East River State Park", type: "🌿 Park", cost: "Free", desc: "Sit on the waterfront grass and enjoy stunning Manhattan skyline views." }, { name: "Smorgasburg", type: "🍽️ Market", cost: "Free entry", desc: "100+ local food vendors every weekend — a NYC institution." }, { name: "McCarren Park", type: "🌿 Park", cost: "Free", desc: "Big neighborhood park with weekend sports and community events." }] },
      { name: "DUMBO", description: "Instagram-famous bridge views, cobblestone streets, galleries, and weekend markets", image: "https://images.unsplash.com/photo-1569154941061-e231b4aa8ebb?w=400&h=300&fit=crop", spots: [{ name: "Brooklyn Bridge Park", type: "🌿 Park", cost: "Free", desc: "Sprawling waterfront park with piers, gardens, and free kayaking." }, { name: "Jane's Carousel", type: "🎠 Attraction", cost: "$3", desc: "Restored 1922 carousel inside a stunning glass pavilion." }, { name: "Washington Street Photo Spot", type: "📸 Landmark", cost: "Free", desc: "The iconic framed Manhattan Bridge view." }] },
      { name: "Coney Island", description: "Classic boardwalk, historic amusement rides, beaches, and Nathan's Famous", image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop", spots: [{ name: "Coney Island Beach", type: "🏖️ Beach", cost: "Free", desc: "3.5 miles of public beach — iconic in summer." }, { name: "Luna Park", type: "🎡 Amusement", cost: "Pay per ride", desc: "Historic amusement park — ride the Cyclone roller coaster." }, { name: "Nathan's Famous", type: "🌭 Food", cost: "$5–12", desc: "The original Nathan's hot dog stand since 1916." }] },
    ],
  },
  {
    id: "queens", name: "Queens", tagline: "The world's most diverse borough",
    description: "Over 160 languages spoken, incredible international food, and Rockaway Beach",
    image: "https://images.unsplash.com/photo-1569154941061-e231b4aa8ebb?w=600&h=400&fit=crop", emoji: "🌏",
    neighborhoods: [
      { name: "Flushing", description: "Authentic Asian cuisine, bustling markets, and one of the largest Chinatowns outside Asia", image: "https://images.unsplash.com/photo-1555529771-835f59fc5ef7?w=400&h=300&fit=crop", spots: [{ name: "New World Mall Food Court", type: "🍜 Dining", cost: "$5–15", desc: "Incredible, cheap Asian food from dozens of stalls." }, { name: "Flushing Meadows Corona Park", type: "🌿 Park", cost: "Free", desc: "Massive park with a lake and Unisphere sculpture." }, { name: "Queens Museum", type: "🎨 Museum", cost: "Pay-what-you-wish", desc: "Home to the 1964 World's Fair Panorama of NYC." }] },
      { name: "Astoria", description: "Greek and Mediterranean food, live music venues, and a tight-knit arts community", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop", spots: [{ name: "Socrates Sculpture Park", type: "🎨 Park", cost: "Free", desc: "Outdoor sculpture park on the waterfront." }, { name: "Museum of the Moving Image", type: "🎬 Museum", cost: "$20 (free Fri evenings)", desc: "Fascinating look at film, TV, and digital media." }, { name: "Astoria Park Pool", type: "🏊 Activity", cost: "Free (summer)", desc: "NYC Parks' largest outdoor pool, free to NYC residents." }] },
    ],
  },
  {
    id: "bronx", name: "The Bronx", tagline: "Birthplace of hip-hop and so much more",
    description: "The New York Botanical Garden, amazing Bronx Zoo, Arthur Avenue Italian market, and hip-hop history",
    image: "https://images.unsplash.com/photo-1546268060-2592ff93ee24?w=600&h=400&fit=crop", emoji: "🎵",
    neighborhoods: [
      { name: "Fordham & Arthur Avenue", description: "The 'Real Little Italy' — old-school Italian bakeries, delis, and family restaurants", image: "https://images.unsplash.com/photo-1534080564842-39a9e635b032?w=400&h=300&fit=crop", spots: [{ name: "Arthur Avenue Retail Market", type: "🧀 Market", cost: "Free entry", desc: "Indoor market with fresh pasta, cheese, meats." }, { name: "Bronx Zoo", type: "🦁 Zoo", cost: "From $25 (free Wednesdays)", desc: "One of the largest urban zoos in the world." }, { name: "New York Botanical Garden", type: "🌸 Garden", cost: "$35 (free Wednesdays)", desc: "250 stunning acres with world-class garden collections." }] },
      { name: "South Bronx & Hip-Hop Heritage", description: "The birthplace of hip-hop culture, street art, and community murals", image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop", spots: [{ name: "Universal Hip Hop Museum", type: "🎵 Museum", cost: "Check for current pricing", desc: "Celebrating the birth and global impact of hip-hop culture." }, { name: "1520 Sedgwick Avenue", type: "🏛️ Landmark", cost: "Free to view", desc: "Where DJ Kool Herc threw the first hip-hop party in 1973." }, { name: "Crotona Park", type: "🌿 Park", cost: "Free", desc: "Large South Bronx park with a lake and ball fields." }] },
    ],
  },
  {
    id: "staten-island", name: "Staten Island", tagline: "NYC's hidden gem borough",
    description: "Free ferry views of the Statue of Liberty, Snug Harbor, and beautiful waterfront parks",
    image: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&h=400&fit=crop", emoji: "⛴️",
    neighborhoods: [
      { name: "St. George & Ferry Terminal", description: "Free ferry views, waterfront arts, and Snug Harbor", image: "https://images.unsplash.com/photo-1516557595335-b1b49fcb5b3d?w=400&h=300&fit=crop", spots: [{ name: "Staten Island Ferry", type: "⛴️ Ferry", cost: "FREE", desc: "Best free attraction in NYC — stunning Statue of Liberty and Manhattan skyline views." }, { name: "Snug Harbor Cultural Center", type: "🎨 Park & Museum", cost: "Free grounds, $8 museum", desc: "83-acre park with Greek Revival buildings and free community events." }, { name: "Staten Island Museum", type: "🏛️ Museum", cost: "$10 (free Sundays)", desc: "Natural history, art, and culture of Staten Island." }] },
    ],
  },
];

// ─── Quick suggestion chips ────────────────────────────────────────────────────
const QUICK_CHIPS = [
  { label: "Chill spots", emoji: "😌", query: "Best places to chill and relax in NYC" },
  { label: "Date ideas", emoji: "💕", query: "Romantic and affordable date ideas in NYC" },
  { label: "Free activities", emoji: "🆓", query: "Free things to do in NYC this week" },
  { label: "Best food", emoji: "🍕", query: "Best and most unique food spots in NYC" },
  { label: "Sports & outdoors", emoji: "⚽", query: "Sports fields, courts, and outdoor activities in NYC" },
  { label: "Hidden gems", emoji: "💎", query: "Hidden gem spots most tourists don't know about in NYC" },
  { label: "Nightlife", emoji: "🌙", query: "Best bars, clubs, and nightlife in NYC" },
  { label: "Plan my day", emoji: "📅", query: "Plan a full day itinerary in NYC on a budget" },
];

// ─── Price helpers ─────────────────────────────────────────────────────────────
function PriceBadge({ price }) {
  const colors = { "Free": "#16A34A", "$": "#0284C7", "$$": "#D97706", "$$$": "#EA580C", "$$$$": "#DC2626" };
  const color = colors[price] || "#64748B";
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: color + "18", color, border: `1px solid ${color}40` }}>
      {price || "Varies"}
    </span>
  );
}

// ─── Result place card ─────────────────────────────────────────────────────────
function PlaceCard({ place, index }) {
  const categoryColors = {
    "Park": "#16A34A", "Cafe": "#D97706", "Restaurant": "#EA580C",
    "Bar": "#7C3AED", "Museum": "#0284C7", "Beach": "#0891B2",
    "Market": "#D97706", "Activity": "#4F46E5", "Landmark": "#64748B",
  };
  const color = categoryColors[place.category] || "#4F46E5";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
            style={{ backgroundColor: color + "15" }}>
            {place.emoji || "📍"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-bold text-sm leading-tight" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                {place.name}
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: color + "15", color }}>
                {place.category}
              </span>
            </div>
            <p className="text-xs leading-relaxed mb-2" style={{ color: "var(--text-secondary)" }}>
              {place.description}
            </p>
            {place.why && (
              <p className="text-xs italic mb-2" style={{ color: "var(--accent-primary)" }}>
                ✨ {place.why}
              </p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <PriceBadge price={place.price} />
              {place.neighborhood && (
                <span className="text-xs flex items-center gap-0.5" style={{ color: "var(--text-hint)" }}>
                  <MapPin className="w-3 h-3" />{place.neighborhood}
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(place.name + " New York City")}`, "_blank")}
          className="w-full mt-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
          style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", color: "#fff" }}>
          <Navigation className="w-3.5 h-3.5" /> View on Map
        </button>
      </div>
    </motion.div>
  );
}

// ─── Result category group ─────────────────────────────────────────────────────
function ResultGroup({ group, startIndex }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-black mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
        <span className="text-lg">{group.emoji}</span> {group.category}
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full ml-auto"
          style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>
          {group.places?.length} spots
        </span>
      </h3>
      <div className="space-y-3">
        {(group.places || []).map((place, i) => (
          <PlaceCard key={i} place={place} index={startIndex + i} />
        ))}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function TripPlanner() {
  const [tab, setTab] = useState("ai"); // "ai" | "browse"
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [selectedBorough, setSelectedBorough] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const inputRef = useRef(null);

  // Get user location once
  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation({ lat: 40.7128, lng: -74.006 }),
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  }, []);

  const handleSearch = async (q) => {
    const searchQuery = q || query;
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);
    setResults(null);
    setQuery(searchQuery);

    const locationCtx = userLocation
      ? `User is currently near NYC coordinates (${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}).`
      : "User is in New York City.";

    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a smart NYC city guide assistant. ${locationCtx}

User's request: "${searchQuery}"

Return a JSON response with relevant NYC recommendations. Focus on being helpful, specific, and honest.

Response JSON schema:
{
  "summary": "1-2 sentence overview of recommendations",
  "groups": [
    {
      "category": "Category name (e.g. Cafes, Parks, Restaurants)",
      "emoji": "single emoji representing category",
      "places": [
        {
          "name": "Specific place name",
          "emoji": "place emoji",
          "category": "place type",
          "neighborhood": "neighborhood and borough",
          "description": "2-3 sentence description including what makes it special",
          "why": "why this matches the user's request",
          "price": "Free | $ | $$ | $$$ | $$$$",
          "best_time": "when to visit"
        }
      ]
    }
  ],
  "tip": "One pro tip for this type of activity in NYC"
}

Include 2-4 groups with 2-4 places each. Only include real, existing NYC places. Be specific with neighborhood names. Focus on value and authenticity.`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            tip: { type: "string" },
            groups: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  emoji: { type: "string" },
                  places: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" }, emoji: { type: "string" },
                        category: { type: "string" }, neighborhood: { type: "string" },
                        description: { type: "string" }, why: { type: "string" },
                        price: { type: "string" }, best_time: { type: "string" },
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });
      setResults(res);
    } catch (e) {
      setError("Could not get recommendations. Please try again.");
    }
    setLoading(false);
  };

  if (selectedBorough) {
    return <BoroughDetail borough={selectedBorough} onBack={() => setSelectedBorough(null)} />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-app)", paddingBottom: 88 }}>
      {/* ── Header ── */}
      <div className="relative overflow-hidden px-5 pt-6 pb-5"
        style={{ paddingTop: "max(env(safe-area-inset-top, 24px), 24px)", background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #0891B2 100%)" }}>
        {/* decorative blobs */}
        <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(circle at 20% 50%, #fff 0%, transparent 50%), radial-gradient(circle at 80% 20%, #fff 0%, transparent 40%)" }} />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.65)" }}>NYC Discovery</p>
          <h1 className="text-3xl font-black text-white mb-1 leading-tight" style={{ fontFamily: "var(--font-serif)" }}>
            Trip Planner 🗽
          </h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
            AI-powered local guide for all five boroughs
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-4">
          {[{ key: "ai", label: "AI Assistant", icon: "🤖" }, { key: "browse", label: "Browse NYC", icon: "🗺️" }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex-1 py-2.5 rounded-2xl text-xs font-bold"
              style={{
                backgroundColor: tab === t.key ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.08)",
                color: "#fff",
                border: tab === t.key ? "1.5px solid rgba(255,255,255,0.4)" : "1.5px solid transparent",
              }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── AI Tab ── */}
      <AnimatePresence mode="wait">
        {tab === "ai" && (
          <motion.div key="ai" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Search bar */}
            <div className="px-4 pt-4 pb-2">
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-2xl"
                  style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
                  <Search className="w-4 h-4 shrink-0" style={{ color: "var(--text-hint)" }} />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSearch()}
                    placeholder="Ask anything… chill spots, food, date ideas…"
                    className="flex-1 bg-transparent text-sm outline-none"
                    style={{ color: "var(--text-primary)", border: "none", minHeight: "unset", boxShadow: "none", padding: 0, fontSize: 14 }}
                  />
                </div>
                <button
                  onClick={() => handleSearch()}
                  disabled={loading || !query.trim()}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", opacity: (!query.trim() || loading) ? 0.5 : 1 }}>
                  {loading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Sparkles className="w-5 h-5 text-white" />}
                </button>
              </div>
            </div>

            {/* Quick chips */}
            {!results && !loading && (
              <div className="px-4 mb-4">
                <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "var(--text-hint)" }}>Quick Ideas</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_CHIPS.map(chip => (
                    <button key={chip.label}
                      onClick={() => handleSearch(chip.query)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold"
                      style={{ backgroundColor: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}>
                      <span>{chip.emoji}</span> {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-3xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
                    <span className="text-3xl">🗽</span>
                  </div>
                  <div className="absolute -inset-1 rounded-3xl border-2 border-transparent"
                    style={{ borderTopColor: "#4F46E5", animation: "spin 1s linear infinite" }} />
                </div>
                <div className="text-center">
                  <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Finding the best spots…</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>AI is searching NYC for you</p>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mx-4 p-4 rounded-2xl" style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA" }}>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Results */}
            {results && !loading && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-4 pt-2">
                {/* Summary */}
                <div className="p-4 rounded-2xl mb-4"
                  style={{ background: "linear-gradient(135deg, #EEF2FF, #F0FDFA)", border: "1px solid #C7D2FE" }}>
                  <div className="flex items-start gap-2">
                    <span className="text-xl mt-0.5">🤖</span>
                    <div>
                      <p className="text-sm font-semibold leading-relaxed" style={{ color: "#1E1B4B" }}>{results.summary}</p>
                      {results.tip && (
                        <p className="text-xs mt-2 leading-relaxed" style={{ color: "#4338CA" }}>
                          💡 <span className="font-semibold">Pro tip:</span> {results.tip}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Groups */}
                {(results.groups || []).map((group, i) => {
                  const startIndex = results.groups.slice(0, i).reduce((s, g) => s + (g.places?.length || 0), 0);
                  return <ResultGroup key={i} group={group} startIndex={startIndex} />;
                })}

                {/* New search */}
                <button onClick={() => { setResults(null); setQuery(""); setTimeout(() => inputRef.current?.focus(), 100); }}
                  className="w-full py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 mb-6"
                  style={{ backgroundColor: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}>
                  <RefreshCw className="w-4 h-4" /> New Search
                </button>
              </motion.div>
            )}

            {/* Empty state */}
            {!results && !loading && !error && (
              <div className="px-4 py-6 text-center">
                <div className="text-5xl mb-4">🗽</div>
                <h2 className="text-lg font-black mb-2" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                  Explore New York City
                </h2>
                <p className="text-sm leading-relaxed max-w-xs mx-auto" style={{ color: "var(--text-secondary)" }}>
                  Ask anything — cheap eats, date spots, hidden parks, things to do tonight, sports fields — and get real NYC recommendations.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Browse Tab ── */}
        {tab === "browse" && (
          <motion.div key="browse" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 pt-5">
            <p className="text-sm mb-5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Discover hidden spots, free activities, local dining, markets, and community events — across all five boroughs.
            </p>
            <div className="space-y-4">
              {BOROUGHS.map((borough, idx) => (
                <motion.button
                  key={borough.id}
                  onClick={() => setSelectedBorough(borough)}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full rounded-3xl overflow-hidden text-left relative"
                  style={{ height: 200, display: "block" }}>
                  <img src={borough.image} alt={borough.name} className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.72) 100%)" }} />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">{borough.emoji}</span>
                          <h2 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-serif)" }}>{borough.name}</h2>
                        </div>
                        <p className="text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>{borough.tagline}</p>
                      </div>
                      <div className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold"
                        style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "#fff", backdropFilter: "blur(8px)" }}>
                        {borough.neighborhoods.length} areas →
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}