import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, UserPlus, UserCheck, MapPin, Wifi } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getInitials(name) {
  return (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = ["#7C3AED", "#E05C7A", "#3C6E5A", "#D98B62", "#4A7FC1", "#B07843", "#0891B2", "#D97706"];
const getColor = (str) => AVATAR_COLORS[(str || "a").charCodeAt(0) % AVATAR_COLORS.length];

export default function NearbyPeopleModal({ allUsers, userLoc, currentUser, followedEmails = [], onClose, onHighlight }) {
  const navigate = useNavigate();
  const [friendSent, setFriendSent] = useState({});
  const [activeId, setActiveId] = useState(null);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const containerRef = useRef(null);
  const animRef = useRef(null);

  const [uLng, uLat] = userLoc || [0, 0];

  const nearby = useMemo(() => {
    return allUsers
      .filter(p => p.user_email !== currentUser?.email && p.location_lat && p.location_lng)
      .filter(p => p.visibility_mode === "everyone" || p.visibility_mode == null)
      .map(p => ({
        ...p,
        _distKm: haversineKm(uLat, uLng, p.location_lat, p.location_lng),
        _distMi: haversineKm(uLat, uLng, p.location_lat, p.location_lng) * 0.621371,
      }))
      .filter(p => p._distKm <= 40)
      .sort((a, b) => a._distKm - b._distKm)
      .slice(0, 12);
  }, [allUsers, userLoc, currentUser?.email]);

  // Auto-rotation
  useEffect(() => {
    if (!autoRotate) return;
    let last = null;
    const tick = (ts) => {
      if (last !== null) setRotationAngle(a => (a + (ts - last) * 0.015) % 360);
      last = ts;
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [autoRotate]);

  const sendFriendRequest = async (e, presence) => {
    e.stopPropagation();
    if (!currentUser?.email || friendSent[presence.user_email]) return;
    try {
      const req = await base44.entities.FriendRequest.create({
        sender_email: currentUser.email,
        sender_name: currentUser.full_name || currentUser.email,
        sender_avatar_url: currentUser.avatar_url || "",
        receiver_email: presence.user_email,
        receiver_name: presence.user_name || "",
        status: "pending",
      });
      await base44.entities.Notification.create({
        recipient_email: presence.user_email,
        actor_email: currentUser.email,
        actor_name: currentUser.full_name || currentUser.email,
        type: "friend_request",
        ref_id: req.id,
      });
      setFriendSent(s => ({ ...s, [presence.user_email]: true }));
    } catch {}
  };

  function formatDist(mi) {
    if (mi < 0.1) return "< 0.1 mi";
    if (mi < 1) return `${mi.toFixed(1)} mi`;
    return `${Math.round(mi)} mi`;
  }

  const activeUser = nearby.find(p => p.user_email === activeId);
  const isFriend = activeUser && followedEmails.includes(activeUser.user_email);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 280 }}
        className="relative w-full max-w-sm mx-4 flex flex-col items-center"
        style={{ height: 520 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-0 right-0 z-20 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)" }}
        >
          <X className="w-4 h-4 text-white" />
        </button>

        {/* Title */}
        <div className="text-center mb-4 z-10">
          <h2 className="text-white font-black text-xl" style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}>
            Nearby People
          </h2>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <div className="w-2 h-2 rounded-full bg-green-400" style={{ animation: "pulse 2s infinite" }} />
            <p className="text-xs font-medium text-white/70">
              {nearby.length > 0 ? `${nearby.length} people sharing location` : "No one visible nearby"}
            </p>
          </div>
        </div>

        {/* Orbital container */}
        <div ref={containerRef} className="relative flex items-center justify-center" style={{ width: 320, height: 320 }}>
          {/* Orbit ring */}
          <div className="absolute rounded-full" style={{
            width: 280, height: 280,
            border: "1px solid rgba(255,255,255,0.12)",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
          }} />
          <div className="absolute rounded-full" style={{
            width: 200, height: 200,
            border: "1px solid rgba(255,255,255,0.06)",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
          }} />

          {/* Center — You */}
          <div className="absolute z-10" style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
            <div className="relative">
              <div className="absolute rounded-full animate-ping opacity-30" style={{ width: 56, height: 56, top: -4, left: -4, backgroundColor: "#7DBF9A" }} />
              <div className="absolute rounded-full animate-ping opacity-20" style={{ width: 68, height: 68, top: -10, left: -10, backgroundColor: "#7DBF9A", animationDelay: "0.5s" }} />
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-sm text-white z-10 relative"
                style={{ background: "linear-gradient(135deg, #263F2A, #5A9478)", border: "3px solid rgba(255,255,255,0.4)", boxShadow: "0 0 20px rgba(125,191,154,0.5)" }}>
                {currentUser?.avatar_url
                  ? <img src={currentUser.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                  : getInitials(currentUser?.full_name)}
              </div>
            </div>
            <p className="text-center text-white text-[10px] font-bold mt-1 opacity-70">You</p>
          </div>

          {/* Orbital nodes */}
          {nearby.length === 0 ? (
            <div className="absolute text-center" style={{ top: "50%", left: "50%", transform: "translate(-50%, 60px)", width: 200 }}>
              <div className="text-3xl mb-2">📡</div>
              <p className="text-white/50 text-xs">No one nearby yet</p>
            </div>
          ) : (
            nearby.map((person, i) => {
              const angle = ((i / nearby.length) * 360 + rotationAngle) % 360;
              const rad = (angle * Math.PI) / 180;
              const radius = 120;
              const x = radius * Math.cos(rad);
              const y = radius * Math.sin(rad);
              const opacity = Math.max(0.45, Math.min(1, 0.45 + 0.55 * ((1 + Math.sin(rad)) / 2)));
              const isActive = activeId === person.user_email;
              const color = getColor(person.user_email);
              const isFriendNode = followedEmails.includes(person.user_email);

              return (
                <div
                  key={person.user_email}
                  className="absolute cursor-pointer transition-all duration-500"
                  style={{
                    top: "50%", left: "50%",
                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                    opacity: isActive ? 1 : opacity,
                    zIndex: isActive ? 20 : Math.round(10 + 5 * Math.cos(rad)),
                  }}
                  onClick={() => {
                    setActiveId(isActive ? null : person.user_email);
                    setAutoRotate(isActive ? true : false);
                  }}
                >
                  {/* Pulse if active */}
                  {isActive && (
                    <div className="absolute rounded-full animate-ping opacity-40"
                      style={{ width: 44, height: 44, top: -4, left: -4, backgroundColor: color }} />
                  )}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs overflow-hidden transition-all duration-300"
                    style={{
                      background: person.avatar_url ? "transparent" : `linear-gradient(135deg, ${color}, ${color}88)`,
                      border: isActive ? `3px solid ${color}` : isFriendNode ? "2px solid #22c55e" : "2px solid rgba(255,255,255,0.3)",
                      boxShadow: isActive ? `0 0 16px ${color}80` : "none",
                      transform: isActive ? "scale(1.3)" : "scale(1)",
                    }}
                  >
                    {person.avatar_url
                      ? <img src={person.avatar_url} alt="" className="w-full h-full object-cover" />
                      : getInitials(person.user_name)}
                  </div>
                  <p className="text-center text-white/70 mt-0.5 font-semibold truncate"
                    style={{ fontSize: 9, maxWidth: 48, marginLeft: -4 }}>
                    {(person.user_name || "User").split(" ")[0]}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Active user card */}
        <AnimatePresence>
          {activeUser && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.92 }}
              transition={{ type: "spring", damping: 22, stiffness: 300 }}
              className="w-full rounded-3xl p-4 flex items-center gap-3"
              style={{ backgroundColor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)", backdropFilter: "blur(20px)" }}
            >
              <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0"
                style={{ border: "2px solid rgba(255,255,255,0.4)" }}>
                {activeUser.avatar_url
                  ? <img src={activeUser.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center font-bold text-white text-sm"
                      style={{ background: `linear-gradient(135deg, ${getColor(activeUser.user_email)}, ${getColor(activeUser.user_email)}88)` }}>
                      {getInitials(activeUser.user_name)}
                    </div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm truncate">{activeUser.user_name || "Anonymous"}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3 h-3 text-white/50" />
                  <span className="text-xs text-white/60">{formatDist(activeUser._distMi)} away</span>
                  {isFriend && <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: "#16a34a22", color: "#4ade80" }}>Friend</span>}
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={() => navigate(`/Messages?with=${activeUser.user_email}`)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "rgba(79,70,229,0.3)", border: "1px solid rgba(79,70,229,0.5)" }}>
                  <MessageCircle className="w-4 h-4 text-indigo-300" />
                </button>
                {!isFriend && (
                  <button
                    onClick={(e) => sendFriendRequest(e, activeUser)}
                    disabled={!!friendSent[activeUser.user_email]}
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: friendSent[activeUser.user_email] ? "rgba(22,163,74,0.3)" : "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)" }}>
                    {friendSent[activeUser.user_email]
                      ? <UserCheck className="w-4 h-4 text-green-400" />
                      : <UserPlus className="w-4 h-4 text-white" />}
                  </button>
                )}
                <button
                  onClick={() => { if (onHighlight) onHighlight(activeUser); onClose(); }}
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "rgba(22,163,74,0.3)", border: "1px solid rgba(22,163,74,0.5)" }}>
                  <MapPin className="w-4 h-4 text-green-400" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  );
}