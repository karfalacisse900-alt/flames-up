import React, { useState, useRef, useEffect } from "react";
import { MapPin, X, Loader2 } from "lucide-react";
import { useLocationSearch } from "@/components/hooks/useLocationSearch";

export default function PlaceSearchInput({ location, onLocation, placeholder = "Search a place…" }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef(null);
  const { search, cancelSearch } = useLocationSearch();

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setShowResults(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (q) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    search(q, (features) => {
      setResults(features);
      setShowResults(true);
      setLoading(false);
    });
  };

  const selectResult = (f) => {
    const [lng, lat] = f.center;
    const cityCtx = f.context?.find(c => c.id.startsWith("place.") || c.id.startsWith("locality."));
    const regionCtx = f.context?.find(c => c.id.startsWith("region."));
    const countryCtx = f.context?.find(c => c.id.startsWith("country."));
    onLocation({
      name: f.text || f.place_name.split(",")[0].trim(),
      city: cityCtx?.text || "",
      region: regionCtx?.text || "",
      country: countryCtx?.short_code?.toUpperCase() || "",
      lat,
      lng,
      display: f.place_name,
    });
    setQuery(f.text || f.place_name.split(",")[0].trim());
    setShowResults(false);
    setResults([]);
  };

  const clear = () => {
    cancelSearch();
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
          onChange={e => { if (location) return; setQuery(e.target.value); handleSearch(e.target.value); }}
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
          {results.map((f, i) => (
            <button key={f.id || i} type="button" onClick={() => selectResult(f)}
              className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[var(--bg-subtle)] transition-colors"
              style={{ borderBottom: i < results.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
              <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--accent-primary)" }} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{f.text}</p>
                <p className="text-xs truncate" style={{ color: "var(--text-hint)" }}>{f.place_name}</p>
              </div>
              {f._distanceLabel && (
                <span className="text-xs shrink-0 font-medium" style={{ color: "var(--accent-primary)" }}>
                  📍 {f._distanceLabel}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}