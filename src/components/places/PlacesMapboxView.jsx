import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, MapPin, SlidersHorizontal, X, Users, ArrowLeft, Search, Navigation } from "lucide-react";
import ProximityNotifier from "@/components/friends/ProximityNotifier";
import CreatorMapMarkers from "@/components/creators/CreatorMapMarkers";
import MapCategoryCarousel from "./MapCategoryCarousel";
import UserPinPopup from "./UserPinPopup";
import LocationPrivacyPanel from "./LocationPrivacyPanel";
import PlaceHub from "@/components/community/PlaceHub";
import NearbyPeopleModal from "./NearbyPeopleModal";

const CATEGORY_LAYERS = {
  restaurant:   ["restaurant"],
  cafe:         ["cafe", "coffee"],
  fast_food:    ["fast-food", "fast_food"],
  park:         ["park", "garden", "nature", "playground"],
  shopping:     ["shop", "store", "market", "mall", "clothing"],
  grocery:      ["grocery", "supermarket"],
  gas:          ["gas_station", "fuel", "gas-station"],
  hotel:        ["hotel", "lodging"],
  bar:          ["bar", "nightclub"],
  hospital:     ["hospital", "clinic", "medical"],
  pharmacy:     ["pharmacy", "drugstore"],
  entertainment:["entertainment", "cinema", "theatre", "stadium"],
  gym:          ["gym", "fitness", "sport"],
  study_spot:   ["library", "school", "university", "college"],
  travel:       ["airport", "transit", "bus", "train"],
  bank:         ["bank", "atm"],
  school:       ["school", "university", "college"],
  church:       ["place_of_worship", "church"],
  parking:      ["parking"],
  spa:          ["spa", "beauty"],
  airport:      ["airport"],
  events:       ["event", "concert"],
  hidden_spot:  [],
  food:         ["restaurant", "food", "fast-food", "bakery"],
};

const RADIUS_OPTIONS = [1, 5, 10, 25];

function haversineKm(lat1, lng1, lat2, lng2) {
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

function getInitials(name) {
  return (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function PlacesMapboxView({ onOpenPlace, user: userProp, onBack }) {
  const mapRef         = useRef(null);
  const mapInst        = useRef(null);
  const selfMarkerRef  = useRef(null);
  const userMarkersRef = useRef({});
  const presenceSubRef = useRef(null);
  const gpsWatchRef    = useRef(null);
  const dbThrottleRef  = useRef(null);
  const myPresenceRef  = useRef(null);

  const [token,        setToken]        = useState(null);
  const [initCenter,   setInitCenter]   = useState(null); // reactive, used for map init
  const [userLoc,      setUserLoc]      = useState(null);
  const [mapReady,     setMapReady]     = useState(false);
  const [error,        setError]        = useState(null);
  const [currentUser,  setCurrentUser]  = useState(null);
  const [myPresence,   setMyPresence]   = useState(null);
  const [nearbyUsers,  setNearbyUsers]  = useState([]);

  const [activeCategories,   setActiveCategories]   = useState(["all"]);
  const [radius,              setRadius]              = useState(10);
  const [showRadiusPanel,     setShowRadiusPanel]     = useState(false);
  const [selectedUserPresence, setSelectedUserPresence] = useState(null);
  const [popupCoords,          setPopupCoords]          = useState(null);
  const [showNearbyModal,      setShowNearbyModal]      = useState(false);
  const [follows,              setFollows]              = useState([]);

  // Search
  const [searchQuery,      setSearchQuery]      = useState("");
  const [searchResults,    setSearchResults]    = useState([]);
  const [searchLoading,    setSearchLoading]    = useState(false);
  const [showSearch,       setShowSearch]       = useState(false);
  const searchDebounceRef  = useRef(null);
  const searchPinRef       = useRef(null);
  const searchInputRef     = useRef(null);

  const handleSearchInput = (val) => {
    setSearchQuery(val);
    setShowSearch(true);
    clearTimeout(searchDebounceRef.current);
    if (!val.trim()) { setSearchResults([]); return; }
    searchDebounceRef.current = setTimeout(async () => {
      if (!token) return;
      setSearchLoading(true);
      try {
        const center = userLoc ? `&proximity=${userLoc[0]},${userLoc[1]}` : "";
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(val)}.json?access_token=${token}&types=poi,address,place&limit=5${center}`
        );
        const data = await res.json();
        setSearchResults(data.features || []);
      } catch {}
      setSearchLoading(false);
    }, 350);
  };

  const handleSelectResult = (feat) => {
    setShowSearch(false);
    setSearchQuery(feat.text || feat.place_name?.split(",")[0] || "");
    setSearchResults([]);
    const [lng, lat] = feat.center || [];
    if (!lng || !lat || !mapInst.current || !window.mapboxgl) return;
    mapInst.current.flyTo({ center: [lng, lat], zoom: 15, duration: 900 });
    if (searchPinRef.current) { searchPinRef.current.remove(); searchPinRef.current = null; }
    const el = document.createElement("div");
    el.style.cssText = "width:28px;height:36px;background:#4F46E5;border-radius:50% 50% 50% 0;transform:rotate(-45deg);";
    searchPinRef.current = new window.mapboxgl.Marker({ element: el, anchor: "bottom" })
      .setLngLat([lng, lat])
      .addTo(mapInst.current);
  };

  // Load follows for friend prioritization
  useEffect(() => {
    if (!currentUser?.email) return;
    base44.entities.Follow.filter({ follower_email: currentUser.email })
      .then(rows => setFollows(rows.map(r => r.following_email)))
      .catch(() => {});
  }, [currentUser?.email]);
  // Location detail — shown as bottom sheet inside map
  const [selectedPlace,    setSelectedPlace]    = useState(null);
  const [showPlaceHub,     setShowPlaceHub]     = useState(false);

  useEffect(() => { myPresenceRef.current = myPresence; }, [myPresence]);

  // ── 1. Load user + token + avatar ──────────────────────────────────────
  useEffect(() => {
    const loadUser = async () => {
      try {
        const u = userProp || await base44.auth.me();
        if (!u) return;
        // Fetch avatar from UserProfile entity
        const profiles = await base44.entities.UserProfile.filter({ user_email: u.email });
        const avatar = profiles[0]?.avatar_url || u.avatar_url || "";
        setCurrentUser({ ...u, avatar_url: avatar });
      } catch {}
    };
    loadUser();

    base44.functions.invoke("mapboxToken", {})
      .then(res => setToken(res.data?.token || res.data))
      .catch(() => setError("Could not load map token"));
  }, []);

  // ── 2. GPS — one-time for initial center ───────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      const fb = [-74.006, 40.7128];
      setUserLoc(fb);
      setInitCenter(fb);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc = [pos.coords.longitude, pos.coords.latitude];
        setUserLoc(loc);
        setInitCenter(loc);
      },
      () => {
        const fb = [-74.006, 40.7128];
        setUserLoc(fb);
        setInitCenter(fb);
      },
      { enableHighAccuracy: true, maximumAge: 60000 }
    );
  }, []);

  // ── 3. Init map ONCE when token + initCenter ready ────────────────────
  useEffect(() => {
    if (!token || !initCenter || !mapRef.current || mapInst.current) return;
    let destroyed = false;

    const init = async () => {
      if (!document.getElementById("mapbox-gl-css")) {
        const link = document.createElement("link");
        link.id = "mapbox-gl-css"; link.rel = "stylesheet";
        link.href = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css";
        document.head.appendChild(link);
      }
      if (!window.mapboxgl) {
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js";
          s.onload = resolve; s.onerror = reject;
          document.head.appendChild(s);
        });
      }
      if (destroyed) return;

      const mbgl = window.mapboxgl;
      mbgl.accessToken = token;

      const map = new mbgl.Map({
        container: mapRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: initCenter,
        zoom: 14,
        pitch: 0, bearing: 0,
        attributionControl: false,
      });

      map.addControl(new mbgl.NavigationControl({ showCompass: false }), "bottom-right");

      map.on("load", () => {
        if (destroyed) return;
        map.dragRotate.disable();
        map.touchPitch.disable();
        setupPOIClickHandler(map, mbgl);
        setMapReady(true);
      });

      mapInst.current = map;
    };

    init().catch(() => setError("Map failed to load"));
    return () => {
      destroyed = true;
      if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; }
      if (searchPinRef.current) { searchPinRef.current.remove(); searchPinRef.current = null; }
    };
  }, [token, initCenter]);

  // ── 4. GPS watch — only moves markers, no map re-init ─────────────────
  const gpsStartedRef = useRef(false);
  useEffect(() => {
    if (!currentUser || !userLoc || gpsStartedRef.current) return;
    gpsStartedRef.current = true;

    // Initial DB publish
    publishLocation(userLoc[1], userLoc[0]);

    if (!navigator.geolocation) return;
    const MIN_MOVE_METERS = 10; // ignore jitter smaller than 10m
    let lastLat = userLoc[1], lastLng = userLoc[0];

    gpsWatchRef.current = navigator.geolocation.watchPosition(
      pos => {
        const { longitude: lng, latitude: lat, accuracy } = pos.coords;
        // Filter out low-accuracy or tiny-jitter updates
        if (accuracy > 80) return;
        const dLat = (lat - lastLat) * 111320;
        const dLng = (lng - lastLng) * 111320 * Math.cos(lat * Math.PI / 180);
        const movedM = Math.sqrt(dLat * dLat + dLng * dLng);
        if (movedM < MIN_MOVE_METERS) return;
        lastLat = lat; lastLng = lng;
        setUserLoc([lng, lat]);
        if (selfMarkerRef.current) selfMarkerRef.current.setLngLat([lng, lat]);
        clearTimeout(dbThrottleRef.current);
        dbThrottleRef.current = setTimeout(() => publishLocation(lat, lng), 30000);
      },
      null,
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
    return () => {
      if (gpsWatchRef.current) navigator.geolocation.clearWatch(gpsWatchRef.current);
      clearTimeout(dbThrottleRef.current);
    };
  }, [!!currentUser, !!userLoc]);

  function publishLocation(lat, lng) {
    const u = currentUser;
    const pres = myPresenceRef.current;
    if (!u) return;
    const data = {
      user_email: u.email,
      user_name: u.full_name || u.email,
      avatar_url: u.avatar_url || "",
      location_lat: lat,
      location_lng: lng,
      expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      is_visible: pres?.visibility_mode !== "invisible",
      visibility_mode: pres?.visibility_mode || "everyone",
      status_message: pres?.status_message || "",
    };
    base44.entities.LocationPresence.filter({ user_email: u.email }).then(existing => {
      if (existing.length > 0) {
        base44.entities.LocationPresence.update(existing[0].id, data)
          .then(() => setMyPresence(prev => ({ ...(prev || {}), ...data, id: existing[0].id })));
      } else {
        base44.entities.LocationPresence.create(data).then(setMyPresence);
      }
    }).catch(e => console.error("publish error", e));
  }

  // ── 5. Subscribe to presences ──────────────────────────────────────────
  const [creatorEmails, setCreatorEmails] = useState(new Set());

  useEffect(() => {
    // Load approved creator emails so we can hide their regular presence pin
    base44.entities.Creator.filter({ approval_status: "approved" })
      .then(rows => setCreatorEmails(new Set(rows.map(r => r.user_email).filter(Boolean))))
      .catch(() => {});
    const unsub = base44.entities.Creator.subscribe(() => {
      base44.entities.Creator.filter({ approval_status: "approved" })
        .then(rows => setCreatorEmails(new Set(rows.map(r => r.user_email).filter(Boolean))))
        .catch(() => {});
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const fetch = async () => {
      const all = await base44.entities.LocationPresence.list("-updated_date", 100);
      const now = new Date();
      setNearbyUsers(all.filter(p =>
        p.expires_at && new Date(p.expires_at) > now &&
        p.visibility_mode !== "invisible" && p.is_visible !== false
      ));
    };
    fetch();
    // Throttle real-time subscription — max one map re-render per 5s
    let throttleTimer = null;
    presenceSubRef.current = base44.entities.LocationPresence.subscribe(() => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        throttleTimer = null;
        fetch();
      }, 5000);
    });
    return () => {
      if (presenceSubRef.current) presenceSubRef.current();
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, []);

  // ── 6. Self location — fixed-size blue dot (never scales with zoom) ────
  useEffect(() => {
    const map = mapInst.current;
    if (!map || !mapReady || !userLoc || !window.mapboxgl) return;

    if (currentUser?.email && creatorEmails.has(currentUser.email)) {
      if (selfMarkerRef.current) { selfMarkerRef.current.remove(); selfMarkerRef.current = null; }
      return;
    }

    const [lng, lat] = userLoc;

    if (selfMarkerRef.current) {
      selfMarkerRef.current.setLngLat([lng, lat]);
      return;
    }

    // Outer wrapper — fixed pixel size, never scales
    const wrapper = document.createElement("div");
    wrapper.style.cssText = "position:relative; width:22px; height:22px; flex-shrink:0;";

    // Accuracy halo — soft pulsing circle
    const halo = document.createElement("div");
    halo.style.cssText = `
      position:absolute;
      top:50%; left:50%;
      transform:translate(-50%, -50%);
      width:44px; height:44px;
      border-radius:50%;
      background:rgba(37,99,235,0.15);
      pointer-events:none;
      animation:blueDotPulse 2.4s ease-in-out infinite;
    `;
    wrapper.appendChild(halo);

    // White border ring
    const ring = document.createElement("div");
    ring.style.cssText = `
      position:absolute;
      top:50%; left:50%;
      transform:translate(-50%, -50%);
      width:18px; height:18px;
      border-radius:50%;
      background:white;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
      pointer-events:none;
    `;
    wrapper.appendChild(ring);

    // Blue solid dot
    const dot = document.createElement("div");
    dot.style.cssText = `
      position:absolute;
      top:50%; left:50%;
      transform:translate(-50%, -50%);
      width:12px; height:12px;
      border-radius:50%;
      background:#2563EB;
      box-shadow:0 2px 6px rgba(37,99,235,0.6);
      pointer-events:none;
    `;
    wrapper.appendChild(dot);

    selfMarkerRef.current = new window.mapboxgl.Marker({ element: wrapper, anchor: "center" })
      .setLngLat([lng, lat])
      .addTo(map);
  }, [mapReady, !!userLoc, currentUser?.email, creatorEmails]);

  // ── 7. Other user markers — smart-limited (max 12, friends first) ────────
  const MAP_PIN_LIMIT = 15;
  const friendSet = new Set(follows);

  const mapPins = useMemo(() => {
    const [uLng, uLat] = userLoc || [0, 0];
    // Only show friends on the map (non-friends are hidden from map, only in Nearby modal)
    const candidates = nearbyUsers
      .filter(p => p.location_lat && p.location_lng && p.user_email !== currentUser?.email)
      .filter(p => !creatorEmails.has(p.user_email)) // creators have their own orange pin
      .filter(p => friendSet.has(p.user_email)) // friends only on map
      .filter(p => !userLoc || haversineKm(uLat, uLng, p.location_lat, p.location_lng) <= radius)
      .map(p => ({
        ...p,
        _dist: haversineKm(uLat, uLng, p.location_lat, p.location_lng),
        _isFriend: true,
      }))
      .sort((a, b) => a._dist - b._dist);
    return candidates.slice(0, MAP_PIN_LIMIT);
  }, [nearbyUsers, userLoc, radius, currentUser?.email, follows]);

  const extraNearby = useMemo(() => {
    const [uLng, uLat] = userLoc || [0, 0];
    const total = nearbyUsers.filter(p =>
      p.location_lat && p.location_lng &&
      p.user_email !== currentUser?.email &&
      (!userLoc || haversineKm(uLat, uLng, p.location_lat, p.location_lng) <= radius)
    ).length;
    return Math.max(0, total - MAP_PIN_LIMIT);
  }, [nearbyUsers, userLoc, radius, currentUser?.email]);

  useEffect(() => {
    const map = mapInst.current;
    if (!map || !mapReady || !window.mapboxgl) return;
    const activeEmails = new Set();

    mapPins.forEach(p => {
      activeEmails.add(p.user_email);

      if (userMarkersRef.current[p.user_email]) {
        userMarkersRef.current[p.user_email].setLngLat([p.location_lng, p.location_lat]);
        return;
      }

      const el = document.createElement("div");
      el.style.cssText = `
        width:42px; height:42px; border-radius:50%;
        border:2.5px solid #fff;
        box-shadow:0 3px 14px rgba(0,0,0,0.22);
        cursor:pointer; overflow:hidden;
        background:linear-gradient(135deg,#7C3AED,#4F46E5);
        display:flex; align-items:center; justify-content:center;
        font-size:13px; font-weight:700; color:white;
      `;
      if (p.avatar_url) {
        const img = document.createElement("img");
        img.src = p.avatar_url;
        img.style.cssText = "width:100%;height:100%;object-fit:cover;";
        img.onerror = () => { img.remove(); el.textContent = getInitials(p.user_name); };
        el.appendChild(img);
      } else {
        el.textContent = getInitials(p.user_name);
      }

      el.addEventListener("click", e => {
        e.stopPropagation();
        const pt = map.project([p.location_lng, p.location_lat]);
        setPopupCoords({ x: pt.x, y: pt.y });
        setSelectedUserPresence(p);
      });

      const marker = new window.mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([p.location_lng, p.location_lat])
        .addTo(map);
      userMarkersRef.current[p.user_email] = marker;
    });

    // Remove stale
    Object.keys(userMarkersRef.current).forEach(email => {
      if (!activeEmails.has(email)) {
        userMarkersRef.current[email].remove();
        delete userMarkersRef.current[email];
      }
    });
  }, [mapPins, mapReady]);

  // ── 8. Category filter ─────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInst.current;
    if (!map || !mapReady) return;
    if (activeCategories.includes("all")) {
      if (map.getLayer("poi-label")) map.setFilter("poi-label", null);
      return;
    }
    const keywords = activeCategories.flatMap(cat => CATEGORY_LAYERS[cat] || []);
    if (!keywords.length) return;
    const filter = ["any", ...keywords.map(kw => ["in", kw, ["get", "class"]])];
    if (map.getLayer("poi-label")) map.setFilter("poi-label", filter);
  }, [activeCategories, mapReady]);

  // ── POI click handler ──────────────────────────────────────────────────
  function setupPOIClickHandler(map, mbgl) {
    map.on("click", async e => {
      const features = map.queryRenderedFeatures(e.point, { layers: ["poi-label"] });
      if (!features.length) return;
      const poi = features[0];
      const name = poi.properties?.name;
      if (!name) return;

      const coords = poi.geometry.coordinates;
      const [lng, lat] = Array.isArray(coords[0]) ? coords[0] : coords;

      setSelectedUserPresence(null);

      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=poi&access_token=${mbgl.accessToken}&limit=1`
        );
        const data = await res.json();
        const feat    = data.features[0];
        const context = feat?.context || [];
        const city    = context.find(c => c.id.startsWith("place"))?.text;
        const region  = context.find(c => c.id.startsWith("region"))?.text;
        const country = context.find(c => c.id.startsWith("country"))?.text;
        const address = feat?.place_name || "";
        const phone   = feat?.properties?.tel || feat?.properties?.phone || null;
        const website = feat?.properties?.website || null;
        const hours   = feat?.properties?.["opening_hours"] || null;

        const place = { name, category: poi.properties.class, city, region, country, lat, lng, address, phone, website, hours };
        setSelectedPlace(place);
        setShowPlaceHub(false); // start with quick detail, user can expand
      } catch {
        setSelectedPlace({ name, lat, lng, category: poi.properties.class });
        setShowPlaceHub(false);
      }
    });
    map.on("mouseenter", "poi-label", () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", "poi-label", () => { map.getCanvas().style.cursor = ""; });
  }

  if (error) return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <MapPin className="w-10 h-10" style={{ color: "var(--text-hint)" }} />
      <p className="text-sm" style={{ color: "var(--text-hint)" }}>{error}</p>
    </div>
  );

  return (
    <div style={{ height: "100%", width: "100%", position: "relative", overflow: "hidden" }}>
      <style>{`
        @keyframes blueDotPulse {
          0%,100%{transform:translate(-50%,-50%) scale(1);opacity:0.6;}
          50%{transform:translate(-50%,-50%) scale(1.6);opacity:0.15;}
        }
      `}</style>

      {/* Back to Places button */}
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-3 left-3 z-30 flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-bold"
          style={{ backgroundColor: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", boxShadow: "0 2px 12px rgba(0,0,0,0.15)", color: "#0F172A" }}
        >
          <ArrowLeft className="w-4 h-4" /> Places
        </button>
      )}

      {/* Proximity notifier (invisible) */}
      <ProximityNotifier currentUser={currentUser} userLoc={userLoc} followedEmails={follows} />

      {/* Street Creator markers */}
      {mapReady && <CreatorMapMarkers map={mapInst.current} mapReady={mapReady} currentUserEmail={currentUser?.email} />}

      {/* Search bar */}
      {mapReady && (
        <div className="absolute z-20" style={{ top: 16, left: onBack ? 90 : 12, right: 12 }}>
          <div className="relative">
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-2xl"
              style={{
                backgroundColor: "rgba(255,255,255,0.97)",
                backdropFilter: "blur(16px)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <Search className="w-4 h-4 shrink-0" style={{ color: "#94A3B8" }} />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={e => handleSearchInput(e.target.value)}
                onFocus={() => setShowSearch(true)}
                placeholder="Search places, cafes, parks…"
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: "#0F172A", border: "none", minHeight: "unset", boxShadow: "none", fontSize: 14, padding: 0 }}
              />
              {searchLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: "#94A3B8" }} />}
              {searchQuery && !searchLoading && (
                <button onClick={() => { setSearchQuery(""); setSearchResults([]); setShowSearch(false); if (searchPinRef.current) { searchPinRef.current.remove(); searchPinRef.current = null; } }}
                  style={{ padding: 2 }}>
                  <X className="w-4 h-4" style={{ color: "#94A3B8" }} />
                </button>
              )}
            </div>

            {/* Search results dropdown */}
            {showSearch && searchResults.length > 0 && (
              <div
                className="absolute left-0 right-0 mt-2 rounded-2xl overflow-hidden"
                style={{ backgroundColor: "rgba(255,255,255,0.99)", backdropFilter: "blur(20px)", boxShadow: "0 12px 40px rgba(0,0,0,0.18)", border: "1px solid rgba(0,0,0,0.06)", zIndex: 50 }}
              >
                {searchResults.map((feat, i) => (
                  <button
                    key={feat.id || i}
                    onClick={() => handleSelectResult(feat)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left"
                    style={{ borderBottom: i < searchResults.length - 1 ? "1px solid #F1F5F9" : "none", backgroundColor: "transparent" }}
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#EEF2FF" }}>
                      <MapPin className="w-4 h-4" style={{ color: "#4F46E5" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "#0F172A" }}>{feat.text || feat.place_name?.split(",")[0]}</p>
                      <p className="text-xs truncate" style={{ color: "#94A3B8" }}>{feat.place_name}</p>
                    </div>
                    <Navigation className="w-4 h-4 shrink-0" style={{ color: "#CBD5E1" }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category carousel — sits below the search bar */}
      {mapReady && (
        <div className="absolute z-20" style={{ top: 68, left: 0, right: 0 }}>
          <MapCategoryCarousel active={activeCategories} onChange={setActiveCategories} />
        </div>
      )}

      {/* Radius + online badge row */}
      {mapReady && (
        <div className="absolute z-20 flex items-center justify-between px-3 pointer-events-none" style={{ top: 120, left: 0, right: 0 }}>
          <button
            onClick={() => setShowNearbyModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold pointer-events-auto"
            style={{ backgroundColor:"rgba(255,255,255,0.95)", backdropFilter:"blur(12px)", boxShadow:"0 2px 12px rgba(0,0,0,0.12)", color:"#0F172A" }}
          >
            <Users className="w-3.5 h-3.5" style={{ color:"#16A34A" }} />
            <span style={{ color:"#16A34A" }}>
              {mapPins.length > 0
                ? `${mapPins.length} nearby${extraNearby > 0 ? ` +${extraNearby} more` : ""}`
                : "Nearby People"}
            </span>
          </button>

          <div className="relative pointer-events-auto">
            <button onClick={() => setShowRadiusPanel(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ backgroundColor:"rgba(255,255,255,0.95)", backdropFilter:"blur(12px)", boxShadow:"0 2px 12px rgba(0,0,0,0.12)", border:"1px solid rgba(0,0,0,0.06)", color:"#0F172A" }}>
              <SlidersHorizontal className="w-3.5 h-3.5" />{radius}km
            </button>
            {showRadiusPanel && (
              <div className="absolute top-full right-0 mt-1.5 rounded-2xl overflow-hidden py-1"
                style={{ backgroundColor:"rgba(255,255,255,0.98)", backdropFilter:"blur(20px)", boxShadow:"0 8px 32px rgba(0,0,0,0.18)", minWidth:100 }}>
                {RADIUS_OPTIONS.map(r => (
                  <button key={r} onClick={() => { setRadius(r); setShowRadiusPanel(false); }}
                    className="w-full px-4 py-2.5 text-left text-xs font-bold"
                    style={{ backgroundColor: radius===r?"#EEF2FF":"transparent", color: radius===r?"#4F46E5":"#0F172A" }}>
                    {r} km
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Privacy panel */}
      {mapReady && currentUser && (
        <LocationPrivacyPanel user={currentUser} presence={myPresence}
          onUpdate={updates => setMyPresence(prev => ({ ...(prev||{}), ...updates }))} />
      )}

      {/* User pin popup */}
      {selectedUserPresence && popupCoords && (
        <div className="absolute z-30" style={{
          left: Math.min(Math.max(popupCoords.x - 110, 8), (mapRef.current?.clientWidth||400)-228),
          top: Math.max(popupCoords.y - 200, 70),
          pointerEvents:"auto",
        }}>
          <UserPinPopup presence={selectedUserPresence} currentUser={currentUser}
            onClose={() => { setSelectedUserPresence(null); setPopupCoords(null); }} />
        </div>
      )}

      {/* Location Quick Detail Bottom Sheet */}
      {selectedPlace && !showPlaceHub && (
        <LocationQuickCard
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
          onExpand={() => setShowPlaceHub(true)}
        />
      )}

      {/* Map canvas */}
      <div ref={mapRef} style={{ height:"100%", width:"100%", touchAction:"none" }} />

      {/* Loading */}
      {!mapReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-20"
          style={{ backgroundColor:"var(--bg-app)" }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color:"var(--accent-primary)" }} />
          <p className="text-sm font-medium" style={{ color:"var(--text-hint)" }}>Loading map…</p>
        </div>
      )}

      {/* Nearby People Modal */}
      {showNearbyModal && (
        <NearbyPeopleModal
          allUsers={nearbyUsers}
          userLoc={userLoc}
          currentUser={currentUser}
          followedEmails={follows}
          onClose={() => setShowNearbyModal(false)}
          onHighlight={presence => {
            setShowNearbyModal(false);
            if (mapInst.current && presence.location_lat && presence.location_lng) {
              mapInst.current.flyTo({
                center: [presence.location_lng, presence.location_lat],
                zoom: 16,
                duration: 800,
              });
              setTimeout(() => {
                if (!mapInst.current) return;
                const pt = mapInst.current.project([presence.location_lng, presence.location_lat]);
                setPopupCoords({ x: pt.x, y: pt.y });
                setSelectedUserPresence(presence);
              }, 850);
            }
          }}
        />
      )}

      {/* Full PlaceHub modal */}
      {showPlaceHub && selectedPlace && (
        <PlaceHub
          locationName={selectedPlace.name}
          locationData={selectedPlace}
          user={currentUser}
          onClose={() => { setShowPlaceHub(false); setSelectedPlace(null); }}
          onUpvote={() => {}}
        />
      )}
    </div>
  );
}

// ── Inline quick-card ──────────────────────────────────────────────────────
function LocationQuickCard({ place, onClose, onExpand }) {
  const categoryEmoji = {
    restaurant:"🍽️", food:"🍔", cafe:"☕", coffee:"☕",
    park:"🌳", garden:"🌿", shop:"🛍️", store:"🏪",
    library:"📚", school:"🏫", stadium:"🏟️", hotel:"🏨",
    airport:"✈️", transit:"🚌",
  }[place.category] || "📍";

  return (
    <div className="absolute bottom-4 left-3 right-3 z-30 rounded-3xl overflow-hidden"
      style={{ backgroundColor:"rgba(255,255,255,0.98)", backdropFilter:"blur(20px)", boxShadow:"0 16px 48px rgba(0,0,0,0.22)", border:"1px solid rgba(0,0,0,0.07)" }}>

      {/* Main info row */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor:"#F1F5F9" }}>
          {categoryEmoji}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base leading-tight truncate" style={{ color:"#0F172A", fontFamily:"var(--font-serif)" }}>
            {place.name}
          </h3>
          {(place.address || place.city) && (
            <p className="text-xs mt-0.5 truncate" style={{ color:"#64748B" }}>
              {place.address || [place.city, place.region, place.country].filter(Boolean).join(", ")}
            </p>
          )}
          {place.category && (
            <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
              style={{ backgroundColor:"#EEF2FF", color:"#4F46E5" }}>
              {place.category.replace(/-/g,"  ")}
            </span>
          )}
        </div>
        <button onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full shrink-0"
          style={{ backgroundColor:"#F1F5F9", minWidth:32, minHeight:32 }}>
          <X className="w-4 h-4" style={{ color:"#64748B" }} />
        </button>
      </div>

      {/* Quick details row */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
        {place.phone && (
          <a href={`tel:${place.phone}`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shrink-0"
            style={{ backgroundColor:"#F0FDF4", color:"#16A34A" }}>
            📞 {place.phone}
          </a>
        )}
        {place.website && (
          <a href={place.website.startsWith("http") ? place.website : `https://${place.website}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shrink-0"
            style={{ backgroundColor:"#EFF6FF", color:"#2563EB" }}>
            🌐 Website
          </a>
        )}
        {place.hours && (
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shrink-0"
            style={{ backgroundColor:"#FFFBEB", color:"#D97706" }}>
            🕐 {typeof place.hours === "string" ? place.hours : "See hours"}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 px-4 pb-4">
        <button
          onClick={() => {
            if (place.lat && place.lng) window.open(`https://www.google.com/maps?q=${place.lat},${place.lng}`, "_blank");
          }}
          className="flex-1 py-3 rounded-2xl text-sm font-bold"
          style={{ background:"linear-gradient(135deg,#4F46E5,#7C3AED)", color:"#fff", boxShadow:"0 4px 16px rgba(79,70,229,0.35)" }}>
          🧭 Directions
        </button>
        <button
          onClick={onExpand}
          className="flex-1 py-3 rounded-2xl text-sm font-bold"
          style={{ backgroundColor:"#F1F5F9", color:"#0F172A", border:"1px solid #E2E8F0" }}>
          📋 Posts & Photos
        </button>
      </div>
    </div>
  );
}