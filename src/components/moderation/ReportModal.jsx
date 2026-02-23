import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Flag, X } from "lucide-react";

const REASONS = [
  "Hate speech or harassment",
  "Spam or misleading content",
  "Explicit or NSFW content",
  "Violence or self-harm",
  "Misinformation",
  "Other",
];

export default function ReportModal({ open, onClose, contentType, contentId, user }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);
    await base44.entities.Report.create({
      content_type: contentType,
      content_id: contentId,
      reason,
      reporter_email: user?.email || "anonymous",
      status: "pending",
    });
    setSubmitting(false);
    setDone(true);
    setTimeout(() => { setDone(false); setReason(""); onClose(); }, 1500);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={() => { setReason(""); setDone(false); onClose(); }}
      onTouchMove={e => e.stopPropagation()}
    >
      <div
        className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-rose-500" />
            <span className="font-semibold text-base" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Report Content</span>
          </div>
          <button onClick={() => { setReason(""); setDone(false); onClose(); }} className="p-1.5 rounded-full" style={{ backgroundColor: "var(--bg-app)" }}>
            <X className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
          </button>
        </div>

        {done ? (
          <div className="text-center py-6">
            <p className="text-3xl mb-2">✅</p>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Thank you for reporting</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>Our team will review this soon.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs" style={{ color: "var(--text-hint)" }}>Why are you reporting this content?</p>
            <div className="space-y-1.5">
              {REASONS.map(r => (
                <button key={r} onClick={() => setReason(r)}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all"
                  style={{
                    backgroundColor: reason === r ? "rgba(60,110,90,0.10)" : "var(--bg-app)",
                    border: `1px solid ${reason === r ? "var(--accent-primary)" : "var(--border-light)"}`,
                    color: reason === r ? "var(--accent-primary)" : "var(--text-secondary)",
                    fontWeight: reason === r ? 500 : 400,
                  }}>
                  {r}
                </button>
              ))}
            </div>
            <Button onClick={handleSubmit} disabled={!reason || submitting} className="w-full rounded-xl" style={{ backgroundColor: "#E05C5C" }}>
              {submitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}