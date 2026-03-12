import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Search, Plus, Users, Lock, MapPin, Globe, Flame,
  Star, ChevronRight, Zap, Navigation, X, Filter, SlidersHorizontal, MessageCircle
} from "lucide-react";
import GroupHub from "@/components/groups/GroupHub";
import GroupMessageBubble from "@/components/groups/GroupMessageBubble";
import TrendingGroupsSwiper from "@/components/groups/TrendingGroupsSwiper";
import GroupDiscovery from "@/components/groups/GroupDiscovery";
import NearbyExplorer from "@/components/groups/NearbyExplorer";

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

// ── Sub-components ────────────────────────────────────────────────────────

function HeroGroupCard({ group, membership, onOpen, onJoin }) {
  const isMember = !!membership;
  const isRW = group.group_type === "realworld";
  const [hovered, setHovered] = React.useState(false);
  const videoRef = React.useRef(null);

  const handleMouseEnter = () => {
    setHovered(true);
    if (videoRef.current) { videoRef.current.currentTime = 0; videoRef.current.play().catch(() => {}); }
  };
  const handleMouseLeave = () => {
    setHovered(false);
    if (videoRef.current) { videoRef.current.pause(); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      onClick={() => onOpen(group)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="cursor-pointer relative rounded-3xl overflow-hidden shrink-0"
      style={{ width: 220, height: 280, background: getGrad(group.category) }}>
      {group.preview_video_url && (
        <video
          ref={videoRef}
          src={group.preview_video_url}
          muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
          style={{ opacity: hovered ? 1 : 0 }}
        />
      )}
      {group.cover_image_url && (
        <img src={group.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300" loading="lazy"
          style={{ opacity: hovered && group.preview_video_url ? 0 : 1 }} />
      )}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.78) 50%, rgba(0,0,0,0.1) 100%)" }} />
      <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.18)", color: "#fff", backdropFilter: "blur(6px)" }}>
          {isRW ? "📍 Real-World" : "🌐 Online"}
        </span>
        {group.is_private && <Lock className="w-3.5 h-3.5 text-white/70" />}
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="text-2xl mb-1">{group.emoji || "💬"}</div>
        <h3 className="font-bold text-white leading-tight text-sm mb-1" style={{ fontFamily: "var(--font-serif)" }}>{group.name}</h3>
        {group.description && <p className="text-white/65 text-[11px] line-clamp-2 mb-3">{group.description}</p>}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-white/70 text-[11px]">
            <Users className="w-3 h-3" /><span>{(group.member_count || 0).toLocaleString()}</span>
          </div>
          {isMember ? (
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-white/20 text-white">Joined</span>
          ) : (
            <button onClick={e => { e.stopPropagation(); onJoin(group); }}
              className="text-[11px] font-bold px-3 py-1 rounded-full text-white active:scale-95 transition-transform"
              style={{ background: "rgba(255,255,255,0.25)", backdropFilter: "blur(8px)" }}>Join</button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function GroupRowCard({ group, membership, onOpen, onJoin, index }) {
  const isMember = !!membership;
  const isRW = group.group_type === "realworld";
  const [a, b] = CATEGORY_GRADIENTS[group.category] || CATEGORY_GRADIENTS.general;
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, type: "spring", stiffness: 300, damping: 28 }}
      onClick={() => onOpen(group)}
      className="flex items-center gap-3 px-4 py-3.5 cursor-pointer active:scale-[0.99] transition-transform"
      style={{ borderBottom: "1px solid var(--border-subtle)" }}>
      <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}>
        {group.cover_image_url
          ? <img src={group.cover_image_url} alt="" className="w-full h-full object-cover" />
          : <span className="text-2xl">{group.emoji || "💬"}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <h3 className="font-bold text-sm truncate" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{group.name}</h3>
          {group.is_private && <Lock className="w-3 h-3 shrink-0" style={{ color: "var(--text-hint)" }} />}
        </div>
        {group.description && <p className="text-xs line-clamp-1 mb-1" style={{ color: "var(--text-hint)" }}>{group.description}</p>}
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
      {isMember ? (
        <span className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>✓ Joined</span>
      ) : (
        <button onClick={e => { e.stopPropagation(); onJoin(group); }}
          className="shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full text-white active:scale-95 transition-transform"
          style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}>Join</button>
      )}
    </motion.div>
  );
}

function MyGroupChip({ group, onOpen }) {
  const [a] = CATEGORY_GRADIENTS[group.category] || CATEGORY_GRADIENTS.general;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
    onClick={() => onOpen(group)}
    className="cursor-pointer flex flex-col gap-2 px-3 py-2.5 rounded-2xl shrink-0 active:scale-95 transition-transform"
    style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", minWidth: 160 }}>
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
        style={{ background: `linear-gradient(135deg, ${a}44, ${a}77)` }}>
        {group.emoji || "💬"}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold truncate" style={{ color: "var(--text-primary)" }}>{group.name}</p>
        <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>{(group.member_count || 0).toLocaleString()} members</p>
      </div>
    </div>
    <GroupMessageBubble groupId={group.id} />
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
  const [mainTab, setMainTab] = useState("discover"); // "discover" | "map"
  const [showDiscoverFilters, setShowDiscoverFilters] = useState(false);
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

  const [dismissedGroups, setDismissedGroups] = useState(new Set());
  const [showTrendingSwiper, setShowTrendingSwiper] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const myGroups = useMemo(() => groups.filter(g => membershipMap[g.id]), [groups, membershipMap]);
  const trendingGroups = useMemo(() => 
    [...groups]
      .filter(g => !membershipMap[g.id] && !dismissedGroups.has(g.id))
      .sort((a, b) => (b.member_count || 0) - (a.member_count || 0))
      .slice(0, 8), 
    [groups, membershipMap, dismissedGroups]);

  const filteredGroups = useMemo(() => groups.filter(g => {
    const matchSearch = !search || g.name.toLowerCase().includes(search.toLowerCase()) || g.description?.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (categoryFilter !== "all" && g.category !== categoryFilter) return false;
    if (typeFilter !== "all" && g.group_type !== typeFilter) return false;
    return true;
  }), [groups, search, categoryFilter, typeFilter]);

  const isFiltering = search || categoryFilter !== "all" || typeFilter !== "all";

  if (activeGroup) {
    return (
      <GroupHub group={activeGroup} user={user} membership={activeMembership}
        isMember={!!activeMembership} onBack={() => setActiveGroup(null)}
        onJoin={() => handleJoin(activeGroup)} onLeave={handleLeave} />
    );
  }

  const CARD_PALETTES = [
    { bg: "#FBBF8A", text: "#7A3D00" },
    { bg: "#86EFAC", text: "#14532D" },
    { bg: "#C4B5FD", text: "#3B0764" },
    { bg: "#93C5FD", text: "#1E3A5F" },
    { bg: "#FCA5A5", text: "#7F1D1D" },
    { bg: "#FDE68A", text: "#78350F" },
  ];

  return (
    <div style={{ minHeight: "100dvh", paddingBottom: 88, backgroundColor: "var(--bg-app)" }}>

      {/* ── Header ── */}
      <div className="relative px-5 pt-6 pb-4"
        style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 24px)" }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Groups</h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Join communities · Meet people</p>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <button onClick={() => navigate(createPageUrl("CreateGroup"))}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-bold text-white"
                style={{ backgroundColor: "var(--accent-primary)" }}>
                <Plus className="w-4 h-4" /> Create
              </button>
            )}
          </div>
        </div>

        {/* Main Tabs */}
        <div className="flex gap-2">
          {[
            { key: "discover", label: "Discover", icon: Zap },
            { key: "map", label: "Nearby", icon: MapPin },
          ].map(({ key, label, icon: TabIcon }) => (
            <button key={key} onClick={() => setMainTab(key)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all"
              style={{
                backgroundColor: mainTab === key ? "var(--accent-primary)" : "var(--bg-card)",
                color: mainTab === key ? "#fff" : "var(--text-secondary)",
                border: `1.5px solid ${mainTab === key ? "var(--accent-primary)" : "var(--border-light)"}`,
              }}>
              <TabIcon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAP TAB ── */}
      {mainTab === "map" && (
        <NearbyExplorer 
          groups={groups} 
          membershipMap={membershipMap} 
          onOpen={handleOpenGroup} 
          onJoin={handleJoin} 
        />
      )}

      {/* ── DISCOVER TAB ── */}
      {mainTab === "discover" && (
        <GroupDiscovery
          groups={groups}
          membershipMap={membershipMap}
          user={user}
          onOpenGroup={handleOpenGroup}
          onJoinGroup={handleJoin}
        />
      )}

      {/* Trending Groups Swiper */}
      {showTrendingSwiper && (
        <TrendingGroupsSwiper
          groups={trendingGroups}
          membershipMap={membershipMap}
          onDismiss={(group) => setDismissedGroups(prev => new Set([...prev, group.id]))}
          onJoin={handleJoin}
          onClose={() => setShowTrendingSwiper(false)}
        />
      )}

    </div>
  );
}