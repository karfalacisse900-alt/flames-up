import { useState, useEffect } from "react";

/**
 * Detects user GPS location and reverse-geocodes to city/region/country.
 * Uses the free Nominatim (OpenStreetMap) API — no API key required.
 */
export function useLocationDetection({ autoDetect = true } = {}) {
  const [coords, setCoords] = useState(null);       // { lat, lng }
  const [locationInfo, setLocationInfo] = useState(null); // { city, region, country, country_code }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permission, setPermission] = useState(null); // 'granted' | 'denied' | null

  const detect = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }
    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCoords({ lat, lng });
        setPermission("granted");
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const addr = data.address || {};
          setLocationInfo({
            city:
              addr.city ||
              addr.town ||
              addr.village ||
              addr.municipality ||
              addr.suburb ||
              "",
            region: addr.state || addr.county || "",
            country: addr.country || "",
            country_code: (addr.country_code || "").toUpperCase(),
          });
        } catch {
          // coords stored even if geocoding fails
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError(err.message);
        setPermission("denied");
        setLoading(false);
      },
      { timeout: 10000, maximumAge: 300000 }
    );
  };

  useEffect(() => {
    if (autoDetect) detect();
  }, []);

  return { coords, locationInfo, loading, error, permission, detect };
}

/**
 * Haversine distance in km between two lat/lng points.
 */
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}