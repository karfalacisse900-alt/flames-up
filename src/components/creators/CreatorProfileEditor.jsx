import React, { useState } from "react";
import { createPortal } from "react-dom";
import { base44 } from "@/api/base44Client";
import { X, Upload, Loader2, Plus, Trash2 } from "lucide-react";

export default function CreatorProfileEditor({ creator, onClose, onSaved }) {
  const [form, setForm] = useState({
    description: creator.description || "",
    price: creator.price || "",
    city: creator.city || "",
    status_message: creator.status_message || "",
    instagram_url: creator.instagram_url || "",
    tiktok_url: creator.tiktok_url || "",
    youtube_url: creator.youtube_url || "",
    website_url: creator.website_url || "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(creator.profile_image || null);
  const [portfolioImages, setPortfolioImages] = useState(creator.portfolio_images || []);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handlePortfolioAdd = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploadingPortfolio(true);
    const urls = await Promise.all(files.map(async (f) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: f });
      return file_url;
    }));
    setPortfolioImages(prev => [...prev, ...urls]);
    setUploadingPortfolio(false);
  };

  const handleRemovePortfolio = (idx) => {
    setPortfolioImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    let profile_image = creator.profile_image;
    if (imageFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
      profile_image = file_url;
    }
    await base44.entities.Creator.update(creator.id, { ...form, profile_image, portfolio_images: portfolioImages });
    onSaved({ ...creator, ...form, profile_image, portfolio_images: portfolioImages });
    setSaving(false);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex flex-col overflow-y-auto"
      style={{ backgroundColor: "var(--bg-modal)" }}>
      <div className="max-w-lg mx-auto w-full px-4 pb-12 pt-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Edit Creator Profile</h2>
          <button onClick={onClose} className="p-2 rounded-full" style={{ backgroundColor: "var(--bg-subtle)" }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Profile Image */}
          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-hint)" }}>Profile Photo</label>
            <label className="flex items-center justify-center w-full h-36 rounded-2xl cursor-pointer overflow-hidden"
              style={{ border: "2px dashed var(--border-medium)", backgroundColor: "var(--bg-subtle)" }}>
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files[0]; if (!f) return; setImageFile(f); setImagePreview(URL.createObjectURL(f)); }} />
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

          {/* Status Message */}
          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-hint)" }}>Live Status Message</label>
            <input value={form.status_message} onChange={set("status_message")} maxLength={80}
              className="w-full px-4 py-3 rounded-2xl" placeholder='e.g. "Giving 20% discount today! 🎉"'
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
            <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>Shown as a talk bubble on your map pin. Max 80 chars.</p>
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
              className="w-full px-4 py-3 rounded-2xl" placeholder="e.g. $20–$50"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
          </div>

          {/* City */}
          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-hint)" }}>City</label>
            <input value={form.city} onChange={set("city")}
              className="w-full px-4 py-3 rounded-2xl" placeholder="Your city"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
          </div>

          {/* Portfolio Images */}
          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-hint)" }}>Portfolio / Work Photos</label>
            <div className="grid grid-cols-3 gap-2">
              {portfolioImages.map((url, idx) => (
                <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => handleRemovePortfolio(idx)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
                    <Trash2 className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
              <label className="aspect-square rounded-2xl flex flex-col items-center justify-center cursor-pointer"
                style={{ border: "2px dashed var(--border-medium)", backgroundColor: "var(--bg-subtle)" }}>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handlePortfolioAdd} />
                {uploadingPortfolio
                  ? <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--text-hint)" }} />
                  : <Plus className="w-5 h-5" style={{ color: "var(--text-hint)" }} />}
                <span className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>Add</span>
              </label>
            </div>
          </div>

          {/* Social Links */}
          <div>
            <p className="text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: "var(--text-hint)" }}>Social Links</p>
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

          <button type="submit" disabled={saving}
            className="w-full py-4 rounded-2xl font-bold text-white text-base"
            style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", boxShadow: "0 8px 24px rgba(79,70,229,0.35)" }}>
            {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Save Changes"}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}