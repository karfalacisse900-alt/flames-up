import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Calendar, Mail, Shield, Sparkles } from "lucide-react";
import ProfileMetric from "@/components/profile/ProfileMetric";

export default function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: posts = [] } = useQuery({
    queryKey: ["profile-posts", user?.email],
    enabled: !!user?.email,
    queryFn: async () => {
      const all = await base44.entities.CommunityPost.list("-created_date", 24);
      return all.filter((item) => item.author_email === user.email);
    },
    initialData: [],
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["profile-messages", user?.email],
    enabled: !!user?.email,
    queryFn: async () => {
      const all = await base44.entities.DirectMessage.list("-created_date", 60);
      return all.filter((item) => item.sender_email === user.email || item.receiver_email === user.email);
    },
    initialData: [],
  });

  const spotlight = useMemo(() => posts.slice(0, 4), [posts]);

  if (!user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <div className="overflow-hidden rounded-[38px] border" style={{ background: "linear-gradient(135deg, rgba(79,70,229,0.14), rgba(20,184,166,0.08), #fff)", borderColor: "rgba(148,163,184,0.18)", boxShadow: "var(--elevation-3)" }}>
          <div className="p-8 md:p-12">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold" style={{ backgroundColor: "rgba(255,255,255,0.75)", color: "var(--accent-primary)" }}>
              <Sparkles className="h-3.5 w-3.5" /> Profile redesign
            </div>
            <h1 className="mt-6 h1" style={{ color: "var(--text-primary)" }}>A completely different profile canvas</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 md:text-base" style={{ color: "var(--text-secondary)" }}>Log in to see the new full-width profile layout with a split hero, asymmetric panels, and editorial post tiles.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6 md:py-8">
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="overflow-hidden rounded-[40px] border" style={{ backgroundColor: "var(--bg-card)", borderColor: "rgba(148,163,184,0.16)", boxShadow: "var(--elevation-4)" }}>
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative p-8 md:p-10" style={{ background: "linear-gradient(135deg, rgba(79,70,229,0.18), rgba(20,184,166,0.10), rgba(255,255,255,0.96))" }}>
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.3)" }} />
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold" style={{ backgroundColor: "rgba(255,255,255,0.78)", color: "var(--accent-primary)" }}>
                <Sparkles className="h-3.5 w-3.5" /> Profile reimagined
              </div>
              <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-end">
                <div className="flex h-28 w-28 items-center justify-center rounded-[34px] text-3xl font-bold" style={{ backgroundColor: "rgba(255,255,255,0.72)", color: "var(--accent-primary)", boxShadow: "var(--elevation-2)" }}>
                  {(user.full_name || user.email || "U").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h1 className="h1" style={{ color: "var(--text-primary)" }}>{user.full_name || "Your profile"}</h1>
                  <p className="mt-3 text-sm md:text-base" style={{ color: "var(--text-secondary)" }}>{user.email}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-6 md:p-8">
              <div className="rounded-[30px] border p-5" style={{ backgroundColor: "var(--bg-subtle)", borderColor: "var(--border-light)" }}>
                <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-hint)" }}>Account snapshot</div>
                <div className="mt-4 space-y-3 text-sm" style={{ color: "var(--text-primary)" }}>
                  <div className="flex items-center gap-3"><Shield className="h-4 w-4" /> {user.role || "user"}</div>
                  <div className="flex items-center gap-3"><Calendar className="h-4 w-4" /> Active member</div>
                  <div className="flex items-center gap-3"><Mail className="h-4 w-4" /> Connected inbox</div>
                </div>
              </div>
              <div className="rounded-[30px] border p-5" style={{ background: "linear-gradient(135deg, rgba(15,23,42,0.05), rgba(255,255,255,0.95))", borderColor: "rgba(148,163,184,0.16)" }}>
                <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-hint)" }}>Design direction</div>
                <p className="mt-4 text-sm leading-7" style={{ color: "var(--text-secondary)" }}>This version is built like a broad profile canvas instead of a stack of identical boxes.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
          <ProfileMetric label="Posts" value={posts.length} />
          <ProfileMetric label="Messages" value={messages.length} tone="accent" />
          <ProfileMetric label="Role" value={user.role || "user"} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <div className="grid gap-4">
          <div className="rounded-[32px] border p-6" style={{ backgroundColor: "var(--bg-card)", borderColor: "rgba(148,163,184,0.16)", boxShadow: "var(--elevation-2)" }}>
            <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-hint)" }}>Display name</div>
            <p className="mt-3 text-xl font-semibold" style={{ color: "var(--text-primary)" }}>{user.full_name || "Not set"}</p>
          </div>
          <div className="rounded-[32px] border p-6" style={{ backgroundColor: "var(--bg-card)", borderColor: "rgba(148,163,184,0.16)", boxShadow: "var(--elevation-2)" }}>
            <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-hint)" }}>Email</div>
            <p className="mt-3 break-all text-sm leading-7" style={{ color: "var(--text-primary)" }}>{user.email}</p>
          </div>
          <div className="rounded-[32px] border p-6" style={{ background: "linear-gradient(135deg, rgba(20,184,166,0.12), rgba(255,255,255,0.95))", borderColor: "rgba(148,163,184,0.16)", boxShadow: "var(--elevation-1)" }}>
            <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-hint)" }}>What changed</div>
            <p className="mt-3 text-sm leading-7" style={{ color: "var(--text-secondary)" }}>More open space, a split-stage hero, and mixed-size surfaces so it finally stops feeling like the same structure.</p>
          </div>
        </div>

        <div className="rounded-[36px] border p-6" style={{ backgroundColor: "var(--bg-card)", borderColor: "rgba(148,163,184,0.16)", boxShadow: "var(--elevation-3)" }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="h3" style={{ color: "var(--text-primary)" }}>Writing spotlight</h2>
              <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>A mosaic of your recent posts instead of another vertical feed.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {spotlight.length ? spotlight.map((item, index) => (
              <div key={item.id} className={index === 0 ? "md:col-span-2" : ""}>
                <div className="h-full rounded-[30px] border p-5" style={{ background: index === 0 ? "linear-gradient(135deg, rgba(79,70,229,0.12), rgba(20,184,166,0.08))" : "var(--bg-subtle)", borderColor: "var(--border-light)" }}>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-hint)" }}>{item.type || "post"}</div>
                  <p className="mt-3 text-sm leading-7" style={{ color: "var(--text-primary)" }}>{item.body}</p>
                </div>
              </div>
            )) : (
              <div className="md:col-span-2 rounded-[30px] border p-6" style={{ backgroundColor: "var(--bg-subtle)", borderColor: "var(--border-light)" }}>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No posts yet.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}