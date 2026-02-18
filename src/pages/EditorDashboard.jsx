import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertCircle, CheckCircle2, Clock, X } from "lucide-react";

export default function EditorDashboard() {
  const [user, setUser] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const qc = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(u => {
      if (!u || u.role !== "admin") {
        window.location.href = "/";
        return;
      }
      setUser(u);
    });
  }, []);

  const { data: editors = [] } = useQuery({
    queryKey: ["editors"],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user,
  });

  const { data: requests = [] } = useQuery({
    queryKey: ["editor-requests"],
    queryFn: () => base44.entities.EditorRequest.filter({}, "-created_date"),
    enabled: !!user,
  });

  const inviteMutation = useMutation({
    mutationFn: async (email) => {
      await base44.users.inviteUser(email, "editor");
    },
    onSuccess: () => {
      setInviteEmail("");
      setShowInviteDialog(false);
      qc.invalidateQueries({ queryKey: ["editors"] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: (requestId) => 
      base44.entities.EditorRequest.update(requestId, { status: "approved" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["editor-requests"] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (requestId) => 
      base44.entities.EditorRequest.update(requestId, { status: "rejected" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["editor-requests"] }),
  });

  if (!user || user.role !== "admin") return null;

  const editorEmails = editors.filter(e => e.role === "editor").map(e => e.email);

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-serif font-bold mb-8" style={{ color: "var(--text-primary)" }}>Editor Management</h1>

      {/* Invite Section */}
      <Card className="p-6 mb-8" style={{ backgroundColor: "var(--bg-card)" }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Invite Editor</h2>
        <Button 
          onClick={() => setShowInviteDialog(true)}
          style={{ backgroundColor: "var(--accent-primary)" }}
        >
          + Invite New Editor
        </Button>
      </Card>

      {/* Current Editors */}
      <Card className="p-6 mb-8" style={{ backgroundColor: "var(--bg-card)" }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Active Editors ({editorEmails.length})</h2>
        {editorEmails.length === 0 ? (
          <p style={{ color: "var(--text-hint)" }}>No editors yet</p>
        ) : (
          <div className="space-y-2">
            {editorEmails.map(email => (
              <div key={email} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: "var(--bg-subtle)" }}>
                <CheckCircle2 className="w-5 h-5" style={{ color: "var(--accent-primary)" }} />
                <span style={{ color: "var(--text-primary)" }}>{email}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Pending Requests */}
      <Card className="p-6" style={{ backgroundColor: "var(--bg-card)" }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Approval Requests</h2>
        {requests.filter(r => r.status === "pending").length === 0 ? (
          <p style={{ color: "var(--text-hint)" }}>No pending requests</p>
        ) : (
          <div className="space-y-4">
            {requests.filter(r => r.status === "pending").map(req => (
              <div key={req.id} className="p-4 rounded-lg border" style={{ backgroundColor: "var(--bg-subtle)", borderColor: "var(--border-medium)" }}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{req.editor_email}</p>
                    <p className="text-sm" style={{ color: "var(--accent-secondary)" }}>{req.request_type.replace(/_/g, " ")}</p>
                  </div>
                  <Clock className="w-5 h-5" style={{ color: "var(--text-hint)" }} />
                </div>
                <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>{req.description}</p>
                <div className="flex gap-2">
                  <Button 
                    size="sm"
                    onClick={() => approveMutation.mutate(req.id)}
                    style={{ backgroundColor: "var(--accent-primary)" }}
                  >
                    Approve
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => rejectMutation.mutate(req.id)}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Editor</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Editor email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <DialogFooter>
            <Button 
              variant="outline"
              onClick={() => setShowInviteDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => inviteMutation.mutate(inviteEmail)}
              disabled={!inviteEmail || inviteMutation.isPending}
              style={{ backgroundColor: "var(--accent-primary)" }}
            >
              {inviteMutation.isPending ? "Sending..." : "Send Invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}