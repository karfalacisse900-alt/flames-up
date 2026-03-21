import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Loader2, Plus, X } from "lucide-react";
import { uploadToCloudflare } from "@/utils/uploadToCloudflare";

const INTERESTS_OPTIONS = ["fitness", "music", "tech", "gaming", "art", "travel", "food", "movies", "books", "sports", "fashion", "coding", "photography", "nature", "crypto"];
const LOOKING_FOR_OPTIONS = ["friends", "study partners", "gym partners", "dating", "networking", "roommates", "collaborators"];

export default function EditProfile() {
  const navigate = useNavigate();
  const avatarInputRef = useRef(null);
  const [user, setUser] = useState(null);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");         // short headline
  const [aboutMe, setAboutMe] = useState(""); // long bio
  const [city, setCity] = useState("");
  const [interests, setInterests] = useState([]);
  const [lookingFor, setLookingFor] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setDisplayName(u?.display_name || u?.full_name || "");
      setUsername((u?.username || "").replace(/^@/, ""));
      setBio(u?.bio || "");
      setAboutMe(u?.about_me || "");
      setCity(u?.city || "");
      setInterests(u?.interests || []);
      setLookingFor(u?.looking_for || []);
      setAvatarUrl(u?.avatar_url || "");
    }).catch(() => {});
  }, []);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await uploadToCloudflare(file);
    setAvatarUrl(file_url);
    setUploading(false);
    e.target.value = "";
  };

  const toggleInterest = (item) => {
    setInterests(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const toggleLookingFor = (item) => {
    setLookingFor(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const handleSave = async () => {
    setSaving(true);
    const usernameToSave = username ? `@${username.replace(/^@/, "")}` : "";
    await base44.auth.updateMe({
      display_name: displayName,
      username: usernameToSave,
      bio,
      about_me: aboutMe,
      city,
      interests,
      looking_for: lookingFor,
      avatar_url: avatarUrl,
    });
    setSaving(false);
    navigate(-1);
  };

  const initials = (displayName || user?.email || "U")[0]?.toUpperCase();

  const Field = ({ label, children }) => (
    <div>
      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-hint)" }}>{label}</label>
      {children}
    </div>
  );

  const inputStyle = {
    backgroundColor: "var(--bg-card)",
    border: "1px solid var(--border-light)",
    color: "var(--text-primary)",
    minHeight: 48,
    borderRadius: 14,
    padding: "0 16px",
    fontSize: 14,
    width: "100%",
    outline: "none",
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg-app)", paddingBottom: 48 }}>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
        style={{ backgroundColor: "var(--bg-app)", paddingTop: "max(env(safe-area-inset-top,0px), 16px)", borderBottom: "1px solid var(--border-light)" }}>
        <button onClick={() => navigate(-1)} aria-label="Go back"
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <ArrowLeft className="w-4 h-4" style={{ color: "var(--text-primary)" }} />
        </button>
        <h1 className="text-base font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Edit Profile</h1>
        <button onClick={handleSave} disabled={saving || uploading}
          className="px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--accent-primary)", minHeight: 36 }}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      <div className="px-4 py-6 space-y-6 max-w-lg mx-auto w-full">
        {/* Avatar */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center text-3xl font-bold"
              style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)", border: "3px solid var(--border-light)" }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                : uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : initials}
            </div>
            <button onClick={() => avatarInputRef.current?.click()} disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: "var(--accent-primary)" }}>
              <Camera className="w-4 h-4" />
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
        </div>

        {/* Display Name */}
        <Field label="Display Name">
          <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" style={inputStyle} />
        </Field>

        {/* Username */}
        <Field label="Username">
          <div className="flex items-center" style={{ ...inputStyle, padding: "0 16px" }}>
            <span className="text-sm mr-0.5" style={{ color: "var(--text-hint)" }}>@</span>
            <input value={username} onChange={e => setUsername(e.target.value.replace(/^@/, ""))}
              placeholder="username" className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: "var(--text-primary)", minHeight: 48 }} />
          </div>
        </Field>

        {/* City */}
        <Field label="City">
          <input value={city} onChange={e => setCity(e.target.value)} placeholder="Where are you based?" style={inputStyle} />
        </Field>

        {/* Bio (headline) */}
        <Field label="Headline">
          <input value={bio} onChange={e => setBio(e.target.value)} placeholder="e.g. i'm the owner of this"
            maxLength={80} style={inputStyle} />
        </Field>

        {/* About Me (long bio) */}
        <Field label="About Me">
          <textarea value={aboutMe} onChange={e => setAboutMe(e.target.value)}
            placeholder="Tell people a bit about yourself…"
            rows={5} maxLength={500}
            className="resize-none outline-none"
            style={{ ...inputStyle, minHeight: "unset", padding: "12px 16px" }} />
          <p className="text-xs mt-1 text-right" style={{ color: "var(--text-hint)" }}>{aboutMe.length}/500</p>
        </Field>

        {/* Interests */}
        <Field label="Interests">
          <div className="flex flex-wrap gap-2 mt-1">
            {INTERESTS_OPTIONS.map(item => (
              <button key={item} onClick={() => toggleInterest(item)}
                className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
                style={{
                  backgroundColor: interests.includes(item) ? "var(--accent-primary)" : "var(--bg-card)",
                  color: interests.includes(item) ? "#fff" : "var(--text-secondary)",
                  border: `1px solid ${interests.includes(item) ? "var(--accent-primary)" : "var(--border-light)"}`,
                  minHeight: 36,
                }}>
                {item}
              </button>
            ))}
          </div>
        </Field>

        {/* Looking For */}
        <Field label="Looking For">
          <div className="flex flex-wrap gap-2 mt-1">
            {LOOKING_FOR_OPTIONS.map(item => (
              <button key={item} onClick={() => toggleLookingFor(item)}
                className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
                style={{
                  backgroundColor: lookingFor.includes(item) ? "var(--accent-secondary)" : "var(--bg-card)",
                  color: lookingFor.includes(item) ? "#fff" : "var(--text-secondary)",
                  border: `1px solid ${lookingFor.includes(item) ? "var(--accent-secondary)" : "var(--border-light)"}`,
                  minHeight: 36,
                }}>
                {item}
              </button>
            ))}
          </div>
        </Field>
      </div>
    </div>
  );
}