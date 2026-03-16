import React, { useEffect, useRef, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, MapPin, Layers, SlidersHorizontal } from "lucide-react";
import MapCategoryCarousel, { MAP_CATEGORIES } from "./MapCategoryCarousel";
import UserPinPopup from "./UserPinPopup";
import LocationPrivacyPanel from "./LocationPrivacyPanel";
import ReactDOM from "react-dom/client";

// Category → Mapbox POI layer keywords for filtering
const CATEGORY_LAYERS = {
  food:        ["restaurant", "food", "fast-food", "bakery"],
  cafe:        ["cafe", "coffee"],
  park:        ["park", "garden", "nature"],
  events:      ["event", "stadium", "theatre", "concert"],
  hidden_spot: [],
  shopping:    ["shop", "store", "market", "mall"],
  study_spot:  ["library", "school", "university"],
  travel:      ["airport", "hotel", "transit"],
};

// Radius options in km
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

export default function PlacesMapboxView({ onOpenPlace }) {
  const mapRef     = useRef(null);
  const mapInst    = useRef(null);
  const popupRef   = useRef(null);
  const userMarkersRef = useRef({}); // email -> marker
  const presenceSubRef = useRef(null);
  const gpsWatchRef = useRef(null);
  const locationUpdateTimerRef = useRef(null);

  const [token,      setToken]      = useState(null);
  const [userLoc,    setUserLoc]    = useState(null);
  const [mapReady,   setMapReady]   = useState(false);
  const [error,      setError]      = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [myPresence, setMyPresence] = useState(null);
  const [selectedUserPresence, setSelectedUserPresence] = useState(null);
  const [popupCoords, setPopupCoords] = useState(null); // {x, y}

  const [activeCategories, setActiveCategories] = useState(["all"]);
  const [radius, setRadius] = useState(10);
  const [showRadiusPanel, setShowRadiusPanel] = useState(false);
  const [nearbyUsers, setNearbyUsers] = useState([]);

  // 1. Auth + token
  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
    base44.functions.invoke("mapboxToken", {})
      .then(res => setToken(res.data?.token || res.data))
      .catch(() => setError("Could not load map token"));
  }, []);

  // 2. GPS — one-time initial, then watch for updates
  useEffect(() => {
    if (!navigator.geolocation) {
      setUserLoc([-74.006, 40.7128]);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => setUserLoc([pos.coords.longitude, pos.coords.latitude]),
      () => setUserLoc([-74.006, 40.7128]),
      { enableHighAccuracy: true, maximumAge: 30000 }
    );
  }, []);

  // 3. Publish/update own location presence
  const publishLocation = useCallback(async (lat, lng) => {
    if (!currentUser) return;
    try {
      const existing = await base44.entities.LocationPresence.filter({ user_email: currentUser.email });
      const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2h
      const data = {
        user_email: currentUser.email,
        user_name: currentUser.full_name || currentUser.email,
        avatar_url: currentUser.avatar_url || "",
        location_lat: lat,
        location_lng: lng,
        expires_at: expiresAt,
        is_visible: true,
        visibility_mode: myPresence?.visibility_mode || "everyone",
        status_message: myPresence?.status_message || "",
      };
      if (existing.length > 0) {
        await base44.entities.LocationPresence.update(existing[0].id, data);
        setMyPresence({ ...existing[0], ...data });
      } else {
        const created = await base44.entities.LocationPresence.create(data);
        setMyPresence(created);
      }
    } catch (e) {
      console.error("Location publish error:", e);
    }
  }, [currentUser, myPresence?.visibility_mode, myPresence?.status_message]);

  // Throttled location publisher via GPS watch
  useEffect(() => {
    if (!currentUser || !userLoc) return;
    publishLocation(userLoc[1], userLoc[0]);

    if (!navigator.geolocation) return;
    gpsWatchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const [lng, lat] = [pos.coords.longitude, pos.coords.latitude];
        setUserLoc([lng, lat]);
        // Throttle DB updates to every 30s
        clearTimeout(locationUpdateTimerRef.current);
        locationUpdateTimerRef.current = setTimeout(() => {
          publishLocation(lat, lng);
        }, 30000);
      },
      null,
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
    return () => {
      if (gpsWatchRef.current) navigator.geolocation.clearWatch(gpsWatchRef.current);
      clearTimeout(locationUpdateTimerRef.current);
    };
  }, [currentUser, userLoc?.join(",")]);

  // 4. Subscribe to other users' presences
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

    presenceSubRef.current = base44.entities.LocationPresence.subscribe(() => {
      fetchPresences();
    });
    return () => { if (presenceSubRef.current) presenceSubRef.current(); };
  }, []);

  // 5. Init Mapbox map
  useEffect(() => {
    if (!token || !userLoc || !mapRef.current || mapInst.current) return;
    let destroyed = false;

    const init = async () => {
      if (!document.getElementById("mapbox-gl-css")) {
        const link = document.createElement("link");
        link.id   = "mapbox-gl-css";
        link.rel  = "stylesheet";
        link.href = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css";
        document.head.appendChild(link);
      }
      if (!window.mapboxgl) {
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src    = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js";
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
        pitch:     0,
        bearing:   0,
        attributionControl: false,
      });

      map.addControl(new mbgl.NavigationControl({ showCompass: false }), "bottom-right");

      const geolocate = new mbgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
        showUserLocation: true,
      });
      map.addControl(geolocate, "bottom-right");

      map.on("load", () => {
        if (destroyed) return;
        map.touchZoomRotate.enableRotation();
        map.dragRotate.disable();
        map.touchPitch.disable();

        setupPOIClickHandler(map, mbgl);
        setMapReady(true);

        setTimeout(() => geolocate.trigger(), 500);
      });

      mapInst.current = map;
    };

    init().catch(() => setError("Map failed to load"));

    return () => {
      destroyed = true;
      if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; }
    };
  }, [token, userLoc]);

  // 6. Render user presence markers
  useEffect(() => {
    const map = mapInst.current;
    if (!map || !mapReady || !window.mapboxgl) return;

    const mbgl = window.mapboxgl;
    const emailsInData = new Set(nearbyUsers.map(p => p.user_email));

    // Remove stale markers
    Object.entries(userMarkersRef.current).forEach(([email, marker]) => {
      if (!emailsInData.has(email)) {
        marker.remove();
        delete userMarkersRef.current[email];
      }
    });

    // Filter by radius
    const [userLng, userLat] = userLoc || [0, 0];

    nearbyUsers.forEach(p => {
      if (!p.location_lat || !p.location_lng) return;
      if (userLoc) {
        const dist = haversineKm(userLat, userLng, p.location_lat, p.location_lng);
        if (dist > radius) return;
      }

      const isSelf = p.user_email === currentUser?.email;
      const initials = (p.user_name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

      if (userMarkersRef.current[p.user_email]) {
        userMarkersRef.current[p.user_email].setLngLat([p.location_lng, p.location_lat]);
        return;
      }

      const el = document.createElement("div");
      el.style.cssText = `
        width: 44px; height: 44px; border-radius: 50%;
        border: 3px solid ${isSelf ? "#4F46E5" : "#FFFFFF"};
        box-shadow: 0 4px 16px rgba(0,0,0,0.25);
        cursor: pointer; overflow: hidden; position: relative;
        transition: transform 0.2s ease;
        background: linear-gradient(135deg, #4F46E5, #7C3AED);
        display: flex; align-items: center; justify-content: center;
        font-size: 14px; font-weight: 700; color: white;
      `;

      if (p.avatar_url) {
        const img = document.createElement("img");
        img.src = p.avatar_url;
        img.style.cssText = "width:100%;height:100%;object-fit:cover;";
        el.appendChild(img);
      } else {
        el.textContent = initials;
      }

      // Pulse ring for self
      if (isSelf) {
        const ring = document.createElement("div");
        ring.style.cssText = `
          position: absolute; top: -6px; left: -6px;
          width: 52px; height: 52px; border-radius: 50%;
          border: 2px solid rgba(79,70,229,0.4);
          animation: userPulse 2s ease-in-out infinite;
          pointer-events: none;
        `;
        el.style.position = "relative";
        const wrapper = document.createElement("div");
        wrapper.style.cssText = "position:relative; width:44px; height:44px;";
        wrapper.appendChild(ring);
        wrapper.appendChild(el.cloneNode(true));
        el.replaceWith(wrapper);
        el.innerHTML = "";
      }

      const marker = new mbgl.Marker({ element: isSelf ? el : el, anchor: "center" })
        .setLngLat([p.location_lng, p.location_lat])
        .addTo(map);

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        const pt = map.project([p.location_lng, p.location_lat]);
        setPopupCoords({ x: pt.x, y: pt.y });
        setSelectedUserPresence(p);
      });

      userMarkersRef.current[p.user_email] = marker;
    });
  }, [nearbyUsers, mapReady, radius, currentUser?.email, userLoc]);

  // 7. Category filtering — highlight/dim POI labels
  useEffect(() => {
    const map = mapInst.current;
    if (!map || !mapReady) return;

    if (activeCategories.includes("all")) {
      // Reset all opacity to full
      ["poi-label", "transit-label"].forEach(layer => {
        if (map.getLayer(layer)) map.setPaintProperty(layer, "text-opacity", 1);
      });
      return;
    }

    // Build keyword set from selected categories
    const keywords = activeCategories.flatMap(cat => CATEGORY_LAYERS[cat] || []);

    if (keywords.length === 0) return;

    // Dim non-matching POIs using expression
    const filter = ["any", ...keywords.map(kw => ["in", kw, ["get", "class"]])];

    if (map.getLayer("poi-label")) {
      map.setFilter("poi-label", filter);
    }
  }, [activeCategories, mapReady]);

  // POI click handler
  const setupPOIClickHandler = (map, mbgl) => {
    map.on("click", async (e) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ["poi-label"] });
      if (features.length > 0) {
        const poi = features[0];
        const name = poi.properties.name;
        if (!name) return;
        const coords = poi.geometry.coordinates;
        const [lng, lat] = Array.isArray(coords[0]) ? coords[0] : coords;
        try {
          const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mbgl.accessToken}`);
          const data = await res.json();
          const context = data.features[0]?.context || [];
          const city    = context.find(c => c.id.startsWith("place"))?.text;
          const region  = context.find(c => c.id.startsWith("region"))?.text;
          const country = context.find(c => c.id.startsWith("country"))?.text;
          const addr    = data.features[0]?.place_name;
          onOpenPlace({ name, category: poi.properties.class, city, region, country, lat, lng, address: addr });
        } catch {
          onOpenPlace({ name, lat, lng });
        }
      }
    });
    map.on("mouseenter", "poi-label", () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", "poi-label", () => { map.getCanvas().style.cursor = ""; });
  };

  if (error) return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <MapPin className="w-10 h-10" style={{ color: "var(--text-hint)" }} />
      <p className="text-sm" style={{ color: "var(--text-hint)" }}>{error}</p>
    </div>
  );

  return (
    <div style={{ height: "100%", position: "relative" }}>
      <style>{`
        @keyframes userPulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.3); opacity: 0.2; }
        }
      `}</style>

      {/* Category carousel — top bar */}
      {mapReady && (
        <MapCategoryCarousel
          active={activeCategories}
          onChange={setActiveCategories}
        />
      )}

      {/* Radius filter button */}
      {mapReady && (
        <div className="absolute top-16 right-3 z-20">
          <button
            onClick={() => setShowRadiusPanel(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold"
            style={{
              backgroundColor: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
              border: "1px solid var(--border-light)",
              color: "var(--text-primary)",
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
                border: "1px solid var(--border-light)",
                minWidth: 100,
              }}
            >
              {RADIUS_OPTIONS.map(r => (
                <button
                  key={r}
                  onClick={() => { setRadius(r); setShowRadiusPanel(false); }}
                  className="w-full px-4 py-2.5 text-left text-xs font-bold transition-colors"
                  style={{
                    backgroundColor: radius === r ? "var(--accent-primary-light)" : "transparent",
                    color: radius === r ? "var(--accent-primary)" : "var(--text-primary)",
                  }}
                >
                  {r} km
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Users online indicator */}
      {mapReady && nearbyUsers.length > 0 && (
        <div
          className="absolute top-16 left-3 z-20 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold"
          style={{
            backgroundColor: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
            color: "#16A34A",
          }}
        >
          <div className="w-2 h-2 rounded-full bg-green-500" style={{ animation: "userPulse 2s infinite" }} />
          {nearbyUsers.length} nearby
        </div>
      )}

      {/* Privacy panel */}
      {mapReady && currentUser && (
        <LocationPrivacyPanel
          user={currentUser}
          presence={myPresence}
          onUpdate={(updates) => setMyPresence(prev => ({ ...prev, ...updates }))}
        />
      )}

      {/* User popup — rendered as overlay */}
      {selectedUserPresence && popupCoords && (
        <div
          className="absolute z-30"
          style={{
            left: Math.min(popupCoords.x, (mapRef.current?.clientWidth || 400) - 240),
            top: popupCoords.y - 160,
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