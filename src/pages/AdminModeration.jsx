import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, MessageSquare, Flag, AlertTriangle, Zap, User, Palette, Radio, Settings2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import ModerationRulesPanel from "../components/moderation/ModerationRulesPanel";

const flagColors = {
  nsfw: { bg: "#FEE2E2", text: "#991B1B", label: "NSFW" },
  hate_speech: { bg: "#FED7AA", text: "#92400E", label: "Hate Speech" },
  spam: { bg: "#DBEAFE", text: "#1E40AF", label: "Spam" },
  violence: { bg: "#FCE7F3", text: "#9D174D", label: "Violence" },
  misinformation: { bg: "#FEF9C3", text: "#92400E", label: "Misinfo" },
};

const contentTypeIcon = {
  post: <MessageSquare className="w-4 h-4" />,
  reply: <MessageSquare className="w-4 h-4" />,
  art: <Palette className="w-4 h-4" />,
  live_message: <Radio className="w-4 h-4" />,
  user: <User className="w-4 h-4" />,
};

const statusColors = {
  pending:  { bg: "#FEF9C3", text: "#92400E", label: "Pending" },
  reviewed: { bg: "#D1FAE5", text: "#065F46", label: "Reviewed" },
  dismissed: { bg: "#F3F4F6", text: "#6B7280", label: "Dismissed" },
  flagged:  { bg: "#FED7AA", text: "#92400E", label: "AI Flagged" },
  approved: { bg: "#D1FAE5", text: "#065F46", label: "Approved" },
  rejected: { bg: "#FEE2E2", text: "#991B1B", label: "Rejected" },
};

function ReportCard({ report, source, onClick }) {
  const st = statusColors[report.status] || statusColors.pending;
  return (
    <div
      onClick={() => onClick(report, source)}
      className="p-3 rounded-2xl cursor-pointer active:scale-[0.98] transition-transform"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: "var(--bg-app)" }}>
          {contentTypeIcon[report.content_type] || <Flag className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold capitalize" style={{ color: "var(--text-primary)" }}>
              {report.content_type?.replace(/_/g, " ")}
            </p>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: st.bg, color: st.text }}>
              {st.label}
            </span>
            {source === "ai" && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#EEF3F0", color: "#3C6E5A" }}>
                <Zap className="w-2.5 h-2.5 inline mr-0.5" />AI
              </span>
            )}
          </div>
          {source === "user" ? (
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {report.reason}
            </p>
          ) : (
            <div className="flex gap-1 flex-wrap">
              {(report.flags || []).map(f => {
                const fc = flagColors[f] || { bg: "#F3F4F6", text: "#6B7280", label: f };
                return (
                  <span key={f} className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: fc.bg, color: fc.text }}>
                    {fc.label}
                  </span>
                );
              })}
              {report.ai_confidence != null && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "var(--bg-app)", color: "var(--text-hint)" }}>
                  {Math.round(report.ai_confidence * 100)}% conf.
                </span>
              )}
            </div>
          )}
          <p className="text-[10px] mt-1" style={{ color: "var(--text-hint)" }}>
            {source === "user" ? `Reported by ${report.reporter_email}` : `Author: ${report.author_name || report.author_email}`}
            {" · "}
            {new Date(report.created_date).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminModeration() {
  const [user, setUser] = useState(null);
  const [selected, setSelected] = useState(null); // { report, source }
  const [adminNotes, setAdminNotes] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const qc = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // User-submitted reports (Report entity)
  const { data: userPending = [] } = useQuery({
    queryKey: ["reports", "pending"],
    queryFn: () => base44.entities.Report.filter({ status: "pending" }, "-created_date", 100),
    enabled: user?.role === "admin",
  });
  const { data: userReviewed = [] } = useQuery({
    queryKey: ["reports", "reviewed"],
    queryFn: () => base44.entities.Report.filter({ status: "reviewed" }, "-created_date", 100),
    enabled: user?.role === "admin",
  });
  const { data: userDismissed = [] } = useQuery({
    queryKey: ["reports", "dismissed"],
    queryFn: () => base44.entities.Report.filter({ status: "dismissed" }, "-created_date", 100),
    enabled: user?.role === "admin",
  });

  // AI-flagged (ModerationReport entity)
  const { data: aiFlagged = [] } = useQuery({
    queryKey: ["moderation-flagged"],
    queryFn: () => base44.entities.ModerationReport.filter({ status: "flagged" }, "-created_date", 100),
    enabled: user?.role === "admin",
  });
  const { data: aiResolved = [] } = useQuery({
    queryKey: ["moderation-resolved"],
    queryFn: () => base44.entities.ModerationReport.list("-created_date", 100),
    enabled: user?.role === "admin",
    select: data => data.filter(r => r.status !== "flagged"),
  });

  if (!user) return null;
  if (user.role !== "admin") {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "calc(100dvh - 64px)" }}>
        <p className="text-sm" style={{ color: "var(--text-hint)" }}>Admin access only</p>
      </div>
    );
  }

  const handleOpen = (report, source) => {
    setSelected({ report, source });
    setAdminNotes(report.admin_notes || "");
    setAiAnalysis("");
  };

  const handleAiAnalyze = async () => {
    if (!selected) return;
    setAnalyzing(true);
    const { report } = selected;
    const prompt = `You are a content moderation expert. Analyze this reported content and give a brief 2-3 sentence decision recommendation.

Content type: ${report.content_type}
Reason reported: ${report.reason || (report.flags || []).join(", ")}
AI flags: ${(report.flags || []).join(", ") || "none"}
AI confidence: ${report.ai_confidence ? Math.round(report.ai_confidence * 100) + "%" : "N/A"}

Recommend: Should this be removed (Reject) or kept (Approve)? Be concise.`;

    const result = await base44.integrations.Core.InvokeLLM({ prompt });
    setAiAnalysis(result);
    setAnalyzing(false);
  };

  const resolveReport = async (action) => {
    if (!selected) return;
    const { report, source } = selected;
    const data = {
      status: action === "approve" ? (source === "user" ? "reviewed" : "approved") : (source === "user" ? "dismissed" : "rejected"),
      admin_notes: adminNotes,
      resolved_by: user.email,
      resolved_at: new Date().toISOString(),
    };
    if (source === "user") {
      await base44.entities.Report.update(report.id, data);
      qc.invalidateQueries({ queryKey: ["reports"] });
    } else {
      await base44.entities.ModerationReport.update(report.id, data);
      if (action === "reject" && report.content_type === "art") {
        await base44.entities.ArtFightEntry.update(report.content_id, { status: "rejected" }).catch(() => {});
      }
      if (action === "reject" && report.content_type === "post") {
        await base44.entities.Post.delete(report.content_id).catch(() => {});
        await base44.entities.CommunityPost.delete(report.content_id).catch(() => {});
      }
      if (action === "reject" && report.content_type === "reply") {
        await base44.entities.CommunityComment.delete(report.content_id).catch(() => {});
      }
      qc.invalidateQueries({ queryKey: ["moderation-flagged"] });
      qc.invalidateQueries({ queryKey: ["moderation-resolved"] });
    }
    setSelected(null);
    setAdminNotes("");
    setAiAnalysis("");
  };

  const totalPending = userPending.length + aiFlagged.length;

  return (
    <div className="overflow-y-auto overscroll-contain" style={{ backgroundColor: "var(--bg-app)", minHeight: "calc(100dvh - 64px)" }}>
      {/* Header */}
      <div className="px-4 pt-5 pb-3 sticky top-0 z-10" style={{ backgroundColor: "var(--bg-nav)", borderBottom: "1px solid var(--border-light)" }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Moderation</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>Review flagged & reported content</p>
          </div>
          {totalPending > 0 && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: "#E05C5C" }}>
              {totalPending} pending
            </span>
          )}
        </div>
      </div>

      <Tabs defaultValue="user" className="px-4 mt-4">
        <TabsList className="rounded-xl w-full overflow-x-auto" style={{ backgroundColor: "var(--bg-card)" }}>
          <TabsTrigger value="user" className="flex-1 rounded-lg text-xs">
            <Flag className="w-3 h-3 mr-1" /> Reports ({userPending.length})
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex-1 rounded-lg text-xs">
            <Zap className="w-3 h-3 mr-1" /> AI ({aiFlagged.length})
          </TabsTrigger>
          <TabsTrigger value="resolved" className="flex-1 rounded-lg text-xs">
            <CheckCircle className="w-3 h-3 mr-1" /> Resolved
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex-1 rounded-lg text-xs">
            <Settings2 className="w-3 h-3 mr-1" /> Rules
          </TabsTrigger>
        </TabsList>

        {/* User reports */}
        <TabsContent value="user" className="mt-4 space-y-2 pb-24">
          {userPending.length === 0 ? (
            <p className="text-center text-sm py-10" style={{ color: "var(--text-hint)" }}>No pending user reports ✓</p>
          ) : userPending.map(r => <ReportCard key={r.id} report={r} source="user" onClick={handleOpen} />)}
        </TabsContent>

        {/* AI flagged */}
        <TabsContent value="ai" className="mt-4 space-y-2 pb-24">
          {aiFlagged.length === 0 ? (
            <p className="text-center text-sm py-10" style={{ color: "var(--text-hint)" }}>No AI-flagged content ✓</p>
          ) : aiFlagged.map(r => <ReportCard key={r.id} report={r} source="ai" onClick={handleOpen} />)}
        </TabsContent>

        {/* Resolved */}
        <TabsContent value="resolved" className="mt-4 space-y-2 pb-24">
          <p className="text-xs font-semibold px-1 mb-2" style={{ color: "var(--text-hint)" }}>USER REPORTS</p>
          {[...userReviewed, ...userDismissed].length === 0 ? (
            <p className="text-center text-sm py-4" style={{ color: "var(--text-hint)" }}>None yet</p>
          ) : [...userReviewed, ...userDismissed].map(r => (
            <ReportCard key={r.id} report={r} source="user" onClick={handleOpen} />
          ))}
          <p className="text-xs font-semibold px-1 mt-4 mb-2" style={{ color: "var(--text-hint)" }}>AI MODERATION</p>
          {aiResolved.length === 0 ? (
            <p className="text-center text-sm py-4" style={{ color: "var(--text-hint)" }}>None yet</p>
          ) : aiResolved.map(r => (
            <ReportCard key={r.id} report={r} source="ai" onClick={handleOpen} />
          ))}
        </TabsContent>

        {/* Rules */}
        <TabsContent value="rules" className="mt-4">
          <ModerationRulesPanel />
        </TabsContent>
      </Tabs>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={() => { setSelected(null); setAdminNotes(""); setAiAnalysis(""); }}>
        <DialogContent className="max-w-sm rounded-2xl" style={{ backgroundColor: "var(--bg-card)" }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Review {selected?.report.content_type?.replace(/_/g, " ")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Details */}
            <div className="rounded-xl p-3 space-y-2" style={{ backgroundColor: "var(--bg-app)", border: "1px solid var(--border-light)" }}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                  {selected?.source === "user" ? "Reason:" : "AI Flags:"}
                </span>
                {selected?.source === "user" ? (
                  <span className="text-xs" style={{ color: "var(--text-primary)" }}>{selected.report.reason}</span>
                ) : (
                  (selected?.report.flags || []).map(f => {
                    const fc = flagColors[f] || { bg: "#F3F4F6", text: "#6B7280", label: f };
                    return (
                      <span key={f} className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: fc.bg, color: fc.text }}>{fc.label}</span>
                    );
                  })
                )}
              </div>
              {selected?.source === "user" && (
                <p className="text-xs" style={{ color: "var(--text-hint)" }}>
                  Reporter: {selected.report.reporter_email}
                </p>
              )}
              {selected?.source === "ai" && selected?.report.ai_confidence != null && (
                <p className="text-xs" style={{ color: "var(--text-hint)" }}>
                  Confidence: {Math.round(selected.report.ai_confidence * 100)}% · Author: {selected.report.author_name}
                </p>
              )}
            </div>

            {/* AI Recommendation */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold uppercase" style={{ color: "var(--text-hint)" }}>AI Recommendation</p>
                <button
                  onClick={handleAiAnalyze}
                  disabled={analyzing}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}
                >
                  <Zap className="w-3 h-3" /> {analyzing ? "Analyzing…" : "Analyze"}
                </button>
              </div>
              {aiAnalysis ? (
                <p className="text-xs leading-relaxed p-3 rounded-xl" style={{ backgroundColor: "var(--bg-app)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}>
                  {aiAnalysis}
                </p>
              ) : (
                <p className="text-xs italic" style={{ color: "var(--text-hint)" }}>Click Analyze for AI-assisted recommendation</p>
              )}
            </div>

            {/* Admin notes */}
            <div>
              <p className="text-xs font-semibold uppercase mb-1" style={{ color: "var(--text-hint)" }}>Admin Notes</p>
              <Textarea
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                placeholder="Add notes (optional)"
                rows={2}
                className="resize-none rounded-xl text-sm"
                style={{ borderColor: "var(--border-light)" }}
              />
            </div>

            {/* Actions */}
            {selected?.report.matched_keywords?.length > 0 && (
              <div className="rounded-xl p-3" style={{ backgroundColor: "#FEF9C3", border: "1px solid #FDE68A" }}>
                <p className="text-xs font-semibold mb-1" style={{ color: "#92400E" }}>🔑 Matched Keywords</p>
                <div className="flex flex-wrap gap-1">
                  {selected.report.matched_keywords.map(kw => (
                    <span key={kw} className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" }}>{kw}</span>
                  ))}
                </div>
              </div>
            )}

            {(selected?.report.status === "pending" || selected?.report.status === "flagged") && (
              <div className="flex gap-2">
                <Button
                  onClick={() => resolveReport("approve")}
                  className="flex-1 h-10 text-sm rounded-xl text-white"
                  style={{ backgroundColor: "#10B981" }}
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" /> Approve
                </Button>
                <Button
                  onClick={() => resolveReport("reject")}
                  className="flex-1 h-10 text-sm rounded-xl text-white"
                  style={{ backgroundColor: "#EF4444" }}
                >
                  <XCircle className="w-4 h-4 mr-1.5" /> Remove
                </Button>
              </div>
            )}
            {selected?.report.status !== "pending" && selected?.report.status !== "flagged" && (
              <p className="text-xs text-center" style={{ color: "var(--text-hint)" }}>
                Resolved by {selected?.report.resolved_by} · {selected?.report.resolved_at ? new Date(selected.report.resolved_at).toLocaleDateString() : ""}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}