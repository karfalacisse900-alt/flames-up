import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Crown, Shield, UserMinus } from "lucide-react";

const avatarColors = ["#7C69C4", "#D98B62", "#3C6E5A", "#E05C7A", "#4A7FC1", "#B07843"];
const getColor = (name) => avatarColors[(name || "U").charCodeAt(0) % avatarColors.length];

export default function GroupMembersTab({ group, user, isAdmin }) {
  const qc = useQueryClient();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["groupMembers", group.id],
    queryFn: () => base44.entities.GroupMember.filter({ group_id: group.id }, "-joined_at", 200),
  });

  const handleRemove = async (member) => {
    if (!window.confirm(`Remove ${member.user_name} from this group?`)) return;
    await base44.entities.GroupMember.delete(member.id);
    await base44.entities.Group.update(group.id, { member_count: Math.max(0, (group.member_count || 1) - 1) });
    qc.invalidateQueries({ queryKey: ["groupMembers", group.id] });
    qc.invalidateQueries({ queryKey: ["groups"] });
  };

  const admins = members.filter(m => m.role === "admin");
  const mods = members.filter(m => m.role === "moderator");
  const regular = members.filter(m => m.role === "member");

  const MemberRow = ({ member }) => {
    const color = getColor(member.user_name);
    const initial = (member.user_name || "?")[0].toUpperCase();
    return (
      <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
          style={{ background: `linear-gradient(135deg, ${color}33, ${color}66)`, color }}>
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
              {member.user_name || "User"}
            </p>
            {member.role === "admin" && <Crown className="w-3 h-3 shrink-0" style={{ color: "#D97706" }} />}
            {member.role === "moderator" && <Shield className="w-3 h-3 shrink-0" style={{ color: "var(--accent-primary)" }} />}
          </div>
          <p className="text-xs capitalize" style={{ color: "var(--text-hint)" }}>{member.role}</p>
        </div>
        {isAdmin && member.user_email !== user?.email && member.role !== "admin" && (
          <button onClick={() => handleRemove(member)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>
            <UserMinus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  };

  if (isLoading) return (
    <div className="flex justify-center py-12">
      <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
    </div>
  );

  const Section = ({ title, items }) => items.length === 0 ? null : (
    <div className="mb-4">
      <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-hint)" }}>
        {title} · {items.length}
      </p>
      <div className="space-y-2">
        {items.map(m => <MemberRow key={m.id} member={m} />)}
      </div>
    </div>
  );

  return (
    <div className="px-4 pt-3 pb-28">
      <Section title="Admins" items={admins} />
      <Section title="Moderators" items={mods} />
      <Section title="Members" items={regular} />
      {members.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-sm" style={{ color: "var(--text-hint)" }}>No members yet.</p>
        </div>
      )}
    </div>
  );
}