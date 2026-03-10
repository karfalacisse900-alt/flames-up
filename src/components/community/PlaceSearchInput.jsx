import React, { useState, useRef, useEffect } from "react";
import { MapPin, Search, X, Loader2 } from "lucide-react";

export default function PlaceSearchInput({ location, onLocation, placeholder = "Search a place…" }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setShowResults(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = (q) => {
    clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1`
        );
        const data = await res.json();
        setResults(data.slice(0, 5));
        setShowResults(true);
      } catch {}
      setLoading(false);
    }, 400);
  };

  const selectResult = (r) => {
    const addr = r.address || {};
    const name = r.name || r.display_name.split(",")[0].trim();
    onLocation({
      name,
      city: addr.city || addr.town || addr.village || addr.county || "",
      region: addr.state || "",
      country: addr.country_code?.toUpperCase() || "",
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      display: r.display_name,
    });
    setQuery(name);
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
            const name = r.name || r.display_name.split(",")[0].trim();
            const sub = r.display_name.split(",").slice(1, 3).join(",").trim();
            return (
              <button key={i} type="button" onClick={() => selectResult(r)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[var(--bg-subtle)] transition-colors">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--accent-primary)" }} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{name}</p>
                  <p className="text-xs truncate" style={{ color: "var(--text-hint)" }}>{sub}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}