import React, { useState, useEffect, useCallback } from "react";
import { MapPin, Star, Navigation, Loader2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

const CATEGORIES = [
  { id: "restaurant", label: "Food", emoji: "🍽️" },
  { id: "bar", label: "Nightlife", emoji: "🍸" },
  { id: "night_club", label: "Clubs", emoji: "🎵" },
  { id: "shopping_mall", label: "Shopping", emoji: "🛍️" },
  { id: "tourist_attraction", label: "Sights", emoji: "🏛️" },
  { id: "park", label: "Outdoors", emoji: "🌳" },
  { id: "movie_theater", label: "Movies", emoji: "🎬" },
  { id: "cafe", label: "Cafes", emoji: "☕" },
  { id: "gym", label: "Fitness", emoji: "💪" },
  { id: "spa", label: "Wellness", emoji: "🧘" },
];

function haversine(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1);
}

function PlaceCard({ place, userLat, userLng }) {
  const dist = userLat && place.lat ? haversine(userLat, userLng, place.lat, place.lng) : null;
  return (
    <div className="rounded-2xl overflow-hidden shrink-0" style={{ width: 160, backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
      {place.photo ? (
        <img src={place.photo} alt={place.name} className="w-full object-cover" style={{ height: 100 }} />
      ) : (
        <div className="w-full flex items-center justify-center text-3xl" style={{ height: 100, backgroundColor: "var(--bg-subtle)" }}>
          {CATEGORIES.find(c => place.types?.includes(c.id))?.emoji || "📍"}
        </div>
      )}
      <div className="p-2.5">
        <p className="text-xs font-semibold leading-tight mb-1 line-clamp-1" style={{ color: "var(--text-primary)" }}>{place.name}</p>
        <div className="flex items-center justify-between">
          {place.rating && (
            <div className="flex items-center gap-0.5">
              <Star className="w-2.5 h-2.5" style={{ color: "#F59E0B", fill: "#F59E0B" }} />
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{place.rating}</span>
            </div>
          )}
          {dist && (
            <div className="flex items-center gap-0.5">
              <Navigation className="w-2.5 h-2.5" style={{ color: "var(--text-hint)" }} />
              <span className="text-xs" style={{ color: "var(--text-hint)" }}>{dist}mi</span>
            </div>
          )}
        </div>
        {place.open_now !== undefined && (
          <span className="text-xs font-semibold" style={{ color: place.open_now ? "#16A34A" : "#DC2626" }}>
            {place.open_now ? "Open" : "Closed"}
          </span>
        )}
      </div>
    </div>
  );
}

export default function ExploreAreaPanel({ onClose }) {
  const [coords, setCoords] = useState(null);
  const [locationName, setLocationName] = useState("");
  const [locationLoading, setLocationLoading] = useState(true);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState("restaurant");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) { setError("Geolocation not supported"); setLocationLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCoords({ lat, lng });
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.suburb || "";
          setLocationName(city);
        } catch {}
        setLocationLoading(false);
      },
      () => { setError("Location access denied"); setLocationLoading(false); },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }, []);

  const fetchPlaces = useCallback(async () => {
    if (!coords) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke("nearbyPlaces", {
        lat: coords.lat, lng: coords.lng, radius: 8047, type: activeCategory,
      });
      setPlaces(res.data?.results || []);
    } catch {}
    setLoading(false);
  }, [coords, activeCategory]);

  useEffect(() => { if (coords) fetchPlaces(); }, [coords, activeCategory]);

  return (
    <div className="mx-4 mb-4 rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border-light)" }}>
        <div className="flex items-center gap-1.5">
          <MapPin className="w-4 h-4" style={{ color: "var(--accent-secondary)" }} />
          <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            {locationName ? `Near ${locationName}` : "Explore Your Area"}
          </span>
        </div>
        <button onClick={onClose} style={{ minHeight: "unset", minWidth: "unset", backgroundColor: "transparent" }}>
          <X className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
        </button>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3">
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0"
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

      {/* Places */}
      <div className="px-4 pb-4">
        {locationLoading || loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--accent-primary)" }} />
          </div>
        ) : error ? (
          <p className="text-sm text-center py-6" style={{ color: "var(--text-hint)" }}>{error}</p>
        ) : places.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: "var(--text-hint)" }}>No places found nearby</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {places.map(place => (
              <PlaceCard key={place.id} place={place} userLat={coords?.lat} userLng={coords?.lng} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}