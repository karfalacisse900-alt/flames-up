import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Layers3, Sparkles, Users } from "lucide-react";
import GroupCard from "@/components/groups/GroupCard";

export default function Groups() {
  const [user, setUser] = useState(null);
  const [joiningId, setJoiningId] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: groups = [], refetch } = useQuery({
    queryKey: ["groups-redesign"],
    queryFn: () => base44.entities.Group.list("-created_date", 24),
    initialData: [],
  });

  const { data: memberships = [], refetch: refetchMemberships } = useQuery({
    queryKey: ["group-memberships", user?.email],
    enabled: !!user?.email,
    queryFn: () => base44.entities.GroupMember.filter({ user_email: user.email }, "-created_date", 200),
    initialData: [],
  });

  const featured = groups.slice(0, 6);
  const categories = useMemo(() => Array.from(new Set(groups.map((group) => group.category).filter(Boolean))).slice(0, 5), [groups]);
  const joinedIds = useMemo(() => new Set(memberships.map((member) => member.group_id)), [memberships]);
  const hero = featured[0];

  const handleJoin = async (group) => {
    if (!user) {
      await base44.auth.redirectToLogin(window.location.pathname);
      return;
    }
    if (joinedIds.has(group.id) || joiningId) return;
    setJoiningId(group.id);
    await base44.entities.GroupMember.create({
      group_id: group.id,
      group_name: group.name,
      user_email: user.email,
      user_name: user.full_name || user.email,
      role: "member",
      joined_at: new Date().toISOString(),
    });
    await base44.entities.Group.update(group.id, { member_count: (group.member_count || 0) + 1 });
    await Promise.all([refetch(), refetchMemberships()]);
    setJoiningId(null);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6 md:py-8">
      <section className="overflow-hidden rounded-[40px] border" style={{ background: "linear-gradient(135deg, rgba(79,70,229,0.16), rgba(20,184,166,0.08), #fff)", borderColor: "rgba(148,163,184,0.18)", boxShadow: "var(--elevation-4)" }}>
        <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-8 md:p-10">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold" style={{ backgroundColor: "rgba(255,255,255,0.74)", color: "var(--accent-primary)" }}>
              <Layers3 className="h-3.5 w-3.5" /> Groups reimagined
            </div>
            <h1 className="mt-6 h1" style={{ color: "var(--text-primary)" }}>A visual community hub, not a plain list</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 md:text-base" style={{ color: "var(--text-secondary)" }}>This version uses a hero spotlight, category rail, and a gallery-style group field so browsing feels much more alive.</p>
          </div>
          <div className="grid gap-4 p-6 md:p-8 md:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-[28px] border p-5" style={{ backgroundColor: "rgba(255,255,255,0.78)", borderColor: "rgba(148,163,184,0.16)" }}>
              <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-hint)" }}>Groups</div>
              <div className="mt-3 text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{groups.length}</div>
            </div>
            <div className="rounded-[28px] border p-5" style={{ backgroundColor: "rgba(255,255,255,0.78)", borderColor: "rgba(148,163,184,0.16)" }}>
              <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-hint)" }}>Categories</div>
              <div className="mt-3 text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{categories.length}</div>
            </div>
            <div className="rounded-[28px] border p-5" style={{ backgroundColor: "rgba(255,255,255,0.78)", borderColor: "rgba(148,163,184,0.16)" }}>
              <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-hint)" }}>Focus</div>
              <div className="mt-3 inline-flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}><Sparkles className="h-4 w-4" /> Mixed-size gallery</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <div className="overflow-hidden rounded-[36px] border" style={{ backgroundColor: "var(--bg-card)", borderColor: "rgba(148,163,184,0.16)", boxShadow: "var(--elevation-3)" }}>
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="p-6 md:p-8" style={{ background: "linear-gradient(135deg, rgba(79,70,229,0.14), rgba(20,184,166,0.10), rgba(255,255,255,0.95))" }}>
              <h2 className="h2" style={{ color: "var(--text-primary)" }}>{hero?.name || hero?.title || "Find your next community"}</h2>
              <p className="mt-4 max-w-xl text-sm leading-7" style={{ color: "var(--text-secondary)" }}>{hero?.description || "A brighter, more editorial layout puts the most interesting group front and center instead of burying everything in rows."}</p>
            </div>
            <div className="p-6 md:p-8">
              <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-hint)" }}>Popular categories</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {categories.map((category) => (
                  <div key={category} className="rounded-full px-3 py-2 text-sm font-semibold capitalize" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>{category}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[34px] border p-6" style={{ backgroundColor: "var(--bg-card)", borderColor: "rgba(148,163,184,0.16)", boxShadow: "var(--elevation-2)" }}>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" style={{ color: "var(--accent-secondary)" }} />
            <h2 className="h4" style={{ color: "var(--text-primary)" }}>What changed</h2>
          </div>
          <p className="mt-4 text-sm leading-7" style={{ color: "var(--text-secondary)" }}>The page now mixes a big spotlight surface with a masonry field of groups, so it feels like discovery instead of a directory.</p>
        </div>
      </section>

      <section className="masonry-grid">
        {groups.map((group) => (
          <div key={group.id} className="masonry-item">
            <GroupCard group={group} onJoin={handleJoin} isJoined={joinedIds.has(group.id)} isJoining={joiningId === group.id} />
          </div>
        ))}
      </section>
    </div>
  );
}