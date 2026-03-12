import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, TrendingUp, Zap, Clock, X } from "lucide-react";

const ActivityItem = ({ activity, index }) => {
  const icons = {
    post: "💬",
    comment: "💭",
    like: "❤️",
    transaction: "⬡",
    follow: "👤",
  };

  const colors = {
    post: "from-blue-50 to-blue-100/50",
    comment: "from-purple-50 to-purple-100/50",
    like: "from-rose-50 to-rose-100/50",
    transaction: "from-emerald-50 to-emerald-100/50",
    follow: "from-amber-50 to-amber-100/50",
  };

  const borderColors = {
    post: "border-blue-200",
    comment: "border-purple-200",
    like: "border-rose-200",
    transaction: "border-emerald-200",
    follow: "border-amber-200",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20, y: -10 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className={`rounded-2xl p-3.5 mb-2 bg-gradient-to-br ${colors[activity.type]} border ${borderColors[activity.type]} shadow-sm hover:shadow-md transition-all`}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0">{icons[activity.type]}</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-gray-900 truncate">
            {activity.user_name || activity.user_email}
          </p>
          <p className="text-xs text-gray-700 mt-0.5 line-clamp-2">
            {activity.text}
          </p>
          <p className="text-[10px] text-gray-500 mt-1.5">
            <Clock className="w-3 h-3 inline mr-1" />
            {new Date(activity.created_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default function LiveActivityFeed({ maxItems = 8, autoRefreshMs = 4000 }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activities, setActivities] = useState([]);
  const qc = useQueryClient();
  const pollIntervalRef = useRef(null);

  // Fetch latest activities with polling
  const { data: posts = [] } = useQuery({
    queryKey: ["recentPosts"],
    queryFn: async () => {
      const recent = await base44.entities.CommunityPost.list("-created_date", 20);
      return recent;
    },
    refetchInterval: autoRefreshMs,
    staleTime: 1000,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["recentComments"],
    queryFn: async () => {
      const recent = await base44.entities.CommunityComment.list("-created_date", 20);
      return recent;
    },
    refetchInterval: autoRefreshMs,
    staleTime: 1000,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["recentTransactions"],
    queryFn: async () => {
      const recent = await base44.entities.CoinTransaction.filter({}, "-created_date", 20);
      return recent;
    },
    refetchInterval: autoRefreshMs,
    staleTime: 1000,
  });

  const { data: follows = [] } = useQuery({
    queryKey: ["recentFollows"],
    queryFn: async () => {
      const recent = await base44.entities.Follow.list("-created_date", 20);
      return recent;
    },
    refetchInterval: autoRefreshMs,
    staleTime: 1000,
  });

  // Merge and sort activities by recency
  useEffect(() => {
    const merged = [
      ...posts.map(p => ({
        id: `post-${p.id}`,
        type: "post",
        user_email: p.author_email,
        user_name: p.author_name,
        text: p.title || p.body?.substring(0, 50) || "New post",
        created_date: p.created_date,
      })),
      ...comments.map(c => ({
        id: `comment-${c.id}`,
        type: "comment",
        user_email: c.author_email,
        user_name: c.author_name,
        text: c.body?.substring(0, 50) || "New comment",
        created_date: c.created_date,
      })),
      ...transactions.map(t => ({
        id: `txn-${t.id}`,
        type: "transaction",
        user_email: t.user_email,
        user_name: t.user_email?.split("@")[0],
        text: `${t.amount > 0 ? "+" : ""}${t.amount} coins · ${t.type}`,
        created_date: t.created_date,
      })),
      ...follows.map(f => ({
        id: `follow-${f.id}`,
        type: "follow",
        user_email: f.follower_email,
        user_name: f.follower_name,
        text: `Started following ${f.following_name}`,
        created_date: f.created_date,
      })),
    ]
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
      .slice(0, maxItems);

    setActivities(merged);
  }, [posts, comments, transactions, follows, maxItems]);

  return (
    <>
      {/* Floating trigger button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-4 z-40 p-3 rounded-full shadow-lg transition-all"
        style={{
          background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)",
          color: "#fff",
          boxShadow: "0 8px 24px rgba(46,107,79,0.3)",
        }}
      >
        <Zap className="w-5 h-5" />
        {activities.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
            {activities.length}
          </span>
        )}
      </motion.button>

      {/* Activity feed panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-24 right-4 w-80 max-h-96 rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-light)",
            }}
          >
            {/* Header */}
            <div
              className="px-5 py-4 flex items-center justify-between sticky top-0 z-10"
              style={{
                background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)",
                borderBottom: "1px solid rgba(46,107,79,0.2)",
              }}
            >
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5" style={{ color: "#fff" }} />
                <h3 className="font-bold text-white">Live Activity</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full transition-all hover:bg-white/20"
              >
                <X className="w-4 h-4" style={{ color: "#fff" }} />
              </button>
            </div>

            {/* Activities list */}
            <div className="flex-1 overflow-y-auto px-3 py-3">
              {activities.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm" style={{ color: "var(--text-hint)" }}>
                    No recent activity
                  </p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {activities.map((activity, idx) => (
                    <ActivityItem key={activity.id} activity={activity} index={idx} />
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer note */}
            <div
              className="px-4 py-2 text-center border-t"
              style={{
                backgroundColor: "var(--bg-subtle)",
                borderColor: "var(--border-light)",
              }}
            >
              <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>
                Updates every {autoRefreshMs / 1000}s
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ambient notification badge when closed */}
      {!isOpen && activities.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="fixed bottom-32 right-4 z-30 px-4 py-2 rounded-full text-xs font-bold text-white shadow-lg"
          style={{
            background: "linear-gradient(135deg, #E05C7A, #E85D90)",
            boxShadow: "0 4px 16px rgba(224,92,122,0.4)",
          }}
        >
          {activities.length} new update{activities.length !== 1 ? "s" : ""}
        </motion.div>
      )}
    </>
  );
}