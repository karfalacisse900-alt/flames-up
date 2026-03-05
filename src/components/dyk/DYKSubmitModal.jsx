import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Lightbulb } from "lucide-react";

const CATEGORIES = [
  { value: "save_money",    label: "💰 Save Money" },
  { value: "apps_tech",     label: "📱 Apps & Tech" },
  { value: "travel",        label: "🌎 Travel" },
  { value: "city_services", label: "🏙 City Services" },
  { value: "entertainment", label: "🎬 Entertainment" },
  { value: "jobs",          label: "💼 Jobs & Opportunities" },
];

export default function DYKSubmitModal({ user, onClose, onSubmitted }) {
  const [content, setContent] = useState("Did you know ");
  const [category, setCategory] = useState("apps_tech");
  const [sourceLink, setSourceLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!content.toLowerCase().startsWith("did you know")) {
      setError('Fact must start with "Did you know"');
      return;
    }
    if (content.trim().length < 30) {
      setError("Please write a more detailed fact.");
      return;
    }
    setSubmitting(true);
    await base44.entities.DidYouKnow.create({
      content: content.trim(),
      category,
      source_link: sourceLink.trim() || undefined,
      status: "pending",
      submitter_email: user.email,
      submitter_name: user.full_name || "User",
      useful_count: 0,
      didnt_know_count: 0,
      knew_count: 0,
      voted_by: {},
      comment_count: 0,
    });
    setSubmitting(false);
    onSubmitted?.();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="w-full max-w-lg rounded-2xl p-5 space-y-4" style={{ backgroundColor: "var(--bg-card, #fff)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" style={{ color: "var(--accent-primary, #6366f1)" }} />
            <h2 className="text-base font-bold" style={{ color: "var(--text-primary, #111)" }}>Share a Fact</h2>
          </div>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: "var(--text-hint, #9ca3af)" }} /></button>
        </div>

        <p className="text-xs" style={{ color: "var(--text-secondary, #6b7280)" }}>
          Must start with <strong>"Did you know"</strong> — share something useful, free, or surprising!
        </p>

        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={4}
          placeholder="Did you know you can..."
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
          style={{ backgroundColor: "var(--bg-subtle, #f3f4f6)", border: "1px solid var(--border-light, #e5e7eb)", color: "var(--text-primary, #111)" }}
        />

        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className="text-sm px-3 py-2 rounded-xl text-left transition-all"
              style={{
                backgroundColor: category === c.value ? "var(--accent-primary, #6366f1)" : "var(--bg-subtle, #f3f4f6)",
                color: category === c.value ? "#fff" : "var(--text-secondary, #6b7280)",
              }}>
              {c.label}
            </button>
          ))}
        </div>

        <input
          value={sourceLink}
          onChange={e => setSourceLink(e.target.value)}
          placeholder="Source link (optional)"
          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
          style={{ backgroundColor: "var(--bg-subtle, #f3f4f6)", border: "1px solid var(--border-light, #e5e7eb)", color: "var(--text-primary, #111)" }}
        />

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 rounded-xl text-sm font-bold transition-opacity disabled:opacity-50"
          style={{ backgroundColor: "var(--accent-primary, #6366f1)", color: "#fff" }}>
          {submitting ? "Submitting..." : "Submit for Review"}
        </button>

        <p className="text-center text-xs" style={{ color: "var(--text-hint, #9ca3af)" }}>
          Facts are reviewed before appearing in the feed.
        </p>
      </div>
    </div>
  );
}