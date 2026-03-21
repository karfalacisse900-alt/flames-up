import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Clock, Zap, MapPin } from "lucide-react";
import { usePullToRefresh } from "@/components/hooks/usePullToRefresh";
import { Button } from "@/components/ui/button";
import CreateLivePost from "../components/live/CreateLivePost";
import LivePostCard from "../components/live/LivePostCard";
import { AnimatePresence, motion } from "framer-motion";

export default function Live() {
  const [user, setUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: livePosts = [], isLoading } = useQuery({
    queryKey: ["livePosts"],
    queryFn: async () => {
      const all = await base44.entities.LivePost.list("-created_date", 100);
      // Filter out expired posts
      const now = new Date();
      const active = all.filter(p => new Date(p.expires_at) > now);
      // Delete expired posts in background
      const expired = all.filter(p => new Date(p.expires_at) <= now);
      expired.forEach(p => base44.entities.LivePost.delete(p.id).catch(() => {}));
      return active;
    },
    refetchInterval: 30000, // Refetch every 30s
  });

  // Real-time subscription
  useEffect(() => {
    const unsubscribe = base44.entities.LivePost.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["livePosts"] });
    });
    return unsubscribe;
  }, [queryClient]);

  const { containerProps, PullIndicator } = usePullToRefresh(async () => {
    await queryClient.invalidateQueries({ queryKey: ["livePosts"] });
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div {...containerProps} className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-app)" }}>
      <PullIndicator />
      {/* Header */}
      <div className="px-5 pt-6 pb-4 border-b" style={{ borderColor: "var(--border-light)" }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: "var(--font-serif)" }}>
              <Zap className="w-6 h-6" style={{ color: "var(--accent-primary)" }} />
              Live Activities
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              Happening now • Expires in 24 hours
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)} size="sm" style={{ backgroundColor: "var(--accent-primary)" }}>
            <Plus className="w-4 h-4 mr-1" />
            Create
          </Button>
        </div>

        <div className="rounded-xl p-4" style={{ background: "linear-gradient(135deg, var(--accent-primary-light), var(--bg-subtle))", border: "1px solid var(--accent-primary)" }}>
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--accent-primary)" }}>
            ⚡ Quick Meetups & Real-Time Activities
          </p>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Find study partners, join sports games, grab coffee, or hang out. All posts auto-delete after 24 hours.
          </p>
        </div>
      </div>

      {/* Posts */}
      <div className="px-5 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
          </div>
        ) : livePosts.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: "var(--text-hint)" }} />
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>No live activities yet</p>
            <p className="text-xs mb-4" style={{ color: "var(--text-hint)" }}>Be the first to post a live activity</p>
            <Button onClick={() => setShowCreate(true)} style={{ backgroundColor: "var(--accent-primary)" }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Live Post
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {livePosts.map(post => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}>
                  <LivePostCard
                    post={post}
                    user={user}
                    onUpdate={() => queryClient.invalidateQueries({ queryKey: ["livePosts"] })}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateLivePost
            user={user}
            onClose={() => setShowCreate(false)}
            onCreated={() => queryClient.invalidateQueries({ queryKey: ["livePosts"] })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}