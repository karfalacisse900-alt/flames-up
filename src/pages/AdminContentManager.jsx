import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Trash2, Loader2, AlertCircle, Bell, BarChart2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

function StatusBadge({ status }) {
  const cls = status === "pending" ? "bg-yellow-100 text-yellow-800"
    : status === "approved" ? "bg-green-100 text-green-800"
    : "bg-red-100 text-red-800";
  return <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cls}`}>{status.toUpperCase()}</span>;
}

export default function AdminContentManager() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dyk");
  const [dykFilter, setDykFilter] = useState("pending");
  const [notification, setNotification] = useState(null);
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
    }).catch(() => {});
  }, []);

  // Real-time notification on new DYK submissions
  useEffect(() => {
    const unsub = base44.entities.DidYouKnow.subscribe((event) => {
      if (event.type === "create") {
        setNotification("New Did You Know submission!");
        qc.invalidateQueries({ queryKey: ["adminDYK"] });
        setTimeout(() => setNotification(null), 5000);
      }
    });
    return () => unsub();
  }, []);

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

      </div>
    </div>
  );
}