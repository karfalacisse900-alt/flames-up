import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Trash2, Shield, AlertTriangle, Ban, UserX, UserCheck, Award } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BADGE_DEFINITIONS } from "../components/profile/BadgesSection";

const contentTypeIcon = { post: "💬", reply: "↩️", art: "🎨", live_message: "📡", user: "👤" };

function ReportCard({ report, onClick }) {
  return (
    <div onClick={onClick} className="p-4 rounded-2xl cursor-pointer active:scale-[0.99] transition-all"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">{contentTypeIcon[report.content_type] || "📄"}</span>
            <span className="text-xs font-semibold capitalize" style={{ color: "var(--text-primary)" }}>
              {report.content_type?.replace(/_/g, " ")}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ml-auto ${
              report.status === "pending" ? "bg-amber-100 text-amber-700" :
              report.status === "reviewed" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
            }`}>{report.status}</span>
          </div>
          <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}><strong>Reason:</strong> {report.reason}</p>
          <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>
            Reported by {report.reporter_email} · {new Date(report.created_date).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}

function UserRow({ u, onAction }) {
  const isMod = u.role === "moderator";
  const isAdmin = u.role === "admin";
  const isBanned = u.is_banned;
  return (
    <div className="p-4 rounded-2xl flex items-center gap-3"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
        style={{ backgroundColor: "var(--accent-primary)22", color: "var(--accent-primary)" }}>
        {u.full_name?.[0]?.toUpperCase() || "?"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{u.full_name || u.email}</p>
          {isMod && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: "#4A90D922", color: "#4A90D9" }}>MOD</span>}
          {isAdmin && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: "#B7A67A22", color: "#B7A67A" }}>ADMIN</span>}
          {isBanned && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold bg-red-100 text-red-600">BANNED</span>}
        </div>
        <p className="text-[11px] truncate" style={{ color: "var(--text-hint)" }}>{u.email}</p>
        {u.warning_count > 0 && <p className="text-[10px] mt-0.5 text-amber-600">⚠️ {u.warning_count} warning(s)</p>}
      </div>
      <button onClick={() => onAction(u)} className="p-2 rounded-xl shrink-0"
        style={{ backgroundColor: "var(--bg-app)", color: "var(--accent-primary)", border: "1px solid var(--border-light)" }}>
        <Shield className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function AdminModeration() {
  const [user, setUser] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [contentPreview, setContentPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [banDays, setBanDays] = useState(7);
  const qc = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: pending = [], isLoading: loadingPending } = useQuery({
    queryKey: ["reports-pending"],
    queryFn: () => base44.entities.Report.filter({ status: "pending" }, "-created_date", 100),
  });

  const { data: reviewed = [] } = useQuery({
    queryKey: ["reports-reviewed"],
    queryFn: () => base44.entities.Report.filter({ status: "reviewed" }, "-created_date", 50),
  });

  const { data: dismissed = [] } = useQuery({
    queryKey: ["reports-dismissed"],
    queryFn: () => base44.entities.Report.filter({ status: "dismissed" }, "-created_date", 50),
  });

  const { data: allUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["all-users-mod"],
    queryFn: () => base44.entities.User.list("-created_date", 200),
  });

  const openReport = async (report) => {
    setSelectedReport(report);
    setContentPreview(null);
    setLoadingPreview(true);
    try {
      if (report.content_type === "post") {
        const items = await base44.entities.Post.filter({ id: report.content_id });
        setContentPreview(items[0]);
      } else if (report.content_type === "reply") {
        const items = await base44.entities.Reply.filter({ id: report.content_id });
        setContentPreview(items[0]);
      }
    } catch (e) {}
    setLoadingPreview(false);
  };

  const handleDismissReport = async () => {
    await base44.entities.Report.update(selectedReport.id, { status: "dismissed" });
    qc.invalidateQueries({ queryKey: ["reports-pending"] });
    qc.invalidateQueries({ queryKey: ["reports-dismissed"] });
    setSelectedReport(null);
  };

  const handleDeleteContent = async () => {
    try {
      if (selectedReport.content_type === "post") await base44.entities.Post.delete(selectedReport.content_id);
      else if (selectedReport.content_type === "reply") await base44.entities.Reply.delete(selectedReport.content_id);
      else if (selectedReport.content_type === "art") await base44.entities.ArtPiece.delete(selectedReport.content_id);
    } catch (e) {}
    await base44.entities.Report.update(selectedReport.id, { status: "reviewed" });
    qc.invalidateQueries({ queryKey: ["reports-pending"] });
    qc.invalidateQueries({ queryKey: ["reports-reviewed"] });
    setSelectedReport(null);
  };

  const handleWarn = async () => {
    const count = (selectedUser.warning_count || 0) + 1;
    await base44.entities.User.update(selectedUser.id, { warning_count: count });
    qc.invalidateQueries({ queryKey: ["all-users-mod"] });
    setSelectedUser(null);
  };

  const handleTempBan = async () => {
    const until = new Date();
    until.setDate(until.getDate() + banDays);
    await base44.entities.User.update(selectedUser.id, { is_banned: true, ban_until: until.toISOString() });
    qc.invalidateQueries({ queryKey: ["all-users-mod"] });
    setSelectedUser(null);
  };

  const handleUnban = async () => {
    await base44.entities.User.update(selectedUser.id, { is_banned: false, ban_until: null, ban_reason: null });
    qc.invalidateQueries({ queryKey: ["all-users-mod"] });
    setSelectedUser(null);
  };

  const handleToggleMod = async () => {
    const newRole = selectedUser.role === "moderator" ? "user" : "moderator";
    const badges = selectedUser.badges || [];
    const updatedBadges = newRole === "moderator"
      ? [...new Set([...badges, "moderator"])]
      : badges.filter(b => b !== "moderator");
    await base44.entities.User.update(selectedUser.id, { role: newRole, badges: updatedBadges });
    qc.invalidateQueries({ queryKey: ["all-users-mod"] });
    setSelectedUser(null);
  };

  const handleAwardBadge = async (badgeKey) => {
    const badges = [...new Set([...(selectedUser.badges || []), badgeKey])];
    await base44.entities.User.update(selectedUser.id, { badges });
    setSelectedUser(prev => ({ ...prev, badges }));
    qc.invalidateQueries({ queryKey: ["all-users-mod"] });
  };

  if (!user) return null;
  if (user?.role !== "admin" && user?.role !== "moderator") {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
        <p className="text-sm" style={{ color: "var(--text-hint)" }}>Access denied</p>
      </div>
    );
  }

  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-app)" }}>
      <div className="px-5 pt-6 pb-3" style={{ backgroundColor: "var(--bg-card)", borderBottom: "1px solid var(--border-light)" }}>
        <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
          {isAdmin ? "Admin Dashboard" : "Moderation"}
        </h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>Review reported content and manage users</p>
      </div>

      <Tabs defaultValue="pending" className="px-4 mt-4">
        <TabsList className="rounded-xl w-full grid" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", gridTemplateColumns: isAdmin ? "repeat(4,1fr)" : "repeat(3,1fr)" }}>
          <TabsTrigger value="pending" className="rounded-lg text-[10px] py-1.5">🚩 Queue ({pending.length})</TabsTrigger>
          <TabsTrigger value="reviewed" className="rounded-lg text-[10px] py-1.5">✓ Done ({reviewed.length})</TabsTrigger>
          <TabsTrigger value="dismissed" className="rounded-lg text-[10px] py-1.5">✕ Dismissed</TabsTrigger>
          {isAdmin && <TabsTrigger value="users" className="rounded-lg text-[10px] py-1.5">👥 Users</TabsTrigger>}
        </TabsList>

        {[{ key: "pending", data: pending, loading: loadingPending }, { key: "reviewed", data: reviewed, loading: false }, { key: "dismissed", data: dismissed, loading: false }].map(({ key, data, loading }) => (
          <TabsContent key={key} value={key} className="mt-4 space-y-2 pb-24">
            {loading ? (
              <div className="flex justify-center py-10"><div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} /></div>
            ) : data.length === 0 ? (
              <p className="text-center text-sm py-8" style={{ color: "var(--text-hint)" }}>No {key} reports</p>
            ) : data.map(r => <ReportCard key={r.id} report={r} onClick={() => openReport(r)} />)}
          </TabsContent>
        ))}

        {isAdmin && (
          <TabsContent value="users" className="mt-4 space-y-2 pb-24">
            {loadingUsers ? (
              <div className="flex justify-center py-10"><div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} /></div>
            ) : allUsers.map(u => <UserRow key={u.id} u={u} onAction={setSelectedUser} />)}
          </TabsContent>
        )}
      </Tabs>

      {/* Report Detail Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-sm rounded-2xl" style={{ backgroundColor: "var(--bg-card)" }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
              {contentTypeIcon[selectedReport?.content_type]} Review Report
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-3 rounded-xl" style={{ backgroundColor: "var(--bg-app)", border: "1px solid var(--border-light)" }}>
              <p className="text-[10px] uppercase font-semibold mb-1" style={{ color: "var(--text-hint)" }}>Reason</p>
              <p className="text-sm" style={{ color: "var(--text-primary)" }}>{selectedReport?.reason}</p>
              <p className="text-[10px] mt-1" style={{ color: "var(--text-hint)" }}>By {selectedReport?.reporter_email}</p>
            </div>
            {loadingPreview ? (
              <div className="flex justify-center py-4"><div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} /></div>
            ) : contentPreview && (
              <div className="p-3 rounded-xl" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
                <p className="text-[10px] uppercase font-semibold mb-1" style={{ color: "var(--text-hint)" }}>Content</p>
                <p className="text-sm leading-relaxed" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>{contentPreview.text}</p>
                {contentPreview.author_email && (
                  <p className="text-[10px] mt-1.5" style={{ color: "var(--text-hint)" }}>
                    by {contentPreview.is_anonymous ? "Anonymous" : contentPreview.author_name} ({contentPreview.author_email})
                  </p>
                )}
              </div>
            )}
            {selectedReport?.status === "pending" && (
              <div className="flex gap-2">
                <Button onClick={handleDismissReport} className="flex-1 rounded-xl h-9 text-sm" style={{ backgroundColor: "#10B981", color: "#fff" }}>
                  <CheckCircle className="w-4 h-4 mr-1" /> Dismiss
                </Button>
                <Button onClick={handleDeleteContent} className="flex-1 rounded-xl h-9 text-sm bg-red-500 hover:bg-red-600 text-white">
                  <Trash2 className="w-4 h-4 mr-1" /> Delete
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* User Action Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-sm rounded-2xl" style={{ backgroundColor: "var(--bg-card)" }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
              Manage User
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl flex items-center gap-3" style={{ backgroundColor: "var(--bg-app)", border: "1px solid var(--border-light)" }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                  style={{ backgroundColor: "var(--accent-primary)22", color: "var(--accent-primary)" }}>
                  {selectedUser.full_name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{selectedUser.full_name}</p>
                  <p className="text-xs" style={{ color: "var(--text-hint)" }}>{selectedUser.email}</p>
                  <p className="text-xs mt-0.5 capitalize" style={{ color: "var(--accent-primary)" }}>{selectedUser.role} · {selectedUser.warning_count || 0} warnings</p>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button onClick={handleWarn} className="w-full flex items-center gap-3 p-3 rounded-xl text-sm text-left"
                  style={{ backgroundColor: "var(--bg-app)", border: "1px solid var(--border-light)", color: "#D97706" }}>
                  <AlertTriangle className="w-4 h-4" />
                  <div>
                    <p className="font-medium">Issue Warning</p>
                    <p className="text-[11px]" style={{ color: "var(--text-hint)" }}>Formal warning on their record</p>
                  </div>
                </button>

                {selectedUser.is_banned ? (
                  <button onClick={handleUnban} className="w-full flex items-center gap-3 p-3 rounded-xl text-sm text-left"
                    style={{ backgroundColor: "var(--bg-app)", border: "1px solid var(--border-light)", color: "#10B981" }}>
                    <UserCheck className="w-4 h-4" />
                    <div><p className="font-medium">Unban User</p><p className="text-[11px]" style={{ color: "var(--text-hint)" }}>Restore access</p></div>
                  </button>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: "var(--bg-app)", border: "1px solid var(--border-light)" }}>
                      <Ban className="w-4 h-4 text-red-500 shrink-0" />
                      <input type="number" min={1} max={365} value={banDays} onChange={e => setBanDays(+e.target.value)}
                        className="w-14 text-center text-sm rounded-lg px-2 py-1 border" style={{ borderColor: "var(--border-light)", color: "var(--text-primary)", backgroundColor: "var(--bg-card)" }} />
                      <span className="text-sm flex-1" style={{ color: "var(--text-secondary)" }}>day ban</span>
                      <button onClick={handleTempBan} className="px-3 py-1 rounded-lg text-xs font-medium text-white" style={{ backgroundColor: "#EF4444" }}>Ban</button>
                    </div>
                  </div>
                )}

                {selectedUser.role !== "admin" && (
                  <button onClick={handleToggleMod} className="w-full flex items-center gap-3 p-3 rounded-xl text-sm text-left"
                    style={{ backgroundColor: selectedUser.role === "moderator" ? "rgba(74,144,217,0.1)" : "var(--bg-app)", border: "1px solid var(--border-light)", color: "#4A90D9" }}>
                    <Shield className="w-4 h-4" />
                    <div>
                      <p className="font-medium">{selectedUser.role === "moderator" ? "Remove Moderator" : "Make Moderator"}</p>
                      <p className="text-[11px]" style={{ color: "var(--text-hint)" }}>
                        {selectedUser.role === "moderator" ? "Revoke mod permissions" : "Grant limited moderation permissions"}
                      </p>
                    </div>
                  </button>
                )}
              </div>

              {/* Award Badge */}
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Award Badge</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(BADGE_DEFINITIONS).map(([key, b]) => {
                    const hasIt = selectedUser.badges?.includes(key);
                    return (
                      <button key={key} onClick={() => handleAwardBadge(key)}
                        disabled={hasIt}
                        className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium border transition-all"
                        style={{
                          borderColor: hasIt ? b.color : "var(--border-light)",
                          backgroundColor: hasIt ? b.color + "22" : "var(--bg-app)",
                          color: hasIt ? b.color : "var(--text-secondary)",
                          opacity: hasIt ? 0.7 : 1,
                        }}>
                        {b.emoji} {b.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}