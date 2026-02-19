import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LogOut, Edit2, BookOpen, Palette, Trophy, Bookmark, Zap, Gift,
  ShoppingBag, FolderOpen, Briefcase, Trash2, Sparkles, Clock,
  Settings, Copy, Check, X, Camera, MessageSquare, Wallet, Award,
  Layers
} from "lucide-react";
import InterestsSection from "../components/profile/InterestsSection";
import BadgesSection, { BADGE_DEFINITIONS } from "../components/profile/BadgesSection";
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
  const [showSettings, setShowSettings] = useState(false);
  const [bio, setBio] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [boostPost, setBoostPost] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
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
      setUsername(u?.username || "");
      setAvatarUrl(u?.avatar_url || "");
      setCoverUrl(u?.cover_url || "");
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

  const { data: myCollections = [] } = useQuery({
    queryKey: ["myCollections", user?.email],
    queryFn: () => base44.entities.UserCollection.filter({ creator_email: user.email }, "-created_date"),
    enabled: !!user?.email,
  });

  const handleSaveProfile = async () => {
    const updates = { bio, display_name: displayName, avatar_url: avatarUrl, cover_url: coverUrl };
    if (username && username !== user?.username) updates.username = username;
    await base44.auth.updateMe(updates);
    setUser(prev => ({ ...prev, ...updates }));
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

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setCoverUrl(file_url);
    setCoverUploading(false);
  };

  const copyReferralCode = () => {
    if (user?.referral_code) {
      navigator.clipboard.writeText(user.referral_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const totalGames = gameStats.reduce((s, g) => s + (g.games_played || 0), 0);
  const userBadges = user?.badges || [];
  const isMod = user?.role === "moderator" || user?.role === "admin";

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Cover Photo */}
      <div className="relative h-36 overflow-hidden" style={{ backgroundColor: "var(--accent-primary)" }}>
        {user.cover_url ? (
          <img src={user.cover_url} alt="cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{
            background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)"
          }} />
        )}
        <button onClick={() => setShowSettings(true)}
          className="absolute top-3 right-3 p-2 rounded-full"
          style={{ backgroundColor: "rgba(0,0,0,0.35)", color: "#fff", backdropFilter: "blur(6px)" }}>
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Profile Header */}
      <div className="px-5 pb-5" style={{ backgroundColor: "var(--bg-card)", borderBottom: "1px solid var(--border-light)" }}>
        {/* Avatar floats over the cover */}
        <div className="flex items-end justify-between -mt-10 mb-3">
          <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center text-3xl font-bold border-4 shrink-0"
            style={{ backgroundColor: "var(--bg-app)", color: "var(--accent-primary)", borderColor: "var(--bg-card)", fontFamily: "var(--font-serif)" }}>
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              (user.display_name || user.full_name || "U")[0]?.toUpperCase()
            )}
          </div>
          <button onClick={() => setShowEdit(true)}
            className="px-4 py-1.5 rounded-xl text-sm font-medium border"
            style={{ borderColor: "var(--border-medium)", color: "var(--accent-primary)", backgroundColor: "var(--bg-app)" }}>
            Edit Profile
          </button>
        </div>

        {/* Name + badges */}
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold leading-tight" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              {user.display_name || user.full_name}
            </h2>
            {isMod && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                style={{ backgroundColor: "rgba(74,144,217,0.15)", color: "#4A90D9" }}>
                🛡️ {user.role === "admin" ? "Admin" : "Moderator"}
              </span>
            )}
          </div>
          {user.username && <p className="text-sm mt-0.5" style={{ color: "var(--accent-primary)" }}>@{user.username}</p>}
          {user.bio && <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{user.bio}</p>}
        </div>

        {/* Badges row */}
        {userBadges.length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {userBadges.slice(0, 5).map(key => {
              const b = BADGE_DEFINITIONS[key];
              if (!b) return null;
              return (
                <span key={key} title={b.desc}
                  className="text-base w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: b.color + "22", border: `1.5px solid ${b.color}55` }}>
                  {b.emoji}
                </span>
              );
            })}
            {userBadges.length > 5 && (
              <span className="text-xs w-8 h-8 rounded-full flex items-center justify-center font-semibold"
                style={{ backgroundColor: "var(--bg-app)", color: "var(--text-hint)", border: "1.5px solid var(--border-light)" }}>
                +{userBadges.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Wallet */}
        <Link to={createPageUrl("Wallet")} className="inline-block mt-4">
          <WalletWidget balance={coinBalance} />
        </Link>

        {/* Stats */}
        <div className="flex gap-6 mt-4">
          <div className="text-center">
            <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{myPosts.length}</p>
            <p className="text-xs" style={{ color: "var(--text-hint)" }}>Posts</p>
          </div>
          <button onClick={() => setShowFollowers(true)} className="text-center">
            <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{followers.length}</p>
            <p className="text-xs" style={{ color: "var(--text-hint)" }}>Followers</p>
          </button>
          <button onClick={() => setShowFollowing(true)} className="text-center">
            <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{following.length}</p>
            <p className="text-xs" style={{ color: "var(--text-hint)" }}>Following</p>
          </button>
          <div className="text-center">
            <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{totalGames}</p>
            <p className="text-xs" style={{ color: "var(--text-hint)" }}>Games</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4 mt-4">
        <TabsList className="rounded-xl w-full p-1 grid grid-cols-6"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          {[
            { value: "posts", icon: <BookOpen className="w-3.5 h-3.5" />, label: "Posts" },
            { value: "saved", icon: <Bookmark className="w-3.5 h-3.5" />, label: "Saved" },
            { value: "art", icon: <Palette className="w-3.5 h-3.5" />, label: "Art" },
            { value: "collections", icon: <Layers className="w-3.5 h-3.5" />, label: "Lists" },
            { value: "badges", icon: <Award className="w-3.5 h-3.5" />, label: "Badges" },
            { value: "games", icon: <Trophy className="w-3.5 h-3.5" />, label: "Games" },
          ].map(t => (
            <TabsTrigger key={t.value} value={t.value}
              className="flex flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[9px]"
              style={{
                color: activeTab === t.value ? "var(--accent-primary)" : "var(--text-hint)",
                backgroundColor: activeTab === t.value ? "var(--bg-app)" : "transparent",
                fontWeight: activeTab === t.value ? "600" : "400",
              }}>
              {t.icon}
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="posts" className="mt-4 space-y-2">
          {myPosts.length === 0 ? (
            <p className="text-center text-sm py-8" style={{ color: "var(--text-hint)" }}>No posts yet</p>
          ) : (
            myPosts.map((post) => (
              <div key={post.id} className="rounded-2xl p-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full capitalize font-medium"
                    style={{ backgroundColor: "var(--accent-primary)22", color: "var(--accent-primary)" }}>
                    {post.type}
                  </span>
                  {post.author_email === user.email && (
                    <button onClick={() => setBoostPost(post)}
                      className="text-[10px] px-2.5 py-1 rounded-full border flex items-center gap-1"
                      style={{ borderColor: "#F59E0B", color: "#F59E0B" }}>
                      <Zap className="w-2.5 h-2.5" /> Boost
                    </button>
                  )}
                </div>
                <p className="text-sm leading-relaxed" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>{post.text}</p>
                <div className="flex gap-3 mt-2 text-xs" style={{ color: "var(--text-hint)" }}>
                  <span>♥ {post.like_count || 0}</span>
                  <span>💬 {post.reply_count || 0}</span>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="saved" className="mt-4 space-y-2">
          {savedItems.length === 0 ? (
            <p className="text-center text-sm py-8" style={{ color: "var(--text-hint)" }}>No saved items yet. Bookmark tools from Discover!</p>
          ) : (
            savedItems.map((s) => (
              <div key={s.id} className="rounded-2xl p-4 flex items-center gap-3" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                {s.item_logo_url ? (
                  <img src={s.item_logo_url} alt={s.item_title} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shrink-0"
                    style={{ backgroundColor: "var(--accent-primary)22", color: "var(--accent-primary)" }}>
                    {s.item_title?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{s.item_title}</p>
                  <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-hint)" }}>{s.item_description}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full capitalize mt-1 inline-block font-medium"
                    style={{ backgroundColor: "var(--accent-secondary)22", color: "var(--accent-secondary)" }}>
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
                <div key={art.id} className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                  <img src={art.image_url} alt={art.title} className="aspect-square w-full object-cover" />
                  <div className="p-2">
                    <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{art.title}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="collections" className="mt-4 space-y-3">
          {myCollections.length === 0 ? (
            <div className="text-center py-8">
              <Layers className="w-8 h-8 mx-auto mb-2 opacity-30" style={{ color: "var(--accent-primary)" }} />
              <p className="text-sm" style={{ color: "var(--text-hint)" }}>No collections yet</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>Create curated lists in the Collections page</p>
              <Link to={createPageUrl("Collections")} className="inline-block mt-3">
                <Button size="sm" variant="outline">Go to Collections</Button>
              </Link>
            </div>
          ) : (
            myCollections.map((col) => (
              <div key={col.id} className="rounded-2xl p-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{col.title || col.name}</p>
                {col.description && <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>{col.description}</p>}
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="badges" className="mt-4">
          <BadgesSection badges={userBadges} />
        </TabsContent>

        <TabsContent value="games" className="mt-4 space-y-2">
          {gameStats.length === 0 ? (
            <p className="text-center text-sm py-8" style={{ color: "var(--text-hint)" }}>No games played yet</p>
          ) : (
            gameStats.map((stat) => (
              <div key={stat.id} className="rounded-2xl p-4 flex items-center justify-between" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                <div>
                  <p className="text-sm font-medium capitalize" style={{ color: "var(--text-primary)" }}>{stat.game_name?.replace(/-/g, " ")}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>{stat.games_played} played</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold" style={{ color: "var(--accent-primary)" }}>{stat.wins}W / {stat.losses}L</p>
                  <p className="text-xs" style={{ color: "var(--text-hint)" }}>
                    {stat.games_played > 0 ? Math.round((stat.wins / stat.games_played) * 100) : 0}% win rate
                  </p>
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Settings sheet */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-sm rounded-2xl" style={{ backgroundColor: "var(--bg-card)" }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            {user.referral_code && (
              <div className="p-3 rounded-xl flex items-center justify-between" style={{ backgroundColor: "var(--bg-app)", border: "1px solid var(--border-light)" }}>
                <div>
                  <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Your Referral Code</p>
                  <p className="text-base font-mono font-semibold mt-0.5" style={{ color: "var(--accent-primary)" }}>{user.referral_code}</p>
                </div>
                <button onClick={copyReferralCode} className="p-2 rounded-lg" style={{ backgroundColor: "var(--bg-card)" }}>
                  {copiedCode ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" style={{ color: "var(--text-hint)" }} />}
                </button>
              </div>
            )}
            {[
              { icon: <MessageSquare className="w-4 h-4" />, label: "Messages", page: "Messages" },
              { icon: <Wallet className="w-4 h-4" />, label: "Wallet", page: "Wallet" },
              { icon: <Gift className="w-4 h-4" />, label: "Referrals", page: "Referral" },
              { icon: <ShoppingBag className="w-4 h-4" />, label: "Shop", page: "Shop" },
              { icon: <FolderOpen className="w-4 h-4" />, label: "Collections", page: "Collections" },
              { icon: <Briefcase className="w-4 h-4" />, label: "Service Profile", page: "EditServiceProfile" },
            ].map(({ icon, label, page }) => (
              <Link key={page} to={createPageUrl(page)} onClick={() => setShowSettings(false)}
                className="flex items-center gap-3 p-3 rounded-xl text-sm w-full"
                style={{ color: "var(--text-secondary)" }}>
                <span style={{ color: "var(--accent-primary)" }}>{icon}</span> {label}
              </Link>
            ))}
            <div className="pt-2 border-t" style={{ borderColor: "var(--border-light)" }}>
              <button onClick={() => base44.auth.logout()}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left text-sm"
                style={{ color: "var(--text-secondary)" }}>
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
              <button onClick={() => { setShowSettings(false); setShowDeleteConfirm(true); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left text-sm text-red-500">
                <Trash2 className="w-4 h-4" /> Delete Account
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Profile */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-sm rounded-2xl" style={{ backgroundColor: "var(--bg-card)" }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* Cover photo */}
            <div>
              <p className="text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Cover Photo</p>
              <label className="cursor-pointer block relative rounded-xl overflow-hidden h-20"
                style={{ backgroundColor: "var(--bg-app)", border: "1px dashed var(--border-medium)" }}>
                {coverUrl ? (
                  <img src={coverUrl} alt="cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-1" style={{ color: "var(--text-hint)" }}>
                    <Camera className="w-5 h-5" />
                    <span className="text-xs">{coverUploading ? "Uploading..." : "Add cover photo"}</span>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
              </label>
            </div>
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center text-2xl font-semibold shrink-0"
                style={{ backgroundColor: "var(--accent-primary)22", color: "var(--accent-primary)" }}>
                {avatarUrl ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" /> : (displayName || user?.full_name || "U")[0]?.toUpperCase()}
              </div>
              <label className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium"
                style={{ borderColor: "var(--border-light)", color: "var(--text-secondary)" }}>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                {avatarUploading ? "Uploading..." : "Change Photo"}
              </label>
            </div>
            <Input placeholder="Display name" value={displayName} onChange={e => setDisplayName(e.target.value)} className="rounded-xl" style={{ borderColor: "var(--border-light)" }} />
            <Input placeholder="Username (e.g. moonwalker483)" value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))} className="rounded-xl" style={{ borderColor: "var(--border-light)" }} />
            <Textarea placeholder="Bio" value={bio} onChange={e => setBio(e.target.value)} className="rounded-xl resize-none" style={{ borderColor: "var(--border-light)" }} rows={3} />
            <Button onClick={handleSaveProfile} className="w-full rounded-xl">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Followers */}
      <Dialog open={showFollowers} onOpenChange={setShowFollowers}>
        <DialogContent className="max-w-sm rounded-2xl max-h-[70vh]" style={{ backgroundColor: "var(--bg-card)" }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Followers ({followers.length})</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 overflow-y-auto max-h-[50vh]">
            {followers.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: "var(--text-hint)" }}>No followers yet</p>
            ) : followers.map((f) => (
              <div key={f.id} className="flex items-center gap-3 py-2">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold"
                  style={{ backgroundColor: "var(--accent-primary)22", color: "var(--accent-primary)" }}>
                  {f.follower_name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{f.follower_name}</p>
                  <p className="text-xs" style={{ color: "var(--text-hint)" }}>{f.follower_email}</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Following */}
      <Dialog open={showFollowing} onOpenChange={setShowFollowing}>
        <DialogContent className="max-w-sm rounded-2xl max-h-[70vh]" style={{ backgroundColor: "var(--bg-card)" }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Following ({following.length})</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 overflow-y-auto max-h-[50vh]">
            {following.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: "var(--text-hint)" }}>Not following anyone yet</p>
            ) : following.map((f) => (
              <div key={f.id} className="flex items-center gap-3 py-2">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold"
                  style={{ backgroundColor: "var(--accent-secondary)22", color: "var(--accent-secondary)" }}>
                  {f.following_name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{f.following_name}</p>
                  <p className="text-xs" style={{ color: "var(--text-hint)" }}>{f.following_email}</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-sm rounded-2xl" style={{ backgroundColor: "var(--bg-card)" }}>
          <DialogHeader>
            <DialogTitle className="text-red-600" style={{ fontFamily: "var(--font-serif)" }}>Delete Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              This is <strong>permanent</strong>. All your data will be deleted. Type <strong>DELETE</strong> to confirm.
            </p>
            <Input placeholder="Type DELETE to confirm" value={deleteInput} onChange={e => setDeleteInput(e.target.value)} className="border-red-200 rounded-xl" />
            <Button onClick={async () => { if (deleteInput !== "DELETE") return; await base44.auth.updateMe({ account_deleted: true }); base44.auth.logout(); }}
              disabled={deleteInput !== "DELETE"} className="w-full rounded-xl bg-red-500 hover:bg-red-600 text-white">
              Permanently Delete Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {boostPost && (
        <BoostPostModal post={boostPost} user={user} balance={coinBalance} onClose={() => setBoostPost(null)}
          onBoosted={() => { queryClient.invalidateQueries({ queryKey: ["myPosts", user?.email] }); queryClient.invalidateQueries({ queryKey: ["coinBalance", user?.email] }); }} />
      )}
    </div>
  );
}