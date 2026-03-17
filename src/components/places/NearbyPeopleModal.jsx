import React, { useState, useMemo } from "react";
import { X, MessageCircle, User, MapPin, Users, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const RADIUS_MI_OPTIONS = [5, 10, 15];

function kmToMiles(km) { return km * 0.621371; }
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

function timeAgo(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function PersonCard({ presence, distance, currentUser, onHighlight }) {
  const navigate = useNavigate();
  const distMi = kmToMiles(distance);
  const approxDist = distMi < 1 ? "< 1 mile" : `~${Math.round(distMi)} mile${Math.round(distMi) !== 1 ? "s" : ""}`;

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
    >
      {/* Avatar */}
      <button
        onClick={() => navigate(`/user/${presence.user_email}`)}
        className="shrink-0 w-12 h-12 rounded-full overflow-hidden flex items-center justify-center font-bold text-sm text-white"
        style={{ background: "linear-gradient(135deg,#7C3AED,#4F46E5)", minWidth: 48, minHeight: 48 }}
      >
        {presence.avatar_url ? (
          <img src={presence.avatar_url} alt="" className="w-full h-full object-cover"
            onError={e => { e.currentTarget.style.display = "none"; }} />
        ) : getInitials(presence.user_name)}
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0" onClick={() => navigate(`/user/${presence.user_email}`)}>
        <p className="font-semibold text-sm leading-tight truncate" style={{ color: "var(--text-primary)" }}>
          {presence.user_name || "Anonymous"}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs flex items-center gap-1" style={{ color: "var(--text-hint)" }}>
            <MapPin className="w-3 h-3" /> {approxDist}
          </span>
          {presence.updated_date && (
            <span className="text-xs flex items-center gap-1" style={{ color: "var(--text-hint)" }}>
              <Clock className="w-3 h-3" /> {timeAgo(presence.updated_date)}
            </span>
          )}
        </div>
        {presence.status_message && (
          <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-secondary)" }}>
            {presence.status_message}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => onHighlight(presence)}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "var(--accent-primary-light)", minWidth: 36, minHeight: 36 }}
          title="Show on map"
        >
          <MapPin className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
        </button>
        {currentUser && presence.user_email !== currentUser.email && (
          <button
            onClick={() => navigate(`/Messages?with=${presence.user_email}`)}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "#F0FDF4", minWidth: 36, minHeight: 36 }}
            title="Message"
          >
            <MessageCircle className="w-4 h-4" style={{ color: "#16A34A" }} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function NearbyPeopleModal({ allUsers, userLoc, currentUser, followedEmails = [], onClose, onHighlight }) {
  const [radiusMi, setRadiusMi] = useState(10);
  const [filter, setFilter] = useState("everyone"); // everyone | friends | recent
  const [sortBy, setSortBy] = useState("distance");  // distance | activity
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const radiusKm = radiusMi * 1.60934;
  const [uLng, uLat] = userLoc || [0, 0];
  const friendSet = new Set(followedEmails);

  const enriched = useMemo(() => {
    return allUsers
      .filter(p => p.user_email !== currentUser?.email)
      .filter(p => p.location_lat && p.location_lng)
      .map(p => ({
        ...p,
        _dist: haversineKm(uLat, uLng, p.location_lat, p.location_lng),
        _isFriend: friendSet.has(p.user_email),
      }))
      .filter(p => p._dist <= radiusKm);
  }, [allUsers, userLoc, radiusKm, currentUser?.email, followedEmails]);

  const filtered = useMemo(() => {
    let list = [...enriched];
    if (filter === "friends") list = list.filter(p => p._isFriend);
    if (filter === "recent") {
      const cutoff = Date.now() - 60 * 60 * 1000; // 1 hour
      list = list.filter(p => new Date(p.updated_date || 0).getTime() > cutoff);
    }
    if (sortBy === "distance") list.sort((a, b) => a._dist - b._dist);
    else list.sort((a, b) => new Date(b.updated_date || 0) - new Date(a.updated_date || 0));
    return list;
  }, [enriched, filter, sortBy]);

  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < filtered.length;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
      {/* Sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 rounded-t-3xl flex flex-col"
        style={{ backgroundColor: "var(--bg-app)", maxHeight: "88vh", boxShadow: "0 -8px 40px rgba(0,0,0,0.2)" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "var(--border-medium)" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 shrink-0">
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              Nearby People
            </h2>
            <p className="text-xs" style={{ color: "var(--text-hint)" }}>
              {filtered.length} {filter === "friends" ? "friend" : "people"}{filtered.length !== 1 ? "s" : ""} within {radiusMi} miles
            </p>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "var(--bg-subtle)", minWidth: 36, minHeight: 36 }}>
            <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>

        {/* Radius pills */}
        <div className="flex gap-2 px-4 pb-3 shrink-0">
          {RADIUS_MI_OPTIONS.map(r => (
            <button key={r}
              onClick={() => { setRadiusMi(r); setPage(1); }}
              className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{
                backgroundColor: radiusMi === r ? "var(--accent-primary)" : "var(--bg-subtle)",
                color: radiusMi === r ? "#fff" : "var(--text-secondary)",
              }}>
              {r} mi
            </button>
          ))}
        </div>

        {/* Filter + sort row */}
        <div className="flex items-center justify-between px-4 pb-3 shrink-0 gap-2">
          <div className="flex gap-1.5">
            {[
              { key: "everyone", icon: Users, label: "Everyone" },
              { key: "friends", icon: User, label: "Friends" },
              { key: "recent", icon: Clock, label: "Recent" },
            ].map(({ key, icon: Icon, label }) => (
              <button key={key}
                onClick={() => { setFilter(key); setPage(1); }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: filter === key ? "var(--accent-primary-light)" : "var(--bg-subtle)",
                  color: filter === key ? "var(--accent-primary)" : "var(--text-secondary)",
                }}>
                <Icon className="w-3 h-3" />{label}
              </button>
            ))}
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="text-xs rounded-xl px-2 py-1.5 font-semibold"
            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)", border: "none", minHeight: 0, boxShadow: "none" }}
          >
            <option value="distance">Closest</option>
            <option value="activity">Recent</option>
          </select>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Users className="w-10 h-10" style={{ color: "var(--text-hint)" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>No one nearby</p>
              <p className="text-xs text-center" style={{ color: "var(--text-hint)" }}>Try expanding the radius or changing filters</p>
            </div>
          ) : (
            <>
              {visible.map(p => (
                <PersonCard
                  key={p.user_email}
                  presence={p}
                  distance={p._dist}
                  currentUser={currentUser}
                  onHighlight={onHighlight}
                />
              ))}
              {hasMore && (
                <button
                  onClick={() => setPage(pg => pg + 1)}
                  className="py-3 rounded-2xl text-sm font-semibold mt-1"
                  style={{ backgroundColor: "var(--bg-subtle)", color: "var(--accent-primary)" }}>
                  Load more ({filtered.length - visible.length} remaining)
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}