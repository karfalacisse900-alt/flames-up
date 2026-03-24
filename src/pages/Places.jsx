import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import PlacesGoogleMapView from "@/components/places/PlacesGoogleMapView";
import MapViewWrapper from "@/components/places/MapViewWrapper";

export default function Places() {
  const [user, setUser] = useState(null);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  if (showMap && user) {
    return (
      <MapViewWrapper>
        <PlacesGoogleMapView user={user} onBack={() => setShowMap(false)} />
      </MapViewWrapper>
    );
  }

  return (
    <div style={{ backgroundColor: "var(--bg-app)", minHeight: "100dvh", padding: "1rem" }}>
      <button
        onClick={() => setShowMap(true)}
        className="px-6 py-3 rounded-2xl text-sm font-bold text-white"
        style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)" }}
      >
        Open Map
      </button>
    </div>
  );
}