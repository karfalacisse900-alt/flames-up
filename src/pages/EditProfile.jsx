import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Loader2 } from "lucide-react";
import { uploadToCloudflare } from "@/utils/uploadToCloudflare";
import { useQuery } from "@tanstack/react-query";

const INTERESTS_OPTIONS = [
  "Music", "Art", "Gaming", "Sports", "Travel", "Food", "Tech", "Fashion",
  "Books", "Fitness", "Movies", "Photography", "Dance", "Cooking", "Nature",
  "Business", "Science", "Politics", "Spirituality", "Comedy"
];

const LOOKING_FOR_OPTIONS = [
  "Friends", "Dating", "Networking", "Study Partner", "Roommate",
  "Collaboration", "Mentorship", "Events", "Romance"
];

function FieldInput({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-hint)" }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl text-sm outline-none"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-primary)", minHeight: 48 }}
      />
    </div>
  );
}

function TagChips({ label, options, selected, onChange }) {
  const toggle = (opt) => {
    if (selected.includes(opt)) onChange(selected.filter(x => x !== opt));
    else onChange([...selected, opt]);
  };
  return (
    <div>
      <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "var(--text-hint)" }}>{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
          const active = selected.includes(opt);
          return (
            <button key={opt} onClick={() => toggle(opt)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                backgroundColor: active ? "var(--accent-primary)" : "var(--bg-card)",
                color: active ? "#fff" : "var(--text-secondary)",
                border: `1.5px solid ${active ? "var(--accent-primary)" : "var(--border-light)"}`,
                minHeight: 36,
              }}>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function EditProfile() {
  const navigate = useNavigate();
  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const { data: user } = useQuery({
    queryKey: ["me-editprofile"],
    queryFn: () => base44.auth.me(),
  });

  const [avatarUrl, setAvatarUrl] = useState(null);
  const [bannerUrl, setBannerUrl] = useState(null);
  const [displayName, setDisplayName] = useState(null);
  const [username, setUsername] = useState(null);
  const [bio, setBio] = useState(null);
  const [aboutMe, setAboutMe] = useState(null);
  const [city, setCity] = useState(null);
  const [age, setAge] = useState(null);
  const [hobbies, setHobbies] = useState(null);
  const [website, setWebsite] = useState(null);
  const [tiktok, setTiktok] = useState(null);
  const [instagram, setInstagram] = useState(null);
  const [interests, setInterests] = useState(null);
  const [lookingFor, setLookingFor] = useState(null);
  const [displayNameError, setDisplayNameError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const val = (local, key, fallback = "") => local ?? (user?.[key] ?? fallback);
  const currentAvatar = val(avatarUrl, "avatar_url");
  const currentBanner = val(bannerUrl, "banner_url");
  const currentName = val(displayName, "display_name") || (user?.full_name ?? "");
  const currentUsername = (val(username, "username")).replace(/^@/, "");
  const currentBio = val(bio, "bio");
  const currentAboutMe = val(aboutMe, "about_me");
  const currentCity = val(city, "city");
  const currentAge = val(age, "age");
  const currentHobbies = val(hobbies, "hobbies");
  const currentWebsite = val(website, "website") || val(null, "website_url");
  const currentTiktok = val(tiktok, "tiktok");
  const currentInstagram = val(instagram, "instagram");
  const currentInterests = interests ?? (user?.interests ?? []);
  const currentLookingFor = lookingFor ?? (user?.looking_for ?? []);

  const getInitials = () => (currentName || "U").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const validateDisplayName = (name) => {
    if (/[^a-zA-Z\s\-']/.test(name)) {
      setDisplayNameError("Display name can only contain letters, spaces, hyphens, and apostrophes");
      return false;
    }
    setDisplayNameError("");
    return true;
  };

  const handleDisplayNameChange = (val) => {
    setDisplayName(val);
    validateDisplayName(val);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const { file_url } = await uploadToCloudflare(file);
    setAvatarUrl(file_url);
    setUploading(false);
    e.target.value = "";
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const { file_url } = await uploadToCloudflare(file);
    setBannerUrl(file_url);
    setUploading(false);
    e.target.value = "";
  };

  const handleSave = async () => {
    if (!validateDisplayName(currentName)) return;
    setSaving(true);
    const usernameToSave = currentUsername ? `@${currentUsername.replace(/^@/, "")}` : "";
    // Check username availability
    if (usernameToSave && usernameToSave !== user?.username) {
      const res = await base44.functions.invoke("checkUsernameAvailable", { username: usernameToSave }).catch(() => null);
      if (res?.data?.available === false) {
        alert("That username is already taken. Please choose a different one.");
        setSaving(false);
        return;
      }
    }
    const profileData = {
      avatar_url: currentAvatar,
      banner_url: currentBanner,
      display_name: currentName,
      username: usernameToSave,
      bio: currentBio,
      about_me: currentAboutMe,
      city: currentCity,
      age: currentAge ? String(currentAge) : "",
      hobbies: currentHobbies,
      website: currentWebsite,
      website_url: currentWebsite,
      tiktok: currentTiktok,
      instagram: currentInstagram,
      interests: currentInterests,
      looking_for: currentLookingFor,
    };
    // Save to User entity (own data)
    await base44.auth.updateMe(profileData);

    // Also save to public UserProfile entity so others can view it
    const existing = await base44.entities.UserProfile.filter({ user_email: user.email }).catch(() => []);
    const publicData = {
      user_email: user.email,
      user_name: currentName || user.full_name || user.email,
      display_name: currentName,
      username: usernameToSave,
      bio: currentBio,
      about_me: currentAboutMe,
      avatar_url: currentAvatar,
      banner_url: currentBanner,
      city: currentCity,
      age: currentAge ? String(currentAge) : "",
      hobbies: currentHobbies,
      website: currentWebsite,
      tiktok: currentTiktok,
      await base44.entities.UserProfile.update(existing[0].id, publicData);
    } else {
      await base44.entities.UserProfile.create(publicData);
    }

    setSaving(false);
    navigate(-1);
  };

  const sectionTitle = (label) => (
    <p className="text-xs font-bold uppercase tracking-widest mt-6 mb-3" style={{ color: "var(--text-hint)" }}>{label}</p>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg-app)", display: "flex", flexDirection: "column", maxHeight: "100vh" }}>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
        style={{ backgroundColor: "var(--bg-app)", paddingTop: "max(env(safe-area-inset-top,0px), 16px)", borderBottom: "1px solid var(--border-light)", flexShrink: 0 }}>
        <button onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <ArrowLeft className="w-4 h-4" style={{ color: "var(--text-primary)" }} />
        </button>
        <h1 className="text-base font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Edit Profile</h1>
        <button onClick={handleSave} disabled={saving || uploading}
          className="px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--accent-primary)", minHeight: 38 }}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      <div className="px-4 pb-20 overflow-y-auto" style={{ paddingTop: 16, flex: 1 }}>
        <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
        <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />

        {/* Banner + Avatar */}
        <div className="relative rounded-2xl overflow-hidden" style={{ height: 120, backgroundColor: "var(--bg-subtle)" }}>
          {currentBanner
            ? <img src={currentBanner} alt="Banner" className="w-full h-full object-cover" />
            : <div className="w-full h-full" style={{ background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))" }} />}
          <button onClick={() => bannerInputRef.current?.click()} disabled={uploading}
            className="absolute top-3 right-3 px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5"
            style={{ backgroundColor: "rgba(0,0,0,0.55)", minHeight: 32 }}>
            <Camera className="w-3.5 h-3.5" />
            {currentBanner ? "Change" : "Add"} Banner
          </button>
        </div>
        <div className="flex items-end gap-4 -mt-10 px-2 mb-6">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full border-4 overflow-hidden"
              style={{ borderColor: "var(--bg-app)", backgroundColor: "var(--bg-subtle)" }}>
              {currentAvatar
                ? <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-xl font-bold"
                    style={{ color: "var(--text-primary)", backgroundColor: "var(--accent-primary-light)" }}>
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : getInitials()}
                  </div>}
            </div>
            <button onClick={() => avatarInputRef.current?.click()} disabled={uploading}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: "var(--accent-primary)" }}>
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Basic Info */}
        {sectionTitle("Basic Info")}
        <div className="space-y-4">
          <div>
            <FieldInput label="Display Name" value={currentName} onChange={handleDisplayNameChange} placeholder="Your name" />
            {displayNameError && <p className="text-xs mt-1" style={{ color: "#E05C7A" }}>{displayNameError}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-hint)" }}>Username</label>
            <div className="flex items-center px-4 rounded-xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", minHeight: 48 }}>
              <span className="text-sm" style={{ color: "var(--text-hint)" }}>@</span>
              <input value={currentUsername} onChange={e => setUsername(e.target.value.replace(/^@/, ""))}
                placeholder="username"
                className="flex-1 bg-transparent text-sm outline-none py-3 pl-1"
                style={{ color: "var(--text-primary)" }} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-hint)" }}>Bio</label>
            <textarea value={currentBio} onChange={e => setBio(e.target.value)}
              placeholder="Short bio…" rows={2} maxLength={200}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
            <p className="text-xs mt-0.5 text-right" style={{ color: "var(--text-hint)" }}>{currentBio.length}/200</p>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-hint)" }}>About Me</label>
            <textarea value={currentAboutMe} onChange={e => setAboutMe(e.target.value)}
              placeholder="Tell more about yourself…" rows={4}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
          </div>
        </div>

        {/* Personal Info */}
        {sectionTitle("Personal Info")}
        <div className="space-y-4">
          <FieldInput label="Borough" value={currentCity} onChange={setCity} placeholder="e.g. Brooklyn" />
          <FieldInput label="Age" value={currentAge} onChange={v => setAge(String(v))} placeholder="e.g. 22" />
          <FieldInput label="Hobbies" value={currentHobbies} onChange={setHobbies} placeholder="e.g. hiking, painting…" />
        </div>

        {/* Social Links */}
        {sectionTitle("Social Links")}
        <div className="space-y-4">
          <FieldInput label="Website" value={currentWebsite} onChange={setWebsite} placeholder="https://yoursite.com" />
          <FieldInput label="TikTok" value={currentTiktok} onChange={setTiktok} placeholder="@yourhandle" />
          <FieldInput label="Instagram" value={currentInstagram} onChange={setInstagram} placeholder="@yourhandle" />
        </div>

        {/* Interests */}
        {sectionTitle("Interests")}
        <TagChips label="" options={INTERESTS_OPTIONS} selected={currentInterests} onChange={setInterests} />

        {/* Looking For */}
        {sectionTitle("Looking For")}
        <TagChips label="" options={LOOKING_FOR_OPTIONS} selected={currentLookingFor} onChange={setLookingFor} />

        {/* Save Button */}
        <button onClick={handleSave} disabled={saving || uploading}
          className="w-full mt-8 py-4 rounded-2xl font-bold text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--accent-primary)" }}>
          {saving ? "Saving…" : uploading ? "Uploading…" : "Save Profile"}
        </button>
      </div>
    </div>
  );
}