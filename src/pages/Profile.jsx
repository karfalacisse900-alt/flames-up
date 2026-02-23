import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, Edit2, BookOpen, Palette, Trophy, MessageSquare, Wallet, Star, Compass, Bookmark, Zap, Gift, ShoppingBag, FolderOpen, Briefcase, Trash2, Sparkles, Clock, ChevronRight, MoreHorizontal, Medal, Wrench, Plus, X, Download } from "lucide-react";
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
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [profileTheme, setProfileTheme] = useState("default");
  const [activeTab, setActiveTab] = useState("badges");
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
      setAvatarUrl(u?.avatar_url || "");
      setBannerUrl(u?.banner_url || "");
      setSkills(u?.skills || []);
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

  const THEMES = {
    default: { label: "Default", bg: "var(--bg-card)", accent: "var(--accent-primary)", banner: "linear-gradient(135deg, var(--accent-primary-light), var(--bg-subtle))" },
    forest: { label: "Forest", bg: "#1a2e1e", accent: "#4ade80", banner: "linear-gradient(135deg, #1a3a20, #2d5a35)" },
    ocean: { label: "Ocean", bg: "#0f1e2e", accent: "#38bdf8", banner: "linear-gradient(135deg, #0f2a3f, #1e4060)" },
    sunset: { label: "Sunset", bg: "#2e1a0e", accent: "#fb923c", banner: "linear-gradient(135deg, #3d1f0a, #5a2e10)" },
    lavender: { label: "Lavender", bg: "#1e1a2e", accent: "#c084fc", banner: "linear-gradient(135deg, #2a1f3d, #3d2b5a)" },
  };

  const activeTheme = THEMES[user?.profile_theme || "default"] || THEMES.default;

  const handleSaveProfile = async () => {
    await base44.auth.updateMe({ bio, about_me: aboutMe, display_name: displayName, avatar_url: avatarUrl, banner_url: bannerUrl, skills, profile_theme: profileTheme });
    setUser((prev) => ({ ...prev, bio, about_me: aboutMe, display_name: displayName, avatar_url: avatarUrl, banner_url: bannerUrl, skills, profile_theme: profileTheme }));
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

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setBannerUrl(file_url);
    setBannerUploading(false);
  };

  // Compute earned badges automatically
  const computedBadges = (() => {
    const b = new Set(user?.badges || []);
    if (myPosts.length >= 1) b.add("first_post");
    if (myPosts.some(p => (p.like_count || 0) >= 10)) b.add("popular_post");
    if (myArt.length >= 1) b.add("art_creator");
    const totalWins = gameStats.reduce((s, g) => s + (g.wins || 0), 0);
    if (totalWins >= 10) b.add("game_champion");
    return Array.from(b);
  })();

  const totalGames = gameStats.reduce((s, g) => s + (g.games_played || 0), 0);

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
        {/* Banner */}
        <div className="w-full h-32 relative overflow-hidden" style={{ backgroundColor: "var(--bg-subtle)" }}>
          {user.banner_url ? (
            <img src={user.banner_url} alt="banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full" style={{ background: activeTheme.banner }} />
          )}
        </div>

        <div className="px-5 pb-5">
          <div className="flex items-end justify-between -mt-10 mb-3">
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
                        { to: createPageUrl("Shop"), icon: <ShoppingBag className="w-4 h-4" />, label: "Shop", color: "var(--accent-secondary)" },
                        { to: createPageUrl("Collections"), icon: <FolderOpen className="w-4 h-4" />, label: "Collections", color: "var(--accent-primary)" },
                        { to: createPageUrl("EditServiceProfile"), icon: <Briefcase className="w-4 h-4" />, label: "Service Profile", color: "var(--accent-primary)" },
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
          <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>{user.email}</p>
          {user.bio && <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{user.bio}</p>}
          {user.about_me && (
            <div className="mt-3 p-3 rounded-xl text-sm leading-relaxed" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)", fontFamily: "var(--font-serif)" }}>
              {user.about_me}
            </div>
          )}

          {/* Skills */}
          {user.skills?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {user.skills.map((skill, i) => (
                <span key={i} className="text-[11px] px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)", border: "1px solid var(--accent-primary)" }}>
                  {skill}
                </span>
              ))}
            </div>
          )}

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
          <TabsTrigger value="badges" className="flex-1 rounded-lg data-[state=active]:bg-[var(--bg-app)] gap-1 text-xs">
            <Medal className="w-3.5 h-3.5" /> Badges
          </TabsTrigger>
          <TabsTrigger value="skills" className="flex-1 rounded-lg data-[state=active]:bg-[var(--bg-app)] gap-1 text-xs">
            <Wrench className="w-3.5 h-3.5" /> Skills
          </TabsTrigger>
          <TabsTrigger value="art" className="flex-1 rounded-lg data-[state=active]:bg-[var(--bg-app)] gap-1 text-xs">
            <Palette className="w-3.5 h-3.5" /> Art
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex-1 rounded-lg data-[state=active]:bg-[var(--bg-app)] gap-1 text-xs">
            <Bookmark className="w-3.5 h-3.5" /> Saved
          </TabsTrigger>
          <TabsTrigger value="interests" className="flex-1 rounded-lg data-[state=active]:bg-[var(--bg-app)] gap-1 text-xs">
            <Sparkles className="w-3.5 h-3.5" /> Interests
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex-1 rounded-lg data-[state=active]:bg-[var(--bg-app)] gap-1 text-xs">
            <Clock className="w-3.5 h-3.5" /> Activity
          </TabsTrigger>
        </TabsList>

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

        <TabsContent value="skills" className="mt-4">
          <p className="text-xs mb-3 px-1" style={{ color: "var(--text-hint)" }}>Showcase your skills & services</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {(user.skills || []).map((skill, i) => (
              <span key={i} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full font-medium" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)", border: "1px solid var(--accent-primary)" }}>
                {skill}
              </span>
            ))}
            {(user.skills || []).length === 0 && (
              <p className="text-sm py-4 text-center w-full" style={{ color: "var(--text-hint)" }}>No skills added yet</p>
            )}
          </div>
          <div className="flex gap-2">
            <input
              placeholder="Add a skill or service…"
              value={newSkill}
              onChange={e => setNewSkill(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && newSkill.trim()) {
                  const updated = [...(user.skills || []), newSkill.trim()];
                  base44.auth.updateMe({ skills: updated });
                  setUser(prev => ({ ...prev, skills: updated }));
                  setNewSkill("");
                }
              }}
              className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
            />
            <button
              onClick={() => {
                if (!newSkill.trim()) return;
                const updated = [...(user.skills || []), newSkill.trim()];
                base44.auth.updateMe({ skills: updated });
                setUser(prev => ({ ...prev, skills: updated }));
                setNewSkill("");
              }}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white"
              style={{ backgroundColor: "var(--accent-primary)" }}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {(user.skills || []).length > 0 && (
            <div className="mt-3 space-y-1.5">
              {user.skills.map((skill, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                  <span className="text-sm" style={{ color: "var(--text-primary)" }}>{skill}</span>
                  <button onClick={() => {
                    const updated = user.skills.filter((_, j) => j !== i);
                    base44.auth.updateMe({ skills: updated });
                    setUser(prev => ({ ...prev, skills: updated }));
                  }} style={{ color: "var(--text-hint)" }}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
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
              <div key={f.id} className="flex items-center gap-3 py-2">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--accent-primary)" }}>
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
              <div key={f.id} className="flex items-center gap-3 py-2">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--accent-primary)" }}>
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
            {/* Banner upload */}
            <div className="relative w-full h-24 rounded-xl overflow-hidden" style={{ backgroundColor: "var(--bg-subtle)" }}>
              {bannerUrl ? (
                <img src={bannerUrl} alt="banner" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: "var(--text-hint)" }}>Banner image</div>
              )}
              <label className="absolute inset-0 flex items-center justify-center cursor-pointer" style={{ background: "rgba(0,0,0,0.3)" }}>
                <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
                <span className="text-white text-xs font-medium">{bannerUploading ? "Uploading..." : "Change Banner"}</span>
              </label>
            </div>
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