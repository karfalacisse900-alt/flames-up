import React, { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, X } from "lucide-react";
import GroupHub from "@/components/groups/GroupHub";
import CreateGroupModal from "@/components/groups/CreateGroupModal";
import GroupGridCard from "@/components/groups/GroupGridCard";
import GroupDetailModal from "@/components/groups/GroupDetailModal";
import TrendingGroupsSwiper from "@/components/groups/TrendingGroupsSwiper";

const TABS = [
  { key: "discover", label: "Discover" },
  { key: "my_groups", label: "My Groups" },
  { key: "trending", label: "Trending" },
];

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "sports", label: "Sports" },
  { key: "fitness", label: "Fitness" },
  { key: "food", label: "Food" },
  { key: "music", label: "Music" },
  { key: "tech", label: "Tech" },
  { key: "art", label: "Art" },
  { key: "travel", label: "Travel" },
  { key: "gaming", label: "Gaming" },
  { key: "movies", label: "Movies" },
  { key: "general", label: "General" },
];

export default function Groups() {
  const [user, setUser] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);
  const [activeMembership, setActiveMembership] = useState(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("discover");
  const [activeCategory, setActiveCategory] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailGroup, setDetailGroup] = useState(null);
  const [showTrending, setShowTrending] = useState(false);
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

  // Live streams query for badges
  const { data: activeStreams = [] } = useQuery({
    queryKey: ["groupActiveLive"],
    queryFn: () => base44.entities.LiveStream.filter({ is_active: true }, "-created_date", 50),
    refetchInterval: 15000,
  });

  const liveGroupIds = useMemo(() => new Set(activeStreams.map(s => s.group_id)), [activeStreams]);
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
    return newMember;
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

  if (activeGroup) {
    return (
      <GroupHub group={activeGroup} user={user} membership={activeMembership}
        isMember={!!activeMembership} onBack={() => setActiveGroup(null)}
        onJoin={() => handleJoin(activeGroup)} onLeave={handleLeave} />
    );
  }

  const myGroups = groups.filter(g => membershipMap[g.id]);
  const notMyGroups = groups.filter(g => !membershipMap[g.id]);

  const applyFilters = (list) => {
    let result = list;
    if (activeCategory !== "all") result = result.filter(g => g.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(g => g.name?.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q));
    }
    return result;
  };

  const discoverGroups = applyFilters(notMyGroups);
  const myFilteredGroups = applyFilters(myGroups);

  const trendingGroups = [...groups].sort((a, b) => (b.member_count || 0) - (a.member_count || 0)).slice(0, 20);

  if (showTrending) {
    return (
      <TrendingGroupsSwiper
        groups={trendingGroups}
        membershipMap={membershipMap}
        onDismiss={() => {}}
        onJoin={handleJoin}
        onClose={() => setShowTrending(false)}
      />
    );
  }

  return (
    <div style={{ minHeight: "100dvh", backgroundColor: "var(--bg-app)", paddingBottom: 88 }}>
      {/* Header */}
      <div className="px-4 sticky top-0 z-20"
        style={{ paddingTop: "max(env(safe-area-inset-top, 12px), 12px)", paddingBottom: 12,
          backgroundColor: "var(--bg-nav)", backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center justify-between mb-3">
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
            Groups
          </h1>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setSearch(s => s ? "" : " ")}
              style={{ width: 36, height: 36, borderRadius: "50%", border: "none",
                backgroundColor: "var(--bg-subtle)", display: "flex", alignItems: "center",
                justifyContent: "center", cursor: "pointer" }}>
              <Search style={{ width: 17, height: 17, color: "var(--text-secondary)" }} />
            </button>
            <button onClick={() => setShowCreateModal(true)}
              style={{ width: 36, height: 36, borderRadius: "50%", border: "none",
                backgroundColor: "var(--accent-primary)", display: "flex", alignItems: "center",
                justifyContent: "center", cursor: "pointer" }}>
              <Plus style={{ width: 17, height: 17, color: "#fff" }} />
            </button>
          </div>
        </div>

        {/* Search input */}
        {search.trim() !== "" || search === " " ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px",
            borderRadius: 14, backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)",
            marginBottom: 10 }}>
            <Search style={{ width: 15, height: 15, color: "var(--text-hint)", flexShrink: 0 }} />
            <input autoFocus value={search.trim() === "" ? "" : search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search groups…"
              style={{ flex: 1, background: "transparent", border: "none", outline: "none",
                fontSize: 14, color: "var(--text-primary)", minHeight: "unset", boxShadow: "none", padding: 0 }} />
            <button onClick={() => setSearch("")}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              <X style={{ width: 15, height: 15, color: "var(--text-hint)" }} />
            </button>
          </div>
        ) : null}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4 }}>
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); if (tab.key === "trending") setShowTrending(true); }}
              style={{ padding: "8px 16px", borderRadius: 999, border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 600, transition: "all 0.15s",
                backgroundColor: activeTab === tab.key ? "var(--accent-primary)" : "transparent",
                color: activeTab === tab.key ? "#fff" : "var(--text-secondary)" }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category filter strip */}
      <div style={{ overflowX: "auto", padding: "10px 16px", display: "flex", gap: 8 }}
        className="scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button key={cat.key} onClick={() => setActiveCategory(cat.key)}
            style={{ whiteSpace: "nowrap", padding: "6px 14px", borderRadius: 999, cursor: "pointer",
              fontSize: 13, fontWeight: 600, border: "1.5px solid",
              borderColor: activeCategory === cat.key ? "var(--accent-primary)" : "var(--border-light)",
              backgroundColor: activeCategory === cat.key ? "var(--accent-primary-light)" : "var(--bg-card)",
              color: activeCategory === cat.key ? "var(--accent-primary)" : "var(--text-secondary)" }}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "4px 16px" }}>
        {activeTab === "my_groups" ? (
          <>
            {myFilteredGroups.length === 0 ? (
              <div style={{ textAlign: "center", paddingTop: 60 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🏘️</div>
                <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-serif)", marginBottom: 8 }}>
                  No groups yet
                </p>
                <p style={{ fontSize: 14, color: "var(--text-hint)", marginBottom: 20 }}>
                  Discover and join groups that interest you
                </p>
                <button onClick={() => setActiveTab("discover")}
                  style={{ padding: "11px 24px", borderRadius: 14, backgroundColor: "var(--accent-primary)",
                    color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer" }}>
                  Discover Groups
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, paddingTop: 4 }}>
                {myFilteredGroups.map(g => (
                  <GroupGridCard key={g.id} group={g} isLive={liveGroupIds.has(g.id)}
                    onClick={() => handleOpenGroup(g)} />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Live groups section */}
            {liveGroupIds.size > 0 && activeCategory === "all" && !search && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#EF4444", display: "inline-block" }} />
                  <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                    Live Now
                  </p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {groups.filter(g => liveGroupIds.has(g.id)).map(g => (
                    <GroupGridCard key={g.id} group={g} isLive={true}
                      onClick={() => membershipMap[g.id] ? handleOpenGroup(g) : setDetailGroup(g)} />
                  ))}
                </div>
              </div>
            )}

            {/* All / discover groups */}
            {discoverGroups.length === 0 ? (
              <div style={{ textAlign: "center", paddingTop: 60 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                  No groups found
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, paddingTop: 4 }}>
                {discoverGroups.map(g => (
                  <GroupGridCard key={g.id} group={g} isLive={liveGroupIds.has(g.id)}
                    onClick={() => setDetailGroup(g)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {detailGroup && (
        <GroupDetailModal group={detailGroup} isMember={!!membershipMap[detailGroup.id]}
          onClose={() => setDetailGroup(null)} onJoin={handleJoin} onOpen={handleOpenGroup} />
      )}

      <CreateGroupModal open={showCreateModal} onClose={() => setShowCreateModal(false)}
        onCreated={handleCreated} user={user} />
    </div>
  );
}