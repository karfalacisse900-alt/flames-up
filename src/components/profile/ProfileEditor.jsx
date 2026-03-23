import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { uploadToCloudflare } from "@/utils/uploadToCloudflare";
import { X, Camera, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function ProfileEditor({ user, onClose, onUpdated }) {
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "");
  const [bannerUrl, setBannerUrl] = useState(user?.banner_url || "");
  const [displayName, setDisplayName] = useState(user?.display_name || user?.full_name || "");
  const [username, setUsername] = useState((user?.username || "").replace(/^@/, ""));
  const [bio, setBio] = useState(user?.bio || "");
  const [websiteUrl, setWebsiteUrl] = useState(user?.website_url || "");

  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

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
    try {
      const usernameToSave = username ? `@${username.replace(/^@/, "")}` : "";
      // Check uniqueness
      if (usernameToSave && usernameToSave !== user?.username) {
        const allUsers = await base44.entities.User.list();
        const taken = allUsers.some(u => u.username === usernameToSave && u.email !== user.email);
        if (taken) {
          alert("That username is already taken. Please choose another.");
          setSaving(false);
          return;
        }
      }
      await base44.auth.updateMe({
        avatar_url: avatarUrl,
        banner_url: bannerUrl,
        display_name: displayName,
        username: usernameToSave,
        bio,
        website_url: websiteUrl,
      });
      // Sync to UserProfile entity so other users can see this data
      const existing = await base44.entities.UserProfile.filter({ user_email: user.email });
      const profileData = {
        user_email: user.email,
        user_name: user.full_name || displayName,
        display_name: displayName,
        username: usernameToSave,
        bio,
        avatar_url: avatarUrl,
        banner_url: bannerUrl,
        website: websiteUrl,
      };
      if (existing.length > 0) {
        await base44.entities.UserProfile.update(existing[0].id, profileData);
      } else {
        await base44.entities.UserProfile.create(profileData);
      }
      onUpdated?.();
      onClose();
    } catch (err) {
      console.error("Profile update failed:", err);
    }
    setSaving(false);
  };

  const getInitials = () => {
    const name = displayName || user?.full_name || user?.username || "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end lg:items-center lg:justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-2xl mx-auto rounded-t-3xl lg:rounded-3xl overflow-hidden shadow-2xl"
        style={{
          backgroundColor: "var(--bg-card)",
          maxHeight: "90vh",
          overflowY: "auto",
          color: "var(--text-primary)"
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between border-b"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)" }}>
          <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-serif)" }}>Edit Profile</h2>
          <button onClick={onClose} style={{ minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X className="w-5 h-5" style={{ color: "var(--text-hint)" }} />
          </button>
        </div>

        <div className="px-5 py-6 space-y-6">
          {/* Banner & Avatar */}
          <div>
            <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />

            {/* Banner */}
            <div className="relative rounded-2xl overflow-hidden mb-4" style={{ height: "120px", backgroundColor: "var(--bg-subtle)" }}>
              {bannerUrl ? (
                <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full" style={{ background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))" }} />
              )}
              <button
                onClick={() => bannerInputRef.current?.click()}
                disabled={uploading}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5"
                style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
                <Camera className="w-3.5 h-3.5" />
                {bannerUrl ? "Change" : "Add"} Banner
              </button>
            </div>

            {/* Avatar */}
            <div className="flex items-end gap-4 -mt-12 px-2">
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-full border-4 overflow-hidden"
                  style={{ borderColor: "var(--bg-card)", backgroundColor: "var(--bg-subtle)" }}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl font-bold"
                      style={{ color: "var(--text-primary)", backgroundColor: "var(--accent-primary-light)" }}>
                      {getInitials()}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: "var(--accent-primary)" }}>
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Display Name</label>
            <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Username</label>
            <div className="flex items-center gap-1 px-3 rounded-xl border" style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-card)", minHeight: 44 }}>
              <span style={{ color: "var(--text-hint)" }}>@</span>
              <input
                value={username}
                onChange={e => setUsername(e.target.value.replace(/^@/, ""))}
                placeholder="username"
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: "var(--text-primary)", minHeight: 44 }}
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Bio</label>
            <Textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell people a bit about yourself…"
              rows={3}
              maxLength={200}
            />
            <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>{bio.length}/200</p>
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
              <Link2 className="w-4 h-4" /> Website / Link
            </label>
            <Input value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://yoursite.com" />
          </div>

          {/* Save */}
          <Button
            onClick={handleSave}
            disabled={saving || uploading}
            className="w-full py-6 text-base font-bold"
            style={{ backgroundColor: "var(--accent-primary)", color: "#fff" }}>
            {saving ? "Saving…" : uploading ? "Uploading…" : "Save Profile"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}