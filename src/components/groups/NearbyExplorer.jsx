import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, Navigation, X, MapPin } from "lucide-react";

const CATEGORY_GRADIENTS = {
  fitness: ["#0d9488", "#16a34a"],
  food: ["#ea580c", "#d97706"],
  travel: ["#0284c7", "#6d28d9"],
  yoga: ["#d97706", "#b45309"],
  running: ["#0284c7", "#0369a1"],
  dance: ["#7c3aed", "#a21caf"],
  music: ["#db2777", "#be185d"],
  gaming: ["#16a34a", "#15803d"],
  online: ["#7c3aed", "#4338ca"],
  sports: ["#ea580c", "#dc2626"],
  wellness: ["#0d9488", "#16a34a"],
  general: ["#64748b", "#475569"],
};

const CATEGORY_EMOJIS = {
  fitness: "💪",
  yoga: "🧘",
  running: "🏃",
  dance: "💃",
  wellness: "🌿",
  music: "🎵",
  online: "🌐",
  sports: "⚽",
};

const CATEGORY_TABS = [
  { key: "all", label: "All", emoji: "✨" },
  { key: "fitness", label: "Fitness", emoji: "💪" },
  { key: "yoga", label: "Yoga", emoji: "🧘" },
  { key: "running", label: "Running", emoji: "🏃" },
  { key: "dance", label: "Dance", emoji: "💃" },
  { key: "wellness", label: "Wellness", emoji: "🌿" },
];

const RADIUS_OPTIONS = [5, 10, 25, 50, 100];

function haversineMiles([lng1, lat1], [lng2, lat2]) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getGrad(category) {
  const [a, b] = CATEGORY_GRADIENTS[category] || CATEGORY_GRADIENTS.general;
  return `linear-gradient(135deg, ${a}, ${b})`;
}

export default function NearbyExplorer({ groups, membershipMap, onOpen, onJoin }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);

  const [token, setToken] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [catFilter, setCatFilter] = useState("all");
  const [radiusMiles, setRadiusMiles] = useState(25);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const setSelectedGroupRef = useRef(setSelectedGroup);
  useEffect(() => { setSelectedGroupRef.current = setSelectedGroup; }, []);

  const realWorldGroups = useMemo(() =>
    groups
      .filter(g => g.group_type === "realworld" && g.location_lat && g.location_lng)
      .filter(g => catFilter === "all" || g.category === catFilter)
      .filter(g => {
        if (!userLocation) return true;
        return haversineMiles(userLocation, [g.location_lng, g.location_lat]) <= radiusMiles;
      }),
    [groups, catFilter, userLocation, radiusMiles]);

  const initMap = useCallback((accessToken, center = [-98.5795, 39.8283], zoom = 4) => {
    if (!mapContainer.current || mapRef.current) return;
    window.mapboxgl.accessToken = accessToken;
    const m = new window.mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center, zoom,
      attributionControl: false,
    });
    m.addControl(new window.mapboxgl.AttributionControl({ compact: true }), "bottom-left");
    m.on("load", () => setMapLoaded(true));
    mapRef.current = m;
  }, []);

  const loadMapbox = useCallback((accessToken, center, zoom) => {
    if (window.mapboxgl) { initMap(accessToken, center, zoom); return; }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://api.mapbox.com/mapbox-gl-js/v3.2.0/mapbox-gl.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://api.mapbox.com/mapbox-gl-js/v3.2.0/mapbox-gl.js";
    script.onload = () => initMap(accessToken, center, zoom);
    document.head.appendChild(script);
  }, [initMap]);

  useEffect(() => {
    // Fetch mapbox token from backend
    fetch("/api/mapboxToken")
      .then(r => r.json())
      .then(d => { if (d.token) setToken(d.token); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (token) loadMapbox(token);
  }, [token, loadMapbox]);

  const requestLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      const { longitude, latitude } = pos.coords;
      setUserLocation([longitude, latitude]);
      if (mapRef.current) {
        mapRef.current.flyTo({ center: [longitude, latitude], zoom: 11, duration: 1400 });
        if (userMarkerRef.current) userMarkerRef.current.remove();
        const el = document.createElement("div");
        el.style.cssText = "width:14px;height:14px;border-radius:50%;background:#2E6B4F;border:3px solid white;box-shadow:0 0 0 5px rgba(46,107,79,0.22),0 2px 8px rgba(0,0,0,0.3);pointer-events:none;";
        userMarkerRef.current = new window.mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat([longitude, latitude]).addTo(mapRef.current);
      }
    }, () => {});
  };

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    realWorldGroups.forEach(group => {
      const [a] = CATEGORY_GRADIENTS[group.category] || CATEGORY_GRADIENTS.general;
      const emoji = CATEGORY_EMOJIS[group.category] || "💬";
      const isMember = !!membershipMap[group.id];

      const el = document.createElement("div");
      el.style.cssText = "display:flex;flex-direction:column;align-items:center;cursor:pointer;";
      el.innerHTML = `
        <div style="background:${getGrad(group.category)};border:2.5px solid ${isMember ? "#fff" : "#DCCBB8"};border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 4px 14px rgba(0,0,0,0.3);">${emoji}</div>
        <div style="background:${a};color:white;border-radius:20px;padding:1px 7px;font-size:9px;font-weight:800;margin-top:3px;white-space:nowrap;max-width:90px;overflow:hidden;text-overflow:ellipsis;box-shadow:0 1px 4px rgba(0,0,0,0.18);">${group.name}</div>
      `;

      el.addEventListener("mousedown", e => { e.stopPropagation(); });
      el.addEventListener("click", e => {
        e.stopPropagation();
        e.preventDefault();
        setSelectedGroupRef.current(group);
      });
      el.addEventListener("touchend", e => {
        e.stopPropagation();
        e.preventDefault();
        setSelectedGroupRef.current(group);
      });

      const marker = new window.mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([group.location_lng, group.location_lat])
        .addTo(mapRef.current);
      markersRef.current.push(marker);
    });

    if (realWorldGroups.length > 0 && !userLocation) {
      const bounds = new window.mapboxgl.LngLatBounds();
      realWorldGroups.forEach(g => bounds.extend([g.location_lng, g.location_lat]));
      mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 12, duration: 800 });
    }
  }, [mapLoaded, realWorldGroups, membershipMap]);

  return (
    <div className="pb-6">
      {/* Top bar */}
      <div className="px-4 py-3 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold" style={{ color: "var(--text-hint)" }}>
          {realWorldGroups.length === 0 ? "No real-world groups on map" : `${realWorldGroups.length} group${realWorldGroups.length !== 1 ? "s" : ""} on map`}
        </p>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters(v => !v)}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full"
            style={{
              backgroundColor: showFilters ? "var(--accent-primary)" : "var(--bg-card)",
              color: showFilters ? "#fff" : "var(--text-secondary)",
              border: "1px solid var(--border-light)",
            }}>
            <Filter className="w-3 h-3" /> Filters {catFilter !== "all" ? `· ${catFilter}` : ""}
          </button>
          {!userLocation ? (
            <button onClick={requestLocation}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full"
              style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
              <Navigation className="w-3 h-3" /> Near me
            </button>
          ) : (
            <span className="text-xs font-semibold flex items-center gap-1" style={{ color: "var(--accent-primary)" }}>
              <Navigation className="w-3 h-3" /> Active
            </span>
          )}
        </div>
      </div>

      {/* Filter panels */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}>
            <div className="px-4 pb-3">
              <div className="p-3 rounded-2xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>📍 Radius</p>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: userLocation ? "var(--accent-primary-light)" : "var(--bg-subtle)", color: userLocation ? "var(--accent-primary)" : "var(--text-hint)" }}>
                    {radiusMiles} mi {!userLocation && "· enable location first"}
                  </span>
                </div>
                <input
                  type="range"
                  min={5} max={100} step={5}
                  value={radiusMiles}
                  onChange={e => setRadiusMiles(Number(e.target.value))}
                  disabled={!userLocation}
                  className="w-full"
                  style={{ accentColor: "var(--accent-primary)", opacity: userLocation ? 1 : 0.4 }}
                />
                <div className="flex justify-between mt-1">
                  {RADIUS_OPTIONS.map(r => (
                    <button key={r} onClick={() => userLocation && setRadiusMiles(r)}
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full transition-all"
                      style={{
                        backgroundColor: radiusMiles === r && userLocation ? "var(--accent-primary)" : "transparent",
                        color: radiusMiles === r && userLocation ? "#fff" : "var(--text-hint)",
                        opacity: userLocation ? 1 : 0.5,
                      }}>{r}mi</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
              {CATEGORY_TABS.map(c => (
                <button key={c.key} onClick={() => setCatFilter(c.key)}
                  className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: catFilter === c.key ? "var(--accent-primary)" : "var(--bg-card)",
                    color: catFilter === c.key ? "#fff" : "var(--text-secondary)",
                    border: "1px solid var(--border-light)",
                  }}>
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map */}
      <div className="px-4 relative">
        <div ref={mapContainer} className="w-full rounded-3xl overflow-hidden"
          style={{ height: 480, border: "2px solid var(--border-medium)", boxShadow: "0 6px 24px rgba(0,0,0,0.14)" }} />

        {!mapLoaded && (
          <div className="absolute inset-4 flex items-center justify-center rounded-3xl" style={{ backgroundColor: "#E8E3D9" }}>
            <div className="text-center">
              <div className="w-7 h-7 border-2 rounded-full animate-spin mx-auto mb-2" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>Loading map…</p>
            </div>
          </div>
        )}

        {mapLoaded && realWorldGroups.length === 0 && (
          <div className="absolute inset-4 flex flex-col items-center justify-center rounded-3xl pointer-events-none">
            <div className="px-5 py-4 rounded-2xl text-center" style={{ backgroundColor: "rgba(250,250,248,0.95)", border: "1px solid var(--border-light)" }}>
              <p className="text-2xl mb-1">📍</p>
              <p className="text-sm font-bold mb-0.5" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>No real-world groups yet</p>
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>Create a real-world group to put your city on the map!</p>
            </div>
          </div>
        )}

        {/* Group popup */}
        <AnimatePresence>
          {selectedGroup && (
            <motion.div
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 360, damping: 30 }}
              className="absolute left-4 right-4 bottom-4 rounded-3xl overflow-hidden z-10"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 8px 32px rgba(0,0,0,0.22)" }}>

              <div className="relative h-16 overflow-hidden">
                {selectedGroup.cover_image_url
                  ? <img src={selectedGroup.cover_image_url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full" style={{ background: getGrad(selectedGroup.category) }} />}
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent)" }} />
                <button onClick={() => setSelectedGroup(null)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
                  <X className="w-3 h-3 text-white" />
                </button>
                <span className="absolute bottom-2 left-3 text-lg">{selectedGroup.emoji || "💬"}</span>
              </div>

              <div className="px-3 py-2.5 max-h-56 overflow-y-auto">
                <h3 className="font-bold text-sm leading-tight" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{selectedGroup.name}</h3>
                {selectedGroup.description && (
                  <p className="text-xs mt-0.5 mb-1.5 line-clamp-2" style={{ color: "var(--text-hint)" }}>{selectedGroup.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-1.5 text-[11px] mb-1.5" style={{ color: "var(--text-hint)" }}>
                  {(selectedGroup.location_city || selectedGroup.location_name) && (
                    <span className="flex items-center gap-0.5" style={{ color: "var(--accent-primary)" }}>
                      <MapPin className="w-2.5 h-2.5" />{selectedGroup.location_city || selectedGroup.location_name}
                    </span>
                  )}
                  {selectedGroup.membership_fee && (
                    <span>${selectedGroup.membership_fee}/mo</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => { setSelectedGroup(null); onOpen(selectedGroup); }}
                    className="flex-1 py-2 rounded-2xl text-xs font-bold text-white"
                    style={{ background: getGrad(selectedGroup.category) }}>
                    View Group
                  </button>
                  {!membershipMap[selectedGroup.id] && (
                    <button onClick={() => { onJoin(selectedGroup); setSelectedGroup(null); }}
                      className="px-3 py-2 rounded-2xl text-xs font-bold"
                      style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
                      Join
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}