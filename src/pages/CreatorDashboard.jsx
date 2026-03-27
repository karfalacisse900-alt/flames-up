import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import {
  MapPin, X, Instagram, Youtube, Globe, Edit3,
  Clock, Loader2, MessageCircle, Check, Navigation,
  Zap, ChevronRight
} from "lucide-react";
import CreatorProfileEditor from "@/components/creators/CreatorProfileEditor.jsx";
import CreatorApplyForm from "@/components/creators/CreatorApplyForm.jsx";
import PortfolioUploader from "@/components/creators/PortfolioUploader.jsx";

const CATEGORY_LABELS = {
  painter: "🎨 Painter", dancer: "💃 Dancer", musician: "🎵 Musician",
  videographer: "🎬 Videographer", photographer: "📸 Photographer",
  street_performer: "🎭 Street Performer", comedian: "😂 Comedian",
  magician: "🪄 Magician", tattoo_artist: "✒️ Tattoo Artist",
  caricaturist: "✏️ Caricaturist", other: "🌟 Other"
};

export default function CreatorDashboard() {
  const [user, setUser] = useState(null);
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showApply, setShowApply] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [editingStatus, setEditingStatus] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(false);
  const [promotionData, setPromotionData] = useState({ type: "", description: "" });
  const locationWatchRef = useRef(null);
  const locationIntervalRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        if (u?.email) {
          const rows = await base44.entities.Creator.filter({ user_email: u.email });
          const c = rows[0] || null;
          setCreator(c);
          if (c?.status_message) setStatusMsg(c.status_message);
          if (c?.promotion_type) setPromotionData({ type: c.promotion_type, description: c.promotion_description || "" });
        }
      } catch {}
      setLoading(false);
    };
    load();
    return () => stopTracking();
  }, []);

  const stopTracking = () => {
    if (locationWatchRef.current !== null) { navigator.geolocation.clearWatch(locationWatchRef.current); locationWatchRef.current = null; }
    if (locationIntervalRef.current !== null) { clearInterval(locationIntervalRef.current); locationIntervalRef.current = null; }
  };

  const pushLocation = (id) => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => { await base44.entities.Creator.update(id, { latitude: pos.coords.latitude, longitude: pos.coords.longitude, last_updated: new Date().toISOString() }); },
      null, { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 }
    );
  };

  const startTracking = (id) => {
    if (!navigator.geolocation) return;
    locationWatchRef.current = navigator.geolocation.watchPosition(
      async (pos) => { await base44.entities.Creator.update(id, { latitude: pos.coords.latitude, longitude: pos.coords.longitude, last_updated: new Date().toISOString() }); },
      null, { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
    locationIntervalRef.current = setInterval(() => pushLocation(id), 2 * 60 * 1000);
  };

  const handleOpen = async () => {
    if (!creator || toggling) return;
    setToggling(true);
    try {
      const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 }));
      await base44.entities.Creator.update(creator.id, { availability_status: "open", latitude: pos.coords.latitude, longitude: pos.coords.longitude, last_updated: new Date().toISOString() });
      setCreator(prev => ({ ...prev, availability_status: "open", latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
      startTracking(creator.id);
    } catch { alert("Could not get your location. Please enable GPS and try again."); }
    setToggling(false);
  };

  const handleClose = async () => {
    if (!creator || toggling) return;
    setToggling(true);
    stopTracking();
    await base44.entities.Creator.update(creator.id, { availability_status: "closed", last_updated: new Date().toISOString() });
    setCreator(prev => ({ ...prev, availability_status: "closed" }));
    setToggling(false);
  };

  const saveStatus = async () => {
    if (!creator) return;
    setSavingStatus(true);
    await base44.entities.Creator.update(creator.id, { status_message: statusMsg });
    setCreator(prev => ({ ...prev, status_message: statusMsg }));
    setEditingStatus(false);
    setSavingStatus(false);
  };

  const savePromotion = async () => {
    if (!creator) return;
    setSavingStatus(true);
    await base44.entities.Creator.update(creator.id, { promotion_type: promotionData.type, promotion_description: promotionData.description, is_discoverable: true });
    setCreator(prev => ({ ...prev, ...promotionData, is_discoverable: true }));
    setEditingPromotion(false);
    setSavingStatus(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-app)" }}>
      <Loader2 className="w-7 h-7 animate-spin" style={{ color: "var(--accent-primary)" }} />
    </div>
  );

  if (!user) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ background: "var(--bg-app)" }}>
      <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Sign in to access the Creator Dashboard</p>
    </div>
  );

  if (!creator) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "var(--bg-app)" }}>
      <div className="w-full max-w-sm text-center">
        <div className="w-24 h-24 rounded-[28px] flex items-center justify-center mx-auto mb-6 text-5xl"
          style={{ background: "linear-gradient(135deg, #1C2B1A, #2D6A4F)" }}>🎨</div>
        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
          Become a Street Creator
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--text-hint)" }}>
          Apply to showcase your talent on the map. Painters, musicians, dancers, photographers and more are welcome.
        </p>
        <button onClick={() => setShowApply(true)}
          className="w-full py-4 rounded-2xl font-bold text-white text-base"
          style={{ backgroundColor: "var(--accent-primary)" }}>
          Apply Now
        </button>
      </div>
      {showApply && <CreatorApplyForm user={user} onClose={() => setShowApply(false)} onCreated={(c) => { setCreator(c); setShowApply(false); }} />}
    </div>
  );

  const isPending = creator.approval_status === "pending";
  const isRejected = creator.approval_status === "rejected";
  const isApproved = creator.approval_status === "approved";
  const isOpen = creator.availability_status === "open";

  if (!isApproved) return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--bg-app)" }}>
      <div className="w-full max-w-sm text-center">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
          style={{ backgroundColor: isPending ? "#FFF7ED" : "#FEF2F2" }}>
          {isPending ? <Clock className="w-9 h-9" style={{ color: "#F97316" }} /> : <X className="w-9 h-9" style={{ color: "#EF4444" }} />}
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
          {isPending ? "Application Under Review" : "Application Rejected"}
        </h2>
        <p className="text-sm mb-5" style={{ color: "var(--text-hint)" }}>
          {isPending ? "Your creator application is being reviewed by our team." : "Your application was not approved. Please contact support."}
        </p>
        <div className="p-4 rounded-2xl text-left" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <p className="text-xs font-bold mb-1 uppercase tracking-wider" style={{ color: "var(--text-hint)" }}>Submitted as</p>
          <p className="font-bold" style={{ color: "var(--text-primary)" }}>{creator.full_name}</p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{CATEGORY_LABELS[creator.category]}</p>
        </div>
      </div>
    </div>
  );

  // ── Approved Dashboard ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-16" style={{ background: "var(--bg-app)" }}>
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-4">

        {/* ── Profile Hero Card ── */}
        <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          {/* Cover */}
          <div className="relative h-36" style={{ background: "linear-gradient(135deg, #1C2B1A, #2D6A4F)" }}>
            {creator.profile_image && (
              <img src={creator.profile_image} alt="" className="w-full h-full object-cover opacity-50" />
            )}
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.6) 100%)" }} />
            {/* Edit button */}
            <button onClick={() => setShowEditor(true)}
              className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
              <Edit3 className="w-4 h-4 text-white" />
            </button>
            {/* Status pill */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ backgroundColor: isOpen ? "rgba(22,163,74,0.9)" : "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}>
              <div className={`w-2 h-2 rounded-full ${isOpen ? "bg-white animate-pulse" : "bg-gray-400"}`} />
              <span className="text-xs font-bold text-white">{isOpen ? "Live" : "Offline"}</span>
            </div>
          </div>

          {/* Profile info */}
          <div className="px-4 pb-4 pt-3">
            <div className="flex items-start gap-3">
              <div className="w-14 h-14 rounded-2xl overflow-hidden -mt-8 border-2 border-white shrink-0"
                style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.15)", backgroundColor: "var(--bg-subtle)" }}>
                {creator.profile_image
                  ? <img src={creator.profile_image} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-2xl">{CATEGORY_LABELS[creator.category]?.split(" ")[0]}</div>}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold leading-tight" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                  {creator.full_name}
                </h1>
                <p className="text-sm font-semibold" style={{ color: "var(--accent-primary)" }}>
                  {CATEGORY_LABELS[creator.category]}
                </p>
              </div>
              {creator.price && (
                <span className="px-3 py-1.5 rounded-full text-xs font-bold shrink-0"
                  style={{ backgroundColor: "#F0FDF4", color: "#16A34A" }}>
                  💰 {creator.price}
                </span>
              )}
            </div>

            {creator.description && (
              <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {creator.description}
              </p>
            )}

            {/* Social links */}
            {(creator.instagram_url || creator.tiktok_url || creator.youtube_url || creator.website_url) && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {creator.instagram_url && <a href={creator.instagram_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold" style={{ backgroundColor: "#FDF2F8", color: "#DB2777" }}><Instagram className="w-3 h-3" /> IG</a>}
                {creator.tiktok_url && <a href={creator.tiktok_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold" style={{ backgroundColor: "#F0FFFE", color: "#0D9488" }}>🎵 TT</a>}
                {creator.youtube_url && <a href={creator.youtube_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold" style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}><Youtube className="w-3 h-3" /> YT</a>}
                {creator.website_url && <a href={creator.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold" style={{ backgroundColor: "#EEF2FF", color: "#4F46E5" }}><Globe className="w-3 h-3" /> Web</a>}
              </div>
            )}

            {isOpen && creator.latitude && (
              <div className="flex items-center gap-1.5 mt-3 text-xs" style={{ color: "var(--text-hint)" }}>
                <MapPin className="w-3 h-3" />
                <span>{creator.latitude.toFixed(4)}, {creator.longitude.toFixed(4)}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Availability Toggle ── */}
        <div className="rounded-3xl p-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-hint)" }}>Availability</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleOpen} disabled={isOpen || toggling}
              className="py-4 rounded-2xl font-bold text-base text-white flex flex-col items-center gap-1 transition-all active:scale-95"
              style={{ backgroundColor: isOpen ? "#86EFAC" : "#16A34A", opacity: isOpen ? 0.5 : 1 }}>
              {toggling && !isOpen ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span className="text-2xl">🟢</span><span className="text-sm">Go Live</span></>}
            </button>
            <button onClick={handleClose} disabled={!isOpen || toggling}
              className="py-4 rounded-2xl font-bold text-base text-white flex flex-col items-center gap-1 transition-all active:scale-95"
              style={{ backgroundColor: !isOpen ? "#FCA5A5" : "#DC2626", opacity: !isOpen ? 0.5 : 1 }}>
              {toggling && isOpen ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span className="text-2xl">🔴</span><span className="text-sm">Go Offline</span></>}
            </button>
          </div>
        </div>

        {/* ── Status Message ── */}
        <div className="rounded-3xl p-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-hint)" }}>Status Message</p>
            </div>
            {!editingStatus && (
              <button onClick={() => setEditingStatus(true)} className="text-xs font-bold px-2.5 py-1 rounded-lg"
                style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>Edit</button>
            )}
          </div>
          {editingStatus ? (
            <div className="flex gap-2">
              <input value={statusMsg} onChange={e => setStatusMsg(e.target.value)} maxLength={80}
                placeholder="e.g. Giving 20% discount today! 🎉"
                className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
              <button onClick={saveStatus} disabled={savingStatus}
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "var(--accent-primary)" }}>
                {savingStatus ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Check className="w-4 h-4 text-white" />}
              </button>
              <button onClick={() => { setEditingStatus(false); setStatusMsg(creator.status_message || ""); }}
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "var(--bg-subtle)" }}>
                <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
              </button>
            </div>
          ) : creator.status_message ? (
            <p className="text-sm flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <span className="text-base">💬</span> {creator.status_message}
            </p>
          ) : (
            <p className="text-xs" style={{ color: "var(--text-hint)" }}>No status yet. Add one to attract customers!</p>
          )}
        </div>

        {/* ── What You're Promoting ── */}
        <div className="rounded-3xl p-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" style={{ color: "#F97316" }} />
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-hint)" }}>Promoting</p>
            </div>
            {!editingPromotion && (
              <button onClick={() => setEditingPromotion(true)} className="text-xs font-bold px-2.5 py-1 rounded-lg"
                style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>Edit</button>
            )}
          </div>
          {editingPromotion ? (
            <div className="space-y-2">
              <select value={promotionData.type} onChange={e => setPromotionData({ ...promotionData, type: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}>
                <option value="">Select type</option>
                <option value="shop">🛍️ Shop/Business</option>
                <option value="hosting">🎪 Hosting Event/Show</option>
                <option value="content">📱 Content Creator</option>
                <option value="service">💼 Service Provider</option>
                <option value="activity">🎯 Activity/Experience</option>
              </select>
              <input value={promotionData.description} onChange={e => setPromotionData({ ...promotionData, description: e.target.value })}
                maxLength={120} placeholder="e.g. Custom portrait paintings, live bookings available"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
              <div className="flex gap-2">
                <button onClick={savePromotion} disabled={savingStatus || !promotionData.type}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold flex items-center justify-center"
                  style={{ backgroundColor: "var(--accent-primary)", opacity: !promotionData.type ? 0.4 : 1 }}>
                  {savingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                </button>
                <button onClick={() => setEditingPromotion(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm"
                  style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>Cancel</button>
              </div>
            </div>
          ) : promotionData.type ? (
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                {promotionData.type === "shop" ? "🛍️ Shop/Business" : promotionData.type === "hosting" ? "🎪 Hosting Event/Show" : promotionData.type === "content" ? "📱 Content Creator" : promotionData.type === "service" ? "💼 Service Provider" : "🎯 Activity/Experience"}
              </p>
              {promotionData.description && <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{promotionData.description}</p>}
              <span className="inline-block mt-2 px-2.5 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: "#F0FDF4", color: "#16A34A" }}>✓ Discoverable on Map</span>
            </div>
          ) : (
            <p className="text-xs" style={{ color: "var(--text-hint)" }}>Set what you're promoting to appear on the discovery map!</p>
          )}
        </div>

        {/* ── Portfolio ── */}
        <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <div className="px-4 pt-4 pb-1">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-hint)" }}>Portfolio</p>
          </div>
          <PortfolioUploader creator={creator} onUpdated={setCreator} />
        </div>

      </div>

      {showEditor && (
        <CreatorProfileEditor creator={creator} onClose={() => setShowEditor(false)} onSaved={(updated) => { setCreator(updated); setShowEditor(false); }} />
      )}
    </div>
  );
}