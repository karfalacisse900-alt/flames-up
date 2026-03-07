import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { TrendingUp, MessageSquare, Sparkles, ExternalLink, Star } from "lucide-react";

export default function RightSidebar() {
  const [trendingApps, setTrendingApps] = useState([]);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.DiscoverItem.filter({ is_approved: true }, "-avg_rating", 5).catch(() => []),
      base44.entities.CommunityPost.list("-engagement_score", 4).catch(() => []),
    ]).then(([apps, posts]) => {
      setTrendingApps(apps);
      setCommunityPosts(posts.filter(p => p.moderation_status !== "rejected"));
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
      {/* Trending Apps */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
          <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-hint)" }}>
            Trending Apps
          </h3>
        </div>
        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => (
              <div key={i} className="h-12 rounded-xl animate-pulse" style={{ backgroundColor: "var(--bg-subtle)" }} />
            ))}
          </div>
        ) : trendingApps.length === 0 ? (
          <p className="text-xs" style={{ color: "var(--text-hint)" }}>No apps yet</p>
        ) : (
          <div className="space-y-1.5">
            {trendingApps.map(app => (
              <Link
                key={app.id}
                to={createPageUrl("Discover")}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-150 group"
                style={{ backgroundColor: "transparent" }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-subtle)"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
              >
                {app.logo_url ? (
                  <img src={app.logo_url} alt={app.title} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-sm"
                    style={{ backgroundColor: "var(--accent-primary-light)" }}>
                    {app.title?.[0]}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{app.title}</p>
                  {(app.avg_rating || 0) > 0 && (
                    <div className="flex items-center gap-0.5 mt-0.5">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      <span className="text-[10px]" style={{ color: "var(--text-hint)" }}>{app.avg_rating?.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0" style={{ color: "var(--text-hint)" }} />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Divider */}
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
            {[1,2].map(i => (
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
                className="block px-3 py-2.5 rounded-xl transition-all duration-150 group"
                style={{ backgroundColor: "transparent" }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-subtle)"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <p className="text-xs font-medium line-clamp-2 leading-relaxed" style={{ color: "var(--text-primary)" }}>
                  {post.title || post.body?.slice(0, 80)}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px]" style={{ color: "var(--text-hint)" }}>
                    {post.author_name || "Anonymous"}
                  </span>
                  {(post.upvotes || 0) > 0 && (
                    <span className="text-[10px] flex items-center gap-0.5" style={{ color: "var(--text-hint)" }}>
                      ↑ {post.upvotes}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Divider */}
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