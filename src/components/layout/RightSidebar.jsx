import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MessageSquare, Sparkles, TrendingUp } from "lucide-react";

export default function RightSidebar() {
  const [communityPosts, setCommunityPosts] = useState([]);
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.CommunityPost.list("-engagement_score", 5).catch(() => []),
      base44.entities.CommunityPost.list("-upvotes", 6).catch(() => []),
    ]).then(([highlights, popular]) => {
      setCommunityPosts(highlights.filter(p => p.moderation_status !== "rejected"));
      // Derive trending topics from tags of popular posts
      const tagCounts = {};
      popular.forEach(p => (p.tags || []).forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
      const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
      setTrendingTopics(sorted.map(([tag]) => tag));
      setLoading(false);
    });
  }, []);

  return (
    <aside
      className="hidden xl:flex flex-col fixed right-0 top-0 h-full z-40 w-64 py-6 px-4 gap-5 overflow-y-auto scrollbar-hide"
      style={{
        backgroundColor: "var(--bg-nav)",
        borderLeft: "1px solid var(--border-light)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Trending Topics */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
          <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-hint)" }}>
            Trending Topics
          </h3>
        </div>
        {loading ? (
          <div className="space-y-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-7 rounded-xl animate-pulse" style={{ backgroundColor: "var(--bg-subtle)" }} />
            ))}
          </div>
        ) : trendingTopics.length === 0 ? (
          <p className="text-xs" style={{ color: "var(--text-hint)" }}>No trending topics</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {trendingTopics.map(topic => (
              <span
                key={topic}
                className="text-xs px-3 py-1 rounded-full font-medium cursor-pointer transition-all duration-150 hover:scale-105"
                style={{
                  backgroundColor: "var(--accent-primary-light)",
                  color: "var(--accent-primary)",
                }}
              >
                #{topic}
              </span>
            ))}
          </div>
        )}
      </section>

      <div style={{ height: "1px", backgroundColor: "var(--border-light)" }} />

      {/* Community Highlights */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4" style={{ color: "var(--accent-secondary)" }} />
          <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-hint)" }}>
            Community Highlights
          </h3>
        </div>
        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => (
              <div key={i} className="h-16 rounded-xl animate-pulse" style={{ backgroundColor: "var(--bg-subtle)" }} />
            ))}
          </div>
        ) : communityPosts.length === 0 ? (
          <p className="text-xs" style={{ color: "var(--text-hint)" }}>No posts yet</p>
        ) : (
          <div className="space-y-1.5">
            {communityPosts.map(post => (
              <Link
                key={post.id}
                to={createPageUrl("Home")}
                className="block px-3 py-2.5 rounded-xl transition-all duration-150"
                style={{ backgroundColor: "transparent" }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-subtle)"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <p className="text-xs font-medium line-clamp-2 leading-relaxed" style={{ color: "var(--text-primary)" }}>
                  {post.title || post.body?.replace(/<[^>]*>/g, "").slice(0, 80)}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px]" style={{ color: "var(--text-hint)" }}>
                    {post.author_name || "Anonymous"}
                  </span>
                  {(post.upvotes || 0) > 0 && (
                    <span className="text-[10px]" style={{ color: "var(--text-hint)" }}>
                      ↑ {post.upvotes}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div style={{ height: "1px", backgroundColor: "var(--border-light)" }} />

      {/* Quick Links */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
          <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-hint)" }}>
            Quick Links
          </h3>
        </div>
        <div className="space-y-1">
          {[
            { label: "🏆 Hall of Fame", page: "HallOfFame" },
            { label: "🎮 Games", page: "Games" },
            { label: "🛍 Shop", page: "Shop" },
            { label: "📅 Daily Challenge", page: "DailyChallenge" },
          ].map(({ label, page }) => (
            <Link
              key={page}
              to={createPageUrl(page)}
              className="block px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150"
              style={{ color: "var(--text-secondary)" }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = "var(--bg-subtle)";
                e.currentTarget.style.color = "var(--accent-primary)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              {label}
            </Link>
          ))}
        </div>
      </section>
    </aside>
  );
}