import React, { useState, useEffect, useMemo, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Edit2, Trash2, Loader2, AlertCircle, Bell, Filter, CheckSquare, Square, BarChart2, ArrowLeft, Camera, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const STATUS_FILTERS = ["all", "pending", "approved", "rejected"];

function StatusBadge({ status }) {
  const cls = status === "pending" ? "bg-yellow-100 text-yellow-800"
    : status === "approved" ? "bg-green-100 text-green-800"
    : "bg-red-100 text-red-800";
  return <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cls}`}>{status.toUpperCase()}</span>;
}

export default function AdminContentManager() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("submissions");
  const [dykFilter, setDykFilter] = useState("pending");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState(null); // for reject modal
  const [editingItem, setEditingItem] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkAction, setBulkAction] = useState(null); // "approve" | "reject"
  const [bulkRejectionReason, setBulkRejectionReason] = useState("");
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
    }).catch(() => {});
  }, []);

  const { data: submissions = [], isLoading: subLoading } = useQuery({
    queryKey: ["userSubmissions"],
    queryFn: () => base44.entities.UserSubmittedMedia.list("-created_date", 200),
    refetchInterval: 30000,
    enabled: user?.role === "admin",
  });

  const { data: reviews = [], isLoading: revLoading } = useQuery({
    queryKey: ["userReviews"],
    queryFn: () => base44.entities.UserMediaReview.list("-created_date", 200),
    refetchInterval: 30000,
    enabled: user?.role === "admin",
  });

  // Real-time notification on new pending items
  useEffect(() => {
    const unsub = base44.entities.UserSubmittedMedia.subscribe((event) => {
      if (event.type === "create") {
        setNotification("New media submission received!");
        qc.invalidateQueries({ queryKey: ["userSubmissions"] });
        setTimeout(() => setNotification(null), 5000);
      }
    });
    const unsub2 = base44.entities.UserMediaReview.subscribe((event) => {
      if (event.type === "create") {
        setNotification("New review received!");
        qc.invalidateQueries({ queryKey: ["userReviews"] });
        setTimeout(() => setNotification(null), 5000);
      }
    });
    return () => { unsub(); unsub2(); };
  }, []);

  // Mutations
  const approveMut = useMutation({
    mutationFn: (id) => base44.entities.UserSubmittedMedia.update(id, { status: "approved" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["userSubmissions"] }); setSelectedIds(new Set()); },
  });
  const rejectMut = useMutation({
    mutationFn: ({ id, reason }) => base44.entities.UserSubmittedMedia.update(id, { status: "rejected", rejection_reason: reason }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["userSubmissions"] }); setSelectedItem(null); setRejectionReason(""); },
  });
  const approveRevMut = useMutation({
    mutationFn: (id) => base44.entities.UserMediaReview.update(id, { status: "approved" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["userReviews"] }); setSelectedIds(new Set()); },
  });
  const rejectRevMut = useMutation({
    mutationFn: (id) => base44.entities.UserMediaReview.update(id, { status: "rejected" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["userReviews"] }),
  });
  const updateMut = useMutation({
    mutationFn: (item) => base44.entities.UserSubmittedMedia.update(item.id, { title: item.title, creator: item.creator, description: item.description, genre: item.genre }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["userSubmissions"] }); setEditingItem(null); },
  });
  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.UserSubmittedMedia.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["userSubmissions"] }); setSelectedIds(new Set()); },
  });

  // Filtered data
  const filteredSubs = useMemo(() =>
    submissions.filter(s => statusFilter === "all" || s.status === statusFilter),
    [submissions, statusFilter]);
  const filteredRevs = useMemo(() =>
    reviews.filter(r => statusFilter === "all" || r.status === statusFilter),
    [reviews, statusFilter]);

  const currentList = activeTab === "submissions" ? filteredSubs : filteredRevs;
  const allSelected = selectedIds.size === currentList.length && currentList.length > 0;

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(currentList.map(i => i.id)));
  };

  const handleBulkApprove = async () => {
    const ids = Array.from(selectedIds);
    if (activeTab === "submissions") {
      await Promise.all(ids.map(id => base44.entities.UserSubmittedMedia.update(id, { status: "approved" })));
      qc.invalidateQueries({ queryKey: ["userSubmissions"] });
    } else {
      await Promise.all(ids.map(id => base44.entities.UserMediaReview.update(id, { status: "approved" })));
      qc.invalidateQueries({ queryKey: ["userReviews"] });
    }
    setSelectedIds(new Set());
  };

  const handleBulkReject = async () => {
    const ids = Array.from(selectedIds);
    if (activeTab === "submissions") {
      await Promise.all(ids.map(id => base44.entities.UserSubmittedMedia.update(id, { status: "rejected", rejection_reason: bulkRejectionReason })));
      qc.invalidateQueries({ queryKey: ["userSubmissions"] });
    } else {
      await Promise.all(ids.map(id => base44.entities.UserMediaReview.update(id, { status: "rejected" })));
      qc.invalidateQueries({ queryKey: ["userReviews"] });
    }
    setSelectedIds(new Set());
    setShowBulkModal(false);
    setBulkRejectionReason("");
  };

  const pendingSubs = submissions.filter(s => s.status === "pending").length;
  const pendingRevs = reviews.filter(r => r.status === "pending").length;

  // Did You Know queries & mutations
  const { data: dykPosts = [], isLoading: dykLoading } = useQuery({
    queryKey: ["adminDYK"],
    queryFn: () => base44.entities.DidYouKnow.list("-created_date", 200),
    refetchInterval: 30000,
    enabled: user?.role === "admin",
  });
  const approveDYK = useMutation({
    mutationFn: (post) => base44.entities.DidYouKnow.update(post.id, { status: "approved", approved_at: new Date().toISOString(), approved_by: user?.email }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminDYK"] }),
  });
  const rejectDYK = useMutation({
    mutationFn: ({ id, note }) => base44.entities.DidYouKnow.update(id, { status: "rejected", admin_note: note }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminDYK"] }),
  });
  const deleteDYK = useMutation({
    mutationFn: (id) => base44.entities.DidYouKnow.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminDYK"] }),
  });
  const filteredDYK = dykPosts.filter(p => dykFilter === "all" || p.status === dykFilter);
  const pendingDYK = dykPosts.filter(p => p.status === "pending").length;

  if (!user) return <div className="flex items-center justify-center h-screen"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (user?.role !== "admin") return (
    <div className="flex flex-col items-center justify-center h-screen gap-3 px-6">
      <AlertCircle className="w-12 h-12" style={{ color: "#ef4444" }} />
      <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Access Denied</p>
      <p className="text-sm text-center" style={{ color: "var(--text-secondary)" }}>You need admin role to access this page.</p>
    </div>
  );

  return (
    <div className="min-h-screen pb-8" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Notification banner */}
      <AnimatePresence>
        {notification && (
          <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50 p-3 text-center text-sm font-semibold text-white flex items-center justify-center gap-2"
            style={{ backgroundColor: "#2E6B4F" }}>
            <Bell className="w-4 h-4" /> {notification}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5 pt-2">
          <Link to={createPageUrl("Profile")} className="p-2 rounded-xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
            <ArrowLeft className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Content Manager</h1>
            <p className="text-xs" style={{ color: "var(--text-hint)" }}>Moderate user submissions & reviews</p>
          </div>
          <Link to={createPageUrl("AdminAnalytics")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--accent-primary)" }}>
            <BarChart2 className="w-3.5 h-3.5" /> Analytics
          </Link>
        </div>

        {/* Main tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
          {[{ key: "submissions", label: "📝 Submissions", count: pendingSubs }, { key: "reviews", label: "⭐ Reviews", count: pendingRevs }, { key: "dyk", label: "💡 Did You Know", count: pendingDYK }].map(tab => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSelectedIds(new Set()); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ backgroundColor: activeTab === tab.key ? "var(--accent-primary)" : "var(--bg-card)", color: activeTab === tab.key ? "#fff" : "var(--text-secondary)", border: `1px solid ${activeTab === tab.key ? "var(--accent-primary)" : "var(--border-light)"}` }}>
              {tab.label}
              {tab.count > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: activeTab === tab.key ? "rgba(255,255,255,0.25)" : "#ef4444", color: "#fff" }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
          {STATUS_FILTERS.map(f => (
            <button key={f} onClick={() => { setStatusFilter(f); setSelectedIds(new Set()); }}
              className="px-3 py-1.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition-all flex items-center gap-1"
              style={{ backgroundColor: statusFilter === f ? "var(--accent-primary)" : "var(--bg-card)", color: statusFilter === f ? "#fff" : "var(--text-secondary)", border: `1px solid ${statusFilter === f ? "var(--accent-primary)" : "var(--border-light)"}` }}>
              <Filter className="w-3 h-3" /> {f}
              {f !== "all" && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px]" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                  {(activeTab === "submissions" ? submissions : reviews).filter(i => i.status === f).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Bulk actions bar */}
        {currentList.length > 0 && (
          <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
            <button onClick={toggleAll} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              {allSelected ? <CheckSquare className="w-4 h-4" style={{ color: "var(--accent-primary)" }} /> : <Square className="w-4 h-4" />}
              {allSelected ? "Deselect all" : "Select all"}
            </button>
            {selectedIds.size > 0 && (
              <>
                <span className="text-xs" style={{ color: "var(--text-hint)" }}>{selectedIds.size} selected</span>
                <div className="flex gap-2 ml-auto">
                  <button onClick={handleBulkApprove}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-1"
                    style={{ backgroundColor: "#22c55e" }}>
                    <Check className="w-3.5 h-3.5" /> Approve all
                  </button>
                  <button onClick={() => setShowBulkModal(true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                    style={{ backgroundColor: "#ef4444", color: "#fff" }}>
                    <X className="w-3.5 h-3.5" /> Reject all
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Submissions */}
        {activeTab === "submissions" && (
          <div className="space-y-3">
            {subLoading && <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>}
            {!subLoading && filteredSubs.length === 0 && (
              <div className="text-center py-12 rounded-2xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                <p style={{ color: "var(--text-hint)" }}>No {statusFilter !== "all" ? statusFilter : ""} submissions</p>
              </div>
            )}
            {!subLoading && filteredSubs.map(sub => (
              <motion.div key={sub.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl"
                style={{ backgroundColor: "var(--bg-card)", border: `2px solid ${selectedIds.has(sub.id) ? "var(--accent-primary)" : sub.status === "approved" ? "#22c55e" : sub.status === "rejected" ? "#ef4444" : "var(--border-light)"}` }}>
                <div className="flex items-start gap-3 mb-3">
                  <button onClick={() => toggleSelect(sub.id)} className="mt-0.5 shrink-0">
                    {selectedIds.has(sub.id) ? <CheckSquare className="w-5 h-5" style={{ color: "var(--accent-primary)" }} /> : <Square className="w-5 h-5" style={{ color: "var(--text-hint)" }} />}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{sub.title}</h3>
                      <StatusBadge status={sub.status} />
                    </div>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      {sub.media_type} · {sub.creator} · {sub.genre}
                    </p>
                    <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{sub.description}</p>
                    {sub.rejection_reason && (
                      <div className="mt-2 p-2 rounded-lg flex gap-2" style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                        <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#ef4444" }} />
                        <p className="text-xs" style={{ color: "#dc2626" }}>{sub.rejection_reason}</p>
                      </div>
                    )}
                    <p className="text-xs mt-1.5" style={{ color: "var(--text-hint)" }}>by {sub.submitted_by_name} · {new Date(sub.created_date).toLocaleDateString()}</p>
                  </div>
                  {sub.image_url && <img src={sub.image_url} alt={sub.title} className="w-16 h-16 rounded-lg object-cover shrink-0" />}
                </div>
                {sub.status === "pending" && (
                  <div className="flex gap-2">
                    <button onClick={() => approveMut.mutate(sub.id)} className="flex-1 py-2 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-1" style={{ backgroundColor: "#22c55e" }}>
                      <Check className="w-4 h-4" /> Approve
                    </button>
                    <button onClick={() => { setSelectedItem(sub); setRejectionReason(""); }} className="flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
                      <X className="w-4 h-4" /> Reject
                    </button>
                    <button onClick={() => setEditingItem({ ...sub })} className="px-3 py-2 rounded-lg" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {sub.status !== "pending" && (
                  <button onClick={() => deleteMut.mutate(sub.id)} className="w-full py-2 rounded-lg text-sm flex items-center justify-center gap-1.5" style={{ backgroundColor: "rgba(239,68,68,0.08)", color: "#dc2626" }}>
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Did You Know */}
        {activeTab === "dyk" && (
          <div className="space-y-3">
            {/* filter */}
            <div className="flex gap-2 mb-2 overflow-x-auto scrollbar-hide">
              {["pending", "approved", "rejected", "all"].map(f => (
                <button key={f} onClick={() => setDykFilter(f)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap"
                  style={{ backgroundColor: dykFilter === f ? "var(--accent-primary)" : "var(--bg-card)", color: dykFilter === f ? "#fff" : "var(--text-secondary)", border: `1px solid ${dykFilter === f ? "var(--accent-primary)" : "var(--border-light)"}` }}>
                  {f}
                </button>
              ))}
            </div>
            {dykLoading && <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>}
            {!dykLoading && filteredDYK.length === 0 && (
              <div className="text-center py-12 rounded-2xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                <p style={{ color: "var(--text-hint)" }}>No submissions</p>
              </div>
            )}
            {!dykLoading && filteredDYK.map(post => (
              <motion.div key={post.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl"
                style={{ backgroundColor: "var(--bg-card)", border: `2px solid ${post.status === "approved" ? "#22c55e" : post.status === "rejected" ? "#ef4444" : "var(--border-light)"}` }}>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-sm flex-1" style={{ color: "var(--text-primary)" }}>{post.title || "No title"}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${post.status === "pending" ? "bg-yellow-100 text-yellow-800" : post.status === "approved" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{post.status?.toUpperCase()}</span>
                </div>
                <p className="text-xs leading-relaxed mb-2" style={{ color: "var(--text-secondary)" }}>{post.content}</p>
                {post.source_link && <a href={post.source_link} target="_blank" rel="noopener noreferrer" className="text-xs" style={{ color: "var(--accent-primary)" }}>{post.source_link}</a>}
                <p className="text-[10px] mt-1.5 mb-3" style={{ color: "var(--text-hint)" }}>by {post.submitter_name} · {new Date(post.created_date).toLocaleDateString()}</p>
                {post.status === "pending" && (
                  <div className="flex gap-2">
                    <button onClick={() => approveDYK.mutate(post)} className="flex-1 py-2 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-1" style={{ backgroundColor: "#22c55e" }}>
                      <Check className="w-4 h-4" /> Approve
                    </button>
                    <button onClick={() => rejectDYK.mutate({ id: post.id, note: "Rejected by admin" })} className="flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
                      <X className="w-4 h-4" /> Reject
                    </button>
                  </div>
                )}
                {post.status !== "pending" && (
                  <button onClick={() => deleteDYK.mutate(post.id)} className="w-full py-2 rounded-lg text-sm flex items-center justify-center gap-1.5" style={{ backgroundColor: "rgba(239,68,68,0.08)", color: "#dc2626" }}>
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Reviews */}
        {activeTab === "reviews" && (
          <div className="space-y-3">
            {revLoading && <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>}
            {!revLoading && filteredRevs.length === 0 && (
              <div className="text-center py-12 rounded-2xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                <p style={{ color: "var(--text-hint)" }}>No {statusFilter !== "all" ? statusFilter : ""} reviews</p>
              </div>
            )}
            {!revLoading && filteredRevs.map(rev => (
              <motion.div key={rev.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl"
                style={{ backgroundColor: "var(--bg-card)", border: `2px solid ${selectedIds.has(rev.id) ? "var(--accent-primary)" : rev.status === "approved" ? "#22c55e" : rev.status === "rejected" ? "#ef4444" : "var(--border-light)"}` }}>
                <div className="flex items-start gap-3 mb-3">
                  <button onClick={() => toggleSelect(rev.id)} className="mt-0.5 shrink-0">
                    {selectedIds.has(rev.id) ? <CheckSquare className="w-5 h-5" style={{ color: "var(--accent-primary)" }} /> : <Square className="w-5 h-5" style={{ color: "var(--text-hint)" }} />}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Media #{rev.media_id?.slice(0, 8)}</p>
                      <StatusBadge status={rev.status} />
                    </div>
                    <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{"⭐".repeat(rev.rating || 0)} {rev.rating}/5 · {rev.media_type}</p>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{rev.review_text}</p>
                    <p className="text-xs mt-1.5" style={{ color: "var(--text-hint)" }}>by {rev.reviewer_name} · {new Date(rev.created_date).toLocaleDateString()}</p>
                  </div>
                </div>
                {rev.status === "pending" && (
                  <div className="flex gap-2">
                    <button onClick={() => approveRevMut.mutate(rev.id)} className="flex-1 py-2 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-1" style={{ backgroundColor: "#22c55e" }}>
                      <Check className="w-4 h-4" /> Approve
                    </button>
                    <button onClick={() => rejectRevMut.mutate(rev.id)} className="flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
                      <X className="w-4 h-4" /> Reject
                    </button>
                  </div>
                )}
                {rev.status !== "pending" && (
                  <button onClick={() => base44.entities.UserMediaReview.delete(rev.id).then(() => qc.invalidateQueries({ queryKey: ["userReviews"] }))}
                    className="w-full py-2 rounded-lg text-sm flex items-center justify-center gap-1.5" style={{ backgroundColor: "rgba(239,68,68,0.08)", color: "#dc2626" }}>
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Reject single modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end" onClick={() => setSelectedItem(null)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              className="w-full rounded-t-3xl p-5" style={{ backgroundColor: "var(--bg-modal)" }}
              onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-3" style={{ color: "var(--text-primary)" }}>Reject: {selectedItem.title}</h2>
              <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                placeholder="Reason for rejection..." rows={3}
                className="w-full p-3 rounded-lg text-sm mb-3 outline-none resize-none"
                style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
              <div className="flex gap-2">
                <button onClick={() => setSelectedItem(null)} className="flex-1 py-2 rounded-lg font-semibold" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>Cancel</button>
                <button onClick={() => rejectMut.mutate({ id: selectedItem.id, reason: rejectionReason })}
                  disabled={rejectMut.isPending || !rejectionReason.trim()}
                  className="flex-1 py-2 rounded-lg font-semibold text-white disabled:opacity-40" style={{ backgroundColor: "#ef4444" }}>
                  {rejectMut.isPending ? "Rejecting..." : "Confirm"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk reject modal */}
      <AnimatePresence>
        {showBulkModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end" onClick={() => setShowBulkModal(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              className="w-full rounded-t-3xl p-5" style={{ backgroundColor: "var(--bg-modal)" }}
              onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>Bulk Reject ({selectedIds.size})</h2>
              <p className="text-xs mb-3" style={{ color: "var(--text-hint)" }}>This will reject all {selectedIds.size} selected items</p>
              {activeTab === "submissions" && (
                <textarea value={bulkRejectionReason} onChange={e => setBulkRejectionReason(e.target.value)}
                  placeholder="Reason for rejection..." rows={3}
                  className="w-full p-3 rounded-lg text-sm mb-3 outline-none resize-none"
                  style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
              )}
              <div className="flex gap-2">
                <button onClick={() => setShowBulkModal(false)} className="flex-1 py-2 rounded-lg font-semibold" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>Cancel</button>
                <button onClick={handleBulkReject} className="flex-1 py-2 rounded-lg font-semibold text-white" style={{ backgroundColor: "#ef4444" }}>Reject All</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit modal */}
      <AnimatePresence>
        {editingItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end" onClick={() => setEditingItem(null)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              className="w-full rounded-t-3xl p-5 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: "var(--bg-modal)" }}
              onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-4" style={{ color: "var(--text-primary)" }}>Edit Submission</h2>
              <div className="space-y-3">
                {["title", "creator", "genre"].map(field => (
                  <div key={field}>
                    <label className="text-xs font-semibold capitalize" style={{ color: "var(--text-secondary)" }}>{field}</label>
                    <input type="text" value={editingItem[field] || ""} onChange={e => setEditingItem({ ...editingItem, [field]: e.target.value })}
                      className="w-full p-2 rounded-lg text-sm mt-1 outline-none"
                      style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
                  </div>
                ))}
                <div>
                  <label className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Description</label>
                  <textarea value={editingItem.description || ""} onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                    rows={3} className="w-full p-2 rounded-lg text-sm mt-1 outline-none resize-none"
                    style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setEditingItem(null)} className="flex-1 py-2 rounded-lg font-semibold" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>Cancel</button>
                <button onClick={() => updateMut.mutate(editingItem)} disabled={updateMut.isPending}
                  className="flex-1 py-2 rounded-lg font-semibold text-white" style={{ backgroundColor: "var(--accent-primary)" }}>
                  {updateMut.isPending ? "Saving..." : "Save"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}