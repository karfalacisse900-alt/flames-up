import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, Edit2, MessageSquare, Wallet, Gift, FolderOpen, Briefcase, Trash2, Sparkles, Clock, MoreHorizontal, Medal, Plus, X, Download, HelpCircle, Film, Heart, ShieldCheck, BarChart2, Bookmark, Library, Settings, Briefcase as BriefcaseIcon, Zap, Shield, Cog, Newspaper } from "lucide-react";
import LocalPublisherApplyModal from "../components/community/LocalPublisherApplyModal";
import SavedItems from "../components/profile/SavedItems";
import ExportDataModal from "../components/profile/ExportDataModal";
import BadgesSection, { BADGE_DEFINITIONS } from "../components/profile/BadgesSection";
import InterestsSection from "../components/profile/InterestsSection";
import ActivityHistory from "../components/profile/ActivityHistory";
import BoostPostModal from "../components/home/BoostPostModal";
import WalletWidget from "../components/coins/WalletWidget";
import CreatorSection from "../components/profile/CreatorSection";
import AIAssistantDeletion from "../components/profile/AIAssistantDeletion";
import SubscriptionManagement from "../components/profile/SubscriptionManagement";
import { usePresenceDetection } from "../components/hooks/usePresenceDetection";
import ProfileEditor from "../components/profile/ProfileEditor";
import ProfileView from "../components/profile/ProfileView";

import { getBalance } from "../components/coins/coinsHelper";

import { Button } from "@/components/ui/button";
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
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [boostPost, setBoostPost] = useState(null);
  const [showExport, setShowExport] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showAIDeleteModal, setShowAIDeleteModal] = useState(false);
  const [showPublisherApply, setShowPublisherApply] = useState(false);
  const { isOnline } = usePresenceDetection(user?.email);
  const queryClient = useQueryClient();
  const { data: coinBalance = 0 } = useQuery({
    queryKey: ["coinBalance", user?.email],
    queryFn: () => getBalance(user.email),
    enabled: !!user?.email
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
    enabled: !!user?.email
  });

  const { data: myArt = [] } = useQuery({
    queryKey: ["myArt", user?.email],
    queryFn: () => base44.entities.ArtPiece.filter({ creator_email: user.email }, "-created_date"),
    enabled: !!user?.email
  });

  const { data: myReviews = [] } = useQuery({
    queryKey: ["myReviews", user?.email],
    queryFn: () => base44.entities.DiscoverReview.filter({ user_email: user.email }, "-created_date"),
    enabled: !!user?.email
  });

  const { data: likedPosts = [] } = useQuery({
    queryKey: ["likedPosts", user?.email],
    queryFn: () => base44.entities.Post.list("-created_date", 200).then((posts) => posts.filter((p) => p.liked_by?.includes(user.email))),
    enabled: !!user?.email
  });

  const { data: followers = [] } = useQuery({
    queryKey: ["followers", user?.email],
    queryFn: () => base44.entities.Follow.filter({ following_email: user.email }),
    enabled: !!user?.email
  });

  const { data: following = [] } = useQuery({
    queryKey: ["following", user?.email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: user.email }),
    enabled: !!user?.email
  });

  const THEMES = {
    default: { label: "Default", bg: "var(--bg-card)", accent: "var(--accent-primary)", banner: "linear-gradient(135deg, var(--accent-primary-light), var(--bg-subtle))" },
    forest: { label: "Forest", bg: "#1a2e1e", accent: "#4ade80", banner: "linear-gradient(135deg, #1a3a20, #2d5a35)" },
    ocean: { label: "Ocean", bg: "#0f1e2e", accent: "#38bdf8", banner: "linear-gradient(135deg, #0f2a3f, #1e4060)" },
    sunset: { label: "Sunset", bg: "#2e1a0e", accent: "#fb923c", banner: "linear-gradient(135deg, #3d1f0a, #5a2e10)" },
    lavender: { label: "Lavender", bg: "#1e1a2e", accent: "#c084fc", banner: "linear-gradient(135deg, #2a1f3d, #3d2b5a)" }
  };

  const activeTheme = THEMES[user?.profile_theme || "default"] || THEMES.default;

  const handleSaveProfile = async () => {
    const usernameToSave = username ? `@${username.replace(/^@/, "")}` : "";
    // Validate username uniqueness if changed
    if (usernameToSave && usernameToSave !== user?.username) {
      const users = await base44.entities.User.list();
      const taken = users.some((u) => u.username === usernameToSave && u.email !== user.email);
      if (taken) {
        alert("That username is already taken. Please choose another.");
        return;
      }
    }
    await base44.auth.updateMe({ bio, about_me: aboutMe, display_name: displayName, username: usernameToSave, avatar_url: avatarUrl, profile_theme: profileTheme });
    setUser((prev) => ({ ...prev, bio, about_me: aboutMe, display_name: displayName, username: usernameToSave, avatar_url: avatarUrl, profile_theme: profileTheme }));
    // Sync to UserProfile entity so other users can see this data
    const existing = await base44.entities.UserProfile.filter({ user_email: user.email });
    const profileData = {
      user_email: user.email,
      user_name: user.full_name || displayName,
      display_name: displayName,
      username: usernameToSave,
      bio,
      about_me: aboutMe,
      avatar_url: avatarUrl,
      profile_theme: profileTheme,
      interests: user.interests || [],
      looking_for: user.looking_for || [],
      age: user.age || "",
      city: user.city || "",
      major: user.major || "",
      graduation_year: user.graduation_year || "",
      hobbies: user.hobbies || "",
    };
    if (existing.length > 0) {
      await base44.entities.UserProfile.update(existing[0].id, profileData);
    } else {
      await base44.entities.UserProfile.create(profileData);
    }
    setShowEdit(false);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    const { file_url: tempUrl } = await base44.integrations.Core.UploadFile({ file });
    const res = await base44.functions.invoke("uploadToCloudflare", { file_url: tempUrl });
    setAvatarUrl(res.data?.file_url || tempUrl);
    setAvatarUploading(false);
  };

  // Compute earned badges automatically
  const computedBadges = (() => {
    const b = new Set(user?.badges || []);
    if (myPosts.length >= 1) b.add("first_post");
    if (myPosts.some((p) => (p.like_count || 0) >= 10)) b.add("popular_post");
    if (myArt.length >= 1) b.add("art_creator");
    return Array.from(b);
  })();

  if (!user) {
    return (
      <div className="overflow-y-auto px-4 pt-4 pb-8 space-y-4" style={{ backgroundColor: "#f3f6fb", minHeight: "calc(100dvh - 64px)" }}>
        <div className="flex items-center justify-between px-1">
          <div className="h-8 w-28 rounded-xl skeleton" />
          <div className="flex gap-2">
            <div className="w-11 h-11 rounded-full skeleton" />
            <div className="w-11 h-11 rounded-full skeleton" />
            <div className="w-11 h-11 rounded-full skeleton" />
          </div>
        </div>
        <div className="rounded-[34px] overflow-hidden p-5 space-y-4" style={{ backgroundColor: "rgba(255,255,255,0.96)", border: "1px solid #e7edf5" }}>
          <div className="flex gap-4 pt-2">
            <div className="w-24 h-24 rounded-full skeleton shrink-0" />
            <div className="flex-1 space-y-3 pt-2">
              <div className="h-7 w-36 rounded-xl skeleton" />
              <div className="h-4 w-24 rounded-xl skeleton" />
              <div className="flex gap-2">
                <div className="h-6 w-16 rounded-full skeleton" />
                <div className="h-6 w-20 rounded-full skeleton" />
              </div>
            </div>
          </div>
          <div className="h-16 rounded-2xl skeleton" />
          <div className="h-12 rounded-2xl skeleton" />
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="aspect-square rounded-[20px] skeleton" />)}
        </div>
      </div>);

  }

  const fadeUp = {
    hidden: { opacity: 0, y: 18 },
    show: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.3, ease: [0.22, 1, 0.36, 1] } })
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="overflow-y-auto overscroll-contain px-4 pt-4 pb-8"
      style={{ backgroundColor: "var(--bg-app)", minHeight: "calc(100dvh - 64px)", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 28px)" }}>
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4 px-1">
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Profile</h1>
          <div className="flex items-center gap-2">
            <Link to={createPageUrl("Messages")} className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.9)", border: "1px solid var(--border-light)", color: "var(--text-primary)", boxShadow: "var(--elevation-1)" }}>
              <MessageSquare className="w-4 h-4" />
            </Link>
            

            
            <div className="relative">
              <button onClick={() => setShowMore((v) => !v)} className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.9)", border: "1px solid var(--border-light)", color: "var(--text-primary)", boxShadow: "var(--elevation-1)" }}>
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {showMore &&
              <>
                  <div className="fixed inset-0 z-40" style={{ backgroundColor: "rgba(0,0,0,0.3)" }} onClick={() => setShowMore(false)} />
                  <div className="absolute right-0 top-full mt-2 z-50 w-52 rounded-2xl shadow-xl overflow-hidden"
                style={{ backgroundColor: "#FFFFFF", border: "1px solid var(--border-light)" }}>
                    {[
                  { to: createPageUrl("MyLibrary"), icon: <Library className="w-4 h-4" />, label: "My Library", color: "var(--accent-primary)" },
                  { to: createPageUrl("Referral"), icon: <Gift className="w-4 h-4" />, label: "Referrals", color: "#D98B62" },
                  { to: "/CreatorLanding", icon: <Sparkles className="w-4 h-4" />, label: "Creator Hub", color: "#E05C2A" },
                  { to: null, icon: <Newspaper className="w-4 h-4" />, label: "Apply: Local Publisher", color: "#1D9BF0", onClick: () => { setShowMore(false); setShowPublisherApply(true); } },
                  ...(user?.role === "admin" ? [
                  { to: "/AdminCreators", icon: <Shield className="w-4 h-4" />, label: "Admin Panel", color: "#7C3AED" },
                  { to: createPageUrl("AdminContentManager"), icon: <BarChart2 className="w-4 h-4" />, label: "Content Manager", color: "#0EA5E9" }] :
                  [])].
                  map(({ to, icon, label, color, onClick }) =>
                  to ? <Link key={label} to={to} onClick={() => setShowMore(false)} className="flex items-center gap-3 px-4 py-3 text-sm"
                  style={{ color: "var(--text-primary)", borderBottom: "1px solid var(--border-light)" }}>
                        <span style={{ color }}>{icon}</span>
                        {label}
                      </Link> :
                  <button key={label} onClick={onClick || (() => setShowMore(false))} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left"
                  style={{ color: "var(--text-primary)", borderBottom: "1px solid var(--border-light)" }}>
                        <span style={{ color }}>{icon}</span>
                        {label}
                      </button>
                  )}
                    <Link to="/Settings" onClick={() => setShowMore(false)} className="flex items-center gap-3 px-4 py-3 text-sm"
                  style={{ color: "var(--text-primary)", borderBottom: "1px solid var(--border-light)" }}>
                      <Cog className="w-4 h-4" style={{ color: "var(--text-secondary)" }} /> Settings
                    </Link>
                  </div>
                </>
              }
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[28px] p-4 md:p-5" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 8px 32px rgba(24,28,23,0.08)" }}>
          <div className="absolute inset-x-0 top-0 h-28" style={{ background: activeTheme.banner, opacity: 0.18 }} />
          <div className="relative">
            <div className="flex items-start gap-4 pt-2">
              <div className="relative shrink-0">
                <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center text-3xl font-bold"
                style={{ backgroundColor: "var(--bg-subtle)", color: "var(--accent-primary)", border: "3px solid var(--bg-card)", boxShadow: "0 4px 20px rgba(24,28,23,0.14)" }}>
                  {user.avatar_url ?
                  <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" /> :

                  (user.display_name || user.full_name || "U")[0]?.toUpperCase()
                  }
                </div>
                {isOnline && <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full" style={{ backgroundColor: "#c7f036", border: "2px solid white" }} />}
              </div>

              <div className="flex-1 min-w-0 pt-2">
                <h2 className="text-[26px] font-bold leading-tight" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                  {user.display_name || user.full_name}
                </h2>
                {user.username && <p className="text-sm mt-1 font-semibold" style={{ color: "var(--text-hint)" }}>{user.username}</p>}
                <div className="flex flex-wrap gap-2 mt-2">
                  {user.interests?.slice(0, 2).map((item) =>
                  <span key={item} className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: "#d9eef7", color: "#2d5b7c" }}>
                      {item}
                    </span>
                  )}
                  {!user.interests?.length && user.is_creator &&
                  <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: "#d9eef7", color: "#2d5b7c" }}>
                      Creator
                    </span>
                  }
                </div>
              </div>
            </div>

            {(user.bio || user.about_me) &&
            <div className="mt-4 rounded-[20px] px-4 py-3" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-subtle)" }}>
                {user.bio && <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{user.bio}</p>}
                {user.about_me && <p className="text-sm mt-1.5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{user.about_me}</p>}
              </div>
            }



            <Link to={createPageUrl("Wallet")} className="block mt-4">
              <WalletWidget balance={coinBalance} />
            </Link>


          </div>
        </div>

        {/* Gallery Grid */}
        {myPosts.length === 0 ?
        <p className="text-center text-sm py-8 mt-4" style={{ color: "var(--text-hint)" }}>No posts yet</p> :

        <div className="grid grid-cols-2 gap-3 mt-4">
            {myPosts.map((post) =>
          <div key={post.id} className="relative aspect-square rounded-[20px] overflow-hidden group cursor-pointer"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "var(--elevation-1)" }}>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                  <p className="text-white text-xs line-clamp-2">{post.text}</p>
                </div>
                <button
              onClick={async (e) => {
                e.stopPropagation();
                if (!window.confirm("Delete this post?")) return;
                await base44.entities.Post.delete(post.id);
                queryClient.invalidateQueries({ queryKey: ["myPosts", user.email] });
              }}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              style={{ color: "var(--text-hint)" }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
          )}
          </div>
        }
      </div>

      {/* Followers dialog */}
      <Dialog open={showFollowers} onOpenChange={setShowFollowers}>
        <DialogContent className="max-w-sm rounded-2xl max-h-[70vh]">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-serif)" }}>Followers ({followers.length})</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 overflow-y-auto max-h-[50vh]">
            {followers.length === 0 ?
            <p className="text-sm text-center py-4" style={{ color: "var(--text-hint)" }}>No followers yet</p> :
            followers.map((f) =>
            <div key={f.id} className="flex items-center gap-3 justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--accent-primary)" }}>
                    {f.follower_name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{f.follower_name}</p>
                </div>
                <button onClick={async () => {
                const alreadyFollowing = following.some((x) => x.following_email === f.follower_email);
                if (alreadyFollowing) {
                  await base44.entities.Follow.filter({ follower_email: user.email, following_email: f.follower_email }).then((recs) => recs[0]?.id && base44.entities.Follow.delete(recs[0].id));
                }
              }} className="text-xs px-2.5 py-1 rounded-full border" style={{ color: following.some((x) => x.following_email === f.follower_email) ? "var(--text-secondary)" : "var(--accent-primary)", borderColor: "var(--border-light)" }}>
                  {following.some((x) => x.following_email === f.follower_email) ? "Following" : "Follow"}
                </button>
              </div>
            )}
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
            {following.length === 0 ?
            <p className="text-sm text-center py-4" style={{ color: "var(--text-hint)" }}>Not following anyone yet</p> :
            following.map((f) =>
            <div key={f.id} className="flex items-center gap-3 justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--accent-primary)" }}>
                    {f.following_name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{f.following_name}</p>
                </div>
                <button onClick={async () => {
                await base44.entities.Follow.filter({ follower_email: user.email, following_email: f.following_email }).then((recs) => recs[0]?.id && base44.entities.Follow.delete(recs[0].id));
              }} className="text-xs px-2.5 py-1 rounded-full border" style={{ color: "var(--text-secondary)", borderColor: "var(--border-light)" }}>
                  Unfollow
                </button>
              </div>
            )}
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
              onChange={(e) => setDeleteInput(e.target.value)}
              className="border-red-200 rounded-xl" />
            
            <Button
              onClick={async () => {
                if (deleteInput !== "DELETE") return;
                try {
                  await base44.functions.invoke("deleteUserAccount", {});
                } catch (e) {
                  console.error("Delete account error:", e);
                }
                base44.auth.logout();
              }}
              disabled={deleteInput !== "DELETE"}
              className="w-full rounded-xl bg-red-500 hover:bg-red-600 text-white disabled:opacity-50">
              
              Permanently Delete Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Boost post modal */}
      {boostPost &&
      <BoostPostModal
        post={boostPost}
        user={user}
        balance={coinBalance}
        onClose={() => setBoostPost(null)}
        onBoosted={() => {
          queryClient.invalidateQueries({ queryKey: ["myPosts", user?.email] });
          queryClient.invalidateQueries({ queryKey: ["coinBalance", user?.email] });
        }} />

      }

      {/* Export data modal */}
      <ExportDataModal open={showExport} onClose={() => setShowExport(false)} user={user} />

      {showPublisherApply && <LocalPublisherApplyModal user={user} onClose={() => setShowPublisherApply(false)} />}

      {/* AI Assistant deletion modal */}
      <AIAssistantDeletion
        user={user}
        isOpen={showAIDeleteModal}
        onClose={() => setShowAIDeleteModal(false)} />
      

      {/* Edit profile - New comprehensive editor */}
      {showEdit &&
      <ProfileEditor
        user={user}
        onClose={() => setShowEdit(false)}
        onUpdated={() => {
          base44.auth.me().then((u) => setUser(u));
          queryClient.invalidateQueries();
        }} />

      }
    </motion.div>);

}