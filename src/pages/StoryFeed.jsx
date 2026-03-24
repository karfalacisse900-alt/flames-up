import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, MessageCircle, Menu, Heart, Bookmark, Share2, MessageSquare, Plus, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const COLORS = ["#7C3AED", "#DB2777", "#EA580C", "#059669", "#0284C7", "#D97706"];
const avatarColor = (str) => COLORS[(str || "a").charCodeAt(0) % COLORS.length];
const getName = (name, email) => (!name || name === email) ? (email?.split("@")[0] || "User") : name;

function StoryCircle({ status, isOwn, user, onPress }) {
  const name = getName(status?.author_name, status?.author_email);
  return (
    <button onClick={onPress} className="flex flex-col items-center gap-1.5 shrink-0" style={{ minWidth: 68 }}>
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center text-xl font-bold text-white"
          style={{
            background: status?.image_url ? "transparent" : `linear-gradient(135deg, ${avatarColor(status?.author_email)}, #4F46E5)`,
            border: "2px solid rgba(255,255,255,0.2)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
          }}>
          {status?.image_url
            ? <img src={status.image_url} alt="" className="w-full h-full object-cover" />
            : name[0]?.toUpperCase()}
        </div>
        {isOwn && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#4F46E5", border: "2px solid #0B1120" }}>
            <Plus className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
      <span className="text-[11px] font-semibold text-white/80 truncate max-w-[64px] text-center leading-tight">
        {isOwn ? "Your story" : name.split(" ")[0]}
      </span>
    </button>
  );
}

function PostCard({ post, user }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const name = getName(post.author_name, post.author_email);

  const handleLike = () => {
    setLiked(v => !v);
    setLikeCount(c => liked ? c - 1 : c + 1);
  };

  const formattedCount = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n;

  return (
    <div className="relative w-full flex-shrink-0 flex items-end overflow-hidden"
      style={{ height: "100dvh", scrollSnapAlign: "start", background: "#0a0f2e" }}>

      {/* Background media */}
      {post.image_url ? (
        <img src={post.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${avatarColor(post.author_email)}55 0%, #0a0f2e 100%)` }} />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)" }} />

      {/* Right action buttons */}
      <div className="absolute right-3 bottom-32 flex flex-col items-center gap-5 z-10">
        {[
          { icon: Heart, count: formattedCount(likeCount), active: liked, color: "#ef4444", action: handleLike, fill: liked },
          { icon: Bookmark, count: formattedCount(post.reply_count || 0), active: saved, color: "#818CF8", action: () => setSaved(v => !v), fill: saved },
          { icon: MessageSquare, count: formattedCount(post.reply_count || 0), active: false, color: "#fff", action: () => {} },
          { icon: Share2, count: null, active: false, color: "#fff", action: () => {} },
        ].map(({ icon: Icon, count, active, color, action, fill }, idx) => (
          <button key={idx} onClick={action} className="flex flex-col items-center gap-1">
            <div className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}>
              <Icon className="w-5 h-5" style={{ color: active ? color : "#fff", fill: fill ? color : "none" }} />
            </div>
            {count != null && <span className="text-white text-[11px] font-bold">{count}</span>}
          </button>
        ))}
      </div>

      {/* Bottom info */}
      <div className="relative z-10 px-4 pb-6 flex-1">
        <div className="flex items-center gap-2 mb-2">
          <Link to={`/user/${encodeURIComponent(post.author_email)}`}>
            <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold text-white shrink-0"
              style={{ background: `linear-gradient(135deg, ${avatarColor(post.author_email)}, #4F46E5)`, border: "2px solid rgba(255,255,255,0.3)" }}>
              {name[0]?.toUpperCase()}
            </div>
          </Link>
          <span className="text-white font-bold text-sm">@{name.toLowerCase().replace(/\s+/g, "_")}</span>
          <button className="ml-1 px-3 py-1 rounded-full text-xs font-bold border border-white/40 text-white"
            style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(255,255,255,0.1)" }}>
            + Follow
          </button>
        </div>
        {post.text && (
          <p className="text-white text-sm leading-relaxed line-clamp-2 pr-12">{post.text}</p>
        )}
      </div>
    </div>
  );
}

export default function StoryFeed() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("discover");
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: statuses = [] } = useQuery({
    queryKey: ["storyFeedStatuses"],
    queryFn: async () => {
      const all = await base44.entities.CreatorStatus.list("-created_date", 30);
      const now = new Date();
      return all.filter(s => !s.expires_at || new Date(s.expires_at) > now);
    },
  });

  const { data: posts = [] } = useQuery({
    queryKey: ["storyFeedPosts"],
    queryFn: () => base44.entities.Post.filter({ is_boosted: false }, "-created_date", 20),
  });

  // Unique authors for story circles
  const storyAuthors = [];
  const seen = new Set();
  statuses.forEach(s => {
    if (!seen.has(s.author_email)) { seen.add(s.author_email); storyAuthors.push(s); }
  });

  const feedPosts = posts.filter(p => p.image_url || p.text);

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ backgroundColor: "#0B1120" }}>

      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-5 z-30 relative"
        style={{ paddingTop: "max(env(safe-area-inset-top, 20px), 20px)", paddingBottom: 12 }}>
        <button className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
          onClick={() => navigate(-1)}>
          <Menu className="w-5 h-5 text-white" />
        </button>

        <div className="flex items-center gap-5">
          <span className="text-white/50 text-base font-semibold cursor-pointer" onClick={() => setTab("discover")}>Discover</span>
          <span className="text-white text-base font-bold border-b-2 border-white cursor-pointer" onClick={() => setTab("following")}>Following</span>
        </div>

        <div className="flex items-center gap-2">
          <button className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
            <Bell className="w-5 h-5 text-white" />
          </button>
          <button className="w-10 h-10 rounded-full flex items-center justify-center relative" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
            <MessageCircle className="w-5 h-5 text-white" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
          </button>
        </div>
      </div>

      {/* Story circles row */}
      <div className="shrink-0 px-4 pb-4 z-20">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide py-1">
          {/* Own story */}
          <button className="flex flex-col items-center gap-1.5 shrink-0" style={{ minWidth: 68 }}>
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${avatarColor(user?.email || "a")}, #4F46E5)`, border: "2px solid rgba(255,255,255,0.2)" }}>
                <span className="text-white text-xl font-bold">{user?.full_name?.[0]?.toUpperCase() || <User className="w-6 h-6 text-white" />}</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#4F46E5", border: "2px solid #0B1120" }}>
                <Plus className="w-3 h-3 text-white" />
              </div>
            </div>
            <span className="text-[11px] font-semibold text-white/80 truncate max-w-[64px] text-center">Your story</span>
          </button>

          {storyAuthors.map((s) => (
            <StoryCircle
              key={s.author_email}
              status={s}
              isOwn={s.author_email === user?.email}
              user={user}
              onPress={() => navigate(`/StatusViewer?authorEmail=${encodeURIComponent(s.author_email)}`)}
            />
          ))}
        </div>
      </div>

      {/* Vertical feed */}
      <div className="flex-1 overflow-y-auto" style={{ scrollSnapType: "y mandatory", scrollbarWidth: "none" }}>
        {feedPosts.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white/40 text-sm">No posts yet</div>
        ) : (
          feedPosts.map((post) => (
            <PostCard key={post.id} post={post} user={user} />
          ))
        )}
      </div>
    </div>
  );
}