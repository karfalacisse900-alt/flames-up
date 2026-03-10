import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

// Haversine distance in miles
function distanceMiles(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(miles) {
  if (miles < 0.1) return "nearby";
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

export function useLocationSearch() {
  const [userCoords, setUserCoords] = useState(null); // { lat, lng }
  const [mapboxToken, setMapboxToken] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    // Fetch Mapbox token
    base44.functions.invoke("mapboxToken", {}).then(res => {
      if (res.data?.token) setMapboxToken(res.data.token);
    }).catch(() => {});

    // Request GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {} // silently fail
      );
    }
  }, []);

  const search = (query, callback, { limit = 6 } = {}) => {
    clearTimeout(debounceRef.current);
    if (!query.trim() || !mapboxToken) return;

    debounceRef.current = setTimeout(async () => {
      try {
        let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&types=place,poi,address,locality&limit=${limit}&autocomplete=true`;

        if (userCoords) {
          url += `&proximity=${userCoords.lng},${userCoords.lat}`;
          // Add country bias if we can detect it (best effort via coords)
        }

        const res = await fetch(url);
        const data = await res.json();
        const features = (data.features || []).map(f => {
          const [lng, lat] = f.center;
          const distance = userCoords ? distanceMiles(userCoords.lat, userCoords.lng, lat, lng) : null;
          return { ...f, _distance: distance, _distanceLabel: distance !== null ? formatDistance(distance) : null };
        });
        callback(features);
      } catch {
        callback([]);
      }
    }, 350);
  };

  const cancelSearch = () => clearTimeout(debounceRef.current);

  return { userCoords, mapboxToken, search, cancelSearch };
}