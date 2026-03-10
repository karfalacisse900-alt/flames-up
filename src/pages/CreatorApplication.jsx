import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { ArrowLeft, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CREATOR_CATEGORIES = [
  { value: "musician", label: "🎵 Musician" },
  { value: "designer", label: "🎨 Designer" },
  { value: "freelancer", label: "💼 Freelancer" },
  { value: "developer", label: "💻 Developer" },
  { value: "business_owner", label: "📊 Business Owner" },
  { value: "artist", label: "🖼️ Artist" },
  { value: "writer", label: "✍️ Writer" },
  { value: "educator", label: "📚 Educator" },
  { value: "photographer", label: "📷 Photographer" },
  { value: "other", label: "✨ Other" },
];

const PLATFORMS = ["fiverr", "spotify", "shopify", "instagram", "twitter", "tiktok", "youtube", "linkedin", "portfolio"];

export default function CreatorApplication() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    creator_category: "",
    description: "",
    portfolio_link: "",
    reason_for_joining: "",
    external_links: {},
  });

  const [platformInputs, setPlatformInputs] = useState({});

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => navigate(createPageUrl("Home")));
  }, []);

  const handleAddPlatform = (platform) => {
    setPlatformInputs((prev) => ({ ...prev, [platform]: "" }));
  };

  const handleRemovePlatform = (platform) => {
    const newLinks = { ...formData.external_links };
    delete newLinks[platform];
    setFormData((prev) => ({ ...prev, external_links: newLinks }));
    const newInputs = { ...platformInputs };
    delete newInputs[platform];
    setPlatformInputs(newInputs);
  };

  const handlePlatformChange = (platform, value) => {
    setPlatformInputs((prev) => ({ ...prev, [platform]: value }));
  };

  const handleAddPlatformLink = (platform) => {
    if (platformInputs[platform]) {
      setFormData((prev) => ({
        ...prev,
        external_links: { ...prev.external_links, [platform]: platformInputs[platform] },
      }));
      setPlatformInputs((prev) => ({ ...prev, [platform]: "" }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.creator_category || !formData.description || !formData.reason_for_joining) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      await base44.entities.CreatorApplication.create({
        user_email: user.email,
        user_name: user.full_name,
        creator_category: formData.creator_category,
        description: formData.description,
        portfolio_link: formData.portfolio_link || undefined,
        external_links: formData.external_links,
        reason_for_joining: formData.reason_for_joining,
        status: "pending",
      });
      setSubmitted(true);
      setTimeout(() => navigate(createPageUrl("Profile")), 2000);
    } catch (error) {
      console.error("Error submitting application:", error);
      alert("Failed to submit application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
        <div className="text-center max-w-sm px-4">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
            Application Submitted!
          </h2>
          <p style={{ color: "var(--text-secondary)" }}>
            We'll review your application and get back to you soon. Redirecting to profile...
          </p>
        </div>
      </div>
    );
  }

  const availablePlatforms = PLATFORMS.filter((p) => !formData.external_links[p]);

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b px-4 py-3 flex items-center gap-3" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)" }}>
        <button onClick={() => navigate(createPageUrl("Profile"))} className="p-2 rounded-lg hover:opacity-70">
          <ArrowLeft className="w-5 h-5" style={{ color: "var(--text-primary)" }} />
        </button>
        <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
          Become a Creator
        </h1>
      </div>

      {/* Form */}
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            Creator Category *
          </label>
          <Select value={formData.creator_category} onValueChange={(value) => setFormData((prev) => ({ ...prev, creator_category: value }))}>
            <SelectTrigger className="rounded-xl" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)" }}>
              <SelectValue placeholder="Select your category" />
            </SelectTrigger>
            <SelectContent>
              {CREATOR_CATEGORIES.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            About Your Work *
          </label>
          <Textarea
            placeholder="Describe what you do, your skills, and achievements..."
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            className="rounded-xl resize-none"
            rows={4}
            style={{ backgroundColor: "var(--bg-subtle)", borderColor: "var(--border-light)", color: "var(--text-primary)" }}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            Portfolio Link (Optional)
          </label>
          <Input
            placeholder="https://your-portfolio.com"
            value={formData.portfolio_link}
            onChange={(e) => setFormData((prev) => ({ ...prev, portfolio_link: e.target.value }))}
            className="rounded-xl"
            style={{ backgroundColor: "var(--bg-subtle)", borderColor: "var(--border-light)", color: "var(--text-primary)" }}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
            External Links
          </label>
          <div className="space-y-2">
            {formData.external_links &&
              Object.entries(formData.external_links).map(([platform, url]) => (
                <div key={platform} className="flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                  <span className="text-sm font-medium flex-1 truncate" style={{ color: "var(--text-primary)" }}>
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}: {url}
                  </span>
                  <button onClick={() => handleRemovePlatform(platform)} className="p-1.5 rounded-lg" style={{ color: "#ef4444" }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

            {availablePlatforms.length > 0 && (
              <div className="flex gap-2 items-end">
                <Select value={platformInputs.platform || ""} onValueChange={(value) => handlePlatformChange("platform", value)}>
                  <SelectTrigger className="rounded-xl" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)" }}>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePlatforms.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Paste URL"
                  value={platformInputs[platformInputs.platform] || ""}
                  onChange={(e) => handlePlatformChange(platformInputs.platform, e.target.value)}
                  className="rounded-xl flex-1"
                  style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)", color: "var(--text-primary)" }}
                />
                <Button
                  onClick={() => {
                    const p = platformInputs.platform;
                    if (p && platformInputs[p]) {
                      handleAddPlatformLink(p);
                      handlePlatformChange("platform", "");
                    }
                  }}
                  className="rounded-xl px-3 text-white"
                  style={{ backgroundColor: "var(--accent-primary)" }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            Why Do You Want to Join as a Creator? *
          </label>
          <Textarea
            placeholder="Tell us about your goals and why you'd be a great fit..."
            value={formData.reason_for_joining}
            onChange={(e) => setFormData((prev) => ({ ...prev, reason_for_joining: e.target.value }))}
            className="rounded-xl resize-none"
            rows={4}
            style={{ backgroundColor: "var(--bg-subtle)", borderColor: "var(--border-light)", color: "var(--text-primary)" }}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 rounded-xl text-white font-bold text-lg"
          style={{ backgroundColor: loading ? "var(--text-hint)" : "var(--accent-primary)" }}
        >
          {loading ? "Submitting..." : "Submit Application"}
        </Button>

        <p className="text-xs text-center" style={{ color: "var(--text-hint)" }}>
          Admin will review your application and you'll hear back within 24-48 hours.
        </p>
      </div>
    </div>
  );
}