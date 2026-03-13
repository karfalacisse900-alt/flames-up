import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Calendar, Heart, MessageSquare, User } from "lucide-react";
import PageIntroCard from "@/components/shared/PageIntroCard";
import ProfileMetric from "@/components/profile/ProfileMetric";

export default function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: statuses = [] } = useQuery({
    queryKey: ["profile-statuses", user?.email],
    enabled: !!user?.email,
    queryFn: async () => {
      const all = await base44.entities.NowStatus.list("-created_date", 20);
      return all.filter((item) => item.author_email === user.email).slice(0, 4);
    },
    initialData: [],
  });

  const { data: posts = [] } = useQuery({
    queryKey: ["profile-posts", user?.email],
    enabled: !!user?.email,
    queryFn: async () => {
      const all = await base44.entities.CommunityPost.list("-created_date", 20);
      return all.filter((item) => item.author_email === user.email).slice(0, 4);
    },
    initialData: [],
  });

  if (!user) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8 space-y-6">
        <PageIntroCard eyebrow="Profile redesign" title="Your profile, reimagined" description="Sign in to see your polished personal hub with cleaner sections, better hierarchy, and a softer visual feel." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8 space-y-6">
      <PageIntroCard
        eyebrow="Personal hub"
        title={`Welcome back, ${user.full_name?.split(" ")[0] || "there"}`}
        description="A cleaner profile layout with softer cards, better spacing, and a calmer visual rhythm across your identity and recent activity."
      />

      <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-[30px] border p-6 md:p-7" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)", boxShadow: "var(--elevation-2)" }}>
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-[28px] text-2xl font-bold" style={{ background: "linear-gradient(135deg, rgba(79,70,229,0.16), rgba(20,184,166,0.16))", color: "var(--accent-primary)" }}>
                {(user.full_name || user.email || "U").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="h3" style={{ color: "var(--text-primary)" }}>{user.full_name || "Your profile"}</h2>
                <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>{user.email}</p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
                  <Calendar className="h-3.5 w-3.5" /> Member space
                </div>
              </div>
            </div>
            <button className="px-4 py-3 text-sm font-semibold rounded-2xl" style={{ backgroundColor: "var(--accent-primary)", color: "white" }}>Edit profile</button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <ProfileMetric label="Now posts" value={statuses.length} />
          <ProfileMetric label="Community posts" value={posts.length} tone="accent" />
          <ProfileMetric label="Role" value={user.role || "user"} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[30px] border p-6" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)", boxShadow: "var(--elevation-2)" }}>
          <div className="mb-4 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" style={{ color: "var(--accent-primary)" }} />
            <h3 className="h4" style={{ color: "var(--text-primary)" }}>Recent Now activity</h3>
          </div>
          <div className="space-y-3">
            {statuses.length ? statuses.map((item) => (
              <div key={item.id} className="rounded-[22px] border p-4" style={{ backgroundColor: "var(--bg-subtle)", borderColor: "var(--border-light)" }}>
                <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-hint)" }}>{item.category || "now"}</div>
                <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-primary)" }}>{item.text || "Shared a media update"}</p>
              </div>
            )) : <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No recent Now posts yet.</p>}
          </div>
        </div>

        <div className="rounded-[30px] border p-6" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)", boxShadow: "var(--elevation-2)" }}>
          <div className="mb-4 flex items-center gap-2">
            <Heart className="h-4 w-4" style={{ color: "var(--accent-secondary)" }} />
            <h3 className="h4" style={{ color: "var(--text-primary)" }}>Community highlights</h3>
          </div>
          <div className="space-y-3">
            {posts.length ? posts.map((item) => (
              <div key={item.id} className="rounded-[22px] border p-4" style={{ backgroundColor: "var(--bg-subtle)", borderColor: "var(--border-light)" }}>
                <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-hint)" }}>{item.type || "discussion"}</div>
                <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-primary)" }}>{item.body}</p>
              </div>
            )) : <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No community posts yet.</p>}
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border p-6" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)", boxShadow: "var(--elevation-1)" }}>
        <div className="mb-4 flex items-center gap-2">
          <User className="h-4 w-4" style={{ color: "var(--accent-primary)" }} />
          <h3 className="h4" style={{ color: "var(--text-primary)" }}>Profile style notes</h3>
        </div>
        <p className="text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
          This page now uses calmer spacing, stronger text hierarchy, softer corners, and cleaner surfaces so your profile feels more premium and easier to scan on mobile.
        </p>
      </section>
    </div>
  );
}