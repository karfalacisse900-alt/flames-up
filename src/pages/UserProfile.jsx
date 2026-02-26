import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, UserPlus, UserMinus, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    const params = new URLSearchParams(window.location.search);
    const email = params.get("email");
    if (email) {
      base44.entities.User.list().then(users => {
        const found = users.find(u => u.email === email);
        if (found) setViewingUser(found);
      });
    }
  }, []);

  const { data: followers = [], refetch: refetchFollowers } = useQuery({
    queryKey: ["profileFollowers", viewingUser?.email],
    queryFn: () => base44.entities.Follow.filter({ following_email: viewingUser.email }),
    enabled: !!viewingUser?.email,
  });

  const { data: following = [] } = useQuery({
    queryKey: ["profileFollowing", viewingUser?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: viewingUser.email }),
    enabled: !!viewingUser?.email,
  });

  const isFollowing = user && viewingUser
    ? followers.some(f => f.follower_email === user.email)
    : false;

  const { data: userPosts = [] } = useQuery({
    queryKey: ["userPosts", viewingUser?.email],
    queryFn: () => viewingUser?.email ? base44.entities.CommunityPost.filter({ author_email: viewingUser.email }, "-created_date", 30) : [],
    enabled: !!viewingUser?.email,
  });

  const { data: userArt = [] } = useQuery({
    queryKey: ["userArt", viewingUser?.email],
    queryFn: () => viewingUser?.email ? base44.entities.ArtPiece.filter({ creator_email: viewingUser.email }, "-created_date", 30) : [],
    enabled: !!viewingUser?.email,
  });

  const handleFollow = async () => {
    if (!user || !viewingUser) return;
    await base44.entities.Follow.create({
      follower_email: user.email,
      follower_name: user.full_name || user.email,
      following_email: viewingUser.email,
      following_name: viewingUser.full_name || viewingUser.email,
    });
    qc.invalidateQueries({ queryKey: ["profileFollowers", viewingUser.email] });
    qc.invalidateQueries({ queryKey: ["myFollows", user.email] });
  };

  const handleUnfollow = async () => {
    if (!user || !viewingUser) return;
    const myFollowRecord = followers.find(f => f.follower_email === user.email);
    if (myFollowRecord) {
      await base44.entities.Follow.delete(myFollowRecord.id);
    }
    qc.invalidateQueries({ queryKey: ["profileFollowers", viewingUser.email] });
    qc.invalidateQueries({ queryKey: ["myFollows", user.email] });
  };

  if (!viewingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  const isOwnProfile = user?.email === viewingUser.email;

  return (
    <div className="overflow-y-auto overscroll-contain" style={{ backgroundColor: "var(--bg-app)", minHeight: "calc(100dvh - 64px)", paddingBottom: "env(safe-area-inset-bottom, 24px)" }}>
      {/* Header */}
      <div style={{ backgroundColor: "var(--bg-card)", borderBottom: "1px solid var(--border-light)" }}>
        <div className="px-5 pb-5 pt-4">
          <Link to={createPageUrl("Home")} className="flex items-center gap-2 mb-3 text-sm font-medium" style={{ color: "var(--accent-primary)" }}>
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>

          <div className="flex items-start justify-between mb-3">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center text-3xl font-semibold shrink-0" style={{ backgroundColor: "var(--bg-app)", color: "var(--accent-primary)", fontFamily: "var(--font-serif)" }}>
              {viewingUser.avatar_url ? (
                <img src={viewingUser.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                (viewingUser.display_name || viewingUser.full_name || "U")[0]?.toUpperCase()
              )}
            </div>

            {/* Action buttons */}
            {!isOwnProfile && user && (
              <div className="flex gap-2">
                {isFollowing ? (
                  <button
                    onClick={handleUnfollow}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                    style={{ borderColor: "var(--text-hint)", color: "var(--text-secondary)" }}
                  >
                    <UserMinus className="w-3.5 h-3.5" /> Unfollow
                  </button>
                ) : (
                  <button
                    onClick={handleFollow}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: "var(--accent-primary)" }}
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Follow
                  </button>
                )}
                <Link
                  to={createPageUrl("Messages") + `?with=${viewingUser.email}&name=${viewingUser.full_name}`}
                  className="p-2 rounded-full border transition-all"
                  style={{ borderColor: "var(--border-light)", color: "var(--text-secondary)" }}
                >
                  <MessageSquare className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>

          {/* Name & bio */}
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{viewingUser.display_name || viewingUser.full_name}</h2>
          {viewingUser.about_me && (
            <div className="mt-3 p-3 rounded-xl text-sm leading-relaxed" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)", fontFamily: "var(--font-serif)" }}>
              {viewingUser.about_me}
            </div>
          )}

          {/* Skills */}
          {viewingUser.skills?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {viewingUser.skills.map((skill, i) => (
                <span key={i} className="text-[11px] px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)", border: "1px solid var(--accent-primary)" }}>
                  {skill}
                </span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="flex gap-5 mt-4">
            <div className="text-center">
              <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{userPosts.length}</p>
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>Posts</p>
            </div>
            <div className="text-center">
              <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{followers.length}</p>
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>Followers</p>
            </div>
            <div className="text-center">
              <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{following.length}</p>
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>Following</p>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      {userPosts.length > 0 && (
        <div className="px-5 mt-4">
          <h3 className="font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Posts ({userPosts.length})</h3>
          <div className="space-y-3">
            {userPosts.map(post => (
              <div key={post.id} className="p-3 rounded-xl border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)" }}>
                <p className="text-sm" style={{ color: "var(--text-primary)" }}>{post.title || post.body}</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>❤️ {post.upvotes || 0} • 💬 {post.comment_count || 0}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Art */}
      {userArt.length > 0 && (
        <div className="px-5 mt-4 mb-8">
          <h3 className="font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Art ({userArt.length})</h3>
          <div className="grid grid-cols-2 gap-3">
            {userArt.map(art => (
              <div key={art.id} className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                <img src={art.image_url} alt={art.title} className="aspect-square w-full object-cover" />
                <div className="p-2">
                  <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{art.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}