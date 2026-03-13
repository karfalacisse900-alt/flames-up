import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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
  const { email } = useParams();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);

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
  });

  const { data: userPosts = [] } = useQuery({
    queryKey: ["userPosts", email],
    queryFn: () => base44.entities.CommunityPost.filter({ author_email: email }, "-created_date", 50),
    enabled: !!email,
  });

  const { data: livePosts = [] } = useQuery({
    queryKey: ["userLivePosts", email],
    queryFn: async () => {
      const posts = await base44.entities.LivePost.filter({ author_email: email }, "-created_date", 20);
      const now = new Date();
      return posts.filter(p => new Date(p.expires_at) > now);
    },
    enabled: !!email,
  });

  const { data: groupCount = 0 } = useQuery({
    queryKey: ["userGroups", email],
    queryFn: async () => {
      const memberships = await base44.entities.GroupMember.filter({ user_email: email });
      return memberships.length;
    },
    enabled: !!email,
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
        following_name: profileUser?.full_name,
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

  if (!profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full" />
      </div>
    );
  }

  const isOwnProfile = currentUser?.email === email;
  const profile = profileUser.profile_data || {};

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3" 
        style={{ backgroundColor: "var(--bg-card)", borderBottom: "1px solid var(--border-light)" }}>
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold flex-1" style={{ fontFamily: "var(--font-serif)" }}>
          Profile
        </h1>
      </div>

      {/* Profile Header */}
      <div className="px-4 py-6" style={{ backgroundColor: "var(--bg-card)" }}>
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden" 
              style={{ border: "3px solid var(--accent-primary)" }}>
              {profileUser.avatar_url ? (
                <img src={profileUser.avatar_url} alt={profileUser.full_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold"
                  style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
                  {profileUser.full_name?.[0]?.toUpperCase() || "?"}
                </div>
              )}
            </div>
          </div>

          {/* Name & Bio */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-serif)" }}>
              {profileUser.full_name}
            </h2>
            {profile.bio && (
              <p className="text-sm mb-3 whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        {/* Profile Details */}
        <div className="space-y-2 mb-4">
          {profile.age && !profile.hide_age && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
              <span>{profile.age} years old</span>
            </div>
          )}
          {profile.major && (
            <div className="flex items-center gap-2 text-sm">
              <GraduationCap className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
              <span>{profile.major}</span>
            </div>
          )}
          {profile.graduation_year && !profile.hide_graduation && (
            <div className="flex items-center gap-2 text-sm">
              <Briefcase className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
              <span>Class of {profile.graduation_year}</span>
            </div>
          )}
          {profile.location && !profile.hide_location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
              <span>{profile.location}</span>
            </div>
          )}
        </div>

        {/* Interests */}
        {profile.interests && profile.interests.length > 0 && !profile.hide_interests && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
              Interests & Hobbies
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest, idx) => (
                <span key={idx} className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Looking For */}
        {profile.looking_for && profile.looking_for.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
              Looking For
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.looking_for.map((item, idx) => (
                <span key={idx} className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", border: "1px solid var(--border-light)" }}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!isOwnProfile && currentUser && (
          <div className="flex gap-2 mt-4">
            <Button onClick={handleMessage} className="flex-1" style={{ backgroundColor: "var(--accent-primary)" }}>
              <MessageCircle className="w-4 h-4 mr-2" />
              Message
            </Button>
            <Button onClick={handleFollow} variant="outline" className="flex-1">
              {isFollowing ? <UserCheck className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
              {isFollowing ? "Following" : "Follow"}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
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
          <Button onClick={() => navigate("/Profile")} className="w-full mt-4" variant="outline">
            Edit Profile
          </Button>
        )}
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-3 gap-4 px-4 py-4" style={{ backgroundColor: "var(--bg-card)", borderTop: "1px solid var(--border-light)" }}>
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ color: "var(--accent-primary)" }}>
            {userPosts.length}
          </div>
          <div className="text-xs" style={{ color: "var(--text-secondary)" }}>Posts</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ color: "var(--accent-primary)" }}>
            {groupCount}
          </div>
          <div className="text-xs" style={{ color: "var(--text-secondary)" }}>Groups</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ color: "var(--accent-primary)" }}>
            {livePosts.length}
          </div>
          <div className="text-xs" style={{ color: "var(--text-secondary)" }}>Live</div>
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
              <CommunityPostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}