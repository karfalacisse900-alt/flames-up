import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Plus } from "lucide-react";

const CATEGORIES = [
  { value: "productivity", label: "⚡ Productivity" },
  { value: "finance", label: "💰 Finance" },
  { value: "learning", label: "📚 Learning" },
  { value: "lifestyle", label: "🌿 Lifestyle" },
  { value: "entertainment", label: "🎬 Entertainment" },
  { value: "health", label: "💪 Health" },
  { value: "social", label: "👥 Social" },
  { value: "developer_tools", label: "🛠️ Dev Tools" },
];

export default function SubmitAppModal({ user, onClose, onSubmitted }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");
  const [category, setCategory] = useState("productivity");
  const [link, setLink] = useState("");
  const [pricing, setPricing] = useState("Free");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!title.trim() || !description.trim() || !category) {
      setError("Title, description, and category are required");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await base44.entities.DiscoverItem.create({
        title: title.trim(),
        description: description.trim(),
        long_description: longDescription.trim() || description.trim(),
        category,
        link: link.trim() || undefined,
        pricing: pricing || "Free",
        brand_name: user.full_name || "Community",
        is_approved: false,
        is_featured: false,
        is_new: true,
        avg_rating: 0,
        review_count: 0,
      });
      onSubmitted?.();
      onClose();
    } catch (err) {
      setError("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="w-full max-w-lg rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: "var(--bg-card)" }}>
        <div className="flex items-center justify-between sticky top-0" style={{ backgroundColor: "var(--bg-card)" }}>
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5" style={{ color: "var(--accent-primary)" }} />
            <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Submit an App</h2>
          </div>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: "var(--text-hint)" }} /></button>
        </div>

        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          Share a great app or tool! Your submission will be reviewed by admins before appearing in the feed.
        </p>

        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="App name"
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
        />

        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Short description (one line)"
          rows={2}
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
          style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
        />

        <textarea
          value={longDescription}
          onChange={e => setLongDescription(e.target.value)}
          placeholder="Detailed description (optional - what makes it special?)"
          rows={3}
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
          style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
        />

        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
        >
          {CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>

        <input
          value={link}
          onChange={e => setLink(e.target.value)}
          placeholder="Link to app (optional)"
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
        />

        <select
          value={pricing}
          onChange={e => setPricing(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
        >
          <option value="Free">Free</option>
          <option value="Freemium">Freemium</option>
          <option value="Paid">Paid</option>
          <option value="Free Trial">Free Trial</option>
        </select>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 rounded-xl text-sm font-bold transition-opacity disabled:opacity-50 text-white"
          style={{ backgroundColor: "var(--accent-primary)" }}>
          {submitting ? "Submitting..." : "Submit for Review"}
        </button>

        <p className="text-center text-xs" style={{ color: "var(--text-hint)" }}>
          Apps are reviewed by admins before publishing.
        </p>
      </div>
    </div>
  );
}