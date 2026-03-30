import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Heart, MessageCircle, Share2, MoreHorizontal, Sparkles } from "lucide-react";
import DiscoverUserPostCard from "./DiscoverUserPostCard";

// Nextdoor-style news feed data
const NEWS_ITEMS = [
  {
    id: "n1",
    type: "news",
    publisher: "MassLive",
    publisherColor: "#C0392B",
    publisherInitial: "M",
    verified: true,
    label: "Local publisher",
    time: "17h",
    headline: "Biotech firm to lay off 150 people in Cambridge, move manufacturing to Penn.",
    image: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&q=80",
    source: "masslive.com",
    question: "How do you think the layoffs at biotech companies will impact the job market in your area?",
    likes: 2,
    comments: 1,
  },
  {
    id: "n2",
    type: "sponsored",
    publisher: "Target",
    publisherColor: "#CC0000",
    publisherInitial: "T",
    label: "Sponsored",
    headline: "Hey neighbor, we're just around the corner.",
    body: "Get what you need & score major deals with every trip to Target. Come on over, save big now!",
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&q=80",
    likes: 0,
    comments: 0,
  },
  {
    id: "n3",
    type: "news",
    publisher: "Boston Globe",
    publisherColor: "#1a1a2e",
    publisherInitial: "B",
    verified: true,
    label: "Local publisher",
    time: "3h",
    headline: "City council votes to expand green spaces across downtown neighborhoods.",
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80",
    source: "bostonglobe.com",
    question: "Would more green spaces change how you feel about your neighborhood?",
    likes: 14,
    comments: 7,
  },
  {
    id: "n4",
    type: "news",
    publisher: "WBZ News",
    publisherColor: "#004080",
    publisherInitial: "W",
    verified: true,
    label: "Local publisher",
    time: "1h",
    headline: "New MBTA schedule changes take effect this weekend — here's what to know.",
    image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&q=80",
    source: "wbz.com",
    question: "Will the new schedule affect your commute?",
    likes: 22,
    comments: 18,
  },
  {
    id: "n5",
    type: "sponsored",
    publisher: "Whole Foods",
    publisherColor: "#2E7D32",
    publisherInitial: "W",
    label: "Sponsored",
    headline: "Fresh picks just arrived at your local store.",
    body: "Discover seasonal produce, local favorites, and weekly deals at Whole Foods Market near you.",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80",
    likes: 0,
    comments: 0,
  },
  {
    id: "n6",
    type: "news",
    publisher: "Patch",
    publisherColor: "#E67E22",
    publisherInitial: "P",
    verified: true,
    label: "Local publisher",
    time: "5h",
    headline: "Local restaurant named one of the best new eateries in New England.",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80",
    source: "patch.com",
    question: "Have you been? What's your favorite local hidden gem restaurant?",
    likes: 9,
    comments: 5,
  },
];

function NewsCard({ item, onArticleClick }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(item.likes);

  return (
    <div className="mx-0" style={{ backgroundColor: "var(--bg-card)", borderBottom: "1px solid var(--border-light)" }}>
      {/* Publisher row */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0"
            style={{ backgroundColor: item.publisherColor }}>
            {item.publisherInitial}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{item.publisher}</span>
              {item.verified && <span className="text-blue-500 text-xs">✓</span>}
            </div>
            <p className="text-xs" style={{ color: "var(--text-hint)" }}>
              {item.label}{item.time ? ` · ${item.time}` : ""}
            </p>
          </div>
        </div>
        <button style={{ minHeight: "unset", minWidth: "unset", background: "transparent" }}>
          <MoreHorizontal className="w-5 h-5" style={{ color: "var(--text-hint)" }} />
        </button>
      </div>

      {item.type === "news" ? (
        <button className="w-full text-left" onClick={onArticleClick}
          style={{ background: "transparent", minHeight: "unset", minWidth: "unset" }}>
          {/* Headline */}
          <p className="px-4 pb-3 font-bold text-base leading-snug" style={{ color: "var(--text-primary)" }}>
            {item.headline}
          </p>
          {/* Image with source URL badge */}
          {item.image && (
            <div className="relative mx-4 rounded-2xl overflow-hidden mb-3">
              <img src={item.image} alt={item.headline} className="w-full object-cover" style={{ height: 200 }} />
              {item.source && (
                <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: "rgba(255,255,255,0.9)", color: "#333" }}>
                  {item.source}
                </div>
              )}
            </div>
          )}
          {/* Discussion question */}
          {item.question && (
            <div className="mx-4 mb-3 flex items-start gap-2.5 px-3 py-3 rounded-2xl"
              style={{ backgroundColor: "var(--bg-subtle)" }}>
              <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--accent-primary)" }} />
              </div>
              <p className="text-sm leading-snug" style={{ color: "var(--text-primary)" }}>{item.question}</p>
            </div>
          )}
        </button>
      ) : (
        /* Sponsored card */
        <div className="px-4 pb-3">
          <p className="font-bold text-base leading-snug mb-1" style={{ color: "var(--text-primary)" }}>{item.headline}</p>
          <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>{item.body}</p>
          {item.image && (
            <div className="rounded-2xl overflow-hidden mb-3">
              <img src={item.image} alt={item.headline} className="w-full object-cover" style={{ height: 160 }} />
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-5 px-4 pb-4">
        <button
          onClick={() => { setLiked(v => !v); setLikes(l => liked ? l - 1 : l + 1); }}
          className="flex items-center gap-1.5 text-sm"
          style={{ color: liked ? "#E05C7A" : "var(--text-hint)", minHeight: "unset", minWidth: "unset", background: "transparent" }}>
          <Heart className="w-4 h-4" style={{ fill: liked ? "#E05C7A" : "none" }} />
          {likes > 0 && <span>{likes}</span>}
        </button>
        <button className="flex items-center gap-1.5 text-sm"
          style={{ color: "var(--text-hint)", minHeight: "unset", minWidth: "unset", background: "transparent" }}>
          <MessageCircle className="w-4 h-4" />
          {item.comments > 0 && <span>{item.comments}</span>}
        </button>
        <button className="flex items-center gap-1.5 text-sm"
          style={{ color: "var(--text-hint)", minHeight: "unset", minWidth: "unset", background: "transparent" }}>
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function ArticleFeed({ tab, user, onArticleClick, onUserPostClick }) {
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUserPosts = async () => {
    try {
      const posts = await base44.entities.DiscoverUserPost.list("-created_date", 50);
      setUserPosts(tab === "foryou" ? posts : posts.filter(p => p.tab === tab));
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    loadUserPosts();
  }, [tab]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--accent-primary)" }} />
      </div>
    );
  }

  return (
    <div>
      {/* User posts first */}
      {userPosts.map(post => (
        <DiscoverUserPostCard key={post.id} post={post} user={user} onUpdate={loadUserPosts} onPostClick={onUserPostClick} />
      ))}
      {/* Nextdoor-style news cards */}
      {NEWS_ITEMS.map(item => (
        <NewsCard key={item.id} item={item} onArticleClick={() => {}} />
      ))}
    </div>
  );
}