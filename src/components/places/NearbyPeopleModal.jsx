import React, { useState, useMemo, useEffect, useRef } from "react";
import { X, MessageCircle, UserPlus, UserCheck, Navigation } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

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

const AVATAR_COLORS = ["#7C3AED","#E05C7A","#3C6E5A","#D98B62","#4A7FC1","#B07843"];
const getColor = (str) => AVATAR_COLORS[(str||"a").charCodeAt(0) % AVATAR_COLORS.length];

export default function NearbyPeopleModal({ allUsers, userLoc, currentUser, followedEmails = [], onClose, onHighlight }) {
  const navigate = useNavigate();
  const [friendSent, setFriendSent] = useState({});
  const [selectedPerson, setSelectedPerson] = useState(null);
  const radarRef = useRef(null);
  const [radarSize, setRadarSize] = useState(300);
  const [sweepAngle, setSweepAngle] = useState(0);

  useEffect(() => {
    const el = radarRef.current;
    if (el) setRadarSize(el.offsetWidth);
  }, []);

  // Animate sweep line
  useEffect(() => {
    let raf;
    const animate = () => {
      setSweepAngle(a => (a + 0.6) % 360);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  const [uLng, uLat] = userLoc || [0, 0];

  const nearby = useMemo(() => {
    return allUsers
      .filter(p => p.user_email !== currentUser?.email && p.location_lat && p.location_lng)
      .filter(p => p.visibility_mode === "everyone" || p.visibility_mode == null)
      .map(p => ({
        ...p,
        _dist: haversineKm(uLat, uLng, p.location_lat, p.location_lng),
      }))
      .filter(p => p._dist <= 25)
      .sort((a, b) => a._dist - b._dist);
  }, [allUsers, userLoc, currentUser?.email]);

  const maxDist = nearby.length > 0 ? Math.max(...nearby.map(p => p._dist), 1) : 1;
  const r = radarSize / 2;

  // Place people on radar using their bearing + distance
  const positioned = useMemo(() => {
    return nearby.map((p, i) => {
      // Random stable angle based on email hash
      const hash = p.user_email.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const angle = (hash * 137.508) % 360; // golden angle spread
      const normDist = Math.max(0.15, p._dist / maxDist); // 0.15 to 1.0
      const rad = (angle * Math.PI) / 180;
      const dist = normDist * (r * 0.82);
      return {
        ...p,
        x: r + Math.sin(rad) * dist,
        y: r - Math.cos(rad) * dist,
        angle,
      };
    });
  }, [nearby, r, maxDist]);

  const radarPeople = positioned.slice(0, 6);
  const morePeople = positioned.slice(6);

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

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-end"
      style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
      onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-3xl flex flex-col"
        style={{ backgroundColor: "#0d1117", maxHeight: "90vh", boxShadow: "0 -8px 60px rgba(0,0,0,0.6)" }}
        onClick={e => e.stopPropagation()}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.2)" }} />
        </div>

        {/* Radar area */}
        <div className="relative mx-auto mt-2" style={{ width: "min(90vw, 340px)", aspectRatio: "1" }} ref={radarRef}>
          <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${radarSize} ${radarSize}`}>
            {/* Concentric circles */}
            {[0.25, 0.5, 0.75, 1].map(scale => (
              <circle key={scale}
                cx={r} cy={r} r={r * scale * 0.96}
                fill="none" stroke="rgba(100,200,160,0.15)" strokeWidth="1" />
            ))}
            {/* Crosshair lines */}
            <line x1={r} y1={r * 0.04} x2={r} y2={r * 1.96} stroke="rgba(100,200,160,0.1)" strokeWidth="1" />
            <line x1={r * 0.04} y1={r} x2={r * 1.96} y2={r} stroke="rgba(100,200,160,0.1)" strokeWidth="1" />

            {/* Sweep gradient */}
            <defs>
              <radialGradient id="sweepGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(0,220,130,0)" />
                <stop offset="100%" stopColor="rgba(0,220,130,0)" />
              </radialGradient>
            </defs>
            <path
              d={`M ${r} ${r} L ${r} ${r * 0.04} A ${r * 0.96} ${r * 0.96} 0 0 1 ${r + r * 0.96 * Math.sin((60 * Math.PI) / 180)} ${r - r * 0.96 * Math.cos((60 * Math.PI) / 180)} Z`}
              fill="rgba(0,210,120,0.07)"
              transform={`rotate(${sweepAngle} ${r} ${r})`}
            />
            {/* Sweep line */}
            <line
              x1={r} y1={r}
              x2={r + r * 0.96 * Math.sin((sweepAngle * Math.PI) / 180)}
              y2={r - r * 0.96 * Math.cos((sweepAngle * Math.PI) / 180)}
              stroke="rgba(0,210,120,0.7)" strokeWidth="1.5"
            />
            {/* Center dot */}
            <circle cx={r} cy={r} r={5} fill="#00d27a" opacity="0.9" />

            {/* Compass labels */}
            {[["N",r,14],["S",r,radarSize-6],["W",10,r+4],["E",radarSize-8,r+4]].map(([lbl,x,y]) => (
              <text key={lbl} x={x} y={y} textAnchor="middle" fontSize="10" fill="rgba(100,200,160,0.5)" fontWeight="600">{lbl}</text>
            ))}
          </svg>

          {/* Avatar dots on radar */}
          {radarPeople.map(p => (
            <button
              key={p.user_email}
              onClick={() => setSelectedPerson(selectedPerson?.user_email === p.user_email ? null : p)}
              className="absolute flex flex-col items-center gap-0.5"
              style={{ left: p.x - 26, top: p.y - 26, zIndex: 10 }}>

        {/* Inline mini profile popup */}
        {selectedPerson && (
          <div className="mx-4 mt-3 rounded-2xl p-3 flex items-center gap-3"
            style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center font-bold text-white"
              style={{ background: selectedPerson.avatar_url ? "transparent" : `linear-gradient(135deg, ${getColor(selectedPerson.user_email)}, ${getColor(selectedPerson.user_email)}aa)`, border: "2px solid rgba(0,210,120,0.5)" }}>
              {selectedPerson.avatar_url
                ? <img src={selectedPerson.avatar_url} alt="" className="w-full h-full object-cover" />
                : getInitials(selectedPerson.user_name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-white truncate">{selectedPerson.user_name || "User"}</p>
              {selectedPerson.status_message && (
                <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.5)" }}>"{selectedPerson.status_message}"</p>
              )}
              <p className="text-xs" style={{ color: "rgba(0,210,120,0.8)" }}>
                {selectedPerson._dist < 1 ? "< 1 km" : `~${selectedPerson._dist.toFixed(1)} km`} away
              </p>
            </div>
            <div className="flex flex-col gap-1.5 shrink-0">
              <Link to={`/user/${encodeURIComponent(selectedPerson.user_email)}`}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-center"
                style={{ backgroundColor: "rgba(99,102,241,0.25)", color: "#818cf8" }}>
                Profile
              </Link>
              <button onClick={() => navigate(`/Messages?with=${selectedPerson.user_email}`)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold"
                style={{ backgroundColor: "rgba(0,210,120,0.15)", color: "#00d27a" }}>
                Message
              </button>
            </div>
            <button onClick={() => setSelectedPerson(null)} className="ml-1 w-6 h-6 flex items-center justify-center rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.1)", minWidth: 24, minHeight: 24 }}>
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        )}

        {/* More people row */}
        {(nearby.length > 0 || morePeople.length > 0) && (
          <div className="px-5 mt-3 mb-2">
            <p className="text-sm font-semibold mb-3" style={{ color: "rgba(255,255,255,0.7)" }}>
              {nearby.length === 0 ? "No one nearby" : `${nearby.length} people nearby`}
            </p>
            {morePeople.length > 0 && (
              <div className="flex items-center gap-1.5 mb-3">
                <p className="text-xs mr-1" style={{ color: "rgba(255,255,255,0.4)" }}>More nearby</p>
                {morePeople.slice(0, 5).map(p => (
                  <button key={p.user_email} onClick={() => navigate(`/user/${p.user_email}`)}
                    className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center font-bold text-xs text-white shrink-0"
                    style={{ background: p.avatar_url ? "transparent" : `linear-gradient(135deg, ${getColor(p.user_email)}, ${getColor(p.user_email)}aa)`, border: "2px solid rgba(255,255,255,0.15)" }}>
                    {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : getInitials(p.user_name)}
                  </button>
                ))}
                {morePeople.length > 5 && (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", border: "2px solid rgba(255,255,255,0.1)" }}>
                    +{morePeople.length - 5}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* People list */}
        <div className="flex-1 overflow-y-auto px-4 pb-8 flex flex-col gap-2">
          {nearby.slice(0, 10).map(p => {
            const isFriend = followedEmails.includes(p.user_email);
            const distMi = p._dist * 0.621371;
            return (
              <div key={p.user_email} className="flex items-center gap-3 p-3 rounded-2xl"
                style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <button onClick={() => navigate(`/user/${p.user_email}`)}
                  className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center font-bold text-sm text-white shrink-0"
                  style={{ background: p.avatar_url ? "transparent" : `linear-gradient(135deg, ${getColor(p.user_email)}, ${getColor(p.user_email)}aa)`, border: "2px solid rgba(0,210,120,0.3)" }}>
                  {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : getInitials(p.user_name)}
                </button>
                <div className="flex-1 min-w-0" onClick={() => navigate(`/user/${p.user_email}`)}>
                  <p className="font-semibold text-sm leading-tight text-white truncate">{p.user_name || "Anonymous"}</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {distMi < 1 ? "< 1 mile" : `~${Math.round(distMi)} miles`} away
                  </p>
                </div>
                {currentUser && p.user_email !== currentUser.email && (
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => navigate(`/Messages?with=${p.user_email}`)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: "rgba(0,210,120,0.15)" }}>
                      <MessageCircle className="w-4 h-4" style={{ color: "#00d27a" }} />
                    </button>
                    {!isFriend && (
                      <button onClick={(e) => sendFriendRequest(e, p)} disabled={!!friendSent[p.user_email]}
                        className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: friendSent[p.user_email] ? "rgba(0,210,120,0.15)" : "rgba(99,102,241,0.2)" }}>
                        {friendSent[p.user_email]
                          ? <UserCheck className="w-4 h-4" style={{ color: "#00d27a" }} />
                          : <UserPlus className="w-4 h-4" style={{ color: "#818cf8" }} />}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Close */}
        <button onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
          <X className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}