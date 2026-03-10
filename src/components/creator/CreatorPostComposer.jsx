import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Plus, Trash2 } from "lucide-react";

const PLATFORMS = [
  { id: "fiverr", label: "Hire on Fiverr" },
  { id: "spotify", label: "Listen on Spotify" },
  { id: "shopify", label: "Visit Store" },
  { id: "instagram", label: "Follow on Instagram" },
  { id: "twitter", label: "Follow on Twitter" },
  { id: "youtube", label: "Subscribe on YouTube" },
  { id: "tiktok", label: "Follow on TikTok" },
  { id: "website", label: "Visit Website" },
];

export default function CreatorPostComposer({ user, creatorCategory, onClose, onSuccess }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [actionLinks, setActionLinks] = useState({});
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const qc = useQueryClient();

  const submit = useMutation({
    mutationFn: async () => {
      await base44.entities.CommunityPost.create({
        type: "discussion",
        title,
        body,
        author_email: user.email,
        author_name: user.full_name,
        author_avatar_url: user.avatar_url || "",
        video_url: videoUrl || null,
        is_creator_post: true,
        creator_category: creatorCategory,
        creator_action_links: selectedPlatforms.length > 0 ? actionLinks : null,
        moderation_status: "approved",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["communityPosts"] });
      onSuccess?.();
      onClose?.();
    },
  });

  const addPlatformLink = (platformId) => {
    setSelectedPlatforms([...selectedPlatforms, platformId]);
  };

  const removePlatformLink = (platformId) => {
    setSelectedPlatforms(selectedPlatforms.filter((p) => p !== platformId));
    const copy = { ...actionLinks };
    delete copy[platformId];
    setActionLinks(copy);
  };

  const updatePlatformLink = (platformId, link) => {
    setActionLinks({ ...actionLinks, [platformId]: link });
  };

  return (
    <div
      className="fixed inset-0 flex items-end justify-center sm:items-center"
      style={{ backgroundColor: "rgba(0,0,0,0.4)", zIndex: 9999 }}
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-6 overflow-y-auto"
        style={{ maxHeight: "90dvh", backgroundColor: "var(--bg-card)" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            Share Creator Content
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--bg-subtle)" }}>
            <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-bold mb-2 block" style={{ color: "var(--text-secondary)" }}>
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., New Logo Design Tutorial"
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", border: "1px solid var(--border-light)" }}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold mb-2 block" style={{ color: "var(--text-secondary)" }}>
              Description *
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Tell your audience about this content..."
              className="w-full px-3 py-2 rounded-lg text-sm h-20"
              style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", border: "1px solid var(--border-light)" }}
            />
          </div>

          {/* Video URL */}
          <div>
            <label className="text-xs font-bold mb-2 block" style={{ color: "var(--text-secondary)" }}>
              Video URL (optional)
            </label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://example.com/video.mp4"
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", border: "1px solid var(--border-light)" }}
            />
          </div>

          {/* Action Links */}
          <div>
            <label className="text-xs font-bold mb-2 block" style={{ color: "var(--text-secondary)" }}>
              Action Buttons
            </label>
            <div className="space-y-2 mb-3">
              {selectedPlatforms.map((platform) => (
                <div key={platform} className="flex gap-2 items-center">
                  <input
                    type="url"
                    placeholder="https://..."
                    value={actionLinks[platform] || ""}
                    onChange={(e) => updatePlatformLink(platform, e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg text-xs"
                    style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", border: "1px solid var(--border-light)" }}
                  />
                  <button onClick={() => removePlatformLink(platform)} className="p-2 hover:opacity-70">
                    <Trash2 className="w-3 h-3" style={{ color: "var(--text-secondary)" }} />
                  </button>
                </div>
              ))}
            </div>
            <div className="space-y-1">
              {PLATFORMS.map((p) => (
                !selectedPlatforms.includes(p.id) && (
                  <button
                    key={p.id}
                    onClick={() => addPlatformLink(p.id)}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2"
                    style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}
                  >
                    <Plus className="w-3 h-3" /> {p.label}
                  </button>
                )
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={() => submit.mutate()}
            disabled={!body || submit.isPending}
            className="w-full py-3 rounded-lg font-bold text-white text-sm disabled:opacity-50"
            style={{ backgroundColor: "var(--accent-primary)" }}
          >
            {submit.isPending ? "Posting..." : "Post Creator Content"}
          </button>
        </div>
      </div>
    </div>
  );
}