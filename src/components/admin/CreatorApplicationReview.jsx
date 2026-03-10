import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X, ExternalLink } from "lucide-react";

const CATEGORY_LABELS = {
  musician: "🎵 Musician",
  designer: "🎨 Designer",
  freelancer: "💼 Freelancer",
  developer: "💻 Developer",
  business_owner: "🏪 Business Owner",
  artist: "🖼️ Artist",
  writer: "✍️ Writer",
  educator: "📚 Educator",
  photographer: "📸 Photographer",
  other: "🌟 Other",
};

export default function CreatorApplicationReview() {
  const [selectedApp, setSelectedApp] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const qc = useQueryClient();

  const { data: apps = [], isLoading } = useQuery({
    queryKey: ["creatorApps"],
    queryFn: () => base44.entities.CreatorApplication.filter({ status: "pending" }, "-created_date"),
  });

  const approve = useMutation({
    mutationFn: async (app) => {
      const user = await base44.entities.User.list();
      const targetUser = user.find((u) => u.email === app.user_email);
      if (targetUser) {
        await base44.entities.User.update(targetUser.id, {
          is_creator: true,
          creator_category: app.creator_category,
          creator_bio: app.description,
          creator_links: app.external_links,
          creator_portfolio_link: app.portfolio_link,
        });
      }
      await base44.entities.CreatorApplication.update(app.id, {
        status: "approved",
        reviewed_by: "admin",
        reviewed_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["creatorApps"] });
      setSelectedApp(null);
    },
  });

  const reject = useMutation({
    mutationFn: async (app) => {
      await base44.entities.CreatorApplication.update(app.id, {
        status: "rejected",
        rejection_reason: rejectionReason,
        reviewed_by: "admin",
        reviewed_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["creatorApps"] });
      setSelectedApp(null);
      setRejectionReason("");
    },
  });

  if (isLoading) return <div className="p-4 text-center">Loading applications...</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold mb-4" style={{ color: "var(--text-primary)" }}>
        Creator Applications ({apps.length})
      </h3>

      {apps.length === 0 ? (
        <p style={{ color: "var(--text-hint)" }}>No pending applications</p>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => (
            <button
              key={app.id}
              onClick={() => setSelectedApp(app)}
              className="w-full text-left p-4 rounded-lg border"
              style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)" }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold" style={{ color: "var(--text-primary)" }}>
                    {app.user_name}
                  </p>
                  <p style={{ fontSize: "12px", color: "var(--text-hint)" }}>{app.user_email}</p>
                  <p className="mt-1" style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                    {CATEGORY_LABELS[app.creator_category] || app.creator_category}
                  </p>
                </div>
                <span style={{ fontSize: "11px", color: "var(--text-hint)" }}>
                  {new Date(app.created_date).toLocaleDateString()}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail View */}
      {selectedApp && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999 }}
          onMouseDown={() => setSelectedApp(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl p-6 max-h-[90dvh] overflow-y-auto"
            style={{ backgroundColor: "var(--bg-card)" }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>
              Review Application
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-xs font-bold mb-1" style={{ color: "var(--text-secondary)" }}>
                  NAME
                </p>
                <p style={{ color: "var(--text-primary)" }}>{selectedApp.user_name}</p>
              </div>
              <div>
                <p className="text-xs font-bold mb-1" style={{ color: "var(--text-secondary)" }}>
                  EMAIL
                </p>
                <p style={{ color: "var(--text-primary)" }}>{selectedApp.user_email}</p>
              </div>
              <div>
                <p className="text-xs font-bold mb-1" style={{ color: "var(--text-secondary)" }}>
                  CATEGORY
                </p>
                <p style={{ color: "var(--text-primary)" }}>{CATEGORY_LABELS[selectedApp.creator_category]}</p>
              </div>
              <div>
                <p className="text-xs font-bold mb-1" style={{ color: "var(--text-secondary)" }}>
                  ABOUT THEIR WORK
                </p>
                <p style={{ color: "var(--text-primary)" }}>{selectedApp.description}</p>
              </div>
              <div>
                <p className="text-xs font-bold mb-1" style={{ color: "var(--text-secondary)" }}>
                  WHY JOINING
                </p>
                <p style={{ color: "var(--text-primary)" }}>{selectedApp.reason_for_joining}</p>
              </div>
              {selectedApp.portfolio_link && (
                <div>
                  <p className="text-xs font-bold mb-1" style={{ color: "var(--text-secondary)" }}>
                    PORTFOLIO
                  </p>
                  <a
                    href={selectedApp.portfolio_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs flex items-center gap-1"
                    style={{ color: "var(--accent-primary)" }}
                  >
                    View Portfolio <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              {selectedApp.external_links && Object.keys(selectedApp.external_links).length > 0 && (
                <div>
                  <p className="text-xs font-bold mb-2" style={{ color: "var(--text-secondary)" }}>
                    EXTERNAL LINKS
                  </p>
                  <div className="space-y-1">
                    {Object.entries(selectedApp.external_links).map(([platform, link]) => (
                      <a
                        key={platform}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs flex items-center gap-1 capitalize"
                        style={{ color: "var(--accent-primary)" }}
                      >
                        {platform} <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Rejection Reason (if rejecting) */}
            {selectedApp.status === "pending" && (
              <div>
                <label className="text-xs font-bold mb-2 block" style={{ color: "var(--text-secondary)" }}>
                  Rejection Reason (if applicable)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Leave blank to approve, or explain rejection..."
                  className="w-full px-3 py-2 rounded-lg text-sm h-20 mb-4"
                  style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", border: "1px solid var(--border-light)" }}
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedApp(null)}
                className="flex-1 py-2.5 rounded-lg font-bold text-sm"
                style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)" }}
              >
                Close
              </button>
              {selectedApp.status === "pending" && (
                <>
                  <button
                    onClick={() => reject.mutate(selectedApp)}
                    disabled={reject.isPending}
                    className="flex-1 py-2.5 rounded-lg font-bold text-sm text-white flex items-center justify-center gap-2"
                    style={{ backgroundColor: "#ef4444" }}
                  >
                    <X className="w-4 h-4" /> Reject
                  </button>
                  <button
                    onClick={() => approve.mutate(selectedApp)}
                    disabled={approve.isPending}
                    className="flex-1 py-2.5 rounded-lg font-bold text-sm text-white flex items-center justify-center gap-2"
                    style={{ backgroundColor: "var(--accent-primary)" }}
                  >
                    <Check className="w-4 h-4" /> Approve
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}