import React, { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Users, Lock, Flame, ChevronRight } from "lucide-react";
import GroupHub from "@/components/groups/GroupHub";
import CreateGroupModal from "@/components/groups/CreateGroupModal";

const CATEGORY_COLORS = {
  general: "linear-gradient(135deg, #64748b, #475569)",
  movies: "linear-gradient(135deg, #7c3aed, #4338ca)",
  music: "linear-gradient(135deg, #db2777, #be185d)",
  books: "linear-gradient(135deg, #d97706, #b45309)",
  gaming: "linear-gradient(135deg, #16a34a, #15803d)",
  tech: "linear-gradient(135deg, #0284c7, #0369a1)",
  sports: "linear-gradient(135deg, #ea580c, #dc2626)",
  art: "linear-gradient(135deg, #7c3aed, #a21caf)",
  health: "linear-gradient(135deg, #0d9488, #16a34a)",
  travel: "linear-gradient(135deg, #0284c7, #6d28d9)",
  food: "linear-gradient(135deg, #ea580c, #d97706)",
  relationships: "linear-gradient(135deg, #e11d48, #db2777)",
  motivation: "linear-gradient(135deg, #d97706, #ea580c)",
};

const FILTER_TABS = ["All", "My Groups", "Trending"];

function GroupCard({ group, membership, onOpen, onJoinDirect }) {
  const grad = CATEGORY_COLORS[group.category] || CATEGORY_COLORS.general;
  const isMember = !!membership;

  return (
    <div
      onClick={() => onOpen(group)}
      className="flex items-center gap-3 px-4 py-3.5 cursor-pointer active:scale-[0.99] transition-transform duration-100"
      style={{ backgroundColor: "var(--bg-card)", borderBottom: "1px solid var(--border-subtle)" }}
    >
      {/* Icon */}
      <div className="shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
        style={{ background: grad }}>
        {group.emoji || "💬"}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <h3 className="font-bold text-sm truncate" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
            {group.name}
          </h3>
          {group.is_private && <Lock className="w-3 h-3 shrink-0" style={{ color: "var(--text-hint)" }} />}
        </div>
        {group.description && (
          <p className="text-xs line-clamp-1 mb-1" style={{ color: "var(--text-hint)" }}>{group.description}</p>
        )}
        <div className="flex items-center gap-1 text-xs" style={{ color: "var(--text-hint)" }}>
          <Users className="w-3 h-3" />
          <span>{(group.member_count || 0).toLocaleString()} members</span>
          <span className="mx-1">·</span>
          <span className="capitalize">{group.category}</span>
        </div>
      </div>

      {/* Action */}
      {isMember ? (
        <span className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-full"
          style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
          Joined
        </span>
      ) : (
        <button
          onClick={e => { e.stopPropagation(); onJoinDirect(group); }}
          className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-full text-white active:scale-95 transition-transform duration-150"
          style={{ backgroundColor: "var(--accent-primary)" }}>
          Join
        </button>
      )}
    </div>
  );
}

export default function Groups() {
  const [user, setUser] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);
  const [activeMembership, setActiveMembership] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState("All");
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: groups = [] } = useQuery({
    queryKey: ["groups"],
    queryFn: () => base44.entities.Group.filter({ is_active: true }, "-member_count", 100),
  });

  const { data: myMemberships = [] } = useQuery({
    queryKey: ["myMemberships", user?.email],
    queryFn: () => base44.entities.GroupMember.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const membershipMap = Object.fromEntries(myMemberships.map(m => [m.group_id, m]));

  const handleJoin = async (group) => {
    if (!user) return;
    const existing = membershipMap[group.id];
    if (existing) return;
    const newMember = await base44.entities.GroupMember.create({
      group_id: group.id, group_name: group.name,
      user_email: user.email, user_name: user.full_name || user.email,
      role: "member", joined_at: new Date().toISOString(),
    });
    await base44.entities.Group.update(group.id, { member_count: (group.member_count || 0) + 1 });
    qc.invalidateQueries({ queryKey: ["myMemberships", user.email] });
    qc.invalidateQueries({ queryKey: ["groups"] });
    setActiveMembership(newMember);
  };

  const handleLeave = async () => {
    if (!user || !activeGroup) return;
    const mem = membershipMap[activeGroup.id];
    if (!mem) return;
    await base44.entities.GroupMember.delete(mem.id);
    await base44.entities.Group.update(activeGroup.id, { member_count: Math.max(0, (activeGroup.member_count || 1) - 1) });
    qc.invalidateQueries({ queryKey: ["myMemberships", user.email] });
    qc.invalidateQueries({ queryKey: ["groups"] });
    setActiveMembership(null);
    setActiveGroup(null);
  };

  const handleOpenGroup = (group) => {
    setActiveGroup(group);
    setActiveMembership(membershipMap[group.id] || null);
  };

  const handleCreated = (group) => {
    setShowCreate(false);
    qc.invalidateQueries({ queryKey: ["groups"] });
    qc.invalidateQueries({ queryKey: ["myMemberships", user?.email] });
    setActiveMembership({ role: "admin", group_id: group.id });
    setActiveGroup(group);
  };

  const filteredGroups = groups.filter(g => {
    const matchSearch = !search || g.name.toLowerCase().includes(search.toLowerCase()) || g.description?.toLowerCase().includes(search.toLowerCase());
    if (filterTab === "My Groups") return matchSearch && !!membershipMap[g.id];
    if (filterTab === "Trending") return matchSearch && (g.member_count || 0) >= 2;
    return matchSearch;
  });

  // Show GroupHub if a group is selected
  if (activeGroup) {
    return (
      <GroupHub
        group={activeGroup}
        user={user}
        membership={activeMembership}
        isMember={!!activeMembership}
        onBack={() => setActiveGroup(null)}
        onJoin={() => handleJoin(activeGroup)}
        onLeave={handleLeave}
      />
    );
  }

  return (
    <div style={{ backgroundColor: "var(--bg-app)", minHeight: "100dvh", paddingBottom: 88 }}>
      {/* Header */}
      <div className="px-4 pt-5 pb-3" style={{ backgroundColor: "var(--bg-card)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Groups</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>Find your community</p>
          </div>
          {user && (
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)", boxShadow: "0 3px 12px rgba(46,107,79,0.3)" }}>
              <Plus className="w-4 h-4" /> New
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-hint)" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search groups…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {FILTER_TABS.map(tab => (
            <button key={tab} onClick={() => setFilterTab(tab)}
              className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
              style={{
                backgroundColor: filterTab === tab ? "var(--accent-primary)" : "var(--bg-subtle)",
                color: filterTab === tab ? "#fff" : "var(--text-secondary)",
              }}>
              {tab === "Trending" && <Flame className="w-3 h-3 inline mr-1" />}
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="px-3 pt-4">
        {filteredGroups.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-5xl mb-3">👥</div>
            <p className="font-bold text-base mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              {filterTab === "My Groups" ? "You haven't joined any groups yet" : "No groups found"}
            </p>
            <p className="text-sm mb-4" style={{ color: "var(--text-hint)" }}>
              {filterTab === "My Groups" ? "Explore and join a group below!" : "Be the first to create one!"}
            </p>
            {user && (
              <button onClick={() => setShowCreate(true)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: "var(--accent-primary)" }}>
                Create a Group
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredGroups.map(group => (
              <GroupCard
                key={group.id}
                group={group}
                membership={membershipMap[group.id]}
                onOpen={handleOpenGroup}
              />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreate && user && (
          <CreateGroupModal user={user} onClose={() => setShowCreate(false)} onCreated={handleCreated} />
        )}
      </AnimatePresence>
    </div>
  );
}