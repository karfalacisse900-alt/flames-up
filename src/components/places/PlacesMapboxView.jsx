import React, { useEffect, useRef, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, MapPin, SlidersHorizontal } from "lucide-react";
import MapCategoryCarousel from "./MapCategoryCarousel";
import UserPinPopup from "./UserPinPopup";
import LocationPrivacyPanel from "./LocationPrivacyPanel";
import LocationDetailPanel from "./LocationDetailPanel";

// Category → Mapbox POI layer filter keywords
const CATEGORY_LAYERS = {
  food:        ["restaurant", "food", "fast-food", "bakery", "bar"],
  cafe:        ["cafe", "coffee"],
  park:        ["park", "garden", "nature", "playground"],
  events:      ["event", "stadium", "theatre", "concert", "entertainment"],
  hidden_spot: [],
  shopping:    ["shop", "store", "market", "mall", "clothing"],
  study_spot:  ["library", "school", "university", "college"],
  travel:      ["airport", "hotel", "transit", "bus", "train"],
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

export default function PlacesMapboxView({ onOpenPlace, user: userProp }) {
  const mapRef          = useRef(null);
  const mapInst         = useRef(null);
  const userMarkersRef  = useRef({});      // email → { marker, el }
  const selfMarkerRef   = useRef(null);    // single self-avatar marker
  const presenceSubRef  = useRef(null);
  const gpsWatchRef     = useRef(null);
  const dbThrottleRef   = useRef(null);
  // Store stable initial center — never update after first set
  const initCenterRef   = useRef(null);
  const tokenRef        = useRef(null);

  const [token,        setToken]        = useState(null);
  const [userLoc,      setUserLoc]      = useState(null);
  const [mapReady,     setMapReady]     = useState(false);
  const [error,        setError]        = useState(null);
  const [currentUser,  setCurrentUser]  = useState(userProp || null);
  const [myPresence,   setMyPresence]   = useState(null);
  const myPresenceRef  = useRef(null);

  const [selectedUserPresence, setSelectedUserPresence] = useState(null);
  const [popupCoords,           setPopupCoords]           = useState(null);
  const [selectedLocation,      setSelectedLocation]      = useState(null); // for detail panel

  const [activeCategories, setActiveCategories] = useState(["all"]);
  const [radius,            setRadius]            = useState(10);
  const [showRadiusPanel,   setShowRadiusPanel]   = useState(false);
  const [nearbyUsers,       setNearbyUsers]       = useState([]);

  // Keep ref in sync for callbacks
  useEffect(() => { myPresenceRef.current = myPresence; }, [myPresence]);

  // 1. Auth + token — run once
  useEffect(() => {
    if (!userProp) {
      base44.auth.me().then(setCurrentUser).catch(() => {});
    }
    base44.functions.invoke("mapboxToken", {})
      .then(res => {
        const t = res.data?.token || res.data;
        setToken(t);
        tokenRef.current = t;
      })
      .catch(() => setError("Could not load map token"));
  }, []);

  // 2. GPS — one-time to get initial center, then watch but DON'T re-init map
  useEffect(() => {
    if (!navigator.geolocation) {
      const fallback = [-74.006, 40.7128];
      setUserLoc(fallback);
      initCenterRef.current = fallback;
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc = [pos.coords.longitude, pos.coords.latitude];
        setUserLoc(loc);
        if (!initCenterRef.current) initCenterRef.current = loc;
      },
      () => {
        const fallback = [-74.006, 40.7128];
        setUserLoc(fallback);
        initCenterRef.current = fallback;
      },
      { enableHighAccuracy: true, maximumAge: 60000 }
    );
  }, []);

  // 3. Publish location — called manually, not as effect dep on myPresence
  const publishLocation = useCallback(async (lat, lng) => {
    if (!currentUser) return;
    const pres = myPresenceRef.current;
    const data = {
      user_email: currentUser.email,
      user_name: currentUser.full_name || currentUser.email,
      avatar_url: currentUser.avatar_url || "",
      location_lat: lat,
      location_lng: lng,
      expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      is_visible: pres?.visibility_mode !== "invisible",
      visibility_mode: pres?.visibility_mode || "everyone",
      status_message: pres?.status_message || "",
    };
    try {
      const existing = await base44.entities.LocationPresence.filter({ user_email: currentUser.email });
      if (existing.length > 0) {
        await base44.entities.LocationPresence.update(existing[0].id, data);
        setMyPresence(prev => ({ ...existing[0], ...prev, ...data, id: existing[0].id }));
      } else {
        const created = await base44.entities.LocationPresence.create(data);
        setMyPresence(created);
      }
    } catch (e) {
      console.error("Location publish error:", e);
    }
  }, [currentUser]);

  // 4. Start GPS watch + initial publish ONCE when user+loc ready
  const gpsStartedRef = useRef(false);
  useEffect(() => {
    if (!currentUser || !userLoc || gpsStartedRef.current) return;
    gpsStartedRef.current = true;
    publishLocation(userLoc[1], userLoc[0]);

    if (!navigator.geolocation) return;
    gpsWatchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lng = pos.coords.longitude;
        const lat = pos.coords.latitude;
        setUserLoc([lng, lat]);
        // Throttle DB writes to every 30s
        clearTimeout(dbThrottleRef.current);
        dbThrottleRef.current = setTimeout(() => publishLocation(lat, lng), 30000);

        // Smoothly move self marker on map without re-init
        if (selfMarkerRef.current) {
          selfMarkerRef.current.setLngLat([lng, lat]);
        }
      },
      null,
      { enableHighAccuracy: true, maximumAge: 15000 }
    );
    return () => {
      if (gpsWatchRef.current) navigator.geolocation.clearWatch(gpsWatchRef.current);
      clearTimeout(dbThrottleRef.current);
    };
  }, [currentUser?.email, !!userLoc]);

  // 5. Subscribe to other users' presences
  useEffect(() => {
    const fetchPresences = async () => {
      const all = await base44.entities.LocationPresence.list("-updated_date", 100);
      const now = new Date();
      const active = all.filter(p => {
        if (!p.expires_at || new Date(p.expires_at) < now) return false;
        if (p.visibility_mode === "invisible" || p.is_visible === false) return false;
        return true;
      });
      setNearbyUsers(active);
    };
    fetchPresences();
    presenceSubRef.current = base44.entities.LocationPresence.subscribe(() => fetchPresences());
    return () => { if (presenceSubRef.current) presenceSubRef.current(); };
  }, []);

  // 6. Init map ONCE — use initCenterRef, never re-run on GPS updates
  useEffect(() => {
    if (!token || !initCenterRef.current || !mapRef.current || mapInst.current) return;
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
        center: initCenterRef.current,
        zoom: 14,
        pitch: 0, bearing: 0,
        attributionControl: false,
      });

      map.addControl(new mbgl.NavigationControl({ showCompass: false }), "bottom-right");

      map.on("load", () => {
        if (destroyed) return;
        map.touchZoomRotate.enableRotation();
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
    };
  }, [token, !!initCenterRef.current]);

  // 7. Self avatar marker — update position without re-creating
  useEffect(() => {
    const map = mapInst.current;
    if (!map || !mapReady || !userLoc || !window.mapboxgl) return;

    const [lng, lat] = userLoc;
    const mbgl = window.mapboxgl;

    if (selfMarkerRef.current) {
      selfMarkerRef.current.setLngLat([lng, lat]);
      return;
    }

    // Build avatar element
    const el = document.createElement("div");
    el.style.cssText = `
      width: 48px; height: 48px; border-radius: 50%; position: relative;
      cursor: default; z-index: 10;
    `;

    // Pulse ring
    const ring = document.createElement("div");
    ring.style.cssText = `
      position: absolute; top: -8px; left: -8px;
      width: 64px; height: 64px; border-radius: 50%;
      border: 2.5px solid rgba(79,70,229,0.45);
      animation: selfPulse 2.2s ease-in-out infinite;
      pointer-events: none;
    `;
    el.appendChild(ring);

    // Avatar circle
    const avatar = document.createElement("div");
    avatar.style.cssText = `
      width: 48px; height: 48px; border-radius: 50%;
      border: 3px solid #4F46E5;
      box-shadow: 0 4px 16px rgba(79,70,229,0.45);
      overflow: hidden; background: linear-gradient(135deg, #4F46E5, #7C3AED);
      display: flex; align-items: center; justify-content: center;
      font-size: 15px; font-weight: 700; color: white;
    `;

    if (currentUser?.avatar_url) {
      const img = document.createElement("img");
      img.src = currentUser.avatar_url;
      img.style.cssText = "width:100%;height:100%;object-fit:cover;";
      img.onerror = () => { img.remove(); avatar.textContent = getInitials(currentUser?.full_name); };
      avatar.appendChild(img);
    } else {
      avatar.textContent = getInitials(currentUser?.full_name);
    }
    el.appendChild(avatar);

    selfMarkerRef.current = new mbgl.Marker({ element: el, anchor: "center" })
      .setLngLat([lng, lat])
      .addTo(map);
  }, [mapReady, userLoc, currentUser?.email]);

  // 8. Other users' markers — add/remove/move only what changed
  useEffect(() => {
    const map = mapInst.current;
    if (!map || !mapReady || !window.mapboxgl) return;
    const mbgl = window.mapboxgl;
    const [userLng, userLat] = userLoc || [0, 0];
    const emailsInData = new Set();

    nearbyUsers.forEach(p => {
      if (!p.location_lat || !p.location_lng) return;
      if (p.user_email === currentUser?.email) return; // self handled separately
      if (userLoc) {
        const dist = haversineKm(userLat, userLng, p.location_lat, p.location_lng);
        if (dist > radius) return;
      }
      emailsInData.add(p.user_email);

      // Update position if exists
      if (userMarkersRef.current[p.user_email]) {
        userMarkersRef.current[p.user_email].marker.setLngLat([p.location_lng, p.location_lat]);
        return;
      }

      // Create new marker
      const el = document.createElement("div");
      el.style.cssText = `
        width: 40px; height: 40px; border-radius: 50%;
        border: 2.5px solid #FFFFFF;
        box-shadow: 0 4px 16px rgba(0,0,0,0.22);
        cursor: pointer; overflow: hidden;
        background: linear-gradient(135deg, #7C3AED, #4F46E5);
        display: flex; align-items: center; justify-content: center;
        font-size: 13px; font-weight: 700; color: white;
        transition: transform 0.15s ease;
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

      el.addEventListener("mouseenter", () => { el.style.transform = "scale(1.1)"; });
      el.addEventListener("mouseleave", () => { el.style.transform = "scale(1)"; });
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        const mapEl = mapRef.current;
        const mapRect = mapEl?.getBoundingClientRect();
        const pt = map.project([p.location_lng, p.location_lat]);
        setPopupCoords({ x: pt.x, y: pt.y });
        setSelectedUserPresence(p);
        setSelectedLocation(null);
      });

      const marker = new mbgl.Marker({ element: el, anchor: "center" })
        .setLngLat([p.location_lng, p.location_lat])
        .addTo(map);

      userMarkersRef.current[p.user_email] = { marker, el };
    });

    // Remove stale markers
    Object.entries(userMarkersRef.current).forEach(([email, { marker }]) => {
      if (!emailsInData.has(email)) {
        marker.remove();
        delete userMarkersRef.current[email];
      }
    });
  }, [nearbyUsers, mapReady, radius, currentUser?.email]);

  // 9. Category POI filter
  useEffect(() => {
    const map = mapInst.current;
    if (!map || !mapReady) return;
    if (activeCategories.includes("all")) {
      if (map.getLayer("poi-label")) map.setFilter("poi-label", null);
      return;
    }
    const keywords = activeCategories.flatMap(cat => CATEGORY_LAYERS[cat] || []);
    if (keywords.length === 0) return;
    const filter = ["any", ...keywords.map(kw => ["in", kw, ["get", "class"]])];
    if (map.getLayer("poi-label")) map.setFilter("poi-label", filter);
  }, [activeCategories, mapReady]);

  // POI click — fetch Mapbox Places API for address/phone/hours
  const setupPOIClickHandler = (map, mbgl) => {
    map.on("click", async (e) => {
      // Don't intercept user marker clicks
      const features = map.queryRenderedFeatures(e.point, { layers: ["poi-label"] });
      if (features.length === 0) return;

      const poi = features[0];
      const name = poi.properties.name;
      if (!name) return;

      const coords = poi.geometry.coordinates;
      const [lng, lat] = Array.isArray(coords[0]) ? coords[0] : coords;

      setSelectedUserPresence(null);
      setPopupCoords(null);

      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=poi&access_token=${mbgl.accessToken}&limit=1`
        );
        const data = await res.json();
        const feat = data.features[0];
        const context = feat?.context || [];
        const city    = context.find(c => c.id.startsWith("place"))?.text;
        const region  = context.find(c => c.id.startsWith("region"))?.text;
        const country = context.find(c => c.id.startsWith("country"))?.text;
        const address = feat?.place_name || "";
        const phone   = feat?.properties?.tel || feat?.properties?.phone || null;
        const website = feat?.properties?.website || null;
        const hours   = feat?.properties?.["opening_hours"] || null;

        const locationData = {
          name,
          category: poi.properties.class || poi.properties.type,
          city, region, country, lat, lng,
          address,
          phone,
          website,
          hours,
        };

        setSelectedLocation(locationData);
        // Also call the parent handler for PlaceHub
        onOpenPlace(locationData);
      } catch {
        const locationData = { name, lat, lng, category: poi.properties.class };
        setSelectedLocation(locationData);
        onOpenPlace(locationData);
      }
    });

    map.on("mouseenter", "poi-label", () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", "poi-label", () => { map.getCanvas().style.cursor = ""; });
  };

  function getInitials(name) {
    return (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  }

  if (error) return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <MapPin className="w-10 h-10" style={{ color: "var(--text-hint)" }} />
      <p className="text-sm" style={{ color: "var(--text-hint)" }}>{error}</p>
    </div>
  );

  return (
    <div style={{ height: "100%", position: "relative", overflow: "hidden" }}>
      <style>{`
        @keyframes selfPulse {
          0%, 100% { transform: scale(1); opacity: 0.55; }
          50% { transform: scale(1.35); opacity: 0.15; }
        }
      `}</style>

      {/* Category carousel */}
      {mapReady && (
        <MapCategoryCarousel active={activeCategories} onChange={setActiveCategories} />
      )}

      {/* Radius button */}
      {mapReady && (
        <div className="absolute top-16 right-3 z-20">
          <button
            onClick={() => setShowRadiusPanel(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold"
            style={{
              backgroundColor: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
              border: "1px solid rgba(0,0,0,0.08)",
              color: "#0F172A",
            }}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {radius}km
          </button>
          {showRadiusPanel && (
            <div
              className="absolute top-full right-0 mt-1.5 rounded-2xl overflow-hidden py-1"
              style={{
                backgroundColor: "rgba(255,255,255,0.98)",
                backdropFilter: "blur(20px)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                border: "1px solid rgba(0,0,0,0.08)",
                minWidth: 100,
              }}
            >
              {RADIUS_OPTIONS.map(r => (
                <button key={r} onClick={() => { setRadius(r); setShowRadiusPanel(false); }}
                  className="w-full px-4 py-2.5 text-left text-xs font-bold"
                  style={{
                    backgroundColor: radius === r ? "#EEF2FF" : "transparent",
                    color: radius === r ? "#4F46E5" : "#0F172A",
                  }}>
                  {r} km
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Online count badge */}
      {mapReady && nearbyUsers.filter(u => u.user_email !== currentUser?.email).length > 0 && (
        <div
          className="absolute top-16 left-3 z-20 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold"
          style={{
            backgroundColor: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
            color: "#16A34A",
          }}
        >
          <div className="w-2 h-2 rounded-full bg-green-500" />
          {nearbyUsers.filter(u => u.user_email !== currentUser?.email).length} nearby
        </div>
      )}

      {/* Privacy panel */}
      {mapReady && currentUser && (
        <LocationPrivacyPanel
          user={currentUser}
          presence={myPresence}
          onUpdate={(updates) => setMyPresence(prev => ({ ...(prev || {}), ...updates }))}
        />
      )}

      {/* User popup */}
      {selectedUserPresence && popupCoords && (
        <div
          className="absolute z-30"
          style={{
            left: Math.min(Math.max(popupCoords.x - 110, 8), (mapRef.current?.clientWidth || 400) - 228),
            top: Math.max(popupCoords.y - 200, 60),
            pointerEvents: "auto",
          }}
        >
          <UserPinPopup
            presence={selectedUserPresence}
            currentUser={currentUser}
            onClose={() => { setSelectedUserPresence(null); setPopupCoords(null); }}
          />
        </div>
      )}

      {/* Map canvas */}
      <div ref={mapRef} style={{ height: "100%", width: "100%" }} />

      {/* Loading overlay */}
      {!mapReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-20"
          style={{ backgroundColor: "var(--bg-app)" }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--accent-primary)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--text-hint)" }}>Loading map…</p>
        </div>
      )}
    </div>
  );
}