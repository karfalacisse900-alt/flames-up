import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, DollarSign, Calendar, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SubscriptionManagement({ user }) {
  const [deleting, setDeleting] = useState(null);
  const qc = useQueryClient();

  const { data: memberships = [] } = useQuery({
    queryKey: ["userGroupMemberships", user?.email],
    queryFn: () => base44.entities.GroupMember.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["allGroups"],
    queryFn: () => base44.entities.Group.filter({ is_active: true }),
  });

  const paidMemberships = memberships.filter(m => {
    const group = groups.find(g => g.id === m.group_id);
    return group?.is_paid && group?.monthly_fee > 0;
  });

  const handleCancelMembership = async (membershipId, groupId) => {
    if (!window.confirm("Cancel this subscription? You'll lose access to the group.")) return;
    
    setDeleting(membershipId);
    try {
      const group = groups.find(g => g.id === groupId);
      
      // Delete membership
      await base44.entities.GroupMember.delete(membershipId);
      
      // Update group member count
      if (group) {
        await base44.entities.Group.update(groupId, {
          member_count: Math.max(0, (group.member_count || 1) - 1),
        });
      }

      qc.invalidateQueries({ queryKey: ["userGroupMemberships", user.email] });
      qc.invalidateQueries({ queryKey: ["allGroups"] });
    } catch (err) {
      console.error("Error canceling membership:", err);
      alert("Failed to cancel membership");
    }
    setDeleting(null);
  };

  if (paidMemberships.length === 0) {
    return (
      <div className="px-4 py-8 text-center">
        <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-40" style={{ color: "var(--text-hint)" }} />
        <p className="text-sm" style={{ color: "var(--text-hint)" }}>No active subscriptions</p>
        <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>Join a paid group to manage subscriptions here</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-3">
      <AnimatePresence>
        {paidMemberships.map(membership => {
          const group = groups.find(g => g.id === membership.group_id);
          if (!group) return null;

          return (
            <motion.div
              key={membership.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-2xl border"
              style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                      {group.emoji} {group.name}
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                      style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
                      Active
                    </span>
                  </div>
                  
                  <p className="text-xs mb-2" style={{ color: "var(--text-hint)" }}>
                    {group.description && group.description.substring(0, 80) + "..."}
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
                      style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
                      <DollarSign className="w-3 h-3" />
                      <span className="font-semibold">${group.monthly_fee}/mo</span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
                      style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>
                      <Calendar className="w-3 h-3" />
                      <span>Since {new Date(membership.joined_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleCancelMembership(membership.id, group.id)}
                  disabled={deleting === membership.id}
                  className="shrink-0 p-2 rounded-lg transition-all hover:opacity-70 disabled:opacity-50"
                  style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}
                  title="Cancel subscription"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-3 p-2.5 rounded-lg flex items-start gap-2" style={{ backgroundColor: "rgba(217, 119, 6, 0.1)" }}>
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#D97706" }} />
                <p className="text-[11px]" style={{ color: "#D97706" }}>
                  Subscription renews monthly. Cancel anytime to stop charging.
                </p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}