import React, { useState, useEffect, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PostStatusModal from "./PostStatusModal";

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
      <div className="px-4 pt-3 pb-2">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {/* Add Story button */}
          {canPost && (
            <button onClick={() => setShowPost(true)} className="flex flex-col items-center gap-1.5 shrink-0">
              <div className="relative">
                <div
                  className="w-[62px] h-[62px] rounded-full overflow-hidden"
                  style={{ border: "2.5px solid var(--border-light)" }}
                >
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-lg font-bold text-white"
                      style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                    >
                      {(user?.full_name?.[0] || "U").toUpperCase()}
                    </div>
                  )}
                </div>
                {/* Plus badge */}
                <div
                  className="absolute bottom-0 right-0 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "var(--accent-primary)", border: "2px solid var(--bg-app)" }}
                >
                  <Plus className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
              </div>
              <span className="text-[11px] font-semibold max-w-[64px] truncate text-center" style={{ color: "var(--text-secondary)" }}>
                Your Story
              </span>
            </button>
          )}

          {/* Other users' stories */}
          {authorGroups.map((group) => {
            const latest = group[0];
            const allViewed = group.every(s => s.viewed_by?.includes(user?.email));
            const initials = (latest.author_name || "U")[0]?.toUpperCase();
            const ringGradient = allViewed
              ? "var(--border-medium)"
              : "linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)";

            return (
              <button
                key={latest.author_email}
                onClick={() => openGroup(group)}
                className="flex flex-col items-center gap-1.5 shrink-0"
              >
                <div className="relative">
                  {/* Gradient ring */}
                  <div
                    className="w-[62px] h-[62px] rounded-full p-[2.5px] flex items-center justify-center"
                    style={{ background: ringGradient }}
                  >
                    <div
                      className="w-full h-full rounded-full overflow-hidden flex items-center justify-center font-bold text-lg text-white"
                      style={{
                        border: "2px solid var(--bg-app)",
                        backgroundColor: "#6366f1",
                        backgroundImage: latest.avatar_url ? `url(${latest.avatar_url})` : undefined,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    >
                      {!latest.avatar_url && initials}
                    </div>
                  </div>

                  {/* Story count badge */}
                  {group.length > 1 && (
                    <div
                      className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ backgroundColor: "var(--accent-primary)", border: "2px solid var(--bg-app)" }}
                    >
                      {group.length}
                    </div>
                  )}
                </div>
                <span
                  className="text-[11px] font-semibold max-w-[64px] truncate text-center"
                  style={{ color: allViewed ? "var(--text-hint)" : "var(--text-primary)", fontWeight: allViewed ? 400 : 600 }}
                >
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
            groupId={groupAdminOf?.group_id}
            groupName={groupAdminOf?.group_name}
            onClose={() => setShowPost(false)}
            onPosted={() => qc.invalidateQueries({ queryKey: ["creatorStatuses"] })}
          />
        )}
      </AnimatePresence>
    </>
  );
}