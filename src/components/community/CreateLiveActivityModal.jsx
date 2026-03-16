import React, { useState, useEffect } from "react";
import { X, MapPin, Clock, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

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
  const [coords, setCoords] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [image, setImage] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);

  useEffect(() => {
    detectLocation();
  }, []);

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
          const name = data.address?.suburb || data.address?.neighbourhood || data.address?.city || data.address?.town || "";
          setLocationName(name);
        } catch {}
        setLocationLoading(false);
      },
      () => setLocationLoading(false)
    );
  };

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setImage(file_url);
    setImageUploading(false);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
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
      image_url: image || undefined,
      location_name: locationName || undefined,
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
          onChange={e => setTitle(e.target.value)}
          placeholder="What's happening? (e.g. Pickup soccer game)"
          maxLength={80}
          className="w-full px-4 py-3 rounded-xl text-sm mb-3"
          style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
        />

        {/* Description */}
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Any extra details? (optional)"
          className="w-full px-4 py-3 rounded-xl text-sm resize-none mb-3"
          style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)", minHeight: 80 }}
        />

        {/* Location */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
            <MapPin className="w-4 h-4 shrink-0" style={{ color: "#f43f5e" }} />
            <input
              value={locationName}
              onChange={e => setLocationName(e.target.value)}
              placeholder="Location name"
              className="flex-1 text-sm bg-transparent outline-none"
              style={{ color: "var(--text-primary)" }}
            />
            {locationLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "var(--text-hint)" }} />}
          </div>
          <button onClick={detectLocation} className="px-3 py-2.5 rounded-xl text-xs font-semibold" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-secondary)" }}>
            📍 Auto
          </button>
        </div>

        {/* Duration */}
        <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--text-hint)" }}>Expires in</p>
        <div className="flex gap-2 mb-4">
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

        {/* Photo */}
        <label className="flex items-center gap-2 px-4 py-3 rounded-xl cursor-pointer mb-5" style={{ backgroundColor: "var(--bg-subtle)", border: "1px dashed var(--border-medium)" }}>
          {imageUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--text-hint)" }} />
          ) : image ? (
            <img src={image} alt="" className="w-8 h-8 rounded-lg object-cover" />
          ) : (
            <span className="text-lg">📷</span>
          )}
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{image ? "Change photo" : "Add a photo (optional)"}</span>
          <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
        </label>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || submitting}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #f43f5e, #e11d48)", opacity: !title.trim() || submitting ? 0.5 : 1 }}
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Post Activity
          </button>
        </div>
      </div>
    </div>
  );
}