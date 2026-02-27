import React, { useState } from "react";
import { MapPin, Navigation, Search, ExternalLink, Loader2, AlertCircle, RefreshCw, Compass } from "lucide-react";

const SERVICE_CATEGORIES = [
  { key: "laundromat", label: "Laundromat", emoji: "👕", color: "#3B82F6", bg: "#EFF6FF" },
  { key: "fast food", label: "Fast Food", emoji: "🍔", color: "#EF4444", bg: "#FEF2F2" },
  { key: "grocery store", label: "Grocery", emoji: "🛒", color: "#10B981", bg: "#ECFDF5" },
  { key: "pharmacy", label: "Pharmacy", emoji: "💊", color: "#F59E0B", bg: "#FFFBEB" },
  { key: "gas station", label: "Gas Station", emoji: "⛽", color: "#6366F1", bg: "#EEF2FF" },
  { key: "bank ATM", label: "ATM / Bank", emoji: "🏦", color: "#14B8A6", bg: "#F0FDFA" },
  { key: "coffee shop", label: "Coffee", emoji: "☕", color: "#92400E", bg: "#FEF3C7" },
  { key: "hair salon", label: "Hair Salon", emoji: "✂️", color: "#EC4899", bg: "#FDF2F8" },
  { key: "gym fitness", label: "Gym", emoji: "🏋️", color: "#7C3AED", bg: "#F5F3FF" },
  { key: "urgent care clinic", label: "Urgent Care", emoji: "🏥", color: "#EF4444", bg: "#FEF2F2" },
  { key: "restaurant", label: "Restaurant", emoji: "🍽️", color: "#F97316", bg: "#FFF7ED" },
  { key: "park", label: "Park", emoji: "🌳", color: "#22C55E", bg: "#F0FDF4" },
  { key: "library", label: "Library", emoji: "📚", color: "#8B5CF6", bg: "#F5F3FF" },
  { key: "post office", label: "Post Office", emoji: "📮", color: "#3B82F6", bg: "#EFF6FF" },
];

function openInGoogleMaps(query, lat, lng) {
  const encoded = encodeURIComponent(query);
  if (lat && lng) {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}&near=${lat},${lng}`, "_blank");
  } else {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query + " near me")}`, "_blank");
  }
}

const LOC_KEY = "local_services_location";

export default function LocalServices() {
  const [location, setLocation] = useState(() => {
    try { const s = localStorage.getItem(LOC_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [locationError, setLocationError] = useState("");
  const [locating, setLocating] = useState(false);
  const [customSearch, setCustomSearch] = useState("");

  const requestLocation = () => {
    if (!navigator.geolocation) { setLocationError("Geolocation not supported."); return; }
    setLocating(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        let city = "";
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const data = await res.json();
          city = data.address?.city || data.address?.town || data.address?.village || data.address?.suburb || "";
        } catch (_) {}
        const loc = { lat, lng, city };
        setLocation(loc);
        localStorage.setItem(LOC_KEY, JSON.stringify(loc));
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === 1) setLocationError("Location denied. Enable location in browser settings.");
        else setLocationError("Could not get location. Try again.");
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const clearLocation = () => { setLocation(null); localStorage.removeItem(LOC_KEY); setLocationError(""); };

  if (!location) {
    return (
      <div className="px-4 pb-6">
        <div className="rounded-3xl overflow-hidden" style={{ background: "linear-gradient(135deg, #667EEA, #764BA2)", boxShadow: "0 8px 32px rgba(102,126,234,0.3)" }}>
          <div className="p-6 relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-20" style={{ background: "radial-gradient(circle, white, transparent)" }} />
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
              <Compass className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white text-center mb-2">Find Services Near You</h3>
            <p className="text-white/70 text-sm text-center leading-relaxed mb-5">
              Discover nearby laundromats, restaurants, gyms, pharmacies and more — opened in Google Maps instantly.
            </p>
            {locationError && (
              <div className="flex items-center gap-2 mb-4 p-3 rounded-2xl text-left" style={{ backgroundColor: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)" }}>
                <AlertCircle className="w-4 h-4 shrink-0 text-red-300" />
                <p className="text-xs text-red-200">{locationError}</p>
              </div>
            )}
            <button onClick={requestLocation} disabled={locating}
              className="flex items-center gap-2 mx-auto px-6 py-3 rounded-2xl text-sm font-bold text-purple-700 disabled:opacity-60 shadow-lg"
              style={{ backgroundColor: "#fff" }}>
              {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
              {locating ? "Getting location…" : "Share My Location"}
            </button>
            <p className="text-white/40 text-[10px] text-center mt-3">Location is never stored on servers</p>
          </div>
        </div>

        {/* Can still browse without location */}
        <div className="mt-4">
          <p className="text-xs font-bold mb-3" style={{ color: "#64748B" }}>Or browse without location:</p>
          <div className="grid grid-cols-3 gap-2">
            {SERVICE_CATEGORIES.slice(0, 9).map(cat => (
              <button key={cat.key} onClick={() => openInGoogleMaps(cat.key, null, null)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all active:scale-95"
                style={{ backgroundColor: cat.bg, border: `1px solid ${cat.color}30` }}>
                <span className="text-2xl">{cat.emoji}</span>
                <span className="text-[11px] font-semibold text-center leading-tight" style={{ color: cat.color }}>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-6 space-y-4">
      {/* Location pill */}
      <div className="flex items-center justify-between px-4 py-3 rounded-2xl" style={{ background: "linear-gradient(135deg, #ECFDF5, #D1FAE5)", border: "1px solid #A7F3D0" }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#22C55E" }}>
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold" style={{ color: "#166534" }}>
              {location.city ? `📍 Near ${location.city}` : "📍 Location Shared"}
            </p>
            <p className="text-[10px]" style={{ color: "#4ADE80" }}>Tap any category to open Maps</p>
          </div>
        </div>
        <button onClick={clearLocation} className="p-2 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.6)" }} title="Change location">
          <RefreshCw className="w-3.5 h-3.5" style={{ color: "#16A34A" }} />
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#94A3B8" }} />
          <input
            placeholder="Search any local service..."
            value={customSearch}
            onChange={e => setCustomSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && customSearch.trim() && openInGoogleMaps(customSearch.trim(), location.lat, location.lng)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ backgroundColor: "#fff", border: "1px solid #E2E8F0", color: "#1E293B", fontSize: "16px" }}
          />
        </div>
        <button onClick={() => customSearch.trim() && openInGoogleMaps(customSearch.trim(), location.lat, location.lng)}
          disabled={!customSearch.trim()}
          className="px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, #667EEA, #764BA2)" }}>
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>

      {/* Category grid */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "#94A3B8" }}>Browse by category</p>
        <div className="grid grid-cols-3 gap-2.5">
          {SERVICE_CATEGORIES.map(cat => (
            <button key={cat.key} onClick={() => openInGoogleMaps(cat.key, location.lat, location.lng)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all active:scale-95 group"
              style={{ backgroundColor: cat.bg, border: `1.5px solid ${cat.color}30`, boxShadow: `0 2px 8px ${cat.color}10` }}>
              <span className="text-2xl group-active:scale-110 transition-transform">{cat.emoji}</span>
              <span className="text-[11px] font-bold text-center leading-tight" style={{ color: cat.color }}>{cat.label}</span>
              <span className="text-[9px] flex items-center gap-0.5 font-semibold" style={{ color: cat.color + "80" }}>
                <ExternalLink className="w-2.5 h-2.5" /> Maps
              </span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-center" style={{ color: "#CBD5E1" }}>
        Opens Google Maps · Your location is only used locally
      </p>
    </div>
  );
}