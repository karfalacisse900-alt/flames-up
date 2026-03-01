import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Users, Plus, Lock, Globe, Crown, Shield, MoreHorizontal, Settings } from "lucide-react";
import CommunityPostCard from "@/components/community/CommunityPostCard";
import GroupPostCompose from "./GroupPostCompose";
import GroupMembersSheet from "./GroupMembersSheet";

const CATEGORY_COLORS = {
  general: "linear-gradient(135deg, #64748b, #475569)",
  movies: "linear-gradient(135deg, #7c3aed, #4338ca)",
  music: "linear-gradient(135deg, #db2777, #be185d)",
  books: "linear-gradient(135deg, #d97706, #b45309)",
  gaming: "linear-gradient(135deg, #16a34a, #15803d)",
  tech: "linear-gradient(135deg, #0284c7, #0369a1)",
  sports: "linear-gradient(135deg, #ea580c, #dc2626)",
  art: "linear-gradient(135deg, #7c3aed, #a21caf)",
  health: "linear-gradient(135deg, #0d9488, #16a34a)",
  travel: "linear-gradient(135deg, #0284c7, #6d28d9)",
  food: "linear-gradient(135deg, #ea580c, #d97706)",
  relationships: "linear-gradient(135deg, #e11d48, #db2777)",
  motivation: "linear-gradient(135deg, #d97706, #ea580c)",
};

export default function GroupFeed({ group, user, membership, onBack, onJoin, onLeave, isMember }) {
  const [showCompose, setShowCompose] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const qc = useQueryClient();

  const isAdmin = membership?.role === "admin" || membership?.role === "moderator";

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["groupPosts", group.id],
    queryFn: () => base44.entities.CommunityPost.filter({ group_id: group.id }, "-created_date", 50),
  });

  const upvoteMut = useMutation({
    mutationFn: ({ post }) => {
      const hasUpvoted = post.upvoted_by?.includes(user?.email);
      if (hasUpvoted) {
        return base44.entities.CommunityPost.update(post.id, {
          upvotes: Math.max(0, (post.upvotes || 0) - 1),
          upvoted_by: (post.upvoted_by || []).filter(e => e !== user.email),
        });
      }
      return base44.entities.CommunityPost.update(post.id, {
        upvotes: (post.upvotes || 0) + 1,
        upvoted_by: [...(post.upvoted_by || []), user.email],
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["groupPosts", group.id] }),
  });

  const gradBg = CATEGORY_COLORS[group.category] || CATEGORY_COLORS.general;

  return (
    <div style={{ backgroundColor: "var(--bg-app)", minHeight: "100dvh" }}>
      {/* Group Header */}
      <div style={{ background: gradBg, paddingBottom: 20 }}>
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <button onClick={onBack} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-bold text-white truncate" style={{ fontFamily: "var(--font-serif)" }}>
                {group.emoji || "💬"} {group.name}
              </h1>
              {group.is_private ? <Lock className="w-3.5 h-3.5 text-white/70 shrink-0" /> : <Globe className="w-3.5 h-3.5 text-white/70 shrink-0" />}
            </div>
            {group.description && <p className="text-xs text-white/70 truncate mt-0.5">{group.description}</p>}
          </div>
          <button onClick={() => setShowMembers(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "#fff" }}>
            <Users className="w-3.5 h-3.5" /> {group.member_count || 0}
          </button>
        </div>

        {/* Join/Leave + compose bar */}
        <div className="px-4 mt-2 flex items-center gap-2">
          {!isMember ? (
            <button onClick={onJoin}
              className="flex-1 py-2 rounded-xl text-sm font-bold"
              style={{ backgroundColor: "rgba(255,255,255,0.9)", color: "#2E6B4F" }}>
              Join Group
            </button>
          ) : (
            <>
              <button onClick={() => setShowCompose(true)}
                className="flex-1 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.9)" }}>
                <Plus className="w-4 h-4" /> Post to group…
              </button>
              {isAdmin && (
                <button onClick={() => setShowMembers(true)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                  <Settings className="w-4 h-4 text-white" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Rules chip */}
      {group.rules && (
        <div className="mx-4 mt-3 px-3 py-2.5 rounded-xl text-xs" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)", border: "1px solid var(--accent-primary)20" }}>
          📋 <strong>Rules:</strong> {group.rules}
        </div>
      )}

      {/* Posts */}
      <div className="pb-28">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
          </div>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center px-8">
            <div className="text-5xl mb-3">📭</div>
            <p className="font-bold text-base mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>No posts yet</p>
            <p className="text-sm" style={{ color: "var(--text-hint)" }}>
              {isMember ? "Be the first to post in this group!" : "Join this group to see and post content."}
            </p>
          </div>
        ) : posts.map((post, i) => (
          <motion.div key={post.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <CommunityPostCard post={post} user={user}
              onUpvote={() => user && upvoteMut.mutate({ post })} />
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showCompose && (
          <GroupPostCompose group={group} user={user} onClose={() => setShowCompose(false)}
            onCreated={() => { qc.invalidateQueries({ queryKey: ["groupPosts", group.id] }); setShowCompose(false); }} />
        )}
        {showMembers && (
          <GroupMembersSheet group={group} user={user} membership={membership}
            onClose={() => setShowMembers(false)} onLeave={() => { onLeave(); onBack(); }} />
        )}
      </AnimatePresence>
    </div>
  );
}