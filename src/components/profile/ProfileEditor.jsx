import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { uploadToR2 } from "@/utils/uploadToR2";
import { X, Camera, Link2, Eye, EyeOff, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const INTEREST_OPTIONS = [
  "Music", "Fitness", "Tech", "Startups", "Anime", "Travel", "Photography",
  "Gaming", "Art", "Fashion", "Food", "Sports", "Reading", "Movies",
  "Podcasts", "Coding", "Design", "Writing", "Dance", "Yoga"
];

const LOOKING_FOR_OPTIONS = [
  "Friends", "Study partners", "Networking", "Events", 
  "Gaming partners", "Creative collaboration"
];

export default function ProfileEditor({ user, onClose, onUpdated }) {
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "");
  const [bannerUrl, setBannerUrl] = useState(user?.banner_url || "");
  const [headline, setHeadline] = useState(user?.headline || "");
  const [aboutMe, setAboutMe] = useState(user?.about_me || "");
  const [age, setAge] = useState(user?.age || "");
  const [major, setMajor] = useState(user?.major || "");
  const [graduationYear, setGraduationYear] = useState(user?.graduation_year || "");
  const [city, setCity] = useState(user?.city || "");
  const [hobbies, setHobbies] = useState(user?.hobbies || "");
  const [interests, setInterests] = useState(user?.interests || []);
  const [lookingFor, setLookingFor] = useState(user?.looking_for || []);
  const [websiteUrl, setWebsiteUrl] = useState(user?.website_url || "");
  const [portfolioUrl, setPortfolioUrl] = useState(user?.portfolio_url || "");
  
  const [showAge, setShowAge] = useState(user?.show_age !== false);
  const [showMajor, setShowMajor] = useState(user?.show_major !== false);
  const [showGradYear, setShowGradYear] = useState(user?.show_grad_year !== false);
  
  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setAvatarUrl(file_url);
    } catch (err) {
      console.error("Avatar upload failed:", err);
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setBannerUrl(file_url);
    } catch (err) {
      console.error("Banner upload failed:", err);
    }
    setUploading(false);
    e.target.value = "";
  };

  const toggleInterest = (interest) => {
    setInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const toggleLookingFor = (option) => {
    setLookingFor(prev => 
      prev.includes(option)
        ? prev.filter(o => o !== option)
        : [...prev, option]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({
        avatar_url: avatarUrl,
        banner_url: bannerUrl,
        headline,
        about_me: aboutMe,
        age: age ? parseInt(age) : undefined,
        major,
        graduation_year: graduationYear,
        city,
        hobbies,
        interests,
        looking_for: lookingFor,
        website_url: websiteUrl,
        portfolio_url: portfolioUrl,
        show_age: showAge,
        show_major: showMajor,
        show_grad_year: showGradYear,
      });
      onUpdated?.();
      onClose();
    } catch (err) {
      console.error("Profile update failed:", err);
    }
    setSaving(false);
  };

  const getInitials = () => {
    const name = user?.full_name || user?.username || "U";
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
          <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-serif)" }}>
            Edit Profile
          </h2>
          <button onClick={onClose}>
            <X className="w-5 h-5" style={{ color: "var(--text-hint)" }} />
          </button>
        </div>

        <div className="px-5 py-6 space-y-6">
          {/* Banner & Avatar */}
          <div>
            <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            
            {/* Banner */}
            <div className="relative rounded-2xl overflow-hidden mb-4" style={{ height: "140px", backgroundColor: "var(--bg-subtle)" }}>
              {bannerUrl ? (
                <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #2E6B4F, #D98B62)" }} />
              )}
              <button
                onClick={() => bannerInputRef.current?.click()}
                disabled={uploading}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5"
                style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
                <Camera className="w-3.5 h-3.5" />
                {bannerUrl ? "Change" : "Add"} Banner
              </button>
            </div>

            {/* Avatar */}
            <div className="flex items-end gap-4 -mt-16 px-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 overflow-hidden"
                  style={{ borderColor: "var(--bg-card)", backgroundColor: "var(--bg-subtle)" }}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold"
                      style={{ color: "var(--text-primary)", backgroundColor: "var(--accent-primary-light)" }}>
                      {getInitials()}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: "var(--accent-primary)" }}>
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Headline */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
              Headline <span className="text-xs font-normal" style={{ color: "var(--text-hint)" }}>(Short bio with emojis)</span>
            </label>
            <Input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Business student 📚 | Coffee lover ☕ | Soccer on weekends ⚽"
              maxLength={120}
            />
            <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>{headline.length}/120</p>
          </div>

          {/* About Me */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
              About Me
            </label>
            <Textarea
              value={aboutMe}
              onChange={(e) => setAboutMe(e.target.value)}
              placeholder="Hi, I'm a business student who loves startups, traveling, and meeting new people."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>{aboutMe.length}/500</p>
          </div>

          {/* Personal Info */}
          <div>
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <Sparkles className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
              Personal Info
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5 flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                  Age
                  <button onClick={() => setShowAge(!showAge)} className="ml-auto">
                    {showAge ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </label>
                <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="22" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  City / Campus
                </label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="New York" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs font-medium mb-1.5 flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                  Major / Field
                  <button onClick={() => setShowMajor(!showMajor)} className="ml-auto">
                    {showMajor ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </label>
                <Input value={major} onChange={(e) => setMajor(e.target.value)} placeholder="Computer Science" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                  Graduation Year
                  <button onClick={() => setShowGradYear(!showGradYear)} className="ml-auto">
                    {showGradYear ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </label>
                <Input value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)} placeholder="2027" />
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Hobbies
              </label>
              <Input value={hobbies} onChange={(e) => setHobbies(e.target.value)} placeholder="Photography, gym, gaming" />
            </div>
          </div>

          {/* Looking For */}
          <div>
            <h3 className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>Looking For</h3>
            <div className="flex flex-wrap gap-2">
              {LOOKING_FOR_OPTIONS.map(option => (
                <Badge
                  key={option}
                  variant={lookingFor.includes(option) ? "default" : "outline"}
                  className="cursor-pointer transition-all"
                  onClick={() => toggleLookingFor(option)}
                  style={{
                    backgroundColor: lookingFor.includes(option) ? "var(--accent-primary)" : "transparent",
                    color: lookingFor.includes(option) ? "white" : "var(--text-secondary)",
                    borderColor: lookingFor.includes(option) ? "var(--accent-primary)" : "var(--border-light)"
                  }}>
                  {option}
                </Badge>
              ))}
            </div>
          </div>

          {/* Interest Tags */}
          <div>
            <h3 className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>Interest Tags</h3>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map(interest => (
                <Badge
                  key={interest}
                  variant={interests.includes(interest) ? "default" : "outline"}
                  className="cursor-pointer transition-all"
                  onClick={() => toggleInterest(interest)}
                  style={{
                    backgroundColor: interests.includes(interest) ? "var(--accent-secondary)" : "transparent",
                    color: interests.includes(interest) ? "white" : "var(--text-secondary)",
                    borderColor: interests.includes(interest) ? "var(--accent-secondary)" : "var(--border-light)"
                  }}>
                  {interest}
                </Badge>
              ))}
            </div>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <Link2 className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
              Social Links (Optional)
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Website
                </label>
                <Input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://yoursite.com" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Portfolio
                </label>
                <Input value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="https://portfolio.com" />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saving || uploading}
            className="w-full py-6 text-base font-bold"
            style={{ backgroundColor: "var(--accent-primary)" }}>
            {saving ? "Saving..." : uploading ? "Uploading..." : "Save Profile"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}