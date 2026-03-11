import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Search, Plus, Users, Lock, MapPin, Globe, Flame,
  Star, ChevronRight, Zap, Navigation, X, Filter, SlidersHorizontal, MessageCircle
} from "lucide-react";
import GroupHub from "@/components/groups/GroupHub";

// ── Constants ─────────────────────────────────────────────────────────────
const CATEGORY_GRADIENTS = {
  fitness:       ["#0d9488", "#16a34a"],
  food:          ["#ea580c", "#d97706"],
  travel:        ["#0284c7", "#6d28d9"],
  study:         ["#d97706", "#b45309"],
  tech:          ["#0284c7", "#0369a1"],
  art:           ["#7c3aed", "#a21caf"],
  music:         ["#db2777", "#be185d"],
  gaming:        ["#16a34a", "#15803d"],
  books:         ["#d97706", "#b45309"],
  movies:        ["#7c3aed", "#4338ca"],
  health:        ["#0d9488", "#16a34a"],
  sports:        ["#ea580c", "#dc2626"],
  relationships: ["#e11d48", "#db2777"],
  motivation:    ["#d97706", "#ea580c"],
  general:       ["#64748b", "#475569"],
};

const CATEGORY_TABS = [
  { key: "all",      label: "All",      emoji: "✨" },
  { key: "fitness",  label: "Fitness",  emoji: "💪" },
  { key: "food",     label: "Food",     emoji: "🍕" },
  { key: "travel",   label: "Travel",   emoji: "✈️" },
  { key: "tech",     label: "Tech",     emoji: "💻" },
  { key: "art",      label: "Art",      emoji: "🎨" },
  { key: "music",    label: "Music",    emoji: "🎵" },
  { key: "gaming",   label: "Gaming",   emoji: "🎮" },
  { key: "movies",   label: "Movies",   emoji: "🎬" },
  { key: "sports",   label: "Sports",   emoji: "⚽" },
];

const CATEGORY_EMOJIS = {
  fitness: "💪", food: "🍕", travel: "✈️", study: "📚", tech: "💻",
  art: "🎨", music: "🎵", gaming: "🎮", books: "📖", movies: "🎬",
  health: "🏃", sports: "⚽", relationships: "❤️", motivation: "🔥", general: "💬",
};

function getGrad(category) {
  const [a, b] = CATEGORY_GRADIENTS[category] || CATEGORY_GRADIENTS.general;
  return `linear-gradient(135deg, ${a}, ${b})`;
}

// ── Sub-components ────────────────────────────────────────────────────────

function HeroGroupCard({ group, membership, onOpen, onJoin }) {
  const isMember = !!membership;
  const isRW = group.group_type === "realworld";
  const [hovered, setHovered] = React.useState(false);
  const videoRef = React.useRef(null);

  const handleMouseEnter = () => {
    setHovered(true);
    if (videoRef.current) { videoRef.current.currentTime = 0; videoRef.current.play().catch(() => {}); }
  };
  const handleMouseLeave = () => {
    setHovered(false);
    if (videoRef.current) { videoRef.current.pause(); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      onClick={() => onOpen(group)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="cursor-pointer relative rounded-3xl overflow-hidden shrink-0"
      style={{ width: 220, height: 280, background: getGrad(group.category) }}>
      {group.preview_video_url && (
        <video
          ref={videoRef}
          src={group.preview_video_url}
          muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
          style={{ opacity: hovered ? 1 : 0 }}
        />
      )}
      {group.cover_image_url && (
        <img src={group.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300" loading="lazy"
          style={{ opacity: hovered && group.preview_video_url ? 0 : 1 }} />
      )}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.78) 50%, rgba(0,0,0,0.1) 100%)" }} />
      <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.18)", color: "#fff", backdropFilter: "blur(6px)" }}>
          {isRW ? "📍 Real-World" : "🌐 Online"}
        </span>
        {group.is_private && <Lock className="w-3.5 h-3.5 text-white/70" />}
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="text-2xl mb-1">{group.emoji || "💬"}</div>
        <h3 className="font-bold text-white leading-tight text-sm mb-1" style={{ fontFamily: "var(--font-serif)" }}>{group.name}</h3>
        {group.description && <p className="text-white/65 text-[11px] line-clamp-2 mb-3">{group.description}</p>}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-white/70 text-[11px]">
            <Users className="w-3 h-3" /><span>{(group.member_count || 0).toLocaleString()}</span>
          </div>
          {isMember ? (
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-white/20 text-white">Joined</span>
          ) : (
            <button onClick={e => { e.stopPropagation(); onJoin(group); }}
              className="text-[11px] font-bold px-3 py-1 rounded-full text-white active:scale-95 transition-transform"
              style={{ background: "rgba(255,255,255,0.25)", backdropFilter: "blur(8px)" }}>Join</button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function GroupRowCard({ group, membership, onOpen, onJoin, index }) {
  const isMember = !!membership;
  const isRW = group.group_type === "realworld";
  const [a, b] = CATEGORY_GRADIENTS[group.category] || CATEGORY_GRADIENTS.general;
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, type: "spring", stiffness: 300, damping: 28 }}
      onClick={() => onOpen(group)}
      className="flex items-center gap-3 px-4 py-3.5 cursor-pointer active:scale-[0.99] transition-transform"
      style={{ borderBottom: "1px solid var(--border-subtle)" }}>
      <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}>
        {group.cover_image_url
          ? <img src={group.cover_image_url} alt="" className="w-full h-full object-cover" />
          : <span className="text-2xl">{group.emoji || "💬"}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <h3 className="font-bold text-sm truncate" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{group.name}</h3>
          {group.is_private && <Lock className="w-3 h-3 shrink-0" style={{ color: "var(--text-hint)" }} />}
        </div>
        {group.description && <p className="text-xs line-clamp-1 mb-1" style={{ color: "var(--text-hint)" }}>{group.description}</p>}
        <div className="flex items-center gap-2 text-[11px]" style={{ color: "var(--text-hint)" }}>
          <span className="flex items-center gap-0.5" style={{ color: isRW ? "var(--accent-primary)" : "var(--text-hint)" }}>
            {isRW ? <MapPin className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
            {isRW ? (group.location_city || "Real-World") : "Online"}
          </span>
          <span>·</span>
          <span><Users className="w-2.5 h-2.5 inline mr-0.5" />{(group.member_count || 0).toLocaleString()}</span>
          <span className="px-1.5 py-0.5 rounded-full capitalize" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)", fontSize: 10 }}>{group.category}</span>
        </div>
      </div>
      {isMember ? (
        <span className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>✓ Joined</span>
      ) : (
        <button onClick={e => { e.stopPropagation(); onJoin(group); }}
          className="shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full text-white active:scale-95 transition-transform"
          style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}>Join</button>
      )}
    </motion.div>
  );
}

function MyGroupChip({ group, onOpen }) {
  const [a] = CATEGORY_GRADIENTS[group.category] || CATEGORY_GRADIENTS.general;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      onClick={() => onOpen(group)}
      className="cursor-pointer flex items-center gap-2.5 px-3 py-2.5 rounded-2xl shrink-0 active:scale-95 transition-transform"
      style={{ backgroundColor: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)", minWidth: 140 }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
        style={{ background: `linear-gradient(135deg, ${a}55, ${a}88)` }}>
        {group.emoji || "💬"}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold truncate text-white">{group.name}</p>
        <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.55)" }}>{(group.member_count || 0).toLocaleString()} members</p>
      </div>
      <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: "rgba(255,255,255,0.4)" }} />
    </motion.div>
  );
}

// ── Nearby Explorer Map ───────────────────────────────────────────────────
// Haversine distance in miles between two [lng, lat] coords
function haversineMiles([lng1, lat1], [lng2, lat2]) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const RADIUS_OPTIONS = [5, 10, 25, 50, 100];

function NearbyExplorer({ groups, membershipMap, onOpen, onJoin }) {
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

  // Keep selectedGroup in a ref so marker click always has latest setter
  const setSelectedGroupRef = useRef(setSelectedGroup);
  useEffect(() => { setSelectedGroupRef.current = setSelectedGroup; }, []);

  useEffect(() => {
    base44.functions.invoke("mapboxToken", {}).then(res => {
      if (res.data?.token) setToken(res.data.token);
    }).catch(() => {});
  }, []);

  const realWorldGroups = useMemo(() =>
    groups
      .filter(g => g.group_type === "realworld" && g.location_lat && g.location_lng)
      .filter(g => catFilter === "all" || g.category === catFilter)
      .filter(g => {
        if (!userLocation) return true; // no user location = show all
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
    if (token) loadMapbox(token);
  }, [token]);

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

  // Plot group markers — NO transforms, only opacity change on hover to keep position stable
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    realWorldGroups.forEach(group => {
      const [a] = CATEGORY_GRADIENTS[group.category] || CATEGORY_GRADIENTS.general;
      const emoji = CATEGORY_EMOJIS[group.category] || "💬";
      const isMember = !!membershipMap[group.id];

      const el = document.createElement("div");
      // No transform, no transition — purely static element so Mapbox positioning is stable
      el.style.cssText = "display:flex;flex-direction:column;align-items:center;cursor:pointer;";
      el.innerHTML = `
        <div style="background:${getGrad(group.category)};border:2.5px solid ${isMember ? "#fff" : "#DCCBB8"};border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 4px 14px rgba(0,0,0,0.3);">${emoji}</div>
        <div style="background:${a};color:white;border-radius:20px;padding:1px 7px;font-size:9px;font-weight:800;margin-top:3px;white-space:nowrap;max-width:90px;overflow:hidden;text-overflow:ellipsis;box-shadow:0 1px 4px rgba(0,0,0,0.18);">${group.name}</div>
      `;

      // Use mousedown instead of click to avoid map drag triggering close
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
      {/* Top bar: count + toggle filters + near me */}
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

      {/* Collapsible filter panels */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}>

            {/* Radius slider */}
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

            {/* Category pills */}
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

      {/* Map container — popup overlays inside here */}
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

        {/* Group popup — overlaid at bottom of map */}
        <AnimatePresence>
          {selectedGroup && (
            <motion.div
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 360, damping: 30 }}
              className="absolute left-4 right-4 bottom-4 rounded-3xl overflow-hidden z-10"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 8px 32px rgba(0,0,0,0.22)" }}>

              {/* Cover strip */}
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
                {/* Name + description */}
                <h3 className="font-bold text-sm leading-tight" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{selectedGroup.name}</h3>
                {selectedGroup.description && (
                  <p className="text-xs mt-0.5 mb-1.5 line-clamp-2" style={{ color: "var(--text-hint)" }}>{selectedGroup.description}</p>
                )}

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] mb-1.5" style={{ color: "var(--text-hint)" }}>
                  {(selectedGroup.location_city || selectedGroup.location_name) && (
                    <span className="flex items-center gap-0.5" style={{ color: "var(--accent-primary)" }}>
                      <MapPin className="w-2.5 h-2.5" />{selectedGroup.location_city || selectedGroup.location_name}
                    </span>
                  )}
                  <span className="flex items-center gap-0.5"><Users className="w-2.5 h-2.5" />{(selectedGroup.member_count || 0).toLocaleString()}</span>
                  <span className="px-1.5 py-0.5 rounded-full capitalize" style={{ backgroundColor: "var(--bg-subtle)" }}>{selectedGroup.category}</span>
                </div>

                {/* Schedule */}
                {selectedGroup.meeting_schedule && (
                  <p className="text-[11px] mb-1.5" style={{ color: "var(--text-secondary)" }}>📅 {selectedGroup.meeting_schedule}</p>
                )}

                {/* Contact */}
                {(selectedGroup.phone || selectedGroup.email) && (
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {selectedGroup.phone && (
                      <a href={`tel:${selectedGroup.phone}`} className="text-[11px] px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>📞 {selectedGroup.phone}</a>
                    )}
                    {selectedGroup.email && (
                      <a href={`mailto:${selectedGroup.email}`} className="text-[11px] px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>✉️ {selectedGroup.email}</a>
                    )}
                  </div>
                )}

                {/* Social links */}
                {(selectedGroup.social_instagram || selectedGroup.social_facebook || selectedGroup.social_whatsapp || selectedGroup.social_tiktok || selectedGroup.google_maps_url) && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {selectedGroup.google_maps_url && (
                      <a href={selectedGroup.google_maps_url} target="_blank" rel="noopener noreferrer"
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#E8F5E9", color: "#2E6B4F" }}>🗺️ Maps</a>
                    )}
                    {selectedGroup.social_instagram && (
                      <a href={selectedGroup.social_instagram} target="_blank" rel="noopener noreferrer"
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FCE4EC", color: "#C2185B" }}>📸 Instagram</a>
                    )}
                    {selectedGroup.social_facebook && (
                      <a href={selectedGroup.social_facebook} target="_blank" rel="noopener noreferrer"
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#E3F2FD", color: "#1565C0" }}>👥 Facebook</a>
                    )}
                    {selectedGroup.social_whatsapp && (
                      <a href={selectedGroup.social_whatsapp} target="_blank" rel="noopener noreferrer"
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#E8F5E9", color: "#2E7D32" }}>💬 WhatsApp</a>
                    )}
                    {selectedGroup.social_tiktok && (
                      <a href={selectedGroup.social_tiktok} target="_blank" rel="noopener noreferrer"
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F3E5F5", color: "#6A1B9A" }}>🎵 TikTok</a>
                    )}
                  </div>
                )}

                {/* Actions */}
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

// ── Main Page ─────────────────────────────────────────────────────────────
export default function Groups() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);
  const [activeMembership, setActiveMembership] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [mainTab, setMainTab] = useState("discover"); // "discover" | "map"
  const [showDiscoverFilters, setShowDiscoverFilters] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: groups = [] } = useQuery({
    queryKey: ["groups"],
    queryFn: () => base44.entities.Group.filter({ is_active: true }, "-member_count", 200),
  });

  const { data: myMemberships = [] } = useQuery({
    queryKey: ["myMemberships", user?.email],
    queryFn: () => base44.entities.GroupMember.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const membershipMap = useMemo(() => Object.fromEntries(myMemberships.map(m => [m.group_id, m])), [myMemberships]);

  const handleJoin = async (group) => {
    if (!user || membershipMap[group.id]) return;
    const newMember = await base44.entities.GroupMember.create({
      group_id: group.id, group_name: group.name,
      user_email: user.email, user_name: user.full_name || user.email,
      role: "member", joined_at: new Date().toISOString(),
    });
    await base44.entities.Group.update(group.id, { member_count: (group.member_count || 0) + 1 });
    qc.invalidateQueries({ queryKey: ["myMemberships", user.email] });
    qc.invalidateQueries({ queryKey: ["groups"] });
    setActiveMembership(newMember);
  };

  const handleLeave = async () => {
    if (!user || !activeGroup) return;
    const mem = membershipMap[activeGroup.id];
    if (!mem) return;
    await base44.entities.GroupMember.delete(mem.id);
    await base44.entities.Group.update(activeGroup.id, { member_count: Math.max(0, (activeGroup.member_count || 1) - 1) });
    qc.invalidateQueries({ queryKey: ["myMemberships", user.email] });
    qc.invalidateQueries({ queryKey: ["groups"] });
    setActiveMembership(null);
    setActiveGroup(null);
  };

  const handleOpenGroup = (group) => {
    setActiveGroup(group);
    setActiveMembership(membershipMap[group.id] || null);
  };

  const handleCreated = (group) => {
    setShowCreate(false);
    qc.invalidateQueries({ queryKey: ["groups"] });
    qc.invalidateQueries({ queryKey: ["myMemberships", user?.email] });
    setActiveMembership({ role: "admin", group_id: group.id });
    setActiveGroup(group);
  };

  const myGroups = useMemo(() => groups.filter(g => membershipMap[g.id]), [groups, membershipMap]);
  const trendingGroups = useMemo(() => [...groups].sort((a, b) => (b.member_count || 0) - (a.member_count || 0)).slice(0, 8), [groups]);

  const filteredGroups = useMemo(() => groups.filter(g => {
    const matchSearch = !search || g.name.toLowerCase().includes(search.toLowerCase()) || g.description?.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (categoryFilter !== "all" && g.category !== categoryFilter) return false;
    if (typeFilter !== "all" && g.group_type !== typeFilter) return false;
    return true;
  }), [groups, search, categoryFilter, typeFilter]);

  const isFiltering = search || categoryFilter !== "all" || typeFilter !== "all";

  if (activeGroup) {
    return (
      <GroupHub group={activeGroup} user={user} membership={activeMembership}
        isMember={!!activeMembership} onBack={() => setActiveGroup(null)}
        onJoin={() => handleJoin(activeGroup)} onLeave={handleLeave} />
    );
  }

  const CARD_PALETTES = [
    { bg: "#FBBF8A", text: "#7A3D00" },
    { bg: "#86EFAC", text: "#14532D" },
    { bg: "#C4B5FD", text: "#3B0764" },
    { bg: "#93C5FD", text: "#1E3A5F" },
    { bg: "#FCA5A5", text: "#7F1D1D" },
    { bg: "#FDE68A", text: "#78350F" },
  ];

  return (
    <div style={{ minHeight: "100dvh", paddingBottom: 88, backgroundColor: "var(--bg-app)" }}>

      {/* ── Header ── */}
      <div className="relative px-5 pt-6 pb-4"
        style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 24px)" }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Groups</h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Join communities · Meet people</p>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <button onClick={() => navigate(createPageUrl("CreateGroup"))}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-bold text-white"
                style={{ backgroundColor: "var(--accent-primary)" }}>
                <Plus className="w-4 h-4" /> Create
              </button>
            )}
          </div>
        </div>

        {/* Main Tabs */}
        <div className="flex gap-2">
          {[
            { key: "discover", label: "Discover", icon: Zap },
            { key: "map", label: "Nearby", icon: MapPin },
          ].map(({ key, label, icon: TabIcon }) => (
            <button key={key} onClick={() => setMainTab(key)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all"
              style={{
                backgroundColor: mainTab === key ? "var(--accent-primary)" : "var(--bg-card)",
                color: mainTab === key ? "#fff" : "var(--text-secondary)",
                border: `1.5px solid ${mainTab === key ? "var(--accent-primary)" : "var(--border-light)"}`,
              }}>
              <TabIcon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAP TAB ── */}
      {mainTab === "map" && (
        <NearbyExplorer groups={groups} membershipMap={membershipMap} onOpen={handleOpenGroup} onJoin={handleJoin} />
      )}

      {/* ── DISCOVER TAB ── */}
      {mainTab === "discover" && (
        <div>
          {/* Search */}
          <div className="px-4 pt-1 pb-3">
            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
              <Search className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search groups…"
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: "var(--text-primary)" }} />
            </div>
          </div>

          {/* Filter toggle */}
          <div className="px-4 pb-3 flex items-center gap-2">
            <button onClick={() => setShowDiscoverFilters(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: showDiscoverFilters ? "var(--accent-primary)" : "var(--bg-card)",
                color: showDiscoverFilters ? "#fff" : "var(--text-secondary)",
                border: `1px solid ${showDiscoverFilters ? "var(--accent-primary)" : "var(--border-light)"}`,
              }}>
              <Filter className="w-3 h-3" />
              Filters
              {(typeFilter !== "all" || categoryFilter !== "all") && (
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
              )}
            </button>
            {(typeFilter !== "all" || categoryFilter !== "all") && (
              <button onClick={() => { setTypeFilter("all"); setCategoryFilter("all"); }}
                className="text-xs font-semibold px-2 py-1 rounded-full"
                style={{ color: "var(--accent-primary)", backgroundColor: "var(--accent-primary-light)" }}>
                Clear
              </button>
            )}
          </div>

          {/* Collapsible filter pills */}
          <AnimatePresence>
            {showDiscoverFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}>
                <div className="flex gap-2 px-4 pb-1 overflow-x-auto scrollbar-hide">
                  {[{ key: "all", label: "All" }, { key: "realworld", label: "📍 Real-World" }, { key: "online", label: "🌐 Online" }].map(t => (
                    <button key={t.key} onClick={() => setTypeFilter(t.key)}
                      className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: typeFilter === t.key ? "var(--accent-primary)" : "var(--bg-card)",
                        color: typeFilter === t.key ? "#fff" : "var(--text-secondary)",
                        border: "1px solid var(--border-light)",
                      }}>{t.label}</button>
                  ))}
                </div>
                <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide">
                  {CATEGORY_TABS.map(c => (
                    <button key={c.key} onClick={() => setCategoryFilter(c.key)}
                      className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: categoryFilter === c.key ? "var(--accent-primary)" : "var(--bg-card)",
                        color: categoryFilter === c.key ? "#fff" : "var(--text-secondary)",
                        border: "1px solid var(--border-light)",
                      }}>{c.emoji} {c.label}</button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search results */}
          {isFiltering ? (
            <div className="px-4 pt-2">
              <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-hint)" }}>
                {filteredGroups.length} result{filteredGroups.length !== 1 ? "s" : ""}
              </p>
              {filteredGroups.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="font-bold text-sm mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>No groups found</p>
                  {user && (
                    <button onClick={() => navigate(createPageUrl("CreateGroup"))}
                      className="mt-4 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                      style={{ backgroundColor: "var(--accent-primary)" }}>Create a Group</button>
                  )}
                </div>
              ) : (
                <div className="rounded-3xl overflow-hidden" style={{ border: "1px solid var(--border-light)" }}>
                  {filteredGroups.map((g, i) => (
                    <GroupRowCard key={g.id} group={g} membership={membershipMap[g.id]}
                      onOpen={handleOpenGroup} onJoin={handleJoin} index={i} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* My Groups */}
              {myGroups.length > 0 && (
                <section className="px-4 pt-2">
                  <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-3" style={{ color: "var(--text-hint)" }}>
                    <Star className="w-3.5 h-3.5" style={{ color: "var(--accent-secondary)" }} /> My Groups
                  </p>
                  <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                    {myGroups.map(g => <MyGroupChip key={g.id} group={g} onOpen={handleOpenGroup} />)}
                  </div>
                </section>
              )}

              {/* Trending / Live */}
              {trendingGroups.length > 0 && (
                <section className="pt-5 pb-2">
                  <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 px-4 mb-3" style={{ color: "var(--text-hint)" }}>
                    <Flame className="w-3.5 h-3.5 text-orange-500" /> Trending Groups
                  </p>
                  <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2">
                    {trendingGroups.map(g => (
                      <HeroGroupCard key={g.id} group={g} membership={membershipMap[g.id]}
                        onOpen={handleOpenGroup} onJoin={handleJoin} />
                    ))}
                  </div>
                </section>
              )}

              {/* All Groups — colorful cards like reference image */}
              <section className="px-4 pt-4 pb-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--text-hint)" }}>
                    <Users className="w-3.5 h-3.5" /> Popular Groups
                  </p>
                  <span className="text-xs" style={{ color: "var(--text-hint)" }}>See all</span>
                </div>
                {groups.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="text-5xl mb-3">👥</div>
                    <p className="font-bold text-base mb-1" style={{ color: "var(--text-primary)" }}>No groups yet</p>
                    {user && (
                      <button onClick={() => navigate(createPageUrl("CreateGroup"))}
                        className="mt-4 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                        style={{ backgroundColor: "var(--accent-primary)" }}>Create a Group</button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {groups.map((g, i) => {
                      const palette = CARD_PALETTES[i % CARD_PALETTES.length];
                      const isMember = !!membershipMap[g.id];
                      return (
                        <motion.div
                          key={g.id}
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          onClick={() => handleOpenGroup(g)}
                          className="flex items-center gap-3 px-4 py-4 rounded-2xl cursor-pointer"
                          style={{ backgroundColor: palette.bg }}>
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: "rgba(0,0,0,0.12)" }}>
                            {g.cover_image_url
                              ? <img src={g.cover_image_url} alt="" className="w-full h-full rounded-2xl object-cover" />
                              : <span className="text-2xl">{g.emoji || CATEGORY_EMOJIS[g.category] || "💬"}</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-[15px] truncate" style={{ color: palette.text }}>{g.name}</p>
                            <p className="text-[12px] font-medium" style={{ color: `${palette.text}99` }}>
                              {(g.member_count || 0).toLocaleString()} members · {g.category || "general"}
                            </p>
                          </div>
                          {isMember ? (
                            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                              style={{ backgroundColor: "rgba(0,0,0,0.12)" }}>
                              <span className="text-lg">✓</span>
                            </div>
                          ) : (
                            <button onClick={e => { e.stopPropagation(); handleJoin(g); }}
                              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-xl"
                              style={{ backgroundColor: "rgba(0,0,0,0.15)", color: palette.text }}>
                              +
                            </button>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      )}

    </div>
  );
}