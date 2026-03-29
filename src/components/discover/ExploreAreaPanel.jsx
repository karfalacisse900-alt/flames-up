import React, { useState, useEffect, useCallback } from "react";
import { ArrowLeft, MapPin, Star, Navigation, Loader2, X, Phone, Globe, Clock, ExternalLink } from "lucide-react";
import { base44 } from "@/api/base44Client";

const CATEGORIES = [
  { id: "restaurant", label: "Food", emoji: "🍽️" },
  { id: "bar", label: "Nightlife", emoji: "🍸" },
  { id: "shopping_mall", label: "Shopping", emoji: "🛍️" },
  { id: "event", label: "Events", emoji: "🎉", keyword: "local event market festival" },
  { id: "tourist_attraction", label: "Sights", emoji: "🏛️" },
  { id: "park", label: "Outdoor", emoji: "🌳" },
  { id: "movie_theater", label: "Movies", emoji: "🎬" },
  { id: "cafe", label: "Cafe", emoji: "☕" },
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

function PlaceDetailSheet({ place, userLat, userLng, onClose }) {
  const dist = userLat && place.lat ? haversine(userLat, userLng, place.lat, place.lng) : null;
  const cat = CATEGORIES.find(c => place.types?.includes(c.id));
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden sheet-enter max-w-lg mx-auto"
        style={{ backgroundColor: "var(--bg-modal)", maxHeight: "80vh", overflowY: "auto" }}>
        {/* Hero */}
        {place.photo ? (
          <img src={place.photo} alt={place.name} className="w-full object-cover" style={{ height: 200 }} />
        ) : (
          <div className="w-full flex items-center justify-center text-6xl" style={{ height: 160, backgroundColor: "var(--bg-subtle)" }}>
            {cat?.emoji || "📍"}
          </div>
        )}

        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", minHeight: "unset", minWidth: "unset" }}>
          <X className="w-4 h-4 text-white" />
        </button>

        <div className="p-5 pb-10">
          {/* Name & status */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h2 className="text-xl font-bold leading-tight" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>{place.name}</h2>
            {place.open_now !== undefined && (
              <span className="shrink-0 text-xs font-bold px-2 py-1 rounded-full mt-1"
                style={{ backgroundColor: place.open_now ? "#DCFCE7" : "#FEE2E2", color: place.open_now ? "#16A34A" : "#DC2626" }}>
                {place.open_now ? "Open" : "Closed"}
              </span>
            )}
          </div>

          {/* Category tag */}
          {cat && (
            <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-3"
              style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
              {cat.emoji} {cat.label}
            </span>
          )}

          {/* Rating & distance */}
          <div className="flex items-center gap-4 mb-4">
            {place.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4" style={{ color: "#F59E0B", fill: "#F59E0B" }} />
                <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{place.rating}</span>
                {place.user_ratings_total && (
                  <span className="text-xs" style={{ color: "var(--text-hint)" }}>
                    ({place.user_ratings_total > 1000 ? (place.user_ratings_total/1000).toFixed(1)+"k" : place.user_ratings_total})
                  </span>
                )}
              </div>
            )}
            {dist && (
              <div className="flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5" style={{ color: "var(--text-hint)" }} />
                <span className="text-sm" style={{ color: "var(--text-hint)" }}>{dist} mi away</span>
              </div>
            )}
            {place.price_level && (
              <span className="text-sm font-semibold" style={{ color: "var(--accent-secondary)" }}>{"$".repeat(place.price_level)}</span>
            )}
          </div>

          {/* Address */}
          {place.address && (
            <div className="flex items-start gap-2 mb-3 p-3 rounded-2xl" style={{ backgroundColor: "var(--bg-subtle)" }}>
              <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--accent-secondary)" }} />
              <p className="text-sm" style={{ color: "var(--text-primary)" }}>{place.address}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-4">
            {place.lat && place.lng && (
              <a href={`https://maps.google.com/?q=${place.lat},${place.lng}`} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold"
                style={{ backgroundColor: "var(--accent-primary)", color: "#fff" }}>
                <Navigation className="w-4 h-4" />
                Directions
              </a>
            )}
            {place.website && (
              <a href={place.website} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold"
                style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", border: "1px solid var(--border-light)" }}>
                <Globe className="w-4 h-4" />
                Website
              </a>
            )}
          </div>
        </div>
      </div>
    </>
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
  const [selectedPlace, setSelectedPlace] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) { setError("Geolocation not supported"); setLocationLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCoords({ lat, lng });
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const data = await res.json();
          setLocationName(data.address?.city || data.address?.town || data.address?.suburb || "your area");
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
    const cat = CATEGORIES.find(c => c.id === activeCategory);
    try {
      const res = await base44.functions.invoke("nearbyPlaces", {
        lat: coords.lat, lng: coords.lng, radius: 8047,
        type: activeCategory === "event" ? "tourist_attraction" : activeCategory,
        keyword: cat?.keyword || "",
      });
      setPlaces(res.data?.results || []);
    } catch {}
    setLoading(false);
  }, [coords, activeCategory]);

  useEffect(() => { if (coords) fetchPlaces(); }, [coords, activeCategory]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="sticky top-0 z-30"
        style={{ backgroundColor: "var(--bg-app)", borderBottom: "1px solid var(--border-light)", paddingTop: "max(env(safe-area-inset-top, 12px), 12px)" }}>
        <div className="flex items-center gap-3 px-4 pb-3">
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full shrink-0"
            style={{ backgroundColor: "var(--bg-subtle)", minHeight: "unset", minWidth: "unset" }}>
            <ArrowLeft className="w-5 h-5" style={{ color: "var(--text-primary)" }} />
          </button>
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Explore Your Area</h1>
            {locationName && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" style={{ color: "var(--accent-secondary)" }} />
                <p className="text-xs font-medium" style={{ color: "var(--accent-secondary)" }}>Near {locationName}</p>
              </div>
            )}
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-3">
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap shrink-0"
              style={{
                backgroundColor: activeCategory === cat.id ? "var(--accent-primary)" : "var(--bg-card)",
                color: activeCategory === cat.id ? "#fff" : "var(--text-secondary)",
                border: `1px solid ${activeCategory === cat.id ? "transparent" : "var(--border-light)"}`,
                minHeight: "unset", minWidth: "unset",
              }}>
              {cat.emoji} {cat.label}
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
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--accent-primary)" }} />
          </div>
        ) : places.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <div className="text-5xl">🔍</div>
            <p className="text-base font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Nothing found nearby</p>
            <p className="text-sm" style={{ color: "var(--text-hint)" }}>Try a different category</p>
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-hint)" }}>{places.length} places found</p>
            <div className="grid grid-cols-2 gap-3">
              {places.map(place => {
                const dist = coords ? haversine(coords.lat, coords.lng, place.lat, place.lng) : null;
                const cat = CATEGORIES.find(c => place.types?.includes(c.id));
                return (
                  <button key={place.id} onClick={() => setSelectedPlace(place)}
                    className="rounded-2xl overflow-hidden text-left"
                    style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", minHeight: "unset", minWidth: "unset" }}>
                    {place.photo ? (
                      <img src={place.photo} alt={place.name} className="w-full object-cover" style={{ height: 110 }} />
                    ) : (
                      <div className="w-full flex items-center justify-center text-3xl" style={{ height: 110, backgroundColor: "var(--bg-subtle)" }}>
                        {cat?.emoji || "📍"}
                      </div>
                    )}
                    <div className="p-3">
                      <p className="font-semibold text-sm leading-tight mb-1 line-clamp-1" style={{ color: "var(--text-primary)" }}>{place.name}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-0.5">
                          {place.rating && <>
                            <Star className="w-3 h-3" style={{ color: "#F59E0B", fill: "#F59E0B" }} />
                            <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>{place.rating}</span>
                          </>}
                        </div>
                        {dist && (
                          <span className="text-xs" style={{ color: "var(--text-hint)" }}>{dist} mi</span>
                        )}
                      </div>
                      {place.open_now !== undefined && (
                        <span className="text-xs font-semibold" style={{ color: place.open_now ? "#16A34A" : "#DC2626" }}>
                          {place.open_now ? "Open now" : "Closed"}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Place detail */}
      {selectedPlace && (
        <PlaceDetailSheet
          place={selectedPlace}
          userLat={coords?.lat}
          userLng={coords?.lng}
          onClose={() => setSelectedPlace(null)}
        />
      )}
    </div>
  );
}