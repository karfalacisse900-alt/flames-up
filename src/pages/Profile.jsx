import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, Edit2, BookOpen, Palette, Trophy, MessageSquare, Wallet, Star, Compass, Bookmark, Zap, Gift, ShoppingBag, FolderOpen, Briefcase, Trash2, Sparkles, Clock, ChevronRight, MoreHorizontal } from "lucide-react";
import InterestsSection from "../components/profile/InterestsSection";
import ActivityHistory from "../components/profile/ActivityHistory";
import BoostPostModal from "../components/home/BoostPostModal";
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
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [boostPost, setBoostPost] = useState(null);
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
      setAvatarUrl(u?.avatar_url || "");
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

  const { data: savedItems = [] } = useQuery({
    queryKey: ["savedItems", user?.email],
    queryFn: () => base44.entities.SavedItem.filter({ user_email: user.email }, "-created_date", 100),
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
    await base44.auth.updateMe({ bio, display_name: displayName, avatar_url: avatarUrl });
    setUser((prev) => ({ ...prev, bio, display_name: displayName, avatar_url: avatarUrl }));
    setShowEdit(false);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setAvatarUrl(file_url);
    setAvatarUploading(false);
  };

  const totalGames = gameStats.reduce((s, g) => s + (g.games_played || 0), 0);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Profile header */}
      <div className="px-5 pt-6 pb-5" style={{ backgroundColor: "var(--bg-card)", borderBottom: "1px solid var(--border-light)" }}>
        <div className="flex items-start justify-between mb-4">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center text-3xl font-semibold shrink-0" style={{ backgroundColor: "var(--bg-app)", color: "var(--accent-primary)", fontFamily: "var(--font-serif)" }}>
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              (user.display_name || user.full_name || "U")[0]?.toUpperCase()
            )}
          </div>
          {/* Action buttons — compact */}
          <div className="flex gap-2 items-center">
            <button onClick={() => setShowEdit(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all" style={{ borderColor: "var(--accent-primary)", color: "var(--accent-primary)", backgroundColor: "transparent" }}>
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </button>
            <Link to={createPageUrl("Messages")} className="p-2 rounded-full border transition-all" style={{ borderColor: "var(--border-light)", color: "var(--text-secondary)" }}>
              <MessageSquare className="w-4 h-4" />
            </Link>
            <Link to={createPageUrl("Wallet")} className="p-2 rounded-full border transition-all" style={{ borderColor: "var(--border-light)", color: "var(--accent-secondary)" }}>
              <Wallet className="w-4 h-4" />
            </Link>
            {/* More dropdown */}
            <div className="relative group">
              <button className="p-2 rounded-full border transition-all" style={{ borderColor: "var(--border-light)", color: "var(--text-secondary)" }}>
                <MoreHorizontal className="w-4 h-4" />
              </button>
              <div className="absolute right-0 top-10 z-50 w-48 rounded-2xl shadow-lg overflow-hidden opacity-0 pointer-events-none group-focus-within:opacity-100 group-focus-within:pointer-events-auto"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                {[
                  { to: createPageUrl("Referral"), icon: <Gift className="w-4 h-4" />, label: "Referrals", color: "#D98B62" },
                  { to: createPageUrl("Shop"), icon: <ShoppingBag className="w-4 h-4" />, label: "Shop", color: "var(--accent-secondary)" },
                  { to: createPageUrl("Collections"), icon: <FolderOpen className="w-4 h-4" />, label: "Collections", color: "var(--accent-primary)" },
                  { to: createPageUrl("EditServiceProfile"), icon: <Briefcase className="w-4 h-4" />, label: "Service Profile", color: "var(--accent-primary)" },
                ].map(({ to, icon, label, color }) => (
                  <Link key={label} to={to} className="flex items-center gap-3 px-4 py-3 text-sm transition-all hover:brightness-95"
                    style={{ color: "var(--text-primary)", borderBottom: "1px solid var(--border-light)" }}>
                    <span style={{ color }}>{icon}</span>
                    {label}
                  </Link>
                ))}
                <button onClick={() => base44.auth.logout()} className="flex w-full items-center gap-3 px-4 py-3 text-sm transition-all hover:brightness-95" style={{ color: "var(--text-secondary)" }}>
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
                <button onClick={() => setShowDeleteConfirm(true)} className="flex w-full items-center gap-3 px-4 py-3 text-sm transition-all hover:brightness-95" style={{ color: "#E53E3E" }}>
                  <Trash2 className="w-4 h-4" /> Delete Account
                </button>
              </div>
            </div>
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
        <TabsList className="rounded-xl w-full flex-wrap h-auto gap-1 p-1" style={{ backgroundColor: "var(--bg-card)" }}>
          <TabsTrigger value="posts" className="flex-1 rounded-lg data-[state=active]:text-[--accent-primary] gap-1 text-xs" style={{ "--accent-primary": "var(--accent-primary)" }}>
            <BookOpen className="w-3.5 h-3.5" /> Posts
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex-1 rounded-lg gap-1 text-xs">
            <Bookmark className="w-3.5 h-3.5" /> Saved
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex-1 rounded-lg gap-1 text-xs">
            <Star className="w-3.5 h-3.5" /> Reviews
          </TabsTrigger>
          <TabsTrigger value="art" className="flex-1 rounded-lg gap-1 text-xs">
            <Palette className="w-3.5 h-3.5" /> Art
          </TabsTrigger>
          <TabsTrigger value="games" className="flex-1 rounded-lg gap-1 text-xs">
            <Trophy className="w-3.5 h-3.5" /> Games
          </TabsTrigger>
          <TabsTrigger value="interests" className="flex-1 rounded-lg gap-1 text-xs">
            <Sparkles className="w-3.5 h-3.5" /> Interests
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex-1 rounded-lg gap-1 text-xs">
            <Clock className="w-3.5 h-3.5" /> Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-4 space-y-2">
          {myPosts.length === 0 ? (
            <p className="text-center text-sm py-8" style={{ color: "var(--text-hint)" }}>No posts yet</p>
          ) : (
            myPosts.map((post) => (
              <div key={post.id} className="rounded-xl p-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full capitalize" style={{ backgroundColor: "var(--bg-app)", color: "var(--text-secondary)" }}>{post.type}</span>
                    {post.is_boosted && new Date(post.boost_expires_at) > new Date() && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5" /> Boosted
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setBoostPost(post)}
                    className="text-[10px] px-2.5 py-1 rounded-full border flex items-center gap-1 transition-all hover:bg-amber-50"
                    style={{ borderColor: "#F59E0B", color: "#F59E0B" }}
                  >
                    <Zap className="w-2.5 h-2.5" /> Boost
                  </button>
                </div>
                <p className="text-sm" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>{post.text}</p>
                <div className="flex gap-3 mt-2 text-xs" style={{ color: "var(--text-hint)" }}>
                  <span>♥ {post.like_count || 0}</span>
                  <span>💬 {post.reply_count || 0}</span>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="reviews" className="mt-4 space-y-2">
          {myReviews.length === 0 ? (
            <p className="text-center text-sm py-8" style={{ color: "var(--text-hint)" }}>No reviews yet</p>
          ) : (
            myReviews.map((review) => (
              <div key={review.id} className="rounded-xl p-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5" style={{ color: "var(--accent-primary)" }} />
                    <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{review.item_id}</span>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className="text-xs" style={{ color: i < review.rating ? "#F59E0B" : "#D1D5DB" }}>★</span>
                    ))}
                  </div>
                </div>
                {review.review_text && (
                  <p className="text-sm leading-relaxed mt-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{review.review_text}</p>
                )}
                <p className="text-[10px] mt-2" style={{ color: "var(--text-hint)" }}>{new Date(review.created_date).toLocaleDateString()}</p>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="saved" className="mt-4 space-y-2">
          {savedItems.length === 0 ? (
            <p className="text-center text-sm py-8" style={{ color: "var(--text-hint)" }}>No saved items yet. Bookmark tools from the Discover page!</p>
          ) : (
            savedItems.map((s) => (
              <div key={s.id} className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                {s.item_logo_url ? (
                  <img src={s.item_logo_url} alt={s.item_title} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shrink-0" style={{ backgroundColor: "var(--bg-app)", color: "var(--accent-primary)" }}>
                    {s.item_title?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{s.item_title}</p>
                  <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-hint)" }}>{s.item_description}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full capitalize mt-1 inline-block" style={{ backgroundColor: "var(--bg-app)", color: "var(--text-secondary)" }}>
                    {s.item_category?.replace(/_/g, " ")}
                  </span>
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

        <TabsContent value="interests" className="mt-4">
          <InterestsSection user={user} onUpdated={setUser} />
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <ActivityHistory user={user} />
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

      {/* Account deletion dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-red-600" style={{ fontFamily: "var(--font-serif)" }}>Delete Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              This action is <strong>permanent</strong>. All your posts, art, and data will be deleted. Type <strong>DELETE</strong> to confirm.
            </p>
            <Input
              placeholder="Type DELETE to confirm"
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              className="border-red-200 rounded-xl"
            />
            <Button
              onClick={async () => {
                if (deleteInput !== "DELETE") return;
                await base44.auth.updateMe({ account_deleted: true, email: `deleted_${Date.now()}@deleted.com` });
                base44.auth.logout();
              }}
              disabled={deleteInput !== "DELETE"}
              className="w-full rounded-xl bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
            >
              Permanently Delete Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Boost post modal */}
      {boostPost && (
        <BoostPostModal
          post={boostPost}
          user={user}
          balance={coinBalance}
          onClose={() => setBoostPost(null)}
          onBoosted={() => {
            queryClient.invalidateQueries({ queryKey: ["myPosts", user?.email] });
            queryClient.invalidateQueries({ queryKey: ["coinBalance", user?.email] });
          }}
        />
      )}

      {/* Edit profile */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-serif)" }}>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Avatar upload */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center text-2xl font-semibold shrink-0" style={{ backgroundColor: "var(--bg-app)", color: "var(--accent-primary)" }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  (displayName || user?.full_name || "U")[0]?.toUpperCase()
                )}
              </div>
              <div>
                <label className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium" style={{ borderColor: "var(--border-light)", color: "var(--text-secondary)" }}>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  {avatarUploading ? "Uploading..." : "Change Photo"}
                </label>
                {avatarUrl && (
                  <button onClick={() => setAvatarUrl("")} className="mt-1 text-[11px]" style={{ color: "var(--accent-secondary)" }}>Remove</button>
                )}
              </div>
            </div>
            <Input placeholder="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="border-[#EDE9E3] rounded-xl" />
            <Textarea placeholder="Bio" value={bio} onChange={(e) => setBio(e.target.value)} className="border-[#EDE9E3] rounded-xl resize-none" rows={3} />
            <Button onClick={handleSaveProfile} className="w-full rounded-xl text-white" style={{ backgroundColor: "var(--accent-primary)" }}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}