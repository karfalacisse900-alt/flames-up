import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, TrendingUp, MapPin, MessageCircle, Bookmark, ExternalLink, Heart, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Seeded fake data generators for consistent per-place data
function seededRandom(seed) {
  let x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}
function seededInt(seed, min, max) {
  return Math.floor(seededRandom(seed) * (max - min + 1)) + min;
}

const PHOTO_SEEDS = [
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80",
  "https://images.unsplash.com/photo-1519864658586-33c96e9d7e2e?w=400&q=80",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80",
  "https://images.unsplash.com/photo-1543352634-99a5d50ae78e?w=400&q=80",
  "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=400&q=80",
  "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80",
  "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=400&q=80",
];

const SAMPLE_REVIEWS = [
  "Absolutely love this spot! Great vibes and the staff is super friendly.",
  "Hidden gem — you won't regret coming here. Perfect for a date night.",
  "Solid place. Gets busy on weekends, go during the week for a better experience.",
  "The atmosphere is unmatched. Really captures that local charm.",
  "Best spot in the area, hands down. Been coming here for years.",
  "Cozy and welcoming. Great for people-watching and relaxing.",
];

const SAMPLE_NAMES = ["Alex M.", "Jordan K.", "Taylor R.", "Sam W.", "Riley B.", "Casey L.", "Morgan T.", "Drew P."];

function getPlaceSeed(placeId) {
  let hash = 0;
  for (let i = 0; i < placeId.length; i++) hash = ((hash << 5) - hash) + placeId.charCodeAt(i);
  return Math.abs(hash);
}

export default function PlaceSocialSheet({ place, category, onClose }) {
  const [user, setUser] = useState(null);
  const [saved, setSaved] = useState(false);
  const [liked, setLiked] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [localComments, setLocalComments] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");

  const seed = getPlaceSeed(place.id || place.place_name || "default");
  const rating = (3.8 + seededRandom(seed) * 1.2).toFixed(1);
  const visitCount = seededInt(seed, 80, 450);
  const saveCount = seededInt(seed + 1, 20, 180);
  const photoCount = seededInt(seed + 2, 2, 5);
  const photos = PHOTO_SEEDS.slice(0, photoCount);

  const reviews = Array.from({ length: seededInt(seed + 3, 2, 4) }, (_, i) => ({
    id: i,
    name: SAMPLE_NAMES[(seed + i) % SAMPLE_NAMES.length],
    text: SAMPLE_REVIEWS[(seed + i) % SAMPLE_REVIEWS.length],
    rating: seededInt(seed + i * 7, 3, 5),
    time: `${seededInt(seed + i, 1, 6)}d ago`,
    likes: seededInt(seed + i * 3, 0, 24),
  }));

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const handleComment = () => {
    if (!newComment.trim()) return;
    setLocalComments(prev => [{
      id: Date.now(),
      name: user?.full_name || "You",
      text: newComment.trim(),
      time: "Just now",
      likes: 0,
    }, ...prev]);
    setNewComment("");
  };

  const catEmoji = category?.emoji || "📍";
  const catColor = category?.color || "#2E6B4F";

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 32 }}
      className="absolute bottom-0 left-0 right-0 z-30 rounded-t-3xl flex flex-col"
      style={{ backgroundColor: "#FAFAF8", boxShadow: "0 -12px 48px rgba(0,0,0,0.22)", maxHeight: "78vh" }}
    >
      {/* Handle */}
      <div className="pt-3 pb-1 px-4 flex-shrink-0">
        <div className="w-10 h-1 rounded-full mx-auto mb-3" style={{ backgroundColor: "var(--border-medium)" }} />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${catColor}22, ${catColor}11)`, border: `1.5px solid ${catColor}33` }}>
              {catEmoji}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold leading-tight truncate" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                {place.text}
              </h3>
              <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-secondary)" }}>
                {place.place_name?.split(",").slice(1, 3).join(",")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            <button onClick={() => setSaved(!saved)}
              className="p-2 rounded-full transition-all"
              style={{ backgroundColor: saved ? catColor + "20" : "var(--bg-subtle)" }}>
              <Bookmark className="w-4 h-4" style={{ color: saved ? catColor : "var(--text-hint)", fill: saved ? catColor : "none" }} />
            </button>
            <button onClick={onClose} className="p-2 rounded-full" style={{ backgroundColor: "var(--bg-subtle)" }}>
              <X className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 mt-3 mb-2">
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(s => (
              <Star key={s} className="w-3.5 h-3.5" style={{ color: s <= Math.round(rating) ? "#F59E0B" : "#D1D5DB", fill: s <= Math.round(rating) ? "#F59E0B" : "none" }} />
            ))}
            <span className="text-xs font-bold ml-1" style={{ color: "var(--text-primary)" }}>{rating}</span>
          </div>
          <span style={{ color: "var(--border-medium)" }}>•</span>
          <span className="text-xs font-semibold" style={{ color: "#E05C7A" }}>🔥 {visitCount} visits this week</span>
          <span style={{ color: "var(--border-medium)" }}>•</span>
          <span className="text-xs" style={{ color: "var(--text-hint)" }}>{saveCount} saved</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: "var(--bg-subtle)" }}>
          {["overview", "photos", "reviews", "discuss"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
              style={{
                backgroundColor: activeTab === tab ? "#FAFAF8" : "transparent",
                color: activeTab === tab ? "var(--text-primary)" : "var(--text-hint)",
                boxShadow: activeTab === tab ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="overflow-y-auto flex-1 px-4 pb-4">

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-3 pt-3">
            {/* Trending banner */}
            <div className="p-3 rounded-2xl flex items-center gap-3"
              style={{ background: `linear-gradient(135deg, ${catColor}15, ${catColor}08)`, border: `1px solid ${catColor}25` }}>
              <TrendingUp className="w-5 h-5 flex-shrink-0" style={{ color: catColor }} />
              <div>
                <p className="text-xs font-bold" style={{ color: catColor }}>Trending in your community</p>
                <p className="text-[11px]" style={{ color: "var(--text-hint)" }}>
                  {seededInt(seed + 5, 30, 120)} people from the app saved or discussed this place
                </p>
              </div>
            </div>

            {/* Photo strip */}
            {photos.length > 0 && (
              <div>
                <p className="text-xs font-bold mb-2" style={{ color: "var(--text-secondary)" }}>Photos</p>
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                  {photos.map((url, i) => (
                    <img key={i} src={url} alt="place" className="h-24 w-32 object-cover rounded-xl flex-shrink-0"
                      style={{ border: "1px solid var(--border-light)" }} />
                  ))}
                </div>
              </div>
            )}

            {/* Top review */}
            {reviews[0] && (
              <div className="p-3 rounded-2xl" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: catColor }}>
                    {reviews[0].name[0]}
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{reviews[0].name}</p>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className="w-2.5 h-2.5" style={{ color: s <= reviews[0].rating ? "#F59E0B" : "#D1D5DB", fill: s <= reviews[0].rating ? "#F59E0B" : "none" }} />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{reviews[0].text}</p>
              </div>
            )}

            {/* Open in maps */}
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.place_name)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-bold text-white"
              style={{ background: `linear-gradient(135deg, #243D33, #2E6B4F)` }}>
              <ExternalLink className="w-4 h-4" /> Open in Google Maps
            </a>
          </div>
        )}

        {/* PHOTOS TAB */}
        {activeTab === "photos" && (
          <div className="pt-3">
            <div className="grid grid-cols-2 gap-2">
              {photos.map((url, i) => (
                <img key={i} src={url} alt="place" className="w-full h-32 object-cover rounded-2xl"
                  style={{ border: "1px solid var(--border-light)" }} />
              ))}
            </div>
            {photos.length === 0 && (
              <p className="text-center text-xs py-8" style={{ color: "var(--text-hint)" }}>No photos yet</p>
            )}
          </div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === "reviews" && (
          <div className="space-y-3 pt-3">
            {reviews.map(review => (
              <div key={review.id} className="p-3 rounded-2xl" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: catColor }}>
                      {review.name[0]}
                    </div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{review.name}</p>
                      <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>{review.time}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className="w-2.5 h-2.5" style={{ color: s <= review.rating ? "#F59E0B" : "#D1D5DB", fill: s <= review.rating ? "#F59E0B" : "none" }} />
                    ))}
                  </div>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{review.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* DISCUSS TAB */}
        {activeTab === "discuss" && (
          <div className="pt-3 space-y-3">
            {/* Comment input */}
            {user && (
              <div className="flex gap-2">
                <input
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleComment()}
                  placeholder="Share your thoughts about this place..."
                  className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
                />
                <button onClick={handleComment}
                  className="p-2.5 rounded-xl text-white"
                  style={{ backgroundColor: catColor }}>
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Local comments */}
            {localComments.map(c => (
              <div key={c.id} className="p-3 rounded-2xl" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ backgroundColor: catColor }}>{c.name[0]}</div>
                  <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{c.name}</p>
                  <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>{c.time}</p>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{c.text}</p>
              </div>
            ))}

            {/* Seeded community posts */}
            {Array.from({ length: seededInt(seed + 9, 2, 4) }, (_, i) => ({
              id: i,
              name: SAMPLE_NAMES[(seed + i + 2) % SAMPLE_NAMES.length],
              text: [`"Anyone else obsessed with this spot? 😍"`,
                     `"Perfect for a lazy afternoon ☕"`,
                     `"Took my friends here last Saturday — 10/10 would recommend"`,
                     `"The energy here is amazing, love it!"`,
                     `"Seriously underrated. More people need to know about this place."`][(seed + i) % 5],
              time: `${seededInt(seed + i * 5, 1, 14)}d ago`,
              likes: seededInt(seed + i * 4, 1, 45),
            })).map(post => (
              <div key={post.id} className="p-3 rounded-2xl" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ backgroundColor: catColor }}>{post.name[0]}</div>
                  <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{post.name}</p>
                  <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>{post.time}</p>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{post.text}</p>
                <div className="flex items-center gap-1 mt-1.5">
                  <Heart className="w-3 h-3" style={{ color: "var(--text-hint)" }} />
                  <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>{post.likes}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}