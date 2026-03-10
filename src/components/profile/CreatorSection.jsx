import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Plus, Video } from "lucide-react";
import CreatorPostComposer from "@/components/creator/CreatorPostComposer";

const PLATFORM_LABELS = {
  fiverr: "Hire on Fiverr",
  spotify: "Listen on Spotify",
  shopify: "Visit Store",
  instagram: "Follow on Instagram",
  twitter: "Follow on Twitter",
  youtube: "Subscribe on YouTube",
  tiktok: "Follow on TikTok",
  website: "Visit Website",
};

export default function CreatorSection({ user }) {
  const [showComposer, setShowComposer] = useState(false);

  const { data: posts = [] } = useQuery({
    queryKey: ["creatorPosts", user?.email],
    queryFn: () =>
      base44.entities.CommunityPost.filter(
        { author_email: user?.email, is_creator_post: true },
        "-created_date",
        20
      ),
    enabled: !!user?.email,
  });

  if (!user?.is_creator) return null;

  return (
    <div className="space-y-6">
      {/* Creator Header */}
      <div className="rounded-2xl p-4 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)" }}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs font-bold mb-1" style={{ color: "var(--text-secondary)" }}>
              CREATOR CATEGORY
            </p>
            <p className="font-bold" style={{ color: "var(--text-primary)" }}>
              {user.creator_category?.replace(/_/g, " ").toUpperCase()}
            </p>
          </div>
          <span style={{ fontSize: "24px" }}>⭐</span>
        </div>

        {user.creator_portfolio_link && (
          <a
            href={user.creator_portfolio_link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold flex items-center gap-1 mb-3"
            style={{ color: "var(--accent-primary)" }}
          >
            View Portfolio <ExternalLink className="w-3 h-3" />
          </a>
        )}

        {user.creator_links && Object.keys(user.creator_links).length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
              EXTERNAL PLATFORMS
            </p>
            {Object.entries(user.creator_links).map(([platform, link]) => (
              <a
                key={platform}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs px-3 py-2 rounded-lg text-white font-bold"
                style={{ backgroundColor: "var(--accent-primary)" }}
              >
                {PLATFORM_LABELS[platform] || platform}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Creator Content */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>
            Creator Posts
          </h3>
          <button
            onClick={() => setShowComposer(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: "var(--accent-primary)" }}
          >
            <Plus className="w-3 h-3" /> Post
          </button>
        </div>

        {posts.length === 0 ? (
          <p style={{ fontSize: "13px", color: "var(--text-hint)" }}>No creator posts yet</p>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div key={post.id} className="rounded-xl p-3 border" style={{ backgroundColor: "var(--bg-subtle)", borderColor: "var(--border-light)" }}>
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-xs font-bold px-2 py-1 rounded-full text-white" style={{ backgroundColor: "var(--accent-primary)" }}>
                    Creator Post
                  </span>
                </div>
                {post.title && <p className="font-bold text-sm mb-1" style={{ color: "var(--text-primary)" }}>{post.title}</p>}
                <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{post.body}</p>
                {post.video_url && (
                  <div className="mt-2 flex items-center gap-1 text-xs" style={{ color: "var(--accent-primary)" }}>
                    <Video className="w-3 h-3" /> Video attached
                  </div>
                )}
                {post.creator_action_links && Object.keys(post.creator_action_links).length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {Object.entries(post.creator_action_links).map(([platform, link]) => (
                      <a
                        key={platform}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-2.5 py-1 rounded-full text-white font-bold"
                        style={{ backgroundColor: "var(--accent-secondary)" }}
                      >
                        {PLATFORM_LABELS[platform] || platform}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showComposer && (
        <CreatorPostComposer
          user={user}
          creatorCategory={user.creator_category}
          onClose={() => setShowComposer(false)}
          onSuccess={() => setShowComposer(false)}
        />
      )}
    </div>
  );
}