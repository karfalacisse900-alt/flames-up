import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import FriendRequestButton from "@/components/friends/FriendRequestButton";
import { 
  MessageCircle, UserPlus, UserCheck, MoreVertical, MapPin, 
  Calendar, GraduationCap, Briefcase, Users, FileText, 
  Zap, ArrowLeft, Flag, UserX 
} from "lucide-react";
import CommunityPostCard from "@/components/community/CommunityPostCard";
import LivePostCard from "@/components/live/LivePostCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function UserProfile() {
  const { email: emailParam } = useParams();
  // Also support ?email= query param (for backwards compatibility with old links)
  const urlParams = new URLSearchParams(window.location.search);
  const email = emailParam || urlParams.get("email");
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: profileUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ["user", email],
    queryFn: async () => {
      const users = await base44.entities.User.filter({ email });
      return users[0] || null;
    },
    enabled: !!email,
    staleTime: 30000,
    retry: 3,
  });

  const { data: userProfileData } = useQuery({
    queryKey: ["userProfile", email],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ user_email: email });
      return profiles[0] || null;
    },
    enabled: !!email,
    staleTime: 30000,
  });

  const { data: userPosts = [] } = useQuery({
    queryKey: ["userPosts", email],
    queryFn: () => base44.entities.CommunityPost.filter({ author_email: email }, "-created_date", 30),
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
    if (!currentUser) {
      alert("Please log in to follow users");
      return;
    }

    if (isFollowing && followData) {
      await base44.entities.Follow.delete(followData.id);
      setIsFollowing(false);
    } else {
      await base44.entities.Follow.create({
        follower_email: currentUser.email,
        follower_name: currentUser.full_name,
        following_email: email,
        following_name: effectiveUser?.full_name,
      });
      setIsFollowing(true);
    }
  };

  const handleMessage = () => {
    if (!currentUser) {
      alert("Please log in to send messages");
      return;
    }
    navigate("/Messages");
  };

  const handleReport = () => {
    if (!currentUser) return;
    base44.entities.Report.create({
      content_type: "user",
      content_id: email,
      reason: "Reported from profile",
      reporter_email: currentUser.email,
    });
    alert("User reported. Our team will review this.");
  };

  const handleBlock = async () => {
    if (!currentUser) return;
    await base44.entities.BlockedUser.create({
      blocker_email: currentUser.email,
      blocked_email: email,
    });
    alert("User blocked");
    navigate(-1);
  };

  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-app)" }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-2" 
            style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
          <p className="text-sm" style={{ color: "var(--text-hint)" }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  // If still no user but we have a userProfileData, construct a minimal user object
  const effectiveUser = profileUser || (userProfileData ? {
    email,
    full_name: userProfileData.display_name || userProfileData.full_name || email.split("@")[0],
    avatar_url: userProfileData.avatar_url,
  } : null);

  if (!effectiveUser) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-app)" }}>
        <div className="text-center px-8">
          <div className="text-5xl mb-4">👤</div>
          <p className="text-base font-bold mb-2" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
            User not found
          </p>
          <p className="text-sm" style={{ color: "var(--text-hint)" }}>This profile doesn't exist or hasn't been set up yet</p>
          <button onClick={() => navigate(-1)} className="mt-6 px-6 py-2 rounded-full text-sm font-bold" style={{ backgroundColor: "var(--accent-primary)", color: "#fff" }}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.email === email;
  // Merge data from User entity + UserProfile entity
  const profile = {
    bio: userProfileData?.bio || effectiveUser?.bio,
    age: userProfileData?.age || effectiveUser?.age,
    major: userProfileData?.major || effectiveUser?.major,
    graduation_year: userProfileData?.graduation_year || effectiveUser?.graduation_year,
    location: userProfileData?.location || effectiveUser?.location,
    interests: userProfileData?.interests || effectiveUser?.interests,
    looking_for: userProfileData?.looking_for || effectiveUser?.looking_for,
    website: userProfileData?.website || effectiveUser?.website,
    social_links: userProfileData?.social_links || effectiveUser?.social_links,
    avatar_url: userProfileData?.avatar_url || effectiveUser?.avatar_url,
    hide_age: userProfileData?.hide_age ?? effectiveUser?.hide_age,
    hide_graduation: userProfileData?.hide_graduation ?? effectiveUser?.hide_graduation,
    hide_location: userProfileData?.hide_location ?? effectiveUser?.hide_location,
    hide_interests: userProfileData?.hide_interests ?? effectiveUser?.hide_interests,
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 safe-top" 
        style={{ backgroundColor: "var(--bg-card)", borderBottom: "1px solid var(--border-light)" }}>
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Profile Header Card */}
      <div className="px-4 py-5 mt-2">
        <div className="rounded-[28px] overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.96)", border: "1px solid #e7edf5", boxShadow: "0 10px 24px rgba(15,23,42,0.05)" }}>
          <div className="p-6">
            {/* Avatar & Name */}
            <div className="flex items-start gap-4 mb-5">
              <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0" 
                style={{ border: "3px solid var(--accent-primary)" }}>
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={effectiveUser.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold"
                    style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
                    {effectiveUser.full_name?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[22px] font-bold leading-tight" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                  {effectiveUser.full_name}
                </h2>
                {profile.bio && (
                  <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {profile.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Profile Details Grid */}
            {(profile.age || profile.major || profile.graduation_year || profile.location) && (
              <div className="grid grid-cols-2 gap-3 mb-5 pb-5" style={{ borderBottom: "1px solid #edf2f7" }}>
                {profile.age && !profile.hide_age && (
                  <div className="text-sm">
                    <p style={{ color: "var(--text-hint)", fontSize: "11px", fontWeight: 600, marginBottom: "4px" }}>Age</p>
                    <p style={{ color: "var(--text-primary)", fontWeight: 500 }}>{profile.age}</p>
                  </div>
                )}
                {profile.major && (
                  <div className="text-sm">
                    <p style={{ color: "var(--text-hint)", fontSize: "11px", fontWeight: 600, marginBottom: "4px" }}>Major</p>
                    <p style={{ color: "var(--text-primary)", fontWeight: 500 }}>{profile.major}</p>
                  </div>
                )}
                {profile.graduation_year && !profile.hide_graduation && (
                  <div className="text-sm">
                    <p style={{ color: "var(--text-hint)", fontSize: "11px", fontWeight: 600, marginBottom: "4px" }}>Graduation</p>
                    <p style={{ color: "var(--text-primary)", fontWeight: 500 }}>Class of {profile.graduation_year}</p>
                  </div>
                )}
                {profile.location && !profile.hide_location && (
                  <div className="text-sm">
                    <p style={{ color: "var(--text-hint)", fontSize: "11px", fontWeight: 600, marginBottom: "4px" }}>Location</p>
                    <p style={{ color: "var(--text-primary)", fontWeight: 500 }}>{profile.location}</p>
                  </div>
                )}
              </div>
            )}

            {/* Interests */}
            {profile.interests && profile.interests.length > 0 && !profile.hide_interests && (
              <div className="mb-5">
                <p style={{ color: "var(--text-hint)", fontSize: "11px", fontWeight: 700, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Interests & Hobbies
                </p>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest, idx) => (
                    <span key={idx} className="px-3 py-1.5 rounded-full text-xs font-medium"
                      style={{ backgroundColor: "#f0f4ff", color: "var(--accent-primary)" }}>
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Looking For */}
            {profile.looking_for && profile.looking_for.length > 0 && (
              <div className="mb-5">
                <p style={{ color: "var(--text-hint)", fontSize: "11px", fontWeight: 700, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Looking For
                </p>
                <div className="flex flex-wrap gap-2">
                  {profile.looking_for.map((item, idx) => (
                    <span key={idx} className="px-3 py-1.5 rounded-full text-xs font-medium" style={{ backgroundColor: "#f8f9fc", color: "var(--text-primary)", border: "1px solid #e0e7f1" }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Website & Social Links */}
            {(profile.website || profile.social_links?.length > 0) && (
              <div className="mb-5">
                <p style={{ color: "var(--text-hint)", fontSize: "11px", fontWeight: 700, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Links
                </p>
                <div className="space-y-2">
                  {profile.website && (
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:underline"
                      style={{ color: "var(--accent-primary)" }}>
                      🌐 Website
                    </a>
                  )}
                  {profile.social_links?.map((link, idx) => (
                    <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:underline"
                      style={{ color: "var(--accent-primary)" }}>
                      {link.platform}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {!isOwnProfile && currentUser && (
              <div className="flex gap-2 mt-6 pt-5 flex-wrap" style={{ borderTop: "1px solid #edf2f7" }}>
                <Button onClick={handleMessage} className="flex-1 rounded-full h-10" style={{ backgroundColor: "var(--accent-primary)", color: "white" }}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
                <FriendRequestButton
                  targetEmail={email}
                  targetName={effectiveUser?.full_name}
                  targetAvatar={profile.avatar_url}
                  currentUser={currentUser}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleReport}>
                      <Flag className="w-4 h-4 mr-2" />
                      Report
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleBlock} className="text-red-600">
                      <UserX className="w-4 h-4 mr-2" />
                      Block
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {isOwnProfile && (
              <Button onClick={() => navigate("/Profile")} className="w-full mt-6 rounded-full h-10" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)" }}>
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Live Activities */}
      {livePosts.length > 0 && (
        <div className="mt-4 px-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5" style={{ color: "var(--accent-secondary)" }} />
            <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-serif)" }}>
              Live Activities
            </h3>
          </div>
          <div className="space-y-3">
            {livePosts.map(post => (
              <LivePostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Posts */}
      <div className="mt-4 px-4">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5" style={{ color: "var(--text-hint)" }} />
          <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-serif)" }}>
            Recent Posts
          </h3>
        </div>
        {userPosts.length === 0 ? (
          <div className="text-center py-12" style={{ color: "var(--text-hint)" }}>
            <p>No posts yet</p>
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