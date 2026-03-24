import React, { useMemo } from "react";
import { X, MapPin, Users } from "lucide-react";
import { motion } from "framer-motion";

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function NearbyPeopleModal({ allUsers, userLoc, currentUser, followedEmails, onClose, onHighlight }) {
  const nearbyFriends = useMemo(() => {
    if (!userLoc || !Array.isArray(allUsers)) return [];
    return allUsers
      .filter(u => u.user_email !== currentUser?.email && followedEmails.includes(u.user_email))
      .map(u => ({ ...u, distance: haversineKm(userLoc[1], userLoc[0], u.location_lat, u.location_lng) }))
      .sort((a, b) => a.distance - b.distance);
  }, [allUsers, userLoc, currentUser?.email, followedEmails]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(15,23,42,0.6)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-card)", boxShadow: "0 20px 60px rgba(15,23,42,0.3)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" style={{ color: "var(--accent-primary)" }} />
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Nearby Friends</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ backgroundColor: "var(--bg-subtle)" }}>
            <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>

        {/* List */}
        <div className="max-h-96 overflow-y-auto">
          {nearbyFriends.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm" style={{ color: "var(--text-hint)" }}>No nearby friends right now</p>
            </div>
          ) : (
            nearbyFriends.map(user => (
              <button
                key={user.user_email}
                onClick={() => onHighlight(user)}
                className="w-full flex items-center gap-3 p-4 border-b text-left hover:opacity-80 transition-opacity"
                style={{ borderColor: "var(--border-subtle)", backgroundColor: "transparent" }}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg,#2E6B4F,#4CAF7D)" }}>
                  {user.user_name?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{user.user_name || user.user_email}</p>
                  <div className="flex items-center gap-1 text-xs" style={{ color: "var(--text-hint)" }}>
                    <MapPin className="w-3 h-3" />
                    {user.distance.toFixed(1)} km away
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}