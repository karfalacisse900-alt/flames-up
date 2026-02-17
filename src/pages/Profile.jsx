import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, Edit2, BookOpen, Palette, Trophy, UserPlus, UserCheck, MessageSquare, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [bio, setBio] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [activeTab, setActiveTab] = useState("posts");
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      setBio(u?.bio || "");
      setDisplayName(u?.display_name || u?.full_name || "");
    }).catch(() => {});
  }, []);

  const { data: myPosts = [] } = useQuery({
    queryKey: ["myPosts", user?.email],
    queryFn: () => base44.entities.Post.filter({ author_email: user.email }, "-created_date"),
    enabled: !!user?.email,
  });

  const { data: myArt = [] } = useQuery({
    queryKey: ["myArt", user?.email],
    queryFn: () => base44.entities.ArtPiece.filter({ creator_email: user.email }, "-created_date"),
    enabled: !!user?.email,
  });

  const { data: gameStats = [] } = useQuery({
    queryKey: ["gameStats", user?.email],
    queryFn: () => base44.entities.GameStats.filter({ player_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: followers = [] } = useQuery({
    queryKey: ["followers", user?.email],
    queryFn: () => base44.entities.Follow.filter({ following_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: following = [] } = useQuery({
    queryKey: ["following", user?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: user.email }),
    enabled: !!user?.email,
  });

  const handleSaveProfile = async () => {
    await base44.auth.updateMe({ bio, display_name: displayName });
    setUser((prev) => ({ ...prev, bio, display_name: displayName }));
    setShowEdit(false);
  };

  const totalGames = gameStats.reduce((s, g) => s + (g.games_played || 0), 0);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-[#7C8C6E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-warm)" }}>
      {/* Profile header */}
      <div className="bg-white border-b border-[#EDE9E3] px-5 pt-6 pb-5">
        <div className="flex items-start justify-between mb-4">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-[#F5F0EB] flex items-center justify-center text-3xl font-semibold text-[#7C8C6E]" style={{ fontFamily: "var(--font-serif)" }}>
            {(user.display_name || user.full_name || "U")[0]?.toUpperCase()}
          </div>
          {/* Action buttons */}
          <div className="flex gap-2">
            <button onClick={() => setShowEdit(true)} className="p-2 rounded-full border border-[#EDE9E3] text-[#6B6B6B]">
              <Edit2 className="w-4 h-4" />
            </button>
            <Link to={createPageUrl("Messages")} className="p-2 rounded-full border border-[#EDE9E3] text-[#6B6B6B]">
              <MessageSquare className="w-4 h-4" />
            </Link>
            <button onClick={() => base44.auth.logout()} className="p-2 rounded-full border border-[#EDE9E3] text-[#6B6B6B] hover:text-red-500">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Name & bio */}
        <h2 className="text-lg font-semibold text-[#2C2C2C]">{user.display_name || user.full_name}</h2>
        <p className="text-xs text-[#9B9B9B] mt-0.5">{user.email}</p>
        {user.bio && <p className="text-sm text-[#6B6B6B] mt-2 leading-relaxed">{user.bio}</p>}

        {/* Stats row */}
        <div className="flex gap-5 mt-4">
          <div className="text-center">
            <p className="text-base font-semibold text-[#2C2C2C]">{myPosts.length}</p>
            <p className="text-xs text-[#9B9B9B]">Posts</p>
          </div>
          <button onClick={() => setShowFollowers(true)} className="text-center">
            <p className="text-base font-semibold text-[#2C2C2C]">{followers.length}</p>
            <p className="text-xs text-[#9B9B9B]">Followers</p>
          </button>
          <button onClick={() => setShowFollowing(true)} className="text-center">
            <p className="text-base font-semibold text-[#2C2C2C]">{following.length}</p>
            <p className="text-xs text-[#9B9B9B]">Following</p>
          </button>
          <div className="text-center">
            <p className="text-base font-semibold text-[#2C2C2C]">{totalGames}</p>
            <p className="text-xs text-[#9B9B9B]">Games</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-5 mt-4">
        <TabsList className="bg-[#F5F0EB] rounded-xl w-full">
          <TabsTrigger value="posts" className="flex-1 rounded-lg data-[state=active]:bg-white gap-1 text-xs">
            <BookOpen className="w-3.5 h-3.5" /> Posts
          </TabsTrigger>
          <TabsTrigger value="art" className="flex-1 rounded-lg data-[state=active]:bg-white gap-1 text-xs">
            <Palette className="w-3.5 h-3.5" /> Art
          </TabsTrigger>
          <TabsTrigger value="games" className="flex-1 rounded-lg data-[state=active]:bg-white gap-1 text-xs">
            <Trophy className="w-3.5 h-3.5" /> Games
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-4 space-y-2">
          {myPosts.length === 0 ? (
            <p className="text-center text-sm text-[#9B9B9B] py-8">No posts yet</p>
          ) : (
            myPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl p-4 border border-[#EDE9E3]">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5F0EB] text-[#6B6B6B] capitalize">{post.type}</span>
                <p className="text-sm text-[#2C2C2C] mt-2" style={{ fontFamily: "var(--font-serif)" }}>{post.text}</p>
                <div className="flex gap-3 mt-2 text-xs text-[#9B9B9B]">
                  <span>♥ {post.like_count || 0}</span>
                  <span>💬 {post.reply_count || 0}</span>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="art" className="mt-4">
          {myArt.length === 0 ? (
            <p className="text-center text-sm text-[#9B9B9B] py-8">No art created yet</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {myArt.map((art) => (
                <div key={art.id} className="bg-white rounded-xl overflow-hidden border border-[#EDE9E3]">
                  <img src={art.image_url} alt={art.title} className="aspect-square w-full object-cover" />
                  <div className="p-2">
                    <p className="text-xs font-medium text-[#2C2C2C] truncate">{art.title}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="games" className="mt-4 space-y-2">
          {gameStats.length === 0 ? (
            <p className="text-center text-sm text-[#9B9B9B] py-8">No games played yet</p>
          ) : (
            gameStats.map((stat) => (
              <div key={stat.id} className="bg-white rounded-xl p-4 border border-[#EDE9E3] flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#2C2C2C] capitalize">{stat.game_name?.replace(/-/g, " ")}</p>
                  <p className="text-xs text-[#9B9B9B] mt-0.5">{stat.games_played} played</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-[#7C8C6E]">{stat.wins}W / {stat.losses}L</p>
                  <p className="text-xs text-[#9B9B9B]">
                    {stat.games_played > 0 ? Math.round((stat.wins / stat.games_played) * 100) : 0}% win rate
                  </p>
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Followers dialog */}
      <Dialog open={showFollowers} onOpenChange={setShowFollowers}>
        <DialogContent className="max-w-sm rounded-2xl max-h-[70vh]">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-serif)" }}>Followers ({followers.length})</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 overflow-y-auto max-h-[50vh]">
            {followers.length === 0 ? (
              <p className="text-sm text-center text-[#9B9B9B] py-4">No followers yet</p>
            ) : followers.map((f) => (
              <div key={f.id} className="flex items-center gap-3 py-2">
                <div className="w-9 h-9 rounded-full bg-[#F5F0EB] flex items-center justify-center text-sm font-medium">
                  {f.follower_name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="text-sm font-medium">{f.follower_name}</p>
                  <p className="text-xs text-[#9B9B9B]">{f.follower_email}</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Following dialog */}
      <Dialog open={showFollowing} onOpenChange={setShowFollowing}>
        <DialogContent className="max-w-sm rounded-2xl max-h-[70vh]">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-serif)" }}>Following ({following.length})</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 overflow-y-auto max-h-[50vh]">
            {following.length === 0 ? (
              <p className="text-sm text-center text-[#9B9B9B] py-4">Not following anyone yet</p>
            ) : following.map((f) => (
              <div key={f.id} className="flex items-center gap-3 py-2">
                <div className="w-9 h-9 rounded-full bg-[#F5F0EB] flex items-center justify-center text-sm font-medium">
                  {f.following_name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="text-sm font-medium">{f.following_name}</p>
                  <p className="text-xs text-[#9B9B9B]">{f.following_email}</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit profile */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-serif)" }}>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="border-[#EDE9E3] rounded-xl" />
            <Textarea placeholder="Bio" value={bio} onChange={(e) => setBio(e.target.value)} className="border-[#EDE9E3] rounded-xl resize-none" />
            <Button onClick={handleSaveProfile} className="w-full bg-[#7C8C6E] hover:bg-[#6B7B5E] rounded-xl">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}