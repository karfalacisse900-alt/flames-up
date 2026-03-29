import React, { useState, useEffect, useCallback } from "react";
import NearbyEventsPage from "./NearbyEventsPage";
import { ArrowLeft, MapPin, Star, Navigation, Loader2, X, Phone, Globe, Clock, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";

const CATEGORIES = [
  { id: "restaurant", label: "Food", emoji: "🍽️" },
  { id: "bar", label: "Nightlife", emoji: "🍸" },
  { id: "shopping_mall", label: "Shopping", emoji: "🛍️" },
  { id: "event", label: "Events", emoji: "🎉", keyword: "local event market festival outdoor movie" },
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

function PlaceDetailPage({ placeId, basicPlace, userLat, userLng, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const cat = CATEGORIES.find(c => basicPlace.types?.includes(c.id));
  const dist = userLat && basicPlace.lat ? haversine(userLat, userLng, basicPlace.lat, basicPlace.lng) : null;

  useEffect(() => {
    base44.functions.invoke("nearbyPlaces", { place_id: placeId })
      .then(res => { if (res.data?.detail) setDetail(res.data.detail); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [placeId]);

  const d = detail || basicPlace;
  const photos = detail?.photos?.length ? detail.photos : basicPlace.photo ? [basicPlace.photo] : [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3"
        style={{ backgroundColor: "var(--bg-app)", borderBottom: "1px solid var(--border-light)", paddingTop: "max(env(safe-area-inset-top,12px),12px)" }}>
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full shrink-0"
          style={{ backgroundColor: "var(--bg-subtle)", minHeight: "unset", minWidth: "unset" }}>
          <ArrowLeft className="w-5 h-5" style={{ color: "var(--text-primary)" }} />
        </button>
        <h1 className="text-lg font-bold truncate" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>{basicPlace.name}</h1>
      </div>

      <div className="pb-28">
        {/* Photo grid — fashion feed style */}
        {photos.length > 0 && (
          <div className="mb-0">
            {/* Main photo */}
            <div className="relative" style={{ height: 260 }}>
              <img src={photos[activePhoto]} alt={d.name} className="w-full h-full object-cover" />
              {d.open_now !== undefined && (
                <span className="absolute top-4 left-4 text-xs font-bold px-3 py-1 rounded-full"
                  style={{ backgroundColor: d.open_now ? "#16A34A" : "#DC2626", color: "#fff" }}>
                  {d.open_now ? "Open now" : "Closed"}
                </span>
              )}
              {dist && (
                <span className="absolute top-4 right-4 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1"
                  style={{ backgroundColor: "rgba(0,0,0,0.55)", color: "#fff" }}>
                  <Navigation className="w-3 h-3" />{dist} mi
                </span>
              )}
            </div>
            {/* Thumbnail strip */}
            {photos.length > 1 && (
              <div className="flex gap-1.5 px-4 pt-2 overflow-x-auto scrollbar-hide">
                {photos.map((p, i) => (
                  <button key={i} onClick={() => setActivePhoto(i)}
                    className="shrink-0 rounded-xl overflow-hidden"
                    style={{ width: 68, height: 52, border: i === activePhoto ? "2px solid var(--accent-primary)" : "2px solid transparent", minHeight: "unset", minWidth: "unset" }}>
                    <img src={p} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--accent-primary)" }} />
          </div>
        )}

        <div className="px-4 pt-4 space-y-4">
          {/* Name, category, rating */}
          <div>
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-xl font-bold leading-tight" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>{d.name}</h2>
              {d.price_level && (
                <span className="shrink-0 text-sm font-bold mt-1" style={{ color: "var(--accent-secondary)" }}>{"$".repeat(d.price_level)}</span>
              )}
            </div>
            {cat && (
              <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-1"
                style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
                {cat.emoji} {cat.label}
              </span>
            )}
          </div>

          {/* Rating */}
          {d.rating && (
            <div className="flex items-center gap-2 p-3 rounded-2xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className="w-4 h-4" style={{ color: "#F59E0B", fill: s <= Math.round(d.rating) ? "#F59E0B" : "none" }} />
                ))}
              </div>
              <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{d.rating}</span>
              {d.user_ratings_total && (
                <span className="text-xs" style={{ color: "var(--text-hint)" }}>
                  ({d.user_ratings_total > 1000 ? (d.user_ratings_total/1000).toFixed(1)+"k" : d.user_ratings_total} reviews)
                </span>
              )}
            </div>
          )}

          {/* Summary / description */}
          {detail?.summary && (
            <div className="p-4 rounded-2xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{detail.summary}</p>
            </div>
          )}

          {/* Info card */}
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
            {d.address && (
              <div className="flex items-start gap-3 px-4 py-3" style={{ borderBottom: "1px solid var(--border-light)" }}>
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--accent-secondary)" }} />
                <p className="text-sm" style={{ color: "var(--text-primary)" }}>{d.address || basicPlace.address}</p>
              </div>
            )}
            {detail?.phone && (
              <a href={`tel:${detail.phone}`} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid var(--border-light)", color: "inherit", textDecoration: "none" }}>
                <Phone className="w-4 h-4 shrink-0" style={{ color: "var(--accent-secondary)" }} />
                <p className="text-sm" style={{ color: "var(--text-primary)" }}>{detail.phone}</p>
              </a>
            )}
            {detail?.website && (
              <a href={detail.website} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid var(--border-light)", color: "inherit", textDecoration: "none" }}>
                <Globe className="w-4 h-4 shrink-0" style={{ color: "var(--accent-secondary)" }} />
                <p className="text-sm truncate" style={{ color: "var(--accent-primary)" }}>{detail.website.replace(/^https?:\/\/(www\.)?/, "")}</p>
              </a>
            )}
            {detail?.weekday_text?.length > 0 && (
              <details className="px-4 py-3">
                <summary className="flex items-center gap-3 cursor-pointer list-none">
                  <Clock className="w-4 h-4 shrink-0" style={{ color: "var(--accent-secondary)" }} />
                  <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Opening hours</span>
                  <ChevronRight className="w-4 h-4 ml-auto" style={{ color: "var(--text-hint)" }} />
                </summary>
                <div className="mt-2 pl-7 space-y-1">
                  {detail.weekday_text.map((t, i) => (
                    <p key={i} className="text-xs" style={{ color: "var(--text-secondary)" }}>{t}</p>
                  ))}
                </div>
              </details>
            )}
          </div>

          {/* Reviews */}
          {detail?.reviews?.length > 0 && (
            <div>
              <h3 className="text-base font-bold mb-3" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>What people say</h3>
              <div className="space-y-3">
                {detail.reviews.map((r, i) => (
                  <div key={i} className="p-4 rounded-2xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
                          {r.author[0]}
                        </div>
                        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{r.author}</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className="w-3 h-3" style={{ color: "#F59E0B", fill: s <= r.rating ? "#F59E0B" : "none" }} />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{r.text}</p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>{r.time}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {d.lat && d.lng && (
              <a href={`https://maps.google.com/?q=${d.lat},${d.lng}`} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold"
                style={{ backgroundColor: "var(--accent-primary)", color: "#fff" }}>
                <Navigation className="w-4 h-4" />
                Get Directions
              </a>
            )}
            {detail?.website && (
              <a href={detail.website} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold"
                style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", border: "1px solid var(--border-light)" }}>
                <Globe className="w-4 h-4" />
                Website
              </a>
            )}
          </div>
        </div>
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
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showEvents, setShowEvents] = useState(false);
  const [filterFree, setFilterFree] = useState(false);
  const [filterTopRated, setFilterTopRated] = useState(false);
  const [filterOpenNow, setFilterOpenNow] = useState(false);

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
    if (!coords || activeCategory === "event") return;
    setLoading(true);
    const cat = CATEGORIES.find(c => c.id === activeCategory);
    try {
      const res = await base44.functions.invoke("nearbyPlaces", {
        lat: coords.lat, lng: coords.lng, radius: 8047,
        type: activeCategory,
        keyword: cat?.keyword || "",
      });
      setPlaces(res.data?.results || []);
    } catch {}
    setLoading(false);
  }, [coords, activeCategory]);

  useEffect(() => {
    if (activeCategory === "event") { setShowEvents(true); return; }
    setShowEvents(false);
    if (coords) fetchPlaces();
  }, [coords, activeCategory]);

  if (showEvents) {
    return (
      <NearbyEventsPage
        coords={coords}
        locationName={locationName}
        onClose={() => { setShowEvents(false); setActiveCategory("restaurant"); }}
        onSelectEvent={(ev) => setSelectedPlace({ ...ev, isEvent: true })}
      />
    );
  }

  if (selectedPlace) {
    return (
      <PlaceDetailPage
        placeId={selectedPlace.id}
        basicPlace={selectedPlace}
        userLat={coords?.lat}
        userLng={coords?.lng}
        onClose={() => setSelectedPlace(null)}
      />
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="sticky top-0 z-30"
        style={{ backgroundColor: "var(--bg-app)", borderBottom: "1px solid var(--border-light)", paddingTop: "max(env(safe-area-inset-top,12px),12px)" }}>
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
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-2">
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

        {/* Filter toggles */}
        {activeCategory !== "event" && (
          <div className="flex gap-2 px-4 pb-3">
            {[
              { label: "🆓 Free Entry", active: filterFree, set: () => setFilterFree(v => !v) },
              { label: "⭐ Top Rated", active: filterTopRated, set: () => setFilterTopRated(v => !v) },
              { label: "🟢 Open Now", active: filterOpenNow, set: () => setFilterOpenNow(v => !v) },
            ].map(f => (
              <button key={f.label} onClick={f.set}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap"
                style={{
                  backgroundColor: f.active ? "var(--accent-primary)" : "var(--bg-card)",
                  color: f.active ? "#fff" : "var(--text-secondary)",
                  border: `1px solid ${f.active ? "transparent" : "var(--border-light)"}`,
                  minHeight: "unset", minWidth: "unset",
                }}>
                {f.label}
              </button>
            ))}
          </div>
        )}
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
            {/* Apply filters */}
          {(() => {
            let list = places;
            if (filterFree) list = list.filter(p => !p.price_level || p.price_level === 0);
            if (filterTopRated) list = list.filter(p => p.rating >= 4.2);
            if (filterOpenNow) list = list.filter(p => p.open_now === true);
            const displayPlaces = list;
            return (
              <>
                <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-hint)" }}>{displayPlaces.length} places found</p>
                <div className="grid grid-cols-2 gap-3">
                  {displayPlaces.map(place => {
                    const dist = coords ? haversine(coords.lat, coords.lng, place.lat, place.lng) : null;
                    const cat = CATEGORIES.find(c => place.types?.includes(c.id));
                    return (
                      <button key={place.id} onClick={() => setSelectedPlace(place)}
                        className="rounded-2xl overflow-hidden text-left"
                        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", minHeight: "unset", minWidth: "unset" }}>
                        {place.photo ? (
                          <div className="relative">
                            <img src={place.photo} alt={place.name} className="w-full object-cover" style={{ height: 120 }} />
                            {place.open_now !== undefined && (
                              <span className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: place.open_now ? "#16A34A" : "#DC2626", color: "#fff" }}>
                                {place.open_now ? "Open" : "Closed"}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="w-full flex items-center justify-center text-3xl" style={{ height: 120, backgroundColor: "var(--bg-subtle)" }}>
                            {cat?.emoji || "📍"}
                          </div>
                        )}
                        <div className="p-3">
                          <p className="font-semibold text-sm leading-tight mb-1 line-clamp-1" style={{ color: "var(--text-primary)" }}>{place.name}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-0.5">
                              {place.rating && (
                                <><Star className="w-3 h-3" style={{ color: "#F59E0B", fill: "#F59E0B" }} />
                                <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>{place.rating}</span></>
                              )}
                            </div>
                            {dist && <span className="text-xs" style={{ color: "var(--text-hint)" }}>{dist} mi</span>}
                          </div>
                          {place.price_level && (
                            <p className="text-xs font-semibold mt-0.5" style={{ color: "var(--accent-secondary)" }}>{"$".repeat(place.price_level)}</p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            );
          })()}
          </>
        )}
      </div>
    </div>
  );
}