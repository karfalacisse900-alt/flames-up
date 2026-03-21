import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { usePullToRefresh } from "@/components/hooks/usePullToRefresh";
import { createPageUrl } from "@/utils";
import {
  Search, Plus, Users, Lock, MapPin, Globe, Flame,
  Star, ChevronRight, Zap, Navigation, X, Filter, SlidersHorizontal, MessageCircle, DollarSign
} from "lucide-react";
import GroupHub from "@/components/groups/GroupHub";
import GroupMessageBubble from "@/components/groups/GroupMessageBubble";
import TrendingGroupCard from "@/components/groups/TrendingGroupCard";
import CreateGroupModal from "@/components/groups/CreateGroupModal";
import GroupReviewSection from "@/components/groups/GroupReviewSection";

// ── Constants ─────────────────────────────────────────────────────────────
const CATEGORY_GRADIENTS = {
  fitness:       ["#0d9488", "#16a34a"],
  food:          ["#ea580c", "#d97706"],
  travel:        ["#0284c7", "#6d28d9"],
  study:         ["#d97706", "#b45309"],
  tech:          ["#0284c7", "#0369a1"],
  art:           ["#7c3aed", "#a21caf"],
  music:         ["#db2777", "#be185d"],
  gaming:        ["#16a34a", "#15803d"],
  books:         ["#d97706", "#b45309"],
  movies:        ["#7c3aed", "#4338ca"],
  health:        ["#0d9488", "#16a34a"],
  sports:        ["#ea580c", "#dc2626"],
  relationships: ["#e11d48", "#db2777"],
  motivation:    ["#d97706", "#ea580c"],
  general:       ["#64748b", "#475569"],
};

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

const CATEGORY_EMOJIS = {
  fitness: "💪", food: "🍕", travel: "✈️", study: "📚", tech: "💻",
  art: "🎨", music: "🎵", gaming: "🎮", books: "📖", movies: "🎬",
  health: "🏃", sports: "⚽", relationships: "❤️", motivation: "🔥", general: "💬",
};

function getGrad(category) {
  const [a, b] = CATEGORY_GRADIENTS[category] || CATEGORY_GRADIENTS.general;
  return `linear-gradient(135deg, ${a}, ${b})`;
}

// ── Group Card Component ────────────────────────────────────────────────────
function GroupCard({ group, membership, onOpen, onJoin }) {
  const isMember = !!membership;
  const isPaid = group.is_paid && group.monthly_fee;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      onClick={() => onOpen(group)}
      className="cursor-pointer p-4 rounded-2xl"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
      
      <div className="flex gap-3">
        <div className="w-16 h-16 rounded-xl shrink-0 flex items-center justify-center text-3xl" style={{ background: getGrad(group.category), backgroundColor: "var(--bg-subtle)" }}>
          {group.emoji || "💬"}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-sm truncate" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{group.name}</h3>
            {group.is_private && <Lock className="w-3 h-3 shrink-0" style={{ color: "var(--text-hint)" }} />}
          </div>
          
          <p className="text-xs line-clamp-1 mb-2" style={{ color: "var(--text-hint)" }}>{group.description || "No description"}</p>
          
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]" style={{ color: "var(--text-hint)" }}>
            <span className="flex items-center gap-0.5">
              {group.group_type === "realworld" ? <MapPin className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
              {group.group_type === "realworld" ? "Real-World" : "Online"}
            </span>
            <span>·</span>
            <span><Users className="w-2.5 h-2.5 inline mr-0.5" />{(group.member_count || 0).toLocaleString()}</span>
            {isPaid && (
              <>
                <span>·</span>
                <span className="flex items-center gap-0.5"><DollarSign className="w-2.5 h-2.5" />${group.monthly_fee}/mo</span>
              </>
            )}
          </div>
        </div>

        {isMember ? (
          <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full" style={{ backgroundColor: "var(--accent-primary-light)" }}>
            <span className="text-sm font-bold" style={{ color: "var(--accent-primary)" }}>✓</span>
          </div>
        ) : (
          <button onClick={e => { e.stopPropagation(); onJoin(group); }}
            className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold text-white active:scale-95 transition-transform"
            style={{ backgroundColor: "var(--accent-primary)" }}>Join</button>
        )}
      </div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function Groups() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);
  const [activeMembership, setActiveMembership] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDiscoverFilters, setShowDiscoverFilters] = useState(false);
  const [dismissedGroupIds, setDismissedGroupIds] = useState([]);
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
  };

  const handleCreated = (group) => {
    setShowCreateModal(false);
    qc.invalidateQueries({ queryKey: ["groups"] });
    qc.invalidateQueries({ queryKey: ["myMemberships", user?.email] });
    setActiveMembership({ role: "admin", group_id: group.id });
    setActiveGroup(group);
  };

  const handleDismissDiscover = (group) => {
    setDismissedGroupIds(prev => prev.includes(group.id) ? prev : [...prev, group.id]);
  };

  const myGroups = useMemo(() => groups.filter(g => membershipMap[g.id]), [groups, membershipMap]);
  const discoverGroups = useMemo(() => groups.filter(g => !membershipMap[g.id] && !dismissedGroupIds.includes(g.id)), [groups, membershipMap, dismissedGroupIds]);
  
  const filteredGroups = useMemo(() => groups.filter(g => {
    const matchSearch = !search || g.name.toLowerCase().includes(search.toLowerCase()) || g.description?.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (categoryFilter !== "all" && g.category !== categoryFilter) return false;
    if (typeFilter !== "all" && g.group_type !== typeFilter) return false;
    return true;
  }), [groups, search, categoryFilter, typeFilter]);

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
    <div style={{ minHeight: "100dvh", paddingBottom: 88, backgroundColor: "var(--bg-app)" }}>

      {/* ── Header ── */}
      <div className="relative px-5 pt-6 pb-4" style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 24px)" }}>
        <div className="flex items-center justify-between mb-5">
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

      {/* Search */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <Search className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search groups…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--text-primary)" }} />
        </div>
      </div>

      {/* Filter toggle */}
      <div className="px-4 pb-3 flex items-center gap-2">
        <button onClick={() => setShowDiscoverFilters(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{
            backgroundColor: showDiscoverFilters ? "var(--accent-primary)" : "var(--bg-card)",
            color: showDiscoverFilters ? "#fff" : "var(--text-secondary)",
            border: `1px solid ${showDiscoverFilters ? "var(--accent-primary)" : "var(--border-light)"}`,
          }}>
          <Filter className="w-3 h-3" />
          Filters
          {(typeFilter !== "all" || categoryFilter !== "all") && (
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
          )}
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
                  className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: typeFilter === t.key ? "var(--accent-primary)" : "var(--bg-card)",
                    color: typeFilter === t.key ? "#fff" : "var(--text-secondary)",
                    border: "1px solid var(--border-light)",
                  }}>{t.label}</button>
              ))}
            </div>
            <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide">
              {CATEGORY_TABS.map(c => (
                <button key={c.key} onClick={() => setCategoryFilter(c.key)}
                  className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: categoryFilter === c.key ? "var(--accent-primary)" : "var(--bg-card)",
                    color: categoryFilter === c.key ? "#fff" : "var(--text-secondary)",
                    border: "1px solid var(--border-light)",
                  }}>{c.emoji} {c.label}</button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="px-4 pt-2 pb-6">
        {isFiltering ? (
          <>
            <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-hint)" }}>
              {filteredGroups.length} result{filteredGroups.length !== 1 ? "s" : ""}
            </p>
            {filteredGroups.length === 0 ? (
              <div className="py-16 text-center">
                <div className="text-4xl mb-3">🔍</div>
                <p className="font-bold text-sm mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>No groups found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredGroups.map(g => (
                  <GroupCard key={g.id} group={g} membership={membershipMap[g.id]}
                    onOpen={handleOpenGroup} onJoin={handleJoin} />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Discover Groups */}
            {discoverGroups.length > 0 && (
              <section className="mb-6">
                <div className="flex items-center justify-between mb-3 px-0.5">
                  <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--text-hint)" }}>
                    <Flame className="w-3.5 h-3.5 text-orange-500" /> Discover Groups
                  </p>
                  <span className="text-[11px] font-semibold" style={{ color: "var(--text-hint)" }}>Swipe to explore</span>
                </div>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-4 px-4 pb-2">
                  {discoverGroups.slice(0, 12).map(group => (
                    <div key={group.id} className="shrink-0 snap-center w-[82vw] max-w-[360px]">
                      <TrendingGroupCard
                        group={group}
                        onDismiss={() => handleDismissDiscover(group)}
                        onJoin={handleJoin}
                        onOpen={handleOpenGroup}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* My Groups */}
            {myGroups.length > 0 && (
              <section className="mb-6">
                <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-3" style={{ color: "var(--text-hint)" }}>
                  <Star className="w-3.5 h-3.5" style={{ color: "var(--accent-secondary)" }} /> My Groups ({myGroups.length})
                </p>
                <div className="space-y-2">
                  {myGroups.map(g => (
                    <GroupCard key={g.id} group={g} membership={membershipMap[g.id]}
                      onOpen={handleOpenGroup} onJoin={handleJoin} />
                  ))}
                </div>
              </section>
            )}

            {/* Popular Groups — only show groups the user hasn't joined */}
            {(() => {
              const popularGroups = groups.filter(g => !membershipMap[g.id]);
              return (
                <section>
                  <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-3" style={{ color: "var(--text-hint)" }}>
                    <Flame className="w-3.5 h-3.5 text-orange-500" /> Popular Groups
                  </p>
                  {popularGroups.length === 0 ? (
                    <div className="py-10 text-center">
                      <div className="text-4xl mb-3">🎉</div>
                      <p className="font-semibold text-sm" style={{ color: "var(--text-hint)" }}>You've joined all available groups!</p>
                      {user && (
                        <button onClick={() => setShowCreateModal(true)}
                          className="mt-4 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                          style={{ backgroundColor: "var(--accent-primary)" }}>Create a New Group</button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {popularGroups.map(g => (
                        <GroupCard key={g.id} group={g} membership={membershipMap[g.id]}
                          onOpen={handleOpenGroup} onJoin={handleJoin} />
                      ))}
                    </div>
                  )}
                </section>
              );
            })()}
          </>
        )}
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onCreated={handleCreated} user={user} />
    </div>
  );
}