import React, { useEffect, useRef, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Navigation, Search, MapPin, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PlaceSocialSheet from "./PlaceSocialSheet";

// ── Category config ──────────────────────────────────────
const CATEGORIES = [
  { id: "trending",    label: "Trending",    emoji: "🔥", query: "popular place",        color: "#E05C7A" },
  { id: "parks",       label: "Parks",        emoji: "🌳", query: "park",                 color: "#2E6B4F" },
  { id: "restaurants", label: "Eats",         emoji: "🍽️", query: "restaurant",           color: "#D98B62" },
  { id: "coffee",      label: "Coffee",       emoji: "☕", query: "cafe coffee shop",      color: "#BF9E79" },
  { id: "art",         label: "Art",          emoji: "🎨", query: "art gallery event",    color: "#7C69C4" },
  { id: "gaming",      label: "Gaming",       emoji: "🎮", query: "gaming entertainment", color: "#3B82F6" },
  { id: "shopping",    label: "Shopping",     emoji: "🛍️", query: "shopping mall store", color: "#EC4899" },
  { id: "gyms",        label: "Fitness",      emoji: "💪", query: "gym fitness",          color: "#10B981" },
];

function trendCount(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h) + str.charCodeAt(i);
  return (Math.abs(h) % 350) + 50;
}

// ── Permission Screen ────────────────────────────────────
function LocationPermissionScreen({ onAllow, onSkip }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center" style={{ minHeight: 480 }}>
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200 }}>
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 text-4xl"
          style={{ background: "linear-gradient(135deg, #243D33, #2E6B4F)" }}>🗺️</div>
      </motion.div>
      <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
        Discover What's Around You
      </h2>
      <p className="text-sm mb-6 max-w-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        See trending parks, top-rated restaurants, and hidden gems — curated with community insights.
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
      <button onClick={onAllow} className="w-full max-w-xs py-3.5 rounded-2xl font-bold text-white text-sm mb-3"
        style={{ background: "linear-gradient(135deg, #243D33, #2E6B4F)" }}>
        Allow Location Access
      </button>
      <button onClick={onSkip} className="text-xs font-medium" style={{ color: "var(--text-hint)" }}>
        Browse without location
      </button>
    </div>
  );
}

// ── Search Suggestions Dropdown ──────────────────────────
function SearchSuggestions({ suggestions, onSelect, onClose }) {
  if (!suggestions.length) return null;
  return (
    <div className="absolute top-full left-0 right-0 mt-1 rounded-2xl overflow-hidden z-50"
      style={{ backgroundColor: "#FAFAF8", boxShadow: "0 8px 32px rgba(0,0,0,0.16)", border: "1px solid var(--border-light)" }}>
      {suggestions.map((s, i) => (
        <button key={i} onClick={() => onSelect(s)}
          className="w-full flex items-center gap-3 px-4 py-3 text-left border-b last:border-b-0 transition-colors"
          style={{ borderColor: "var(--border-light)" }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-subtle)"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
          <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: "var(--accent-primary)" }} />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{s.text}</p>
            <p className="text-xs truncate" style={{ color: "var(--text-hint)" }}>{s.place_name?.split(",").slice(1, 3).join(",")}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────
export default function MapboxLocal() {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const searchDebounceRef = useRef(null);

  const [token, setToken] = useState(null);
  const [tokenLoading, setTokenLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [permissionState, setPermissionState] = useState("ask");
  const [userLocation, setUserLocation] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [selectedPlaceCat, setSelectedPlaceCat] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [resultCount, setResultCount] = useState(0);

  // Fetch token securely
  useEffect(() => {
    base44.functions.invoke("mapboxToken", {}).then(res => {
      if (res.data?.token) setToken(res.data.token);
      setTokenLoading(false);
    }).catch(() => setTokenLoading(false));
  }, []);

  const initMap = useCallback((accessToken, center = [-74.006, 40.7128]) => {
    if (!mapContainer.current || mapRef.current) return;
    window.mapboxgl.accessToken = accessToken;
    const m = new window.mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center,
      zoom: 13,
      attributionControl: false,
      pitchWithRotate: false,
    });
    m.addControl(new window.mapboxgl.AttributionControl({ compact: true }), "bottom-left");
    m.addControl(new window.mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");
    m.on("load", () => setMapLoaded(true));
    // Close suggestions when map is clicked
    m.on("click", () => { setShowSuggestions(false); setSelectedPlace(null); });
    mapRef.current = m;
  }, []);

  const loadMapbox = useCallback((accessToken, center) => {
    if (window.mapboxgl) { initMap(accessToken, center); return; }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://api.mapbox.com/mapbox-gl-js/v3.2.0/mapbox-gl.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://api.mapbox.com/mapbox-gl-js/v3.2.0/mapbox-gl.js";
    script.onload = () => initMap(accessToken, center);
    document.head.appendChild(script);
  }, [initMap]);

  const placeUserMarker = (lng, lat) => {
    if (!mapRef.current) return;
    if (userMarkerRef.current) userMarkerRef.current.remove();
    const el = document.createElement("div");
    el.style.cssText = `width:16px;height:16px;border-radius:50%;background:#2E6B4F;border:3px solid white;box-shadow:0 0 0 5px rgba(46,107,79,0.22),0 2px 8px rgba(0,0,0,0.3);`;
    userMarkerRef.current = new window.mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(mapRef.current);
  };

  const flyToUser = (lng, lat) => {
    mapRef.current?.flyTo({ center: [lng, lat], zoom: 14.5, duration: 1600, essential: true });
    placeUserMarker(lng, lat);
  };

  const handleAllow = () => {
    if (!navigator.geolocation) { handleSkip(); return; }
    navigator.geolocation.getCurrentPosition(pos => {
      const { longitude, latitude } = pos.coords;
      setUserLocation([longitude, latitude]);
      setPermissionState("granted");
    }, () => setPermissionState("denied"));
  };

  const handleSkip = () => setPermissionState("skipped");

  const goToMyLocation = () => {
    if (!navigator.geolocation || !mapRef.current) return;
    navigator.geolocation.getCurrentPosition(pos => {
      const { longitude, latitude } = pos.coords;
      setUserLocation([longitude, latitude]);
      flyToUser(longitude, latitude);
    });
  };

  // Init map after permission
  useEffect(() => {
    if (!token || !mapContainer.current) return;
    if (permissionState === "granted" && userLocation) {
      loadMapbox(token, userLocation);
    } else if (permissionState === "skipped" || permissionState === "denied") {
      loadMapbox(token);
    }
  }, [token, permissionState, userLocation]);

  useEffect(() => {
    if (mapLoaded && userLocation) flyToUser(userLocation[0], userLocation[1]);
  }, [mapLoaded]);

  // Autocomplete suggestions
  const fetchSuggestions = async (q) => {
    if (!token || q.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    const prox = userLocation ? `${userLocation[0]},${userLocation[1]}` : "-74.006,40.7128";
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?proximity=${prox}&types=poi,address,place&limit=5&access_token=${token}`;
    const res = await fetch(url);
    const data = await res.json();
    setSuggestions(data.features || []);
    setShowSuggestions(true);
  };

  const handleSearchInput = (val) => {
    setSearchQuery(val);
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => fetchSuggestions(val), 280);
  };

  const handleSuggestionSelect = (feature) => {
    setShowSuggestions(false);
    setSearchQuery(feature.text);
    setSuggestions([]);
    if (mapRef.current && feature.center) {
      mapRef.current.flyTo({ center: feature.center, zoom: 15, duration: 1000 });
      // Drop a single highlighted marker
      clearMarkers();
      const el = createMarkerEl(CATEGORIES[2], trendCount(feature.id || feature.place_name));
      const marker = new window.mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat(feature.center).addTo(mapRef.current);
      el.addEventListener("click", () => { setSelectedPlace(feature); setSelectedPlaceCat(CATEGORIES[2]); });
      markersRef.current.push(marker);
    }
  };

  const clearMarkers = () => { markersRef.current.forEach(m => m.remove()); markersRef.current = []; };

  const createMarkerEl = (catConfig, trend) => {
    const el = document.createElement("div");
    el.style.cssText = "display:flex;flex-direction:column;align-items:center;cursor:pointer;";
    el.innerHTML = `
      <div style="background:linear-gradient(135deg,#243D33,#2E6B4F);border:2.5px solid #DCCBB8;border-radius:50%;width:38px;height:38px;display:flex;align-items:center;justify-content:center;font-size:17px;box-shadow:0 4px 14px rgba(36,61,51,0.4);">${catConfig.emoji}</div>
      <div style="background:#BF9E79;color:#1A2E24;border-radius:20px;padding:1px 7px;font-size:9px;font-weight:800;margin-top:3px;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.18);">🔥 ${trend}</div>
    `;
    return el;
  };

  const searchNearby = async (cat) => {
    if (!mapRef.current || !token) return;
    const query = cat ? cat.query : searchQuery;
    if (!query) return;
    setIsSearching(true);
    setSelectedCategory(cat?.id || null);
    setSelectedPlace(null);
    setShowSuggestions(false);

    const c = mapRef.current.getCenter();
    const center = userLocation || [c.lng, c.lat];
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?proximity=${center[0]},${center[1]}&types=poi&limit=15&access_token=${token}`;
    const res = await fetch(url);
    const data = await res.json();
    setIsSearching(false);

    clearMarkers();
    const features = data.features || [];
    setResultCount(features.length);

    features.forEach(feature => {
      const [lng, lat] = feature.center;
      const catConfig = cat || CATEGORIES[2];
      const trend = trendCount(feature.id || feature.place_name);
      const el = createMarkerEl(catConfig, trend);

      const marker = new window.mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([lng, lat]).addTo(mapRef.current);
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        setSelectedPlace(feature);
        setSelectedPlaceCat(catConfig);
      });
      markersRef.current.push(marker);
    });

    if (features.length > 0) mapRef.current.flyTo({ center: features[0].center, zoom: 14, duration: 1200 });
  };

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
    </div>
  );

  if (permissionState === "ask") return <LocationPermissionScreen onAllow={handleAllow} onSkip={handleSkip} />;

  return (
    <div className="pb-24">
      {/* Search */}
      <div className="px-4 pt-3 pb-2">
        <div className="relative">
          <form onSubmit={e => { e.preventDefault(); searchNearby(null); }} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-hint)" }} />
              <input
                value={searchQuery}
                onChange={e => handleSearchInput(e.target.value)}
                onFocus={() => searchQuery.length > 1 && setShowSuggestions(true)}
                placeholder="Search any place, vibe, or spot..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-sm outline-none"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
              />
              {searchQuery && (
                <button type="button" onClick={() => { setSearchQuery(""); setSuggestions([]); setShowSuggestions(false); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-3.5 h-3.5" style={{ color: "var(--text-hint)" }} />
                </button>
              )}
            </div>
            <button type="submit" className="px-4 py-2.5 rounded-2xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #243D33, #2E6B4F)" }}>Go</button>
          </form>

          {/* Suggestions dropdown */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <SearchSuggestions
                  suggestions={suggestions}
                  onSelect={handleSuggestionSelect}
                  onClose={() => setShowSuggestions(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Category pills */}
      <div className="px-4 mb-2 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 pb-1">
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => searchNearby(cat)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border"
              style={{
                backgroundColor: selectedCategory === cat.id ? cat.color : "var(--bg-card)",
                color: selectedCategory === cat.id ? "#fff" : "var(--text-secondary)",
                borderColor: selectedCategory === cat.id ? cat.color : "var(--border-light)",
              }}>
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="px-4 mb-2 h-5">
        {isSearching && (
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 border-2 rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
            <span className="text-xs" style={{ color: "var(--text-hint)" }}>Finding nearby spots...</span>
          </div>
        )}
        {!isSearching && resultCount > 0 && (
          <p className="text-xs font-semibold" style={{ color: "var(--accent-primary)" }}>✦ {resultCount} trending spots found</p>
        )}
      </div>

      {/* Map */}
      <div className="px-4 relative">
        <div ref={mapContainer} className="w-full rounded-3xl overflow-hidden"
          style={{ height: 440, border: "2px solid var(--border-medium)", boxShadow: "0 6px 24px rgba(0,0,0,0.14)" }} />

        {!mapLoaded && (
          <div className="absolute inset-4 flex items-center justify-center rounded-3xl"
            style={{ backgroundColor: "#E8E3D9" }}>
            <div className="text-center">
              <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-2" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>Loading map...</p>
            </div>
          </div>
        )}

        {mapLoaded && (
          <button onClick={goToMyLocation}
            className="absolute top-3 left-7 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold z-10"
            style={{ backgroundColor: "white", color: "#243D33", boxShadow: "0 2px 10px rgba(0,0,0,0.2)" }}>
            <Navigation className="w-3.5 h-3.5" />
            {userLocation ? "Re-center" : "My Location"}
          </button>
        )}
      </div>

      {mapLoaded && !selectedPlace && (
        <div className="px-4 mt-3">
          <p className="text-[11px] text-center" style={{ color: "var(--text-hint)" }}>
            Tap a category → pins appear → tap any pin for photos, reviews, directions & community posts
          </p>
        </div>
      )}

      {/* Place social sheet */}
      <AnimatePresence>
        {selectedPlace && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-20"
              style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
              onClick={() => setSelectedPlace(null)} />
            <PlaceSocialSheet
              place={selectedPlace}
              category={selectedPlaceCat}
              onClose={() => setSelectedPlace(null)}
              mapToken={token}
              userLocation={userLocation}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}