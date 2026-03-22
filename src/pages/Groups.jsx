import React, { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePullToRefresh } from "@/components/hooks/usePullToRefresh";
import {
  Search, Plus, Users, Lock, MapPin, Globe, Flame,
  Star, Filter, DollarSign, X
} from "lucide-react";
import GroupHub from "@/components/groups/GroupHub";
import TrendingGroupCard from "@/components/groups/TrendingGroupCard";
import CreateGroupModal from "@/components/groups/CreateGroupModal";
import GroupStatusBar from "@/components/groups/GroupStatusBar";
import GroupDetailModal from "@/components/groups/GroupDetailModal";

const CATEGORY_TABS = [
  { key: "all",      label: "All",      emoji: "✨" },
  { key: "fitness",  label: "Fitness",  emoji: "💪" },
  { key: "food",     label: "Food",     emoji: "🍕" },
  { key: "travel",   label: "Travel",   emoji: "✈️" },
  { key: "tech",     label: "Tech",     emoji: "💻" },
  { key: "art",      label: "Art",      emoji: "🎨" },
  { key: "music",    label: "Music",    emoji: "🎵" },
  { key: "gaming",   label: "Gaming",   emoji: "🎮" },
  { key: "movies",   label: "Movies",   emoji: "🎬" },
  { key: "sports",   label: "Sports",   emoji: "⚽" },
];

const CATEGORY_GRADIENTS = {
  fitness: ["#0d9488","#16a34a"], food: ["#ea580c","#d97706"],
  travel:  ["#0284c7","#6d28d9"], tech: ["#0284c7","#0369a1"],
  art:     ["#7c3aed","#a21caf"], music: ["#db2777","#be185d"],
  gaming:  ["#16a34a","#15803d"], movies: ["#7c3aed","#4338ca"],
  sports:  ["#ea580c","#dc2626"], general: ["#64748b","#475569"],
};
function getGrad(cat) {
  const [a, b] = CATEGORY_GRADIENTS[cat] || CATEGORY_GRADIENTS.general;
  return `linear-gradient(135deg, ${a}, ${b})`;
}

// Compact list card for My Groups section
function GroupCard({ group, membership, onOpen, onJoin }) {
  const isMember = !!membership;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      onClick={() => onOpen(group)}
      className="cursor-pointer p-4 rounded-2xl"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
      <div className="flex gap-3">
        <div className="w-14 h-14 rounded-xl shrink-0 flex items-center justify-center text-2xl"
          style={{ background: getGrad(group.category) }}>
          {group.emoji || "💬"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-sm truncate" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{group.name}</h3>
            {group.is_private && <Lock className="w-3 h-3 shrink-0" style={{ color: "var(--text-hint)" }} />}
          </div>
          <p className="text-xs line-clamp-1 mb-1.5" style={{ color: "var(--text-hint)" }}>{group.description || "No description"}</p>
          <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--text-hint)" }}>
            <span className="flex items-center gap-0.5">
              {group.group_type === "realworld" ? <MapPin className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
              {group.group_type === "realworld" ? "Real-World" : "Online"}
            </span>
            <span>·</span>
            <span><Users className="w-2.5 h-2.5 inline mr-0.5" />{(group.member_count || 0).toLocaleString()}</span>
          </div>
        </div>
        {isMember ? (
          <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full" style={{ backgroundColor: "var(--accent-primary-light)" }}>
            <span className="text-sm font-bold" style={{ color: "var(--accent-primary)" }}>✓</span>
          </div>
        ) : (
          <button onClick={e => { e.stopPropagation(); onJoin(group); }}
            className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold text-white active:scale-95"
            style={{ backgroundColor: "var(--accent-primary)" }}>Join</button>
        )}
      </div>
    </motion.div>
  );
}

export default function Groups() {
  const [user, setUser] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);
  const [activeMembership, setActiveMembership] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDiscoverFilters, setShowDiscoverFilters] = useState(false);
  const [dismissedGroupIds, setDismissedGroupIds] = useState([]);
  const [detailGroup, setDetailGroup] = useState(null);
  const qc = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: groups = [] } = useQuery({
    queryKey: ["groups"],
    queryFn: () => base44.entities.Group.filter({ is_active: true }, "-member_count", 200),
  });

  const { data: myMemberships = [] } = useQuery({
    queryKey: ["myMemberships", user?.email],
    queryFn: () => base44.entities.GroupMember.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const membershipMap = useMemo(() => Object.fromEntries(myMemberships.map(m => [m.group_id, m])), [myMemberships]);

  const handleJoin = async (group) => {
    if (!user || membershipMap[group.id]) return;
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
    setDetailGroup(null);
  };

  const handleCreated = (group) => {
    setShowCreateModal(false);
    qc.invalidateQueries({ queryKey: ["groups"] });
    qc.invalidateQueries({ queryKey: ["myMemberships", user?.email] });
    setActiveMembership({ role: "admin", group_id: group.id });
    setActiveGroup(group);
  };

  const myGroups = useMemo(() => groups.filter(g => membershipMap[g.id]), [groups, membershipMap]);
  
  // All non-member groups go to swipe explore — apply filters
  const discoverGroups = useMemo(() => {
    let list = groups.filter(g => !membershipMap[g.id] && !dismissedGroupIds.includes(g.id));
    if (categoryFilter !== "all") list = list.filter(g => g.category === categoryFilter);
    if (typeFilter !== "all") list = list.filter(g => g.group_type === typeFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(g => g.name.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q));
    }
    return list;
  }, [groups, membershipMap, dismissedGroupIds, categoryFilter, typeFilter, search]);

  const filteredMyGroups = useMemo(() => {
    if (!search) return myGroups;
    const q = search.toLowerCase();
    return myGroups.filter(g => g.name.toLowerCase().includes(q));
  }, [myGroups, search]);

  const isFiltering = search || categoryFilter !== "all" || typeFilter !== "all";

  const { containerProps, PullIndicator } = usePullToRefresh(async () => {
    await qc.invalidateQueries({ queryKey: ["groups"] });
    await qc.invalidateQueries({ queryKey: ["myMemberships", user?.email] });
  });

  if (activeGroup) {
    return (
      <GroupHub group={activeGroup} user={user} membership={activeMembership}
        isMember={!!activeMembership} onBack={() => setActiveGroup(null)}
        onJoin={() => handleJoin(activeGroup)} onLeave={handleLeave} />
    );
  }

  return (
    <div {...containerProps} style={{ minHeight: "100dvh", paddingBottom: 88, backgroundColor: "var(--bg-app)" }}>
      <PullIndicator />

      {/* ── Header ── */}
      <div className="relative px-5 pt-6 pb-2" style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 24px)" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Groups</h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Join & create communities</p>
          </div>
          {user && (
            <button onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-bold text-white"
              style={{ backgroundColor: "var(--accent-primary)" }}>
              <Plus className="w-4 h-4" /> Create
            </button>
          )}
        </div>
      </div>

      {/* ── Group Status Bar (replaces category icons) ── */}
      {user && myGroups.length > 0 && (
        <div style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <GroupStatusBar user={user} groups={groups} membershipMap={membershipMap} />
        </div>
      )}

      {/* Search */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <Search className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search groups…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--text-primary)" }} />
          {search && <button onClick={() => setSearch("")}><X className="w-4 h-4" style={{ color: "var(--text-hint)" }} /></button>}
        </div>
      </div>

      {/* Filter toggle */}
      <div className="px-4 pb-3 flex items-center gap-2">
        <button onClick={() => setShowDiscoverFilters(v => !v)}
          className="flex items-center gap-1.5 px-3 rounded-full text-xs font-semibold"
          style={{
            minHeight: 44,
            backgroundColor: showDiscoverFilters ? "var(--accent-primary)" : "var(--bg-card)",
            color: showDiscoverFilters ? "#fff" : "var(--text-secondary)",
            border: `1px solid ${showDiscoverFilters ? "var(--accent-primary)" : "var(--border-light)"}`,
          }}>
          <Filter className="w-3 h-3" /> Filters
          {(typeFilter !== "all" || categoryFilter !== "all") && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />}
        </button>
        {(typeFilter !== "all" || categoryFilter !== "all") && (
          <button onClick={() => { setTypeFilter("all"); setCategoryFilter("all"); }}
            className="text-xs font-semibold px-2 py-1 rounded-full"
            style={{ color: "var(--accent-primary)", backgroundColor: "var(--accent-primary-light)" }}>
            Clear
          </button>
        )}
      </div>

      {/* Collapsible filters */}
      <AnimatePresence>
        {showDiscoverFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}>
            <div className="flex gap-2 px-4 pb-1 overflow-x-auto scrollbar-hide">
              {[{ key: "all", label: "All" }, { key: "realworld", label: "📍 Real-World" }, { key: "online", label: "🌐 Online" }].map(t => (
                <button key={t.key} onClick={() => setTypeFilter(t.key)}
                  className="shrink-0 px-3 rounded-full text-xs font-semibold"
                  style={{
                    minHeight: 44,
                    backgroundColor: typeFilter === t.key ? "var(--accent-primary)" : "var(--bg-card)",
                    color: typeFilter === t.key ? "#fff" : "var(--text-secondary)",
                    border: "1px solid var(--border-light)",
                  }}>{t.label}</button>
              ))}
            </div>
            <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide">
              {CATEGORY_TABS.map(c => (
                <button key={c.key} onClick={() => setCategoryFilter(c.key)}
                  className="shrink-0 flex items-center gap-1 px-3 rounded-full text-xs font-semibold"
                  style={{
                    minHeight: 44,
                    backgroundColor: categoryFilter === c.key ? "var(--accent-primary)" : "var(--bg-card)",
                    color: categoryFilter === c.key ? "#fff" : "var(--text-secondary)",
                    border: "1px solid var(--border-light)",
                  }}>{c.emoji} {c.label}</button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Content ── */}
      <div className="px-4 pt-2 pb-6">

        {/* Discover / Swipe to Explore — ALL non-member groups (with filters) */}
        {discoverGroups.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3 px-0.5">
              <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--text-hint)" }}>
                <Flame className="w-3.5 h-3.5 text-orange-500" /> Discover Groups
              </p>
              <span className="text-[11px] font-semibold" style={{ color: "var(--text-hint)" }}>
                {discoverGroups.length} groups · Swipe to explore
              </span>
            </div>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-4 px-4 pb-2">
              {discoverGroups.map(group => (
                <div key={group.id} className="shrink-0 snap-center w-[82vw] max-w-[360px]">
                  <div onClick={() => setDetailGroup(group)} className="cursor-pointer">
                    <TrendingGroupCard
                      group={group}
                      onDismiss={() => setDismissedGroupIds(prev => [...prev, group.id])}
                      onJoin={handleJoin}
                      onOpen={(g) => setDetailGroup(g)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* My Groups */}
        {filteredMyGroups.length > 0 && (
          <section className="mb-6">
            <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-3" style={{ color: "var(--text-hint)" }}>
              <Star className="w-3.5 h-3.5" style={{ color: "var(--accent-secondary)" }} /> My Groups ({filteredMyGroups.length})
            </p>
            <div className="space-y-2">
              {filteredMyGroups.map(g => (
                <GroupCard key={g.id} group={g} membership={membershipMap[g.id]}
                  onOpen={handleOpenGroup} onJoin={handleJoin} />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {discoverGroups.length === 0 && filteredMyGroups.length === 0 && (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <p className="font-bold text-sm mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>No groups found</p>
            {user && (
              <button onClick={() => setShowCreateModal(true)}
                className="mt-4 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: "var(--accent-primary)" }}>Create a New Group</button>
            )}
          </div>
        )}
      </div>

      {/* Group Detail Modal */}
      {detailGroup && (
        <GroupDetailModal
          group={detailGroup}
          isMember={!!membershipMap[detailGroup.id]}
          onClose={() => setDetailGroup(null)}
          onJoin={handleJoin}
          onOpen={handleOpenGroup}
        />
      )}

      <CreateGroupModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onCreated={handleCreated} user={user} />
    </div>
  );
}