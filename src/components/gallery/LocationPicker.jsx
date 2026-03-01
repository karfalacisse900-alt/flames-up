import React, { useState, useRef } from "react";
import { MapPin, X, Loader2 } from "lucide-react";

/**
 * LocationPicker — uses OpenStreetMap Nominatim for geocoding (no API key needed).
 * Stores { name, lat, lng } on selection.
 */
export default function LocationPicker({ value, onChange }) {
  const [query, setQuery] = useState(value?.name || "");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);

  const search = (q) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q || q.length < 2) { setSuggestions([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&addressdetails=1`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        setSuggestions(data || []);
        setOpen(true);
      } catch {
        setSuggestions([]);
      }
      setLoading(false);
    }, 420);
  };

  const pick = (item) => {
    const name = item.display_name;
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    setQuery(name.split(",").slice(0, 3).join(","));
    setSuggestions([]);
    setOpen(false);
    onChange({ name, lat, lng });
  };

  const clear = () => {
    setQuery("");
    setSuggestions([]);
    setOpen(false);
    onChange(null);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
        style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
        <MapPin className="w-4 h-4 shrink-0" style={{ color: "#4285F4" }} />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); search(e.target.value); }}
          placeholder="Add location (Google Maps)…"
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
          {suggestions.map((item, i) => {
            const parts = item.display_name.split(",");
            const primary = parts.slice(0, 2).join(",").trim();
            const secondary = parts.slice(2, 4).join(",").trim();
            return (
              <button key={i} onClick={() => pick(item)}
                className="w-full text-left px-4 py-2.5 text-sm transition-colors flex items-start gap-2"
                style={{ color: "var(--text-primary)", borderBottom: "1px solid var(--border-subtle)", backgroundColor: "transparent" }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-subtle)"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#4285F4" }} />
                <div className="min-w-0">
                  <p className="font-medium truncate">{primary}</p>
                  {secondary && <p className="text-xs truncate" style={{ color: "var(--text-hint)" }}>{secondary}</p>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}