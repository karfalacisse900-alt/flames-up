import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flag, UserX, LogOut, ShieldAlert, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

export default function SafetyToolsMenu({ targetEmail, targetName, groupId, groupName, user, onClose, onLeft }) {
  const [view, setView] = useState("menu"); // "menu" | "report_user" | "report_group" | "block" | "leave" | "done"
  const [reportReason, setReportReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [doneMsg, setDoneMsg] = useState("");
  const qc = useQueryClient();

  const REPORT_REASONS = [
    "Inappropriate behavior",
    "Harassment or abuse",
    "Spam or scam",
    "Fake identity",
    "Safety concern",
    "Other",
  ];

  const handleReportUser = async () => {
    if (!reportReason) return;
    setSaving(true);
    await base44.entities.Report.create({
      content_type: "user",
      content_id: targetEmail,
      reason: reportReason,
      reporter_email: user.email,
      status: "pending",
    });
    // Also send a moderation notification
    await base44.entities.Notification.create({
      recipient_email: "admin",
      actor_name: user.full_name || user.email,
      actor_email: user.email,
      type: "safety_report",
      post_text: `User reported: ${targetEmail} — ${reportReason}`,
      ref_id: targetEmail,
      is_read: false,
    }).catch(() => {});
    setSaving(false);
    setDoneMsg("Report submitted. Our safety team will review it.");
    setView("done");
  };

  const handleBlockUser = async () => {
    setSaving(true);
    await base44.entities.BlockedUser.create({
      blocker_email: user.email,
      blocked_email: targetEmail,
      blocked_name: targetName,
    });
    // Update user's blocked list
    const me = await base44.entities.User.filter({ email: user.email });
    if (me.length > 0) {
      const current = me[0].blocked_users || [];
      if (!current.includes(targetEmail)) {
        await base44.entities.User.update(me[0].id, { blocked_users: [...current, targetEmail] });
      }
    }
    setSaving(false);
    setDoneMsg(`${targetName || "User"} has been blocked. They can no longer interact with you.`);
    setView("done");
  };

  const handleLeaveGroup = async () => {
    setSaving(true);
    const memberships = await base44.entities.GroupMember.filter({ group_id: groupId, user_email: user.email });
    if (memberships.length > 0) {
      await base44.entities.GroupMember.delete(memberships[0].id);
    }
    qc.invalidateQueries({ queryKey: ["myMemberships", user.email] });
    qc.invalidateQueries({ queryKey: ["groups"] });
    setSaving(false);
    onLeft?.();
    onClose();
  };

  const handleReportGroup = async () => {
    if (!reportReason) return;
    setSaving(true);
    await base44.entities.Report.create({
      content_type: "post",
      content_id: groupId,
      reason: `Group report: ${reportReason}`,
      reporter_email: user.email,
      status: "pending",
    });
    setSaving(false);
    setDoneMsg("Group reported. Our safety team will review it.");
    setView("done");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-lg rounded-t-3xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-card)", maxHeight: "80vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>
        <div className="h-1.5 w-12 rounded-full mx-auto mt-3" style={{ backgroundColor: "var(--border-medium)" }} />
        <div className="px-5 py-4 pb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" style={{ color: "#E05C7A" }} />
              <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
                Safety Tools
              </h2>
            </div>
            <button onClick={onClose}><X className="w-5 h-5" style={{ color: "var(--text-hint)" }} /></button>
          </div>

          <AnimatePresence mode="wait">
            {view === "menu" && (
              <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                {targetEmail && targetEmail !== user?.email && (
                  <>
                    <button onClick={() => setView("report_user")}
                      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold text-left transition-all active:scale-95"
                      style={{ backgroundColor: "#FFF5F5", border: "1px solid #FECDD3", color: "#E05C7A" }}>
                      <Flag className="w-4 h-4 shrink-0" />
                      Report {targetName || "this user"}
                      <span className="ml-auto text-[10px] font-normal" style={{ color: "var(--text-hint)" }}>Safety concern</span>
                    </button>
                    <button onClick={() => setView("block")}
                      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold text-left transition-all active:scale-95"
                      style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}>
                      <UserX className="w-4 h-4 shrink-0" />
                      Block {targetName || "this user"}
                      <span className="ml-auto text-[10px] font-normal" style={{ color: "var(--text-hint)" }}>They can't contact you</span>
                    </button>
                  </>
                )}
                {groupId && (
                  <>
                    <button onClick={() => setView("report_group")}
                      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold text-left transition-all active:scale-95"
                      style={{ backgroundColor: "#FFF5F5", border: "1px solid #FECDD3", color: "#E05C7A" }}>
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      Report this group
                    </button>
                    <button onClick={() => setView("leave")}
                      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold text-left transition-all active:scale-95"
                      style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-secondary)" }}>
                      <LogOut className="w-4 h-4 shrink-0" />
                      Leave group
                    </button>
                  </>
                )}
              </motion.div>
            )}

            {(view === "report_user" || view === "report_group") && (
              <motion.div key="report" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
                <button onClick={() => setView("menu")} className="text-xs mb-1" style={{ color: "var(--text-hint)" }}>← Back</button>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {view === "report_user" ? `Why are you reporting ${targetName || "this user"}?` : "Why are you reporting this group?"}
                </p>
                <div className="space-y-2">
                  {REPORT_REASONS.map(r => (
                    <button key={r} onClick={() => setReportReason(r)}
                      className="w-full px-4 py-3 rounded-xl text-sm text-left font-medium transition-all"
                      style={{
                        backgroundColor: reportReason === r ? "var(--accent-primary-light)" : "var(--bg-subtle)",
                        border: `1px solid ${reportReason === r ? "var(--accent-primary)" : "var(--border-light)"}`,
                        color: reportReason === r ? "var(--accent-primary)" : "var(--text-secondary)",
                      }}>
                      {r}
                    </button>
                  ))}
                </div>
                <button onClick={view === "report_user" ? handleReportUser : handleReportGroup}
                  disabled={!reportReason || saving}
                  className="w-full py-3.5 rounded-2xl text-sm font-bold disabled:opacity-50 transition-all active:scale-95"
                  style={{ backgroundColor: "#E05C7A", color: "#fff" }}>
                  {saving ? "Submitting…" : "Submit Report"}
                </button>
              </motion.div>
            )}

            {view === "block" && (
              <motion.div key="block" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <button onClick={() => setView("menu")} className="text-xs mb-1" style={{ color: "var(--text-hint)" }}>← Back</button>
                <div className="px-4 py-4 rounded-2xl text-center" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
                  <UserX className="w-8 h-8 mx-auto mb-2" style={{ color: "#E05C7A" }} />
                  <p className="font-bold text-sm mb-1" style={{ color: "var(--text-primary)" }}>Block {targetName || "this user"}?</p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    They won't be able to message or interact with you. You can unblock from your settings.
                  </p>
                </div>
                <button onClick={handleBlockUser} disabled={saving}
                  className="w-full py-3.5 rounded-2xl text-sm font-bold disabled:opacity-50"
                  style={{ backgroundColor: "#E05C7A", color: "#fff" }}>
                  {saving ? "Blocking…" : `Block ${targetName || "User"}`}
                </button>
              </motion.div>
            )}

            {view === "leave" && (
              <motion.div key="leave" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <button onClick={() => setView("menu")} className="text-xs mb-1" style={{ color: "var(--text-hint)" }}>← Back</button>
                <div className="px-4 py-4 rounded-2xl text-center" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
                  <LogOut className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-secondary)" }} />
                  <p className="font-bold text-sm mb-1" style={{ color: "var(--text-primary)" }}>Leave {groupName || "this group"}?</p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>You can rejoin at any time.</p>
                </div>
                <button onClick={handleLeaveGroup} disabled={saving}
                  className="w-full py-3.5 rounded-2xl text-sm font-bold disabled:opacity-50"
                  style={{ backgroundColor: "var(--text-secondary)", color: "#fff" }}>
                  {saving ? "Leaving…" : "Leave Group"}
                </button>
              </motion.div>
            )}

            {view === "done" && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6 space-y-3">
                <div className="text-5xl">✅</div>
                <h3 className="font-bold text-base" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Done</h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{doneMsg}</p>
                <button onClick={onClose}
                  className="px-8 py-3 rounded-2xl text-sm font-bold text-white mt-2"
                  style={{ backgroundColor: "var(--accent-primary)" }}>
                  Close
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}