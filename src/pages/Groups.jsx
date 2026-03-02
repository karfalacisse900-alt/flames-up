import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Users, Search, ChevronRight, Lock, Globe, Crown, Shield, X } from "lucide-react";
import GroupHub from "@/components/groups/GroupHub";
import CreateGroupModal from "@/components/groups/CreateGroupModal";

const CATEGORY_COLORS = {
  general: "from-slate-400 to-slate-600",
  movies: "from-purple-500 to-indigo-700",
  music: "from-pink-500 to-rose-700",
  books: "from-amber-500 to-yellow-700",
  gaming: "from-green-500 to-emerald-700",
  tech: "from-blue-500 to-cyan-700",
  sports: "from-orange-500 to-red-600",
  art: "from-violet-500 to-fuchsia-700",
  health: "from-teal-500 to-green-600",
  travel: "from-sky-500 to-blue-600",
  food: "from-orange-400 to-amber-600",
  relationships: "from-rose-400 to-pink-600",
  motivation: "from-yellow-500 to-orange-500",
};

const CATEGORY_EMOJIS = {
  general: "💬", movies: "🎬", music: "🎵", books: "📚", gaming: "🎮",
  tech: "💻", sports: "⚽", art: "🎨", health: "💪", travel: "✈️",
  food: "🍕", relationships: "❤️", motivation: "🔥"
};

export default function Groups() {
  const [user, setUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
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

  if (selectedGroup) {
    return (
      <GroupFeed
        group={selectedGroup}
        user={user}
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
      <div className="px-4 pt-5 pb-3" style={{ background: "linear-gradient(135deg, #2E6B4F18, #4CAF7D0A)" }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Groups</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>Connect with your community</p>
          </div>
          {user && (
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)", boxShadow: "0 2px 10px rgba(46,107,79,0.3)" }}>
              <Plus className="w-4 h-4" /> Create
            </motion.button>
          )}
        </div>
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-hint)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search groups..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
        </div>
      </div>

      <div className="pb-24 overflow-y-auto">
        {/* My Groups */}
        {myGroups.length > 0 && (
          <div className="px-4 mt-2">
            <p className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: "var(--text-hint)" }}>My Groups ({myGroups.length})</p>
            <div className="space-y-2">
              {myGroups.map((group, i) => (
                <GroupCard key={group.id} group={group} isMember onPress={() => setSelectedGroup(group)} index={i}
                  onLeave={() => leaveMut.mutate(group)} />
              ))}
            </div>
          </div>
        )}

        {/* Discover */}
        {discover.length > 0 && (
          <div className="px-4 mt-4">
            <p className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: "var(--text-hint)" }}>
              {myGroups.length > 0 ? "Discover More" : "All Groups"}
            </p>
            <div className="space-y-2">
              {discover.map((group, i) => (
                <GroupCard key={group.id} group={group} isMember={false} onPress={() => setSelectedGroup(group)} index={i}
                  onJoin={() => user && joinMut.mutate(group)} />
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="py-16 text-center px-8">
            <div className="text-5xl mb-4">👥</div>
            <p className="text-base font-bold mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              {search ? "No groups found" : "No groups yet"}
            </p>
            <p className="text-sm mb-5" style={{ color: "var(--text-hint)" }}>
              {search ? "Try a different search" : "Be the first to create a group!"}
            </p>
            {user && !search && (
              <button onClick={() => setShowCreate(true)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)" }}>
                Create a Group
              </button>
            )}
          </div>
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
  const gradClass = CATEGORY_COLORS[group.category] || CATEGORY_COLORS.general;
  const emoji = group.emoji || CATEGORY_EMOJIS[group.category] || "💬";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer active:scale-[0.98] transition-transform"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
      onClick={onPress}
    >
      {/* Icon */}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 bg-gradient-to-br ${gradClass}`}>
        {emoji}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-bold text-sm truncate" style={{ color: "var(--text-primary)" }}>{group.name}</p>
          {group.is_private && <Lock className="w-3 h-3 shrink-0" style={{ color: "var(--text-hint)" }} />}
          {isMember && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>Joined</span>}
        </div>
        <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-hint)" }}>{group.description || `A ${group.category} group`}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="flex items-center gap-0.5 text-[10px] font-medium" style={{ color: "var(--text-hint)" }}>
            <Users className="w-3 h-3" /> {group.member_count || 0}
          </span>
          <span className="text-[10px]" style={{ color: "var(--border-medium)" }}>·</span>
          <span className="text-[10px] font-medium capitalize" style={{ color: "var(--text-hint)" }}>{group.category}</span>
        </div>
      </div>

      {/* Action */}
      <div className="shrink-0" onClick={e => e.stopPropagation()}>
        {isMember ? (
          <ChevronRight className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
        ) : (
          <button onClick={onJoin}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)", color: "#fff" }}>
            Join
          </button>
        )}
      </div>
    </motion.div>
  );
}