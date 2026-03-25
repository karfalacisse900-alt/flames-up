import React, { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, X } from "lucide-react";
import GroupHub from "@/components/groups/GroupHub";
import CreateGroupModal from "@/components/groups/CreateGroupModal";
import GroupDetailModal from "@/components/groups/GroupDetailModal";

const CATEGORY_SECTIONS = [
  { key: "sports",  label: "Sport communities",   },
  { key: "fitness", label: "Fitness communities",  },
  { key: "food",    label: "Cooking posts",        },
  { key: "music",   label: "Music communities",    },
  { key: "tech",    label: "Tech communities",     },
  { key: "art",     label: "Art communities",      },
  { key: "travel",  label: "Travel communities",   },
  { key: "gaming",  label: "Gaming communities",   },
  { key: "movies",  label: "Movie communities",    },
  { key: "general", label: "General",              },
];

function GroupCard({ group, onClick }) {
  const memberCount = group.member_count || 0;
  const tags = [];
  if (group.category) tags.push(group.category);
  const words = (group.name || "").toLowerCase().split(/\s+/).filter(w => w.length > 3);
  words.slice(0, 3).forEach(w => { if (!tags.includes(w)) tags.push(w); });

  const GRADIENTS = {
    sports: "linear-gradient(135deg,#ea580c,#dc2626)",
    fitness: "linear-gradient(135deg,#0d9488,#16a34a)",
    food: "linear-gradient(135deg,#ea580c,#d97706)",
    music: "linear-gradient(135deg,#db2777,#be185d)",
    tech: "linear-gradient(135deg,#0284c7,#0369a1)",
    art: "linear-gradient(135deg,#7c3aed,#a21caf)",
    travel: "linear-gradient(135deg,#0284c7,#6d28d9)",
    gaming: "linear-gradient(135deg,#16a34a,#15803d)",
    movies: "linear-gradient(135deg,#7c3aed,#4338ca)",
    general: "linear-gradient(135deg,#64748b,#475569)",
  };
  const gradBg = GRADIENTS[group.category] || GRADIENTS.general;

  return (
    <button onClick={onClick} className="text-left w-full" style={{ background: "none", border: "none", padding: 0 }}>
      {/* Cover */}
      <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: "3/4" }}>
        {group.cover_url || group.logo_url ? (
          <img src={group.cover_url || group.logo_url} alt={group.name}
            className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl"
            style={{ background: gradBg }}>
            {group.emoji || "💬"}
          </div>
        )}
        {/* Member badge */}
        {memberCount > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "rgba(240,240,240,0.92)", backdropFilter: "blur(6px)" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#333" }}>{memberCount}</span>
          </div>
        )}
      </div>
      {/* Name */}
      <p className="font-bold mt-2 leading-tight" style={{ fontSize: 14, color: "#0F172A", fontFamily: "var(--font-serif)" }}>
        {group.name}
      </p>
      {/* Hashtags */}
      <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 2, lineHeight: 1.5 }}>
        {tags.map(t => `#${t}`).join(" ")}
      </p>
    </button>
  );
}

export default function Groups() {
  const [user, setUser] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);
  const [activeMembership, setActiveMembership] = useState(null);
  const [activeTab, setActiveTab] = useState("for_you");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailGroup, setDetailGroup] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState("");
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

  if (activeGroup) {
    return (
      <GroupHub group={activeGroup} user={user} membership={activeMembership}
        isMember={!!activeMembership} onBack={() => setActiveGroup(null)}
        onJoin={() => handleJoin(activeGroup)} onLeave={handleLeave} />
    );
  }

  const firstName = user?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";
  const fullName = user?.full_name || user?.email?.split("@")[0] || "User";

  // Filtered groups
  const filtered = search.trim()
    ? groups.filter(g => g.name?.toLowerCase().includes(search.toLowerCase()) || g.description?.toLowerCase().includes(search.toLowerCase()))
    : groups;

  // Sort by tab
  const sorted = activeTab === "popular"
    ? [...filtered].sort((a, b) => (b.member_count || 0) - (a.member_count || 0))
    : filtered;

  // Group by category
  const byCategory = {};
  CATEGORY_SECTIONS.forEach(cat => {
    const list = sorted.filter(g => g.category === cat.key);
    if (list.length > 0) byCategory[cat.key] = list;
  });
  const knownCats = new Set(CATEGORY_SECTIONS.map(c => c.key));
  const others = sorted.filter(g => !knownCats.has(g.category));
  if (others.length > 0) byCategory["__other"] = others;

  return (
    <div style={{ minHeight: "100dvh", backgroundColor: "#ffffff" }}>
      {/* ── HEADER ── */}
      <div className="px-4" style={{ paddingTop: "max(env(safe-area-inset-top, 16px), 16px)", paddingBottom: 12, backgroundColor: "#fff" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
              background: "linear-gradient(135deg,#4F46E5,#7C3AED)", display: "flex", alignItems: "center",
              justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 16 }}>
              {user?.profile_image_url
                ? <img src={user.profile_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : (user?.full_name?.[0] || "U").toUpperCase()}
            </div>
            <div>
              <p style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1 }}>Welcome back,</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", fontFamily: "var(--font-serif)", lineHeight: 1.2 }}>{fullName}</p>
            </div>
          </div>
          <button onClick={() => setShowSearch(v => !v)}
            style={{ width: 40, height: 40, borderRadius: "50%", border: "none",
              backgroundColor: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Search style={{ width: 18, height: 18, color: "#475569" }} />
          </button>
        </div>

        {/* Search */}
        <AnimatePresence>
          {showSearch && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              style={{ overflow: "hidden", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
                borderRadius: 16, backgroundColor: "#F1F5F9", border: "1px solid #E2E8F0" }}>
                <Search style={{ width: 16, height: 16, color: "#94A3B8", flexShrink: 0 }} />
                <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search communities…"
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none",
                    fontSize: 14, color: "#0F172A", minHeight: "unset", boxShadow: "none", padding: 0 }} />
                {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  <X style={{ width: 16, height: 16, color: "#94A3B8" }} />
                </button>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab pills + Create */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setActiveTab("for_you")}
            style={{ padding: "9px 18px", borderRadius: 999, border: "none", cursor: "pointer",
              fontSize: 14, fontWeight: 700,
              backgroundColor: activeTab === "for_you" ? "#0F172A" : "transparent",
              color: activeTab === "for_you" ? "#fff" : "#64748B" }}>
            For you
          </button>
          <button onClick={() => setActiveTab("popular")}
            style={{ padding: "9px 18px", borderRadius: 999, cursor: "pointer",
              fontSize: 14, fontWeight: 600,
              backgroundColor: "transparent",
              color: activeTab === "popular" ? "#0F172A" : "#64748B",
              border: activeTab === "popular" ? "1.5px solid #0F172A" : "1.5px solid #E2E8F0" }}>
            Most popular
          </button>
          <button onClick={() => setShowCreateModal(true)}
            style={{ marginLeft: "auto", padding: "9px 16px", borderRadius: 999, border: "none",
              backgroundColor: "#14B8A6", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4 }}>
            <Plus style={{ width: 14, height: 14 }} /> Create
          </button>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ padding: "0 16px 100px" }}>
        {search ? (
          <>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
              {filtered.length} results
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {filtered.map(g => (
                <GroupCard key={g.id} group={g}
                  onClick={() => membershipMap[g.id] ? handleOpenGroup(g) : setDetailGroup(g)} />
              ))}
            </div>
          </>
        ) : (
          CATEGORY_SECTIONS.map(cat => {
            const list = byCategory[cat.key];
            if (!list || list.length === 0) return null;
            const activeCount = list.filter(g => membershipMap[g.id]).length;
            return (
              <section key={cat.key} style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <p style={{ fontSize: 17, fontWeight: 700, color: "#0F172A", fontFamily: "var(--font-serif)" }}>
                    {cat.label}
                  </p>
                  {activeCount > 0 ? (
                    <span style={{ fontSize: 13, color: "#64748B", fontWeight: 500 }}>{activeCount} active</span>
                  ) : (
                    <button style={{ fontSize: 13, color: "#64748B", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}>
                      View all
                    </button>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {list.slice(0, 6).map(g => (
                    <GroupCard key={g.id} group={g}
                      onClick={() => membershipMap[g.id] ? handleOpenGroup(g) : setDetailGroup(g)} />
                  ))}
                </div>
              </section>
            );
          })
        )}

        {/* Other */}
        {!search && byCategory["__other"]?.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 17, fontWeight: 700, color: "#0F172A", fontFamily: "var(--font-serif)", marginBottom: 14 }}>
              Other communities
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {byCategory["__other"].slice(0, 6).map(g => (
                <GroupCard key={g.id} group={g}
                  onClick={() => membershipMap[g.id] ? handleOpenGroup(g) : setDetailGroup(g)} />
              ))}
            </div>
          </section>
        )}

        {Object.keys(byCategory).length === 0 && !search && (
          <div style={{ textAlign: "center", paddingTop: 80 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏘️</div>
            <p style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>No communities yet</p>
            <p style={{ fontSize: 14, color: "#64748B", marginBottom: 24 }}>Be the first to create one!</p>
            <button onClick={() => setShowCreateModal(true)}
              style={{ padding: "12px 24px", borderRadius: 16, backgroundColor: "#0F172A", color: "#fff",
                fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer" }}>
              Create a Community
            </button>
          </div>
        )}
      </div>

      {detailGroup && (
        <GroupDetailModal group={detailGroup} isMember={!!membershipMap[detailGroup.id]}
          onClose={() => setDetailGroup(null)} onJoin={handleJoin} onOpen={handleOpenGroup} />
      )}
      <CreateGroupModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onCreated={handleCreated} user={user} />
    </div>
  );
}