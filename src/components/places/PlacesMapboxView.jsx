import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, MapPin } from "lucide-react";

export default function PlacesMapboxView({ onOpenPlace }) {
  const mapRef    = useRef(null);
  const mapInst   = useRef(null);
  const markersRef= useRef([]);  // { marker, isPOI }

  const [token,    setToken]    = useState(null);
  const [userLoc,  setUserLoc]  = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [error,    setError]    = useState(null);

  // 1. Fetch mapbox token
  useEffect(() => {
    base44.functions.invoke("mapboxToken", {})
      .then(res => setToken(res.data?.token || res.data))
      .catch(() => setError("Could not load map token"));
  }, []);

  // 2. Get user geolocation (fallback: NYC) + track location updates
  useEffect(() => {
    if (!navigator.geolocation) { setUserLoc([-74.006, 40.7128]); return; }
    
    let watchId;
    
    // Initial position
    navigator.geolocation.getCurrentPosition(
      pos => setUserLoc([pos.coords.longitude, pos.coords.latitude]),
      () => setUserLoc([-74.006, 40.7128]),
      { enableHighAccuracy: true, maximumAge: 30000 }
    );

    // Watch for location changes
    watchId = navigator.geolocation.watchPosition(
      pos => {
        const newLoc = [pos.coords.longitude, pos.coords.latitude];
        setUserLoc(newLoc);
        // Update map center smoothly if map is ready
        if (mapInst.current && mapReady) {
          mapInst.current.easeTo({ center: newLoc, duration: 1000 });
        }
      },
      () => {},
      { enableHighAccuracy: false, maximumAge: 60000 }
    );

    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, [mapReady]);

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
        zoom:      15, // Neighborhood-level zoom
        pitch:     0,
        bearing:   0,
        attributionControl: false,
      });

      // Smooth easing
      map.easeTo = function(options) {
        return mbgl.Map.prototype.easeTo.call(this, { ...options, duration: 600, easing: t => t * (2 - t) });
      };

      map.addControl(new mbgl.NavigationControl({ showCompass: false }), "bottom-right");
      map.addControl(
        new mbgl.GeolocateControl({ 
          positionOptions: { enableHighAccuracy: true }, 
          trackUserLocation: true,
          showUserHeading: true 
        }),
        "bottom-right"
      );

      map.on("load", () => {
        if (destroyed) return;
        
        // Enable smooth interactions
        map.touchZoomRotate.enableRotation();
        map.dragRotate.disable();
        map.touchPitch.disable();
        
        setMapReady(true);
        setupMapClickHandler(map);
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

  // Handle clicks on map POI features
  const setupMapClickHandler = (map) => {
    if (!map) return;

    map.on("click", async (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ["poi-label"]
      });

      if (features.length > 0) {
        const poi = features[0];
        const name = poi.properties.name;
        const category = poi.properties.class;
        
        if (!name) return;

        // Get coordinates
        const coords = poi.geometry.coordinates;
        const [lng, lat] = coords;

        // Reverse geocode to get city/region
        try {
          const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}`);
          const data = await res.json();
          const context = data.features[0]?.context || [];
          
          const city = context.find(c => c.id.startsWith("place"))?.text;
          const region = context.find(c => c.id.startsWith("region"))?.text;
          const country = context.find(c => c.id.startsWith("country"))?.text;

          onOpenPlace({
            name,
            category,
            city,
            region,
            country,
            lat,
            lng,
          });
        } catch (err) {
          console.error("Reverse geocode failed:", err);
          onOpenPlace({
            name,
            category,
            lat,
            lng,
          });
        }
      }
    });

    // Change cursor on hover
    map.on("mouseenter", "poi-label", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "poi-label", () => {
      map.getCanvas().style.cursor = "";
    });
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

      {/* Info banner */}
      {mapReady && (
        <div className="absolute top-4 left-3 right-3 z-10 px-4 py-3 rounded-2xl text-sm"
          style={{ 
            backgroundColor: "rgba(46,107,79,0.95)", 
            color: "white",
            backdropFilter: "blur(12px)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)"
          }}>
          <p className="font-semibold mb-1">📍 Tap any place on the map</p>
          <p className="text-xs opacity-90">Restaurants, cafés, parks & more</p>
        </div>
      )}

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




    </div>
  );
}