import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { BarChart2, Heart, Users, Eye, TrendingUp, MessageCircle, ArrowLeft, Film } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function CreatorDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: posts = [] } = useQuery({
    queryKey: ["creatorPosts", user?.email],
    queryFn: () => base44.entities.CommunityPost.filter({ author_email: user.email }, "-created_date", 200),
    enabled: !!user?.email,
  });

  const { data: followers = [] } = useQuery({
    queryKey: ["creatorFollowers", user?.email],
    queryFn: () => base44.entities.Follow.filter({ following_email: user.email }),
    enabled: !!user?.email,
  });

  const totalLikes = posts.reduce((sum, p) => sum + (p.upvotes || 0), 0);
  const totalComments = posts.reduce((sum, p) => sum + (p.comment_count || 0), 0);
  const totalViews = posts.reduce((sum, p) => sum + (p.engagement_score || 0), 0);
  const videoPosts = posts.filter(p => p.video_url);
  const topPosts = [...posts].sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0)).slice(0, 5);

  const stats = [
    { label: "Total Likes", value: totalLikes, icon: Heart, color: "#E05C7A", bg: "#E05C7A18" },
    { label: "Followers", value: followers.length, icon: Users, color: "var(--accent-primary)", bg: "var(--accent-primary-light)" },
    { label: "Total Posts", value: posts.length, icon: BarChart2, color: "#4A7FC1", bg: "#4A7FC118" },
    { label: "Engagement", value: totalViews, icon: Eye, color: "#D98B62", bg: "#D98B6218" },
    { label: "Comments", value: totalComments, icon: MessageCircle, color: "#7C69C4", bg: "#7C69C418" },
    { label: "Videos", value: videoPosts.length, icon: Film, color: "#3C6E5A", bg: "#3C6E5A18" },
  ];

  if (!user) return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
    </div>
  );

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3"
        style={{ backgroundColor: "rgba(242,237,228,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--border-subtle)" }}>
        <Link to={createPageUrl("Profile")} className="p-1.5 rounded-full" style={{ color: "var(--text-secondary)" }}>
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-base font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Creator Dashboard</h1>
          <p className="text-xs" style={{ color: "var(--text-hint)" }}>Your content performance</p>
        </div>
        <TrendingUp className="w-5 h-5 ml-auto" style={{ color: "var(--accent-primary)" }} />
      </div>

      <div className="px-4 py-4 space-y-5">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="p-4 rounded-2xl flex items-center gap-3"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{value.toLocaleString()}</p>
                <p className="text-xs truncate" style={{ color: "var(--text-hint)" }}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Top performing posts */}
        <div>
          <h2 className="text-sm font-bold mb-3 px-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
            🏆 Top Posts
          </h2>
          {topPosts.length === 0 ? (
            <div className="text-center py-8 rounded-2xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
              <p className="text-sm" style={{ color: "var(--text-hint)" }}>No posts yet. Start sharing!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {topPosts.map((post, i) => (
                <Link key={post.id} to={createPageUrl(`PostComments?postId=${post.id}`)}>
                  <div className="flex items-center gap-3 p-3 rounded-2xl"
                    style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
                    <span className="text-sm font-bold w-5 shrink-0 text-center" style={{ color: "var(--accent-primary)" }}>#{i + 1}</span>
                    <p className="text-sm flex-1 line-clamp-2" style={{ color: "var(--text-primary)" }}>
                      {post.title || post.body?.replace(/<[^>]*>/g, "") || "Post"}
                    </p>
                    <div className="flex gap-2 shrink-0 text-xs" style={{ color: "var(--text-hint)" }}>
                      <span>❤️ {post.upvotes || 0}</span>
                      <span>💬 {post.comment_count || 0}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Engagement tip */}
        <div className="p-4 rounded-2xl" style={{ background: "linear-gradient(135deg, var(--accent-primary-light), #EDE8DF)", border: "1px solid var(--border-light)" }}>
          <p className="text-xs font-bold mb-1" style={{ color: "var(--accent-primary)" }}>💡 Tip</p>
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Posts with videos get 3× more engagement. Try adding a short clip to your next post!
          </p>
        </div>
      </div>
    </div>
  );
}