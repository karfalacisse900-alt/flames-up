import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Play, Image as ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const CATEGORIES = [
  { value: "music", label: "🎵 Music" },
  { value: "gaming", label: "🎮 Gaming" },
  { value: "creative", label: "🎨 Creative" },
  { value: "educational", label: "📚 Educational" },
  { value: "just_chatting", label: "💬 Just Chatting" },
  { value: "business", label: "💼 Business" },
];

export default function GoLive() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "just_chatting",
    thumbnail: null,
    thumbnailUrl: "",
    city: user?.location_city || "",
    region: user?.location_region || "",
    country: user?.location_country || "",
  });

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      if (u?.is_creator) {
        setIsCreator(true);
      } else {
        // Non-creators redirected after 2 seconds
        setTimeout(() => navigate(createPageUrl("CreatorApplication")), 2000);
      }
    });
  }, []);

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData((prev) => ({ ...prev, thumbnailUrl: file_url }));
    } catch (error) {
      console.error("Error uploading thumbnail:", error);
      alert("Failed to upload thumbnail");
    }
  };

  const handleGoLive = async () => {
    if (!formData.title.trim()) {
      alert("Please enter a stream title");
      return;
    }

    setLoading(true);
    try {
      const streamKey = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const stream = await base44.entities.LiveStream.create({
        host_email: user.email,
        host_name: user.display_name || user.full_name || "Creator",
        title: formData.title,
        description: formData.description,
        category: formData.category,
        stream_key: streamKey,
        is_active: true,
        viewer_count: 0,
        viewers: [],
        stream_thumbnail: formData.thumbnailUrl,
        stream_start_time: new Date().toISOString(),
        host_city: formData.city,
        host_region: formData.region,
        host_country: formData.country,
      });

      // Notify all followers that the creator went live
      try {
        const followers = await base44.entities.Follow.filter({ following_email: user.email });
        const notifPromises = followers.map(f =>
          base44.entities.Notification.create({
            recipient_email: f.follower_email,
            actor_name: user.display_name || user.full_name || user.email?.split("@")[0],
            actor_email: user.email,
            type: "creator_live",
            post_text: formData.title,
            ref_id: stream.id,
            is_read: false,
          }).catch(() => {})
        );
        await Promise.all(notifPromises);
      } catch (_) {}

      navigate(createPageUrl("Live"));
    } catch (error) {
      console.error("Error creating live stream:", error);
      alert("Failed to start stream. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)" }} />
      </div>
    );
  }

  if (!isCreator) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
        <div className="text-center px-4 max-w-sm">
          <p className="text-3xl mb-3">⭐</p>
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
            Creators Only
          </h2>
          <p style={{ color: "var(--text-secondary)" }}>
            You need to be an approved creator to go live. Redirecting to application...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b px-4 py-3 flex items-center gap-3" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)" }}>
        <button onClick={() => navigate(createPageUrl("Home"))} className="p-2 rounded-lg">
          <ArrowLeft className="w-5 h-5" style={{ color: "var(--text-primary)" }} />
        </button>
        <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
          Go Live
        </h1>
      </div>

      {/* Form */}
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            Stream Title *
          </label>
          <Input
            placeholder="What are you streaming about?"
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            className="rounded-xl"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)", color: "var(--text-primary)" }}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            Description
          </label>
          <Textarea
            placeholder="Tell viewers what to expect..."
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            className="rounded-xl resize-none"
            rows={3}
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)", color: "var(--text-primary)" }}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            Category
          </label>
          <Select value={formData.category} onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}>
            <SelectTrigger className="rounded-xl" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)" }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            Stream Thumbnail
          </label>
          <label className="cursor-pointer flex items-center justify-center gap-2 px-4 py-6 rounded-xl border-2 border-dashed transition-all" style={{ borderColor: "var(--accent-primary)", backgroundColor: "var(--accent-primary-light)" }}>
            <input type="file" accept="image/*" onChange={handleThumbnailUpload} className="hidden" />
            <ImageIcon className="w-5 h-5" style={{ color: "var(--accent-primary)" }} />
            <span className="font-semibold" style={{ color: "var(--accent-primary)" }}>
              {formData.thumbnailUrl ? "Change thumbnail" : "Upload thumbnail"}
            </span>
          </label>
          {formData.thumbnailUrl && (
            <img src={formData.thumbnailUrl} alt="thumbnail" className="mt-3 rounded-xl w-full h-32 object-cover" />
          )}
        </div>

        <Button
          onClick={handleGoLive}
          disabled={loading || !formData.title}
          className="w-full py-3 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-2"
          style={{ backgroundColor: loading || !formData.title ? "var(--text-hint)" : "var(--accent-primary)" }}
        >
          <Play className="w-5 h-5" />
          {loading ? "Starting..." : "🔴 Go Live"}
        </Button>

        <p className="text-xs text-center" style={{ color: "var(--text-hint)" }}>
          Your stream will be visible to all users. Share your link to invite viewers!
        </p>
      </div>
    </div>
  );
}