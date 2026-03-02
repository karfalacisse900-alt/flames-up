import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { X, ShieldAlert, CheckCircle, XCircle, AlertTriangle, Loader2, Bot, UserX, Clock, Eye } from "lucide-react";

const STATUS_CONFIG = {
  pending:   { color: "#d97706", bg: "#fef3c7", label: "Pending Review" },
  removed:   { color: "#dc2626", bg: "#fee2e2", label: "Removed" },
  dismissed: { color: "#6b7280", bg: "var(--bg-subtle)", label: "Dismissed" },
};

export default function GroupModerationPanel({ group, user, onClose }) {
  const qc = useQueryClient();
  const [activeSection, setActiveSection] = useState("reports");
  const [actionLoading, setActionLoading] = useState(null);
  const [banTarget, setBanTarget] = useState(null);

  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ["groupReports", group.id],
    queryFn: () => base44.entities.GroupPostReport.filter({ group_id: group.id }, "-created_date", 50),
    refetchInterval: 15000,
  });

  const { data: pendingPosts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["pendingGroupPosts", group.id],
    queryFn: () => base44.entities.CommunityPost.filter({ group_id: group.id, moderation_status: "pending" }, "-created_date", 30),
  });

  const { data: allMembers = [] } = useQuery({
    queryKey: ["groupMembers", group.id],
    queryFn: () => base44.entities.GroupMember.filter({ group_id: group.id }),
  });

  const handleApprovePost = async (post) => {
    setActionLoading(`approve-${post.id}`);
    await base44.entities.CommunityPost.update(post.id, { moderation_status: "approved", is_reported: false });
    qc.invalidateQueries({ queryKey: ["pendingGroupPosts", group.id] });
    qc.invalidateQueries({ queryKey: ["groupPosts", group.id] });
    setActionLoading(null);
  };

  const handleRejectPost = async (post) => {
    setActionLoading(`reject-${post.id}`);
    await base44.entities.CommunityPost.update(post.id, { moderation_status: "rejected" });
    // also dismiss related reports
    const related = reports.filter(r => r.post_id === post.id && r.status === "pending");
    await Promise.all(related.map(r => base44.entities.GroupPostReport.update(r.id, { status: "removed" })));
    qc.invalidateQueries({ queryKey: ["pendingGroupPosts", group.id] });
    qc.invalidateQueries({ queryKey: ["groupReports", group.id] });
    qc.invalidateQueries({ queryKey: ["groupPosts", group.id] });
    setActionLoading(null);
  };

  const handleDismissReport = async (report) => {
    setActionLoading(`dismiss-${report.id}`);
    await base44.entities.GroupPostReport.update(report.id, { status: "dismissed", moderator_email: user.email });
    qc.invalidateQueries({ queryKey: ["groupReports", group.id] });
    setActionLoading(null);
  };

  const handleBanUser = async (email, name) => {
    setActionLoading(`ban-${email}`);
    // Remove member from group
    const member = allMembers.find(m => m.user_email === email);
    if (member) await base44.entities.GroupMember.delete(member.id);
    // Delete all their posts in group
    const theirPosts = await base44.entities.CommunityPost.filter({ group_id: group.id, author_email: email });
    await Promise.all(theirPosts.map(p => base44.entities.CommunityPost.update(p.id, { moderation_status: "rejected" })));
    // Update group member count
    await base44.entities.Group.update(group.id, { member_count: Math.max(0, (group.member_count || 1) - 1) });
    qc.invalidateQueries({ queryKey: ["groupMembers", group.id] });
    qc.invalidateQueries({ queryKey: ["groupPosts", group.id] });
    setBanTarget(null);
    setActionLoading(null);
  };

  const runAIReview = async (post) => {
    setActionLoading(`ai-${post.id}`);
    await base44.functions.invoke("moderateGroupPost", {
      post_id: post.id, post_body: post.body, group_id: group.id, author_email: post.author_email
    });
    qc.invalidateQueries({ queryKey: ["pendingGroupPosts", group.id] });
    qc.invalidateQueries({ queryKey: ["groupReports", group.id] });
    setActionLoading(null);
  };

  const pendingReports = reports.filter(r => r.status === "pending");
  const resolvedReports = reports.filter(r => r.status !== "pending");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-lg mx-auto rounded-t-3xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-card)", maxHeight: "92vh", display: "flex", flexDirection: "column" }}
        onClick={e => e.stopPropagation()}>

        {/* Drag handle */}
        <div className="h-1.5 w-12 rounded-full mx-auto mt-3 mb-1" style={{ backgroundColor: "var(--border-medium)" }} />

        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between shrink-0 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #dc2626, #9f1239)" }}>
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Moderation Dashboard</h2>
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>{group.name}</p>
            </div>
          </div>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: "var(--text-hint)" }} /></button>
        </div>

        {/* Stats row */}
        <div className="flex border-b shrink-0" style={{ borderColor: "var(--border-subtle)" }}>
          {[
            { label: "Pending Reports", value: pendingReports.length, color: "#d97706", key: "reports" },
            { label: "AI Flagged Posts", value: pendingPosts.length, color: "#7c3aed", key: "posts" },
            { label: "Members", value: allMembers.length, color: "#0284c7", key: "members" },
          ].map(s => (
            <button key={s.key} onClick={() => setActiveSection(s.key)}
              className="flex-1 py-3 text-center transition-all"
              style={{ borderBottom: activeSection === s.key ? `2px solid ${s.color}` : "2px solid transparent" }}>
              <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] font-medium" style={{ color: "var(--text-hint)" }}>{s.label}</p>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* REPORTS SECTION */}
          {activeSection === "reports" && (
            <div className="p-4 space-y-3">
              {reportsLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--accent-primary)" }} /></div>
              ) : pendingReports.length === 0 ? (
                <div className="text-center py-10">
                  <CheckCircle className="w-10 h-10 mx-auto mb-2" style={{ color: "#16a34a" }} />
                  <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>No pending reports</p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>Your group is clean ✨</p>
                </div>
              ) : (
                pendingReports.map(report => (
                  <ReportCard key={report.id} report={report} actionLoading={actionLoading}
                    onDismiss={() => handleDismissReport(report)}
                    onBan={() => setBanTarget({ email: report.reporter_email !== "ai_moderator" ? null : null, post_id: report.post_id })}
                    onViewPost={() => {}} />
                ))
              )}

              {resolvedReports.length > 0 && (
                <>
                  <p className="text-xs font-bold uppercase tracking-wider pt-2" style={{ color: "var(--text-hint)" }}>Resolved</p>
                  {resolvedReports.map(r => (
                    <div key={r.id} className="px-3 py-2.5 rounded-xl opacity-60"
                      style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-subtle)" }}>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold truncate" style={{ color: "var(--text-secondary)" }}>{r.reason}</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full ml-2 shrink-0"
                          style={{ backgroundColor: STATUS_CONFIG[r.status]?.bg || "var(--bg-subtle)", color: STATUS_CONFIG[r.status]?.color || "var(--text-hint)" }}>
                          {STATUS_CONFIG[r.status]?.label || r.status}
                        </span>
                      </div>
                      {r.moderator_note && <p className="text-[10px] mt-1 italic" style={{ color: "var(--text-hint)" }}>{r.moderator_note}</p>}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* AI FLAGGED POSTS SECTION */}
          {activeSection === "posts" && (
            <div className="p-4 space-y-3">
              {postsLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--accent-primary)" }} /></div>
              ) : pendingPosts.length === 0 ? (
                <div className="text-center py-10">
                  <Bot className="w-10 h-10 mx-auto mb-2" style={{ color: "#7c3aed" }} />
                  <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>No flagged posts</p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>AI hasn't flagged anything</p>
                </div>
              ) : (
                pendingPosts.map(post => (
                  <FlaggedPostCard key={post.id} post={post} actionLoading={actionLoading}
                    onApprove={() => handleApprovePost(post)}
                    onReject={() => handleRejectPost(post)}
                    onAIReview={() => runAIReview(post)}
                    onBan={() => setBanTarget({ email: post.author_email, name: post.author_name })} />
                ))
              )}
            </div>
          )}

          {/* MEMBERS SECTION */}
          {activeSection === "members" && (
            <div className="p-4 space-y-2">
              {allMembers.map(m => (
                <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                  style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-subtle)" }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)" }}>
                    {(m.user_name || "U")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{m.user_name || m.user_email}</p>
                    <p className="text-[10px] capitalize" style={{ color: "var(--text-hint)" }}>{m.role}</p>
                  </div>
                  {m.user_email !== user?.email && m.role !== "admin" && (
                    <button onClick={() => setBanTarget({ email: m.user_email, name: m.user_name })}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold"
                      style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}>
                      <UserX className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Ban confirmation */}
      <AnimatePresence>
        {banTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 flex items-center justify-center px-6"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
            onClick={() => setBanTarget(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="w-full max-w-sm rounded-3xl p-6"
              style={{ backgroundColor: "var(--bg-card)" }}
              onClick={e => e.stopPropagation()}>
              <div className="text-4xl text-center mb-3">🚫</div>
              <h3 className="text-base font-bold text-center mb-1" style={{ color: "var(--text-primary)" }}>Remove & Ban?</h3>
              <p className="text-sm text-center mb-5" style={{ color: "var(--text-hint)" }}>
                This will remove <strong>{banTarget.name || banTarget.email}</strong> from the group and hide all their posts.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setBanTarget(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>Cancel</button>
                <button onClick={() => handleBanUser(banTarget.email, banTarget.name)}
                  disabled={!!actionLoading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ backgroundColor: "#dc2626" }}>
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserX className="w-4 h-4" /> Ban User</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ReportCard({ report, actionLoading, onDismiss }) {
  const isAI = report.reporter_email === "ai_moderator";
  return (
    <div className="rounded-2xl p-3.5 border" style={{ backgroundColor: "var(--bg-subtle)", borderColor: "#fcd34d" }}>
      <div className="flex items-start gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: isAI ? "#ede9fe" : "#fee2e2" }}>
          {isAI ? <Bot className="w-3.5 h-3.5" style={{ color: "#7c3aed" }} /> : <AlertTriangle className="w-3.5 h-3.5" style={{ color: "#dc2626" }} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
              {isAI ? "AI Flagged" : `Reported by ${report.reporter_name || report.reporter_email}`}
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
              style={{ backgroundColor: "#fef3c7", color: "#d97706" }}>
              <Clock className="w-2.5 h-2.5 inline mr-0.5" />Pending
            </span>
          </div>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{report.reason}</p>
          {report.moderator_note && (
            <p className="text-[10px] mt-1 italic" style={{ color: "#7c3aed" }}>{report.moderator_note}</p>
          )}
        </div>
      </div>
      <div className="flex gap-2 mt-2">
        <button onClick={onDismiss} disabled={!!actionLoading}
          className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-50"
          style={{ backgroundColor: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}>
          {actionLoading === `dismiss-${report.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <><CheckCircle className="w-3 h-3" /> Dismiss</>}
        </button>
      </div>
    </div>
  );
}

function FlaggedPostCard({ post, actionLoading, onApprove, onReject, onAIReview, onBan }) {
  return (
    <div className="rounded-2xl p-3.5 border" style={{ backgroundColor: "var(--bg-subtle)", borderColor: "#c4b5fd" }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "#ede9fe" }}>
          <Bot className="w-3.5 h-3.5" style={{ color: "#7c3aed" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{post.author_name || post.author_email}</p>
          <p className="text-[10px]" style={{ color: "#7c3aed" }}>AI flagged — pending review</p>
        </div>
        <button onClick={onBan} className="px-2 py-1 rounded-lg" style={{ backgroundColor: "#fee2e2" }}>
          <UserX className="w-3 h-3" style={{ color: "#dc2626" }} />
        </button>
      </div>
      <p className="text-sm px-2 py-2 rounded-xl mb-3 line-clamp-3" style={{ color: "var(--text-primary)", backgroundColor: "var(--bg-card)" }}>
        {post.body}
      </p>
      <div className="flex gap-2">
        <button onClick={onApprove} disabled={!!actionLoading}
          className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-50"
          style={{ backgroundColor: "#dcfce7", color: "#16a34a" }}>
          {actionLoading === `approve-${post.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <><CheckCircle className="w-3 h-3" /> Approve</>}
        </button>
        <button onClick={onReject} disabled={!!actionLoading}
          className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-50"
          style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}>
          {actionLoading === `reject-${post.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <><XCircle className="w-3 h-3" /> Reject</>}
        </button>
        <button onClick={onAIReview} disabled={!!actionLoading}
          className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-50"
          style={{ backgroundColor: "#ede9fe", color: "#7c3aed" }}>
          {actionLoading === `ai-${post.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bot className="w-3 h-3" />}
        </button>
      </div>
    </div>
  );
}