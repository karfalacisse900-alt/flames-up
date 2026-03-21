import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Link2, Loader2 } from "lucide-react";
import { uploadToCloudflare } from "@/utils/uploadToCloudflare";
import { useQuery } from "@tanstack/react-query";

export default function EditProfile() {
  const navigate = useNavigate();
  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });

  const [avatarUrl, setAvatarUrl] = useState(null);
  const [bannerUrl, setBannerUrl] = useState(null);
  const [displayName, setDisplayName] = useState(null);
  const [username, setUsername] = useState(null);
  const [bio, setBio] = useState(null);
  const [websiteUrl, setWebsiteUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Use user data as defaults until user edits
  const currentAvatar = avatarUrl ?? user?.avatar_url ?? "";
  const currentBanner = bannerUrl ?? user?.banner_url ?? "";
  const currentName = displayName ?? user?.display_name ?? user?.full_name ?? "";
  const currentUsername = username ?? (user?.username ?? "").replace(/^@/, "");
  const currentBio = bio ?? user?.bio ?? "";
  const currentWebsite = websiteUrl ?? user?.website_url ?? "";

  const getInitials = () => {
    const name = currentName || "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await uploadToCloudflare(file);
    setAvatarUrl(file_url);
    setUploading(false);
    e.target.value = "";
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await uploadToCloudflare(file);
    setBannerUrl(file_url);
    setUploading(false);
    e.target.value = "";
  };

  const handleSave = async () => {
    setSaving(true);
    const usernameToSave = currentUsername ? `@${currentUsername.replace(/^@/, "")}` : "";
    await base44.auth.updateMe({
      avatar_url: currentAvatar,
      banner_url: currentBanner,
      display_name: currentName,
      username: usernameToSave,
      bio: currentBio,
      website_url: currentWebsite,
    });
    setSaving(false);
    navigate(-1);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg-app)", paddingBottom: 32 }}>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
        style={{ backgroundColor: "var(--bg-app)", paddingTop: "max(env(safe-area-inset-top,0px), 16px)", borderBottom: "1px solid var(--border-light)" }}>
        <button onClick={() => navigate(-1)} aria-label="Go back"
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <ArrowLeft className="w-4 h-4" style={{ color: "var(--text-primary)" }} />
        </button>
        <h1 className="text-base font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Edit Profile</h1>
        <button
          onClick={handleSave}
          disabled={saving || uploading}
          className="px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--accent-primary)", minHeight: 36 }}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      <div className="px-4 py-5 space-y-6">
        {/* Banner */}
        <div>
          <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />

          <div className="relative rounded-2xl overflow-hidden" style={{ height: 120, backgroundColor: "var(--bg-subtle)" }}>
            {currentBanner ? (
              <img src={currentBanner} alt="Banner" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full" style={{ background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))" }} />
            )}
            <button onClick={() => bannerInputRef.current?.click()} disabled={uploading}
              className="absolute top-3 right-3 px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5"
              style={{ backgroundColor: "rgba(0,0,0,0.55)", minHeight: 32 }}>
              <Camera className="w-3.5 h-3.5" />
              {currentBanner ? "Change" : "Add"} Banner
            </button>
          </div>

          {/* Avatar */}
          <div className="flex items-end gap-4 -mt-10 px-2">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full border-4 overflow-hidden"
                style={{ borderColor: "var(--bg-app)", backgroundColor: "var(--bg-subtle)" }}>
                {currentAvatar ? (
                  <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl font-bold"
                    style={{ color: "var(--text-primary)", backgroundColor: "var(--accent-primary-light)" }}>
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : getInitials()}
                  </div>
                )}
              </div>
              <button onClick={() => avatarInputRef.current?.click()} disabled={uploading}
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: "var(--accent-primary)" }}>
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Display Name */}
        <div>
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-hint)" }}>Display Name</label>
          <input
            value={currentName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Your name"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-primary)", minHeight: 48 }}
          />
        </div>

        {/* Username */}
        <div>
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-hint)" }}>Username</label>
          <div className="flex items-center px-4 rounded-xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", minHeight: 48 }}>
            <span className="text-sm mr-0.5" style={{ color: "var(--text-hint)" }}>@</span>
            <input
              value={currentUsername}
              onChange={e => setUsername(e.target.value.replace(/^@/, ""))}
              placeholder="username"
              className="flex-1 bg-transparent text-sm outline-none py-3"
              style={{ color: "var(--text-primary)" }}
            />
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-hint)" }}>Bio</label>
          <textarea
            value={currentBio}
            onChange={e => setBio(e.target.value)}
            placeholder="Tell people a bit about yourself…"
            rows={4}
            maxLength={200}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
          />
          <p className="text-xs mt-1 text-right" style={{ color: "var(--text-hint)" }}>{currentBio.length}/200</p>
        </div>

        {/* Website */}
        <div>
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide flex items-center gap-1.5" style={{ color: "var(--text-hint)" }}>
            <Link2 className="w-3.5 h-3.5" /> Website / Link
          </label>
          <input
            value={currentWebsite}
            onChange={e => setWebsiteUrl(e.target.value)}
            placeholder="https://yoursite.com"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-primary)", minHeight: 48 }}
          />
        </div>
      </div>
    </div>
  );
}