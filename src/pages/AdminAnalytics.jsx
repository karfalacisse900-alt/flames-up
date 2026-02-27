import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Users, FileText, Star, Award, Activity, ShieldCheck, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, subDays } from "date-fns";

const COLORS = ["#2E6B4F", "#D98B62", "#4A7FC1", "#E07070", "#7C69C4", "#F5A623"];

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="rounded-2xl p-4 flex items-start gap-3" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}18` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{value}</p>
        <p className="text-xs font-semibold mt-0.5" style={{ color: "var(--text-secondary)" }}>{label}</p>
        {sub && <p className="text-[10px] mt-0.5" style={{ color: "var(--text-hint)" }}>{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminAnalytics() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u?.role !== "admin") window.location.href = "/";
    }).catch(() => window.location.href = "/");
  }, []);

  const { data: submissions = [] } = useQuery({
    queryKey: ["adminSubs"],
    queryFn: () => base44.entities.UserSubmittedMedia.list("-created_date", 200),
    enabled: !!user,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["adminRevs"],
    queryFn: () => base44.entities.UserMediaReview.list("-created_date", 200),
    enabled: !!user,
  });

  const { data: artworks = [] } = useQuery({
    queryKey: ["adminArtworks"],
    queryFn: () => base44.entities.Artwork.list("-created_date", 100),
    enabled: !!user,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ["adminPosts"],
    queryFn: () => base44.entities.Post.list("-created_date", 100),
    enabled: !!user,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: () => base44.entities.User.list("-created_date", 200),
    enabled: !!user,
  });

  // Submissions by media type
  const submissionsByType = useMemo(() => {
    const map = {};
    submissions.forEach(s => {
      map[s.media_type] = (map[s.media_type] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count }));
  }, [submissions]);

  // Review status breakdown
  const reviewStatus = useMemo(() => {
    const map = { pending: 0, approved: 0, rejected: 0 };
    reviews.forEach(r => { if (map[r.status] !== undefined) map[r.status]++; });
    return Object.entries(map).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, [reviews]);

  // Submission status breakdown
  const submissionStatus = useMemo(() => {
    const map = { pending: 0, approved: 0, rejected: 0 };
    submissions.forEach(s => { if (map[s.status] !== undefined) map[s.status]++; });
    return Object.entries(map).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, [submissions]);

  // Activity over last 7 days
  const activityByDay = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      return { date: format(d, "MM/dd"), label: format(d, "EEE"), subs: 0, reviews: 0, posts: 0 };
    });
    submissions.forEach(s => {
      const d = format(new Date(s.created_date), "MM/dd");
      const day = days.find(x => x.date === d);
      if (day) day.subs++;
    });
    reviews.forEach(r => {
      const d = format(new Date(r.created_date), "MM/dd");
      const day = days.find(x => x.date === d);
      if (day) day.reviews++;
    });
    posts.forEach(p => {
      const d = format(new Date(p.created_date), "MM/dd");
      const day = days.find(x => x.date === d);
      if (day) day.posts++;
    });
    return days;
  }, [submissions, reviews, posts]);

  // Top artworks by votes
  const topArtworks = useMemo(() => {
    return [...artworks]
      .sort((a, b) => (b.vote_count || b.like_count || 0) - (a.vote_count || a.like_count || 0))
      .slice(0, 5)
      .map(a => ({ name: a.title?.slice(0, 15) + (a.title?.length > 15 ? "…" : ""), votes: a.vote_count || a.like_count || 0 }));
  }, [artworks]);

  const approvalRate = useMemo(() => {
    const approved = submissions.filter(s => s.status === "approved").length;
    return submissions.length > 0 ? Math.round((approved / submissions.length) * 100) : 0;
  }, [submissions]);

  const reviewApprovalRate = useMemo(() => {
    const approved = reviews.filter(r => r.status === "approved").length;
    return reviews.length > 0 ? Math.round((approved / reviews.length) * 100) : 0;
  }, [reviews]);

  if (!user) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
    </div>
  );

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4 sticky top-0 z-20" style={{ backgroundColor: "var(--bg-nav)", borderBottom: "1px solid var(--border-light)" }}>
        <div className="flex items-center gap-3">
          <Link to={createPageUrl("AdminContentManager")} className="p-2 rounded-xl" style={{ backgroundColor: "var(--bg-subtle)" }}>
            <ArrowLeft className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          </Link>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Analytics</h1>
            <p className="text-xs" style={{ color: "var(--text-hint)" }}>Platform overview & insights</p>
          </div>
          <ShieldCheck className="w-5 h-5 ml-auto" style={{ color: "var(--accent-primary)" }} />
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={FileText} label="Total Submissions" value={submissions.length} sub={`${submissions.filter(s=>s.status==='pending').length} pending`} color="#2E6B4F" />
          <StatCard icon={Star} label="Total Reviews" value={reviews.length} sub={`${reviews.filter(r=>r.status==='pending').length} pending`} color="#D98B62" />
          <StatCard icon={Award} label="Submission Approval" value={`${approvalRate}%`} sub={`${submissions.filter(s=>s.status==='approved').length} approved`} color="#4A7FC1" />
          <StatCard icon={Activity} label="Review Approval" value={`${reviewApprovalRate}%`} sub={`${reviews.filter(r=>r.status==='approved').length} approved`} color="#7C69C4" />
          <StatCard icon={Users} label="Total Users" value={users.length} sub="registered" color="#E07070" />
          <StatCard icon={TrendingUp} label="Gallery Artworks" value={artworks.length} sub="published" color="#F5A623" />
        </div>

        {/* Activity Line Chart */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <p className="text-sm font-bold mb-4" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>📈 Activity (Last 7 Days)</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={activityByDay} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--text-hint)" }} />
              <YAxis tick={{ fontSize: 10, fill: "var(--text-hint)" }} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 12, fontSize: 11 }} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="subs" stroke="#2E6B4F" strokeWidth={2} dot={false} name="Submissions" />
              <Line type="monotone" dataKey="reviews" stroke="#D98B62" strokeWidth={2} dot={false} name="Reviews" />
              <Line type="monotone" dataKey="posts" stroke="#4A7FC1" strokeWidth={2} dot={false} name="Posts" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Submissions by Media Type */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <p className="text-sm font-bold mb-4" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>🎬 Submissions by Media Type</p>
          {submissionsByType.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: "var(--text-hint)" }}>No submission data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={submissionsByType} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--text-hint)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--text-hint)" }} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 12, fontSize: 11 }} />
                <Bar dataKey="count" name="Submissions" radius={[6, 6, 0, 0]}>
                  {submissionsByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Side by side Pie Charts */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
            <p className="text-xs font-bold mb-3" style={{ color: "var(--text-primary)" }}>📝 Submission Status</p>
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie data={submissionStatus} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value">
                  {submissionStatus.map((_, i) => <Cell key={i} fill={["#F5A623", "#2E6B4F", "#E07070"][i]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1 mt-1">
              {submissionStatus.map((s, i) => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ["#F5A623","#2E6B4F","#E07070"][i] }} />
                  <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>{s.name}: {s.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
            <p className="text-xs font-bold mb-3" style={{ color: "var(--text-primary)" }}>⭐ Review Status</p>
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie data={reviewStatus} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value">
                  {reviewStatus.map((_, i) => <Cell key={i} fill={["#F5A623", "#2E6B4F", "#E07070"][i]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1 mt-1">
              {reviewStatus.map((s, i) => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ["#F5A623","#2E6B4F","#E07070"][i] }} />
                  <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>{s.name}: {s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Artworks by Votes */}
        {topArtworks.length > 0 && (
          <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
            <p className="text-sm font-bold mb-4" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>🏆 Top Artworks by Votes</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={topArtworks} layout="vertical" margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: "var(--text-hint)" }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "var(--text-hint)" }} width={80} />
                <Tooltip contentStyle={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 12, fontSize: 11 }} />
                <Bar dataKey="votes" name="Votes" fill="#F5A623" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Admin Links */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <p className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>⚙️ Admin Actions</p>
          <div className="space-y-2">
            <Link to={createPageUrl("AdminContentManager")} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
              <FileText className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Content Manager</span>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F5A623", color: "#fff" }}>{submissions.filter(s=>s.status==='pending').length} pending</span>
            </Link>
            <Link to={createPageUrl("AdminModeration")} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
              <ShieldCheck className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Moderation Panel</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}