import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Trash2, CheckCircle, Flag } from "lucide-react";

export default function GroupModerationPanel({ group, user, onClose }) {
  const qc = useQueryClient();

  const { data: reports = [] } = useQuery({
    queryKey: ["groupReports", group.id],
    queryFn: () => base44.entities.GroupPostReport.filter({ group_id: group.id, status: "pending" }, "-created_date", 50),
  });

  const { data: pendingPosts = [] } = useQuery({
    queryKey: ["pendingGroupPosts", group.id],
    queryFn: () => base44.entities.CommunityPost.filter({ group_id: group.id, moderation_status: "pending" }, "-created_date", 50),
  });

  const handleReport = async (report, action) => {
    if (action === "remove") {
      await base44.entities.CommunityPost.delete(report.post_id);
    }
    await base44.entities.GroupPostReport.update(report.id, {
      status: action === "remove" ? "removed" : "dismissed",
      moderator_email: user.email,
    });
    qc.invalidateQueries({ queryKey: ["groupReports", group.id] });
    qc.invalidateQueries({ queryKey: ["groupPosts", group.id] });
  };

  const handleApprovePost = async (post) => {
    await base44.entities.CommunityPost.update(post.id, { moderation_status: "approved" });
    qc.invalidateQueries({ queryKey: ["pendingGroupPosts", group.id] });
    qc.invalidateQueries({ queryKey: ["groupPosts", group.id] });
  };

  const handleRejectPost = async (post) => {
    await base44.entities.CommunityPost.delete(post.id);
    qc.invalidateQueries({ queryKey: ["pendingGroupPosts", group.id] });
  };

  const totalPending = reports.length + pendingPosts.length;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-lg mx-auto rounded-t-3xl"
        style={{ backgroundColor: "#F2EDE4", maxHeight: "88vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="h-1.5 w-12 rounded-full mx-auto mt-3 mb-1" style={{ backgroundColor: "var(--border-medium)" }} />
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Moderation</h2>
              {totalPending > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: "#E05C7A" }}>
                  {totalPending}
                </span>
              )}
            </div>
            <button onClick={onClose}><X className="w-5 h-5" style={{ color: "var(--text-hint)" }} /></button>
          </div>

          {/* Pending post approvals */}
          {pendingPosts.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-hint)" }}>
                Pending Approval ({pendingPosts.length})
              </p>
              <div className="space-y-2">
                {pendingPosts.map(post => (
                  <div key={post.id} className="p-3 rounded-2xl"
                    style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>
                      By {post.is_anonymous ? "Anonymous" : post.author_name}
                    </p>
                    <p className="text-sm mb-3 line-clamp-3" style={{ color: "var(--text-primary)" }}>{post.body}</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleApprovePost(post)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white"
                        style={{ backgroundColor: "var(--accent-primary)" }}>
                        <CheckCircle className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button onClick={() => handleRejectPost(post)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold"
                        style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}>
                        <Trash2 className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reported posts */}
          {reports.length > 0 ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-hint)" }}>
                Reported Posts ({reports.length})
              </p>
              <div className="space-y-2">
                {reports.map(report => (
                  <div key={report.id} className="p-3 rounded-2xl"
                    style={{ backgroundColor: "var(--bg-card)", border: "1px solid #fca5a530" }}>
                    <div className="flex items-start gap-2 mb-2">
                      <Flag className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#f97316" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                          Reported by {report.reporter_name || report.reporter_email}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-primary)" }}>{report.reason}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => handleReport(report, "remove")}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold"
                        style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}>
                        <Trash2 className="w-3.5 h-3.5" /> Remove Post
                      </button>
                      <button onClick={() => handleReport(report, "dismiss")}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold"
                        style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
                        <CheckCircle className="w-3.5 h-3.5" /> Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : pendingPosts.length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-4xl mb-3">✅</div>
              <p className="font-semibold text-sm" style={{ color: "var(--text-secondary)" }}>All clear!</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>No pending reports or posts</p>
            </div>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
}