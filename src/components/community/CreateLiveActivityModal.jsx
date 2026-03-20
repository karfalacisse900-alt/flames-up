import React, { useState, useEffect } from "react";
import { X, MapPin, Clock, Loader2, Search } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { uploadToCloudflare } from "@/utils/uploadToCloudflare";
import { uploadToStream } from "@/utils/uploadToStream";

const CATEGORIES = [
  { value: "food",   label: "Food",   emoji: "🍕" },
  { value: "sports", label: "Sports", emoji: "⚽" },
  { value: "music",  label: "Music",  emoji: "🎵" },
  { value: "market", label: "Market", emoji: "🛍️" },
  { value: "study",  label: "Study",  emoji: "📚" },
  { value: "social", label: "Social", emoji: "🎉" },
  { value: "other",  label: "Other",  emoji: "📍" },
];

const DURATIONS = [
  { value: 1,  label: "1 hour" },
  { value: 3,  label: "3 hours" },
  { value: 6,  label: "6 hours" },
  { value: 24, label: "24 hours" },
];

export default function CreateLiveActivityModal({ user, onClose }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [duration, setDuration] = useState(3);
  const [locationName, setLocationName] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [coords, setCoords] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationSearchLoading, setLocationSearchLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mediaUrl, setMediaUrl] = useState(null);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    detectLocation();
  }, []);

  // Auto-search location as user types
  useEffect(() => {
    if (!locationSearch || locationSearch.length < 3) {
      setLocationSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLocationSearchLoading(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationSearch)}&format=json&limit=5`);
        const data = await res.json();
        setLocationSuggestions(data.map(d => ({
          name: d.display_name,
          short: d.display_name.split(",").slice(0, 3).join(","),
          lat: parseFloat(d.lat),
          lng: parseFloat(d.lon),
        })));
      } catch {}
      setLocationSearchLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [locationSearch]);

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCoords({ lat, lng });
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const data = await res.json();
          const name = data.address?.road
            ? `${data.address.road}${data.address.suburb ? ", " + data.address.suburb : ""}, ${data.address.city || data.address.town || ""}`
            : data.address?.suburb || data.address?.city || data.address?.town || "";
          setLocationName(name);
          setLocationSearch(name);
        } catch {}
        setLocationLoading(false);
      },
      () => setLocationLoading(false)
    );
  };

  const selectSuggestion = (s) => {
    setLocationName(s.short);
    setLocationSearch(s.short);
    setCoords({ lat: s.lat, lng: s.lng });
    setLocationSuggestions([]);
  };

  const handleMedia = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaUploading(true);
    setErrors(prev => ({ ...prev, media: null }));
    const isVid = file.type?.startsWith("video");
    if (isVid) {
      const { stream_url } = await uploadToStream(file);
      setMediaUrl(stream_url);
    } else {
      const { file_url } = await uploadToCloudflare(file);
      setMediaUrl(file_url);
    }
    setMediaUploading(false);
  };

  const validate = () => {
    const newErrors = {};
    if (!mediaUrl) newErrors.media = "A photo or video is required";
    if (!locationName.trim()) newErrors.location = "Please enter or confirm the location";
    if (!title.trim()) newErrors.title = "Please enter a title";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || submitting) return;
    setSubmitting(true);
    const expiresAt = new Date(Date.now() + duration * 3600000).toISOString();
    await base44.entities.LiveActivity.create({
      title: title.trim(),
      description: description.trim(),
      category,
      duration_hours: duration,
      expires_at: expiresAt,
      author_email: user.email,
      author_name: user.full_name || user.email,
      is_anonymous: false,
      image_url: mediaUrl,
      location_name: locationName.trim(),
      location_lat: coords?.lat,
      location_lng: coords?.lng,
      reaction_count: 0,
      reacted_by: [],
      going_count: 0,
      going_by: [],
      comment_count: 0,
    });
    qc.invalidateQueries({ queryKey: ["liveActivities"] });
    onClose();
  };

  const isVideo = mediaUrl && (mediaUrl.includes(".mp4") || mediaUrl.includes(".mov") || mediaUrl.includes("video"));

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 max-h-[92vh] overflow-y-auto"
        style={{ backgroundColor: "var(--bg-card)", boxShadow: "0 -8px 32px rgba(0,0,0,0.2)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              Post Live Activity
            </h3>
            <p className="text-xs" style={{ color: "var(--text-hint)" }}>Share what's happening nearby</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--bg-subtle)" }}>
            <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>

        {/* ── MEDIA (Required) ── */}
        <div className="mb-4">
          <div className="flex items-center gap-1 mb-2">
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-hint)" }}>Photo / Video</p>
            <span className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "#f43f5e" }}>Required</span>
          </div>

          {mediaUrl ? (
            <div className="relative rounded-2xl overflow-hidden" style={{ height: 180 }}>
              {isVideo ? (
                <video src={mediaUrl} className="w-full h-full object-cover" muted playsInline />
              ) : (
                <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
              )}
              <button
                onClick={() => setMediaUrl(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          ) : (
            <label
              className="flex flex-col items-center justify-center gap-2 rounded-2xl cursor-pointer"
              style={{
                height: 140,
                border: `2px dashed ${errors.media ? "#f43f5e" : "var(--border-medium)"}`,
                backgroundColor: errors.media ? "rgba(244,63,94,0.05)" : "var(--bg-subtle)",
              }}
            >
              {mediaUploading ? (
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--text-hint)" }} />
              ) : (
                <>
                  <span className="text-3xl">📷</span>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Tap to add photo or video</p>
                  <p className="text-xs" style={{ color: "var(--text-hint)" }}>Required to post</p>
                </>
              )}
              <input type="file" accept="image/*,video/*" className="hidden" onChange={handleMedia} />
            </label>
          )}
          {errors.media && <p className="text-xs mt-1.5 font-semibold" style={{ color: "#f43f5e" }}>{errors.media}</p>}
        </div>

        {/* Category */}
        <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--text-hint)" }}>Category</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: category === cat.value ? "#f43f5e" : "var(--bg-subtle)",
                color: category === cat.value ? "#fff" : "var(--text-secondary)",
                border: `1.5px solid ${category === cat.value ? "#f43f5e" : "var(--border-light)"}`,
              }}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* Title */}
        <input
          value={title}
          onChange={e => { setTitle(e.target.value); setErrors(p => ({ ...p, title: null })); }}
          placeholder="What's happening? (e.g. Pickup soccer game)"
          maxLength={80}
          className="w-full px-4 py-3 rounded-xl text-sm mb-1"
          style={{
            backgroundColor: "var(--bg-subtle)",
            border: `1px solid ${errors.title ? "#f43f5e" : "var(--border-light)"}`,
            color: "var(--text-primary)",
          }}
        />
        {errors.title && <p className="text-xs mb-2 font-semibold" style={{ color: "#f43f5e" }}>{errors.title}</p>}

        {/* Description */}
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Any extra details? (optional)"
          className="w-full px-4 py-3 rounded-xl text-sm resize-none mb-4"
          style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)", minHeight: 72 }}
        />

        {/* ── LOCATION (Required) ── */}
        <div className="mb-4">
          <div className="flex items-center gap-1 mb-2">
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-hint)" }}>Location / Address</p>
            <span className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "#f43f5e" }}>Required</span>
          </div>

          <div className="relative">
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
              style={{ border: `1.5px solid ${errors.location ? "#f43f5e" : "var(--border-light)"}`, backgroundColor: "var(--bg-subtle)" }}
            >
              <MapPin className="w-4 h-4 shrink-0" style={{ color: "#f43f5e" }} />
              <input
                value={locationSearch}
                onChange={e => { setLocationSearch(e.target.value); setLocationName(e.target.value); setErrors(p => ({ ...p, location: null })); }}
                placeholder="Search address or place name…"
                className="flex-1 text-sm bg-transparent outline-none"
                style={{ color: "var(--text-primary)" }}
              />
              {locationSearchLoading && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" style={{ color: "var(--text-hint)" }} />}
              <button
                onClick={detectLocation}
                className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: "rgba(244,63,94,0.1)", color: "#f43f5e" }}
              >
                {locationLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "📍 Me"}
              </button>
            </div>

            {/* Suggestions dropdown */}
            {locationSuggestions.length > 0 && (
              <div
                className="absolute left-0 right-0 top-full mt-1 rounded-2xl overflow-hidden z-20"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
              >
                {locationSuggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => selectSuggestion(s)}
                    className="w-full flex items-start gap-2 px-4 py-2.5 text-left border-b last:border-b-0"
                    style={{ borderColor: "var(--border-subtle)" }}
                  >
                    <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#f43f5e" }} />
                    <span className="text-xs leading-relaxed" style={{ color: "var(--text-primary)" }}>{s.short}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {errors.location && <p className="text-xs mt-1.5 font-semibold" style={{ color: "#f43f5e" }}>{errors.location}</p>}
        </div>

        {/* Duration */}
        <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--text-hint)" }}>Expires in</p>
        <div className="flex gap-2 mb-5">
          {DURATIONS.map(d => (
            <button
              key={d.value}
              onClick={() => setDuration(d.value)}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold"
              style={{
                backgroundColor: duration === d.value ? "#f43f5e" : "var(--bg-subtle)",
                color: duration === d.value ? "#fff" : "var(--text-secondary)",
                border: `1.5px solid ${duration === d.value ? "#f43f5e" : "var(--border-light)"}`,
              }}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #f43f5e, #e11d48)", opacity: submitting ? 0.6 : 1 }}
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Post Activity
          </button>
        </div>
      </div>
    </div>
  );
}