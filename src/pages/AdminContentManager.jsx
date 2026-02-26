import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Edit2, Trash2, MessageSquare, Loader2, AlertCircle } from "lucide-react";

export default function AdminContentManager() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("submissions");
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u?.role !== "admin") {
        window.location.href = "/";
      }
    }).catch(() => window.location.href = "/");
  }, []);

  // Fetch submissions
  const { data: submissions = [], isLoading: subLoading } = useQuery({
    queryKey: ["userSubmissions"],
    queryFn: () => base44.entities.UserSubmittedMedia.list("-created_date", 100),
  });

  // Fetch reviews
  const { data: reviews = [], isLoading: revLoading } = useQuery({
    queryKey: ["userReviews"],
    queryFn: () => base44.entities.UserMediaReview.list("-created_date", 100),
  });

  // Mutations
  const approveMut = useMutation({
    mutationFn: (item) => base44.entities.UserSubmittedMedia.update(item.id, { status: "approved" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["userSubmissions"] }),
  });

  const rejectMut = useMutation({
    mutationFn: (item) => base44.entities.UserSubmittedMedia.update(item.id, { status: "rejected", rejection_reason: rejectionReason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["userSubmissions"] });
      setSelectedItem(null);
      setRejectionReason("");
    },
  });

  const approvReviewMut = useMutation({
    mutationFn: (item) => base44.entities.UserMediaReview.update(item.id, { status: "approved" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["userReviews"] }),
  });

  const rejectReviewMut = useMutation({
    mutationFn: (item) => base44.entities.UserMediaReview.update(item.id, { status: "rejected" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["userReviews"] }),
  });

  const updateMut = useMutation({
    mutationFn: (item) => base44.entities.UserSubmittedMedia.update(item.id, {
      title: editingItem.title,
      creator: editingItem.creator,
      description: editingItem.description,
      genre: editingItem.genre,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["userSubmissions"] });
      setEditingItem(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.UserSubmittedMedia.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["userSubmissions"] });
      setSelectedItem(null);
    },
  });

  if (!user) return <div className="flex items-center justify-center h-screen"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  const pendingSubs = submissions.filter(s => s.status === "pending");
  const pendingRevs = reviews.filter(r => r.status === "pending");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
      <div className="max-w-2xl mx-auto p-5">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Content Manager</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>Review and approve user submissions and reviews</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: "submissions", label: "📝 Submissions", count: pendingSubs.length },
            { key: "reviews", label: "⭐ Reviews", count: pendingRevs.length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                backgroundColor: activeTab === tab.key ? "var(--accent-primary)" : "var(--bg-card)",
                color: activeTab === tab.key ? "#fff" : "var(--text-secondary)",
                border: `1px solid ${activeTab === tab.key ? "var(--accent-primary)" : "var(--border-light)"}`,
              }}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Submissions Tab */}
        {activeTab === "submissions" && (
          <div className="space-y-4">
            {subLoading && <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>}
            
            {!subLoading && submissions.length === 0 && (
              <div className="text-center py-12" style={{ backgroundColor: "var(--bg-card)", borderRadius: "1rem", border: "1px solid var(--border-light)" }}>
                <p style={{ color: "var(--text-hint)" }}>No submissions yet</p>
              </div>
            )}

            {!subLoading && submissions.map(sub => (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl"
                style={{
                  backgroundColor: "var(--bg-card)",
                  border: `2px solid ${sub.status === "pending" ? "var(--border-light)" : sub.status === "approved" ? "#22c55e" : "#ef4444"}`,
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>{sub.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        sub.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                        sub.status === "approved" ? "bg-green-100 text-green-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {sub.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      <strong>Creator:</strong> {sub.creator} • <strong>Type:</strong> {sub.media_type} • <strong>Genre:</strong> {sub.genre}
                    </p>
                    <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>{sub.description}</p>
                    {sub.rejection_reason && (
                      <div className="mt-2 p-2 rounded-lg flex gap-2" style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
                        <AlertCircle className="w-4 h-4 mt-0.5" style={{ color: "#ef4444" }} />
                        <div>
                          <p className="text-xs font-semibold" style={{ color: "#dc2626" }}>Rejection Reason:</p>
                          <p className="text-xs" style={{ color: "#991b1b" }}>{sub.rejection_reason}</p>
                        </div>
                      </div>
                    )}
                    <p className="text-xs mt-2" style={{ color: "var(--text-hint)" }}>
                      Submitted by {sub.submitted_by_name} ({sub.submitted_by_email})
                    </p>
                  </div>
                  {sub.image_url && (
                    <img src={sub.image_url} alt={sub.title} className="w-20 h-20 rounded-lg object-cover shrink-0" />
                  )}
                </div>

                {/* Actions */}
                {sub.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => approveMut.mutate(sub)}
                      disabled={approveMut.isPending}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-semibold text-sm transition-all"
                      style={{ backgroundColor: "#22c55e", color: "#fff" }}
                    >
                      <Check className="w-4 h-4" /> Approve
                    </button>
                    <button
                      onClick={() => setSelectedItem(sub)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-semibold text-sm transition-all"
                      style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}
                    >
                      <X className="w-4 h-4" /> Reject
                    </button>
                    <button
                      onClick={() => setEditingItem(sub)}
                      className="px-3 py-2 rounded-lg font-semibold text-sm transition-all"
                      style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {sub.status !== "pending" && (
                  <button
                    onClick={() => deleteMut.mutate(sub.id)}
                    className="w-full py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
                    style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#dc2626" }}
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === "reviews" && (
          <div className="space-y-4">
            {revLoading && <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>}
            
            {!revLoading && reviews.length === 0 && (
              <div className="text-center py-12" style={{ backgroundColor: "var(--bg-card)", borderRadius: "1rem", border: "1px solid var(--border-light)" }}>
                <p style={{ color: "var(--text-hint)" }}>No reviews yet</p>
              </div>
            )}

            {!revLoading && reviews.map(rev => (
              <motion.div
                key={rev.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl"
                style={{
                  backgroundColor: "var(--bg-card)",
                  border: `2px solid ${rev.status === "pending" ? "var(--border-light)" : rev.status === "approved" ? "#22c55e" : "#ef4444"}`,
                }}
              >
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
                      Media #{rev.media_id}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      rev.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                      rev.status === "approved" ? "bg-green-100 text-green-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {rev.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    <strong>Rating:</strong> {rev.rating} / 5 ⭐ • <strong>Type:</strong> {rev.media_type}
                  </p>
                  <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>{rev.review_text}</p>
                  <p className="text-xs mt-2" style={{ color: "var(--text-hint)" }}>
                    By {rev.reviewer_name} ({rev.reviewer_email})
                  </p>
                </div>

                {/* Actions */}
                {rev.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => approvReviewMut.mutate(rev)}
                      disabled={approvReviewMut.isPending}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-semibold text-sm transition-all"
                      style={{ backgroundColor: "#22c55e", color: "#fff" }}
                    >
                      <Check className="w-4 h-4" /> Approve
                    </button>
                    <button
                      onClick={() => rejectReviewMut.mutate(rev)}
                      disabled={rejectReviewMut.isPending}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-semibold text-sm transition-all"
                      style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}
                    >
                      <X className="w-4 h-4" /> Reject
                    </button>
                  </div>
                )}
                {rev.status !== "pending" && (
                  <button
                    onClick={() => {
                      base44.entities.UserMediaReview.delete(rev.id).then(() => {
                        qc.invalidateQueries({ queryKey: ["userReviews"] });
                      });
                    }}
                    className="w-full py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
                    style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#dc2626" }}
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="w-full rounded-t-3xl p-5"
              style={{ backgroundColor: "var(--bg-modal)" }}
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold mb-3" style={{ color: "var(--text-primary)" }}>Reject Submission</h2>
              <textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="Why are you rejecting this submission?"
                className="w-full p-3 rounded-lg text-sm mb-3 outline-none resize-none h-24"
                style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="flex-1 py-2 rounded-lg font-semibold"
                  style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => rejectMut.mutate(selectedItem)}
                  disabled={rejectMut.isPending || !rejectionReason.trim()}
                  className="flex-1 py-2 rounded-lg font-semibold text-white"
                  style={{ backgroundColor: "#ef4444" }}
                >
                  {rejectMut.isPending ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end"
            onClick={() => setEditingItem(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="w-full rounded-t-3xl p-5 max-h-[90vh] overflow-y-auto"
              style={{ backgroundColor: "var(--bg-modal)" }}
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold mb-4" style={{ color: "var(--text-primary)" }}>Edit Submission</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Title</label>
                  <input
                    type="text"
                    value={editingItem.title}
                    onChange={e => setEditingItem({ ...editingItem, title: e.target.value })}
                    className="w-full p-2 rounded-lg text-sm mt-1 outline-none"
                    style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Creator</label>
                  <input
                    type="text"
                    value={editingItem.creator}
                    onChange={e => setEditingItem({ ...editingItem, creator: e.target.value })}
                    className="w-full p-2 rounded-lg text-sm mt-1 outline-none"
                    style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Genre</label>
                  <input
                    type="text"
                    value={editingItem.genre}
                    onChange={e => setEditingItem({ ...editingItem, genre: e.target.value })}
                    className="w-full p-2 rounded-lg text-sm mt-1 outline-none"
                    style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Description</label>
                  <textarea
                    value={editingItem.description}
                    onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                    className="w-full p-2 rounded-lg text-sm mt-1 outline-none resize-none h-20"
                    style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-2 rounded-lg font-semibold"
                  style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateMut.mutate(editingItem)}
                  disabled={updateMut.isPending}
                  className="flex-1 py-2 rounded-lg font-semibold text-white"
                  style={{ backgroundColor: "var(--accent-primary)" }}
                >
                  {updateMut.isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}