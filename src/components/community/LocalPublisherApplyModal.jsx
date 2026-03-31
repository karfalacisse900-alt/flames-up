import React, { useState } from "react";
import { X, BadgeCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function LocalPublisherApplyModal({ user, onClose }) {
  const [publisherName, setPublisherName] = useState("");
  const [website, setWebsite] = useState("");
  const [bio, setBio] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!publisherName.trim()) return;
    setSubmitting(true);
    const domain = website ? website.replace(/^https?:\/\//, "").split("/")[0] : "";
    await base44.entities.LocalPublisher.create({
      user_email: user.email,
      publisher_name: publisherName.trim(),
      website: website.trim(),
      website_domain: domain,
      bio: bio.trim(),
      status: "pending",
    });
    setSubmitting(false);
    setDone(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="w-full max-w-lg rounded-t-3xl p-6 pb-10 sheet-enter"
        style={{ backgroundColor: "var(--bg-modal)", border: "1px solid var(--border-light)" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
            Apply as Local Publisher
          </h2>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full"
            style={{ backgroundColor: "var(--bg-subtle)" }}>
            <X className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>

        {done ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: "var(--accent-primary-light)" }}>
              <BadgeCheck className="w-8 h-8" style={{ color: "var(--accent-primary)" }} />
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
              Application Submitted!
            </h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Our team will review your application and get back to you. Once approved, you'll be able to publish as a local publisher.
            </p>
            <button onClick={onClose}
              className="mt-6 px-6 py-3 rounded-2xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)" }}>
              Got it
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold block mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Publisher / Organization Name *
              </label>
              <input
                type="text"
                value={publisherName}
                onChange={e => setPublisherName(e.target.value)}
                placeholder="e.g. Boston Globe, The Daily Neighbor"
                className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
                style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
              />
            </div>
            <div>
              <label className="text-sm font-semibold block mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Website / URL
              </label>
              <input
                type="url"
                value={website}
                onChange={e => setWebsite(e.target.value)}
                placeholder="https://yoursite.com"
                className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
                style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
              />
            </div>
            <div>
              <label className="text-sm font-semibold block mb-1.5" style={{ color: "var(--text-secondary)" }}>
                About your publication
              </label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Tell us what you cover and your audience…"
                rows={3}
                className="w-full px-4 py-3 rounded-2xl text-sm outline-none resize-none"
                style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={!publisherName.trim() || submitting}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)", opacity: (!publisherName.trim() || submitting) ? 0.5 : 1 }}>
              {submitting ? "Submitting…" : "Submit Application"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}