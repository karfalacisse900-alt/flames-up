import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { MapPin, Navigation, Search } from "lucide-react";

const CATEGORIES = [
  { label: "Restaurants", emoji: "🍕", query: "restaurant" },
  { label: "Coffee", emoji: "☕", query: "cafe" },
  { label: "Gyms", emoji: "💪", query: "gym" },
  { label: "Supermarkets", emoji: "🛒", query: "supermarket" },
  { label: "Pharmacy", emoji: "💊", query: "pharmacy" },
  { label: "Hair Salon", emoji: "💇", query: "hair salon" },
  { label: "Banks", emoji: "🏦", query: "bank" },
  { label: "Parks", emoji: "🌳", query: "park" },
];

export default function MapboxLocal() {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLoc, setUserLoc] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [places, setPlaces] = useState([]);
  const [searchVal, setSearchVal] = useState("");
  const markersRef = useRef([]);

  // Fetch token securely
  useEffect(() => {
    base44.functions.invoke("mapboxToken", {})
      .then(r => {
        if (r.data?.token) setToken(r.data.token);
        else setError("Mapbox not configured. Please add your MAPBOX_ACCESS_TOKEN.");
      })
      .catch(() => setError("Failed to load map token."))
      .finally(() => setLoading(false));
  }, []);

  // Load Mapbox GL JS dynamically
  useEffect(() => {
    if (!token) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://api.mapbox.com/mapbox-gl-js/v3.2.0/mapbox-gl.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://api.mapbox.com/mapbox-gl-js/v3.2.0/mapbox-gl.js";
    script.onload = () => initMap();
    document.head.appendChild(script);

    return () => {
      mapRef.current?.remove();
      document.head.removeChild(link);
    };
  }, [token]);

  const initMap = () => {
    if (!mapContainer.current || !window.mapboxgl) return;

    window.mapboxgl.accessToken = token;

    const map = new window.mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [-74.006, 40.7128],
      zoom: 12,
    });

    map.addControl(new window.mapboxgl.NavigationControl(), "top-right");
    mapRef.current = map;

    // Try to get user location
    navigator.geolocation?.getCurrentPosition(
      pos => {
        const { longitude, latitude } = pos.coords;
        setUserLoc({ lng: longitude, lat: latitude });
        map.flyTo({ center: [longitude, latitude], zoom: 14 });

        // User location marker
        new window.mapboxgl.Marker({ color: "#2E6B4F" })
          .setLngLat([longitude, latitude])
          .setPopup(new window.mapboxgl.Popup().setText("You are here"))
          .addTo(map);
      },
      () => {}
    );
  };

  const searchPlaces = async (query) => {
    if (!token || !userLoc) return;
    setActiveCategory(query);
    setPlaces([]);

    const proximity = `${userLoc.lng},${userLoc.lat}`;
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?proximity=${proximity}&types=poi&limit=10&access_token=${token}`;

    const res = await fetch(url);
    const data = await res.json();
    const features = data.features || [];

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const newPlaces = features.map(f => ({
      id: f.id,
      name: f.text,
      address: f.place_name,
      coordinates: f.geometry.coordinates,
    }));

    setPlaces(newPlaces);

    if (mapRef.current) {
      newPlaces.forEach(place => {
        const marker = new window.mapboxgl.Marker({ color: "#D98B62" })
          .setLngLat(place.coordinates)
          .setPopup(new window.mapboxgl.Popup().setHTML(`<strong>${place.name}</strong><br/><small>${place.address}</small>`))
          .addTo(mapRef.current);
        markersRef.current.push(marker);
      });

      if (newPlaces.length > 0) {
        mapRef.current.flyTo({ center: newPlaces[0].coordinates, zoom: 14 });
      }
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
    </div>
  );

  if (error) return (
    <div className="px-4 py-16 text-center">
      <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: "var(--text-hint)" }} />
      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Map Unavailable</p>
      <p className="text-xs mt-1 max-w-xs mx-auto" style={{ color: "var(--text-hint)" }}>{error}</p>
    </div>
  );

  return (
    <div className="pb-24">
      {/* Map */}
      <div ref={mapContainer} style={{ width: "100%", height: 280 }} />

      {/* Category pills */}
      <div className="px-4 pt-4">
        <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
          {userLoc ? "Nearby" : "Enable location to find nearby places"}
        </p>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {CATEGORIES.map(cat => (
            <button key={cat.query}
              onClick={() => userLoc && searchPlaces(cat.query)}
              disabled={!userLoc}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all disabled:opacity-40"
              style={{
                backgroundColor: activeCategory === cat.query ? "var(--accent-primary)" : "var(--bg-card)",
                color: activeCategory === cat.query ? "#fff" : "var(--text-secondary)",
                border: "1px solid var(--border-light)",
              }}>
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* Custom search */}
        <form className="flex gap-2 mt-3" onSubmit={e => { e.preventDefault(); searchPlaces(searchVal); }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-hint)" }} />
            <input value={searchVal} onChange={e => setSearchVal(e.target.value)}
              placeholder="Search nearby..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
          </div>
          <button type="submit" disabled={!userLoc}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
            style={{ backgroundColor: "var(--accent-primary)" }}>
            Find
          </button>
        </form>

        {/* Results */}
        {places.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs" style={{ color: "var(--text-hint)" }}>{places.length} results</p>
            {places.map(place => (
              <div key={place.id} className="flex items-start gap-3 p-3 rounded-xl"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--accent-secondary)" }} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{place.name}</p>
                  <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--text-hint)" }}>{place.address}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}