import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Heart, MessageCircle, ChevronLeft, Send, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

const TYPE_STYLES = {
  question: { label: "Question", color: "" },
  tip: { label: "Tip", color: "" },
  discussion: { label: "Discussion", color: "" },
};

function PostCard({ post, user, onClick }) {
  const qc = useQueryClient();
  const liked = post.liked_by?.includes(user?.email);

  const like = useMutation({
    mutationFn: () => base44.entities.DiscoverPost.update(post.id, {
      like_count: (post.like_count || 0) + (liked ? -1 : 1),
      liked_by: liked
        ? (post.liked_by || []).filter(e => e !== user?.email)
        : [...(post.liked_by || []), user?.email],
    }),
    onSuccess: () => qc.invalidateQueries(["forum-posts"]),
  });

  const t = TYPE_STYLES[post.type] || TYPE_STYLES.discussion;

  return (
    <div
      onClick={onClick}
      className="rounded-2xl p-4 cursor-pointer hover:shadow-sm transition-all active:scale-[0.99]"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
    >
      <div className="flex items-start gap-2 mb-2">
        <span className="text-[10px] px-2 py-0.5 rounded-full border font-medium shrink-0" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)", borderColor: "var(--border-light)" }}>{t.label}</span>
        {post.item_title && (
          <span className="text-[10px] px-2 py-0.5 rounded-full truncate" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}>{post.item_title}</span>
        )}
      </div>
      <h3 className="font-semibold text-sm mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{post.title}</h3>
      <p className="text-xs line-clamp-2 leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>{post.body}</p>
      <div className="flex items-center justify-between">
        <span className="text-[11px]" style={{ color: "var(--text-hint)" }}>{post.author_name || "Anonymous"}</span>
        <div className="flex items-center gap-3">
          <button
            onClick={e => { e.stopPropagation(); if (user) like.mutate(); }}
            className="flex items-center gap-1 text-xs"
            style={{ color: liked ? "#e05252" : "var(--text-hint)" }}
          >
            <Heart className={`w-3.5 h-3.5 ${liked ? "fill-current" : ""}`} /> {post.like_count || 0}
          </button>
          <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-hint)" }}>
            <MessageCircle className="w-3.5 h-3.5" /> {post.reply_count || 0}
          </span>
        </div>
      </div>
    </div>
  );
}

function PostDetail({ post, user, onBack }) {
  const qc = useQueryClient();
  const [replyText, setReplyText] = useState("");

  const { data: replies = [] } = useQuery({
    queryKey: ["forum-replies", post.id],
    queryFn: () => base44.entities.DiscoverPostReply.filter({ post_id: post.id }, "created_date", 100),
  });

  const addReply = useMutation({
    mutationFn: async () => {
      const r = await base44.entities.DiscoverPostReply.create({
        post_id: post.id,
        author_email: user?.email,
        author_name: user?.full_name || "Anonymous",
        body: replyText,
        like_count: 0,
        liked_by: [],
      });
      await base44.entities.DiscoverPost.update(post.id, { reply_count: (post.reply_count || 0) + 1 });
      return r;
    },
    onSuccess: () => {
      qc.invalidateQueries(["forum-replies", post.id]);
      qc.invalidateQueries(["forum-posts"]);
      setReplyText("");
    },
  });

  const t = TYPE_STYLES[post.type] || TYPE_STYLES.discussion;

  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center gap-3 sticky top-0 z-10" style={{ backgroundColor: "var(--bg-nav)", borderBottom: "1px solid var(--border-light)" }}>
        <button onClick={onBack} className="p-1.5 rounded-full" style={{ backgroundColor: "var(--bg-app)" }}>
          <ChevronLeft className="w-5 h-5" style={{ color: "var(--text-primary)" }} />
        </button>
        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Discussion</span>
      </div>

      <div className="px-5 pt-4 space-y-4">
        {/* Post */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full border font-medium" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)", borderColor: "var(--border-light)" }}>{t.label}</span>
            {post.item_title && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>{post.item_title}</span>}
          </div>
          <h2 className="font-semibold text-base mb-2" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>{post.title}</h2>
          <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>{post.body}</p>
          <span className="text-[11px]" style={{ color: "var(--text-hint)" }}>by {post.author_name || "Anonymous"}</span>
        </div>

        {/* Replies */}
        <p className="text-xs font-semibold px-1" style={{ color: "var(--text-hint)" }}>
          {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
        </p>
        <div className="space-y-3">
          {replies.map(r => (
            <div key={r.id} className="rounded-xl p-3" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
              <p className="text-xs font-medium mb-1" style={{ color: "var(--text-primary)" }}>{r.author_name || "Anonymous"}</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{r.body}</p>
            </div>
          ))}
          {replies.length === 0 && (
            <p className="text-xs text-center py-6" style={{ color: "var(--text-hint)" }}>No replies yet. Start the conversation!</p>
          )}
        </div>
      </div>

      {/* Reply input */}
      {user && (
        <div className="fixed bottom-20 left-0 right-0 max-w-lg mx-auto px-4 pb-3">
          <div className="flex gap-2 p-2 rounded-2xl" style={{ backgroundColor: "var(--bg-modal)", border: "1px solid var(--border-light)", boxShadow: "0 2px 16px rgba(0,0,0,0.08)" }}>
            <input
              className="flex-1 text-sm outline-none bg-transparent px-2"
              placeholder="Write a reply..."
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && replyText.trim()) { e.preventDefault(); addReply.mutate(); } }}
              style={{ color: "var(--text-primary)" }}
            />
            <button
              onClick={() => replyText.trim() && addReply.mutate()}
              disabled={!replyText.trim() || addReply.isPending}
              className="p-2 rounded-xl disabled:opacity-40"
              style={{ backgroundColor: "var(--accent-primary)", color: "#fff" }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CreatePostModal({ user, onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("discussion");
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: () => base44.entities.DiscoverPost.create({
      title, body, type,
      author_email: user?.email,
      author_name: user?.full_name || "Anonymous",
      like_count: 0, liked_by: [], reply_count: 0,
    }),
    onSuccess: (post) => {
      qc.invalidateQueries(["forum-posts"]);
      onCreated(post);
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-3xl p-5" style={{ backgroundColor: "var(--bg-modal)", borderTop: "1px solid var(--border-light)" }} onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: "var(--border-medium)" }} />
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-base" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>New Post</h3>
          <button onClick={onClose} className="p-1.5 rounded-full" style={{ backgroundColor: "var(--bg-subtle)" }}><X className="w-4 h-4" style={{ color: "var(--text-hint)" }} /></button>
        </div>
        {/* Type selector */}
        <div className="flex gap-2 mb-3">
          {Object.entries(TYPE_STYLES).map(([key, { label }]) => (
            <button
              key={key}
              onClick={() => setType(key)}
              className="text-xs px-3 py-1.5 rounded-full border font-medium transition-all"
              style={{
                backgroundColor: type === key ? "var(--accent-primary)" : "var(--bg-subtle)",
                color: type === key ? "#fff" : "var(--text-secondary)",
                borderColor: type === key ? "var(--accent-primary)" : "var(--border-light)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <Input
          placeholder="Title..."
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="mb-3 text-sm rounded-xl"
          style={{ backgroundColor: "var(--bg-subtle)", borderColor: "var(--border-light)", color: "var(--text-primary)" }}
        />
        <Textarea
          placeholder="Share your thoughts, tip, or question..."
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={4}
          className="text-sm resize-none mb-3 rounded-xl"
          style={{ backgroundColor: "var(--bg-subtle)", borderColor: "var(--border-light)", color: "var(--text-primary)" }}
        />
        <Button
          onClick={() => create.mutate()}
          disabled={!title.trim() || !body.trim() || create.isPending}
          className="w-full"
        >
          Post
        </Button>
      </div>
    </div>
  );
}

export default function DiscoverForum() {
  const [user, setUser] = useState(null);
  const [activeType, setActiveType] = useState("all");
  const [selectedPost, setSelectedPost] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["forum-posts"],
    queryFn: () => base44.entities.DiscoverPost.list("-created_date", 100),
  });

  const filtered = activeType === "all" ? posts : posts.filter(p => p.type === activeType);

  if (selectedPost) {
    return <PostDetail post={selectedPost} user={user} onBack={() => setSelectedPost(null)} />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between" style={{ backgroundColor: "var(--bg-nav)", borderBottom: "1px solid var(--border-light)" }}>
        <div>
          <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Community</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>Ask, share & discuss tools</p>
        </div>
        {user && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: "var(--accent-primary)", color: "#fff" }}
          >
            <Plus className="w-3.5 h-3.5" /> Post
          </button>
        )}
      </div>

      {/* Filter pills */}
      <div className="px-5 pt-3 pb-1 flex gap-2 overflow-x-auto scrollbar-hide">
        {[["all", "All"], ["question", "Questions"], ["tip", "Tips"], ["discussion", "Discussions"]].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setActiveType(val)}
            className="shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all"
            style={{
              backgroundColor: activeType === val ? "var(--accent-primary)" : "var(--bg-nav)",
              color: activeType === val ? "#fff" : "var(--text-secondary)",
              borderColor: activeType === val ? "var(--accent-primary)" : "var(--border-light)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div className="px-5 pt-3 pb-24 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-3xl mb-2">💬</p>
            <p className="text-sm" style={{ color: "var(--text-hint)" }}>No posts yet. Be the first!</p>
          </div>
        ) : filtered.map(post => (
          <PostCard key={post.id} post={post} user={user} onClick={() => setSelectedPost(post)} />
        ))}
      </div>

      {showCreate && (
        <CreatePostModal user={user} onClose={() => setShowCreate(false)} onCreated={() => setShowCreate(false)} />
      )}
    </div>
  );
}