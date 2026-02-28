import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { MapPin, Navigation, Search } from "lucide-react";

const CATEGORY_ICONS = {
  "Restaurants": "🍽️",
  "Coffee Shops": "☕",
  "Gyms": "💪",
  "Salons": "💇",
  "Pharmacies": "💊",
  "Grocery Stores": "🛒",
  "Banks": "🏦",
  "Parks": "🌳",
  "Hospitals": "🏥",
  "Libraries": "📚",
};

const CATEGORIES = Object.keys(CATEGORY_ICONS);

export default function MapboxLocal() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [token, setToken] = useState(null);
  const [tokenLoading, setTokenLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const markers = useRef([]);

  // Fetch token securely
  useEffect(() => {
    base44.functions.invoke("mapboxToken", {}).then(res => {
      if (res.data?.token) setToken(res.data.token);
      setTokenLoading(false);
    }).catch(() => setTokenLoading(false));
  }, []);

  // Load mapbox-gl script
  useEffect(() => {
    if (!token) return;
    if (window.mapboxgl) { initMap(token); return; }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://api.mapbox.com/mapbox-gl-js/v3.2.0/mapbox-gl.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://api.mapbox.com/mapbox-gl-js/v3.2.0/mapbox-gl.js";
    script.onload = () => initMap(token);
    document.head.appendChild(script);
  }, [token]);

  function initMap(accessToken) {
    if (!mapContainer.current || map.current) return;
    window.mapboxgl.accessToken = accessToken;
    map.current = new window.mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [-74.006, 40.7128],
      zoom: 12,
    });
    map.current.addControl(new window.mapboxgl.NavigationControl(), "top-right");
    map.current.on("load", () => setMapLoaded(true));
  }

  // Get user location
  const goToMyLocation = () => {
    if (!navigator.geolocation || !map.current) return;
    navigator.geolocation.getCurrentPosition(pos => {
      const { longitude, latitude } = pos.coords;
      setUserLocation([longitude, latitude]);
      map.current.flyTo({ center: [longitude, latitude], zoom: 14, duration: 1500 });

      // Add user marker
      const el = document.createElement("div");
      el.style.cssText = "width:16px;height:16px;border-radius:50%;background:#2E6B4F;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)";
      new window.mapboxgl.Marker(el).setLngLat([longitude, latitude]).addTo(map.current);
    });
  };

  // Search nearby via Mapbox Geocoding
  const searchNearby = async (category) => {
    if (!map.current || !token) return;
    setSelectedCategory(category);
    const center = map.current.getCenter();
    const q = category || searchQuery;
    if (!q) return;

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?proximity=${center.lng},${center.lat}&types=poi&limit=10&access_token=${token}`;
    const res = await fetch(url);
    const data = await res.json();

    // Clear old markers
    markers.current.forEach(m => m.remove());
    markers.current = [];

    (data.features || []).forEach(feature => {
      const [lng, lat] = feature.center;
      const el = document.createElement("div");
      el.innerHTML = CATEGORY_ICONS[category] || "📍";
      el.style.cssText = "font-size:24px;cursor:pointer;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))";

      const popup = new window.mapboxgl.Popup({ offset: 25, closeButton: false })
        .setHTML(`<div style="font-family:sans-serif;font-size:13px;padding:4px"><strong>${feature.text}</strong><br/><span style="color:#666;font-size:11px">${feature.place_name?.split(",").slice(1, 3).join(",")}</span></div>`);

      const marker = new window.mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map.current);
      markers.current.push(marker);
    });

    if (data.features?.length > 0) {
      const [lng, lat] = data.features[0].center;
      map.current.flyTo({ center: [lng, lat], zoom: 13, duration: 1200 });
    }
  };

  if (tokenLoading) return (
    <div className="flex justify-center py-20">
      <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
    </div>
  );

  if (!token) return (
    <div className="px-4 py-10 text-center">
      <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: "var(--text-hint)" }} />
      <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Map not configured</p>
      <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>MAPBOX_ACCESS_TOKEN not set</p>
    </div>
  );

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🗺️</span>
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Local Map</h2>
          </div>
          <button onClick={goToMyLocation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)", border: "1px solid var(--accent-primary)30" }}>
            <Navigation className="w-3.5 h-3.5" /> My Location
          </button>
        </div>
        <p className="text-xs" style={{ color: "var(--text-hint)" }}>Discover local places near you</p>
      </div>

      {/* Search bar */}
      <div className="px-4 mb-3">
        <form onSubmit={e => { e.preventDefault(); searchNearby(null); }} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-hint)" }} />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search any place..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
          </div>
          <button type="submit" className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: "var(--accent-primary)" }}>Go</button>
        </form>
      </div>

      {/* Category pills */}
      <div className="px-4 mb-3 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => searchNearby(cat)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-all"
              style={{
                backgroundColor: selectedCategory === cat ? "var(--accent-primary)" : "var(--bg-card)",
                color: selectedCategory === cat ? "#fff" : "var(--text-secondary)",
                borderColor: selectedCategory === cat ? "var(--accent-primary)" : "var(--border-light)",
              }}>
              {CATEGORY_ICONS[cat]} {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Map container */}
      <div className="px-4">
        <div ref={mapContainer} className="w-full rounded-2xl overflow-hidden"
          style={{ height: 380, border: "1px solid var(--border-light)" }} />
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl" style={{ backgroundColor: "var(--bg-subtle)" }}>
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
          </div>
        )}
      </div>

      <div className="px-4 mt-3">
        <p className="text-[10px] text-center" style={{ color: "var(--text-hint)" }}>
          Tap a category to see nearby pins. Tap any pin for details.
        </p>
      </div>
    </div>
  );
}