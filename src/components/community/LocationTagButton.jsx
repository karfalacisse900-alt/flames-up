import React, { useState } from "react";
import { MapPin, X, Loader2 } from "lucide-react";

export default function LocationTagButton({ location, onLocation }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTag = () => {
    if (location) { onLocation(null); return; }
    if (!navigator.geolocation) { setError("Geolocation not supported"); return; }
    setLoading(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          const addr = data.address || {};
          onLocation({
            city: addr.city || addr.town || addr.village || addr.county || "",
            region: addr.state || "",
            country: addr.country_code?.toUpperCase() || "",
            lat: latitude,
            lng: longitude,
          });
        } catch {
          setError("Could not get location name");
        }
        setLoading(false);
      },
      () => { setError("Permission denied"); setLoading(false); }
    );
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleTag}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border transition-all"
        style={{
          backgroundColor: location ? "var(--accent-primary-light)" : "var(--bg-subtle)",
          borderColor: location ? "var(--accent-primary)" : "var(--border-light)",
          color: location ? "var(--accent-primary)" : "var(--text-secondary)",
        }}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
        {location
          ? <span className="font-medium">{[location.city, location.region].filter(Boolean).join(", ")}</span>
          : <span>Tag location</span>
        }
        {location && <X className="w-3.5 h-3.5 ml-0.5" />}
      </button>
      {error && <p className="text-[11px] mt-1" style={{ color: "#E05C7A" }}>{error}</p>}
    </div>
  );
}