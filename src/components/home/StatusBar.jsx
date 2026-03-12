import React, { useState, useEffect, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PostStatusModal from "./PostStatusModal";

const COLORS = ["#7C3AED", "#DB2777", "#EA580C", "#059669", "#0284C7", "#D97706"];
const avatarColor = (str) => COLORS[(str || "a").charCodeAt(0) % COLORS.length];

export default function StatusBar({ user }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [showPost, setShowPost] = useState(false);

  const { data: statuses = [] } = useQuery({
    queryKey: ["creatorStatuses"],
    queryFn: async () => {
      const all = await base44.entities.CreatorStatus.list("-created_date", 100);
      const now = new Date();
      return all.filter(s => !s.expires_at || new Date(s.expires_at) > now);
    },
    refetchInterval: 60000,
  });

  const [groupAdminOf, setGroupAdminOf] = useState(null);
  useEffect(() => {
    if (!user?.email) return;
    base44.entities.GroupMember.filter({ user_email: user.email, role: "admin" }, "-created_date", 1)
      .then(res => { if (res.length > 0) setGroupAdminOf(res[0]); })
      .catch(() => {});
  }, [user?.email]);

  const canPost = !!user;

  const authorGroups = useMemo(() => {
    const map = new Map();
    statuses.forEach(s => {
      if (!map.has(s.author_email)) map.set(s.author_email, []);
      map.get(s.author_email).push(s);
    });
    return Array.from(map.values());
  }, [statuses]);

  if (authorGroups.length === 0 && !canPost) return null;

  const openGroup = (group) => {
    navigate(createPageUrl("StatusViewer") + `?authorEmail=${encodeURIComponent(group[0].author_email)}`);
  };

  return (
    <>
      <div className="px-4 py-3">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {canPost && (
            <button onClick={() => setShowPost(true)} className="flex flex-col items-center gap-1.5 shrink-0">
              <div className="w-14 h-14 rounded-full flex items-center justify-center relative"
                style={{ border: "2.5px dashed var(--accent-primary)", backgroundColor: "var(--accent-primary-light)" }}>
                <Plus className="w-6 h-6" style={{ color: "var(--accent-primary)" }} />
              </div>
              <span className="text-[11px] font-semibold" style={{ color: "var(--text-secondary)" }}>Add Status</span>
            </button>
          )}

          {authorGroups.map((group) => {
            const latest = group[0];
            const allViewed = group.every(s => s.viewed_by?.includes(user?.email));
            const initials = (latest.author_name || "U")[0]?.toUpperCase();
            return (
              <button key={latest.author_email} onClick={() => openGroup(group)}
                className="flex flex-col items-center gap-1.5 shrink-0">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full p-0.5"
                    style={{ background: allViewed ? "var(--border-medium)" : (latest.background || "linear-gradient(135deg, #7C3AED, #DB2777)") }}>
                    <div className="w-full h-full rounded-full flex items-center justify-center font-bold text-lg"
                      style={{ backgroundColor: avatarColor(latest.author_email), color: "#fff", border: "2px solid var(--bg-app)" }}>
                      {initials}
                    </div>
                  </div>
                  {group.length > 1 && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ backgroundColor: "var(--accent-primary)", border: "2px solid var(--bg-app)" }}>
                      {group.length}
                    </div>
                  )}
                </div>
                <span className="text-[11px] font-semibold max-w-[56px] truncate text-center"
                  style={{ color: "var(--text-secondary)" }}>
                  {latest.group_name || latest.author_name?.split(" ")[0] || "User"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {showPost && (
          <PostStatusModal
            user={user}
            groupId={groupAdminOf && !isCreator ? groupAdminOf.group_id : undefined}
            groupName={groupAdminOf && !isCreator ? groupAdminOf.group_name : undefined}
            onClose={() => setShowPost(false)}
            onPosted={() => qc.invalidateQueries({ queryKey: ["creatorStatuses"] })}
          />
        )}
      </AnimatePresence>
    </>
  );
}