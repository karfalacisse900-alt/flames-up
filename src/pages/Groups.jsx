import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Users, Search, ChevronRight, Lock, Globe, Hash, Calendar, Gamepad2, MessageSquare, Film, Settings, ArrowLeft, ShieldAlert, X, Flag } from "lucide-react";
import CreateGroupModal from "@/components/groups/CreateGroupModal";
import GroupChannelFeed from "@/components/groups/GroupChannelFeed";
import GroupLiveEvents from "@/components/groups/GroupLiveEvents";
import GroupGamesTab from "@/components/groups/GroupGamesTab";
import GroupReactionTab from "@/components/groups/GroupReactionTab";
import GroupMembersSheet from "@/components/groups/GroupMembersSheet";
import GroupModerationPanel from "@/components/groups/GroupModerationPanel";
import GroupPostCompose from "@/components/groups/GroupPostCompose";

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

const CATEGORY_EMOJIS = {
  general: "💬", movies: "🎬", music: "🎵", books: "📚", gaming: "🎮",
  tech: "💻", sports: "⚽", art: "🎨", health: "💪", travel: "✈️",
  food: "🍕", relationships: "❤️", motivation: "🔥"
};

const DEFAULT_CHANNELS = [
  { id: "general", name: "general", description: "General conversation" },
  { id: "announcements", name: "announcements", description: "Important updates" },
  { id: "off-topic", name: "off-topic", description: "Anything goes" },
];

const TABS = [
  { key: "channels", label: "Channels", icon: Hash },
  { key: "events", label: "Events", icon: Calendar },
  { key: "games", label: "Games", icon: Gamepad2 },
  { key: "media", label: "Watch", icon: Film },
];

// ── Group Hub (server view) ────────────────────────────────
function GroupHub({ group, user, membership, onBack, onJoin, onLeave, isMember, myMemberships }) {
  const [activeTab, setActiveTab] = useState("channels");
  const [activeChannel, setActiveChannel] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const [showModeration, setShowModeration] = useState(false);
  const qc = useQueryClient();

  const isAdmin = membership?.role === "admin" || membership?.role === "moderator";
  const gradBg = CATEGORY_COLORS[group.category] || CATEGORY_COLORS.general;
  const channels = group.channels?.length ? group.channels : DEFAULT_CHANNELS;

  // Set default channel
  React.useEffect(() => {
    if (!activeChannel && channels.length > 0) setActiveChannel(channels[0]);
  }, [channels.length]);

  const { data: pendingReports = [] } = useQuery({
    queryKey: ["groupReportCount", group.id],
    queryFn: () => base44.entities.GroupPostReport.filter({ group_id: group.id, status: "pending" }),
    enabled: isAdmin,
  });
  const { data: members = [] } = useQuery({
    queryKey: ["groupMembers", group.id],
    queryFn: () => base44.entities.GroupMember.filter({ group_id: group.id }),
  });

  const moderationCount = pendingReports?.length || 0;

  return (
    <div className="flex flex-col" style={{ backgroundColor: "var(--bg-app)", height: "100dvh", overflow: "hidden" }}>
      {/* ── Header ── */}
      <div style={{ background: gradBg, flexShrink: 0 }}>
        <div className="flex items-center gap-3 px-4 py-3"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)" }}>
          <button onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xl shrink-0">{group.emoji || CATEGORY_EMOJIS[group.category] || "💬"}</span>
              <h1 className="text-base font-bold text-white truncate" style={{ fontFamily: "var(--font-serif)" }}>
                {group.name}
              </h1>
              {group.is_private ? <Lock className="w-3 h-3 text-white/70 shrink-0" /> : <Globe className="w-3 h-3 text-white/70 shrink-0" />}
            </div>
            {group.description && (
              <p className="text-xs text-white/70 truncate mt-0.5">{group.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setShowMembers(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold"
              style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "#fff" }}>
              <Users className="w-3.5 h-3.5" /> {group.member_count || 0}
            </button>
            {isAdmin && (
              <button onClick={() => setShowModeration(true)}
                className="w-9 h-9 rounded-full flex items-center justify-center relative"
                style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                <ShieldAlert className="w-4 h-4 text-white" />
                {moderationCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white flex items-center justify-center font-bold"
                    style={{ backgroundColor: "#E05C7A", fontSize: 9 }}>{moderationCount}</span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex px-2 gap-1 pb-0">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-xl transition-all"
                style={{
                  color: activeTab === tab.key ? "var(--accent-primary)" : "rgba(255,255,255,0.7)",
                  backgroundColor: activeTab === tab.key ? "var(--bg-app)" : "transparent",
                  borderBottom: "none",
                }}>
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0">
        {activeTab === "channels" ? (
          <>
            {/* Sidebar */}
            <div className="shrink-0 overflow-y-auto py-3 border-r"
              style={{ width: 160, backgroundColor: "var(--bg-subtle)", borderColor: "var(--border-light)" }}>
              <p className="px-3 text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-hint)" }}>Channels</p>
              {channels.map(ch => (
                <button key={ch.id} onClick={() => setActiveChannel(ch)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left transition-all"
                  style={{
                    backgroundColor: activeChannel?.id === ch.id ? "var(--accent-primary-light)" : "transparent",
                    color: activeChannel?.id === ch.id ? "var(--accent-primary)" : "var(--text-secondary)",
                    borderRadius: 0,
                  }}>
                  <Hash className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-sm font-medium truncate">{ch.name}</span>
                </button>
              ))}

              {!isMember && user && (
                <div className="px-3 mt-4">
                  <button onClick={onJoin}
                    className="w-full py-2 rounded-xl text-xs font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)" }}>
                    Join
                  </button>
                </div>
              )}
            </div>

            {/* Channel feed */}
            <div className="flex-1 min-w-0 flex flex-col" style={{ backgroundColor: "var(--bg-app)" }}>
              {activeChannel ? (
                <GroupChannelFeed
                  group={group}
                  channel={activeChannel}
                  user={user}
                  isMember={isMember}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-sm" style={{ color: "var(--text-hint)" }}>Select a channel</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto" style={{ backgroundColor: "var(--bg-app)" }}>
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                {activeTab === "events" && (
                  <GroupLiveEvents group={group} user={user} isMember={isMember} isAdmin={isAdmin} />
                )}
                {activeTab === "games" && (
                  <GroupGamesTab group={group} user={user} isMember={isMember} />
                )}
                {activeTab === "media" && (
                  <GroupReactionTab group={group} user={user} isMember={isMember} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showMembers && (
          <GroupMembersSheet group={group} user={user} membership={membership}
            onClose={() => setShowMembers(false)}
            onLeave={() => { onLeave(); onBack(); }} />
        )}
        {showModeration && (
          <GroupModerationPanel group={group} user={user} onClose={() => setShowModeration(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Groups List Page ───────────────────────────────────────
export default function Groups() {
  const [user, setUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("mine"); // "mine" | "discover"
  const qc = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: groups = [] } = useQuery({
    queryKey: ["groups"],
    queryFn: () => base44.entities.Group.filter({ is_active: true }, "-member_count", 100),
  });

  const { data: myMemberships = [] } = useQuery({
    queryKey: ["myMemberships", user?.email],
    queryFn: () => base44.entities.GroupMember.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const joinedGroupIds = new Set(myMemberships.map(m => m.group_id));

  const joinMut = useMutation({
    mutationFn: async (group) => {
      await base44.entities.GroupMember.create({
        group_id: group.id, group_name: group.name,
        user_email: user.email, user_name: user.full_name || user.email,
        role: "member", joined_at: new Date().toISOString(),
      });
      await base44.entities.Group.update(group.id, { member_count: (group.member_count || 0) + 1 });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["myMemberships"] }); qc.invalidateQueries({ queryKey: ["groups"] }); },
  });

  const leaveMut = useMutation({
    mutationFn: async (group) => {
      const membership = myMemberships.find(m => m.group_id === group.id);
      if (membership) await base44.entities.GroupMember.delete(membership.id);
      await base44.entities.Group.update(group.id, { member_count: Math.max(0, (group.member_count || 0) - 1) });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["myMemberships"] }); qc.invalidateQueries({ queryKey: ["groups"] }); },
  });

  const filtered = groups.filter(g =>
    !search || g.name.toLowerCase().includes(search.toLowerCase()) || g.description?.toLowerCase().includes(search.toLowerCase())
  );

  const myGroups = filtered.filter(g => joinedGroupIds.has(g.id));
  const discover = filtered.filter(g => !joinedGroupIds.has(g.id));
  const activeList = tab === "mine" ? myGroups : discover;

  if (selectedGroup) {
    return (
      <GroupHub
        group={selectedGroup}
        user={user}
        myMemberships={myMemberships}
        membership={myMemberships.find(m => m.group_id === selectedGroup.id)}
        onBack={() => setSelectedGroup(null)}
        onJoin={() => joinMut.mutate(selectedGroup)}
        onLeave={() => leaveMut.mutate(selectedGroup)}
        isMember={joinedGroupIds.has(selectedGroup.id)}
      />
    );
  }

  return (
    <div style={{ backgroundColor: "var(--bg-app)", minHeight: "100dvh" }}>
      {/* Header */}
      <div className="px-4 pt-5 pb-4" style={{ background: "linear-gradient(135deg, #2E6B4F18, #4CAF7D0A)" }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Communities</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>Find your people</p>
          </div>
          {user && (
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)", boxShadow: "0 2px 12px rgba(46,107,79,0.3)" }}>
              <Plus className="w-4 h-4" /> Create
            </motion.button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-hint)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search communities..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {[["mine", `My Groups (${myGroups.length})`], ["discover", `Discover (${discover.length})`]].map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className="px-4 py-1.5 rounded-xl text-xs font-bold transition-all"
              style={{
                backgroundColor: tab === t ? "var(--accent-primary)" : "var(--bg-card)",
                color: tab === t ? "#fff" : "var(--text-secondary)",
                border: "1px solid var(--border-light)",
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-24 overflow-y-auto space-y-2.5 mt-2">
        {activeList.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="text-5xl mb-4">{tab === "mine" ? "👥" : "🔍"}</div>
            <p className="text-base font-bold mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              {tab === "mine" ? "No groups joined yet" : (search ? "No results" : "No groups yet")}
            </p>
            <p className="text-sm mb-5" style={{ color: "var(--text-hint)" }}>
              {tab === "mine" ? "Discover and join communities below" : (search ? "Try a different search" : "Be the first to create one!")}
            </p>
            {tab === "mine" && <button onClick={() => setTab("discover")} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)" }}>Browse Communities</button>}
            {tab === "discover" && !search && user && <button onClick={() => setShowCreate(true)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)" }}>Create Community</button>}
          </div>
        ) : (
          activeList.map((group, i) => (
            <GroupCard key={group.id} group={group}
              isMember={joinedGroupIds.has(group.id)}
              onPress={() => setSelectedGroup(group)}
              index={i}
              onJoin={() => user && joinMut.mutate(group)}
              onLeave={() => leaveMut.mutate(group)} />
          ))
        )}
      </div>

      <AnimatePresence>
        {showCreate && (
          <CreateGroupModal user={user} onClose={() => setShowCreate(false)}
            onCreated={(group) => {
              qc.invalidateQueries({ queryKey: ["groups"] });
              qc.invalidateQueries({ queryKey: ["myMemberships"] });
              setShowCreate(false);
              setSelectedGroup(group);
            }} />
        )}
      </AnimatePresence>
    </div>
  );
}

function GroupCard({ group, isMember, onPress, onJoin, onLeave, index }) {
  const gradBg = CATEGORY_COLORS[group.category] || CATEGORY_COLORS.general;
  const emoji = group.emoji || CATEGORY_EMOJIS[group.category] || "💬";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: index * 0.04 }}
      className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer active:scale-[0.98] transition-transform"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
      onClick={onPress}
    >
      {/* Gradient icon */}
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
        style={{ background: gradBg }}>
        {emoji}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-bold text-sm truncate" style={{ color: "var(--text-primary)" }}>{group.name}</p>
          {group.is_private && <Lock className="w-3 h-3 shrink-0" style={{ color: "var(--text-hint)" }} />}
          {isMember && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
              style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>Joined</span>
          )}
        </div>
        <p className="text-xs truncate mb-1.5" style={{ color: "var(--text-hint)" }}>{group.description || `A ${group.category} community`}</p>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: "var(--text-hint)" }}>
            <Users className="w-3 h-3" /> {group.member_count || 0} members
          </span>
          <span className="text-[11px] font-medium capitalize px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>
            {group.category}
          </span>
        </div>
      </div>

      {/* CTA */}
      <div className="shrink-0" onClick={e => e.stopPropagation()}>
        {isMember ? (
          <ChevronRight className="w-5 h-5" style={{ color: "var(--text-hint)" }} />
        ) : (
          <button onClick={onJoin}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)", color: "#fff" }}>
            Join
          </button>
        )}
      </div>
    </motion.div>
  );
}