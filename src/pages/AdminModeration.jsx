import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, Trash2, Flag, Clock, MessageSquare, Mic } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const contentTypeIcon = { post: "💬", reply: "↩️", art: "🎨", live_message: "📡", user: "👤" };

function ReportCard({ report, onClick }) {
  return (
    <div onClick={onClick} className="p-4 rounded-2xl cursor-pointer hover:shadow-sm transition-shadow"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">{contentTypeIcon[report.content_type] || "📄"}</span>
            <span className="text-xs font-semibold capitalize" style={{ color: "var(--text-primary)" }}>
              {report.content_type?.replace(/_/g, " ")}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ml-auto ${
              report.status === "pending" ? "bg-amber-50 text-amber-700" :
              report.status === "reviewed" ? "bg-emerald-50 text-emerald-700" :
              "bg-rose-50 text-rose-700"
            }`}>
              {report.status}
            </span>
          </div>
          <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>
            <strong>Reason:</strong> {report.reason}
          </p>
          <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>
            Reported by {report.reporter_email} · {new Date(report.created_date).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminModeration() {
  const [user, setUser] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [contentPreview, setContentPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const qc = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: pending = [], isLoading: loadingPending } = useQuery({
    queryKey: ["reports-pending"],
    queryFn: () => base44.entities.Report.filter({ status: "pending" }, "-created_date", 100),
  });

  const { data: reviewed = [], isLoading: loadingReviewed } = useQuery({
    queryKey: ["reports-reviewed"],
    queryFn: () => base44.entities.Report.filter({ status: "reviewed" }, "-created_date", 100),
  });

  const { data: dismissed = [], isLoading: loadingDismissed } = useQuery({
    queryKey: ["reports-dismissed"],
    queryFn: () => base44.entities.Report.filter({ status: "dismissed" }, "-created_date", 100),
  });

  const openReport = async (report) => {
    setSelectedReport(report);
    setContentPreview(null);
    setLoadingPreview(true);
    try {
      if (report.content_type === "post") {
        const posts = await base44.entities.Post.filter({ id: report.content_id });
        setContentPreview(posts[0]);
      } else if (report.content_type === "reply") {
        const replies = await base44.entities.Reply.filter({ id: report.content_id });
        setContentPreview(replies[0]);
      }
    } catch (e) {}
    setLoadingPreview(false);
  };

  const handleApprove = async () => {
    // "Approve" = dismiss the report (content is fine)
    await base44.entities.Report.update(selectedReport.id, { status: "dismissed" });
    qc.invalidateQueries({ queryKey: ["reports-pending"] });
    qc.invalidateQueries({ queryKey: ["reports-dismissed"] });
    setSelectedReport(null);
  };

  const handleDelete = async () => {
    // Delete the actual content + mark report reviewed
    try {
      if (selectedReport.content_type === "post") {
        await base44.entities.Post.delete(selectedReport.content_id);
      } else if (selectedReport.content_type === "reply") {
        await base44.entities.Reply.delete(selectedReport.content_id);
      } else if (selectedReport.content_type === "art") {
        await base44.entities.ArtPiece.delete(selectedReport.content_id);
      }
    } catch (e) {}
    await base44.entities.Report.update(selectedReport.id, { status: "reviewed" });
    qc.invalidateQueries({ queryKey: ["reports-pending"] });
    qc.invalidateQueries({ queryKey: ["reports-reviewed"] });
    setSelectedReport(null);
  };

  if (!user) return null;

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
        <p className="text-sm" style={{ color: "var(--text-hint)" }}>Admin access only</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-app)" }}>
      <div className="px-5 pt-6 pb-3" style={{ backgroundColor: "var(--bg-nav)", borderBottom: "1px solid var(--border-light)" }}>
        <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Moderation</h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>Review user-reported content</p>
      </div>

      <Tabs defaultValue="pending" className="px-5 mt-4">
        <TabsList className="rounded-xl w-full" style={{ backgroundColor: "var(--bg-card)" }}>
          <TabsTrigger value="pending" className="flex-1 rounded-lg text-xs">
            🚩 Queue ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="reviewed" className="flex-1 rounded-lg text-xs">
            ✓ Actioned ({reviewed.length})
          </TabsTrigger>
          <TabsTrigger value="dismissed" className="flex-1 rounded-lg text-xs">
            ✕ Dismissed ({dismissed.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4 space-y-2 pb-24">
          {loadingPending ? (
            <div className="flex justify-center py-10"><div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} /></div>
          ) : pending.length === 0 ? (
            <p className="text-center text-sm py-8" style={{ color: "var(--text-hint)" }}>No pending reports ✓</p>
          ) : pending.map(r => <ReportCard key={r.id} report={r} onClick={() => openReport(r)} />)}
        </TabsContent>

        <TabsContent value="reviewed" className="mt-4 space-y-2 pb-24">
          {loadingReviewed ? (
            <div className="flex justify-center py-10"><div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} /></div>
          ) : reviewed.length === 0 ? (
            <p className="text-center text-sm py-8" style={{ color: "var(--text-hint)" }}>No actioned reports yet</p>
          ) : reviewed.map(r => <ReportCard key={r.id} report={r} onClick={() => openReport(r)} />)}
        </TabsContent>

        <TabsContent value="dismissed" className="mt-4 space-y-2 pb-24">
          {loadingDismissed ? (
            <div className="flex justify-center py-10"><div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} /></div>
          ) : dismissed.length === 0 ? (
            <p className="text-center text-sm py-8" style={{ color: "var(--text-hint)" }}>No dismissed reports yet</p>
          ) : dismissed.map(r => <ReportCard key={r.id} report={r} onClick={() => openReport(r)} />)}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-sm rounded-2xl" style={{ backgroundColor: "var(--bg-card)" }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
              {contentTypeIcon[selectedReport?.content_type]} Review {selectedReport?.content_type?.replace(/_/g, " ")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-xl space-y-1" style={{ backgroundColor: "var(--bg-app)", border: "1px solid var(--border-light)" }}>
              <p className="text-[10px] uppercase font-semibold" style={{ color: "var(--text-hint)" }}>Report Reason</p>
              <p className="text-sm" style={{ color: "var(--text-primary)" }}>{selectedReport?.reason}</p>
              <p className="text-[10px] mt-1" style={{ color: "var(--text-hint)" }}>By {selectedReport?.reporter_email}</p>
            </div>

            {loadingPreview ? (
              <div className="flex justify-center py-4"><div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} /></div>
            ) : contentPreview ? (
              <div className="p-3 rounded-xl" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
                <p className="text-[10px] uppercase font-semibold mb-1.5" style={{ color: "var(--text-hint)" }}>Reported Content</p>
                <p className="text-sm leading-relaxed" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
                  {contentPreview.text}
                </p>
                {contentPreview.author_name && (
                  <p className="text-[10px] mt-2" style={{ color: "var(--text-hint)" }}>
                    by {contentPreview.is_anonymous ? "Anonymous" : contentPreview.author_name} ({contentPreview.author_email})
                  </p>
                )}
              </div>
            ) : selectedReport?.content_type && !["post", "reply"].includes(selectedReport.content_type) ? (
              <p className="text-xs text-center py-2" style={{ color: "var(--text-hint)" }}>Content ID: {selectedReport?.content_id}</p>
            ) : null}

            {selectedReport?.status === "pending" && (
              <div className="flex gap-2">
                <Button onClick={handleApprove} className="flex-1 rounded-xl h-10 text-sm" style={{ backgroundColor: "#10B981", color: "#fff" }}>
                  <CheckCircle className="w-4 h-4 mr-1.5" /> Dismiss
                </Button>
                <Button onClick={handleDelete} className="flex-1 rounded-xl h-10 text-sm" style={{ backgroundColor: "#EF4444", color: "#fff" }}>
                  <Trash2 className="w-4 h-4 mr-1.5" /> Delete Content
                </Button>
              </div>
            )}
            {selectedReport?.status !== "pending" && (
              <p className="text-xs text-center" style={{ color: "var(--text-hint)" }}>
                Status: <span className="font-semibold capitalize">{selectedReport?.status}</span>
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}