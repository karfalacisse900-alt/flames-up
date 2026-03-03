import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, Edit2, MessageSquare, Wallet, Gift, FolderOpen, Briefcase, Trash2, Sparkles, Clock, MoreHorizontal, Medal, Plus, X, Download, HelpCircle, Film, Heart, ShieldCheck } from "lucide-react";
import SavedMediaLists from "../components/profile/SavedMediaLists";
import SavedItems from "../components/profile/SavedItems";
import ExportDataModal from "../components/profile/ExportDataModal";
import BadgesSection, { BADGE_DEFINITIONS } from "../components/profile/BadgesSection";
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
  const [aboutMe, setAboutMe] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [profileTheme, setProfileTheme] = useState("default");
  const [activeTab, setActiveTab] = useState("posts");
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [boostPost, setBoostPost] = useState(null);
  const [showExport, setShowExport] = useState(false);
  const [showMore, setShowMore] = useState(false);
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
      setAboutMe(u?.about_me || "");
      setDisplayName(u?.display_name || u?.full_name || "");
      setUsername(u?.username || "");
      setAvatarUrl(u?.avatar_url || "");
      setProfileTheme(u?.profile_theme || "default");
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

  const { data: likedPosts = [] } = useQuery({
    queryKey: ["likedPosts", user?.email],
    queryFn: () => base44.entities.Post.list("-created_date", 200).then(posts => posts.filter(p => p.liked_by?.includes(user.email))),
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

  const THEMES = {
    default: { label: "Default", bg: "var(--bg-card)", accent: "var(--accent-primary)", banner: "linear-gradient(135deg, var(--accent-primary-light), var(--bg-subtle))" },
    forest: { label: "Forest", bg: "#1a2e1e", accent: "#4ade80", banner: "linear-gradient(135deg, #1a3a20, #2d5a35)" },
    ocean: { label: "Ocean", bg: "#0f1e2e", accent: "#38bdf8", banner: "linear-gradient(135deg, #0f2a3f, #1e4060)" },
    sunset: { label: "Sunset", bg: "#2e1a0e", accent: "#fb923c", banner: "linear-gradient(135deg, #3d1f0a, #5a2e10)" },
    lavender: { label: "Lavender", bg: "#1e1a2e", accent: "#c084fc", banner: "linear-gradient(135deg, #2a1f3d, #3d2b5a)" },
  };

  const activeTheme = THEMES[user?.profile_theme || "default"] || THEMES.default;

  const handleSaveProfile = async () => {
    const usernameToSave = username ? `@${username.replace(/^@/, "")}` : "";
    // Validate username uniqueness if changed
    if (usernameToSave && usernameToSave !== user?.username) {
      const users = await base44.entities.User.list();
      const taken = users.some(u => u.username === usernameToSave && u.email !== user.email);
      if (taken) {
        alert("That username is already taken. Please choose another.");
        return;
      }
    }
    await base44.auth.updateMe({ bio, about_me: aboutMe, display_name: displayName, username: usernameToSave, avatar_url: avatarUrl, profile_theme: profileTheme });
    setUser((prev) => ({ ...prev, bio, about_me: aboutMe, display_name: displayName, username: usernameToSave, avatar_url: avatarUrl, profile_theme: profileTheme }));
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

  // Compute earned badges automatically
  const computedBadges = (() => {
    const b = new Set(user?.badges || []);
    if (myPosts.length >= 1) b.add("first_post");
    if (myPosts.some(p => (p.like_count || 0) >= 10)) b.add("popular_post");
    if (myArt.length >= 1) b.add("art_creator");
    return Array.from(b);
  })();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="overflow-y-auto overscroll-contain" style={{ backgroundColor: "var(--bg-app)", minHeight: "calc(100dvh - 64px)", paddingBottom: "env(safe-area-inset-bottom, 24px)" }}>
      {/* Profile header */}
      <div style={{ backgroundColor: activeTheme.bg, borderBottom: "1px solid var(--border-light)" }}>
        <div className="px-5 pb-5 pt-4">
          <div className="flex items-start justify-between mb-3">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center text-3xl font-semibold shrink-0 border-4" style={{ backgroundColor: "var(--bg-app)", color: "var(--accent-primary)", fontFamily: "var(--font-serif)", borderColor: "var(--bg-card)" }}>
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                (user.display_name || user.full_name || "U")[0]?.toUpperCase()
              )}
            </div>
            {/* Action buttons */}
            <div className="flex gap-2 items-center">
            {user?.role === "admin" && (
              <Link to={createPageUrl("AdminContentManager")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all" style={{ borderColor: "var(--accent-primary)", color: "var(--accent-primary)", backgroundColor: "var(--accent-primary-light)" }}>
                <ShieldCheck className="w-3.5 h-3.5" /> Admin
              </Link>
            )}
            <button onClick={() => setShowEdit(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all" style={{ borderColor: "var(--accent-primary)", color: "var(--accent-primary)", backgroundColor: "transparent" }}>
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </button>
              <Link to={createPageUrl("Messages")} className="p-2 rounded-full border transition-all" style={{ borderColor: "var(--border-light)", color: "var(--text-secondary)" }}>
                <MessageSquare className="w-4 h-4" />
              </Link>
              <Link to={createPageUrl("Wallet")} className="p-2 rounded-full border transition-all" style={{ borderColor: "var(--border-light)", color: "var(--accent-secondary)" }}>
                <Wallet className="w-4 h-4" />
              </Link>
              <div className="relative">
                <button
                  onClick={() => setShowMore(v => !v)}
                  className="p-2 rounded-full border transition-all"
                  style={{ borderColor: "var(--border-light)", color: "var(--text-secondary)" }}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {showMore && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)} />
                    <div className="absolute right-0 top-10 z-50 w-52 rounded-2xl shadow-xl overflow-hidden"
                      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                      {[
                        { to: createPageUrl("Referral"), icon: <Gift className="w-4 h-4" />, label: "Referrals", color: "#D98B62" },
                        { to: createPageUrl("Collections"), icon: <FolderOpen className="w-4 h-4" />, label: "Collections", color: "var(--accent-primary)" },
                        { to: createPageUrl("EditServiceProfile"), icon: <Briefcase className="w-4 h-4" />, label: "Service Profile", color: "var(--accent-primary)" },
                        { to: createPageUrl("HelpCenter"), icon: <HelpCircle className="w-4 h-4" />, label: "Help & Guide", color: "#3C6E5A" },
                      ].map(({ to, icon, label, color }) => (
                        <Link key={label} to={to} onClick={() => setShowMore(false)} className="flex items-center gap-3 px-4 py-3 text-sm"
                          style={{ color: "var(--text-primary)", borderBottom: "1px solid var(--border-light)" }}>
                          <span style={{ color }}>{icon}</span>
                          {label}
                        </Link>
                      ))}
                      <button onClick={() => { setShowMore(false); setShowExport(true); }} className="flex w-full items-center gap-3 px-4 py-3 text-sm" style={{ color: "var(--text-secondary)", borderBottom: "1px solid var(--border-light)" }}>
                        <Download className="w-4 h-4" /> Export Data
                      </button>
                      <button onClick={() => base44.auth.logout()} className="flex w-full items-center gap-3 px-4 py-3 text-sm" style={{ color: "var(--text-secondary)", borderBottom: "1px solid var(--border-light)" }}>
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                      <button onClick={() => { setShowMore(false); setShowDeleteConfirm(true); }} className="flex w-full items-center gap-3 px-4 py-3 text-sm" style={{ color: "#E53E3E" }}>
                        <Trash2 className="w-4 h-4" /> Delete Account
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Name & bio */}
          <h2 className="text-lg font-semibold mt-1" style={{ color: "var(--text-primary)" }}>{user.display_name || user.full_name}</h2>
          {user.username && <p className="text-xs font-medium" style={{ color: "var(--accent-primary)" }}>{user.username}</p>}
          {user.about_me && (
            <div className="mt-3 p-3 rounded-xl text-sm leading-relaxed" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)", fontFamily: "var(--font-serif)" }}>
              {user.about_me}
            </div>
          )}
          {user.bio && <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{user.bio}</p>}
          {/* Hide email from profile view */}

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
            <button onClick={() => setShowFollowers(true)} className="text-center" style={{ boxShadow: "none" }}>
              <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{followers.length}</p>
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>Followers</p>
            </button>
            <button onClick={() => setShowFollowing(true)} className="text-center" style={{ boxShadow: "none" }}>
              <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{following.length}</p>
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>Following</p>
            </button>
            <div className="text-center">
              <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{computedBadges.length}</p>
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>Badges</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-5 mt-4">
        <TabsList className="rounded-xl w-full flex-wrap h-auto gap-1 p-1" style={{ backgroundColor: "var(--bg-card)" }}>
          <TabsTrigger value="posts" className="flex-1 rounded-lg data-[state=active]:bg-[var(--bg-app)] gap-1 text-xs">
            <MessageSquare className="w-3.5 h-3.5" /> Posts
          </TabsTrigger>
          <TabsTrigger value="liked" className="flex-1 rounded-lg data-[state=active]:bg-[var(--bg-app)] gap-1 text-xs">
            <Heart className="w-3.5 h-3.5" /> Liked
          </TabsTrigger>
          <TabsTrigger value="badges" className="flex-1 rounded-lg data-[state=active]:bg-[var(--bg-app)] gap-1 text-xs">
            <Medal className="w-3.5 h-3.5" /> Badges
          </TabsTrigger>
          <TabsTrigger value="media_lists" className="flex-1 rounded-lg data-[state=active]:bg-[var(--bg-app)] gap-1 text-xs">
            <Film className="w-3.5 h-3.5" /> Lists
          </TabsTrigger>
          <TabsTrigger value="saved_items" className="flex-1 rounded-lg data-[state=active]:bg-[var(--bg-app)] gap-1 text-xs">
            <FolderOpen className="w-3.5 h-3.5" /> Saved
          </TabsTrigger>
          <TabsTrigger value="interests" className="flex-1 rounded-lg data-[state=active]:bg-[var(--bg-app)] gap-1 text-xs">
            <Sparkles className="w-3.5 h-3.5" /> Interests
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex-1 rounded-lg data-[state=active]:bg-[var(--bg-app)] gap-1 text-xs">
            <Clock className="w-3.5 h-3.5" /> Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-4 space-y-3">
          {myPosts.length === 0 ? (
            <p className="text-center text-sm py-8" style={{ color: "var(--text-hint)" }}>No posts yet</p>
          ) : (
            myPosts.map(post => (
              <div key={post.id} className="rounded-2xl p-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] px-2 py-0.5 rounded-full capitalize font-medium mr-2"
                      style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>{post.type}</span>
                    <p className="text-sm mt-2 leading-relaxed line-clamp-3" style={{ color: "var(--text-primary)", fontFamily: post.font_family === "serif" ? "var(--font-serif)" : "var(--font-sans)" }}>{post.text}</p>
                    <p className="text-xs mt-1.5 flex items-center gap-2" style={{ color: "var(--text-hint)" }}>
                      <span>❤️ {post.like_count || 0}</span>
                      <span>💬 {post.reply_count || 0}</span>
                      <span>{new Date(post.created_date).toLocaleDateString()}</span>
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      if (!window.confirm("Delete this post?")) return;
                      await base44.entities.Post.delete(post.id);
                      queryClient.invalidateQueries({ queryKey: ["myPosts", user.email] });
                    }}
                    className="p-1.5 rounded-full shrink-0" style={{ color: "var(--text-hint)" }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="liked" className="mt-4 space-y-3">
          {likedPosts.length === 0 ? (
            <p className="text-center text-sm py-8" style={{ color: "var(--text-hint)" }}>No liked posts yet</p>
          ) : (
            likedPosts.map(post => (
              <Link key={post.id} to={createPageUrl(`PostDetail?id=${post.id}`)}>
                <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                  <span className="text-[10px] px-2 py-0.5 rounded-full capitalize font-medium mr-2"
                    style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>{post.type}</span>
                  <p className="text-sm mt-2 leading-relaxed line-clamp-3" style={{ color: "var(--text-primary)", fontFamily: post.font_family === "serif" ? "var(--font-serif)" : "var(--font-sans)" }}>{post.text}</p>
                  <p className="text-xs mt-1.5 flex items-center gap-2" style={{ color: "var(--text-hint)" }}>
                    <span>by {post.is_anonymous ? "Anonymous" : post.author_name}</span>
                    <span>❤️ {post.like_count || 0}</span>
                  </p>
                </div>
              </Link>
            ))
          )}
        </TabsContent>

        <TabsContent value="badges" className="mt-4">
          <p className="text-xs mb-3 px-1" style={{ color: "var(--text-hint)" }}>Earned by being active in the community</p>
          <BadgesSection badges={computedBadges} />
          {computedBadges.length < Object.keys(BADGE_DEFINITIONS).length && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold px-1" style={{ color: "var(--text-hint)" }}>Locked badges</p>
              {Object.entries(BADGE_DEFINITIONS).filter(([k]) => !computedBadges.includes(k)).map(([key, badge]) => (
                <div key={key} className="flex items-center gap-3 p-3 rounded-xl opacity-40" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                  <span className="text-xl grayscale">{badge.emoji}</span>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{badge.label}</p>
                    <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>{badge.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="media_lists" className="mt-4">
          <p className="text-xs mb-3 px-1" style={{ color: "var(--text-hint)" }}>Your saved movies, books, music & games</p>
          <SavedMediaLists user={user} />
        </TabsContent>

        <TabsContent value="saved_items" className="mt-4">
          <p className="text-xs mb-3 px-1" style={{ color: "var(--text-hint)" }}>Your saved apps, products & services</p>
          <SavedItems user={user} />
        </TabsContent>

        <TabsContent value="interests" className="mt-4">
          <InterestsSection user={user} onUpdated={setUser} />
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <ActivityHistory user={user} />
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
              <p className="text-sm text-center py-4" style={{ color: "var(--text-hint)" }}>No followers yet</p>
            ) : followers.map((f) => (
              <div key={f.id} className="flex items-center gap-3 justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--accent-primary)" }}>
                    {f.follower_name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{f.follower_name}</p>
                </div>
                <button onClick={async () => {
                  const alreadyFollowing = following.some(x => x.following_email === f.follower_email);
                  if (alreadyFollowing) {
                    await base44.entities.Follow.filter({ follower_email: user.email, following_email: f.follower_email }).then(recs => recs[0]?.id && base44.entities.Follow.delete(recs[0].id));
                  }
                }} className="text-xs px-2.5 py-1 rounded-full border" style={{ color: following.some(x => x.following_email === f.follower_email) ? "var(--text-secondary)" : "var(--accent-primary)", borderColor: "var(--border-light)" }}>
                  {following.some(x => x.following_email === f.follower_email) ? "Following" : "Follow"}
                </button>
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
              <p className="text-sm text-center py-4" style={{ color: "var(--text-hint)" }}>Not following anyone yet</p>
            ) : following.map((f) => (
              <div key={f.id} className="flex items-center gap-3 justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--accent-primary)" }}>
                    {f.following_name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{f.following_name}</p>
                </div>
                <button onClick={async () => {
                  await base44.entities.Follow.filter({ follower_email: user.email, following_email: f.following_email }).then(recs => recs[0]?.id && base44.entities.Follow.delete(recs[0].id));
                }} className="text-xs px-2.5 py-1 rounded-full border" style={{ color: "var(--text-secondary)", borderColor: "var(--border-light)" }}>
                  Unfollow
                </button>
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

      {/* Export data modal */}
      <ExportDataModal open={showExport} onClose={() => setShowExport(false)} user={user} />

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
            <Input placeholder="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="rounded-xl" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)" }} />
            <div>
              <Input
                placeholder="Username (e.g. @cooluser)"
                value={username.startsWith("@") ? username.slice(1) : username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                className="rounded-xl"
                style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)" }}
              />
              <p className="text-[11px] mt-1 px-1" style={{ color: "var(--text-hint)" }}>Unique username — letters, numbers & underscores only</p>
            </div>
            <Textarea placeholder="Short bio (one-liner)" value={bio} onChange={(e) => setBio(e.target.value)} className="rounded-xl resize-none" rows={2} style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)" }} />
            <Textarea placeholder="About Me — tell your story, share your passions…" value={aboutMe} onChange={(e) => setAboutMe(e.target.value)} className="rounded-xl resize-none" rows={4} style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)" }} />
            {/* Theme picker */}
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Profile Theme</p>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(THEMES).map(([key, theme]) => (
                  <button
                    key={key}
                    onClick={() => setProfileTheme(key)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all"
                    style={{
                      background: theme.banner,
                      color: theme.accent,
                      borderColor: profileTheme === key ? theme.accent : "transparent",
                    }}
                  >
                    {theme.label}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={handleSaveProfile} className="w-full rounded-xl text-white" style={{ backgroundColor: "var(--accent-primary)" }}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}