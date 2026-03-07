import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import DesktopPostCard from "./DesktopPostCard";

export default function DesktopFeed({ user }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    base44.entities.CommunityPost.filter(
      { moderation_status: "approved" },
      "-created_date",
      40
    )
      .then(all => setPosts(all))
      .catch(() => {
        // fallback: try without filter
        base44.entities.CommunityPost.list("-created_date", 40)
          .then(all => setPosts(all.filter(p => p.moderation_status !== "rejected")))
          .catch(() => {});
      })
      .finally(() => setLoading(false));
  }, []);

  // Infinite scroll sentinel
  const sentinelRef = useCallback(node => {
    if (!node) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) setVisibleCount(v => v + 8);
    }, { threshold: 0.1 });
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 py-4">
        {[1,2,3].map(i => (
          <div key={i} className="rounded-2xl overflow-hidden animate-pulse"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
            <div className="flex items-center gap-3 p-4">
              <div className="w-9 h-9 rounded-full" style={{ backgroundColor: "var(--bg-subtle)" }} />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-28 rounded-full" style={{ backgroundColor: "var(--bg-subtle)" }} />
                <div className="h-2.5 w-16 rounded-full" style={{ backgroundColor: "var(--bg-subtle)" }} />
              </div>
            </div>
            <div className="mx-4 mb-4 rounded-xl" style={{ aspectRatio: "1/1", backgroundColor: "var(--bg-subtle)" }} />
          </div>
        ))}
      </div>
    );
  }

  const visible = posts.slice(0, visibleCount);

  return (
    <div className="py-4 space-y-4">
      {visible.map((post, i) => (
        <DesktopPostCard key={post.id} post={post} user={user} index={i} />
      ))}
      {visibleCount < posts.length && (
        <div ref={sentinelRef} className="h-10 flex items-center justify-center">
          <div className="w-5 h-5 rounded-full border-2 animate-spin"
            style={{ borderColor: "var(--border-medium)", borderTopColor: "var(--accent-primary)" }} />
        </div>
      )}
      {posts.length === 0 && (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">🌿</p>
          <p className="text-sm" style={{ color: "var(--text-hint)" }}>No posts yet</p>
        </div>
      )}
    </div>
  );
}