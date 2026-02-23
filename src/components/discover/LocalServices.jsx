import React, { useState, useEffect } from "react";
import { MapPin, Navigation, Search, ExternalLink, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";

const SERVICE_CATEGORIES = [
  { key: "laundromat", label: "Laundromat", emoji: "👕" },
  { key: "fast food", label: "Fast Food", emoji: "🍔" },
  { key: "grocery store", label: "Grocery", emoji: "🛒" },
  { key: "pharmacy", label: "Pharmacy", emoji: "💊" },
  { key: "gas station", label: "Gas Station", emoji: "⛽" },
  { key: "bank ATM", label: "ATM / Bank", emoji: "🏦" },
  { key: "coffee shop", label: "Coffee", emoji: "☕" },
  { key: "hair salon", label: "Hair Salon", emoji: "✂️" },
  { key: "gym fitness", label: "Gym", emoji: "🏋️" },
  { key: "urgent care clinic", label: "Urgent Care", emoji: "🏥" },
  { key: "restaurant", label: "Restaurant", emoji: "🍽️" },
  { key: "park", label: "Park", emoji: "🌳" },
  { key: "library", label: "Library", emoji: "📚" },
  { key: "post office", label: "Post Office", emoji: "📮" },
];

function openInGoogleMaps(query, lat, lng) {
  if (lat && lng) {
    // Use the maps search API with coordinates so it opens centered on the user
    const encoded = encodeURIComponent(query);
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encoded}&near=${lat},${lng}`,
      "_blank"
    );
  } else {
    const encoded = encodeURIComponent(`${query} near me`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, "_blank");
  }
}

const LOC_KEY = "local_services_location";

export default function LocalServices() {
  const [location, setLocation] = useState(() => {
    try {
      const saved = localStorage.getItem(LOC_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [locationError, setLocationError] = useState("");
  const [locating, setLocating] = useState(false);
  const [customSearch, setCustomSearch] = useState("");

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
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
        if (err.code === 1) setLocationError("Location access denied. Please enable location in your browser settings, then try again.");
        else setLocationError("Could not get your location. Please try again.");
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const clearLocation = () => {
    setLocation(null);
    localStorage.removeItem(LOC_KEY);
    setLocationError("");
  };

  const handleCategoryClick = (cat) => {
    openInGoogleMaps(cat.key, location?.lat, location?.lng);
  };

  const handleCustomSearch = () => {
    if (!customSearch.trim()) return;
    openInGoogleMaps(customSearch.trim(), location?.lat, location?.lng);
  };

  // No location yet
  if (!location) {
    return (
      <div className="px-5 pb-6">
        <div className="rounded-2xl p-5 text-center" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{ backgroundColor: "var(--accent-primary-light)" }}>
            <MapPin className="w-7 h-7" style={{ color: "var(--accent-primary)" }} />
          </div>
          <h3 className="text-base font-semibold mb-1" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
            Find Services Near You
          </h3>
          <p className="text-xs mb-4 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Allow location access to discover nearby laundromats, grocery stores, restaurants, and more — opened directly in Google Maps.
          </p>
          {locationError && (
            <div className="flex items-center gap-2 mb-3 p-2.5 rounded-xl text-left" style={{ backgroundColor: "#FEE2E2", border: "1px solid #FECACA" }}>
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <p className="text-xs text-red-700">{locationError}</p>
            </div>
          )}
          <button
            onClick={requestLocation}
            disabled={locating}
            className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: "var(--accent-primary)" }}
          >
            {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
            {locating ? "Getting location…" : "Share My Location"}
          </button>
          <p className="text-[10px] mt-3" style={{ color: "var(--text-hint)" }}>
            Your location is never stored — only used to open Google Maps searches.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pb-6 space-y-4">
      {/* Location banner */}
      <div className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ backgroundColor: "var(--accent-primary-light)", border: "1px solid rgba(60,110,90,0.2)" }}>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
          <p className="text-xs font-medium" style={{ color: "var(--accent-primary)" }}>
            {location.city ? `Near ${location.city}` : `📍 ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
          </p>
        </div>
        <button onClick={() => { setLocation(null); setLocationError(""); }} className="p-1.5 rounded-full"
          style={{ backgroundColor: "rgba(60,110,90,0.12)" }}>
          <RefreshCw className="w-3 h-3" style={{ color: "var(--accent-primary)" }} />
        </button>
      </div>

      {/* Custom search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-hint)" }} />
          <Input
            placeholder="Search any local service..."
            value={customSearch}
            onChange={e => setCustomSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleCustomSearch()}
            className="pl-10 rounded-xl text-sm"
          />
        </div>
        <button
          onClick={handleCustomSearch}
          disabled={!customSearch.trim()}
          className="px-3 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40"
          style={{ backgroundColor: "var(--accent-primary)" }}
        >
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>

      {/* Category grid */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--text-hint)" }}>
          Browse by category
        </p>
        <div className="grid grid-cols-3 gap-2.5">
          {SERVICE_CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => handleCategoryClick(cat)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all active:scale-95"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-light)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}
            >
              <span className="text-2xl">{cat.emoji}</span>
              <span className="text-[11px] font-medium text-center leading-tight" style={{ color: "var(--text-primary)" }}>
                {cat.label}
              </span>
              <span className="text-[9px] flex items-center gap-0.5" style={{ color: "var(--accent-primary)" }}>
                <ExternalLink className="w-2.5 h-2.5" /> Maps
              </span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-center" style={{ color: "var(--text-hint)" }}>
        Tapping a category opens Google Maps with results near your location.
      </p>
    </div>
  );
}