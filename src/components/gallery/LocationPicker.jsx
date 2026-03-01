import React, { useState, useRef, useEffect } from "react";
import { MapPin, X, Loader2 } from "lucide-react";

/**
 * LocationPicker — uses Mapbox geocoding (same key already in the app)
 * Falls back to manual text entry if geocoding fails.
 */
export default function LocationPicker({ value, onChange }) {
  const [query, setQuery] = useState(value?.name || "");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);

  const search = (q) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q || q.length < 2) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        // Use Mapbox geocoding (token already used in other components)
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw&autocomplete=true&limit=5`
        );
        const data = await res.json();
        setSuggestions(data.features || []);
        setOpen(true);
      } catch {
        setSuggestions([]);
      }
      setLoading(false);
    }, 380);
  };

  const pick = (feature) => {
    const name = feature.place_name;
    const [lng, lat] = feature.center;
    setQuery(name);
    setSuggestions([]);
    setOpen(false);
    onChange({ name, lat, lng });
  };

  const clear = () => {
    setQuery("");
    setSuggestions([]);
    onChange(null);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
        style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
        <MapPin className="w-4 h-4 shrink-0" style={{ color: "var(--accent-primary)" }} />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); search(e.target.value); }}
          placeholder="Add location…"
          className="flex-1 text-sm bg-transparent outline-none"
          style={{ color: "var(--text-primary)" }}
        />
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" style={{ color: "var(--text-hint)" }} />}
        {value && !loading && (
          <button onClick={clear} className="shrink-0">
            <X className="w-3.5 h-3.5" style={{ color: "var(--text-hint)" }} />
          </button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl overflow-hidden shadow-lg"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          {suggestions.map(f => (
            <button key={f.id} onClick={() => pick(f)}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--bg-subtle)] transition-colors flex items-start gap-2"
              style={{ color: "var(--text-primary)", borderBottom: "1px solid var(--border-subtle)" }}>
              <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "var(--accent-primary)" }} />
              <span className="line-clamp-2">{f.place_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}