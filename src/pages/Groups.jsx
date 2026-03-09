import React, { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Users, Lock, MapPin, Globe, Flame, Star, ChevronRight, Zap } from "lucide-react";
import GroupHub from "@/components/groups/GroupHub";
import CreateGroupModal from "@/components/groups/CreateGroupModal";

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

function getGrad(g) {
  const [a, b] = CATEGORY_GRADIENTS[g?.category] || CATEGORY_GRADIENTS.general;
  return `linear-gradient(135deg, ${a}, ${b})`;
}

// ── Hero card for Featured / Trending groups ──────────────────────────────
function HeroGroupCard({ group, membership, onOpen, onJoin }) {
  const isMember = !!membership;
  const isRW = group.group_type === "realworld";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onOpen(group)}
      className="cursor-pointer relative rounded-3xl overflow-hidden shrink-0"
      style={{ width: 220, height: 280, background: getGrad(group) }}
    >
      {group.cover_image_url && (
        <img src={group.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
      )}
      {/* gradient overlay */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.78) 50%, rgba(0,0,0,0.1) 100%)" }} />

      {/* Badges top */}
      <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.18)", color: "#fff", backdropFilter: "blur(6px)" }}>
          {isRW ? "📍 Real-World" : "🌐 Online"}
        </span>
        {group.is_private && <Lock className="w-3.5 h-3.5 text-white/70" />}
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="text-2xl mb-1">{group.emoji || "💬"}</div>
        <h3 className="font-bold text-white leading-tight text-sm mb-1" style={{ fontFamily: "var(--font-serif)" }}>{group.name}</h3>
        {group.description && (
          <p className="text-white/65 text-[11px] line-clamp-2 mb-3">{group.description}</p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-white/70 text-[11px]">
            <Users className="w-3 h-3" />
            <span>{(group.member_count || 0).toLocaleString()}</span>
          </div>
          {isMember ? (
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-white/20 text-white">Joined</span>
          ) : (
            <button
              onClick={e => { e.stopPropagation(); onJoin(group); }}
              className="text-[11px] font-bold px-3 py-1 rounded-full text-white active:scale-95 transition-transform"
              style={{ background: "rgba(255,255,255,0.25)", backdropFilter: "blur(8px)" }}>
              Join
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Compact row card ──────────────────────────────────────────────────────
function GroupRowCard({ group, membership, onOpen, onJoin, index }) {
  const isMember = !!membership;
  const isRW = group.group_type === "realworld";
  const [a, b] = CATEGORY_GRADIENTS[group.category] || CATEGORY_GRADIENTS.general;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, type: "spring", stiffness: 300, damping: 28 }}
      onClick={() => onOpen(group)}
      className="flex items-center gap-3 px-4 py-3.5 cursor-pointer active:scale-[0.99] transition-transform relative"
      style={{ borderBottom: "1px solid var(--border-subtle)" }}
    >
      {/* Icon */}
      <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center relative"
        style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}>
        {group.cover_image_url ? (
          <img src={group.cover_image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl">{group.emoji || "💬"}</span>
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
          <p className="text-xs line-clamp-1 mb-1" style={{ color: "var(--text-hint)" }}>{group.description}</p>
        )}
        <div className="flex items-center gap-2 text-[11px]" style={{ color: "var(--text-hint)" }}>
          <span className="flex items-center gap-0.5" style={{ color: isRW ? "var(--accent-primary)" : "var(--text-hint)" }}>
            {isRW ? <MapPin className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
            {isRW ? (group.location_city || "Real-World") : "Online"}
          </span>
          <span>·</span>
          <span><Users className="w-2.5 h-2.5 inline mr-0.5" />{(group.member_count || 0).toLocaleString()}</span>
          <span className="px-1.5 py-0.5 rounded-full capitalize" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)", fontSize: 10 }}>{group.category}</span>
        </div>
      </div>

      {/* CTA */}
      {isMember ? (
        <span className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>✓ Joined</span>
      ) : (
        <button
          onClick={e => { e.stopPropagation(); onJoin(group); }}
          className="shrink-0 flex items-center gap-0.5 text-[11px] font-bold px-3 py-1.5 rounded-full text-white active:scale-95 transition-transform"
          style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}>
          Join
        </button>
      )}
    </motion.div>
  );
}

// ── My Groups pill chip ───────────────────────────────────────────────────
function MyGroupChip({ group, onOpen }) {
  const [a] = CATEGORY_GRADIENTS[group.category] || CATEGORY_GRADIENTS.general;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={() => onOpen(group)}
      className="cursor-pointer flex items-center gap-2.5 px-3 py-2.5 rounded-2xl shrink-0 active:scale-95 transition-transform"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", minWidth: 140 }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
        style={{ background: `linear-gradient(135deg, ${a}33, ${a}55)` }}>
        {group.emoji || "💬"}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold truncate" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{group.name}</p>
        <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>{(group.member_count || 0).toLocaleString()} members</p>
      </div>
      <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-hint)" }} />
    </motion.div>
  );
}

export default function Groups() {
  const [user, setUser] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);
  const [activeMembership, setActiveMembership] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
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
    setShowCreate(false);
    qc.invalidateQueries({ queryKey: ["groups"] });
    qc.invalidateQueries({ queryKey: ["myMemberships", user?.email] });
    setActiveMembership({ role: "admin", group_id: group.id });
    setActiveGroup(group);
  };

  const myGroups = useMemo(() => groups.filter(g => membershipMap[g.id]), [groups, membershipMap]);
  const trendingGroups = useMemo(() => [...groups].sort((a, b) => (b.member_count || 0) - (a.member_count || 0)).slice(0, 8), [groups]);
  const nearbyGroups = useMemo(() => groups.filter(g => g.group_type === "realworld").slice(0, 6), [groups]);

  const filteredGroups = useMemo(() => groups.filter(g => {
    const matchSearch = !search || g.name.toLowerCase().includes(search.toLowerCase()) || g.description?.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (categoryFilter !== "all" && g.category !== categoryFilter) return false;
    if (typeFilter !== "all" && g.group_type !== typeFilter) return false;
    return true;
  }), [groups, search, categoryFilter, typeFilter]);

  const isSearching = search || categoryFilter !== "all" || typeFilter !== "all";

  if (activeGroup) {
    return (
      <GroupHub
        group={activeGroup} user={user}
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

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden px-5 pt-6 pb-5"
        style={{ background: "linear-gradient(135deg, #1a3a2488 0%, #2E6B4F22 60%, var(--bg-app) 100%)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)" }}>
                <Users className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Groups</h1>
            </div>
            <p className="text-xs" style={{ color: "var(--text-hint)" }}>Join communities. Meet people.</p>
          </div>
          {user && (
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)", boxShadow: "0 4px 16px rgba(46,107,79,0.35)" }}>
              <Plus className="w-4 h-4" /> Create
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-hint)" }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search groups…"
            className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm outline-none"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-primary)", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}
          />
        </div>
      </div>

      {/* ── Type filter pills ── */}
      <div className="flex gap-2 px-4 pt-3 pb-1">
        {[
          { key: "all", label: "All" },
          { key: "realworld", label: "📍 Real-World" },
          { key: "online", label: "🌐 Online" },
        ].map(t => (
          <button key={t.key} onClick={() => setTypeFilter(t.key)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              backgroundColor: typeFilter === t.key ? "var(--accent-primary)" : "var(--bg-card)",
              color: typeFilter === t.key ? "#fff" : "var(--text-secondary)",
              border: "1px solid var(--border-light)",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Category scroll ── */}
      <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide">
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

      {/* ── SEARCH RESULTS MODE ── */}
      {isSearching ? (
        <div className="px-4 pt-3">
          <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-hint)" }}>
            {filteredGroups.length} result{filteredGroups.length !== 1 ? "s" : ""}
          </p>
          {filteredGroups.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <p className="font-bold text-sm mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>No groups found</p>
              <p className="text-xs mb-4" style={{ color: "var(--text-hint)" }}>Try a different keyword or category</p>
              {user && (
                <button onClick={() => setShowCreate(true)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ backgroundColor: "var(--accent-primary)" }}>
                  Create a Group
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-3xl overflow-hidden" style={{ border: "1px solid var(--border-light)", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
              {filteredGroups.map((group, i) => (
                <GroupRowCard key={group.id} group={group} membership={membershipMap[group.id]}
                  onOpen={handleOpenGroup} onJoin={handleJoin} index={i} />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ── DISCOVERY MODE ── */
        <div>

          {/* My Groups */}
          {myGroups.length > 0 && (
            <section className="px-4 pt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--text-hint)" }}>
                  <Star className="w-3.5 h-3.5" style={{ color: "var(--accent-secondary)" }} /> My Groups
                </p>
              </div>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                {myGroups.map(g => (
                  <MyGroupChip key={g.id} group={g} onOpen={handleOpenGroup} />
                ))}
              </div>
            </section>
          )}

          {/* Trending — horizontal hero scroll */}
          {trendingGroups.length > 0 && (
            <section className="pt-5 pb-2">
              <div className="flex items-center justify-between px-4 mb-3">
                <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--text-hint)" }}>
                  <Flame className="w-3.5 h-3.5 text-orange-500" /> Trending
                </p>
              </div>
              <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2">
                {trendingGroups.map(g => (
                  <HeroGroupCard key={g.id} group={g} membership={membershipMap[g.id]}
                    onOpen={handleOpenGroup} onJoin={handleJoin} />
                ))}
              </div>
            </section>
          )}

          {/* Real-World Nearby */}
          {nearbyGroups.length > 0 && (
            <section className="px-4 pt-4">
              <p className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: "var(--text-hint)" }}>
                <MapPin className="w-3.5 h-3.5" style={{ color: "var(--accent-primary)" }} /> Real-World Groups
              </p>
              <div className="rounded-3xl overflow-hidden" style={{ border: "1px solid var(--border-light)", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                {nearbyGroups.map((g, i) => (
                  <GroupRowCard key={g.id} group={g} membership={membershipMap[g.id]}
                    onOpen={handleOpenGroup} onJoin={handleJoin} index={i} />
                ))}
              </div>
            </section>
          )}

          {/* All Groups */}
          <section className="px-4 pt-5 pb-6">
            <p className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: "var(--text-hint)" }}>
              <Zap className="w-3.5 h-3.5" style={{ color: "var(--accent-primary)" }} /> All Communities
            </p>
            {groups.length === 0 ? (
              <div className="py-16 text-center">
                <div className="text-5xl mb-3">👥</div>
                <p className="font-bold text-base mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>No groups yet</p>
                <p className="text-sm mb-4" style={{ color: "var(--text-hint)" }}>Be the first to start a community!</p>
                {user && (
                  <button onClick={() => setShowCreate(true)}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                    style={{ backgroundColor: "var(--accent-primary)" }}>
                    Create a Group
                  </button>
                )}
              </div>
            ) : (
              <div className="rounded-3xl overflow-hidden" style={{ border: "1px solid var(--border-light)", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                {groups.map((g, i) => (
                  <GroupRowCard key={g.id} group={g} membership={membershipMap[g.id]}
                    onOpen={handleOpenGroup} onJoin={handleJoin} index={i} />
                ))}
              </div>
            )}
          </section>
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