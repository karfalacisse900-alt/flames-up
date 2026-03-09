import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, MapPin } from "lucide-react";

const POI_CATEGORIES = [
  { key: "fast_food", label: "🍔 Fast Food", query: "fast food" },
  { key: "park",      label: "🌳 Parks",     query: "park" },
  { key: "grocery",   label: "🛒 Grocery",   query: "supermarket grocery" },
  { key: "cafe",      label: "☕ Café",       query: "cafe coffee" },
  { key: "restaurant",label: "🍽️ Restaurant", query: "restaurant" },
  { key: "pharmacy",  label: "💊 Pharmacy",  query: "pharmacy" },
  { key: "gas",       label: "⛽ Gas",       query: "gas station" },
  { key: "gym",       label: "🏋️ Gym",       query: "gym fitness" },
];

export default function PlacesMapboxView({ posts = [], onOpenPlace }) {
  const mapRef    = useRef(null);
  const mapInst   = useRef(null);
  const markersRef= useRef([]);  // { marker, isPOI }

  const [token,         setToken]         = useState(null);
  const [userLoc,       setUserLoc]       = useState(null);
  const [mapReady,      setMapReady]      = useState(false);
  const [activeCategory,setActiveCategory]= useState(null);
  const [poiLoading,    setPoiLoading]    = useState(false);
  const [error,         setError]         = useState(null);

  // 1. Fetch mapbox token
  useEffect(() => {
    base44.functions.invoke("mapboxToken", {})
      .then(res => setToken(res.data?.token || res.data))
      .catch(() => setError("Could not load map token"));
  }, []);

  // 2. Get user geolocation (fallback: NYC)
  useEffect(() => {
    if (!navigator.geolocation) { setUserLoc([-74.006, 40.7128]); return; }
    navigator.geolocation.getCurrentPosition(
      pos => setUserLoc([pos.coords.longitude, pos.coords.latitude]),
      ()  => setUserLoc([-74.006, 40.7128])
    );
  }, []);

  // 3. Initialize Mapbox GL map once token + userLoc + DOM are ready
  useEffect(() => {
    if (!token || !userLoc || !mapRef.current) return;
    let destroyed = false;

    const init = async () => {
      // Load CSS once
      if (!document.getElementById("mapbox-gl-css")) {
        const link = document.createElement("link");
        link.id   = "mapbox-gl-css";
        link.rel  = "stylesheet";
        link.href = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css";
        document.head.appendChild(link);
      }

      // Load JS once
      if (!window.mapboxgl) {
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src     = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js";
          s.onload  = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }

      if (destroyed) return;

      const mbgl = window.mapboxgl;
      mbgl.accessToken = token;

      const map = new mbgl.Map({
        container: mapRef.current,
        style:     "mapbox://styles/mapbox/streets-v12",
        center:    userLoc,
        zoom:      14,
      });

      map.addControl(new mbgl.NavigationControl({ showCompass: false }), "bottom-right");
      map.addControl(
        new mbgl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true }),
        "bottom-right"
      );

      map.on("load", () => {
        if (destroyed) return;
        setMapReady(true);
        addCommunityMarkers(map, posts, onOpenPlace);
      });

      mapInst.current = map;
    };

    init().catch(() => setError("Map failed to load"));

    return () => {
      destroyed = true;
      if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, userLoc]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const addCommunityMarkers = (map, postList, openFn) => {
    postList.filter(p => p.location_lat && p.location_lng).forEach(p => {
      const el = document.createElement("div");
      el.style.cssText = [
        "width:30px;height:30px;",
        "background:linear-gradient(135deg,#2E6B4F,#4CAF7D);",
        "border-radius:50% 50% 50% 0;transform:rotate(-45deg);",
        "border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);cursor:pointer;"
      ].join("");

      const popup = new window.mapboxgl.Popup({ offset: 28, closeButton: false }).setHTML(`
        <div style="font-family:Inter,sans-serif;padding:4px 2px;min-width:160px">
          <strong style="color:#2E6B4F;font-size:13px">${p.location_name || p.location_city || "Place"}</strong>
          ${p.location_city ? `<p style="font-size:11px;color:#888;margin:2px 0">${p.location_city}</p>` : ""}
          <p style="font-size:12px;color:#444;margin:4px 0 6px">${(p.body || "").replace(/<[^>]*>/g, "").slice(0, 70)}${(p.body || "").length > 70 ? "…" : ""}</p>
          <button id="__fuplace_${p.id}" style="background:#2E6B4F;color:white;border:none;padding:6px 10px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;width:100%">View Location Hub →</button>
        </div>
      `);

      popup.on("open", () => {
        const btn = document.getElementById(`__fuplace_${p.id}`);
        if (btn) btn.onclick = () => openFn && openFn({
          name: p.location_name || p.location_city,
          city: p.location_city, region: p.location_region,
          lat: p.location_lat,   lng:  p.location_lng,
        });
      });

      const marker = new window.mapboxgl.Marker({ element: el })
        .setLngLat([p.location_lng, p.location_lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push({ marker, isPOI: false });
    });
  };

  const clearPOIMarkers = () => {
    markersRef.current = markersRef.current.filter(({ marker, isPOI }) => {
      if (isPOI) { marker.remove(); return false; }
      return true;
    });
  };

  const handleCategory = async (cat) => {
    if (!mapInst.current || !token) return;

    // Toggle off
    if (activeCategory === cat.key) {
      clearPOIMarkers();
      setActiveCategory(null);
      return;
    }

    clearPOIMarkers();
    setActiveCategory(cat.key);
    setPoiLoading(true);

    const { lng, lat } = mapInst.current.getCenter();
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(cat.query)}.json`
      + `?proximity=${lng},${lat}&types=poi&limit=15&access_token=${token}`;

    try {
      const res  = await fetch(url);
      const data = await res.json();

      (data.features || []).forEach(feature => {
        const [fLng, fLat] = feature.center;

        const el = document.createElement("div");
        el.style.cssText = [
          "width:30px;height:30px;",
          "background:#D98B62;",
          "border-radius:50%;border:2px solid white;",
          "box-shadow:0 2px 8px rgba(0,0,0,0.3);",
          "display:flex;align-items:center;justify-content:center;",
          "cursor:pointer;font-size:14px;"
        ].join("");
        el.textContent = cat.label.split(" ")[0];

        const popup = new window.mapboxgl.Popup({ offset: 18, closeButton: false }).setHTML(`
          <div style="font-family:Inter,sans-serif;padding:4px 2px">
            <strong style="font-size:13px;color:#1E1E1E">${feature.text}</strong>
            <p style="font-size:11px;color:#888;margin:2px 0">${(feature.place_name || "").split(",").slice(1, 3).join(",").trim()}</p>
          </div>
        `);

        const marker = new window.mapboxgl.Marker({ element: el })
          .setLngLat([fLng, fLat])
          .setPopup(popup)
          .addTo(mapInst.current);

        markersRef.current.push({ marker, isPOI: true });
      });
    } catch {}

    setPoiLoading(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (error) return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <MapPin className="w-10 h-10" style={{ color: "var(--text-hint)" }} />
      <p className="text-sm" style={{ color: "var(--text-hint)" }}>{error}</p>
    </div>
  );

  return (
    <div style={{ height: "100%", position: "relative" }}>

      {/* Category pills */}
      <div className="absolute top-3 left-0 right-0 z-10 px-3 flex gap-2 overflow-x-auto scrollbar-hide pb-1"
        style={{ pointerEvents: mapReady ? "auto" : "none" }}>
        {POI_CATEGORIES.map(cat => (
          <button key={cat.key}
            onClick={() => handleCategory(cat)}
            className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all"
            style={{
              backgroundColor: activeCategory === cat.key ? "#1E1E1E" : "rgba(250,250,248,0.95)",
              color:           activeCategory === cat.key ? "#fff"    : "var(--text-primary)",
              border:          `1.5px solid ${activeCategory === cat.key ? "#1E1E1E" : "var(--border-light)"}`,
              boxShadow:       "0 2px 8px rgba(0,0,0,0.12)",
              backdropFilter:  "blur(8px)",
            }}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Map canvas */}
      <div ref={mapRef} style={{ height: "100%", width: "100%" }} />

      {/* Initial loading overlay */}
      {!mapReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-20"
          style={{ backgroundColor: "var(--bg-app)" }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--accent-primary)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--text-hint)" }}>Loading map…</p>
        </div>
      )}

      {/* POI search spinner */}
      {poiLoading && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold"
          style={{ backgroundColor: "rgba(250,250,248,0.97)", border: "1px solid var(--border-light)", boxShadow: "0 2px 12px rgba(0,0,0,0.12)", backdropFilter: "blur(8px)" }}>
          <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "var(--accent-primary)" }} />
          Finding nearby places…
        </div>
      )}

      {/* Legend */}
      {mapReady && (
        <div className="absolute bottom-4 left-3 z-10 px-3 py-2 rounded-xl text-xs font-semibold"
          style={{ backgroundColor: "rgba(250,250,248,0.95)", border: "1px solid var(--border-light)", backdropFilter: "blur(8px)", color: "var(--text-secondary)" }}>
          🟢 Community posts · 🟠 Nearby places
        </div>
      )}
    </div>
  );
}