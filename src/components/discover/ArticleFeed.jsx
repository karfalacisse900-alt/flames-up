import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";
import DiscoverUserPostCard from "./DiscoverUserPostCard";
import NewsCard, { NEWS_ITEMS } from "./NewsCard";

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
      {userPosts.map(post => (
        <DiscoverUserPostCard key={post.id} post={post} user={user} onUpdate={loadUserPosts} onPostClick={onUserPostClick} />
      ))}
      {NEWS_ITEMS.map(item => (
        <NewsCard key={item.id} item={item} />
      ))}
    </div>
  );
}