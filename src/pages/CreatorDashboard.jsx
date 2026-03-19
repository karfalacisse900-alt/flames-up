import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { MapPin, X, Instagram, Youtube, Globe, Edit3, CheckCircle, Clock, AlertCircle, Upload, Loader2, MessageCircle, Check } from "lucide-react";
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
  const locationWatchRef = useRef(null);

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
        }
      } catch {}
      setLoading(false);
    };
    load();
    return () => stopTracking();
  }, []);

  const stopTracking = () => {
    if (locationWatchRef.current !== null) {
      navigator.geolocation.clearWatch(locationWatchRef.current);
      locationWatchRef.current = null;
    }
  };

  const startTracking = (creatorId) => {
    if (!navigator.geolocation) return;
    locationWatchRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        await base44.entities.Creator.update(creatorId, {
          latitude,
          longitude,
          last_updated: new Date().toISOString(),
        });
      },
      null,
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
  };

  const handleOpen = async () => {
    if (!creator || toggling) return;
    setToggling(true);
    try {
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 })
      );
      const { latitude, longitude } = pos.coords;
      const updated = await base44.entities.Creator.update(creator.id, {
        availability_status: "open",
        latitude,
        longitude,
        last_updated: new Date().toISOString(),
      });
      setCreator(prev => ({ ...prev, availability_status: "open", latitude, longitude }));
      startTracking(creator.id);
    } catch (e) {
      alert("Could not get your location. Please enable GPS and try again.");
    }
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

  const handleClose = async () => {
    if (!creator || toggling) return;
    setToggling(true);
    stopTracking();
    await base44.entities.Creator.update(creator.id, {
      availability_status: "closed",
      last_updated: new Date().toISOString(),
    });
    setCreator(prev => ({ ...prev, availability_status: "closed" }));
    setToggling(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-app)" }}>
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--accent-primary)" }} />
    </div>
  );

  if (!user) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ background: "var(--bg-app)" }}>
      <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Sign in to access the Creator Dashboard</p>
    </div>
  );

  // No creator profile yet
  if (!creator) return (
    <div className="min-h-screen" style={{ background: "var(--bg-app)" }}>
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 text-4xl"
            style={{ background: "linear-gradient(135deg, #E05C2A, #F97316)" }}>
            🎨
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
            Become a Street Creator
          </h1>
          <p className="text-sm" style={{ color: "var(--text-hint)" }}>
            Apply to showcase your talent on the map. Painters, musicians, dancers, photographers and more are welcome.
          </p>
        </div>
        <button
          onClick={() => setShowApply(true)}
          className="w-full py-4 rounded-2xl font-bold text-white text-lg"
          style={{ background: "linear-gradient(135deg, #E05C2A, #F97316)", boxShadow: "0 8px 24px rgba(224,92,42,0.4)" }}>
          Apply Now
        </button>
      </div>
      {showApply && (
        <CreatorApplyForm
          user={user}
          onClose={() => setShowApply(false)}
          onCreated={(c) => { setCreator(c); setShowApply(false); }}
        />
      )}
    </div>
  );

  const isPending = creator.approval_status === "pending";
  const isRejected = creator.approval_status === "rejected";
  const isApproved = creator.approval_status === "approved";
  const isOpen = creator.availability_status === "open";

  // Pending/Rejected states
  if (!isApproved) return (
    <div className="min-h-screen" style={{ background: "var(--bg-app)" }}>
      <div className="max-w-lg mx-auto px-4 py-8 text-center">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 text-4xl"
          style={{ background: isPending ? "#FFF7ED" : "#FEF2F2" }}>
          {isPending ? <Clock className="w-10 h-10" style={{ color: "#F97316" }} /> : <X className="w-10 h-10" style={{ color: "#EF4444" }} />}
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
          {isPending ? "Application Under Review" : "Application Rejected"}
        </h2>
        <p className="text-sm" style={{ color: "var(--text-hint)" }}>
          {isPending
            ? "Your creator application is being reviewed. You'll gain access once approved by an admin."
            : "Your application was not approved. Please contact support for more information."}
        </p>
        <div className="mt-6 p-4 rounded-2xl text-left" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <p className="text-xs font-bold mb-1" style={{ color: "var(--text-hint)" }}>SUBMITTED PROFILE</p>
          <p className="font-bold" style={{ color: "var(--text-primary)" }}>{creator.full_name}</p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{CATEGORY_LABELS[creator.category]}</p>
        </div>
      </div>
    </div>
  );

  // Approved Dashboard
  return (
    <div className="min-h-screen pb-10" style={{ background: "var(--bg-app)" }}>
      <div className="max-w-lg mx-auto px-4 pt-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: "var(--accent-primary)" }}>Creator Dashboard</p>
            <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
              {creator.full_name}
            </h1>
            <p className="text-sm" style={{ color: "var(--text-hint)" }}>{CATEGORY_LABELS[creator.category]}</p>
          </div>
          <button
            onClick={() => setShowEditor(true)}
            className="p-2.5 rounded-2xl"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
            <Edit3 className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>

        {/* Profile Preview */}
        <div className="rounded-3xl overflow-hidden mb-6" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          {creator.profile_image ? (
            <img src={creator.profile_image} alt={creator.full_name} className="w-full h-44 object-cover" />
          ) : (
            <div className="w-full h-44 flex items-center justify-center text-6xl"
              style={{ background: "linear-gradient(135deg, #E05C2A22, #F9731622)" }}>
              🎨
            </div>
          )}
          <div className="p-4">
            {creator.description && (
              <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
                {creator.description}
              </p>
            )}
            {creator.price && (
              <span className="inline-block text-sm font-bold px-3 py-1.5 rounded-full"
                style={{ backgroundColor: "#F0FDF4", color: "#16A34A" }}>
                💰 {creator.price}
              </span>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-center gap-2 mb-6 py-2 rounded-2xl"
          style={{ backgroundColor: isOpen ? "#F0FDF4" : "var(--bg-subtle)", border: `1px solid ${isOpen ? "#86EFAC" : "var(--border-light)"}` }}>
          <div className={`w-2.5 h-2.5 rounded-full ${isOpen ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
          <span className="text-sm font-bold" style={{ color: isOpen ? "#16A34A" : "var(--text-secondary)" }}>
            {isOpen ? "You're LIVE on the map" : "You're hidden from the map"}
          </span>
        </div>

        {/* OPEN / CLOSE Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            onClick={handleOpen}
            disabled={isOpen || toggling}
            className="py-5 rounded-3xl font-black text-xl text-white relative overflow-hidden"
            style={{
              background: isOpen ? "#86EFAC" : "linear-gradient(135deg, #16A34A, #22C55E)",
              boxShadow: isOpen ? "none" : "0 8px 32px rgba(22,163,74,0.4)",
              opacity: isOpen ? 0.6 : 1,
            }}>
            {toggling && !isOpen ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (
              <>
                <div className="text-3xl mb-1">🟢</div>
                OPEN
              </>
            )}
          </button>

          <button
            onClick={handleClose}
            disabled={!isOpen || toggling}
            className="py-5 rounded-3xl font-black text-xl text-white"
            style={{
              background: !isOpen ? "#FCA5A5" : "linear-gradient(135deg, #DC2626, #EF4444)",
              boxShadow: !isOpen ? "none" : "0 8px 32px rgba(220,38,38,0.4)",
              opacity: !isOpen ? 0.6 : 1,
            }}>
            {toggling && isOpen ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (
              <>
                <div className="text-3xl mb-1">🔴</div>
                CLOSE
              </>
            )}
          </button>
        </div>

        {/* Status Message */}
        <div className="rounded-2xl p-4 mb-6" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-hint)" }}>Live Status Message</p>
            </div>
            {!editingStatus && (
              <button onClick={() => setEditingStatus(true)}
                className="text-xs font-bold px-2 py-1 rounded-lg"
                style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
                Edit
              </button>
            )}
          </div>
          {editingStatus ? (
            <div className="flex gap-2">
              <input
                value={statusMsg}
                onChange={e => setStatusMsg(e.target.value)}
                maxLength={80}
                placeholder="e.g. Giving 20% discount today! 🎉"
                className="flex-1 px-3 py-2 rounded-xl text-sm"
                style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
              />
              <button onClick={saveStatus} disabled={savingStatus}
                className="px-3 py-2 rounded-xl text-white text-sm font-bold"
                style={{ background: "linear-gradient(135deg,#16A34A,#22C55E)" }}>
                {savingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
              <button onClick={() => { setEditingStatus(false); setStatusMsg(creator.status_message || ""); }}
                className="px-3 py-2 rounded-xl text-sm"
                style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : creator.status_message ? (
            <div className="flex items-start gap-2 mt-1">
              <div className="text-lg">💬</div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{creator.status_message}</p>
            </div>
          ) : (
            <p className="text-xs italic mt-1" style={{ color: "var(--text-hint)" }}>No status message set. Add one to attract customers!</p>
          )}
        </div>

        {/* Portfolio */}
        <div className="mb-6">
          <PortfolioUploader creator={creator} onUpdated={setCreator} />
        </div>

        {/* Location info */}
        {isOpen && creator.latitude && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl mb-6"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
            <MapPin className="w-4 h-4 shrink-0" style={{ color: "var(--accent-primary)" }} />
            <p className="text-xs" style={{ color: "var(--text-hint)" }}>
              Location active · {creator.latitude.toFixed(4)}, {creator.longitude.toFixed(4)}
            </p>
          </div>
        )}

        {/* Social Links */}
        {(creator.instagram_url || creator.tiktok_url || creator.youtube_url || creator.website_url) && (
          <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-hint)" }}>Social Links</p>
            <div className="flex flex-wrap gap-2">
              {creator.instagram_url && (
                <a href={creator.instagram_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
                  style={{ backgroundColor: "#FDF2F8", color: "#DB2777" }}>
                  <Instagram className="w-3.5 h-3.5" /> Instagram
                </a>
              )}
              {creator.tiktok_url && (
                <a href={creator.tiktok_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
                  style={{ backgroundColor: "#F0FFFE", color: "#0D9488" }}>
                  🎵 TikTok
                </a>
              )}
              {creator.youtube_url && (
                <a href={creator.youtube_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
                  style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}>
                  <Youtube className="w-3.5 h-3.5" /> YouTube
                </a>
              )}
              {creator.website_url && (
                <a href={creator.website_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
                  style={{ backgroundColor: "#EEF2FF", color: "#4F46E5" }}>
                  <Globe className="w-3.5 h-3.5" /> Website
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {showEditor && (
        <CreatorProfileEditor
          creator={creator}
          onClose={() => setShowEditor(false)}
          onSaved={(updated) => { setCreator(updated); setShowEditor(false); }}
        />
      )}
    </div>
  );
}