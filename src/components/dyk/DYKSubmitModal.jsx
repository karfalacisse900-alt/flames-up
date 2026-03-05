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
  const [verifying, setVerifying] = useState(false);
  const [verification, setVerification] = useState(null);

  async function handleVerify() {
    if (!content.toLowerCase().startsWith("did you know")) {
      setError('Fact must start with "Did you know"');
      return;
    }
    if (content.trim().length < 30) {
      setError("Please write a more detailed fact.");
      return;
    }
    
    setVerifying(true);
    setError("");
    try {
      const res = await base44.functions.invoke('verifyDidYouKnow', {
        content: content.trim(),
        sourceLink: sourceLink.trim()
      });
      setVerification(res.data);
    } catch (err) {
      setError("Verification failed. You can still submit.");
    } finally {
      setVerifying(false);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const qualityLabel = verification?.quality_label || null;
      await base44.entities.DidYouKnow.create({
        content: content.trim(),
        category,
        source_link: sourceLink.trim() || undefined,
        status: "pending",
        quality_label: qualityLabel,
        submitter_email: user.email,
        submitter_name: user.full_name || "User",
        useful_count: 0,
        didnt_know_count: 0,
        knew_count: 0,
        voted_by: {},
        comment_count: 0,
      });
      onSubmitted?.();
      onClose();
    } finally {
      setSubmitting(false);
    }
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

        {verification && (
          <div className="p-3 rounded-xl border" style={{ backgroundColor: verification.quality_label === "verified" ? "#dcfce7" : verification.quality_label === "community_tip" ? "#fef3c7" : "#fee2e2", borderColor: verification.quality_label === "verified" ? "#86efac" : verification.quality_label === "community_tip" ? "#fcd34d" : "#fca5a5" }}>
            <p className="text-xs font-semibold mb-1" style={{ color: verification.quality_label === "verified" ? "#166534" : verification.quality_label === "community_tip" ? "#92400e" : "#991b1b" }}>
              {verification.quality_label === "verified" ? "✓ Verified" : verification.quality_label === "community_tip" ? "⚠ Community Tip" : "⚠ Needs Source"}
            </p>
            <p className="text-xs" style={{ color: verification.quality_label === "verified" ? "#166534" : verification.quality_label === "community_tip" ? "#92400e" : "#991b1b" }}>
              {verification.reasoning}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleVerify}
            disabled={verifying}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50 border"
            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", borderColor: "var(--border-light)" }}>
            {verifying ? "Checking..." : "Verify with AI"}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-opacity disabled:opacity-50"
            style={{ backgroundColor: "var(--accent-primary, #6366f1)", color: "#fff" }}>
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>

        <p className="text-center text-xs" style={{ color: "var(--text-hint, #9ca3af)" }}>
          Facts are reviewed before appearing in the feed.
        </p>
      </div>
    </div>
  );
}