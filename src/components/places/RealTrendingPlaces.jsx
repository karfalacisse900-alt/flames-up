import React, { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Star, MapPin, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const TRENDING_TYPES = [
  { type: "tourist_attraction", label: "Attractions", emoji: "🗺️" },
  { type: "restaurant", label: "Restaurants", emoji: "🍽️" },
  { type: "park", label: "Parks", emoji: "🌳" },
  { type: "museum", label: "Museums", emoji: "🏛️" },
  { type: "bar", label: "Bars", emoji: "🍺" },
];

export default function RealTrendingPlaces({ onSelectPlace }) {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLoc, setUserLoc] = useState(null);
  const serviceRef = useRef(null);
  const mapDivRef = useRef(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLoc({ lat: 40.7128, lng: -74.006 }),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
    );
    if (!navigator.geolocation) setUserLoc({ lat: 40.7128, lng: -74.006 });
  }, []);

  useEffect(() => {
    if (!userLoc || loadedRef.current) return;
    loadedRef.current = true;

    const init = async () => {
      setLoading(true);
      const key = await base44.functions.invoke("googleMapsToken", {}).then(r => r.data?.key || r.data).catch(() => null);
      if (!key) { setLoading(false); return; }

      if (!window.google?.maps) {
        await new Promise((res, rej) => {
          if (document.querySelector(`script[src*="maps.googleapis.com"]`)) { res(); return; }
          const s = document.createElement("script");
          s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
          s.async = true; s.onload = res; s.onerror = rej;
          document.head.appendChild(s);
        });
      }

      // Need a map instance for PlacesService (invisible div)
      if (!mapDivRef.current) { setLoading(false); return; }
      const tempMap = new window.google.maps.Map(mapDivRef.current, {
        center: userLoc, zoom: 14, disableDefaultUI: true,
      });
      serviceRef.current = new window.google.maps.places.PlacesService(tempMap);

      const allResults = [];
      const promises = TRENDING_TYPES.map(({ type }) =>
        new Promise(resolve => {
          serviceRef.current.nearbySearch(
            { location: userLoc, radius: 5000, type, rankBy: undefined, keyword: undefined },
            (results, status) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                allResults.push(...results.slice(0, 4).map(p => ({
                  name: p.name,
                  address: p.vicinity,
                  lat: p.geometry.location.lat(),
                  lng: p.geometry.location.lng(),
                  rating: p.rating,
                  ratingCount: p.user_ratings_total,
                  photo: p.photos?.[0]?.getUrl({ maxWidth: 400 }) || null,
                  category: p.types?.[0]?.replace(/_/g, " ") || type,
                  place_id: p.place_id,
                  isOpen: p.opening_hours?.isOpen?.() ?? null,
                })));
              }
              resolve();
            }
          );
        })
      );

      await Promise.all(promises);
      // Sort by rating desc, deduplicate by place_id
      const seen = new Set();
      const deduped = allResults.filter(p => {
        if (seen.has(p.place_id)) return false;
        seen.add(p.place_id);
        return true;
      }).sort((a, b) => (b.rating || 0) - (a.rating || 0));

      setPlaces(deduped.slice(0, 12));
      setLoading(false);
    };

    init().catch(() => setLoading(false));
  }, [userLoc]);

  if (loading) return (
    <div className="px-4 py-4">
      <div ref={mapDivRef} style={{ position: "fixed", width: 1, height: 1, visibility: "hidden", pointerEvents: "none", zIndex: -9999, overflow: "hidden", top: "-9999px", left: "-9999px" }} />
      <div className="flex items-center gap-2 mb-3">

  if (!places.length) return <div ref={mapDivRef} style={{ position: "fixed", width: 1, height: 1, visibility: "hidden", pointerEvents: "none", zIndex: -9999, top: "-9999px", left: "-9999px" }} />;

  return (
    <div className="px-4 py-4">
      {/* invisible map div — fully offscreen so it never bleeds through */}
      <div ref={mapDivRef} style={{ position: "fixed", width: 1, height: 1, visibility: "hidden", pointerEvents: "none", zIndex: -9999, top: "-9999px", left: "-9999px" }} />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
          <span className="text-sm font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Trending Near You</span>
        </div>
        <span className="text-[11px] font-semibold" style={{ color: "var(--text-hint)" }}>Live · Google Maps</span>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {places.map((place, i) => (
          <motion.button
            key={place.place_id || i}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => onSelectPlace?.(place)}
            className="shrink-0 rounded-2xl overflow-hidden text-left transition-all active:scale-[0.96]"
            style={{ width: 160, backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
          >
            {/* Photo */}
            <div style={{ height: 100, position: "relative", overflow: "hidden", backgroundColor: "var(--bg-subtle)" }}>
              {place.photo ? (
                <img src={place.photo} alt={place.name} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">📍</div>
              )}
              {place.isOpen !== null && (
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: place.isOpen ? "rgba(22,163,74,0.9)" : "rgba(220,38,38,0.85)", color: "#fff" }}>
                  {place.isOpen ? "Open" : "Closed"}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-2.5">
              <p className="text-xs font-bold truncate mb-0.5" style={{ color: "var(--text-primary)" }}>{place.name}</p>
              <p className="text-[10px] truncate mb-1.5" style={{ color: "var(--text-hint)" }}>{place.address}</p>
              {place.rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3" style={{ fill: "#F59E0B", color: "#F59E0B" }} />
                  <span className="text-[10px] font-bold" style={{ color: "var(--text-primary)" }}>{place.rating.toFixed(1)}</span>
                  {place.ratingCount && <span className="text-[10px]" style={{ color: "var(--text-hint)" }}>({place.ratingCount > 999 ? `${(place.ratingCount/1000).toFixed(1)}k` : place.ratingCount})</span>}
                </div>
              )}
              <p className="text-[10px] mt-1 capitalize truncate" style={{ color: "var(--accent-primary)" }}>{place.category}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}