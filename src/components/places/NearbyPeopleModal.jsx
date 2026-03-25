import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, UserPlus, UserCheck, Users, MapPin, Wifi, Search } from "lucide-react";
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

function Avatar({ presence, size = 48 }) {
  const color = getColor(presence.user_email);
  return (
    <div
      className="rounded-full overflow-hidden flex items-center justify-center font-bold text-white shrink-0"
      style={{
        width: size, height: size, minWidth: size,
        background: presence.avatar_url ? "transparent" : `linear-gradient(135deg, ${color}, ${color}99)`,
        border: "2.5px solid rgba(255,255,255,0.8)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        fontSize: size * 0.3,
      }}>
      {presence.avatar_url
        ? <img src={presence.avatar_url} alt="" className="w-full h-full object-cover" />
        : getInitials(presence.user_name)}
    </div>
  );
}

export default function NearbyPeopleModal({ allUsers, userLoc, currentUser, followedEmails = [], onClose, onHighlight }) {
  const navigate = useNavigate();
  const [friendSent, setFriendSent] = useState({});
  const [search, setSearch] = useState("");

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
      .sort((a, b) => a._distKm - b._distKm);
  }, [allUsers, userLoc, currentUser?.email]);

  const filtered = search.trim()
    ? nearby.filter(p => (p.user_name || "").toLowerCase().includes(search.toLowerCase()))
    : nearby;

  const friends = filtered.filter(p => followedEmails.includes(p.user_email));
  const others = filtered.filter(p => !followedEmails.includes(p.user_email));

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
    if (mi < 1) return `${(mi).toFixed(1)} mi`;
    return `${Math.round(mi)} mi`;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-end"
      style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)" }}
      onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="w-full max-w-lg flex flex-col"
        style={{ backgroundColor: "var(--bg-card)", borderRadius: "28px 28px 0 0", maxHeight: "85vh", boxShadow: "0 -8px 48px rgba(0,0,0,0.2)" }}
        onClick={e => e.stopPropagation()}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "var(--border-medium)" }} />
        </div>

        {/* Header */}
        <div className="px-5 pb-4 pt-2 shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-black leading-tight" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                Nearby People
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-green-500" style={{ animation: "pulse 2s infinite" }} />
                <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                  {nearby.length > 0 ? `${nearby.length} people sharing location` : "No one visible nearby"}
                </p>
              </div>
            </div>
            <button onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--bg-subtle)" }}>
              <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
            </button>
          </div>

          {/* Stats row */}
          {nearby.length > 0 && (
            <div className="flex gap-3 mt-3">
              {[
                { label: "Nearby", value: nearby.length, icon: Users, color: "#4F46E5" },
                { label: "Friends", value: friends.length, icon: UserCheck, color: "#16A34A" },
                { label: "Radius", value: "25 mi", icon: MapPin, color: "#D97706" },
              ].map(stat => (
                <div key={stat.label} className="flex-1 p-2.5 rounded-2xl text-center"
                  style={{ backgroundColor: stat.color + "10", border: `1px solid ${stat.color}25` }}>
                  <p className="text-base font-black" style={{ color: stat.color }}>{stat.value}</p>
                  <p className="text-[10px] font-semibold mt-0.5" style={{ color: "var(--text-hint)" }}>{stat.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Search */}
          {nearby.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mt-3"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
              <Search className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-hint)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name…"
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: "var(--text-primary)", border: "none", minHeight: "unset", boxShadow: "none", padding: 0, fontSize: 13 }} />
            </div>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 pb-8">
          {nearby.length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-4xl mb-3">📡</div>
              <p className="font-bold text-sm mb-1" style={{ color: "var(--text-primary)" }}>No one nearby</p>
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>
                When others share their location, they'll appear here
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm" style={{ color: "var(--text-hint)" }}>No results for "{search}"</p>
            </div>
          ) : (
            <>
              {/* Friends section */}
              {friends.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-wide mb-2 flex items-center gap-1.5"
                    style={{ color: "var(--text-hint)" }}>
                    <UserCheck className="w-3 h-3 text-green-500" /> Friends Nearby
                  </p>
                  <div className="space-y-2">
                    {friends.map(p => <PersonRow key={p.user_email} p={p} currentUser={currentUser} friendSent={friendSent} isFriend={true} formatDist={formatDist} navigate={navigate} sendFriendRequest={sendFriendRequest} onHighlight={onHighlight} onClose={onClose} />)}
                  </div>
                </div>
              )}

              {/* Others section */}
              {others.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide mb-2 flex items-center gap-1.5"
                    style={{ color: "var(--text-hint)" }}>
                    <Wifi className="w-3 h-3" /> People Nearby
                  </p>
                  <div className="space-y-2">
                    {others.slice(0, 20).map(p => <PersonRow key={p.user_email} p={p} currentUser={currentUser} friendSent={friendSent} isFriend={false} formatDist={formatDist} navigate={navigate} sendFriendRequest={sendFriendRequest} onHighlight={onHighlight} onClose={onClose} />)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  );
}

function PersonRow({ p, currentUser, friendSent, isFriend, formatDist, navigate, sendFriendRequest, onHighlight, onClose }) {
  const color = getColor(p.user_email);
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer"
      style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}
      onClick={() => navigate(`/user/${p.user_email}`)}>

      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center font-bold text-white"
          style={{ background: p.avatar_url ? "transparent" : `linear-gradient(135deg, ${color}, ${color}88)`, fontSize: 16 }}>
          {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : getInitials(p.user_name)}
        </div>
        {isFriend && (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#16A34A", border: "2px solid var(--bg-card)" }}>
            <UserCheck className="w-2 h-2 text-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate leading-tight" style={{ color: "var(--text-primary)" }}>
          {p.user_name || "Anonymous"}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="flex items-center gap-0.5 text-xs" style={{ color: "var(--text-hint)" }}>
            <MapPin className="w-2.5 h-2.5" />
            {formatDist(p._distMi)} away
          </span>
          {p.status_message && (
            <span className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>· {p.status_message}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      {currentUser && p.user_email !== currentUser.email && (
        <div className="flex gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
          <button onClick={() => navigate(`/Messages?with=${p.user_email}`)}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "#EEF2FF" }}>
            <MessageCircle className="w-4 h-4" style={{ color: "#4F46E5" }} />
          </button>
          {!isFriend && (
            <button onClick={(e) => sendFriendRequest(e, p)} disabled={!!friendSent[p.user_email]}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: friendSent[p.user_email] ? "#F0FDF4" : "#EEF2FF" }}>
              {friendSent[p.user_email]
                ? <UserCheck className="w-4 h-4" style={{ color: "#16A34A" }} />
                : <UserPlus className="w-4 h-4" style={{ color: "#4F46E5" }} />}
            </button>
          )}
          <button
            onClick={() => { if (onHighlight) { onHighlight(p); } if (onClose) onClose(); }}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "#ECFDF5" }}>
            <MapPin className="w-4 h-4" style={{ color: "#16A34A" }} />
          </button>
        </div>
      )}
    </motion.div>
  );
}