import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Filter, Flame, Users, MapPin, Globe, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const CATEGORY_GRADIENTS = {
  fitness: ["#0d9488", "#16a34a"],
  food: ["#ea580c", "#d97706"],
  travel: ["#0284c7", "#6d28d9"],
  yoga: ["#d97706", "#b45309"],
  running: ["#0284c7", "#0369a1"],
  dance: ["#7c3aed", "#a21caf"],
  music: ["#db2777", "#be185d"],
  gaming: ["#16a34a", "#15803d"],
  online: ["#7c3aed", "#4338ca"],
  sports: ["#ea580c", "#dc2626"],
  wellness: ["#0d9488", "#16a34a"],
  general: ["#64748b", "#475569"],
};

const CATEGORY_TABS = [
  { key: "all", label: "All", emoji: "✨" },
  { key: "fitness", label: "Fitness", emoji: "💪" },
  { key: "yoga", label: "Yoga", emoji: "🧘" },
  { key: "running", label: "Running", emoji: "🏃" },
  { key: "dance", label: "Dance", emoji: "💃" },
  { key: "wellness", label: "Wellness", emoji: "🌿" },
  { key: "music", label: "Music", emoji: "🎵" },
  { key: "online", label: "Online", emoji: "🌐" },
];

function GroupCard({ group, isMember, onOpen, onJoin }) {
  const [a, b] = CATEGORY_GRADIENTS[group.category] || CATEGORY_GRADIENTS.general;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onOpen(group)}
      className="flex items-center gap-3 px-4 py-4 rounded-2xl cursor-pointer active:scale-95 transition-transform"
      style={{
        backgroundColor: `${a}15`,
        border: `1.5px solid ${a}40`,
      }}
    >
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-2xl"
        style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}>
        {group.emoji || "💬"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate text-gray-900">{group.name}</p>
        <div className="flex items-center gap-2 text-xs text-gray-600 mt-0.5">
          <span className="flex items-center gap-0.5">
            {group.group_type === "realworld" ? (
              <>
                <MapPin className="w-3 h-3" /> {group.location_city || "Local"}
              </>
            ) : (
              <>
                <Globe className="w-3 h-3" /> Online
              </>
            )}
          </span>
          <span>·</span>
          <span>{(group.member_count || 0).toLocaleString()} members</span>
        </div>
        {group.membership_fee && (
          <p className="text-[10px] font-semibold mt-1" style={{ color: a }}>
            ${group.membership_fee}/mo
          </p>
        )}
      </div>
      {isMember ? (
        <span className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: a }}>✓ Joined</span>
      ) : (
        <button onClick={(e) => { e.stopPropagation(); onJoin(group); }}
          className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold text-white active:scale-95 transition-transform"
          style={{ backgroundColor: a }}>Join</button>
      )}
    </motion.div>
  );
}

export default function GroupDiscovery({ groups, membershipMap, user, onOpenGroup, onJoinGroup }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      const matchSearch =
        !search ||
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        g.description?.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (categoryFilter !== "all" && g.category !== categoryFilter) return false;
      return true;
    });
  }, [groups, search, categoryFilter]);

  const myGroups = useMemo(
    () => groups.filter((g) => membershipMap[g.id]),
    [groups, membershipMap]
  );

  const trendingGroups = useMemo(
    () =>
      groups
        .filter((g) => !membershipMap[g.id])
        .sort((a, b) => (b.member_count || 0) - (a.member_count || 0))
        .slice(0, 6),
    [groups, membershipMap]
  );

  return (
    <div>
      {/* Search */}
      <div className="px-4 pt-1 pb-3">
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <Search className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search groups…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--text-primary)" }}
          />
        </div>
      </div>

      {/* Filter toggle */}
      <div className="px-4 pb-3">
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{
            backgroundColor: showFilters ? "var(--accent-primary)" : "var(--bg-card)",
            color: showFilters ? "#fff" : "var(--text-secondary)",
            border: `1px solid ${showFilters ? "var(--accent-primary)" : "var(--border-light)"}`,
          }}
        >
          <Filter className="w-3 h-3" />
          Filters
          {categoryFilter !== "all" && (
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
          )}
        </button>
      </div>

      {/* Category filter pills */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
              {CATEGORY_TABS.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setCategoryFilter(c.key)}
                  className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor:
                      categoryFilter === c.key ? "var(--accent-primary)" : "var(--bg-card)",
                    color:
                      categoryFilter === c.key ? "#fff" : "var(--text-secondary)",
                    border: "1px solid var(--border-light)",
                  }}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* My Groups */}
      {myGroups.length > 0 && (
        <section className="px-4 pt-4 pb-3">
          <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-3"
            style={{ color: "var(--text-hint)" }}>
            <Star className="w-3.5 h-3.5" style={{ color: "var(--accent-secondary)" }} /> My Groups
          </p>
          <div className="space-y-2">
            {myGroups.slice(0, 3).map((g) => (
              <GroupCard
                key={g.id}
                group={g}
                isMember={true}
                onOpen={onOpenGroup}
                onJoin={onJoinGroup}
              />
            ))}
          </div>
        </section>
      )}

      {/* Trending Groups */}
      {trendingGroups.length > 0 && (
        <section className="px-4 pt-4 pb-3">
          <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-3"
            style={{ color: "var(--text-hint)" }}>
            <Flame className="w-3.5 h-3.5 text-orange-500" /> Trending
          </p>
          <div className="space-y-2">
            {trendingGroups.map((g) => (
              <GroupCard
                key={g.id}
                group={g}
                isMember={!!membershipMap[g.id]}
                onOpen={onOpenGroup}
                onJoin={onJoinGroup}
              />
            ))}
          </div>
        </section>
      )}

      {/* All Groups */}
      {!search && categoryFilter === "all" ? (
        <section className="px-4 pt-4 pb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
              style={{ color: "var(--text-hint)" }}>
              <Users className="w-3.5 h-3.5" /> All Groups
            </p>
          </div>
          {groups.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-5xl mb-3">👥</div>
              <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                No groups yet
              </p>
              {user && (
                <button
                  onClick={() => navigate(createPageUrl("CreateGroup"))}
                  className="mt-4 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ backgroundColor: "var(--accent-primary)" }}
                >
                  Create a Group
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {groups.map((g) => (
                <GroupCard
                  key={g.id}
                  group={g}
                  isMember={!!membershipMap[g.id]}
                  onOpen={onOpenGroup}
                  onJoin={onJoinGroup}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="px-4 pt-4 pb-6">
          <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-hint)" }}>
            {filteredGroups.length} result{filteredGroups.length !== 1 ? "s" : ""}
          </p>
          {filteredGroups.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                No groups found
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredGroups.map((g) => (
                <GroupCard
                  key={g.id}
                  group={g}
                  isMember={!!membershipMap[g.id]}
                  onOpen={onOpenGroup}
                  onJoin={onJoinGroup}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}