import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Users, UserPlus, X } from "lucide-react";

const COLORS = ["#2E6B4F", "#D98B62", "#6B4F2E", "#4A6B9F", "#8B4F6B"];
const avatarColor = (str) => COLORS[(str || "a").charCodeAt(0) % COLORS.length];

const timeAgo = (date) => {
  if (!date) return "";
  try {
    const diff = (Date.now() - new Date(date)) / 1000;
    if (diff < 60) return "now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  } catch { return ""; }
};

function CreateGroupModal({ user, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [creating, setCreating] = useState(false);
  const queryClient = useQueryClient();

  const { data: follows = [] } = useQuery({
    queryKey: ["msgFollows", user?.email],
    queryFn: async () => {
      const [sent, received] = await Promise.all([
        base44.entities.Follow.filter({ follower_email: user.email }),
        base44.entities.Follow.filter({ following_email: user.email }),
      ]);
      const map = {};
      sent.forEach(f => { map[f.following_email] = f.following_name || f.following_email; });
      received.forEach(f => { map[f.follower_email] = f.follower_name || f.follower_email; });
      return Object.entries(map).map(([email, name]) => ({ email, name }));
    },
    enabled: !!user?.email,
  });

  const filtered = follows.filter(f =>
    !search || f.name?.toLowerCase().includes(search.toLowerCase()) || f.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleMember = (person) => {
    setSelected(prev =>
      prev.find(p => p.email === person.email)
        ? prev.filter(p => p.email !== person.email)
        : [...prev, person]
    );
  };

  const handleCreate = async () => {
    if (!name.trim() || selected.length === 0) return;
    setCreating(true);
    const memberEmails = [user.email, ...selected.map(p => p.email)];
    const memberNames = { [user.email]: user.full_name || user.email };
    selected.forEach(p => { memberNames[p.email] = p.name; });
    const group = await base44.entities.GroupChat.create({
      name: name.trim(),
      admin_emails: [user.email],
      member_emails: memberEmails,
      member_names: memberNames,
    });
    queryClient.invalidateQueries({ queryKey: ["myGroups", user.email] });
    setCreating(false);
    onCreated(group);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="w-full rounded-t-3xl p-4" style={{ backgroundColor: "var(--bg-modal)", maxHeight: "80dvh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>
        <div className="h-1.5 w-12 rounded-full mx-auto mb-4" style={{ backgroundColor: "var(--border-medium)" }} />
        <h3 className="font-bold text-base mb-4" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
          New Group Chat
        </h3>

        <input value={name} onChange={e => setName(e.target.value)} placeholder="Group name…"
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none mb-3"
          style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />

        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {selected.map(p => (
              <button key={p.email} onClick={() => toggleMember(p)}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
                {p.name} ×
              </button>
            ))}
          </div>
        )}

        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Add members…"
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none mb-2"
          style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />

        <div className="space-y-1 max-h-52 overflow-y-auto mb-4">
          {filtered.map(f => {
            const isSelected = !!selected.find(p => p.email === f.email);
            return (
              <button key={f.email} onClick={() => toggleMember(f)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left"
                style={{ backgroundColor: isSelected ? "var(--accent-primary-light)" : "var(--bg-subtle)" }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: avatarColor(f.email), color: "#fff" }}>
                  {f.name?.[0]?.toUpperCase() || "?"}
                </div>
                <span className="text-sm font-medium flex-1" style={{ color: "var(--text-primary)" }}>{f.name}</span>
                {isSelected && <span className="text-xs font-bold" style={{ color: "var(--accent-primary)" }}>✓</span>}
              </button>
            );
          })}
        </div>

        <button onClick={handleCreate} disabled={!name.trim() || selected.length === 0 || creating}
          className="w-full py-3 rounded-2xl font-bold text-sm text-white disabled:opacity-40"
          style={{ backgroundColor: "var(--accent-primary)" }}>
          {creating ? "Creating…" : `Create Group (${selected.length + 1} members)`}
        </button>
      </div>
    </div>
  );
}

export default function GroupsTab({ user, onSelect }) {
  const [showCreate, setShowCreate] = useState(false);

  const { data: allGroups = [] } = useQuery({
    queryKey: ["myGroups", user?.email],
    queryFn: () => base44.entities.GroupChat.filter({}),
    enabled: !!user?.email,
    refetchInterval: 10000,
    select: (data) => data.filter(g => g.member_emails?.includes(user.email)),
  });

  return (
    <div>
      <div className="px-4 mb-3">
        <button onClick={() => setShowCreate(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm"
          style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)", border: "1px dashed var(--accent-primary)" }}>
          <Plus className="w-4 h-4" />
          Create New Group
        </button>
      </div>

      <div className="space-y-0.5 px-2">
        {allGroups.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-hint)" }} />
            <p className="text-sm" style={{ color: "var(--text-hint)" }}>No group chats yet</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>Create a group to chat with multiple people</p>
          </div>
        ) : allGroups.map(group => (
          <button key={group.id} onClick={() => onSelect({ type: "group", data: group })}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left"
            style={{ backgroundColor: "transparent" }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-base font-bold shrink-0"
              style={{ backgroundColor: avatarColor(group.name), color: "#fff" }}>
              {group.photo_url
                ? <img src={group.photo_url} alt="" className="w-full h-full rounded-2xl object-cover" />
                : group.name?.[0]?.toUpperCase() || "G"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{group.name}</p>
                <span className="text-[11px] shrink-0 ml-2" style={{ color: "var(--text-hint)" }}>
                  {timeAgo(group.last_message_at)}
                </span>
              </div>
              <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-hint)" }}>
                {group.last_message
                  ? `${group.last_sender_name || "Someone"}: ${group.last_message}`
                  : `${group.member_emails?.length || 0} members`}
              </p>
            </div>
          </button>
        ))}
      </div>

      {showCreate && (
        <CreateGroupModal
          user={user}
          onClose={() => setShowCreate(false)}
          onCreated={(group) => { setShowCreate(false); onSelect({ type: "group", data: group }); }}
        />
      )}
    </div>
  );
}