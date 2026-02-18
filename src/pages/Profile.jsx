import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, Edit2, BookOpen, Palette, Trophy, MessageSquare, Wallet, Star, Compass } from "lucide-react";
import WalletWidget from "../components/coins/WalletWidget";
import { getBalance } from "../components/coins/coinsHelper";
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
  const { data: coinBalance = 0 } = useQuery({
    queryKey: ["coinBalance", user?.email],
    queryFn: () => getBalance(user.email),
    enabled: !!user?.email,
  });

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

  const { data: myReviews = [] } = useQuery({
    queryKey: ["myReviews", user?.email],
    queryFn: () => base44.entities.DiscoverReview.filter({ user_email: user.email }, "-created_date"),
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
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Profile header */}
      <div className="px-5 pt-6 pb-5" style={{ backgroundColor: "var(--bg-card)", borderBottom: "1px solid var(--border-light)" }}>
        <div className="flex items-start justify-between mb-4">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-semibold" style={{ backgroundColor: "var(--bg-app)", color: "var(--accent-primary)", fontFamily: "var(--font-serif)" }}>
            {(user.display_name || user.full_name || "U")[0]?.toUpperCase()}
          </div>
          {/* Action buttons */}
          <div className="flex gap-2">
            <button onClick={() => setShowEdit(true)} className="p-2 rounded-full border" style={{ borderColor: "var(--border-light)", color: "var(--text-secondary)" }}>
              <Edit2 className="w-4 h-4" />
            </button>
            <Link to={createPageUrl("Messages")} className="p-2 rounded-full border" style={{ borderColor: "var(--border-light)", color: "var(--text-secondary)" }}>
              <MessageSquare className="w-4 h-4" />
            </Link>
            <Link to={createPageUrl("Wallet")} className="p-2 rounded-full border" style={{ borderColor: "var(--border-light)", color: "var(--accent-secondary)" }}>
              <Wallet className="w-4 h-4" />
            </Link>
            <button onClick={() => base44.auth.logout()} className="p-2 rounded-full border hover:text-red-500" style={{ borderColor: "var(--border-light)", color: "var(--text-secondary)" }}>
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Name & bio */}
        <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{user.display_name || user.full_name}</h2>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>{user.email}</p>
        {user.bio && <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{user.bio}</p>}

        {/* Coin balance */}
        <Link to={createPageUrl("Wallet")} className="inline-block mt-3">
          <WalletWidget balance={coinBalance} />
        </Link>

        {/* Stats row */}
        <div className="flex gap-5 mt-4">
          <div className="text-center">
            <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{myPosts.length}</p>
            <p className="text-xs" style={{ color: "var(--text-hint)" }}>Posts</p>
          </div>
          <button onClick={() => setShowFollowers(true)} className="text-center">
            <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{followers.length}</p>
            <p className="text-xs" style={{ color: "var(--text-hint)" }}>Followers</p>
          </button>
          <button onClick={() => setShowFollowing(true)} className="text-center">
            <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{following.length}</p>
            <p className="text-xs" style={{ color: "var(--text-hint)" }}>Following</p>
          </button>
          <div className="text-center">
            <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{totalGames}</p>
            <p className="text-xs" style={{ color: "var(--text-hint)" }}>Games</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-5 mt-4">
        <TabsList className="rounded-xl w-full" style={{ backgroundColor: "var(--bg-card)" }}>
          <TabsTrigger value="posts" className="flex-1 rounded-lg data-[state=active]:bg-white gap-1 text-xs">
            <BookOpen className="w-3.5 h-3.5" /> Posts
          </TabsTrigger>
          <TabsTrigger value="art" className="flex-1 rounded-lg data-[state=active]:bg-white gap-1 text-xs">
            <Palette className="w-3.5 h-3.5" /> Art
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex-1 rounded-lg data-[state=active]:bg-white gap-1 text-xs">
            <Star className="w-3.5 h-3.5" /> Reviews
          </TabsTrigger>
          <TabsTrigger value="games" className="flex-1 rounded-lg data-[state=active]:bg-white gap-1 text-xs">
            <Trophy className="w-3.5 h-3.5" /> Games
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-4 space-y-2">
          {myPosts.length === 0 ? (
            <p className="text-center text-sm py-8" style={{ color: "var(--text-hint)" }}>No posts yet</p>
          ) : (
            myPosts.map((post) => (
              <div key={post.id} className="rounded-xl p-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                <span className="text-[10px] px-2 py-0.5 rounded-full capitalize" style={{ backgroundColor: "var(--bg-app)", color: "var(--text-secondary)" }}>{post.type}</span>
                <p className="text-sm mt-2" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>{post.text}</p>
                <div className="flex gap-3 mt-2 text-xs" style={{ color: "var(--text-hint)" }}>
                  <span>♥ {post.like_count || 0}</span>
                  <span>💬 {post.reply_count || 0}</span>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="art" className="mt-4">
          {myArt.length === 0 ? (
            <p className="text-center text-sm py-8" style={{ color: "var(--text-hint)" }}>No art created yet</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {myArt.map((art) => (
                <div key={art.id} className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--bg-nav)", border: "1px solid var(--border-light)" }}>
                  <img src={art.image_url} alt={art.title} className="aspect-square w-full object-cover" />
                  <div className="p-2">
                    <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{art.title}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="games" className="mt-4 space-y-2">
          {gameStats.length === 0 ? (
            <p className="text-center text-sm py-8" style={{ color: "var(--text-hint)" }}>No games played yet</p>
          ) : (
            gameStats.map((stat) => (
              <div key={stat.id} className="rounded-xl p-4 flex items-center justify-between" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                <div>
                  <p className="text-sm font-medium capitalize" style={{ color: "var(--text-primary)" }}>{stat.game_name?.replace(/-/g, " ")}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>{stat.games_played} played</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium" style={{ color: "var(--accent-primary)" }}>{stat.wins}W / {stat.losses}L</p>
                  <p className="text-xs" style={{ color: "var(--text-hint)" }}>
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
            <Button onClick={handleSaveProfile} className="w-full rounded-xl text-white" style={{ backgroundColor: "var(--accent-primary)" }}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}