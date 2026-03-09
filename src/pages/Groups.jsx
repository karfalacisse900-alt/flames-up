import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Users, Lock, Flame, MapPin, Globe, Filter } from "lucide-react";
import GroupHub from "@/components/groups/GroupHub";
import CreateGroupModal from "@/components/groups/CreateGroupModal";

const CATEGORY_COLORS = {
  fitness: "linear-gradient(135deg, #0d9488, #16a34a)",
  food: "linear-gradient(135deg, #ea580c, #d97706)",
  travel: "linear-gradient(135deg, #0284c7, #6d28d9)",
  study: "linear-gradient(135deg, #d97706, #b45309)",
  tech: "linear-gradient(135deg, #0284c7, #0369a1)",
  art: "linear-gradient(135deg, #7c3aed, #a21caf)",
  music: "linear-gradient(135deg, #db2777, #be185d)",
  gaming: "linear-gradient(135deg, #16a34a, #15803d)",
  books: "linear-gradient(135deg, #d97706, #b45309)",
  movies: "linear-gradient(135deg, #7c3aed, #4338ca)",
  health: "linear-gradient(135deg, #0d9488, #16a34a)",
  sports: "linear-gradient(135deg, #ea580c, #dc2626)",
  relationships: "linear-gradient(135deg, #e11d48, #db2777)",
  motivation: "linear-gradient(135deg, #d97706, #ea580c)",
  general: "linear-gradient(135deg, #64748b, #475569)",
};

const CATEGORY_TABS = [
  { key: "all", label: "All", emoji: "✨" },
  { key: "fitness", label: "Fitness", emoji: "💪" },
  { key: "food", label: "Food", emoji: "🍕" },
  { key: "travel", label: "Travel", emoji: "✈️" },
  { key: "study", label: "Study", emoji: "📚" },
  { key: "tech", label: "Tech", emoji: "💻" },
  { key: "art", label: "Art", emoji: "🎨" },
  { key: "music", label: "Music", emoji: "🎵" },
  { key: "gaming", label: "Gaming", emoji: "🎮" },
  { key: "movies", label: "Movies", emoji: "🎬" },
  { key: "sports", label: "Sports", emoji: "⚽" },
];

function GroupCard({ group, membership, onOpen, onJoinDirect }) {
  const grad = group.cover_color || CATEGORY_COLORS[group.category] || CATEGORY_COLORS.general;
  const isMember = !!membership;
  const isRealWorld = group.group_type === "realworld";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onOpen(group)}
      className="cursor-pointer rounded-2xl overflow-hidden active:scale-[0.99] transition-transform"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>

      {/* Cover */}
      <div className="relative h-24 overflow-hidden">
        {group.cover_image_url ? (
          <img src={group.cover_image_url} alt={group.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full" style={{ background: grad }} />
        )}
        {/* Type badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
          style={{ backgroundColor: "rgba(0,0,0,0.45)", color: "#fff" }}>
          {isRealWorld ? <><MapPin className="w-2.5 h-2.5" /> Real-World</> : <><Globe className="w-2.5 h-2.5" /> Online</>}
        </div>
        {group.is_private && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
            style={{ backgroundColor: "rgba(0,0,0,0.45)", color: "#fff" }}>
            🔒
          </div>
        )}
        {/* Emoji */}
        <div className="absolute -bottom-5 left-3 w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{ backgroundColor: "var(--bg-card)", border: "2px solid var(--bg-card)", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
          {group.emoji || "💬"}
        </div>
      </div>

      {/* Content */}
      <div className="px-3 pt-7 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm leading-tight mb-0.5 truncate" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              {group.name}
            </h3>
            {group.description && (
              <p className="text-xs line-clamp-1 mb-1.5" style={{ color: "var(--text-hint)" }}>{group.description}</p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 text-[11px]" style={{ color: "var(--text-hint)" }}>
                <Users className="w-3 h-3" />
                <span>{(group.member_count || 0).toLocaleString()}</span>
              </div>
              {isRealWorld && group.location_city && (
                <div className="flex items-center gap-0.5 text-[11px]" style={{ color: "var(--accent-primary)" }}>
                  <MapPin className="w-2.5 h-2.5" />
                  <span>{group.location_city}</span>
                </div>
              )}
              {group.meeting_schedule && (
                <span className="text-[11px]" style={{ color: "var(--text-hint)" }}>📅 {group.meeting_schedule}</span>
              )}
            </div>
          </div>
          {isMember ? (
            <span className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
              Joined
            </span>
          ) : (
            <button
              onClick={e => { e.stopPropagation(); onJoinDirect(group); }}
              className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full text-white active:scale-95 transition-transform"
              style={{ backgroundColor: "var(--accent-primary)" }}>
              Join
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function GroupListRow({ group, membership, onOpen, onJoinDirect }) {
  const grad = group.cover_color || CATEGORY_COLORS[group.category] || CATEGORY_COLORS.general;
  const isMember = !!membership;
  const isRealWorld = group.group_type === "realworld";

  return (
    <div
      onClick={() => onOpen(group)}
      className="flex items-center gap-3 px-4 py-3.5 cursor-pointer active:scale-[0.99] transition-transform"
      style={{ backgroundColor: "var(--bg-card)", borderBottom: "1px solid var(--border-subtle)" }}>
      {/* Icon */}
      <div className="shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-xl relative overflow-hidden"
        style={{ flexShrink: 0 }}>
        {group.cover_image_url ? (
          <img src={group.cover_image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: grad }}>
            <span>{group.emoji || "💬"}</span>
          </div>
        )}
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
          <p className="text-xs line-clamp-1 mb-0.5" style={{ color: "var(--text-hint)" }}>{group.description}</p>
        )}
        <div className="flex items-center gap-2 text-[11px] flex-wrap" style={{ color: "var(--text-hint)" }}>
          {isRealWorld ? (
            <span className="flex items-center gap-0.5" style={{ color: "var(--accent-primary)" }}>
              <MapPin className="w-2.5 h-2.5" />
              {group.location_city || "Real World"}
            </span>
          ) : (
            <span className="flex items-center gap-0.5"><Globe className="w-2.5 h-2.5" /> Online</span>
          )}
          <span>·</span>
          <span><Users className="w-2.5 h-2.5 inline mr-0.5" />{(group.member_count || 0).toLocaleString()}</span>
          <span>·</span>
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
          className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-full text-white active:scale-95 transition-transform"
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
  const [filterTab, setFilterTab] = useState("all");    // "all" | "my" | "trending" | "nearby"
  const [typeFilter, setTypeFilter] = useState("all");  // "all" | "online" | "realworld"
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("list"); // "list" | "grid"
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: groups = [] } = useQuery({
    queryKey: ["groups"],
    queryFn: () => base44.entities.Group.filter({ is_active: true }, "-member_count", 200),
  });

  const { data: myMemberships = [] } = useQuery({
    queryKey: ["myMemberships", user?.email],
    queryFn: () => base44.entities.GroupMember.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const membershipMap = Object.fromEntries(myMemberships.map(m => [m.group_id, m]));

  const handleJoin = async (group) => {
    if (!user) return;
    if (membershipMap[group.id]) return;
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
    if (!matchSearch) return false;
    if (filterTab === "my") return !!membershipMap[g.id];
    if (filterTab === "trending") return (g.member_count || 0) >= 2;
    if (filterTab === "nearby") return g.group_type === "realworld";
    if (typeFilter !== "all" && g.group_type !== typeFilter) return false;
    if (categoryFilter !== "all" && g.category !== categoryFilter) return false;
    return true;
  });

  const nearbyGroups = groups.filter(g => g.group_type === "realworld").slice(0, 4);
  const trendingGroups = [...groups].sort((a, b) => (b.member_count || 0) - (a.member_count || 0)).slice(0, 4);
  const myGroups = groups.filter(g => membershipMap[g.id]);

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
            <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>Communities & local meetups</p>
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
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search groups…"
            className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm outline-none"
            style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
          />
          <button onClick={() => setShowFilters(v => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{
              backgroundColor: (typeFilter !== "all" || categoryFilter !== "all") ? "var(--accent-primary)" : "var(--bg-subtle)",
              color: (typeFilter !== "all" || categoryFilter !== "all") ? "#fff" : "var(--text-hint)",
            }}>
            <Filter className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Filters panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-2">
              <div className="pb-2 space-y-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-hint)" }}>Type</p>
                  <div className="flex gap-2">
                    {[
                      { key: "all", label: "All Types" },
                      { key: "realworld", label: "📍 Real-World" },
                      { key: "online", label: "🌐 Online" },
                    ].map(t => (
                      <button key={t.key} onClick={() => setTypeFilter(t.key)}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                        style={{
                          backgroundColor: typeFilter === t.key ? "var(--accent-primary)" : "var(--bg-subtle)",
                          color: typeFilter === t.key ? "#fff" : "var(--text-secondary)",
                          border: "1px solid var(--border-light)",
                        }}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {[
            { key: "all", label: "All Groups" },
            { key: "my", label: "My Groups" },
            { key: "trending", label: "🔥 Trending" },
            { key: "nearby", label: "📍 Nearby" },
          ].map(tab => (
            <button key={tab.key} onClick={() => setFilterTab(tab.key)}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                backgroundColor: filterTab === tab.key ? "var(--accent-primary)" : "var(--bg-subtle)",
                color: filterTab === tab.key ? "#fff" : "var(--text-secondary)",
              }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category pills (only in "all" tab) */}
      {filterTab === "all" && (
        <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          {CATEGORY_TABS.map(c => (
            <button key={c.key} onClick={() => setCategoryFilter(c.key)}
              className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                backgroundColor: categoryFilter === c.key ? "var(--accent-primary)" : "var(--bg-card)",
                color: categoryFilter === c.key ? "#fff" : "var(--text-secondary)",
                border: "1px solid var(--border-light)",
              }}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      )}

      {/* Nearby spotlight */}
      {filterTab === "nearby" && nearbyGroups.length > 0 && (
        <div className="px-4 pt-4 pb-2">
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-hint)" }}>
            📍 Real-World Groups Near You
          </p>
          <div className="grid grid-cols-2 gap-3">
            {nearbyGroups.map(group => (
              <GroupCard key={group.id} group={group} membership={membershipMap[group.id]}
                onOpen={handleOpenGroup} onJoinDirect={handleJoin} />
            ))}
          </div>
          {nearbyGroups.length === 0 && (
            <div className="py-8 text-center">
              <div className="text-4xl mb-2">📍</div>
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>No nearby groups yet</p>
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>Create a real-world group in your city!</p>
            </div>
          )}
        </div>
      )}

      {/* Trending spotlight */}
      {filterTab === "trending" && (
        <div className="px-4 pt-4">
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-hint)" }}>
            🔥 Most Active Groups
          </p>
          {trendingGroups.length > 0 ? (
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border-light)" }}>
              {trendingGroups.map(group => (
                <GroupListRow key={group.id} group={group} membership={membershipMap[group.id]}
                  onOpen={handleOpenGroup} onJoinDirect={handleJoin} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-sm" style={{ color: "var(--text-hint)" }}>No groups yet — be the first!</p>
            </div>
          )}
        </div>
      )}

      {/* My groups */}
      {filterTab === "my" && (
        <div className="px-4 pt-4">
          {myGroups.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-5xl mb-3">👥</div>
              <p className="font-bold text-base mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                You haven't joined any groups yet
              </p>
              <p className="text-sm mb-4" style={{ color: "var(--text-hint)" }}>Explore and join a group!</p>
              <button onClick={() => setFilterTab("all")}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: "var(--accent-primary)" }}>
                Discover Groups
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {myGroups.map(group => (
                <GroupCard key={group.id} group={group} membership={membershipMap[group.id]}
                  onOpen={handleOpenGroup} onJoinDirect={handleJoin} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* All groups list */}
      {filterTab === "all" && (
        <div className="px-4 pt-4">
          {filteredGroups.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-5xl mb-3">🔍</div>
              <p className="font-bold text-base mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                No groups found
              </p>
              <p className="text-sm mb-4" style={{ color: "var(--text-hint)" }}>Try a different search or category</p>
              {user && (
                <button onClick={() => setShowCreate(true)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ backgroundColor: "var(--accent-primary)" }}>
                  Create a Group
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border-light)", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
              {filteredGroups.map(group => (
                <GroupListRow
                  key={group.id}
                  group={group}
                  membership={membershipMap[group.id]}
                  onOpen={handleOpenGroup}
                  onJoinDirect={handleJoin}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showCreate && user && (
          <CreateGroupModal user={user} onClose={() => setShowCreate(false)} onCreated={handleCreated} />
        )}
      </AnimatePresence>
    </div>
  );
}