import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { normalizePost } from "@/utils/normalizeMediaUrl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import FriendRequestButton from "@/components/friends/FriendRequestButton";
import { 
  MessageCircle, MoreVertical, ArrowLeft, Flag, UserX, FileText, Zap
} from "lucide-react";
import CommunityPostCard from "@/components/community/CommunityPostCard";
import LivePostCard from "@/components/live/LivePostCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function AvatarCircle({ src, name, size = 88 }) {
  const initial = name?.[0]?.toUpperCase() || "?";
  // Deterministic color from name
  const colors = ["#A8D8EA", "#B8E0D2", "#D6EADF", "#E8D5C4", "#C9B1D0", "#F4C6C0"];
  const idx = (name || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  const bg = colors[idx];

  return (
    <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", border: "3px solid #fff", boxShadow: "0 2px 12px rgba(0,0,0,0.1)", flexShrink: 0, backgroundColor: bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
      {src ? (
        <img src={src} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span style={{ fontSize: size * 0.38, fontWeight: 800, color: "#fff" }}>{initial}</span>
      )}
    </div>
  );
}

export default function UserProfile() {
  const { email: emailParam } = useParams();
  const urlParams = new URLSearchParams(window.location.search);
  const email = emailParam || urlParams.get("email");
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
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

  const { data: userProfileData } = useQuery({
    queryKey: ["userProfile", email],
    queryFn: async () => {
      // Try UserProfile entity first, then fall back to User entity extended data
      const profiles = await base44.entities.UserProfile.filter({ user_email: email });
      return profiles[0] || null;
    },
    enabled: !!email,
    staleTime: 30000,
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

  useEffect(() => {
    setIsFollowing(!!followData);
  }, [followData]);

  const handleFollow = async () => {
    if (!currentUser) { alert("Please log in to follow users"); return; }
    if (isFollowing && followData) {
      await base44.entities.Follow.delete(followData.id);
      setIsFollowing(false);
    } else {
      await base44.entities.Follow.create({
        follower_email: currentUser.email,
        follower_name: currentUser.full_name,
        following_email: email,
        following_name: effectiveName,
      });
      setIsFollowing(true);
    }
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

  // Build display info — merge UserProfile entity + User entity
  const avatarUrl = profileUser?.avatar_url || userProfileData?.avatar_url;
  const rawName = profileUser?.display_name || profileUser?.full_name || userProfileData?.display_name;
  const effectiveName = rawName || email?.split("@")[0] || "User";
  const username = profileUser?.username || userProfileData?.username;
  const bio = profileUser?.bio || userProfileData?.bio;
  const aboutMe = profileUser?.about_me || userProfileData?.about_me;
  const interests = profileUser?.interests || userProfileData?.interests || [];
  const lookingFor = profileUser?.looking_for || userProfileData?.looking_for || [];
  const website = profileUser?.website || userProfileData?.website;
  const portfolio = profileUser?.portfolio || userProfileData?.portfolio;
  const socialLinks = profileUser?.social_links || userProfileData?.social_links || [];
  // Personal info
  const age = profileUser?.age || userProfileData?.age;
  const city = profileUser?.city || userProfileData?.city;
  const major = profileUser?.major || userProfileData?.major;
  const graduationYear = profileUser?.graduation_year || userProfileData?.graduation_year;
  const hobbies = profileUser?.hobbies || userProfileData?.hobbies;

  const isOwnProfile = currentUser?.email === email;

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 safe-top" 
        style={{ backgroundColor: "var(--bg-card)", borderBottom: "1px solid var(--border-light)" }}>
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-bold text-base" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
          {effectiveName}
        </span>
      </div>

      {/* Profile Header */}
      <div className="pb-4 px-5 pt-5" style={{ backgroundColor: "var(--bg-card)", borderBottom: "1px solid var(--border-light)" }}>
        {/* Top row: avatar left, name/username/tags right */}
        <div className="flex items-start gap-4 mb-4">
          <AvatarCircle src={avatarUrl} name={effectiveName} size={80} />
          <div className="flex-1 min-w-0 pt-1">
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-serif)", lineHeight: 1.15, marginBottom: 2 }}>
              {effectiveName}
            </h1>
            {username && (
              <p style={{ fontSize: 13, color: "var(--text-hint)", marginBottom: 6 }}>{username}</p>
            )}
            {interests.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {interests.slice(0, 3).map((tag, i) => (
                  <span key={i} style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20, backgroundColor: "#EEF2FF", color: "#4F46E5" }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* Headline / bio */}
          {bio && (
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-primary)", fontWeight: 500 }}>{bio}</p>
          )}

          {/* About Me */}
          {aboutMe && (
            <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-hint)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>About Me</p>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text-secondary)" }}>{aboutMe}</p>
            </div>
          )}

          {/* Personal Info */}
          {(age || city || major || graduationYear || hobbies) && (
            <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-hint)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>Personal Info</p>
              <div className="space-y-2">
                {age && <div className="flex items-center gap-3">
                  <span style={{ fontSize: 12, color: "var(--text-hint)", width: 100 }}>Age</span>
                  <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>{age}</span>
                </div>}
                {city && <div className="flex items-center gap-3">
                  <span style={{ fontSize: 12, color: "var(--text-hint)", width: 100 }}>City / Campus</span>
                  <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>{city}</span>
                </div>}
                {major && <div className="flex items-center gap-3">
                  <span style={{ fontSize: 12, color: "var(--text-hint)", width: 100 }}>Major / Field</span>
                  <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>{major}</span>
                </div>}
                {graduationYear && <div className="flex items-center gap-3">
                  <span style={{ fontSize: 12, color: "var(--text-hint)", width: 100 }}>Graduation Year</span>
                  <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>{graduationYear}</span>
                </div>}
                {hobbies && <div className="flex items-start gap-3">
                  <span style={{ fontSize: 12, color: "var(--text-hint)", width: 100, flexShrink: 0 }}>Hobbies</span>
                  <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>{Array.isArray(hobbies) ? hobbies.join(", ") : hobbies}</span>
                </div>}
              </div>
            </div>
          )}

          {/* Looking For */}
          {lookingFor.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-hint)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Looking For</p>
              <div className="flex flex-wrap gap-2">
                {lookingFor.map((item, i) => (
                  <span key={i} style={{ fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 20, border: "1.5px solid var(--accent-primary)", color: "var(--accent-primary)", backgroundColor: "var(--accent-primary-light)" }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Interest Tags */}
          {interests.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-hint)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Interest Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {interests.map((tag, i) => (
                  <span key={i} style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 20, backgroundColor: "#EEF2FF", color: "#4F46E5" }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Social Links */}
          {(website || portfolio || socialLinks.length > 0) && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-hint)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Social Links</p>
              <div className="flex flex-wrap gap-2">
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
                {socialLinks.map((link, i) => (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 12, color: "var(--accent-primary)", padding: "4px 12px", borderRadius: 20, backgroundColor: "var(--accent-primary-light)", fontWeight: 600 }}>
                    {link.platform}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!isOwnProfile && currentUser && (
            <div className="flex gap-2 pt-1">
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
                  <Button variant="outline" size="icon" className="rounded-xl h-10 w-10">
                    <MoreVertical className="w-4 h-4" />
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
              className="w-full py-2.5 rounded-2xl font-bold text-sm"
              style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", border: "1px solid var(--border-medium)" }}>
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Live Activities */}
      {livePosts.length > 0 && (
        <div className="mt-4 px-4">
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
      <div className="mt-4 px-4">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5" style={{ color: "var(--text-hint)" }} />
          <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-serif)" }}>Posts</h3>
        </div>
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
  );
}