import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Settings, LogOut, Edit2, BookOpen, Palette, Gamepad2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [bio, setBio] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [activeTab, setActiveTab] = useState("posts");

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

  const handleSaveProfile = async () => {
    await base44.auth.updateMe({ bio, display_name: displayName });
    setUser((prev) => ({ ...prev, bio, display_name: displayName }));
    setShowEdit(false);
  };

  const totalGames = gameStats.reduce((s, g) => s + (g.games_played || 0), 0);
  const totalWins = gameStats.reduce((s, g) => s + (g.wins || 0), 0);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-4xl mb-3">👤</p>
          <p className="text-sm text-[#9B9B9B]">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-5 pt-5 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>Profile</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowEdit(true)} className="p-2 rounded-full bg-white border border-[#EDE9E3] text-[#6B6B6B] hover:text-[#2C2C2C]">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => base44.auth.logout()} className="p-2 rounded-full bg-white border border-[#EDE9E3] text-[#6B6B6B] hover:text-red-500">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Profile card */}
      <div className="mx-5 mt-4 bg-white rounded-2xl p-6 border border-[#EDE9E3]">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#F5F0EB] flex items-center justify-center text-2xl font-serif" style={{ fontFamily: "var(--font-serif)" }}>
            {(user.display_name || user.full_name || "U")[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#2C2C2C]">{user.display_name || user.full_name}</h2>
            <p className="text-xs text-[#9B9B9B]">{user.email}</p>
            {user.bio && <p className="text-sm text-[#6B6B6B] mt-1">{user.bio}</p>}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="text-center p-3 rounded-xl bg-[#FAF8F5]">
            <p className="text-lg font-semibold text-[#2C2C2C]">{myPosts.length}</p>
            <p className="text-xs text-[#9B9B9B]">Posts</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-[#FAF8F5]">
            <p className="text-lg font-semibold text-[#2C2C2C]">{myArt.length}</p>
            <p className="text-xs text-[#9B9B9B]">Art</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-[#FAF8F5]">
            <p className="text-lg font-semibold text-[#2C2C2C]">{totalGames}</p>
            <p className="text-xs text-[#9B9B9B]">Games</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-5 mt-5">
        <TabsList className="bg-[#F5F0EB] rounded-xl w-full">
          <TabsTrigger value="posts" className="flex-1 rounded-lg data-[state=active]:bg-white gap-1">
            <BookOpen className="w-3.5 h-3.5" /> Posts
          </TabsTrigger>
          <TabsTrigger value="art" className="flex-1 rounded-lg data-[state=active]:bg-white gap-1">
            <Palette className="w-3.5 h-3.5" /> Art
          </TabsTrigger>
          <TabsTrigger value="games" className="flex-1 rounded-lg data-[state=active]:bg-white gap-1">
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
                <p className="text-sm text-[#2C2C2C] mt-2 font-serif" style={{ fontFamily: "var(--font-serif)" }}>{post.text}</p>
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
                  <p className="text-xs text-[#9B9B9B] mt-0.5">{stat.games_played} games played</p>
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

      {/* Edit profile dialog */}
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