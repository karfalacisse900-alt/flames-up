import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function SubmitMediaForm({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    media_type: "movie",
    title: "",
    creator: "",
    genre: "",
    description: "",
    image_url: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewImage, setPreviewImage] = useState(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, image_url: file_url }));
      setPreviewImage(file_url);
    } catch (err) {
      setError("Failed to upload image");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.title || !formData.creator || !formData.description) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke("submitUserMedia", formData);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to submit media");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="fixed inset-0 z-50 bg-black/50"
      onClick={onClose}
    >
      <div
        className="absolute bottom-0 left-0 right-0 rounded-t-3xl p-5 max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: "var(--bg-modal)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Submit New Media
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg" style={{ backgroundColor: "var(--bg-subtle)" }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Media Type */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "var(--text-secondary)" }}>
              Media Type *
            </label>
            <select
              value={formData.media_type}
              onChange={e => setFormData(prev => ({ ...prev, media_type: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", border: "1px solid var(--border-light)" }}
            >
              <option value="movie">🎬 Movie</option>
              <option value="show">📺 TV Show</option>
              <option value="music">🎵 Music / Album</option>
              <option value="book">📚 Book</option>
              <option value="game">🎮 Game</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "var(--text-secondary)" }}>
              Title *
            </label>
            <input
              type="text"
              placeholder="e.g., Inception"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", border: "1px solid var(--border-light)" }}
            />
          </div>

          {/* Creator */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "var(--text-secondary)" }}>
              Creator / Artist / Author *
            </label>
            <input
              type="text"
              placeholder="e.g., Christopher Nolan"
              value={formData.creator}
              onChange={e => setFormData(prev => ({ ...prev, creator: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", border: "1px solid var(--border-light)" }}
            />
          </div>

          {/* Genre */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "var(--text-secondary)" }}>
              Genre
            </label>
            <input
              type="text"
              placeholder="e.g., Sci-Fi, Drama"
              value={formData.genre}
              onChange={e => setFormData(prev => ({ ...prev, genre: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", border: "1px solid var(--border-light)" }}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "var(--text-secondary)" }}>
              Description *
            </label>
            <textarea
              placeholder="Tell us about this media..."
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm min-h-24"
              style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", border: "1px solid var(--border-light)" }}
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "var(--text-secondary)" }}>
              Cover Image
            </label>
            <div className="flex gap-2">
              <label className="flex-1 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer text-center flex items-center justify-center gap-2"
                style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}
              >
                <Upload className="w-4 h-4" />
                <span>Upload Image</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
              {previewImage && (
                <div className="w-20 h-20 rounded-lg overflow-hidden border" style={{ borderColor: "var(--border-light)" }}>
                  <img src={previewImage} alt="preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: "#FFE5E5", color: "#C00" }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2"
              style={{ backgroundColor: "var(--accent-primary)", color: "#fff" }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit for Review"
              )}
            </Button>
          </div>

          <p className="text-[10px] text-center" style={{ color: "var(--text-hint)" }}>
            Your submission will be reviewed by our team and published if approved.
          </p>
        </form>
      </div>
    </motion.div>
  );
}