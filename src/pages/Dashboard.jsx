import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Flame, Users, MapPin, Image, Bell, TrendingUp, MessageCircle, Star, Calendar, ChevronRight, Plus, Zap } from "lucide-react";

const COLORS = ["#C026D3","#9333EA","#2563EB","#059669","#D97706","#E53935"];
const avatarColor = (str) => COLORS[(str||"a").charCodeAt(0) % COLORS.length];
const getInitials = (name) => (name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: posts = [] } = useQuery({
    queryKey: ["dashPosts"],
    queryFn: () => base44.entities.CommunityPost.list("-created_date", 8),
    staleTime: 30000,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["dashNotifs", user?.email],
    queryFn: () => base44.entities.Notification.filter({ recipient_email: user.email, is_read: false }, "-created_date", 5),
    enabled: !!user?.email,
    staleTime: 15000,
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["dashGroups"],
    queryFn: () => base44.entities.Group.list("-created_date", 4),
    staleTime: 60000,
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["dashActivities"],
    queryFn: () => base44.entities.LiveActivity.list("-created_date", 3),
    staleTime: 30000,
  });

  const { data: artPieces = [] } = useQuery({
    queryKey: ["dashArt"],
    queryFn: () => base44.entities.ArtPiece.list("-created_date", 6),
    staleTime: 60000,
  });

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div style={{ backgroundColor: "#F0F0F8", minHeight: "100dvh" }}>
      {/* Header */}
      <div className="px-4 pt-5 pb-3" style={{ backgroundColor: "#fff", borderBottom: "1px solid #f1f5f9" }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#94A3B8" }}>{today}</p>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black" style={{ color: "#1e293b", fontFamily: "var(--font-serif)" }}>
              Dashboard
            </h1>
            <p className="text-sm" style={{ color: "#64748B" }}>Here's what's happening</p>
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button onClick={() => navigate("/Notifications")} className="relative w-10 h-10 flex items-center justify-center rounded-full"
                style={{ backgroundColor: "#fdf4ff", border: "1px solid #ede9fe" }}>
                <Bell className="w-5 h-5" style={{ color: "#C026D3" }} />
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ backgroundColor: "#C026D3" }}>{notifications.length}</span>
              </button>
            )}
            <button onClick={() => navigate("/Profile")}
              className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold text-white"
              style={{ background: user?.avatar_url ? "transparent" : `linear-gradient(135deg, ${avatarColor(user?.email || "")}, #9333EA)` }}>
              {user?.avatar_url
                ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                : getInitials(user?.full_name || user?.email)}
            </button>
          </div>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="p-3 grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>

        {/* LARGE: Latest Activity — col span 2 */}
        <div className="col-span-2 rounded-3xl overflow-hidden relative"
          style={{ height: 180, background: "linear-gradient(135deg, #C026D3, #9333EA)", boxShadow: "0 8px 32px rgba(192,38,211,0.3)" }}>
          <div className="absolute inset-0 flex flex-col justify-between p-5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-white/80 uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5" /> Live Activity
              </span>
              <button onClick={() => navigate("/NowBoard")} className="text-xs font-bold text-white/80 flex items-center gap-1">
                View All <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            {activities[0] ? (
              <div>
                <p className="text-white font-black text-2xl leading-tight" style={{ fontFamily: "var(--font-serif)" }}>
                  {activities[0].title || activities[0].activity_type || "Something's happening"}
                </p>
                <p className="text-white/70 text-sm mt-1">{timeAgo(activities[0].created_date)}</p>
              </div>
            ) : (
              <div>
                <p className="text-white font-black text-xl" style={{ fontFamily: "var(--font-serif)" }}>Nothing live yet</p>
                <p className="text-white/70 text-sm">Be the first to post!</p>
              </div>
            )}
          </div>
          {/* Decorative circles */}
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.1)" }} />
          <div className="absolute -right-4 -bottom-6 w-24 h-24 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.07)" }} />
        </div>

        {/* Recent Posts */}
        <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#fdf4ff" }}>
                <Flame className="w-4 h-4" style={{ color: "#C026D3" }} />
              </div>
              <span className="text-sm font-bold" style={{ color: "#1e293b" }}>Posts</span>
            </div>
            <button onClick={() => navigate("/Home")}><ChevronRight className="w-4 h-4" style={{ color: "#94A3B8" }} /></button>
          </div>
          <div className="px-4 pb-4 space-y-2.5">
            {posts.slice(0, 3).map(p => (
              <div key={p.id} className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ background: `linear-gradient(135deg, ${avatarColor(p.author_email)}, #9333EA)` }}>
                  {getInitials(p.author_name || p.author_email)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: "#1e293b" }}>{p.title || p.body?.slice(0, 40) || "Untitled"}</p>
                  <p className="text-[10px]" style={{ color: "#94A3B8" }}>{timeAgo(p.created_date)}</p>
                </div>
              </div>
            ))}
            {posts.length === 0 && <p className="text-xs text-center py-2" style={{ color: "#94A3B8" }}>No posts yet</p>}
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: "#1e293b", boxShadow: "0 2px 12px rgba(0,0,0,0.12)" }}>
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(192,38,211,0.2)" }}>
                <Bell className="w-4 h-4" style={{ color: "#e879f9" }} />
              </div>
              <span className="text-sm font-bold text-white">Alerts</span>
            </div>
            {notifications.length > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#C026D3", color: "#fff" }}>
                {notifications.length}
              </span>
            )}
          </div>
          <div className="px-4 pb-4 space-y-2.5">
            {notifications.slice(0, 3).map(n => (
              <div key={n.id} className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: "#e879f9" }} />
                <p className="text-xs font-medium text-white/80 truncate flex-1">
                  {n.actor_name} {n.type?.replace(/_/g, " ")}
                </p>
              </div>
            ))}
            {notifications.length === 0 && <p className="text-xs text-center py-2" style={{ color: "rgba(255,255,255,0.3)" }}>All caught up! ✓</p>}
          </div>
        </div>

        {/* Photo Gallery — col span 2 */}
        <div className="col-span-2 rounded-3xl overflow-hidden" style={{ backgroundColor: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <div className="px-4 pt-4 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#eff6ff" }}>
                <Image className="w-4 h-4" style={{ color: "#2563EB" }} />
              </div>
              <span className="text-sm font-bold" style={{ color: "#1e293b" }}>Gallery</span>
            </div>
            <button onClick={() => navigate("/Gallery")} className="text-xs font-semibold flex items-center gap-1" style={{ color: "#2563EB" }}>
              See all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex gap-2 px-4 pb-4 overflow-x-auto scrollbar-hide">
            {artPieces.slice(0, 6).map(art => (
              <div key={art.id} className="shrink-0 w-20 h-20 rounded-2xl overflow-hidden"
                style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                <img src={art.image_url} alt={art.title} className="w-full h-full object-cover" />
              </div>
            ))}
            {artPieces.length === 0 && (
              <div className="w-full flex items-center justify-center py-4">
                <p className="text-sm" style={{ color: "#94A3B8" }}>No gallery items yet</p>
              </div>
            )}
            <button onClick={() => navigate("/ArtStudio")}
              className="shrink-0 w-20 h-20 rounded-2xl flex flex-col items-center justify-center gap-1"
              style={{ backgroundColor: "#f8fafc", border: "2px dashed #e2e8f0" }}>
              <Plus className="w-5 h-5" style={{ color: "#94A3B8" }} />
              <span className="text-[10px] font-semibold" style={{ color: "#94A3B8" }}>Add</span>
            </button>
          </div>
        </div>

        {/* Groups */}
        <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#f0fdf4" }}>
                <Users className="w-4 h-4" style={{ color: "#16A34A" }} />
              </div>
              <span className="text-sm font-bold" style={{ color: "#1e293b" }}>Groups</span>
            </div>
            <button onClick={() => navigate("/Groups")}><ChevronRight className="w-4 h-4" style={{ color: "#94A3B8" }} /></button>
          </div>
          <div className="px-4 pb-4 space-y-2">
            {groups.slice(0, 3).map(g => (
              <div key={g.id} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: g.cover_image_url ? "transparent" : `linear-gradient(135deg, #16A34A, #059669)` }}>
                  {g.cover_image_url ? <img src={g.cover_image_url} alt="" className="w-full h-full object-cover" /> : getInitials(g.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: "#1e293b" }}>{g.name}</p>
                  <p className="text-[10px]" style={{ color: "#94A3B8" }}>{g.member_count || 0} members</p>
                </div>
              </div>
            ))}
            {groups.length === 0 && <p className="text-xs text-center py-2" style={{ color: "#94A3B8" }}>No groups yet</p>}
          </div>
        </div>

        {/* Nearby / Places */}
        <div className="rounded-3xl overflow-hidden relative"
          style={{ backgroundColor: "#1e293b", backgroundImage: "url(https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&q=80)", backgroundSize: "cover", backgroundPosition: "center", minHeight: 160, boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }}>
          <div className="absolute inset-0 rounded-3xl" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.7))" }} />
          <div className="absolute inset-0 p-4 flex flex-col justify-between">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-white/80" />
              <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Nearby</span>
            </div>
            <div>
              <p className="text-white font-black text-xl leading-tight" style={{ fontFamily: "var(--font-serif)" }}>
                Explore<br />Places
              </p>
              <button onClick={() => navigate("/Places")}
                className="mt-2 flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "#fff", backdropFilter: "blur(8px)" }}>
                Open map <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Trending Stats */}
        <div className="col-span-2 rounded-3xl overflow-hidden" style={{ background: "linear-gradient(135deg, #eff6ff, #fdf4ff)", border: "1px solid #ede9fe", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
          <div className="px-4 pt-4 pb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" style={{ color: "#C026D3" }} />
            <span className="text-sm font-bold" style={{ color: "#1e293b" }}>Your Stats</span>
          </div>
          <div className="grid grid-cols-3 gap-3 px-4 pb-4">
            {[
              { label: "Posts", value: posts.filter(p => p.author_email === user?.email).length, color: "#C026D3", icon: Flame },
              { label: "Groups", value: groups.length, color: "#2563EB", icon: Users },
              { label: "Alerts", value: notifications.length, color: "#D97706", icon: Bell },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="flex flex-col items-center py-3 rounded-2xl"
                style={{ backgroundColor: "rgba(255,255,255,0.7)" }}>
                <Icon className="w-5 h-5 mb-1" style={{ color }} />
                <p className="text-2xl font-black" style={{ color: "#1e293b" }}>{value}</p>
                <p className="text-[11px] font-semibold" style={{ color: "#64748B" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Messages quick access */}
        <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <button onClick={() => navigate("/Messages")} className="w-full p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#fdf4ff" }}>
                <MessageCircle className="w-4 h-4" style={{ color: "#C026D3" }} />
              </div>
              <ChevronRight className="w-4 h-4" style={{ color: "#94A3B8" }} />
            </div>
            <div>
              <p className="text-sm font-bold text-left" style={{ color: "#1e293b" }}>Messages</p>
              <p className="text-xs text-left" style={{ color: "#94A3B8" }}>Open inbox</p>
            </div>
          </button>
        </div>

        {/* Daily Discover */}
        <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <button onClick={() => navigate("/Discover")} className="w-full p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#fffbeb" }}>
                <Star className="w-4 h-4" style={{ color: "#D97706" }} />
              </div>
              <ChevronRight className="w-4 h-4" style={{ color: "#94A3B8" }} />
            </div>
            <div>
              <p className="text-sm font-bold text-left" style={{ color: "#1e293b" }}>Discover</p>
              <p className="text-xs text-left" style={{ color: "#94A3B8" }}>Find new things</p>
            </div>
          </button>
        </div>

      </div>
    </div>
  );
}