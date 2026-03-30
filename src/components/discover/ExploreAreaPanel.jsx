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

  const priceStr = d.price_level ? "$".repeat(d.price_level) : null;
  const openText = d.open_now !== undefined ? (d.open_now ? "Open" : "Closed") : null;
  const closingTime = detail?.weekday_text?.[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]?.split(": ")[1] || null;

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: "#000" }}>
      {/* Full-bleed photo */}
      <div className="relative w-full" style={{ height: "55vh", minHeight: 280 }}>
        {photos.length > 0 ? (
          <img src={photos[activePhoto]} alt={d.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl" style={{ backgroundColor: "#1a1a1a" }}>
            {cat?.emoji || "📍"}
          </div>
        )}
        {/* Back button */}
        <button onClick={onClose}
          className="absolute top-0 left-4 w-9 h-9 flex items-center justify-center rounded-full"
          style={{ top: "max(env(safe-area-inset-top,16px),16px)", backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", minHeight: "unset", minWidth: "unset" }}>
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
        {/* Top right actions */}
        <div className="absolute right-4 flex gap-2" style={{ top: "max(env(safe-area-inset-top,16px),16px)" }}>
          <button className="w-9 h-9 flex items-center justify-center rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", minHeight: "unset", minWidth: "unset" }}>
            <Bookmark className="w-4 h-4 text-white" />
          </button>
          <button className="w-9 h-9 flex items-center justify-center rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", minHeight: "unset", minWidth: "unset" }}>
            <Globe className="w-4 h-4 text-white" />
          </button>
          <button className="w-9 h-9 flex items-center justify-center rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", minHeight: "unset", minWidth: "unset" }}>
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        {/* Photo dots */}
        {photos.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
            {photos.map((_, i) => (
              <button key={i} onClick={() => setActivePhoto(i)}
                className="rounded-full transition-all"
                style={{ width: i === activePhoto ? 20 : 6, height: 6, backgroundColor: i === activePhoto ? "#fff" : "rgba(255,255,255,0.5)", minHeight: "unset", minWidth: "unset" }} />
            ))}
          </div>
        )}
      </div>

      {/* Bottom card — dark */}
      <div className="relative z-10 rounded-t-3xl px-5 pt-5 pb-32" style={{ backgroundColor: "#1C1C1E", marginTop: -24 }}>
        {/* Name + meta row */}
        <h2 className="text-xl font-bold text-white mb-1" style={{ fontFamily: "var(--font-serif)" }}>{d.name}</h2>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {d.address && <span className="text-xs text-gray-400">{d.address?.split(",")[0]}</span>}
          {dist && <>
            <span className="text-gray-600">·</span>
            <span className="text-xs text-gray-400">🚗 {dist} mi</span>
          </>}
          {priceStr && <>
            <span className="text-gray-600">·</span>
            <span className="text-xs text-gray-400">{priceStr}</span>
          </>}
        </div>

        {/* Open status */}
        {openText && (
          <div className="flex items-center gap-1.5 mb-4">
            <span className="text-sm font-semibold" style={{ color: d.open_now ? "#34D399" : "#F87171" }}>{openText}</span>
            {closingTime && <span className="text-xs text-gray-500">· {closingTime}</span>}
          </div>
        )}

        {/* Social proof chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4">
          {d.rating && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0" style={{ backgroundColor: "#2C2C2E", minHeight: "unset" }}>
              <span className="text-xs">⭐</span>
              <span className="text-xs font-semibold text-white">{d.rating}</span>
              {d.user_ratings_total && <span className="text-xs text-gray-400">({d.user_ratings_total > 1000 ? (d.user_ratings_total/1000).toFixed(1)+"k" : d.user_ratings_total})</span>}
            </div>
          )}
          {cat && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0" style={{ backgroundColor: "#2C2C2E", minHeight: "unset" }}>
              <span className="text-xs">{cat.emoji}</span>
              <span className="text-xs font-semibold text-white">{cat.label}</span>
            </div>
          )}
          {d.user_ratings_total > 100 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0" style={{ backgroundColor: "#2C2C2E", minHeight: "unset" }}>
              <span className="text-xs">👍</span>
              <span className="text-xs font-semibold text-white">{d.user_ratings_total > 1000 ? Math.floor(d.user_ratings_total/1000)+"k+" : d.user_ratings_total+"+"} reviews</span>
            </div>
          )}
        </div>

        {/* Description */}
        {loading && <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-gray-500" /></div>}
        {detail?.summary && (
          <div className="mb-4">
            <p className="text-sm leading-relaxed text-gray-300">{detail.summary}</p>
            {cat && <p className="text-xs text-gray-500 mt-2">↳ {cat.label} · {cat.emoji}</p>}
          </div>
        )}

        {/* Divider */}
        <div className="mb-5" style={{ height: 1, backgroundColor: "#2C2C2E" }} />

        {/* Action buttons */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {detail?.phone && (
            <a href={`tel:${detail.phone}`} className="flex flex-col items-center gap-1.5">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#2C2C2E" }}>
                <Phone className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-gray-400">Call</span>
            </a>
          )}
          {d.lat && d.lng && (
            <a href={`https://maps.google.com/?q=${d.lat},${d.lng}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#2C2C2E" }}>
                <Navigation className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-gray-400">Directions</span>
            </a>
          )}
          {detail?.website && (
            <a href={detail.website} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#2C2C2E" }}>
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-gray-400">Website</span>
            </a>
          )}
          {detail?.weekday_text?.length > 0 && (
            <details className="flex flex-col items-center gap-1.5" open={false}>
              <summary className="flex flex-col items-center gap-1.5 list-none cursor-pointer">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#2C2C2E" }}>
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-gray-400">Hours</span>
              </summary>
              <div className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} onClick={e => e.currentTarget === e.target && e.currentTarget.parentElement.removeAttribute('open')}>
                <div className="w-full rounded-t-3xl p-5 pb-10" style={{ backgroundColor: "#1C1C1E" }}>
                  <h3 className="text-white font-bold mb-3">Hours</h3>
                  {detail.weekday_text.map((t, i) => <p key={i} className="text-xs text-gray-400 mb-1">{t}</p>)}
                </div>
              </div>
            </details>
          )}
        </div>

        {/* Reviews */}
        {detail?.reviews?.length > 0 && (
          <div>
            <h3 className="text-base font-bold text-white mb-3">What people say</h3>
            <div className="space-y-3">
              {detail.reviews.slice(0,3).map((r, i) => (
                <div key={i} className="p-4 rounded-2xl" style={{ backgroundColor: "#2C2C2E" }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: "#3A3A3C", color: "#fff" }}>{r.author[0]}</div>
                      <span className="text-sm font-semibold text-white">{r.author}</span>
                    </div>
                    <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3" style={{ color: "#F59E0B", fill: s <= r.rating ? "#F59E0B" : "none" }} />)}</div>
                  </div>
                  <p className="text-xs leading-relaxed text-gray-400">{r.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExploreAreaPanel({ onClose, inline = false }) {
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

  const sectionHeader = (
    <div style={{ backgroundColor: "var(--bg-app)", borderTop: inline ? "1px solid var(--border-light)" : "none", borderBottom: "1px solid var(--border-light)" }}>
      {!inline && (
        <div className="flex items-center gap-3 px-4 pb-3" style={{ paddingTop: "max(env(safe-area-inset-top,12px),12px)" }}>
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
      )}
      {inline && (
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-lg">🗺️</span>
            <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Explore Your Area</h2>
          </div>
          {locationName && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" style={{ color: "var(--accent-secondary)" }} />
              <p className="text-xs font-medium" style={{ color: "var(--accent-secondary)" }}>Near {locationName}</p>
            </div>
          )}
        </div>
      )}

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-2">
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
  );

  return (
    <div className={inline ? "" : "min-h-screen"} style={{ backgroundColor: "var(--bg-app)" }}>
      {inline ? sectionHeader : (
        <div className="sticky top-0 z-30">{sectionHeader}</div>
      )}

      {/* Content */}
      <div className="px-4 py-4" style={{ paddingBottom: inline ? 24 : 112 }}>
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