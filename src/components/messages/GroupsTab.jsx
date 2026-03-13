import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Users, Search, X } from "lucide-react";

const COLORS = ["#25D366", "#128C7E", "#075E54", "#9C27B0", "#FF5722", "#3F51B5", "#E91E63"];
const avatarColor = (str) => COLORS[(str || "a").charCodeAt(0) % COLORS.length];
const getName = (name, email) => (!name || name === email) ? (email?.split("@")[0] || "User") : name;

const timeAgo = (date) => {
  if (!date) return "";
  try {
    const diff = (Date.now() - new Date(date)) / 1000;
    if (diff < 60) return "now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    const d = new Date(date);
    const now = new Date();
    if (diff < 604800 && d.getDate() !== now.getDate()) return ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()];
    return d.toLocaleDateString([], { day: "2-digit", month: "2-digit" });
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
      sent.forEach(f => { map[f.following_email] = getName(f.following_name, f.following_email); });
      received.forEach(f => { map[f.follower_email] = getName(f.follower_name, f.follower_email); });
      return Object.entries(map).map(([email, name]) => ({ email, name }));
    },
    enabled: !!user?.email,
  });

  const filtered = follows.filter(f =>
    !search || f.name?.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (person) => setSelected(prev =>
    prev.find(p => p.email === person.email) ? prev.filter(p => p.email !== person.email) : [...prev, person]
  );

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
    <div className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.55)" }} onClick={onClose}>
      <div className="w-full rounded-t-3xl" style={{ backgroundColor: "#fff", maxHeight: "85dvh", overflow: "hidden" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b" style={{ borderColor: "#F0F0F0" }}>
          <h3 className="font-bold text-lg" style={{ color: "#111" }}>New Group</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#F5F5F5" }}>
            <X className="w-4 h-4" style={{ color: "#666" }} />
          </button>
        </div>

        <div className="px-4 py-3 border-b" style={{ borderColor: "#F0F0F0" }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Group name…"
            className="w-full px-4 py-3 rounded-2xl text-sm outline-none mb-2"
            style={{ backgroundColor: "#F5F5F5", color: "#111", border: "none" }} autoFocus />

          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {selected.map(p => (
                <button key={p.email} onClick={() => toggle(p)}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-semibold"
                  style={{ backgroundColor: "#075E54", color: "#fff" }}>
                  {p.name} ×
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-b" style={{ borderColor: "#F0F0F0" }}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-full" style={{ backgroundColor: "#F5F5F5" }}>
            <Search className="w-4 h-4" style={{ color: "#999" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Add members…"
              className="flex-1 bg-transparent text-sm outline-none" style={{ color: "#111" }} />
          </div>
        </div>

        <div style={{ overflowY: "auto", maxHeight: "40dvh" }}>
          {filtered.map(f => {
            const isSelected = !!selected.find(p => p.email === f.email);
            return (
              <button key={f.email} onClick={() => toggle(f)}
                className="w-full flex items-center gap-3 px-5 py-3 text-left"
                style={{ backgroundColor: isSelected ? "#E8F5E9" : "#fff", borderBottom: "1px solid #F9F9F9" }}>
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-base font-bold shrink-0"
                  style={{ backgroundColor: avatarColor(f.email), color: "#fff" }}>
                  {f.name[0]?.toUpperCase()}
                </div>
                <p className="font-medium text-[15px] flex-1" style={{ color: "#111" }}>{f.name}</p>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "#25D366" }}>
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="px-4 py-3" style={{ borderTop: "1px solid #F0F0F0", paddingBottom: "max(env(safe-area-inset-bottom, 0px), 12px)" }}>
          <button onClick={handleCreate} disabled={!name.trim() || selected.length === 0 || creating}
            className="w-full py-3.5 rounded-2xl font-bold text-sm text-white disabled:opacity-40"
            style={{ backgroundColor: "#25D366" }}>
            {creating ? "Creating…" : `Create Group (${selected.length + 1} members)`}
          </button>
        </div>
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
    select: (data) => data.filter(g => g.member_emails?.includes(user.email))
      .sort((a, b) => new Date(b.last_message_at || b.created_date) - new Date(a.last_message_at || a.created_date)),
  });

  return (
    <div className="space-y-3 pt-1">
      {/* Create button */}
      <button onClick={() => setShowCreate(true)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left rounded-[24px] card-elevated"
        style={{ border: "1px solid var(--border-light)", backgroundColor: "rgba(255,255,255,0.82)", backdropFilter: "blur(8px)" }}>
        <div className="w-[54px] h-[54px] rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: "#25D366" }}>
          <Plus className="w-6 h-6 text-white" />
        </div>
        <p className="font-semibold text-[15px]" style={{ color: "#111" }}>New Group</p>
      </button>

      {allGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: "#F0F8F0" }}>
            <Users className="w-10 h-10" style={{ color: "#25D366" }} />
          </div>
          <p className="text-base font-semibold mb-1" style={{ color: "#333" }}>No group chats yet</p>
          <p className="text-sm text-center px-8" style={{ color: "#999" }}>Create a group to chat with multiple people at once</p>
        </div>
      ) : allGroups.map((group, idx) => (
        <button key={group.id} onClick={() => onSelect({ type: "group", data: group })}
          className="w-full flex items-center gap-3 px-4 py-3 text-left"
          style={{ borderBottom: idx < allGroups.length - 1 ? "1px solid #F5F5F5" : "none" }}>

          <div className="w-[54px] h-[54px] rounded-full flex items-center justify-center text-xl font-bold shrink-0"
            style={{ backgroundColor: avatarColor(group.name), color: "#fff" }}>
            {group.photo_url
              ? <img src={group.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
              : group.name?.[0]?.toUpperCase() || "G"}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <p className="font-semibold text-[15px] truncate" style={{ color: "#111" }}>{group.name}</p>
              <span className="text-[12px] shrink-0 ml-2" style={{ color: "#999" }}>
                {timeAgo(group.last_message_at)}
              </span>
            </div>
            <p className="text-[13px] truncate" style={{ color: "#999" }}>
              {group.last_message
                ? `${group.last_sender_name || "Someone"}: ${group.last_message}`
                : `${group.member_emails?.length || 0} members`}
            </p>
          </div>
        </button>
      ))}

      {showCreate && (
        <CreateGroupModal user={user} onClose={() => setShowCreate(false)}
          onCreated={(group) => { setShowCreate(false); onSelect({ type: "group", data: group }); }} />
      )}
    </div>
  );
}