import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Plus, Trash2 } from "lucide-react";

const CATEGORIES = [
  { id: "musician", label: "Musician 🎵" },
  { id: "designer", label: "Designer 🎨" },
  { id: "freelancer", label: "Freelancer 💼" },
  { id: "developer", label: "Developer 💻" },
  { id: "business_owner", label: "Business Owner 🏪" },
  { id: "artist", label: "Artist 🖼️" },
  { id: "writer", label: "Writer ✍️" },
  { id: "educator", label: "Educator 📚" },
  { id: "photographer", label: "Photographer 📸" },
  { id: "other", label: "Other 🌟" },
];

const PLATFORMS = ["fiverr", "spotify", "shopify", "instagram", "twitter", "youtube", "tiktok", "website"];

export default function CreatorApplicationForm({ user, onClose, onSuccess }) {
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [portfolioLink, setPortfolioLink] = useState("");
  const [reason, setReason] = useState("");
  const [externalLinks, setExternalLinks] = useState({});
  const [newPlatform, setNewPlatform] = useState("");
  const [newLink, setNewLink] = useState("");
  const qc = useQueryClient();

  const submit = useMutation({
    mutationFn: async () => {
      await base44.entities.CreatorApplication.create({
        user_email: user.email,
        user_name: user.full_name,
        creator_category: category,
        description,
        portfolio_link: portfolioLink || null,
        external_links: Object.keys(externalLinks).length > 0 ? externalLinks : null,
        reason_for_joining: reason,
        status: "pending",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["creatorApp", user.email] });
      onSuccess?.();
      onClose?.();
    },
  });

  const addLink = () => {
    if (newPlatform && newLink) {
      setExternalLinks({ ...externalLinks, [newPlatform]: newLink });
      setNewPlatform("");
      setNewLink("");
    }
  };

  const removeLink = (platform) => {
    const copy = { ...externalLinks };
    delete copy[platform];
    setExternalLinks(copy);
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
            Apply to Become a Creator
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--bg-subtle)" }}>
            <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Category */}
          <div>
            <label className="text-xs font-bold mb-2 block" style={{ color: "var(--text-secondary)" }}>
              Creator Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", border: "1px solid var(--border-light)" }}
            >
              <option value="">Select category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold mb-2 block" style={{ color: "var(--text-secondary)" }}>
              About Your Work *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your work, skills, and what you offer..."
              className="w-full px-3 py-2 rounded-lg text-sm h-20"
              style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", border: "1px solid var(--border-light)" }}
            />
          </div>

          {/* Portfolio Link */}
          <div>
            <label className="text-xs font-bold mb-2 block" style={{ color: "var(--text-secondary)" }}>
              Portfolio Link (optional)
            </label>
            <input
              type="url"
              value={portfolioLink}
              onChange={(e) => setPortfolioLink(e.target.value)}
              placeholder="https://example.com/portfolio"
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", border: "1px solid var(--border-light)" }}
            />
          </div>

          {/* External Links */}
          <div>
            <label className="text-xs font-bold mb-2 block" style={{ color: "var(--text-secondary)" }}>
              External Platform Links
            </label>
            <div className="space-y-2 mb-3">
              {Object.entries(externalLinks).map(([platform, link]) => (
                <div key={platform} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: "var(--bg-subtle)" }}>
                  <span className="text-xs font-medium capitalize" style={{ color: "var(--text-primary)" }}>
                    {platform}
                  </span>
                  <button onClick={() => removeLink(platform)} className="p-1 hover:opacity-70">
                    <Trash2 className="w-3 h-3" style={{ color: "var(--text-secondary)" }} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <select
                value={newPlatform}
                onChange={(e) => setNewPlatform(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg text-xs"
                style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", border: "1px solid var(--border-light)" }}
              >
                <option value="">Platform</option>
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
              <input
                type="url"
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-3 py-2 rounded-lg text-xs"
                style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", border: "1px solid var(--border-light)" }}
              />
              <button onClick={addLink} className="px-3 py-2 rounded-lg flex items-center gap-1 text-white text-xs font-bold" style={{ backgroundColor: "var(--accent-primary)" }}>
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="text-xs font-bold mb-2 block" style={{ color: "var(--text-secondary)" }}>
              Why do you want to join as a creator? *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Tell us about your goals..."
              className="w-full px-3 py-2 rounded-lg text-sm h-20"
              style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", border: "1px solid var(--border-light)" }}
            />
          </div>

          {/* Submit */}
          <button
            onClick={() => submit.mutate()}
            disabled={!category || !description || !reason || submit.isPending}
            className="w-full py-3 rounded-lg font-bold text-white text-sm disabled:opacity-50"
            style={{ backgroundColor: "var(--accent-primary)" }}
          >
            {submit.isPending ? "Submitting..." : "Submit Application"}
          </button>
        </div>
      </div>
    </div>
  );
}