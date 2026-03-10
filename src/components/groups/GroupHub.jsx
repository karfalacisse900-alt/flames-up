import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Users, Lock, Globe, MessageSquare, Calendar, Gamepad2, Film, CalendarPlus, ShieldAlert, Settings, Plus, Flag, MapPin, BadgeCheck, Shield, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import CommunityPostCard from "@/components/community/CommunityPostCard";
import GroupPostCompose from "./GroupPostCompose";
import GroupChatPost from "./GroupChatPost";
import GroupChatCompose from "./GroupChatCompose";
import GroupMembersSheet from "./GroupMembersSheet";
import CreateEventModal from "./CreateEventModal";
import GroupModerationPanel from "./GroupModerationPanel";
import GroupEventCard from "./GroupEventCard";
import GroupGamesTab from "./GroupGamesTab";
import GroupReactionTab from "./GroupReactionTab";
import GroupMembersTab from "./GroupMembersTab";
import VerifiedBadge from "./safety/VerifiedBadge";
import HostVerificationModal from "./safety/HostVerificationModal";
import SafetyToolsMenu from "./safety/SafetyToolsMenu";
import EventSafetySettings from "./safety/EventSafetySettings";

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

const TABS = [
  { key: "chat", label: "Chat", icon: MessageSquare },
  { key: "events", label: "Events", icon: Calendar },
  { key: "members", label: "Members", icon: Users },
  { key: "games", label: "Games", icon: Gamepad2 },
  { key: "media", label: "Watch", icon: Film },
];

export default function GroupHub({ group, user, membership, onBack, onJoin, onLeave, isMember }) {
  const [activeTab, setActiveTab] = useState("chat");
  const [showCompose, setShowCompose] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showModeration, setShowModeration] = useState(false);
  const [reportingPost, setReportingPost] = useState(null);
  const [reportReason, setReportReason] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [showVerification, setShowVerification] = useState(false);
  const [showSafetyTools, setShowSafetyTools] = useState(false);
  const [showEventPrivacy, setShowEventPrivacy] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const qc = useQueryClient();

  const isAdmin = membership?.role === "admin" || membership?.role === "moderator";
  const isCreator = user?.email === group.creator_email;

  const handleDeleteGroup = async () => {
    if (!isCreator || deleting) return;
    setDeleting(true);
    // Delete all members
    const allMembers = await qc.fetchQuery({
      queryKey: ["groupMembers", group.id],
      queryFn: () => base44.entities.GroupMember.filter({ group_id: group.id }),
    });
    await Promise.all(allMembers.map(m => base44.entities.GroupMember.delete(m.id)));
    await base44.entities.Group.update(group.id, { is_active: false });
    setDeleting(false);
    onBack();
  };
  const gradBg = CATEGORY_COLORS[group.category] || CATEGORY_COLORS.general;

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

  const { data: members = [] } = useQuery({
    queryKey: ["groupMembers", group.id],
    queryFn: () => base44.entities.GroupMember.filter({ group_id: group.id }),
    enabled: isMember,
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
      group_id: group.id, post_id: reportingPost.id,
      reporter_email: user.email, reporter_name: user.full_name || user.email,
      reason: reportReason.trim(), status: "pending",
    });
    setReportingPost(null);
    setReportReason("");
  };

  const visiblePosts = isAdmin ? posts : posts.filter(p => !p.moderation_status || p.moderation_status === "approved");
  const upcomingEvents = events.filter(e => new Date(e.event_date) >= new Date());
  const pastEvents = events.filter(e => new Date(e.event_date) < new Date());
  const moderationCount = (pendingReports?.length || 0) + (pendingPosts?.length || 0);

  return (
    <div style={{ backgroundColor: "var(--bg-app)", minHeight: "100dvh" }}>
      {/* Header */}
      <div style={{ background: gradBg }}>
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <button onClick={onBack} className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="text-lg font-bold text-white truncate" style={{ fontFamily: "var(--font-serif)" }}>
                {group.emoji || "💬"} {group.name}
              </h1>
              {group.is_private ? <Lock className="w-3.5 h-3.5 text-white/70 shrink-0" /> : <Globe className="w-3.5 h-3.5 text-white/70 shrink-0" />}
            </div>
            {group.description && <p className="text-xs text-white/70 truncate mt-0.5">{group.description}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isMember && (
              <button onClick={() => setShowSafetyTools(true)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                title="Safety tools">
                <Shield className="w-4 h-4 text-white" />
              </button>
            )}
            <button onClick={() => setShowMembers(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "#fff" }}>
              <Users className="w-3.5 h-3.5" /> {group.member_count || 0}
            </button>
          </div>
        </div>

        {/* Action bar */}
        <div className="px-4 mt-1 pb-3 flex items-center gap-2">
          {!isMember ? (
            <button onClick={onJoin} className="flex-1 py-2 rounded-xl text-sm font-bold"
              style={{ backgroundColor: "rgba(255,255,255,0.9)", color: "#2E6B4F" }}>
              Join Group
            </button>
          ) : (
            <>
              {activeTab === "chat" && (
                <button onClick={() => setShowCompose(true)}
                  className="flex-1 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                  style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.9)" }}>
                  <Plus className="w-4 h-4" /> Post to group…
                </button>
              )}
              {isAdmin && (
                <>
                  {activeTab === "events" && (
                    <button onClick={() => setShowCreateEvent(true)}
                      className="flex-1 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                      style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.9)" }}>
                      <CalendarPlus className="w-4 h-4" /> New Event
                    </button>
                  )}
                  <button onClick={() => setShowModeration(true)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center relative shrink-0"
                    style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                    <ShieldAlert className="w-4 h-4 text-white" />
                    {moderationCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white flex items-center justify-center font-bold"
                        style={{ backgroundColor: "#E05C7A", fontSize: 9 }}>{moderationCount}</span>
                    )}
                  </button>
                  <button onClick={() => setShowMembers(true)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                    <Settings className="w-4 h-4 text-white" />
                  </button>
                  {isCreator && (
                    <button onClick={() => setShowDeleteConfirm(true)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "rgba(220,53,69,0.3)" }}
                      title="Delete group">
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b sticky top-0 z-10" style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-card)" }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const badge = tab.key === "events" && upcomingEvents.length > 0 ? upcomingEvents.length : null;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="flex-1 py-2.5 flex flex-col items-center gap-0.5 text-xs font-semibold transition-all"
              style={{
                color: activeTab === tab.key ? "var(--accent-primary)" : "var(--text-hint)",
                borderBottom: activeTab === tab.key ? "2px solid var(--accent-primary)" : "2px solid transparent",
              }}>
              <div className="relative">
                <Icon className="w-4 h-4" />
                {badge && (
                  <span className="absolute -top-1.5 -right-2 w-3.5 h-3.5 rounded-full text-white flex items-center justify-center font-bold"
                    style={{ backgroundColor: "#E05C7A", fontSize: 7 }}>{badge}</span>
                )}
              </div>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Location banner for real-world groups */}
      {group.group_type === "realworld" && (group.location_name || group.location_city) && activeTab === "chat" && (
        <button
          onClick={() => {
            const q = encodeURIComponent([group.location_name, group.location_city].filter(Boolean).join(", "));
            window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
          }}
          className="mx-4 mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold w-[calc(100%-2rem)]"
          style={{ backgroundColor: "#E8F2EC", color: "var(--accent-primary)", border: "1px solid #2E6B4F30" }}>
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {[group.location_name, group.location_city].filter(Boolean).join(" · ")}
            {group.meeting_schedule && <span className="ml-1 font-normal" style={{ color: "var(--text-secondary)" }}>· {group.meeting_schedule}</span>}
          </span>
        </button>
      )}

      {/* Rules */}
      {group.rules && activeTab === "chat" && (
        <div className="mx-4 mt-2 px-3 py-2.5 rounded-xl text-xs" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
          📋 <strong>Rules:</strong> {group.rules}
        </div>
      )}

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {/* CHAT TAB */}
          {activeTab === "chat" && (
            <div style={{ paddingBottom: 120 }}>
              {/* Pinned posts first */}
              {visiblePosts.filter(p => p.is_pinned).map(post => (
                <GroupChatPost key={`pin-${post.id}`} post={post} user={user} members={members}
                  onReply={setReplyTo} isAdmin={isAdmin} groupId={group.id} />
              ))}
              {visiblePosts.filter(p => p.is_pinned).length > 0 && (
                <div className="mx-4 my-1 border-t" style={{ borderColor: "var(--border-subtle)" }} />
              )}

              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
                </div>
              ) : visiblePosts.filter(p => !p.is_pinned).length === 0 && visiblePosts.filter(p => p.is_pinned).length === 0 ? (
                <div className="py-16 text-center px-8">
                  <div className="text-5xl mb-3">💬</div>
                  <p className="font-bold text-base mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>No messages yet</p>
                  <p className="text-sm" style={{ color: "var(--text-hint)" }}>
                    {isMember ? "Say hello! Use @ to mention members." : "Join this group to chat."}
                  </p>
                </div>
              ) : (
                visiblePosts.filter(p => !p.is_pinned).map(post => (
                  <div key={post.id} className="relative group/post">
                    {isAdmin && post.moderation_status === "pending" && (
                      <div className="mx-4 mt-2 -mb-1 flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold"
                        style={{ backgroundColor: "#fef3c7", color: "#d97706" }}>⏳ Pending</div>
                    )}
                    <GroupChatPost post={post} user={user} members={members}
                      onReply={setReplyTo} isAdmin={isAdmin} groupId={group.id} />
                    {isMember && user && post.author_email !== user.email && (
                      <button onClick={() => setReportingPost(post)}
                        className="absolute top-2 right-4 w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover/post:opacity-100 transition-opacity"
                        style={{ backgroundColor: "var(--bg-subtle)" }}>
                        <Flag className="w-3 h-3" style={{ color: "var(--text-hint)" }} />
                      </button>
                    )}
                  </div>
                ))
              )}

              {/* Sticky compose bar at bottom */}
              {isMember && user && (
                <div className="fixed bottom-16 left-0 right-0 z-30 max-w-lg mx-auto">
                  <GroupChatCompose group={group} user={user} members={members}
                    replyTo={replyTo} onClearReply={() => setReplyTo(null)}
                    onPosted={() => qc.invalidateQueries({ queryKey: ["groupPosts", group.id] })} />
                </div>
              )}
            </div>
          )}

          {/* EVENTS TAB */}
          {activeTab === "events" && (
            <div className="mt-3 pb-28">
              {/* Verification prompt for admin/host */}
              {isAdmin && group.group_type === "realworld" && user && (
                <div className="mx-4 mb-3 px-3 py-3 rounded-2xl flex items-center gap-3"
                  style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE" }}>
                  <BadgeCheck className="w-5 h-5 shrink-0" style={{ color: "#1D4ED8" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold" style={{ color: "#1D4ED8" }}>Get Verified Host badge</p>
                    <p className="text-[11px]" style={{ color: "#3B82F6" }}>Build trust with attendees for your real-world events</p>
                  </div>
                  <button onClick={() => setShowVerification(true)}
                    className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold text-white"
                    style={{ backgroundColor: "#1D4ED8" }}>
                    Verify
                  </button>
                </div>
              )}
              {/* Event privacy setting */}
              {isMember && (
                <button onClick={() => setShowEventPrivacy(true)}
                  className="mx-4 mb-3 flex items-center gap-2 text-xs font-medium"
                  style={{ color: "var(--text-hint)" }}>
                  <Shield className="w-3 h-3" /> Event privacy settings
                </button>
              )}
              {upcomingEvents.length === 0 && pastEvents.length === 0 ? (
                <div className="py-12 text-center px-8">
                  <div className="text-4xl mb-3">📅</div>
                  <p className="font-bold text-sm mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>No events yet</p>
                  <p className="text-xs mb-4" style={{ color: "var(--text-hint)" }}>
                    {isAdmin ? "Create the first event for this group!" : "Check back later for upcoming events."}
                  </p>
                  {isAdmin && (
                    <button onClick={() => setShowCreateEvent(true)}
                      className="px-5 py-2 rounded-xl text-sm font-bold text-white"
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
                      <p className="px-4 mt-4 mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-hint)" }}>Past</p>
                      {pastEvents.map(e => <GroupEventCard key={e.id} event={e} user={user} groupId={group.id} />)}
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* MEMBERS TAB */}
          {activeTab === "members" && (
            <GroupMembersTab group={group} user={user} isAdmin={isAdmin} />
          )}

          {/* GAMES TAB */}
          {activeTab === "games" && (
            <GroupGamesTab group={group} user={user} isMember={isMember} />
          )}

          {/* MEDIA / WATCH TAB */}
          {activeTab === "media" && (
            <GroupReactionTab group={group} user={user} isMember={isMember} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Report modal */}
      <AnimatePresence>
        {reportingPost && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            onClick={() => setReportingPost(null)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full max-w-lg mx-auto rounded-t-3xl p-5"
              style={{ backgroundColor: "#F2EDE4" }}
              onClick={e => e.stopPropagation()}>
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
                  style={{ backgroundColor: "#E05C7A" }}>Submit</button>
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
        {showVerification && user && (
          <HostVerificationModal user={user} onClose={() => setShowVerification(false)}
            onVerified={() => setShowVerification(false)} />
        )}
        {showSafetyTools && user && (
          <SafetyToolsMenu
            groupId={group.id} groupName={group.name}
            targetEmail={group.creator_email} targetName={group.creator_name || "Host"}
            user={user} onClose={() => setShowSafetyTools(false)}
            onLeft={() => { onLeave?.(); onBack?.(); }} />
        )}
        {showEventPrivacy && user && (
          <EventSafetySettings user={user} onClose={() => setShowEventPrivacy(false)} />
        )}
        {showDeleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            onClick={() => setShowDeleteConfirm(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full max-w-lg mx-auto rounded-t-3xl p-5 pb-8"
              style={{ backgroundColor: "var(--bg-card)" }}
              onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ backgroundColor: "var(--border-medium)" }} />
              <div className="text-center mb-5">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: "#FFF0F3" }}>
                  <Trash2 className="w-6 h-6" style={{ color: "#E05C7A" }} />
                </div>
                <h3 className="text-base font-bold mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Delete "{group.name}"?</h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  This will permanently delete the group and remove all members. This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold"
                  style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
                  Cancel
                </button>
                <button onClick={handleDeleteGroup} disabled={deleting}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold text-white disabled:opacity-60"
                  style={{ backgroundColor: "#E05C7A" }}>
                  {deleting ? "Deleting…" : "Delete Group"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}