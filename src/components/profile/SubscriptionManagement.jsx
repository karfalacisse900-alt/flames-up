import React, { useState } from "react";
import { CreditCard, X, AlertCircle, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function SubscriptionManagement({ user }) {
  const [cancelingId, setCancelingId] = useState(null);
  const qc = useQueryClient();

  const { data: subscriptions = [] } = useQuery({
    queryKey: ["mySubscriptions", user?.email],
    queryFn: () => base44.entities.GroupSubscription.filter({ user_email: user.email }, "-created_date"),
    enabled: !!user?.email,
  });

  const activeSubscriptions = subscriptions.filter(s => s.status === "active");

  const handleCancel = async (subscription) => {
    if (!window.confirm(`Cancel subscription to ${subscription.group_name}? You'll lose access immediately.`)) return;
    
    setCancelingId(subscription.id);
    try {
      await base44.entities.GroupSubscription.update(subscription.id, {
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      });
      
      // Remove user from group
      const groupMember = await base44.entities.GroupMember.filter({
        group_id: subscription.group_id,
        user_email: user.email,
      });
      if (groupMember.length > 0) {
        await base44.entities.GroupMember.delete(groupMember[0].id);
      }

      qc.invalidateQueries({ queryKey: ["mySubscriptions", user.email] });
      qc.invalidateQueries({ queryKey: ["myMemberships", user.email] });
    } catch (err) {
      console.error("Cancel error:", err);
    }
    setCancelingId(null);
  };

  if (activeSubscriptions.length === 0) {
    return (
      <div className="py-8 text-center">
        <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" style={{ color: "var(--text-hint)" }} />
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>No active subscriptions</p>
        <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>Join a paid group to manage subscriptions here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-hint)" }}>
        {activeSubscriptions.length} active subscription{activeSubscriptions.length !== 1 ? "s" : ""}
      </p>

      {activeSubscriptions.map(sub => (
        <div key={sub.id} className="p-4 rounded-2xl border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)" }}>
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{sub.group_name}</p>
              <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "var(--text-hint)" }}>
                <CheckCircle className="w-3 h-3" style={{ color: "var(--accent-primary)" }} />
                Active Subscription
              </p>
            </div>
            <span className="text-sm font-bold px-2.5 py-1 rounded-lg" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
              ${sub.monthly_fee}/mo
            </span>
          </div>

          <p className="text-[11px] mb-3" style={{ color: "var(--text-hint)" }}>
            Renews {new Date(sub.current_period_end).toLocaleDateString()}
          </p>

          <button
            onClick={() => handleCancel(sub)}
            disabled={cancelingId === sub.id}
            className="w-full py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              backgroundColor: "var(--bg-subtle)",
              color: "var(--text-secondary)",
              opacity: cancelingId === sub.id ? 0.6 : 1,
            }}>
            {cancelingId === sub.id ? "Cancelling..." : "Cancel Subscription"}
          </button>
        </div>
      ))}
    </div>
  );
}