import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, AlertCircle, Eye, MessageSquare } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const flagColors = {
  nsfw: { bg: "#FEE2E2", text: "#991B1B", label: "NSFW" },
  hate_speech: { bg: "#FED7AA", text: "#92400E", label: "Hate Speech" },
  spam: { bg: "#DBEAFE", text: "#1E40AF", label: "Spam" }
};

export default function AdminModeration() {
  const [user, setUser] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");
  const qc = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: flagged = [], isLoading: loadingFlagged } = useQuery({
    queryKey: ["moderation-flagged"],
    queryFn: () => base44.entities.ModerationReport.filter({ status: "flagged" }, "-created_date", 50),
  });

  const { data: approved = [], isLoading: loadingApproved } = useQuery({
    queryKey: ["moderation-approved"],
    queryFn: () => base44.entities.ModerationReport.filter({ status: "approved" }, "-created_date", 50),
  });

  const { data: rejected = [], isLoading: loadingRejected } = useQuery({
    queryKey: ["moderation-rejected"],
    queryFn: () => base44.entities.ModerationReport.filter({ status: "rejected" }, "-created_date", 50),
  });

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm" style={{ color: "var(--text-hint)" }}>Admin access only</p>
      </div>
    );
  }

  const handleApprove = async (report) => {
    await base44.entities.ModerationReport.update(report.id, {
      status: "approved",
      admin_notes: adminNotes,
      resolved_by: user.email,
      resolved_at: new Date().toISOString()
    });
    setSelectedReport(null);
    setAdminNotes("");
    qc.invalidateQueries({ queryKey: ["moderation-flagged"] });
    qc.invalidateQueries({ queryKey: ["moderation-approved"] });
  };

  const handleReject = async (report) => {
    await base44.entities.ModerationReport.update(report.id, {
      status: "rejected",
      admin_notes: adminNotes,
      resolved_by: user.email,
      resolved_at: new Date().toISOString()
    });
    if (report.content_type === "art") {
      await base44.entities.ArtFightEntry.update(report.content_id, { status: "rejected" });
    }
    setSelectedReport(null);
    setAdminNotes("");
    qc.invalidateQueries({ queryKey: ["moderation-flagged"] });
    qc.invalidateQueries({ queryKey: ["moderation-rejected"] });
  };

  const ReportCard = ({ report }) => (
    <div
      onClick={() => { setSelectedReport(report); setAdminNotes(report.admin_notes || ""); }}
      className="p-3 rounded-2xl cursor-pointer hover:shadow-sm transition-shadow"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
    >
      <div className="flex items-start gap-3">
        {report.content_type === "art" && report.content_id && (
          <Eye className="w-4 h-4 mt-1 shrink-0" style={{ color: "var(--text-hint)" }} />
        )}
        {report.content_type === "post" && (
          <MessageSquare className="w-4 h-4 mt-1 shrink-0" style={{ color: "var(--text-hint)" }} />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {report.content_type === "art" ? "🎨 Art Submission" : "💬 Post"}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>
            by {report.author_name} ({report.author_email})
          </p>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {report.flags.map((flag) => {
              const color = flagColors[flag] || { bg: "#F3F4F6", text: "#6B7280", label: flag };
              return (
                <span key={flag} className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={{ backgroundColor: color.bg, color: color.text }}>{color.label}</span>
              );
            })}
          </div>
          <p className="text-xs mt-1.5 font-medium" style={{ color: "var(--accent-primary)" }}>
            Confidence: {Math.round(report.ai_confidence * 100)}%
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-app)" }}>
      <div className="px-5 pt-6 pb-3" style={{ backgroundColor: "var(--bg-nav)", borderBottom: "1px solid var(--border-light)" }}>
        <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Moderation</h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>Review flagged content</p>
      </div>

      <Tabs defaultValue="flagged" className="px-5 mt-4">
        <TabsList className="rounded-xl w-full" style={{ backgroundColor: "var(--bg-card)" }}>
          <TabsTrigger value="flagged" className="flex-1 rounded-lg data-[state=active]:bg-white text-xs">
            🚩 Flagged ({flagged.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex-1 rounded-lg data-[state=active]:bg-white text-xs">
            ✓ Approved ({approved.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex-1 rounded-lg data-[state=active]:bg-white text-xs">
            ✕ Rejected ({rejected.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flagged" className="mt-4 space-y-2 pb-24">
          {loadingFlagged ? (
            <div className="flex justify-center py-10">
              <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)" }} />
            </div>
          ) : flagged.length === 0 ? (
            <p className="text-center text-sm py-8" style={{ color: "var(--text-hint)" }}>No flagged content ✓</p>
          ) : (
            flagged.map(r => <ReportCard key={r.id} report={r} />)
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-4 space-y-2 pb-24">
          {loadingApproved ? (
            <div className="flex justify-center py-10">
              <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)" }} />
            </div>
          ) : approved.length === 0 ? (
            <p className="text-center text-sm py-8" style={{ color: "var(--text-hint)" }}>No approved content yet</p>
          ) : (
            approved.map(r => <ReportCard key={r.id} report={r} />)
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-4 space-y-2 pb-24">
          {loadingRejected ? (
            <div className="flex justify-center py-10">
              <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)" }} />
            </div>
          ) : rejected.length === 0 ? (
            <p className="text-center text-sm py-8" style={{ color: "var(--text-hint)" }}>No rejected content yet</p>
          ) : (
            rejected.map(r => <ReportCard key={r.id} report={r} />)
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-serif)" }}>Review {selectedReport?.content_type === "art" ? "Art" : "Post"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold mb-2 uppercase" style={{ color: "var(--text-hint)" }}>Flags</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedReport?.flags.map((flag) => {
                  const color = flagColors[flag] || { bg: "#F3F4F6", text: "#6B7280", label: flag };
                  return (
                    <span key={flag} className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                      style={{ backgroundColor: color.bg, color: color.text }}>{color.label}</span>
                  );
                })}
              </div>
              <p className="text-xs mt-2" style={{ color: "var(--text-secondary)" }}>
                AI Confidence: {Math.round((selectedReport?.ai_confidence || 0) * 100)}%
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold mb-2 uppercase" style={{ color: "var(--text-hint)" }}>Author</p>
              <p className="text-sm" style={{ color: "var(--text-primary)" }}>{selectedReport?.author_name}</p>
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>{selectedReport?.author_email}</p>
            </div>
            <div>
              <p className="text-xs font-semibold mb-2 uppercase" style={{ color: "var(--text-hint)" }}>Admin Notes</p>
              <Textarea
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                placeholder="Add notes (optional)"
                rows={2}
                className="resize-none rounded-xl"
                style={{ borderColor: "var(--border-light)" }}
              />
            </div>
            {selectedReport?.status === "flagged" && (
              <div className="flex gap-2">
                <Button
                  onClick={() => handleApprove(selectedReport)}
                  className="flex-1 rounded-xl h-10 text-white text-sm"
                  style={{ backgroundColor: "#10B981" }}
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" /> Approve
                </Button>
                <Button
                  onClick={() => handleReject(selectedReport)}
                  className="flex-1 rounded-xl h-10 text-white text-sm"
                  style={{ backgroundColor: "#EF4444" }}
                >
                  <XCircle className="w-4 h-4 mr-1.5" /> Reject
                </Button>
              </div>
            )}
            {selectedReport?.status !== "flagged" && (
              <div className="text-center">
                <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                  Resolved by {selectedReport?.resolved_by}
                </p>
                <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>
                  {new Date(selectedReport?.resolved_at).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}