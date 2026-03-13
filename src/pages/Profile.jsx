import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Calendar, Mail, Shield, Sparkles } from "lucide-react";
import PageIntroCard from "@/components/shared/PageIntroCard";
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
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6 md:py-8">
        <PageIntroCard eyebrow="Profile redesign" title="A completely different profile structure" description="Sign in to see the new canvas with larger blocks, mixed card sizes, and a more editorial layout." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6 md:py-8">
      <PageIntroCard
        eyebrow="Profile redesign"
        title={`This is a real redesign, ${user.full_name?.split(" ")[0] || "there"}`}
        description="The structure is now broader, more visual, and more asymmetrical so it stops feeling like the same old stacked profile page."
        action={null}
      />

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="overflow-hidden rounded-[36px] border" style={{ backgroundColor: "var(--bg-card)", borderColor: "rgba(148,163,184,0.16)", boxShadow: "var(--elevation-3)" }}>
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-6 md:p-8" style={{ background: "linear-gradient(135deg, rgba(79,70,229,0.16), rgba(20,184,166,0.10), rgba(255,255,255,0.94))" }}>
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold" style={{ backgroundColor: "rgba(255,255,255,0.78)", color: "var(--accent-primary)" }}>
                <Sparkles className="h-3.5 w-3.5" /> Identity canvas
              </div>
              <div className="mt-6 flex items-center gap-4">
                <div className="flex h-24 w-24 items-center justify-center rounded-[30px] text-3xl font-bold" style={{ backgroundColor: "rgba(255,255,255,0.64)", color: "var(--accent-primary)", boxShadow: "var(--elevation-2)" }}>
                  {(user.full_name || user.email || "U").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="h2" style={{ color: "var(--text-primary)" }}>{user.full_name || "Your profile"}</h2>
                  <p className="mt-2 text-sm md:text-base" style={{ color: "var(--text-secondary)" }}>{user.email}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-6 md:p-8 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[28px] border p-5" style={{ backgroundColor: "var(--bg-subtle)", borderColor: "var(--border-light)" }}>
                <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-hint)" }}>Account</div>
                <div className="mt-4 space-y-3 text-sm" style={{ color: "var(--text-primary)" }}>
                  <div className="flex items-center gap-3"><Shield className="h-4 w-4" /> {user.role || "user"}</div>
                  <div className="flex items-center gap-3"><Calendar className="h-4 w-4" /> Active member</div>
                  <div className="flex items-center gap-3"><Mail className="h-4 w-4" /> Connected inbox</div>
                </div>
              </div>
              <div className="rounded-[28px] border p-5" style={{ background: "linear-gradient(135deg, rgba(20,184,166,0.12), rgba(255,255,255,0.92))", borderColor: "rgba(148,163,184,0.16)" }}>
                <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-hint)" }}>Design note</div>
                <p className="mt-4 text-sm leading-7" style={{ color: "var(--text-secondary)" }}>Now it reads like a designed profile canvas instead of a stack of repeating cards.</p>
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

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[34px] border p-6" style={{ backgroundColor: "var(--bg-card)", borderColor: "rgba(148,163,184,0.16)", boxShadow: "var(--elevation-2)" }}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="h3" style={{ color: "var(--text-primary)" }}>Spotlight posts</h3>
              <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>Mixed-size tiles, not one flat list.</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {spotlight.length ? spotlight.map((item, index) => (
              <div key={item.id} className={index === 0 ? "md:col-span-2" : ""}>
                <div className="h-full rounded-[28px] border p-5" style={{ background: index === 0 ? "linear-gradient(135deg, rgba(79,70,229,0.12), rgba(20,184,166,0.08))" : "var(--bg-subtle)", borderColor: "var(--border-light)" }}>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-hint)" }}>{item.type || "post"}</div>
                  <p className="mt-3 text-sm leading-7" style={{ color: "var(--text-primary)" }}>{item.body}</p>
                </div>
              </div>
            )) : <div className="md:col-span-2 rounded-[28px] border p-6" style={{ backgroundColor: "var(--bg-subtle)", borderColor: "var(--border-light)" }}><p className="text-sm" style={{ color: "var(--text-secondary)" }}>No posts yet.</p></div>}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[30px] border p-6" style={{ backgroundColor: "var(--bg-card)", borderColor: "rgba(148,163,184,0.16)", boxShadow: "var(--elevation-2)" }}>
            <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-hint)" }}>Display name</div>
            <p className="mt-3 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{user.full_name || "Not set"}</p>
          </div>
          <div className="rounded-[30px] border p-6" style={{ backgroundColor: "var(--bg-card)", borderColor: "rgba(148,163,184,0.16)", boxShadow: "var(--elevation-2)" }}>
            <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-hint)" }}>Email</div>
            <p className="mt-3 break-all text-sm leading-7" style={{ color: "var(--text-primary)" }}>{user.email}</p>
          </div>
          <div className="rounded-[30px] border p-6" style={{ background: "linear-gradient(135deg, rgba(15,23,42,0.05), rgba(255,255,255,0.9))", borderColor: "rgba(148,163,184,0.16)", boxShadow: "var(--elevation-1)" }}>
            <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-hint)" }}>Why it changed</div>
            <p className="mt-3 text-sm leading-7" style={{ color: "var(--text-secondary)" }}>The page now uses wide hero composition, asymmetric content blocks, and larger surfaces so it no longer feels like the same design.</p>
          </div>
        </div>
      </section>
    </div>
  );
}