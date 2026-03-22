import React, { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Users, Lock, Bell, SlidersHorizontal } from "lucide-react";
import GroupHub from "@/components/groups/GroupHub";
import CreateGroupModal from "@/components/groups/CreateGroupModal";

// Category icons
const CATEGORIES = [
  { key: "all",     label: "All",     emoji: "🌐" },
  { key: "music",   label: "Music",   emoji: "🎵" },
  { key: "art",     label: "Art",     emoji: "🎨" },
  { key: "gaming",  label: "Gaming",  emoji: "🎮" },
  { key: "travel",  label: "Travel",  emoji: "✈️" },
  { key: "tech",    label: "Tech",    emoji: "💻" },
  { key: "fitness", label: "Fitness", emoji: "💪" },
  { key: "food",    label: "Food",    emoji: "🍕" },
  { key: "movies",  label: "Movies",  emoji: "🎬" },
  { key: "sports",  label: "Sports",  emoji: "⚽" },
];

const FEED_TABS = ["Popular", "Last", "Nearby", "Meeting"];

const GRADIENTS = {
  fitness:  "linear-gradient(135deg,#0d9488,#16a34a)",
  food:     "linear-gradient(135deg,#ea580c,#d97706)",
  travel:   "linear-gradient(135deg,#0284c7,#6d28d9)",
  tech:     "linear-gradient(135deg,#0284c7,#0369a1)",
  art:      "linear-gradient(135deg,#7c3aed,#a21caf)",
  music:    "linear-gradient(135deg,#db2777,#be185d)",
  gaming:   "linear-gradient(135deg,#16a34a,#15803d)",
  movies:   "linear-gradient(135deg,#7c3aed,#4338ca)",
  sports:   "linear-gradient(135deg,#ea580c,#dc2626)",
  general:  "linear-gradient(135deg,#64748b,#475569)",
};

function getGrad(cat) { return GRADIENTS[cat] || GRADIENTS.general; }

// Member avatars stacked
function MemberStack({ emails = [] }) {
  const shown = emails.slice(0, 3);
  return (
    <div className="flex" style={{ gap: -6 }}>
      {shown.map((e, i) => (
        <div key={i} className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
          style={{
            background: getGrad("general"),
            border: "2px solid rgba(255,255,255,0.25)",
            marginLeft: i > 0 ? -8 : 0,
            zIndex: shown.length - i,
          }}>
          {(e || "?")[0].toUpperCase()}
        </div>
      ))}
    </div>
  );
}

// Large featured card (image background)
function FeaturedGroupCard({ group, onOpen, onJoin, isMember }) {
  const bgColor = getGrad(group.category);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={() => onOpen(group)}
      className="relative rounded-3xl overflow-hidden cursor-pointer"
      style={{ aspectRatio: "4/3", background: bgColor, minHeight: 160 }}
    >
      {/* Overlay */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)" }} />

      {/* Category emoji center top */}
      <div className="absolute top-3 left-3 text-3xl">{CATEGORIES.find(c => c.key === group.category)?.emoji || "💬"}</div>

      {/* Member stack */}
      <div className="absolute top-3 right-3">
        <MemberStack emails={[group.created_by, group.host_email].filter(Boolean)} />
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
        <p className="text-white font-bold text-[15px] leading-tight truncate"
          style={{ fontFamily: "var(--font-serif)", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
          {group.name}
        </p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-white/70 text-[12px] truncate">
            @{(group.created_by || "").split("@")[0]}
          </p>
          {!isMember ? (
            <button
              onClick={e => { e.stopPropagation(); onJoin(group); }}
              className="px-3 py-1 rounded-full text-[12px] font-bold"
              style={{ backgroundColor: "#fff", color: "#111" }}>
              JOIN
            </button>
          ) : (
            <span className="px-3 py-1 rounded-full text-[12px] font-bold"
              style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "#fff" }}>✓ IN</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Feed list item
function FeedGroupRow({ group, onOpen, onJoin, isMember }) {
  return (
    <div onClick={() => onOpen(group)}
      className="flex items-center gap-3 px-4 py-3 cursor-pointer"
      style={{ borderBottom: "1px solid var(--border-subtle)" }}>
      <div className="w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center text-2xl"
        style={{ background: getGrad(group.category) }}>
        {CATEGORIES.find(c => c.key === group.category)?.emoji || "💬"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="font-bold text-[14px] truncate" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
            {group.name}
          </p>
          {group.is_private && <Lock className="w-3 h-3 shrink-0" style={{ color: "var(--text-hint)" }} />}
        </div>
        <div className="flex items-center gap-2">
          <MemberStack emails={[group.created_by].filter(Boolean)} />
          <p className="text-[12px] truncate" style={{ color: "var(--text-hint)" }}>
            {(group.member_count || 0).toLocaleString()} members · {group.description?.slice(0, 30) || group.category}
          </p>
        </div>
      </div>
      {!isMember && (
        <button onClick={e => { e.stopPropagation(); onJoin(group); }}
          className="shrink-0 px-4 py-1.5 rounded-full text-[12px] font-bold text-white"
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
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [feedTab, setFeedTab] = useState("Popular");
  const [showCreateModal, setShowCreateModal] = useState(false);
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

  const membershipMap = useMemo(() =>
    Object.fromEntries(myMemberships.map(m => [m.group_id, m])), [myMemberships]);

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

  const filtered = useMemo(() => {
    let list = groups;
    if (categoryFilter !== "all") list = list.filter(g => g.category === categoryFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(g => g.name.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q));
    }
    if (feedTab === "Last") list = [...list].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    return list;
  }, [groups, categoryFilter, search, feedTab]);

  const featuredGroups = filtered.filter(g => !membershipMap[g.id]).slice(0, 4);
  const feedGroups = filtered.slice(0, 30);

  if (activeGroup) {
    return (
      <GroupHub group={activeGroup} user={user} membership={activeMembership}
        isMember={!!activeMembership} onBack={() => setActiveGroup(null)}
        onJoin={() => handleJoin(activeGroup)} onLeave={handleLeave} />
    );
  }

  return (
    <div style={{ minHeight: "100dvh", paddingBottom: 100, backgroundColor: "var(--bg-app)" }}>

      {/* ── Header ── */}
      <div className="px-5 flex items-center justify-between"
        style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 24px)", paddingBottom: 16 }}>
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
            Groups
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSearch(v => !v)}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
            <Search className="w-4.5 h-4.5" style={{ width: 18, height: 18, color: "var(--text-secondary)" }} />
          </button>
          {user && (
            <button onClick={() => setShowCreateModal(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
              <Plus className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
            </button>
          )}
        </div>
      </div>

      {/* Search bar (expandable) */}
      <AnimatePresence>
        {showSearch && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="px-4 overflow-hidden" style={{ marginBottom: 8 }}>
            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl"
              style={{ backgroundColor: "var(--bg-card)", border: "1.5px solid var(--accent-primary)" }}>
              <Search className="w-4 h-4 shrink-0" style={{ color: "var(--accent-primary)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search groups…" autoFocus
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: "var(--text-primary)" }} />
              {search && (
                <button onClick={() => setSearch("")}>
                  <span className="text-xs" style={{ color: "var(--text-hint)" }}>✕</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Category icon row ── */}
      <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2">
        {CATEGORIES.map(cat => (
          <button key={cat.key} onClick={() => setCategoryFilter(cat.key)}
            className="flex flex-col items-center gap-1.5 shrink-0">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all"
              style={{
                background: categoryFilter === cat.key
                  ? "linear-gradient(135deg, #1c1c2e, #2d2b55)"
                  : "#1c1c2e",
                boxShadow: categoryFilter === cat.key ? "0 4px 16px rgba(79,70,229,0.4)" : "none",
                transform: categoryFilter === cat.key ? "scale(1.08)" : "scale(1)",
                border: categoryFilter === cat.key ? "2px solid #7C3AED" : "2px solid transparent",
              }}>
              <span style={{ fontSize: 22 }}>{cat.emoji}</span>
            </div>
            <span className="text-[11px] font-medium" style={{ color: categoryFilter === cat.key ? "var(--accent-primary)" : "var(--text-hint)" }}>
              {cat.label}
            </span>
          </button>
        ))}
      </div>

      {/* ── Featured grid (2-col) ── */}
      {featuredGroups.length > 0 && (
        <div className="px-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            {featuredGroups.map(g => (
              <FeaturedGroupCard
                key={g.id} group={g}
                onOpen={handleOpenGroup} onJoin={handleJoin}
                isMember={!!membershipMap[g.id]}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Feed section ── */}
      <div className="mt-5">
        {/* Feed tabs */}
        <div className="flex items-center gap-2 px-4 mb-3 overflow-x-auto scrollbar-hide">
          {FEED_TABS.map(tab => {
            const counts = { Popular: groups.length, Last: groups.length, Nearby: Math.floor(groups.length * 0.4), Meeting: Math.floor(groups.length * 0.2) };
            return (
              <button key={tab} onClick={() => setFeedTab(tab)}
                className="shrink-0 flex items-center gap-1.5 px-0 py-1"
                style={{ borderBottom: feedTab === tab ? "2.5px solid var(--text-primary)" : "2.5px solid transparent" }}>
                <span className="font-bold text-[15px]"
                  style={{ color: feedTab === tab ? "var(--text-primary)" : "var(--text-hint)" }}>
                  {tab}
                </span>
                <span className="text-[12px] font-semibold"
                  style={{ color: feedTab === tab ? "var(--text-secondary)" : "var(--text-hint)" }}>
                  {counts[tab]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Feed rows */}
        <div style={{ backgroundColor: "var(--bg-card)", borderRadius: "20px 20px 0 0", border: "1px solid var(--border-light)" }}>
          {feedGroups.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <p className="font-semibold text-sm" style={{ color: "var(--text-hint)" }}>No groups found</p>
            </div>
          ) : (
            feedGroups.map(g => (
              <FeedGroupRow
                key={g.id} group={g}
                onOpen={handleOpenGroup} onJoin={handleJoin}
                isMember={!!membershipMap[g.id]}
              />
            ))
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onCreated={handleCreated} user={user} />
    </div>
  );
}