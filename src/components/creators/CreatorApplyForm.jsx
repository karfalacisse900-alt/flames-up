import React, { useState } from "react";
import { createPortal } from "react-dom";
import { base44 } from "@/api/base44Client";
import { X, Upload, Loader2 } from "lucide-react";

const CATEGORIES = [
  { value: "painter", label: "🎨 Painter" },
  { value: "dancer", label: "💃 Dancer" },
  { value: "musician", label: "🎵 Musician" },
  { value: "videographer", label: "🎬 Videographer" },
  { value: "photographer", label: "📸 Photographer" },
  { value: "street_performer", label: "🎭 Street Performer" },
  { value: "comedian", label: "😂 Comedian" },
  { value: "magician", label: "🪄 Magician" },
  { value: "tattoo_artist", label: "✒️ Tattoo Artist" },
  { value: "caricaturist", label: "✏️ Caricaturist" },
  { value: "other", label: "🌟 Other" },
];

export default function CreatorApplyForm({ user, onClose, onCreated }) {
  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    category: "",
    description: "",
    price: "",
    city: "",
    instagram_url: "",
    tiktok_url: "",
    youtube_url: "",
    website_url: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleImageChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.category) return;
    setSubmitting(true);
    let profile_image = "";
    if (imageFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
      profile_image = file_url;
    }
    const creator = await base44.entities.Creator.create({
      ...form,
      profile_image,
      user_id: user?.id || "",
      user_email: user?.email || "",
      approval_status: "pending",
      availability_status: "closed",
    });
    onCreated(creator);
    setSubmitting(false);
  };

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex flex-col overflow-y-auto"
      style={{ backgroundColor: "var(--bg-modal)" }}>
      <div className="max-w-lg mx-auto w-full px-4 pb-12 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
            Creator Application
          </h2>
          <button onClick={onClose} className="p-2 rounded-full" style={{ backgroundColor: "var(--bg-subtle)" }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Profile Image */}
          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-hint)" }}>Profile Photo</label>
            <label className="flex items-center justify-center w-full h-36 rounded-2xl cursor-pointer overflow-hidden"
              style={{ border: "2px dashed var(--border-medium)", backgroundColor: "var(--bg-subtle)" }}>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              {imagePreview ? (
                <img src={imagePreview} className="w-full h-full object-cover" alt="preview" />
              ) : (
                <div className="text-center">
                  <Upload className="w-6 h-6 mx-auto mb-1" style={{ color: "var(--text-hint)" }} />
                  <p className="text-xs" style={{ color: "var(--text-hint)" }}>Upload photo</p>
                </div>
              )}
            </label>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-hint)" }}>Full Name *</label>
            <input value={form.full_name} onChange={set("full_name")} required
              className="w-full px-4 py-3 rounded-2xl" placeholder="Your full name"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-hint)" }}>Category *</label>
            <select value={form.category} onChange={set("category")} required
              className="w-full px-4 py-3 rounded-2xl"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}>
              <option value="">Select category</option>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-hint)" }}>Description</label>
            <textarea value={form.description} onChange={set("description")} rows={3}
              className="w-full px-4 py-3 rounded-2xl resize-none"
              placeholder="Describe your services..."
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
          </div>

          {/* Price */}
          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-hint)" }}>Price / Price Range</label>
            <input value={form.price} onChange={set("price")}
              className="w-full px-4 py-3 rounded-2xl" placeholder="e.g. $20–$50 / session"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
          </div>

          {/* City */}
          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-hint)" }}>City</label>
            <input value={form.city} onChange={set("city")}
              className="w-full px-4 py-3 rounded-2xl" placeholder="Your city"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
          </div>

          {/* Social Links */}
          <div>
            <p className="text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: "var(--text-hint)" }}>Social Links (optional)</p>
            <div className="space-y-2">
              {[
                { key: "instagram_url", placeholder: "Instagram URL", emoji: "📸" },
                { key: "tiktok_url", placeholder: "TikTok URL", emoji: "🎵" },
                { key: "youtube_url", placeholder: "YouTube URL", emoji: "▶️" },
                { key: "website_url", placeholder: "Website URL", emoji: "🌐" },
              ].map(({ key, placeholder, emoji }) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-lg">{emoji}</span>
                  <input value={form[key]} onChange={set(key)}
                    className="flex-1 px-4 py-2.5 rounded-xl" placeholder={placeholder}
                    style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
                </div>
              ))}
            </div>
          </div>

          <button type="submit" disabled={submitting}
            className="w-full py-4 rounded-2xl font-bold text-white text-base mt-2"
            style={{ background: "linear-gradient(135deg, #E05C2A, #F97316)", boxShadow: "0 8px 24px rgba(224,92,42,0.35)" }}>
            {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Submit Application"}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}