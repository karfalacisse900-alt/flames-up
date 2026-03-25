import React, { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, X } from "lucide-react";
import GroupHub from "@/components/groups/GroupHub";
import CreateGroupModal from "@/components/groups/CreateGroupModal";
import GroupGridCard from "@/components/groups/GroupGridCard";
import GroupDetailModal from "@/components/groups/GroupDetailModal";

const TABS = [
  { key: "for_you", label: "For you" },
  { key: "popular", label: "Most popular" },
];

const CATEGORY_SECTIONS = [
  { key: "sports",  label: "Sport communities",   emoji: "🏃" },
  { key: "fitness", label: "Fitness communities",  emoji: "💪" },
  { key: "food",    label: "Food communities",     emoji: "🍕" },
  { key: "music",   label: "Music communities",    emoji: "🎵" },
  { key: "tech",    label: "Tech communities",     emoji: "💻" },
  { key: "art",     label: "Art communities",      emoji: "🎨" },
  { key: "travel",  label: "Travel communities",   emoji: "✈️" },
  { key: "gaming",  label: "Gaming communities",   emoji: "🎮" },
];

export default function Groups() {
  const [user, setUser] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);
  const [activeMembership, setActiveMembership] = useState(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("for_you");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailGroup, setDetailGroup] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
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
  const myGroupsCount = myGroups.length;

  // Filter by search
  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groups;
    const q = search.toLowerCase();
    return groups.filter(g =>
      g.name?.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q)
    );
  }, [groups, search]);

  // Sort by tab
  const sortedGroups = useMemo(() => {
    if (activeTab === "popular") return [...filteredGroups].sort((a, b) => (b.member_count || 0) - (a.member_count || 0));
    // For you: mix member groups first, then discover
    const mine = filteredGroups.filter(g => membershipMap[g.id]);
    const discover = filteredGroups.filter(g => !membershipMap[g.id]);
    return [...mine, ...discover];
  }, [filteredGroups, activeTab, membershipMap]);

  // Group by category for sections
  const groupsByCategory = useMemo(() => {
    const map = {};
    CATEGORY_SECTIONS.forEach(cat => {
      const list = sortedGroups.filter(g => g.category === cat.key);
      if (list.length > 0) map[cat.key] = list;
    });
    // "Other" catch-all
    const knownCats = new Set(CATEGORY_SECTIONS.map(c => c.key));
    const others = sortedGroups.filter(g => !knownCats.has(g.category));
    if (others.length > 0) map["__other"] = others;
    return map;
  }, [sortedGroups]);

  if (activeGroup) {
    return (
      <GroupHub group={activeGroup} user={user} membership={activeMembership}
        isMember={!!activeMembership} onBack={() => setActiveGroup(null)}
        onJoin={() => handleJoin(activeGroup)} onLeave={handleLeave} />
    );
  }

  // First name
  const firstName = user?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";

  return (
    <div style={{ minHeight: "100dvh", backgroundColor: "#ffffff", paddingBottom: 88 }}>
      {/* ── Header ── */}
      <div className="px-5 pt-5 pb-4" style={{ paddingTop: "max(env(safe-area-inset-top, 20px), 20px)" }}>
        <div className="flex items-center justify-between">
          {/* User greeting */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-base font-bold text-white"
                style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
                {user.profile_image_url
                  ? <img src={user.profile_image_url} alt="" className="w-full h-full object-cover" />
                  : (user.full_name?.[0] || user.email?.[0] || "U").toUpperCase()
                }
              </div>
            )}
            <div>
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>Welcome back,</p>
              <p className="text-base font-bold leading-tight" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                {firstName}
              </p>
            </div>
          </div>

          {/* Search icon */}
          <button onClick={() => setShowSearch(v => !v)}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "var(--bg-subtle)" }}>
            <Search className="w-4.5 h-4.5" style={{ color: "var(--text-secondary)", width: 18, height: 18 }} />
          </button>
        </div>

        {/* Search bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }} style={{ overflow: "hidden" }}>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl mt-3"
                style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
                <Search className="w-4 h-4 shrink-0" style={{ color: "var(--text-hint)" }} />
                <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search communities…"
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: "var(--text-primary)" }} />
                {search && <button onClick={() => setSearch("")}><X className="w-4 h-4" style={{ color: "var(--text-hint)" }} /></button>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab bar + Create */}
        <div className="flex items-center gap-3 mt-4">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={{
                backgroundColor: activeTab === tab.key ? "var(--text-primary)" : "transparent",
                color: activeTab === tab.key ? "#fff" : "var(--text-secondary)",
                border: activeTab === tab.key ? "none" : "1px solid var(--border-light)",
              }}>
              {tab.label}
            </button>
          ))}
          <button onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1.5 ml-auto"
            style={{ backgroundColor: "#EEF2FF", color: "#4F46E5", border: "none" }}>
            <Plus className="w-3.5 h-3.5" /> Create
          </button>
        </div>
      </div>

      {/* ── My Groups strip (if member of any) ── */}
      {myGroupsCount > 0 && !search && (
        <div className="px-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-base" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              My communities
            </p>
            <span className="text-sm font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
              {myGroupsCount} active
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {myGroups.slice(0, 4).map(group => (
              <GroupGridCard key={group.id} group={group} onClick={() => handleOpenGroup(group)} />
            ))}
          </div>
        </div>
      )}

      {/* ── Category Sections ── */}
      <div className="px-5">
        {search ? (
          // Search results — flat grid
          <>
            <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "var(--text-hint)" }}>
              {filteredGroups.length} results
            </p>
            <div className="grid grid-cols-2 gap-4">
              {filteredGroups.map(group => (
                <GroupGridCard key={group.id} group={group}
                  onClick={() => membershipMap[group.id] ? handleOpenGroup(group) : setDetailGroup(group)} />
              ))}
            </div>
            {filteredGroups.length === 0 && (
              <div className="py-16 text-center">
                <div className="text-4xl mb-3">🔍</div>
                <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>No communities found</p>
              </div>
            )}
          </>
        ) : (
          CATEGORY_SECTIONS.map(cat => {
            const list = groupsByCategory[cat.key];
            if (!list || list.length === 0) return null;
            const myCount = list.filter(g => membershipMap[g.id]).length;
            return (
              <section key={cat.key} className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-base" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                    {cat.emoji} {cat.label}
                  </h2>
                  {myCount > 0 && (
                    <span className="text-sm font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
                      {myCount} active
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {list.slice(0, 6).map(group => (
                    <GroupGridCard key={group.id} group={group}
                      onClick={() => membershipMap[group.id] ? handleOpenGroup(group) : setDetailGroup(group)} />
                  ))}
                </div>
              </section>
            );
          })
        )}

        {/* Other / uncategorized */}
        {!search && groupsByCategory["__other"]?.length > 0 && (
          <section className="mb-8">
            <h2 className="font-bold text-base mb-3" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              💬 Other communities
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {groupsByCategory["__other"].slice(0, 6).map(group => (
                <GroupGridCard key={group.id} group={group}
                  onClick={() => membershipMap[group.id] ? handleOpenGroup(group) : setDetailGroup(group)} />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {!search && Object.keys(groupsByCategory).length === 0 && (
          <div className="py-20 text-center">
            <div className="text-5xl mb-4">🏘️</div>
            <p className="font-bold text-lg mb-2" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              No communities yet
            </p>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
              Be the first to create one!
            </p>
            <button onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 rounded-2xl text-sm font-bold text-white"
              style={{ backgroundColor: "var(--accent-primary)" }}>
              Create a Community
            </button>
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