import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { X, Crown, Shield, LogOut, UserMinus } from "lucide-react";

const ROLE_CONFIG = {
  admin: { icon: Crown, color: "#D97706", label: "Admin" },
  moderator: { icon: Shield, color: "#2E6B4F", label: "Mod" },
  member: { icon: null, color: "var(--text-hint)", label: "Member" },
};

export default function GroupMembersSheet({ group, user, membership, onClose, onLeave }) {
  const qc = useQueryClient();
  const isAdmin = membership?.role === "admin";

  const { data: members = [] } = useQuery({
    queryKey: ["groupMembers", group.id],
    queryFn: () => base44.entities.GroupMember.filter({ group_id: group.id }),
  });

  const promoteMut = useMutation({
    mutationFn: ({ memberId, role }) => base44.entities.GroupMember.update(memberId, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["groupMembers", group.id] }),
  });

  const removeMut = useMutation({
    mutationFn: (memberId) => base44.entities.GroupMember.delete(memberId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["groupMembers", group.id] }),
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={onClose}>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-lg mx-auto rounded-t-3xl overflow-hidden"
        style={{ backgroundColor: "#FAFAF8", maxHeight: "80vh", display: "flex", flexDirection: "column" }}
        onClick={e => e.stopPropagation()}>
        <div className="h-1.5 w-12 rounded-full mx-auto mt-3 mb-1" style={{ backgroundColor: "var(--border-medium)" }} />

        <div className="px-4 py-3 flex items-center justify-between shrink-0" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <div>
            <h2 className="text-base font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Members</h2>
            <p className="text-xs" style={{ color: "var(--text-hint)" }}>{members.length} in {group.name}</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: "var(--text-hint)" }} /></button>
        </div>

        <div className="overflow-y-auto flex-1">
          {members.map(m => {
            const roleConf = ROLE_CONFIG[m.role] || ROLE_CONFIG.member;
            const RoleIcon = roleConf.icon;
            const isSelf = m.user_email === user?.email;
            return (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)" }}>
                  {(m.user_name || "U")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                      {m.user_name || m.user_email}
                    </p>
                    {RoleIcon && <RoleIcon className="w-3 h-3 shrink-0" style={{ color: roleConf.color }} />}
                  </div>
                  <p className="text-[11px]" style={{ color: "var(--text-hint)" }}>{roleConf.label}</p>
                </div>
                {/* Mod actions */}
                {isAdmin && !isSelf && (
                  <div className="flex gap-1.5 shrink-0">
                    {m.role === "member" && (
                      <button onClick={() => promoteMut.mutate({ memberId: m.id, role: "moderator" })}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold"
                        style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
                        Make Mod
                      </button>
                    )}
                    {m.role === "moderator" && (
                      <button onClick={() => promoteMut.mutate({ memberId: m.id, role: "member" })}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold"
                        style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
                        Demote
                      </button>
                    )}
                    <button onClick={() => removeMut.mutate(m.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: "#FEE2E2", color: "#EF4444" }}>
                      <UserMinus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {isSelf && membership?.role !== "admin" && (
                  <button onClick={onLeave}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold"
                    style={{ backgroundColor: "#FEE2E2", color: "#EF4444" }}>
                    <LogOut className="w-3 h-3" /> Leave
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}