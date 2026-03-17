import React, { useEffect } from "react";
import { motion } from "framer-motion";
import PlacesMapboxView from "./PlacesMapboxView";

/**
 * Wraps the map and hides the bottom nav while it's mounted.
 */
export default function MapViewWrapper({ onOpenPlace, user }) {
  useEffect(() => {
    // Hide nav bar
    window.dispatchEvent(new CustomEvent("postviewermode", { detail: { active: true } }));
    return () => {
      // Restore nav bar when leaving map
      window.dispatchEvent(new CustomEvent("postviewermode", { detail: { active: false } }));
    };
  }, []);

  return (
    <motion.div
      key="map"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{ position: "fixed", inset: 0, zIndex: 40, top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <PlacesMapboxView onOpenPlace={onOpenPlace} user={user} />
    </motion.div>
  );
}