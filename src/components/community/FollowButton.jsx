import React, { useState, useEffect } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function FollowButton({ targetUserId, targetUserName, currentUser, onFollowChange }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!currentUser?.email || !targetUserId) return;
    
    base44.entities.Follow.filter({
      follower_email: currentUser.email,
      following_email: targetUserId,
    }).then(follows => {
      setIsFollowing(follows.length > 0);
    }).catch(() => {});
  }, [currentUser?.email, targetUserId]);

  const handleToggleFollow = async (e) => {
    e.stopPropagation();
    if (!currentUser?.email || processing || currentUser.email === targetUserId) return;

    setProcessing(true);
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);

    try {
      if (wasFollowing) {
        // Unfollow
        const follows = await base44.entities.Follow.filter({
          follower_email: currentUser.email,
          following_email: targetUserId,
        });
        if (follows[0]) {
          await base44.entities.Follow.delete(follows[0].id);
          
          // Sync to Supabase
          const SUPABASE_URL = "https://ljyxfbymvbtflvdwipxg.supabase.co";
          const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqeXhmYnltdmJ0Zmx2ZHdpcHhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDUzNDQ0NCwiZXhwIjoyMDUwMTEwNDQ0fQ.fIYLuEuPMGUvj_U5N0bj8fMHFWTqHK-wbMQXDxdwZ20";
          
          await fetch(`${SUPABASE_URL}/rest/v1/followers?id=eq.${follows[0].id}`, {
            method: "DELETE",
            headers: {
              "apikey": SUPABASE_SERVICE_ROLE_KEY,
              "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            },
          });
        }
      } else {
        // Follow
        const newFollow = await base44.entities.Follow.create({
          follower_email: currentUser.email,
          follower_name: currentUser.display_name || currentUser.full_name || "User",
          following_email: targetUserId,
          following_name: targetUserName || "User",
        });

        // Sync to Supabase
        const SUPABASE_URL = "https://ljyxfbymvbtflvdwipxg.supabase.co";
        const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqeXhmYnltdmJ0Zmx2ZHdpcHhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDUzNDQ0NCwiZXhwIjoyMDUwMTEwNDQ0fQ.fIYLuEuPMGUvj_U5N0bj8fMHFWTqHK-wbMQXDxdwZ20";

        await fetch(`${SUPABASE_URL}/rest/v1/followers`, {
          method: "POST",
          headers: {
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates",
          },
          body: JSON.stringify({
            id: String(newFollow.id),
            follower_id: currentUser.email,
            following_id: targetUserId,
          }),
        });
      }

      onFollowChange?.();
    } catch (err) {
      console.error("Follow toggle failed:", err);
      setIsFollowing(wasFollowing);
    } finally {
      setProcessing(false);
    }
  };

  if (!currentUser || currentUser.email === targetUserId) return null;

  return (
    <button
      onClick={handleToggleFollow}
      disabled={processing}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all"
      style={{
        backgroundColor: isFollowing ? "var(--bg-subtle)" : "var(--accent-primary)",
        color: isFollowing ? "var(--text-secondary)" : "#fff",
        border: isFollowing ? "1px solid var(--border-light)" : "none",
      }}
    >
      {isFollowing ? (
        <>
          <UserCheck className="w-4 h-4" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          Follow
        </>
      )}
    </button>
  );
}