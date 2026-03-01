import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Users, Plus, Lock, Globe, Settings, CalendarPlus, Flag, ShieldAlert } from "lucide-react";
import CommunityPostCard from "@/components/community/CommunityPostCard";
import GroupPostCompose from "./GroupPostCompose";
import GroupMembersSheet from "./GroupMembersSheet";
import GroupEventCard from "./GroupEventCard";
import CreateEventModal from "./CreateEventModal";
import GroupModerationPanel from "./GroupModerationPanel";

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
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showModeration, setShowModeration] = useState(false);
  const [activeTab, setActiveTab] = useState("posts"); // "posts" | "events"
  const [reportingPost, setReportingPost] = useState(null);
  const [reportReason, setReportReason] = useState("");
  const qc = useQueryClient();

  const isAdmin = membership?.role === "admin" || membership?.role === "moderator";

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["groupPosts", group.id],
    queryFn: () => base44.entities.CommunityPost.filter({ group_id: group.id }, "-created_date", 50),
  });

  const { data: events = [] } = useQuery({
    queryKey: ["groupEvents", group.id],
    queryFn: () => base44.entities.GroupEvent.filter({ group_id: group.id, is_active: true }, "event_date", 50),
  });

  const { data: pendingReports = [] } = useQuery({
    queryKey: ["groupReportCount", group.id],
    queryFn: () => base44.entities.GroupPostReport.filter({ group_id: group.id, status: "pending" }),
    enabled: isAdmin,
  });

  const { data: pendingPosts = [] } = useQuery({
    queryKey: ["pendingGroupPostsCount", group.id],
    queryFn: () => base44.entities.CommunityPost.filter({ group_id: group.id, moderation_status: "pending" }),
    enabled: isAdmin,
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

  const submitReport = async () => {
    if (!reportingPost || !reportReason.trim()) return;
    await base44.entities.GroupPostReport.create({
      group_id: group.id,
      post_id: reportingPost.id,
      reporter_email: user.email,
      reporter_name: user.full_name || user.email,
      reason: reportReason.trim(),
      status: "pending",
    });
    setReportingPost(null);
    setReportReason("");
  };

  const visiblePosts = isAdmin
    ? posts
    : posts.filter(p => !p.moderation_status || p.moderation_status === "approved");

  const upcomingEvents = events.filter(e => new Date(e.event_date) >= new Date());
  const pastEvents = events.filter(e => new Date(e.event_date) < new Date());
  const moderationCount = (pendingReports?.length || 0) + (pendingPosts?.length || 0);
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

        {/* Action bar */}
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
                <>
                  <button onClick={() => setShowCreateEvent(true)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center relative"
                    style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                    title="Create Event">
                    <CalendarPlus className="w-4 h-4 text-white" />
                  </button>
                  <button onClick={() => setShowModeration(true)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center relative"
                    style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                    title="Moderation">
                    <ShieldAlert className="w-4 h-4 text-white" />
                    {moderationCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white flex items-center justify-center font-bold"
                        style={{ backgroundColor: "#E05C7A", fontSize: 9 }}>{moderationCount}</span>
                    )}
                  </button>
                  <button onClick={() => setShowMembers(true)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                    <Settings className="w-4 h-4 text-white" />
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-card)" }}>
        {[
          { key: "posts", label: "Posts" },
          { key: "events", label: `Events${upcomingEvents.length > 0 ? ` (${upcomingEvents.length})` : ""}` },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className="flex-1 py-3 text-sm font-semibold transition-all"
            style={{
              color: activeTab === tab.key ? "var(--accent-primary)" : "var(--text-hint)",
              borderBottom: activeTab === tab.key ? "2px solid var(--accent-primary)" : "2px solid transparent",
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Rules chip */}
      {group.rules && (
        <div className="mx-4 mt-3 px-3 py-2.5 rounded-xl text-xs" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)", border: "1px solid var(--accent-primary)20" }}>
          📋 <strong>Rules:</strong> {group.rules}
        </div>
      )}

      {/* Content */}
      <div className="pb-28">
        {activeTab === "events" && (
          <div className="mt-3">
            {upcomingEvents.length === 0 && pastEvents.length === 0 ? (
              <div className="py-12 text-center px-8">
                <div className="text-4xl mb-3">📅</div>
                <p className="font-bold text-sm mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>No events yet</p>
                <p className="text-xs" style={{ color: "var(--text-hint)" }}>
                  {isAdmin ? "Create the first event for this group!" : "Check back later for upcoming events."}
                </p>
                {isAdmin && (
                  <button onClick={() => setShowCreateEvent(true)}
                    className="mt-4 px-5 py-2 rounded-xl text-sm font-bold text-white"
                    style={{ backgroundColor: "var(--accent-primary)" }}>
                    + Create Event
                  </button>
                )}
              </div>
            ) : (
              <>
                {upcomingEvents.length > 0 && (
                  <>
                    <p className="px-4 mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-hint)" }}>Upcoming</p>
                    {upcomingEvents.map(e => <GroupEventCard key={e.id} event={e} user={user} groupId={group.id} />)}
                  </>
                )}
                {pastEvents.length > 0 && (
                  <>
                    <p className="px-4 mt-4 mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-hint)" }}>Past Events</p>
                    {pastEvents.map(e => <GroupEventCard key={e.id} event={e} user={user} groupId={group.id} />)}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "posts" && (
          isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
            </div>
          ) : visiblePosts.length === 0 ? (
            <div className="py-16 text-center px-8">
              <div className="text-5xl mb-3">📭</div>
              <p className="font-bold text-base mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>No posts yet</p>
              <p className="text-sm" style={{ color: "var(--text-hint)" }}>
                {isMember ? "Be the first to post in this group!" : "Join this group to see and post content."}
              </p>
            </div>
          ) : (
            visiblePosts.map((post, i) => (
              <motion.div key={post.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                {/* Pending badge for admins */}
                {isAdmin && post.moderation_status === "pending" && (
                  <div className="mx-4 mt-3 -mb-1 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                    style={{ backgroundColor: "#fef3c7", color: "#d97706", border: "1px solid #fcd34d" }}>
                    ⏳ Pending approval
                  </div>
                )}
                <div className="relative group/post">
                  <CommunityPostCard post={post} user={user}
                    onUpvote={() => user && upvoteMut.mutate({ post })} />
                  {/* Report button for members */}
                  {isMember && user && post.author_email !== user.email && (
                    <button
                      onClick={() => setReportingPost(post)}
                      className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover/post:opacity-100 transition-opacity"
                      style={{ backgroundColor: "var(--bg-subtle)" }}
                      title="Report post">
                      <Flag className="w-3.5 h-3.5" style={{ color: "var(--text-hint)" }} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          )
        )}
      </div>

      {/* Report modal */}
      <AnimatePresence>
        {reportingPost && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end"
            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            onClick={() => setReportingPost(null)}
          >
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full max-w-lg mx-auto rounded-t-3xl p-5"
              style={{ backgroundColor: "#F2EDE4" }}
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-base font-bold mb-3" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Report Post</h3>
              <textarea value={reportReason} onChange={e => setReportReason(e.target.value)}
                placeholder="Why are you reporting this post?" rows={3}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none mb-3"
                style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
              <div className="flex gap-2">
                <button onClick={() => setReportingPost(null)}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold"
                  style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>Cancel</button>
                <button onClick={submitReport} disabled={!reportReason.trim()}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold text-white disabled:opacity-50"
                  style={{ backgroundColor: "#E05C7A" }}>Submit Report</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCompose && (
          <GroupPostCompose group={group} user={user} onClose={() => setShowCompose(false)}
            onCreated={() => { qc.invalidateQueries({ queryKey: ["groupPosts", group.id] }); setShowCompose(false); }} />
        )}
        {showMembers && (
          <GroupMembersSheet group={group} user={user} membership={membership}
            onClose={() => setShowMembers(false)} onLeave={() => { onLeave(); onBack(); }} />
        )}
        {showCreateEvent && (
          <CreateEventModal group={group} user={user} onClose={() => setShowCreateEvent(false)}
            onCreated={() => { qc.invalidateQueries({ queryKey: ["groupEvents", group.id] }); setActiveTab("events"); }} />
        )}
        {showModeration && (
          <GroupModerationPanel group={group} user={user} onClose={() => setShowModeration(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}