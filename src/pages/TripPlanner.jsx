import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  MapPin, Plus, X, Trash2, ArrowUp, ArrowDown, Share2,
  Navigation, Search, Loader2, ChevronRight, Map, List,
  Route, Clock, Save, ChevronDown, ChevronUp
} from "lucide-react";

const EMOJI_BY_CAT = { restaurant: "🍽️", cafe: "☕", park: "🌳", hotel: "🏨", museum: "🏛️", bar: "🍺", shopping_mall: "🛍️", tourist_attraction: "🗺️", default: "📍" };
const catEmoji = (cat) => EMOJI_BY_CAT[cat] || EMOJI_BY_CAT.default;

function formatKm(km) {
  if (!km) return "—";
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

export default function TripPlanner() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [user, setUser] = useState(null);
  const [apiKey, setApiKey] = useState(null);
  const [view, setView] = useState("list"); // "list" | "map"
  const [myTrips, setMyTrips] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null); // editing trip
  const [showNewTripForm, setShowNewTripForm] = useState(false);
  const [newTripTitle, setNewTripTitle] = useState("");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [distances, setDistances] = useState([]); // between stops
  const [saving, setSaving] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);
  const autocompleteRef = useRef(null);
  const searchDebounce = useRef(null);
  const placesServiceRef = useRef(null);
  const geocoderRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    base44.functions.invoke("googleMapsToken", {}).then(r => setApiKey(r.data?.key || r.data)).catch(() => {});
  }, []);

  // Load my trips
  useEffect(() => {
    if (!user?.email) return;
    base44.entities.Trip.filter({ creator_email: user.email }, "-created_date", 50).then(setMyTrips).catch(() => {});
  }, [user?.email]);

  // Init Google Maps when view === map and apiKey ready
  useEffect(() => {
    if (view !== "map" || !apiKey || mapInst.current) return;
    let destroyed = false;
    const init = async () => {
      if (!window.google?.maps) {
        await new Promise((res, rej) => {
          const s = document.createElement("script");
          s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
          s.async = true; s.onload = res; s.onerror = rej;
          document.head.appendChild(s);
        });
      }
      if (destroyed || !mapRef.current) return;
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 40.7128, lng: -74.006 },
        zoom: 12,
        disableDefaultUI: true,
        gestureHandling: "greedy",
      });
      mapInst.current = map;
      placesServiceRef.current = new window.google.maps.places.PlacesService(map);
      autocompleteRef.current = new window.google.maps.places.AutocompleteService();
      geocoderRef.current = new window.google.maps.Geocoder();
      setMapReady(true);
    };
    init().catch(console.error);
    return () => { destroyed = true; };
  }, [view, apiKey]);

  // Draw stops on map
  useEffect(() => {
    if (!mapReady || !mapInst.current || !activeTrip) return;
    const map = mapInst.current;
    // Clear old markers + polyline
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    if (polylineRef.current) { polylineRef.current.setMap(null); polylineRef.current = null; }

    const stops = activeTrip.stops || [];
    const path = [];
    stops.forEach((stop, i) => {
      if (!stop.lat || !stop.lng) return;
      const pos = { lat: stop.lat, lng: stop.lng };
      path.push(pos);
      const label = document.createElement("div");
      label.innerHTML = `<div style="background:#4F46E5;color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${i + 1}</div>`;
      const marker = new window.google.maps.Marker({ position: pos, map, icon: { url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="14" fill="#4F46E5"/><text x="16" y="21" font-size="13" text-anchor="middle" fill="white" font-weight="bold">${i + 1}</text></svg>`)}`, scaledSize: new window.google.maps.Size(32, 32), anchor: new window.google.maps.Point(16, 16) }, title: stop.name });
      markersRef.current.push(marker);
    });
    if (path.length > 1) {
      polylineRef.current = new window.google.maps.Polyline({ path, geodesic: true, strokeColor: "#4F46E5", strokeOpacity: 0.85, strokeWeight: 3, map });
    }
    if (path.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      path.forEach(p => bounds.extend(p));
      map.fitBounds(bounds, { top: 60, bottom: 60, left: 20, right: 20 });
    }
  }, [mapReady, activeTrip?.stops]);

  // Calculate distances between stops
  const calcDistances = useCallback((stops) => {
    if (!stops || stops.length < 2 || !window.google?.maps?.geometry) { setDistances([]); return; }
    const dists = [];
    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i], b = stops[i + 1];
      if (!a.lat || !a.lng || !b.lat || !b.lng) { dists.push(null); continue; }
      const d = window.google.maps.geometry.spherical.computeDistanceBetween(
        new window.google.maps.LatLng(a.lat, a.lng),
        new window.google.maps.LatLng(b.lat, b.lng)
      );
      dists.push(d / 1000);
    }
    setDistances(dists);
    return dists;
  }, []);

  useEffect(() => {
    if (activeTrip?.stops) calcDistances(activeTrip.stops);
  }, [activeTrip?.stops]);

  // Search places
  const handleSearch = (val) => {
    setSearch(val);
    setShowSearch(true);
    clearTimeout(searchDebounce.current);
    if (!val.trim()) { setSearchResults([]); return; }
    searchDebounce.current = setTimeout(() => {
      if (!autocompleteRef.current) return;
      setSearchLoading(true);
      autocompleteRef.current.getPlacePredictions({ input: val }, (preds, status) => {
        setSearchLoading(false);
        if (status === "OK") setSearchResults(preds || []);
        else setSearchResults([]);
      });
    }, 350);
  };

  const addStop = (pred) => {
    if (!placesServiceRef.current && apiKey) {
      // lazy init places service with a dummy div
      const div = document.createElement("div");
      const tempMap = mapInst.current || new window.google.maps.Map(div, { center: { lat: 0, lng: 0 }, zoom: 1 });
      placesServiceRef.current = new window.google.maps.places.PlacesService(tempMap);
    }
    if (!placesServiceRef.current) return;
    setSearch(""); setSearchResults([]); setShowSearch(false);
    placesServiceRef.current.getDetails(
      { placeId: pred.place_id, fields: ["name", "formatted_address", "geometry", "photos", "types"] },
      (place, status) => {
        if (status !== "OK" || !place) return;
        const stop = {
          name: place.name,
          address: place.formatted_address,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          photo: place.photos?.[0]?.getUrl({ maxWidth: 400 }) || null,
          category: place.types?.[0] || "place",
          note: "",
        };
        setActiveTrip(prev => ({ ...prev, stops: [...(prev?.stops || []), stop] }));
      }
    );
  };

  const removeStop = (idx) => {
    setActiveTrip(prev => ({ ...prev, stops: prev.stops.filter((_, i) => i !== idx) }));
  };

  const moveStop = (idx, dir) => {
    setActiveTrip(prev => {
      const stops = [...(prev.stops || [])];
      const target = idx + dir;
      if (target < 0 || target >= stops.length) return prev;
      [stops[idx], stops[target]] = [stops[target], stops[idx]];
      return { ...prev, stops };
    });
  };

  const updateNote = (idx, note) => {
    setActiveTrip(prev => {
      const stops = [...(prev.stops || [])];
      stops[idx] = { ...stops[idx], note };
      return { ...prev, stops };
    });
  };

  const createTrip = async () => {
    if (!newTripTitle.trim() || !user) return;
    const trip = { title: newTripTitle.trim(), creator_email: user.email, creator_name: user.full_name || user.email.split("@")[0], stops: [], is_public: false };
    const created = await base44.entities.Trip.create(trip);
    setMyTrips(prev => [created, ...prev]);
    setActiveTrip(created);
    setShowNewTripForm(false);
    setNewTripTitle("");
  };

  const saveTrip = async () => {
    if (!activeTrip?.id) return;
    setSaving(true);
    const dists = calcDistances(activeTrip.stops) || distances;
    const totalKm = dists.filter(Boolean).reduce((a, b) => a + b, 0);
    const updated = await base44.entities.Trip.update(activeTrip.id, { ...activeTrip, total_distance_km: totalKm });
    setMyTrips(prev => prev.map(t => t.id === updated.id ? updated : t));
    setActiveTrip(updated);
    setSaving(false);
  };

  const shareTrip = async () => {
    if (!shareEmail.trim() || !activeTrip?.id) return;
    const shared = [...(activeTrip.shared_with || []), shareEmail.trim()];
    await base44.entities.Trip.update(activeTrip.id, { shared_with: shared });
    setActiveTrip(prev => ({ ...prev, shared_with: shared }));
    setShareEmail("");
    setShowShareModal(false);
  };

  const totalDist = distances.filter(Boolean).reduce((a, b) => a + b, 0);
  const stops = activeTrip?.stops || [];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg-app)", paddingBottom: "env(safe-area-inset-bottom, 16px)" }}>
      {/* Header */}
      <div className="sticky top-0 z-30 px-4 pt-4 pb-3" style={{ backgroundColor: "var(--bg-nav)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--border-subtle)", paddingTop: "max(env(safe-area-inset-top, 16px), 16px)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-md" style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
              <Route className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                {activeTrip ? activeTrip.title : "Trip Planner"}
              </h1>
              <p className="text-[11px] font-semibold" style={{ color: "var(--text-hint)" }}>
                {activeTrip ? `${stops.length} stop${stops.length !== 1 ? "s" : ""} · ${formatKm(totalDist)} total` : "Plan your next adventure ✦"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeTrip && (
              <>
                <button onClick={() => setShowShareModal(true)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                  <Share2 className="w-4 h-4" style={{ color: "var(--text-primary)" }} />
                </button>
                <button onClick={saveTrip} disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold"
                  style={{ background: "linear-gradient(135deg,#4F46E5,#7C3AED)", color: "#fff" }}>
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save
                </button>
                <button onClick={() => setActiveTrip(null)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                  <X className="w-4 h-4" style={{ color: "var(--text-primary)" }} />
                </button>
              </>
            )}
            {!activeTrip && (
              <button onClick={() => setShowNewTripForm(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold"
                style={{ background: "linear-gradient(135deg,#4F46E5,#7C3AED)", color: "#fff" }}>
                <Plus className="w-4 h-4" /> New Trip
              </button>
            )}
          </div>
        </div>

        {/* View toggle when editing */}
        {activeTrip && (
          <div className="flex gap-1 p-1 rounded-2xl self-start" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", width: "fit-content" }}>
            {[{ key: "list", icon: List }, { key: "map", icon: Map }].map(({ key, icon: Icon }) => (
              <button key={key} onClick={() => setView(key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                style={{ backgroundColor: view === key ? "#4F46E5" : "transparent", color: view === key ? "#fff" : "var(--text-hint)" }}>
                <Icon className="w-3.5 h-3.5" /> {key === "list" ? "Itinerary" : "Map"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* New Trip Form */}
      <AnimatePresence>
        {showNewTripForm && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="mx-4 mt-4 p-4 rounded-2xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
            <p className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>Name your trip</p>
            <input value={newTripTitle} onChange={e => setNewTripTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && createTrip()}
              placeholder="e.g. NYC Weekend Adventure"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none mb-3"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
            <div className="flex gap-2">
              <button onClick={createTrip} className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: "linear-gradient(135deg,#4F46E5,#7C3AED)", color: "#fff" }}>Create Trip</button>
              <button onClick={() => setShowNewTripForm(false)} className="px-4 py-2.5 rounded-xl text-sm font-bold"
                style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ACTIVE TRIP — LIST VIEW */}
      {activeTrip && view === "list" && (
        <div className="flex-1 overflow-y-auto pb-32">
          {/* Search to add stops */}
          <div className="px-4 pt-4 pb-2">
            <div className="relative">
              <div className="flex items-center gap-2 px-4 py-3 rounded-2xl"
                style={{ backgroundColor: "var(--bg-card)", border: "1.5px solid var(--accent-primary)", boxShadow: "0 0 0 3px rgba(79,70,229,0.08)" }}>
                <Search className="w-4 h-4 shrink-0" style={{ color: "var(--accent-primary)" }} />
                <input value={search} onChange={e => handleSearch(e.target.value)}
                  onFocus={() => setShowSearch(true)}
                  placeholder="Search & add a place…"
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: "var(--text-primary)", border: "none", minHeight: "unset", boxShadow: "none", fontSize: 14, padding: 0 }} />
                {searchLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: "var(--text-hint)" }} />}
                {search && <button onClick={() => { setSearch(""); setSearchResults([]); }}><X className="w-4 h-4" style={{ color: "var(--text-hint)" }} /></button>}
              </div>
              {showSearch && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 rounded-2xl overflow-hidden z-40"
                  style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 12px 40px rgba(0,0,0,0.15)" }}>
                  {searchResults.map((pred, i) => (
                    <button key={pred.place_id} onClick={() => addStop(pred)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-opacity-50"
                      style={{ borderBottom: i < searchResults.length - 1 ? "1px solid var(--border-subtle)" : "none", backgroundColor: "transparent" }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--accent-primary-light)" }}>
                        <MapPin className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{pred.structured_formatting?.main_text}</p>
                        <p className="text-xs truncate" style={{ color: "var(--text-hint)" }}>{pred.structured_formatting?.secondary_text}</p>
                      </div>
                      <Plus className="w-4 h-4 shrink-0" style={{ color: "var(--accent-primary)" }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stops list */}
          {stops.length === 0 ? (
            <div className="py-16 text-center px-8">
              <div className="text-5xl mb-4">🗺️</div>
              <p className="text-base font-bold mb-2" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>No stops yet</p>
              <p className="text-sm" style={{ color: "var(--text-hint)" }}>Search for places above to build your itinerary</p>
            </div>
          ) : (
            <div className="px-4 pt-2 space-y-1">
              {stops.map((stop, i) => (
                <React.Fragment key={i}>
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                    {stop.photo && (
                      <div className="relative" style={{ height: 100 }}>
                        <img src={stop.photo} alt={stop.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.5) 0%, transparent 50%)" }} />
                        <div className="absolute top-2 left-3 w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm"
                          style={{ backgroundColor: "#4F46E5", color: "#fff" }}>{i + 1}</div>
                      </div>
                    )}
                    <div className="p-3">
                      <div className="flex items-start gap-2">
                        {!stop.photo && (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                            style={{ backgroundColor: "#4F46E5", color: "#fff" }}>{i + 1}</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>{stop.name}</p>
                          <p className="text-xs truncate" style={{ color: "var(--text-hint)" }}>{stop.address}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => moveStop(i, -1)} disabled={i === 0}
                            className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--bg-subtle)", opacity: i === 0 ? 0.3 : 1, minWidth: 28, minHeight: 28 }}>
                            <ArrowUp className="w-3.5 h-3.5" style={{ color: "var(--text-secondary)" }} />
                          </button>
                          <button onClick={() => moveStop(i, 1)} disabled={i === stops.length - 1}
                            className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--bg-subtle)", opacity: i === stops.length - 1 ? 0.3 : 1, minWidth: 28, minHeight: 28 }}>
                            <ArrowDown className="w-3.5 h-3.5" style={{ color: "var(--text-secondary)" }} />
                          </button>
                          <button onClick={() => removeStop(i)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#FEE2E2", minWidth: 28, minHeight: 28 }}>
                            <Trash2 className="w-3.5 h-3.5" style={{ color: "#DC2626" }} />
                          </button>
                        </div>
                      </div>
                      <input value={stop.note} onChange={e => updateNote(i, e.target.value)}
                        placeholder="Add a note… (optional)"
                        className="w-full mt-2 px-3 py-2 rounded-xl text-xs outline-none"
                        style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }} />
                    </div>
                  </motion.div>

                  {/* Distance to next stop */}
                  {i < stops.length - 1 && (
                    <div className="flex items-center justify-center gap-2 py-1">
                      <div className="h-px flex-1" style={{ backgroundColor: "var(--border-subtle)" }} />
                      <div className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
                        <Navigation className="w-3 h-3" />
                        {distances[i] != null ? formatKm(distances[i]) : "—"}
                      </div>
                      <div className="h-px flex-1" style={{ backgroundColor: "var(--border-subtle)" }} />
                    </div>
                  )}
                </React.Fragment>
              ))}

              {/* Total summary */}
              {stops.length > 1 && (
                <div className="mt-4 p-4 rounded-2xl" style={{ background: "linear-gradient(135deg, rgba(79,70,229,0.08), rgba(124,58,237,0.08))", border: "1px solid rgba(79,70,229,0.15)" }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold" style={{ color: "var(--text-hint)" }}>TOTAL ROUTE</p>
                      <p className="text-xl font-bold" style={{ color: "var(--accent-primary)", fontFamily: "var(--font-serif)" }}>{formatKm(totalDist)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold" style={{ color: "var(--text-hint)" }}>STOPS</p>
                      <p className="text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{stops.length}</p>
                    </div>
                    <button onClick={() => window.open(`https://www.google.com/maps/dir/${stops.filter(s => s.lat && s.lng).map(s => `${s.lat},${s.lng}`).join("/")}`, "_blank")}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold"
                      style={{ background: "linear-gradient(135deg,#4F46E5,#7C3AED)", color: "#fff" }}>
                      <Navigation className="w-4 h-4" /> Go
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ACTIVE TRIP — MAP VIEW */}
      {activeTrip && view === "map" && (
        <div className="flex-1 relative" style={{ minHeight: "calc(100vh - 140px)" }}>
          <div ref={mapRef} style={{ height: "100%", width: "100%", minHeight: 400 }} />
          {!mapReady && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "var(--bg-app)" }}>
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--accent-primary)" }} />
            </div>
          )}
          {/* Stop labels overlay */}
          {stops.length > 0 && (
            <div className="absolute bottom-4 left-3 right-3 rounded-2xl p-3 overflow-x-auto scrollbar-hide"
              style={{ backgroundColor: "rgba(255,255,255,0.97)", backdropFilter: "blur(16px)", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
              <div className="flex gap-2">
                {stops.map((stop, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-3 py-2 rounded-xl shrink-0"
                    style={{ backgroundColor: "#EEF2FF", border: "1px solid #C7D2FE" }}>
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                      style={{ backgroundColor: "#4F46E5", color: "#fff" }}>{i + 1}</span>
                    <span className="text-xs font-semibold truncate" style={{ maxWidth: 80, color: "#1E1B4B" }}>{stop.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MY TRIPS LIST (no active trip) */}
      {!activeTrip && (
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-32">
          {myTrips.length === 0 && !showNewTripForm ? (
            <div className="py-20 text-center">
              <div className="text-6xl mb-4">✈️</div>
              <p className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>No trips yet</p>
              <p className="text-sm mb-6" style={{ color: "var(--text-hint)" }}>Create your first trip to start planning an adventure</p>
              <button onClick={() => setShowNewTripForm(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold"
                style={{ background: "linear-gradient(135deg,#4F46E5,#7C3AED)", color: "#fff" }}>
                <Plus className="w-4 h-4" /> Create First Trip
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myTrips.map(trip => (
                <motion.button key={trip.id} onClick={() => { setActiveTrip(trip); setView("list"); }}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all active:scale-[0.98]"
                  style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-2xl"
                    style={{ background: "linear-gradient(135deg, rgba(79,70,229,0.12), rgba(124,58,237,0.12))", border: "1px solid rgba(79,70,229,0.2)" }}>
                    🗺️
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate" style={{ color: "var(--text-primary)" }}>{trip.title}</p>
                    <p className="text-xs" style={{ color: "var(--text-hint)" }}>
                      {trip.stops?.length || 0} stop{(trip.stops?.length || 0) !== 1 ? "s" : ""}
                      {trip.total_distance_km ? ` · ${formatKm(trip.total_distance_km)}` : ""}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "var(--text-hint)" }} />
                </motion.button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            onClick={() => setShowShareModal(false)}>
            <motion.div initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }}
              className="w-full max-w-md rounded-3xl p-6"
              style={{ backgroundColor: "var(--bg-card)" }}
              onClick={e => e.stopPropagation()}>
              <h3 className="text-base font-bold mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Share Trip</h3>
              <p className="text-xs mb-4" style={{ color: "var(--text-hint)" }}>Share "{activeTrip?.title}" with a friend</p>
              <input value={shareEmail} onChange={e => setShareEmail(e.target.value)}
                placeholder="Friend's email address"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none mb-3"
                style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
              <button onClick={shareTrip} className="w-full py-3 rounded-2xl text-sm font-bold"
                style={{ background: "linear-gradient(135deg,#4F46E5,#7C3AED)", color: "#fff" }}>
                Share Trip
              </button>
              {/* Google Maps link */}
              <button onClick={() => window.open(`https://www.google.com/maps/dir/${(activeTrip?.stops || []).filter(s => s.lat).map(s => `${s.lat},${s.lng}`).join("/")}`, "_blank")}
                className="w-full mt-2 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
                style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)" }}>
                <Navigation className="w-4 h-4" /> Open in Google Maps
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}