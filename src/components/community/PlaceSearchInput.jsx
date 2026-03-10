import React, { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, X, Loader2, Navigation } from "lucide-react";
import { base44 } from "@/api/base44Client";

function haversineMiles(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDist(miles) {
  if (miles < 0.1) return "< 0.1 mi";
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

export default function PlaceSearchInput({ location, onLocation, placeholder = "Search a place…" }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [mapboxToken, setMapboxToken] = useState(null);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  // Request GPS on mount
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {} // silently fail
    );
  }, []);

  // Fetch Mapbox token once
  useEffect(() => {
    base44.functions.invoke("mapboxToken", {})
      .then(res => { if (res.data?.token) setMapboxToken(res.data.token); })
      .catch(() => {});
  }, []);

  // Click outside to close
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setShowResults(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = useCallback((q) => {
    clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        let url;
        if (mapboxToken) {
          const params = new URLSearchParams({
            access_token: mapboxToken,
            autocomplete: "true",
            limit: "6",
            types: "place,poi,address,locality",
          });
          if (userCoords) {
            params.set("proximity", `${userCoords.lng},${userCoords.lat}`);
            // detect country from coords — use country bias if US (rough bbox check)
            const isUS = userCoords.lat >= 24 && userCoords.lat <= 50 && userCoords.lng >= -125 && userCoords.lng <= -66;
            if (isUS) params.set("country", "us");
          }
          url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?${params}`;
          const res = await fetch(url);
          const data = await res.json();
          const features = data.features || [];
          const mapped = features.map(f => {
            const [lng, lat] = f.center;
            const dist = userCoords ? haversineMiles(userCoords.lat, userCoords.lng, lat, lng) : null;
            const context = f.context || [];
            const city = context.find(c => c.id.startsWith("place"))?.text || "";
            const region = context.find(c => c.id.startsWith("region"))?.text || "";
            const country = context.find(c => c.id.startsWith("country"))?.short_code?.toUpperCase() || "";
            return { name: f.text, display: f.place_name, city, region, country, lat, lng, dist };
          });
          // Sort by distance if available, otherwise keep Mapbox order
          if (userCoords) mapped.sort((a, b) => (a.dist ?? 999) - (b.dist ?? 999));
          setResults(mapped);
        } else {
          // Fallback: Nominatim
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1`
          );
          const data = await res.json();
          const mapped = data.map(r => {
            const addr = r.address || {};
            const lat = parseFloat(r.lat), lng = parseFloat(r.lon);
            const dist = userCoords ? haversineMiles(userCoords.lat, userCoords.lng, lat, lng) : null;
            return {
              name: r.name || r.display_name.split(",")[0].trim(),
              display: r.display_name,
              city: addr.city || addr.town || addr.village || addr.county || "",
              region: addr.state || "",
              country: addr.country_code?.toUpperCase() || "",
              lat, lng, dist,
            };
          });
          if (userCoords) mapped.sort((a, b) => (a.dist ?? 999) - (b.dist ?? 999));
          setResults(mapped);
        }
        setShowResults(true);
      } catch {}
      setLoading(false);
    }, 350);
  }, [mapboxToken, userCoords]);

  const selectResult = (r) => {
    onLocation({ name: r.name, city: r.city, region: r.region, country: r.country, lat: r.lat, lng: r.lng, display: r.display });
    setQuery(r.name);
    setShowResults(false);
    setResults([]);
  };

  const clear = () => {
    onLocation(null);
    setQuery("");
    setResults([]);
    setShowResults(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all"
        style={{
          backgroundColor: location ? "var(--accent-primary-light)" : "var(--bg-subtle)",
          borderColor: location ? "var(--accent-primary)" : "var(--border-light)",
        }}>
        {loading
          ? <Loader2 className="w-4 h-4 shrink-0 animate-spin" style={{ color: "var(--accent-primary)" }} />
          : <MapPin className="w-4 h-4 shrink-0" style={{ color: location ? "var(--accent-primary)" : "var(--text-hint)" }} />
        }
        <input
          value={location ? (location.name || location.city || "") : query}
          onChange={e => { if (location) return; setQuery(e.target.value); search(e.target.value); }}
          onFocus={() => { if (!location && results.length > 0) setShowResults(true); }}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-sm"
          style={{
            color: location ? "var(--accent-primary)" : "var(--text-primary)",
            fontWeight: location ? 600 : 400,
          }}
          readOnly={!!location}
        />
        {userCoords && !location && (
          <Navigation className="w-3 h-3 shrink-0" style={{ color: "var(--accent-primary)", opacity: 0.7 }} title="Using your location" />
        )}
        {(location || query) && (
          <button type="button" onClick={clear} className="shrink-0">
            <X className="w-3.5 h-3.5" style={{ color: "var(--text-hint)" }} />
          </button>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-2xl overflow-hidden z-50 shadow-xl"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          {results.map((r, i) => {
            const sub = [r.city, r.region, r.country].filter(Boolean).join(", ");
            return (
              <button key={i} type="button" onClick={() => selectResult(r)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors"
                style={{ borderBottom: i < results.length - 1 ? "1px solid var(--border-subtle)" : "none" }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-subtle)"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--accent-primary)" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{r.name}</p>
                  {sub && <p className="text-xs truncate" style={{ color: "var(--text-hint)" }}>{sub}</p>}
                </div>
                {r.dist != null && (
                  <span className="text-[11px] font-semibold shrink-0 mt-0.5" style={{ color: "var(--accent-primary)" }}>
                    📍 {formatDist(r.dist)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}