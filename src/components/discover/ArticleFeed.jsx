import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";
import ArticleCard from "./ArticleCard";
import DiscoverUserPostCard from "./DiscoverUserPostCard";

// Curated articles per tab — fetched via AI or hardcoded seeds
const TAB_TOPICS = {
  foryou: ["How to develop good habits", "The science of happiness", "Why you feel stuck in life", "Money habits of millionaires", "The dark side of social media"],
  culture: ["Street culture movements changing the world", "What Gen Z really values", "Why vinyl records are making a comeback", "The rise of slow living", "Fashion psychology and identity"],
  science: ["Quantum computing explained simply", "How sleep rewires your brain", "The hidden intelligence of plants", "Why your gut is your second brain", "The multiverse theory"],
  featured: ["The age of AI companions", "How algorithms control your reality", "The loneliness epidemic", "Digital minimalism in 2025", "Why meditation changes your brain"],
  daily: ["Morning routines of peak performers", "3 habits to try today", "What to do when motivation fails", "The 5-minute journal method", "Why walking boosts creativity"],
};

const CATEGORY_AUTHORS = {
  foryou: ["Kris Gage", "Jordan Gibbs", "Ali Mese", "Niklas Göke", "Tim Denning"],
  culture: ["Culture Desk", "Tanya Leal", "Marcus Webb", "Nadia Osei", "DJ Vibe"],
  science: ["Dr. Sarah Kim", "Adam Grant", "Ethan Hawkins", "Priya Nair", "Tom Chi"],
  featured: ["Editorial Team", "Jordan Gibbs", "The Editors", "Mira Sol", "Alex P."],
  daily: ["Daily Digest", "Morning Brew", "Habit Coach", "Zara Lin", "Ben Orlin"],
};

const IMAGES = [
  "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&q=80",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&q=80",
  "https://images.unsplash.com/photo-1550439062-609e1531270e?w=400&q=80",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=80",
  "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=400&q=80",
  "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400&q=80",
  "https://images.unsplash.com/photo-1566378246598-5b11a0d486cc?w=400&q=80",
  "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=400&q=80",
  "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80",
];

const SUBTITLES = [
  "Because most of the signs they tell you are garbage",
  "Here's how to stop it before it's too late",
  "The uncomfortable truth nobody talks about",
  "Device-free habits to boost your productivity",
  "A science-backed look at what actually works",
  "The hidden patterns driving your decisions",
  "What researchers discovered after 10 years of study",
  "The simple shift that changes everything",
];

function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateArticles(tab) {
  const titles = TAB_TOPICS[tab] || TAB_TOPICS.foryou;
  const authors = CATEGORY_AUTHORS[tab] || CATEGORY_AUTHORS.foryou;
  return titles.map((title, i) => {
    const r = (offset = 0) => Math.floor(seededRandom(i * 13 + offset + tab.charCodeAt(0)) * 1000);
    const reads = (r(1) * 200 + 10000).toLocaleString();
    const responses = (r(2) * 5 + 100).toLocaleString();
    const mins = Math.floor(seededRandom(i + 7) * 10) + 3;
    const imgIdx = (i + tab.charCodeAt(0)) % IMAGES.length;
    const subIdx = i % SUBTITLES.length;
    const daysAgo = Math.floor(seededRandom(i * 3 + 2) * 365) + 1;
    const date = new Date(Date.now() - daysAgo * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return {
      id: `${tab}-${i}`,
      title,
      subtitle: SUBTITLES[subIdx],
      author: authors[i % authors.length],
      date,
      readTime: mins,
      reads,
      responses,
      image: IMAGES[imgIdx],
      tab,
      isMemberOnly: seededRandom(i * 17) > 0.6,
      publication: tab === "foryou" ? "Better Advice" : tab === "culture" ? "Culture Weekly" : tab === "science" ? "Science Brief" : tab === "featured" ? "Featured" : "Daily Read",
      body: `${title} — ${SUBTITLES[subIdx]}. This is a deep-dive article exploring the nuances of this fascinating topic. Researchers and thinkers from around the world have studied this phenomenon, and the findings are surprising, sometimes shocking, and always illuminating. Whether you're here because you stumbled upon this, or you've been thinking about it for a while, you're in for a thought-provoking read.`,
    };
  });
}

export default function ArticleFeed({ tab, user, onArticleClick, onUserPostClick }) {
  const [articles, setArticles] = useState([]);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUserPosts = async () => {
    try {
      const posts = await base44.entities.DiscoverUserPost.list("-created_date", 50);
      setUserPosts(tab === "foryou" ? posts : posts.filter(p => p.tab === tab));
    } catch {}
  };

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      setArticles(generateArticles(tab));
      setLoading(false);
    }, 350);
    loadUserPosts();
    return () => clearTimeout(t);
  }, [tab]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--accent-primary)" }} />
      </div>
    );
  }

  return (
    <div className="divide-y" style={{ borderColor: "var(--border-light)" }}>
      {userPosts.map(post => (
        <DiscoverUserPostCard key={post.id} post={post} user={user} onUpdate={loadUserPosts} onPostClick={onUserPostClick} />
      ))}
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} onClick={() => onArticleClick(article)} />
      ))}
    </div>
  );
}