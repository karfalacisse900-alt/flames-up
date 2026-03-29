import React, { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Search, MapPin, Star, Filter, Loader2, Navigation, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

const CATEGORIES = [
  { id: "restaurant", label: "Food", emoji: "🍽️" },
  { id: "bar", label: "Nightlife", emoji: "🍸" },
  { id: "shopping_mall", label: "Shopping", emoji: "🛍️" },
  { id: "tourist_attraction", label: "Sights", emoji: "🏛️" },
  { id: "park", label: "Parks", emoji: "🌳" },
  { id: "gym", label: "Fitness", emoji: "💪" },
  { id: "movie_theater", label: "Movies", emoji: "🎬" },
  { id: "cafe", label: "Cafes", emoji: "☕" },
];

const DISTANCES = [
  { label: "1 mi", meters: 1609 },
  { label: "5 mi", meters: 8047 },
  { label: "10 mi", meters: 16093 },
  { label: "25 mi", meters: 40234 },
];

function PlaceCard({ place, userLat, userLng }) {
  const dist = userLat && place.lat
    ? (() => {
        const R = 3958.8;
        const dLat = (place.lat - userLat) * Math.PI / 180;
        const dLng = (place.lng - userLng) * Math.PI / 180;
        const a = Math.sin(dLat/2)**2 + Math.cos(userLat*Math.PI/180)*Math.cos(place.lat*Math.PI/180)*Math.sin(dLng/2)**2;
        return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1);
      })()
    : null;

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
      {place.photo ? (
        <img src={place.photo} alt={place.name} className="w-full h-36 object-cover" />
      ) : (
        <div className="w-full h-36 flex items-center justify-center text-4xl"
          style={{ backgroundColor: "var(--bg-subtle)" }}>
          {CATEGORIES.find(c => place.types?.includes(c.id))?.emoji || "📍"}
        </div>
      )}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-sm leading-tight" style={{ color: "var(--text-primary)" }}>{place.name}</h3>
          {place.open_now !== undefined && (
            <span className="shrink-0 text-xs font-semibold px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: place.open_now ? "#DCFCE7" : "#FEE2E2", color: place.open_now ? "#16A34A" : "#DC2626" }}>
              {place.open_now ? "Open" : "Closed"}
            </span>
          )}
        </div>
        <p className="text-xs mb-2 line-clamp-1" style={{ color: "var(--text-hint)" }}>{place.address}</p>
        <div className="flex items-center gap-2">
          {place.rating && (
            <div className="flex items-center gap-0.5">
              <Star className="w-3 h-3" style={{ color: "#F59E0B", fill: "#F59E0B" }} />
              <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>{place.rating}</span>
              {place.user_ratings_total && (
                <span className="text-xs" style={{ color: "var(--text-hint)" }}>({place.user_ratings_total > 1000 ? (place.user_ratings_total/1000).toFixed(1)+"k" : place.user_ratings_total})</span>
              )}
            </div>
          )}
          {dist && (
            <div className="flex items-center gap-0.5 ml-auto">
              <Navigation className="w-3 h-3" style={{ color: "var(--text-hint)" }} />
              <span className="text-xs" style={{ color: "var(--text-hint)" }}>{dist} mi</span>
            </div>
          )}
        </div>
        {place.price_level && (
          <p className="text-xs mt-1" style={{ color: "var(--accent-secondary)" }}>
            {"$".repeat(place.price_level)}
          </p>
        )}
      </div>
    </div>
  );
}

export default function NearbyPlaces() {
  const navigate = useNavigate();
  const [coords, setCoords] = useState(null);
  const [locationName, setLocationName] = useState("");
  const [locationLoading, setLocationLoading] = useState(true);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState("restaurant");
  const [activeDistance, setActiveDistance] = useState(DISTANCES[1]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);

  // Get GPS coords
  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      setLocationLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCoords({ lat, lng });
        // Reverse geocode for city/state display
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.suburb || "";
          const state = data.address?.state || "";
          const country = data.address?.country_code?.toUpperCase() || "";
          setLocationName([city, state, country].filter(Boolean).join(", "));
        } catch {}
        setLocationLoading(false);
      },
      () => {
        setError("Location access denied. Please enable location permissions.");
        setLocationLoading(false);
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }, []);

  const fetchPlaces = useCallback(async () => {
    if (!coords) return;
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("nearbyPlaces", {
        lat: coords.lat,
        lng: coords.lng,
        radius: activeDistance.meters,
        type: activeCategory,
        keyword: search.trim(),
      });
      setPlaces(res.data?.results || []);
    } catch (e) {
      setError("Failed to load places. Try again.");
    }
    setLoading(false);
  }, [coords, activeCategory, activeDistance, search]);

  useEffect(() => {
    if (coords) fetchPlaces();
  }, [coords, activeCategory, activeDistance]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPlaces();
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="sticky top-0 z-30"
        style={{ backgroundColor: "var(--bg-app)", borderBottom: "1px solid var(--border-light)", paddingTop: "max(env(safe-area-inset-top, 12px), 12px)" }}>
        <div className="flex items-center gap-3 px-4 pb-3">
          <button onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full shrink-0"
            style={{ backgroundColor: "var(--bg-subtle)", minHeight: "unset", minWidth: "unset" }}>
            <ArrowLeft className="w-5 h-5" style={{ color: "var(--text-primary)" }} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold leading-tight" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
              Nearby Places
            </h1>
            {locationName && (
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 shrink-0" style={{ color: "var(--accent-secondary)" }} />
                <p className="text-xs font-medium truncate" style={{ color: "var(--accent-secondary)" }}>{locationName}</p>
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="px-4 pb-3">
          <div className="flex items-center gap-2 px-3 rounded-2xl"
            style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
            <Search className="w-4 h-4 shrink-0" style={{ color: "var(--text-hint)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search restaurants, bars, parks..."
              className="flex-1 py-2.5 bg-transparent text-sm outline-none border-none"
              style={{ color: "var(--text-primary)", boxShadow: "none", borderRadius: 0, padding: "10px 0", transform: "none" }} />
            {search && (
              <button type="button" onClick={() => setSearch("")}
                style={{ minHeight: "unset", minWidth: "unset" }}>
                <X className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
              </button>
            )}
          </div>
        </form>

        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-3">
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0"
              style={{
                backgroundColor: activeCategory === cat.id ? "var(--accent-primary)" : "var(--bg-subtle)",
                color: activeCategory === cat.id ? "#fff" : "var(--text-secondary)",
                border: `1px solid ${activeCategory === cat.id ? "transparent" : "var(--border-light)"}`,
                minHeight: "unset", minWidth: "unset",
              }}>
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* Distance filters */}
        <div className="flex gap-2 px-4 pb-3">
          {DISTANCES.map(d => (
            <button key={d.label} onClick={() => setActiveDistance(d)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: activeDistance.label === d.label ? "var(--accent-secondary)" : "var(--bg-subtle)",
                color: activeDistance.label === d.label ? "#fff" : "var(--text-secondary)",
                border: `1px solid ${activeDistance.label === d.label ? "transparent" : "var(--border-light)"}`,
                minHeight: "unset", minWidth: "unset",
              }}>
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 pb-28">
        {locationLoading ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: "var(--accent-primary)" }} />
            <p className="text-sm" style={{ color: "var(--text-hint)" }}>Getting your location…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center px-6">
            <div className="text-5xl">📍</div>
            <p className="text-base font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Location needed</p>
            <p className="text-sm" style={{ color: "var(--text-hint)" }}>{error}</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--accent-primary)" }} />
          </div>
        ) : places.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <div className="text-5xl">🔍</div>
            <p className="text-base font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>No places found</p>
            <p className="text-sm" style={{ color: "var(--text-hint)" }}>Try a different category or expand the distance</p>
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-hint)" }}>
              {places.length} places within {activeDistance.label}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {places.map(place => (
                <PlaceCard key={place.id} place={place} userLat={coords?.lat} userLng={coords?.lng} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}