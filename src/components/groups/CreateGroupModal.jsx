import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = [
  "yoga",
  "running",
  "dance",
  "fitness",
  "sports",
  "outdoor",
  "learning",
  "gaming",
  "social",
  "community",
  "other",
];

export default function CreateGroupModal({ open, onClose }) {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "social",
    type: "free",
    monthly_fee: 0,
    tags: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      base44.auth.me().then(setUser).catch(() => {});
    }
  }, [open]);

  const createGroupMutation = useMutation({
    mutationFn: async () => {
      let avatarUrl = null;
      let coverUrl = null;

      if (avatarFile) {
        const uploadRes = await base44.integrations.Core.UploadFile({ file: avatarFile });
        avatarUrl = uploadRes.file_url;
      }
      if (coverFile) {
        const uploadRes = await base44.integrations.Core.UploadFile({ file: coverFile });
        coverUrl = uploadRes.file_url;
      }

      const tags = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);

      await base44.entities.Group.create({
        name: formData.name,
        description: formData.description,
        category: formData.category,
        type: formData.type,
        monthly_fee: formData.type === "paid" ? parseFloat(formData.monthly_fee) : 0,
        avatar_url: avatarUrl,
        cover_image_url: coverUrl,
        creator_email: user.email,
        creator_name: user.full_name,
        members: [user.email],
        member_count: 1,
        tags,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["userGroups"] });
      setFormData({ name: "", description: "", category: "social", type: "free", monthly_fee: 0, tags: "" });
      setAvatarFile(null);
      setCoverFile(null);
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    createGroupMutation.mutate();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <motion.div
            className="bg-white rounded-2xl w-11/12 max-w-lg max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: "var(--bg-card)" }}>
            {/* Header */}
            <div
              className="sticky top-0 flex items-center justify-between p-4 border-b z-10"
              style={{ borderColor: "var(--border-light)" }}>
              <h2 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
                Create Group
              </h2>
              <button onClick={onClose} className="p-1">
                <X className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Name */}
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
                  Group Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Morning Yoga Club"
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tell people about your group..."
                  className="w-full px-3 py-2 rounded-lg text-sm h-20"
                  style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type */}
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
                  Group Type
                </label>
                <div className="flex gap-3">
                  {["free", "paid"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, type })}
                      className="flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        backgroundColor: formData.type === type ? "var(--accent-primary)" : "var(--bg-subtle)",
                        color: formData.type === type ? "#fff" : "var(--text-secondary)",
                        border: `1px solid ${formData.type === type ? "var(--accent-primary)" : "var(--border-light)"}`,
                      }}>
                      {type === "free" ? "Free" : "Paid (Monthly)"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Monthly Fee */}
              {formData.type === "paid" && (
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
                    Monthly Fee ($) *
                  </label>
                  <input
                    type="number"
                    min="0.99"
                    step="0.01"
                    value={formData.monthly_fee}
                    onChange={(e) => setFormData({ ...formData, monthly_fee: e.target.value })}
                    placeholder="9.99"
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}
                  />
                </div>
              )}

              {/* Tags */}
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g. beginner-friendly, morning, relaxation"
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}
                />
              </div>

              {/* Avatar Upload */}
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
                  Group Avatar
                </label>
                <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed cursor-pointer transition-all hover:opacity-70"
                  style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-subtle)" }}>
                  <Upload className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {avatarFile ? avatarFile.name : "Upload image"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAvatarFile(e.target.files?.[0])}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Cover Upload */}
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-secondary)" }}>
                  Cover Image
                </label>
                <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed cursor-pointer transition-all hover:opacity-70"
                  style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-subtle)" }}>
                  <Upload className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {coverFile ? coverFile.name : "Upload image"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCoverFile(e.target.files?.[0])}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!formData.name.trim() || createGroupMutation.isPending}
                className="w-full py-3 rounded-lg font-semibold text-white transition-all disabled:opacity-50"
                style={{ backgroundColor: "var(--accent-primary)" }}>
                {createGroupMutation.isPending ? "Creating..." : "Create Group"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}