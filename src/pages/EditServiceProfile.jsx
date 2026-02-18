import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2, Upload, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

const SOCIAL_FIELDS = [
  { key: "fiverr_url", label: "Fiverr", placeholder: "https://fiverr.com/yourprofile", emoji: "🟢" },
  { key: "upwork_url", label: "Upwork", placeholder: "https://upwork.com/freelancers/~...", emoji: "🟩" },
  { key: "website_url", label: "Website", placeholder: "https://yourwebsite.com", emoji: "🌐" },
  { key: "instagram_url", label: "Instagram", placeholder: "https://instagram.com/yourhandle", emoji: "📸" },
  { key: "twitter_url", label: "Twitter/X", placeholder: "https://x.com/yourhandle", emoji: "🐦" },
  { key: "tiktok_url", label: "TikTok", placeholder: "https://tiktok.com/@yourhandle", emoji: "🎵" },
  { key: "youtube_url", label: "YouTube", placeholder: "https://youtube.com/@yourchannel", emoji: "▶️" },
  { key: "shopify_url", label: "Shopify Store", placeholder: "https://yourstore.myshopify.com", emoji: "🛒" },
  { key: "linkedin_url", label: "LinkedIn", placeholder: "https://linkedin.com/in/yourprofile", emoji: "💼" },
  { key: "github_url", label: "GitHub", placeholder: "https://github.com/yourusername", emoji: "💻" },
];

export default function EditServiceProfile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [skillInput, setSkillInput] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      // Find the service person profile owned by this user
      base44.entities.ServicePerson.filter({ created_by: u.email }).then(people => {
        if (people.length > 0) {
          setProfile(people[0]);
          setForm(people[0]);
        }
      });
    }).catch(() => {});
  }, []);

  const handleChange = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    handleChange("image_url", file_url);
    setImageUploading(false);
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s) return;
    handleChange("skills", [...(form.skills || []), s]);
    setSkillInput("");
  };

  const removeSkill = (i) => handleChange("skills", form.skills.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    await base44.entities.ServicePerson.update(profile.id, form);
    qc.invalidateQueries({ queryKey: ["servicepeople"] });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleCreate = async () => {
    if (!user || !form.name || !form.headline) return;
    setSaving(true);
    const p = await base44.entities.ServicePerson.create({ ...form, is_approved: true });
    setProfile(p);
    qc.invalidateQueries({ queryKey: ["servicepeople"] });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (!user) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#3C6E5A", borderTopColor: "transparent" }} />
    </div>
  );

  const field = (key, label, placeholder, type = "text") => (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: "#A8A8A8" }}>{label}</label>
      <input type={type} value={form[key] || ""} onChange={e => handleChange(key, e.target.value)} placeholder={placeholder}
        className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
        style={{ backgroundColor: "#fff", border: "1px solid #E5DFD0", color: "#2F2F2F" }} />
    </div>
  );

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: "#F5F2E8" }}>
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center gap-3 border-b" style={{ backgroundColor: "#FAF7F0", borderColor: "#E5DFD0" }}>
        <Link to={createPageUrl("Profile")} className="p-2 rounded-full" style={{ backgroundColor: "#EDE9E3" }}>
          <ArrowLeft className="w-4 h-4" style={{ color: "#6E6E6E" }} />
        </Link>
        <h2 className="font-semibold flex-1" style={{ fontFamily: "var(--font-serif)", color: "#2F2F2F" }}>
          {profile ? "Edit Service Profile" : "Create Service Profile"}
        </h2>
      </div>

      <div className="px-5 mt-5 space-y-5">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center text-2xl font-bold"
            style={{ backgroundColor: "#EEF3F0", color: "#3C6E5A", border: "2px solid #E5DFD0" }}>
            {form.image_url ? <img src={form.image_url} alt="avatar" className="w-full h-full object-cover" /> : (form.name?.[0] || "?")}
          </div>
          <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium"
            style={{ borderColor: "#3C6E5A", color: "#3C6E5A", backgroundColor: "#EEF3F0" }}>
            <Upload className="w-4 h-4" />
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            {imageUploading ? "Uploading…" : form.image_url ? "Change Photo" : "Upload Photo"}
          </label>
        </div>

        {/* Basic info */}
        <div className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: "#FAF7F0", border: "1px solid #E5DFD0" }}>
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#A8A8A8" }}>Basic Info</p>
          {field("name", "Name", "Your full name")}
          {field("headline", "Headline", "e.g. Logo Designer, Mix Engineer")}
          {field("starting_price", "Starting Price", "e.g. from $20")}
          {field("location", "Location", "e.g. New York, USA")}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: "#A8A8A8" }}>Platform</label>
            <select value={form.platform || "Independent"} onChange={e => handleChange("platform", e.target.value)}
              className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
              style={{ backgroundColor: "#fff", border: "1px solid #E5DFD0", color: "#2F2F2F" }}>
              {["Fiverr","Upwork","Independent","Coach","Other"].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: "#A8A8A8" }}>Category</label>
            <select value={form.category || "other"} onChange={e => handleChange("category", e.target.value)}
              className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
              style={{ backgroundColor: "#fff", border: "1px solid #E5DFD0", color: "#2F2F2F" }}>
              {["design","development","music","marketing","writing","video","coaching","other"].map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* About */}
        <div className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: "#FAF7F0", border: "1px solid #E5DFD0" }}>
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#A8A8A8" }}>About</p>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: "#A8A8A8" }}>Short Description</label>
            <textarea value={form.short_description || ""} onChange={e => handleChange("short_description", e.target.value)}
              placeholder="Brief summary shown on your card…" rows={2}
              className="w-full text-sm px-3 py-2.5 rounded-xl outline-none resize-none"
              style={{ backgroundColor: "#fff", border: "1px solid #E5DFD0", color: "#2F2F2F", fontFamily: "var(--font-serif)" }} />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: "#A8A8A8" }}>Full Description</label>
            <textarea value={form.long_description || ""} onChange={e => handleChange("long_description", e.target.value)}
              placeholder="Tell people about your experience, process, what makes you stand out…" rows={5}
              className="w-full text-sm px-3 py-2.5 rounded-xl outline-none resize-none"
              style={{ backgroundColor: "#fff", border: "1px solid #E5DFD0", color: "#2F2F2F", fontFamily: "var(--font-serif)" }} />
          </div>
        </div>

        {/* Skills */}
        <div className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: "#FAF7F0", border: "1px solid #E5DFD0" }}>
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#A8A8A8" }}>Skills</p>
          <div className="flex flex-wrap gap-2">
            {(form.skills || []).map((s, i) => (
              <span key={i} className="flex items-center gap-1 text-xs px-3 py-1 rounded-full"
                style={{ backgroundColor: "#EEF3F0", color: "#3C6E5A", border: "1px solid rgba(60,110,90,0.25)" }}>
                {s}
                <button onClick={() => removeSkill(i)} className="ml-0.5"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addSkill()}
              placeholder="Add a skill…"
              className="flex-1 text-sm px-3 py-2 rounded-xl outline-none"
              style={{ backgroundColor: "#fff", border: "1px solid #E5DFD0", color: "#2F2F2F" }} />
            <button onClick={addSkill} className="px-3 py-2 rounded-xl text-white text-sm"
              style={{ backgroundColor: "#3C6E5A" }}>
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Social Links */}
        <div className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: "#FAF7F0", border: "1px solid #E5DFD0" }}>
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#A8A8A8" }}>Links & Socials</p>
          {SOCIAL_FIELDS.map(({ key, label, placeholder, emoji }) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-lg w-6 text-center shrink-0">{emoji}</span>
              <input value={form[key] || ""} onChange={e => handleChange(key, e.target.value)} placeholder={placeholder}
                className="flex-1 text-sm px-3 py-2 rounded-xl outline-none"
                style={{ backgroundColor: "#fff", border: "1px solid #E5DFD0", color: "#2F2F2F" }} />
            </div>
          ))}
        </div>
      </div>

      {/* Save button */}
      <div className="fixed bottom-20 left-0 right-0 px-5 z-40">
        <button
          onClick={profile ? handleSave : handleCreate}
          disabled={saving || !form.name || !form.headline}
          className="w-full py-3.5 rounded-2xl text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
          style={{ backgroundColor: saved ? "#5a9e7a" : "#3C6E5A" }}>
          {saved ? "✓ Saved!" : saving ? "Saving…" : <><Save className="w-4 h-4" /> {profile ? "Save Changes" : "Create Profile"}</>}
        </button>
      </div>
    </div>
  );
}

// Fix missing import
function X({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}