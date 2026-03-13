import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Calendar, Heart, Mail, Sparkles, User, Wand2 } from "lucide-react";
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
      const all = await base44.entities.DirectMessage.list("-created_date", 50);
      return all.filter((item) => item.sender_email === user.email || item.receiver_email === user.email);
    },
    initialData: [],
  });

  const featuredPosts = useMemo(() => posts.slice(0, 3), [posts]);

  if (!user) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6 md:py-8">
        <PageIntroCard eyebrow="Profile redesign" title="A more editorial profile" description="Sign in to see the new profile layout with stronger hierarchy, richer cards, and less stacked content." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6 md:py-8">
      <PageIntroCard
        eyebrow="Profile redesign"
        title={`Hey ${user.full_name?.split(" ")[0] || "there"}, this looks better`}
        description="This version uses a bento-style layout with larger hero sections, cleaner spacing, and a less vertical feel across the whole page."
        action={<button className="px-4 py-3 text-sm font-semibold rounded-2xl" style={{ backgroundColor: "var(--accent-primary)", color: "white" }}>Edit profile</button>}
      />

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[34px] border p-6 md:p-8" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)", boxShadow: "var(--elevation-2)" }}>
          <div className="grid gap-6 lg:grid-cols-[auto_1fr] lg:items-end">
            <div className="flex h-28 w-28 items-center justify-center rounded-[32px] text-3xl font-bold" style={{ background: "linear-gradient(135deg, rgba(79,70,229,0.18), rgba(20,184,166,0.18))", color: "var(--accent-primary)" }}>
              {(user.full_name || user.email || "U").slice(0, 2).toUpperCase()}
            </div>
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
                <Sparkles className="h-3.5 w-3.5" /> Personal space
              </div>
              <div>
                <h2 className="h2" style={{ color: "var(--text-primary)" }}>{user.full_name || "Your profile"}</h2>
                <p className="mt-2 text-sm md:text-base" style={{ color: "var(--text-secondary)" }}>{user.email}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-[26px] p-5" style={{ background: "linear-gradient(135deg, rgba(79,70,229,0.10), rgba(79,70,229,0.04))" }}>
              <div className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--text-hint)" }}>Identity</div>
              <div className="mt-4 flex items-center gap-3 text-sm" style={{ color: "var(--text-primary)" }}><User className="h-4 w-4" /> {user.role || "user"}</div>
              <div className="mt-3 flex items-center gap-3 text-sm" style={{ color: "var(--text-primary)" }}><Calendar className="h-4 w-4" /> Active member</div>
            </div>
            <div className="rounded-[26px] p-5" style={{ background: "linear-gradient(135deg, rgba(20,184,166,0.10), rgba(20,184,166,0.04))" }}>
              <div className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--text-hint)" }}>Communication</div>
              <div className="mt-4 flex items-center gap-3 text-sm" style={{ color: "var(--text-primary)" }}><Mail className="h-4 w-4" /> {messages.length} messages</div>
              <div className="mt-3 flex items-center gap-3 text-sm" style={{ color: "var(--text-primary)" }}><Heart className="h-4 w-4" /> {posts.length} published posts</div>
            </div>
            <div className="rounded-[26px] p-5" style={{ background: "linear-gradient(135deg, rgba(15,23,42,0.06), rgba(15,23,42,0.02))" }}>
              <div className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--text-hint)" }}>Vibe</div>
              <p className="mt-4 text-sm leading-7" style={{ color: "var(--text-secondary)" }}>Cleaner, softer, and less cramped with stronger hierarchy and clearer visual blocks.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
          <ProfileMetric label="Posts" value={posts.length} />
          <ProfileMetric label="Messages" value={messages.length} tone="accent" />
          <ProfileMetric label="Role" value={user.role || "user"} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[32px] border p-6" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)", boxShadow: "var(--elevation-2)" }}>
          <div className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" style={{ color: "var(--accent-primary)" }} />
            <h3 className="h4" style={{ color: "var(--text-primary)" }}>Profile snapshot</h3>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-[24px] border p-4" style={{ backgroundColor: "var(--bg-subtle)", borderColor: "var(--border-light)" }}>
              <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-hint)" }}>Display name</div>
              <p className="mt-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{user.full_name || "Not set"}</p>
            </div>
            <div className="rounded-[24px] border p-4" style={{ backgroundColor: "var(--bg-subtle)", borderColor: "var(--border-light)" }}>
              <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-hint)" }}>Email</div>
              <p className="mt-2 break-all text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{user.email}</p>
            </div>
            <div className="rounded-[24px] border p-4 sm:col-span-2 xl:col-span-1" style={{ backgroundColor: "var(--bg-subtle)", borderColor: "var(--border-light)" }}>
              <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-hint)" }}>Why this feels better</div>
              <p className="mt-2 text-sm leading-7" style={{ color: "var(--text-secondary)" }}>Instead of stacked mini-lists, this page now mixes larger cards, wide content areas, and grouped information blocks.</p>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border p-6" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)", boxShadow: "var(--elevation-2)" }}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="h4" style={{ color: "var(--text-primary)" }}>Post spotlight</h3>
              <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>A wider, card-based reading area instead of a plain vertical list.</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {featuredPosts.length ? featuredPosts.map((item, index) => (
              <div key={item.id} className={index === 0 ? "md:col-span-2" : ""}>
                <div className="h-full rounded-[26px] border p-5" style={{ background: index === 0 ? "linear-gradient(135deg, rgba(79,70,229,0.10), rgba(20,184,166,0.08))" : "var(--bg-subtle)", borderColor: "var(--border-light)" }}>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-hint)" }}>{item.type || "post"}</div>
                  <p className="mt-3 text-sm leading-7" style={{ color: "var(--text-primary)" }}>{item.body}</p>
                </div>
              </div>
            )) : (
              <div className="md:col-span-2 rounded-[26px] border p-6" style={{ backgroundColor: "var(--bg-subtle)", borderColor: "var(--border-light)" }}>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No posts yet.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}