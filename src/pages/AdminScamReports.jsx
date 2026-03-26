import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X, Eye, Edit2, Loader2, ShieldAlert, Flag, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminScamReports() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editText, setEditText] = useState("");
  const [editing, setEditing] = useState(false);
  const [filter, setFilter] = useState("pending");
  const qc = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setAuthChecked(true); }).catch(() => setAuthChecked(true));
  }, []);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["scam_reports", filter],
    queryFn: () => base44.entities.Report.filter({ content_id: "scam_report", ...(filter !== "all" ? { status: filter } : {}) }, "-created_date", 100),
    enabled: authChecked && user?.role === "admin",
  });

  if (!authChecked) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--accent-primary)" }} /></div>;
  if (!user || user.role !== "admin") return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center">
      <ShieldAlert className="w-12 h-12 mb-4" style={{ color: "#DC2626" }} />
      <h2 className="text-xl font-black mb-2" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Admin Only</h2>
      <p style={{ color: "var(--text-hint)" }}>You don't have permission to view this page.</p>
    </div>
  );

  const updateStatus = async (report, status) => {
    await base44.entities.Report.update(report.id, { status });
    qc.invalidateQueries({ queryKey: ["scam_reports"] });
    if (selected?.id === report.id) setSelected(null);
  };

  const saveEdit = async () => {
    if (!selected || !editText.trim()) return;
    await base44.entities.Report.update(selected.id, { reason: editText.trim() });
    qc.invalidateQueries({ queryKey: ["scam_reports"] });
    setEditing(false);
    setSelected(prev => ({ ...prev, reason: editText.trim() }));
  };

  const parseReason = (reason = "") => {
    const catMatch = reason.match(/^\[(\w+)\]/);
    const rest = reason.replace(/^\[\w+\]\s*/, "");
    const [titlePart, descAndLoc] = rest.split(":");
    const [desc, locPart] = (descAndLoc || "").split("| Location:");
    return {
      cat: catMatch?.[1] || "unknown",
      title: titlePart?.trim() || "Untitled",
      description: desc?.trim() || reason,
      location: locPart?.trim() || "",
    };
  };

  const statusColor = { pending: "#F59E0B", reviewed: "#2563EB", dismissed: "#9CA3AF" };
  const statusBg = { pending: "#FFFBEB", reviewed: "#EFF6FF", dismissed: "#F9FAFB" };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-4" style={{ backgroundColor: "var(--bg-nav)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--border-light)" }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#FEF2F2" }}>
              <Flag className="w-5 h-5" style={{ color: "#DC2626" }} />
            </div>
            <div>
              <h1 className="text-base font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Scam Report Moderation</h1>
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>{reports.length} reports · {filter}</p>
            </div>
          </div>
          <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: "var(--bg-subtle)" }}>
            {["pending", "reviewed", "dismissed", "all"].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all"
                style={{ backgroundColor: filter === s ? "var(--bg-card)" : "transparent", color: filter === s ? "var(--text-primary)" : "var(--text-hint)", boxShadow: filter === s ? "var(--elevation-1)" : "none" }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-5">
        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--accent-primary)" }} /></div>
        ) : reports.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-5xl mb-3">✅</div>
            <p className="font-bold" style={{ color: "var(--text-primary)" }}>No {filter} reports</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map(report => {
              const parsed = parseReason(report.reason);
              const isOpen = selected?.id === report.id;
              return (
                <motion.div key={report.id} layout
                  className="rounded-2xl overflow-hidden"
                  style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "var(--elevation-1)" }}>
                  {/* Row */}
                  <button className="w-full text-left flex items-center gap-3 px-4 py-3.5" onClick={() => {
                    setSelected(isOpen ? null : report);
                    setEditing(false);
                    setEditText(report.reason || "");
                  }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: statusBg[report.status] || "#F9FAFB" }}>
                      <Flag className="w-4 h-4" style={{ color: statusColor[report.status] || "#9CA3AF" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>{parsed.title}</p>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 uppercase"
                          style={{ backgroundColor: statusBg[report.status], color: statusColor[report.status] }}>
                          {report.status}
                        </span>
                      </div>
                      <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{parsed.description}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--text-hint)" }}>
                        By {report.reporter_email} · {parsed.cat} · {parsed.location || "No location"}
                      </p>
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 shrink-0" style={{ color: "var(--text-hint)" }} /> : <ChevronDown className="w-4 h-4 shrink-0" style={{ color: "var(--text-hint)" }} />}
                  </button>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                        <div className="px-4 pb-4 space-y-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                          <div className="pt-3">
                            {editing ? (
                              <div className="space-y-2">
                                <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={4}
                                  className="w-full px-3 py-2.5 rounded-xl text-sm resize-none"
                                  style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
                                <div className="flex gap-2">
                                  <button onClick={saveEdit} className="flex-1 py-2 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: "var(--accent-primary)" }}>Save</button>
                                  <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-xl text-xs font-bold" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <div className="rounded-xl p-3" style={{ backgroundColor: "var(--bg-subtle)" }}>
                                <p className="text-xs font-bold mb-1" style={{ color: "var(--text-hint)" }}>Full Report</p>
                                <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{parsed.description}</p>
                                {parsed.location && <p className="text-xs mt-1.5" style={{ color: "var(--text-hint)" }}>📍 {parsed.location}</p>}
                                <p className="text-xs mt-1.5" style={{ color: "var(--text-hint)" }}>
                                  Category: <span className="font-semibold capitalize">{parsed.cat}</span> · Submitted: {new Date(report.created_date).toLocaleDateString()}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Action buttons */}
                          {!editing && (
                            <div className="flex gap-2 flex-wrap">
                              <button onClick={() => { setEditing(true); setEditText(report.reason || ""); }}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
                                style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}>
                                <Edit2 className="w-3.5 h-3.5" /> Edit
                              </button>
                              {report.status !== "reviewed" && (
                                <button onClick={() => updateStatus(report, "reviewed")}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
                                  style={{ backgroundColor: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE" }}>
                                  <Eye className="w-3.5 h-3.5" /> Mark Reviewed
                                </button>
                              )}
                              {report.status !== "pending" && (
                                <button onClick={() => updateStatus(report, "pending")}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
                                  style={{ backgroundColor: "#FFFBEB", color: "#D97706", border: "1px solid #FDE68A" }}>
                                  ↩ Restore to Pending
                                </button>
                              )}
                              <button onClick={() => updateStatus(report, "dismissed")}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
                                style={{ backgroundColor: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
                                <X className="w-3.5 h-3.5" /> Dismiss
                              </button>
                            </div>
                          )}

                          {/* Publish to scam feed */}
                          {!editing && report.status === "reviewed" && (
                            <div className="rounded-xl p-3 flex items-center gap-3"
                              style={{ backgroundColor: "#F0FDF4", border: "1px solid #86EFAC" }}>
                              <Check className="w-4 h-4 shrink-0" style={{ color: "#16A34A" }} />
                              <p className="text-xs font-semibold" style={{ color: "#166534" }}>
                                This report is approved. It can be included in the Scam Awareness feed.
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}