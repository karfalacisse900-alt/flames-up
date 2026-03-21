import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { normalizePost } from "@/utils/normalizeMediaUrl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import FriendRequestButton from "@/components/friends/FriendRequestButton";
import { MessageCircle, ArrowLeft, Flag, UserX, Zap, MoreHorizontal } from "lucide-react";
import CommunityPostCard from "@/components/community/CommunityPostCard";
import LivePostCard from "@/components/live/LivePostCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function UserProfile() {
  const { email: emailParam } = useParams();
  const urlParams = new URLSearchParams(window.location.search);
  const email = emailParam || urlParams.get("email");
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: profileUser } = useQuery({
    queryKey: ["user", email],
    queryFn: async () => {
      const users = await base44.entities.User.filter({ email });
      return users[0] || null;
    },
    enabled: !!email,
    staleTime: 60000,
  });

  const { data: userPosts = [] } = useQuery({
    queryKey: ["userPosts", email],
    queryFn: async () => {
      const posts = await base44.entities.CommunityPost.filter({ author_email: email }, "-created_date", 30);
      return posts.map(normalizePost);
    },
    enabled: !!email,
    staleTime: 60000,
  });

  const { data: livePosts = [] } = useQuery({
    queryKey: ["userLivePosts", email],
    queryFn: async () => {
      const posts = await base44.entities.LivePost.filter({ author_email: email }, "-created_date", 10);
      const now = new Date();
      return posts.filter(p => new Date(p.expires_at) > now);
    },
    enabled: !!email,
    staleTime: 60000,
  });

  const { data: followData } = useQuery({
    queryKey: ["followStatus", email, currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email || currentUser.email === email) return null;
      const follows = await base44.entities.Follow.filter({
        follower_email: currentUser.email,
        following_email: email,
      });
      return follows[0] || null;
    },
    enabled: !!currentUser?.email && currentUser?.email !== email,
  });

  const isFollowing = !!followData;

  const handleFollow = async () => {
    if (!currentUser) { alert("Please log in to follow users"); return; }
    if (isFollowing && followData) {
      await base44.entities.Follow.delete(followData.id);
    } else {
      await base44.entities.Follow.create({
        follower_email: currentUser.email,
        follower_name: currentUser.full_name,
        following_email: email,
        following_name: effectiveName,
      });
    }
    qc.invalidateQueries({ queryKey: ["followStatus", email, currentUser?.email] });
  };

  const handleMessage = () => {
    if (!currentUser) { alert("Please log in to send messages"); return; }
    navigate("/Messages");
  };

  const handleReport = () => {
    if (!currentUser) return;
    base44.entities.Report.create({ content_type: "user", content_id: email, reason: "Reported from profile", reporter_email: currentUser.email });
    alert("User reported. Our team will review this.");
  };

  const handleBlock = async () => {
    if (!currentUser) return;
    await base44.entities.BlockedUser.create({ blocker_email: currentUser.email, blocked_email: email });
    alert("User blocked");
    navigate(-1);
  };

  // Build display info
  const avatarUrl = profileUser?.avatar_url;
  const rawName = profileUser?.display_name || profileUser?.full_name;
  const effectiveName = rawName || email?.split("@")[0] || "User";
  const username = profileUser?.username;
  const bio = profileUser?.bio;
  const aboutMe = profileUser?.about_me;
  const interests = profileUser?.interests || [];
  const lookingFor = profileUser?.looking_for || [];
  const age = profileUser?.age;
  const city = profileUser?.city;
  const major = profileUser?.major;
  const graduationYear = profileUser?.graduation_year;
  const hobbies = profileUser?.hobbies;
  const website = profileUser?.website || profileUser?.website_url;
  const portfolio = profileUser?.portfolio || profileUser?.portfolio_url;

  const isOwnProfile = currentUser?.email === email;

  const THEMES = {
    default: { banner: "linear-gradient(135deg, #EEF2FF, #F1F5F9)" },
    forest:  { banner: "linear-gradient(135deg, #1a3a20, #2d5a35)" },
    ocean:   { banner: "linear-gradient(135deg, #0f2a3f, #1e4060)" },
    sunset:  { banner: "linear-gradient(135deg, #3d1f0a, #5a2e10)" },
    lavender:{ banner: "linear-gradient(135deg, #2a1f3d, #3d2b5a)" },
  };
  const theme = THEMES[profileUser?.profile_theme || "default"] || THEMES.default;

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "#f3f6fb" }}>
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 safe-top"
        style={{ backgroundColor: "var(--bg-card)", borderBottom: "1px solid var(--border-light)" }}>
        <button onClick={() => navigate(-1)} aria-label="Go back" style={{ minHeight: 44, minWidth: 44, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", touchAction: "manipulation" }}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-bold text-base" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
          {effectiveName}
        </span>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4">
        {/* Profile Card — same design as own Profile page */}
        <div className="relative overflow-hidden rounded-[34px] p-4"
          style={{ backgroundColor: "rgba(255,255,255,0.96)", border: "1px solid #e7edf5", boxShadow: "0 16px 40px rgba(15,23,42,0.08)" }}>

          {/* Banner gradient */}
          <div className="absolute inset-x-0 top-0 h-28" style={{ background: theme.banner, opacity: 0.22 }} />

          <div className="relative">
            {/* Avatar + name row */}
            <div className="flex items-start gap-4 pt-2">
              <div className="relative shrink-0">
                <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center text-3xl font-bold"
                  style={{ backgroundColor: "#d9eef7", color: "var(--accent-primary)", border: "4px solid #fff", boxShadow: "0 8px 24px rgba(15,23,42,0.12)" }}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    (effectiveName)[0]?.toUpperCase()
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0 pt-2">
                <h2 className="text-[24px] font-bold leading-tight" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                  {effectiveName}
                </h2>
                {username && <p className="text-sm mt-1 font-semibold" style={{ color: "var(--text-hint)" }}>{username}</p>}
                {interests.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {interests.slice(0, 2).map((item) => (
                      <span key={item} className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: "#d9eef7", color: "#2d5b7c" }}>
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bio / about */}
            {(bio || aboutMe) && (
              <div className="mt-4 rounded-[24px] px-4 py-3" style={{ backgroundColor: "#f7f9fc", border: "1px solid #edf2f7" }}>
                {bio && <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{bio}</p>}
                {aboutMe && <p className="text-sm mt-1.5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{aboutMe}</p>}
              </div>
            )}

            {/* Personal info */}
            {(age || city || major || graduationYear || hobbies) && (
              <div className="mt-3 rounded-[20px] px-4 py-3 space-y-2" style={{ backgroundColor: "#f7f9fc", border: "1px solid #edf2f7" }}>
                <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-hint)" }}>Personal Info</p>
                {age && <div className="flex gap-3 text-sm"><span style={{ color: "var(--text-hint)", width: 110 }}>Age</span><span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{age}</span></div>}
                {city && <div className="flex gap-3 text-sm"><span style={{ color: "var(--text-hint)", width: 110 }}>City</span><span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{city}</span></div>}
                {major && <div className="flex gap-3 text-sm"><span style={{ color: "var(--text-hint)", width: 110 }}>Major</span><span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{major}</span></div>}
                {graduationYear && <div className="flex gap-3 text-sm"><span style={{ color: "var(--text-hint)", width: 110 }}>Graduation</span><span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{graduationYear}</span></div>}
                {hobbies && <div className="flex gap-3 text-sm"><span style={{ color: "var(--text-hint)", width: 110 }}>Hobbies</span><span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{Array.isArray(hobbies) ? hobbies.join(", ") : hobbies}</span></div>}
              </div>
            )}

            {/* Looking For */}
            {lookingFor.length > 0 && (
              <div className="mt-3">
                <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-hint)" }}>Looking For</p>
                <div className="flex flex-wrap gap-2">
                  {lookingFor.map((item, i) => (
                    <span key={i} style={{ fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 20, border: "1.5px solid var(--accent-primary)", color: "var(--accent-primary)", backgroundColor: "var(--accent-primary-light)" }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* All interest tags */}
            {interests.length > 0 && (
              <div className="mt-3">
                <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-hint)" }}>Interests</p>
                <div className="flex flex-wrap gap-1.5">
                  {interests.map((tag, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: "#d9eef7", color: "#2d5b7c" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Social links */}
            {(website || portfolio) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {website && (
                  <a href={website.startsWith("http") ? website : `https://${website}`} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 12, color: "var(--accent-primary)", padding: "4px 12px", borderRadius: 20, backgroundColor: "var(--accent-primary-light)", fontWeight: 600 }}>
                    🌐 Website
                  </a>
                )}
                {portfolio && (
                  <a href={portfolio.startsWith("http") ? portfolio : `https://${portfolio}`} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 12, color: "var(--accent-primary)", padding: "4px 12px", borderRadius: 20, backgroundColor: "var(--accent-primary-light)", fontWeight: 600 }}>
                    💼 Portfolio
                  </a>
                )}
              </div>
            )}

            {/* Action buttons */}
            {!isOwnProfile && currentUser && (
              <div className="flex gap-2 mt-4">
                <button onClick={handleMessage}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl font-bold text-sm text-white"
                  style={{ backgroundColor: "var(--accent-primary)" }}>
                  <MessageCircle className="w-4 h-4" />
                  Message
                </button>
                <FriendRequestButton
                  targetEmail={email}
                  targetName={effectiveName}
                  targetAvatar={avatarUrl}
                  currentUser={currentUser}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-xl" style={{ minWidth: 44, minHeight: 44 }}>
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleReport}>
                      <Flag className="w-4 h-4 mr-2" /> Report
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleBlock} className="text-red-600">
                      <UserX className="w-4 h-4 mr-2" /> Block
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {isOwnProfile && (
              <button onClick={() => navigate("/Profile")}
                className="w-full mt-4 py-2.5 rounded-2xl font-bold text-sm"
                style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", border: "1px solid var(--border-medium)" }}>
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Live Activities */}
        {livePosts.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5" style={{ color: "var(--accent-secondary)" }} />
              <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-serif)" }}>Live Activities</h3>
            </div>
            <div className="space-y-3">
              {livePosts.map(post => <LivePostCard key={post.id} post={post} />)}
            </div>
          </div>
        )}

        {/* Posts */}
        <div className="mt-4">
          <h3 className="text-lg font-bold mb-3" style={{ fontFamily: "var(--font-serif)" }}>Posts</h3>
          {userPosts.length === 0 ? (
            <div className="text-center py-12" style={{ color: "var(--text-hint)" }}>
              <p className="text-sm">No posts yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userPosts.map(post => (
                <CommunityPostCard
                  key={post.id}
                  post={post}
                  user={currentUser}
                  onUpvote={async () => {
                    if (!currentUser?.email) return;
                    const alreadyLiked = post.upvoted_by?.includes(currentUser.email);
                    const newUpvotedBy = alreadyLiked
                      ? (post.upvoted_by || []).filter(e => e !== currentUser.email)
                      : [...(post.upvoted_by || []), currentUser.email];
                    await base44.entities.CommunityPost.update(post.id, {
                      upvotes: newUpvotedBy.length,
                      upvoted_by: newUpvotedBy,
                    });
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}