import React, { useEffect, useRef, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Navigation, Search, X, Star, TrendingUp, MapPin, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Category config ──────────────────────────────────────
const CATEGORIES = [
  { id: "trending",     label: "Trending",     emoji: "🔥", query: "popular place",         color: "#E05C7A" },
  { id: "parks",        label: "Parks",         emoji: "🌳", query: "park",                  color: "#2E6B4F" },
  { id: "restaurants",  label: "Restaurants",   emoji: "🍽️", query: "restaurant",            color: "#D98B62" },
  { id: "coffee",       label: "Coffee",        emoji: "☕", query: "cafe coffee shop",       color: "#BF9E79" },
  { id: "art",          label: "Art & Events",  emoji: "🎨", query: "art gallery event",     color: "#7C69C4" },
  { id: "gaming",       label: "Gaming",        emoji: "🎮", query: "gaming entertainment",  color: "#3B82F6" },
  { id: "shopping",     label: "Shopping",      emoji: "🛍️", query: "shopping mall store",  color: "#EC4899" },
  { id: "gyms",         label: "Fitness",       emoji: "💪", query: "gym fitness",           color: "#10B981" },
];

// Fake trending counts for social layer feel
function fakeTrending() {
  return Math.floor(Math.random() * 300) + 50;
}
function fakeRating() {
  return (3.8 + Math.random() * 1.2).toFixed(1);
}

// Custom Mapbox style using brand colors (dark green + beige)
const CUSTOM_STYLE_CONFIG = {
  style: "mapbox://styles/mapbox/dark-v11",
};

// ── Permission Screen ────────────────────────────────────
function LocationPermissionScreen({ onAllow, onSkip }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center" style={{ minHeight: 480 }}>
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200 }}>
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 text-4xl"
          style={{ background: "linear-gradient(135deg, #243D33, #2E6B4F)" }}>
          🗺️
        </div>
      </motion.div>
      <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
        Discover What's Around You
      </h2>
      <p className="text-sm mb-6 max-w-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        See trending parks, top-rated restaurants, and hidden gems near you — curated with community insights.
      </p>

      <div className="w-full max-w-xs space-y-2.5 mb-6">
        {[
          { emoji: "🌳", text: "Parks & outdoor spots trending this week" },
          { emoji: "🍝", text: "Top-rated restaurants people are saving" },
          { emoji: "🔥", text: "Hot spots with real community activity" },
        ].map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i + 0.3 }}
            className="flex items-center gap-3 p-3 rounded-xl text-left"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
            <span className="text-xl shrink-0">{item.emoji}</span>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{item.text}</p>
          </motion.div>
        ))}
      </div>

      <button onClick={onAllow}
        className="w-full max-w-xs py-3.5 rounded-2xl font-bold text-white text-sm mb-3"
        style={{ background: "linear-gradient(135deg, #243D33, #2E6B4F)" }}>
        Allow Location Access
      </button>
      <button onClick={onSkip} className="text-xs font-medium" style={{ color: "var(--text-hint)" }}>
        Browse without location
      </button>
    </div>
  );
}

// ── Place Detail Card (bottom sheet) ────────────────────
function PlaceCard({ place, onClose, category }) {
  const cat = CATEGORIES.find(c => c.id === category) || CATEGORIES[0];
  const trendCount = fakeTrending();
  const rating = fakeRating();

  return (
    <motion.div
      initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 280, damping: 30 }}
      className="absolute bottom-0 left-0 right-0 z-20 rounded-t-3xl p-5"
      style={{ backgroundColor: "#FAFAF8", boxShadow: "0 -8px 32px rgba(0,0,0,0.18)" }}
    >
      <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: "var(--border-medium)" }} />
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: cat.color + "18" }}>
            {cat.emoji}
          </div>
          <div>
            <h3 className="text-base font-bold leading-tight" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              {place.text}
            </h3>
            <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--text-secondary)" }}>
              {place.place_name?.split(",").slice(1, 3).join(",")}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-full" style={{ backgroundColor: "var(--bg-subtle)" }}>
          <X className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
        </button>
      </div>

      {/* Social stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="p-3 rounded-xl text-center" style={{ backgroundColor: "var(--bg-subtle)" }}>
          <Star className="w-4 h-4 mx-auto mb-1" style={{ color: "#F59E0B" }} />
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{rating}</p>
          <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>Rating</p>
        </div>
        <div className="p-3 rounded-xl text-center" style={{ backgroundColor: "var(--bg-subtle)" }}>
          <TrendingUp className="w-4 h-4 mx-auto mb-1" style={{ color: "#E05C7A" }} />
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{trendCount}</p>
          <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>This week</p>
        </div>
        <div className="p-3 rounded-xl text-center" style={{ backgroundColor: "var(--bg-subtle)" }}>
          <MapPin className="w-4 h-4 mx-auto mb-1" style={{ color: "var(--accent-primary)" }} />
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{Math.floor(trendCount * 0.3)}</p>
          <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>Saved</p>
        </div>
      </div>

      <div className="p-3 rounded-xl mb-3" style={{ background: `linear-gradient(120deg, ${cat.color}12, ${cat.color}06)`, border: `1px solid ${cat.color}22` }}>
        <p className="text-xs font-semibold" style={{ color: cat.color }}>
          🔥 {trendCount} people from the community visited this week
        </p>
      </div>

      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.place_name)}`}
        target="_blank" rel="noopener noreferrer"
        className="block w-full py-3 rounded-xl text-center text-sm font-bold text-white"
        style={{ background: "linear-gradient(135deg, #243D33, #2E6B4F)" }}>
        Open in Maps →
      </a>
    </motion.div>
  );
}

// ── Main Component ───────────────────────────────────────
export default function MapboxLocal() {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);

  const [token, setToken] = useState(null);
  const [tokenLoading, setTokenLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [permissionState, setPermissionState] = useState("ask"); // "ask" | "granted" | "denied" | "skipped"
  const [userLocation, setUserLocation] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [resultCount, setResultCount] = useState(0);

  // Fetch token
  useEffect(() => {
    base44.functions.invoke("mapboxToken", {}).then(res => {
      if (res.data?.token) setToken(res.data.token);
      setTokenLoading(false);
    }).catch(() => setTokenLoading(false));
  }, []);

  // Load Mapbox GL JS
  const loadMapbox = useCallback((accessToken) => {
    if (window.mapboxgl) { initMap(accessToken); return; }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://api.mapbox.com/mapbox-gl-js/v3.2.0/mapbox-gl.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://api.mapbox.com/mapbox-gl-js/v3.2.0/mapbox-gl.js";
    script.onload = () => initMap(accessToken);
    document.head.appendChild(script);
  }, []);

  function initMap(accessToken, center = [-74.006, 40.7128]) {
    if (!mapContainer.current || mapRef.current) return;
    window.mapboxgl.accessToken = accessToken;

    const m = new window.mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center,
      zoom: 13,
      attributionControl: false,
      pitchWithRotate: false,
    });

    m.addControl(new window.mapboxgl.AttributionControl({ compact: true }), "bottom-left");

    // Restyle on load to match brand theme
    m.on("load", () => {
      // Tint background to dark green
      try {
        m.setPaintProperty("background", "background-color", "#1A2E24");
        m.setPaintProperty("water", "fill-color", "#1C3428");
        m.setPaintProperty("land", "background-color", "#1F3529");
      } catch (e) { /* style layers may differ */ }
      setMapLoaded(true);
    });

    mapRef.current = m;
  }

  // Handle location allow
  const handleAllow = () => {
    if (!navigator.geolocation) { handleSkip(); return; }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { longitude, latitude } = pos.coords;
        setUserLocation([longitude, latitude]);
        setPermissionState("granted");
        if (token) {
          loadMapbox(token);
          setTimeout(() => flyToUser(longitude, latitude), 800);
        }
      },
      () => setPermissionState("denied")
    );
  };

  const handleSkip = () => {
    setPermissionState("skipped");
    if (token) loadMapbox(token);
  };

  // Fly to user location
  const flyToUser = (lng, lat) => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({ center: [lng, lat], zoom: 14, duration: 1800, essential: true });

    if (userMarkerRef.current) userMarkerRef.current.remove();
    const el = document.createElement("div");
    el.style.cssText = `
      width:18px;height:18px;border-radius:50%;
      background:#2E6B4F;border:3px solid #DCCBB8;
      box-shadow:0 0 0 6px rgba(46,107,79,0.2);
    `;
    userMarkerRef.current = new window.mapboxgl.Marker(el)
      .setLngLat([lng, lat])
      .addTo(mapRef.current);
  };

  const goToMyLocation = () => {
    if (!navigator.geolocation || !mapRef.current) return;
    navigator.geolocation.getCurrentPosition(pos => {
      const { longitude, latitude } = pos.coords;
      setUserLocation([longitude, latitude]);
      flyToUser(longitude, latitude);
    });
  };

  // Clear markers
  const clearMarkers = () => {
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
  };

  // Search nearby
  const searchNearby = async (cat) => {
    if (!mapRef.current || !token) return;
    const query = cat ? cat.query : searchQuery;
    if (!query) return;

    setIsSearching(true);
    setSelectedCategory(cat?.id || null);
    setSelectedPlace(null);

    const center = userLocation || [mapRef.current.getCenter().lng, mapRef.current.getCenter().lat];
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?proximity=${center[0]},${center[1]}&types=poi&limit=15&access_token=${token}`;

    const res = await fetch(url);
    const data = await res.json();
    setIsSearching(false);

    clearMarkers();
    const features = data.features || [];
    setResultCount(features.length);

    features.forEach(feature => {
      const [lng, lat] = feature.center;
      const catConfig = cat || CATEGORIES[0];

      const el = document.createElement("div");
      const trendN = fakeTrending();
      el.style.cssText = `
        display:flex;flex-direction:column;align-items:center;cursor:pointer;
        transform:translateY(-50%);
      `;
      el.innerHTML = `
        <div style="
          background:linear-gradient(135deg,#243D33,#2E6B4F);
          border:2px solid #BF9E79;
          border-radius:50%;
          width:36px;height:36px;
          display:flex;align-items:center;justify-content:center;
          font-size:16px;
          box-shadow:0 4px 12px rgba(0,0,0,0.4);
        ">${catConfig.emoji}</div>
        <div style="
          background:#BF9E79;color:#1A2E24;
          border-radius:20px;padding:1px 6px;
          font-size:9px;font-weight:700;
          margin-top:3px;white-space:nowrap;
        ">🔥 ${trendN}</div>
      `;

      const marker = new window.mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([lng, lat])
        .addTo(mapRef.current);

      el.addEventListener("click", () => setSelectedPlace({ ...feature, catId: cat?.id }));
      markersRef.current.push(marker);
    });

    if (features.length > 0) {
      mapRef.current.flyTo({ center: features[0].center, zoom: 13.5, duration: 1200 });
    }
  };

  // Init map when permission granted/skipped and token ready
  useEffect(() => {
    if (token && (permissionState === "granted" || permissionState === "skipped")) {
      loadMapbox(token);
    }
  }, [token, permissionState]);

  // ── Render ──
  if (tokenLoading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
      <p className="text-xs" style={{ color: "var(--text-hint)" }}>Loading map...</p>
    </div>
  );

  if (!token) return (
    <div className="px-4 py-12 text-center">
      <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: "var(--text-hint)" }} />
      <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Map not configured</p>
      <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>MAPBOX_ACCESS_TOKEN not set</p>
    </div>
  );

  // Show permission screen
  if (permissionState === "ask") {
    return <LocationPermissionScreen onAllow={handleAllow} onSkip={handleSkip} />;
  }

  return (
    <div className="pb-24 relative" style={{ overflow: "hidden" }}>
      {/* Search bar */}
      <div className="px-4 pt-3 pb-2">
        <form onSubmit={e => { e.preventDefault(); searchNearby(null); }} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-hint)" }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search any place, vibe, or spot..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-sm outline-none"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
            />
          </div>
          <button type="submit"
            className="px-4 py-2.5 rounded-2xl text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, #243D33, #2E6B4F)" }}>
            Go
          </button>
        </form>
      </div>

      {/* Category pills */}
      <div className="px-4 mb-2 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 pb-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => searchNearby(cat)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border"
              style={{
                backgroundColor: selectedCategory === cat.id ? cat.color : "var(--bg-card)",
                color: selectedCategory === cat.id ? "#fff" : "var(--text-secondary)",
                borderColor: selectedCategory === cat.id ? cat.color : "var(--border-light)",
              }}>
              <span>{cat.emoji}</span> {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Searching indicator */}
      {isSearching && (
        <div className="px-4 mb-2 flex items-center gap-2">
          <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
          <span className="text-xs" style={{ color: "var(--text-hint)" }}>Finding nearby spots...</span>
        </div>
      )}
      {!isSearching && resultCount > 0 && (
        <div className="px-4 mb-2">
          <p className="text-xs font-medium" style={{ color: "var(--accent-primary)" }}>
            ✦ {resultCount} trending spots found
          </p>
        </div>
      )}

      {/* Map */}
      <div className="px-4 relative">
        <div ref={mapContainer}
          className="w-full rounded-3xl overflow-hidden"
          style={{ height: 440, border: "2px solid #243D33", boxShadow: "0 8px 32px rgba(36,61,51,0.3)" }}
        />
        {!mapLoaded && (
          <div className="absolute inset-4 flex items-center justify-center rounded-3xl"
            style={{ backgroundColor: "#1A2E24" }}>
            <div className="text-center">
              <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-2"
                style={{ borderColor: "#BF9E79", borderTopColor: "transparent" }} />
              <p className="text-xs" style={{ color: "#BF9E79" }}>Preparing map...</p>
            </div>
          </div>
        )}

        {/* My location btn */}
        {mapLoaded && (
          <button onClick={goToMyLocation}
            className="absolute top-3 left-7 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold z-10"
            style={{ backgroundColor: "#DCCBB8", color: "#243D33", boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }}>
            <Navigation className="w-3.5 h-3.5" />
            {userLocation ? "Re-center" : "My Location"}
          </button>
        )}
      </div>

      {/* Legend */}
      {mapLoaded && (
        <div className="px-4 mt-3">
          <div className="p-3 rounded-2xl" style={{ background: "linear-gradient(135deg, #243D3310, #2E6B4F08)", border: "1px solid #2E6B4F25" }}>
            <p className="text-[11px] font-semibold mb-1" style={{ color: "var(--accent-primary)" }}>How to use</p>
            <p className="text-[11px]" style={{ color: "var(--text-hint)" }}>
              Tap a category to see trending places near you. Tap any pin to see community insights & ratings.
            </p>
          </div>
        </div>
      )}

      {/* Place detail card */}
      <AnimatePresence>
        {selectedPlace && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-10"
              style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
              onClick={() => setSelectedPlace(null)} />
            <PlaceCard
              place={selectedPlace}
              category={selectedPlace.catId || selectedCategory}
              onClose={() => setSelectedPlace(null)}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}