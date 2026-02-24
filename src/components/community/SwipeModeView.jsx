import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { X, Heart, MessageCircle, ChevronDown, Send, Mic, MicOff } from "lucide-react";

const TYPE_CONFIG = {
  opinion:         { label: "Opinion",     emoji: "💬", color: "#3C6E5A" },
  question:        { label: "Question",    emoji: "❓", color: "#7C69C4" },
  list:            { label: "List",        emoji: "📋", color: "#4A7FC1" },
  quote_of_day:    { label: "Quote",       emoji: "✦",  color: "#BF9E79" },
  debate:          { label: "Debate",      emoji: "⚔️", color: "#D98B62" },
  discussion:      { label: "Discussion",  emoji: "🗣",  color: "#5B7FA6" },
};

function VoiceRecorderMini({ onSend }) {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    chunksRef.current = [];
    mr.ondataavailable = e => chunksRef.current.push(e.data);
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setAudioBlob(blob);
      stream.getTracks().forEach(t => t.stop());
    };
    mr.start();
    mediaRef.current = mr;
    setRecording(true);
  };

  const stop = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  const handleSend = async () => {
    if (!audioBlob) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file: audioBlob });
    onSend(file_url);
    setAudioBlob(null);
  };

  if (audioBlob) {
    return (
      <div className="flex items-center gap-2">
        <audio src={URL.createObjectURL(audioBlob)} controls className="h-8 flex-1" style={{ maxWidth: 140 }} />
        <button onClick={handleSend} className="px-3 py-1.5 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: "#3C6E5A" }}>Send</button>
        <button onClick={() => setAudioBlob(null)} className="text-xs" style={{ color: "#C86B6B" }}>✕</button>
      </div>
    );
  }

  return (
    <button onPointerDown={start} onPointerUp={stop} onPointerLeave={stop}
      className="p-2.5 rounded-full flex-shrink-0 transition-all"
      style={{ backgroundColor: recording ? "#C86B6B22" : "rgba(255,255,255,0.15)", border: `2px solid ${recording ? "#C86B6B" : "rgba(255,255,255,0.25)"}` }}>
      {recording ? <MicOff className="w-4 h-4" style={{ color: "#C86B6B" }} /> : <Mic className="w-4 h-4 text-white" />}
    </button>
  );
}

function SwipeCard({ post, debate, user, onUpvote, onSkip, onNext, index, total }) {
  const qc = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [liked, setLiked] = useState(post.upvoted_by?.includes(user?.email));
  const [dragX, setDragX] = useState(0);
  const cfg = TYPE_CONFIG[post.type] || TYPE_CONFIG.opinion;

  const { data: comments = [] } = useQuery({
    queryKey: ["communityComments", post.id],
    queryFn: () => base44.entities.CommunityComment.filter({ post_id: post.id }, "-created_date", 20),
    enabled: showComments,
  });

  const commentMut = useMutation({
    mutationFn: (body) => base44.entities.CommunityComment.create({
      post_id: post.id,
      author_email: user?.email || "",
      author_name: user?.display_name || user?.full_name || "Anonymous",
      body,
    }),
    onSuccess: async () => {
      setCommentText("");
      await base44.entities.CommunityPost.update(post.id, { comment_count: (post.comment_count || 0) + 1 });
      qc.invalidateQueries({ queryKey: ["communityComments", post.id] });
    },
  });

  const voiceCommentMut = useMutation({
    mutationFn: (audio_url) => base44.entities.CommunityComment.create({
      post_id: post.id,
      author_email: user?.email || "",
      author_name: user?.display_name || user?.full_name || "Anonymous",
      body: "🎤 Voice comment",
      audio_url,
    }),
    onSuccess: async () => {
      await base44.entities.CommunityPost.update(post.id, { comment_count: (post.comment_count || 0) + 1 });
      qc.invalidateQueries({ queryKey: ["communityComments", post.id] });
    },
  });

  const handleLike = () => {
    if (!user || liked) return;
    setLiked(true);
    onUpvote(post);
  };

  const handleDragEnd = (_, info) => {
    if (info.offset.x > 80) {
      handleLike();
      onNext();
    } else if (info.offset.x < -80) {
      onSkip();
    } else if (info.offset.y < -80) {
      setShowComments(true);
    }
  };

  const totalVotes = debate ? (debate.side_a_votes || 0) + (debate.side_b_votes || 0) : 0;
  const pctA = totalVotes > 0 ? Math.round(((debate?.side_a_votes || 0) / totalVotes) * 100) : 50;

  return (
    <div className="fixed inset-0 z-40" style={{ backgroundColor: "#1a1a2e" }}>
      {/* Background gradient */}
      <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${cfg.color}33 0%, #1a1a2e 60%)` }} />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 pt-12 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{cfg.emoji}</span>
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: cfg.color }}>{cfg.label}</span>
        </div>
        <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>{index + 1} / {total}</span>
      </div>

      {/* Drag hints */}
      {dragX > 30 && (
        <div className="absolute left-6 top-1/2 -translate-y-1/2 z-20 text-3xl font-black" style={{ color: "#3C6E5A", opacity: Math.min(dragX / 80, 1) }}>❤️</div>
      )}
      {dragX < -30 && (
        <div className="absolute right-6 top-1/2 -translate-y-1/2 z-20 text-3xl font-black" style={{ color: "#C86B6B", opacity: Math.min(Math.abs(dragX) / 80, 1) }}>✕</div>
      )}

      {/* Swipeable content */}
      <motion.div
        drag={showComments ? false : true}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.4}
        onDrag={(_, info) => setDragX(info.offset.x)}
        onDragEnd={handleDragEnd}
        className="absolute inset-0 flex flex-col justify-center px-5 select-none cursor-grab active:cursor-grabbing"
        style={{ touchAction: "none" }}>
        
        {/* Post content */}
        <div className="max-w-sm mx-auto w-full">
          {post.title && (
            <p className="text-2xl font-bold mb-3 leading-tight" style={{ color: "#fff", fontFamily: "var(--font-serif)" }}>{post.title}</p>
          )}
          <p className="text-lg leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.85)", fontFamily: post.type === "quote_of_day" ? "var(--font-serif)" : "var(--font-sans)" }}>
            {post.body}
          </p>
          {post.type === "list" && post.list_items?.length > 0 && (
            <ol className="space-y-2 mb-4">
              {post.list_items.map((item, i) => (
                <li key={i} className="flex gap-3 items-start text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
                  <span className="font-black text-base" style={{ color: cfg.color }}>{i+1}.</span> {item}
                </li>
              ))}
            </ol>
          )}

          {/* Debate vote bars */}
          {post.type === "debate" && debate && (
            <div className="rounded-2xl p-3 mb-4" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
              <div className="h-2 rounded-full overflow-hidden flex mb-2" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                <div className="h-full rounded-l-full transition-all" style={{ width: `${pctA}%`, backgroundColor: "#3C6E5A" }} />
                <div className="h-full rounded-r-full" style={{ width: `${100-pctA}%`, backgroundColor: "#D98B62" }} />
              </div>
              <div className="flex justify-between text-xs font-bold">
                <span style={{ color: "#3C6E5A" }}>🟢 {debate.side_a_label} {pctA}%</span>
                <span style={{ color: "#D98B62" }}>{100-pctA}% {debate.side_b_label} 🟠</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              {post.is_anonymous ? "Anonymous" : post.author_name}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
              ▲ {post.upvotes || 0}  💬 {post.comment_count || 0}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Right action buttons */}
      <div className="absolute right-5 bottom-40 z-10 flex flex-col items-center gap-4">
        <button onClick={handleLike} className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: liked ? "#3C6E5A" : "rgba(255,255,255,0.15)", border: `2px solid ${liked ? "#3C6E5A" : "rgba(255,255,255,0.25)"}` }}>
            <Heart className={`w-5 h-5 ${liked ? "fill-white text-white" : "text-white"}`} />
          </div>
          <span className="text-[10px] font-bold text-white">{(post.upvotes || 0) + (liked ? 1 : 0)}</span>
        </button>
        <button onClick={() => setShowComments(true)} className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.25)" }}>
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <span className="text-[10px] font-bold text-white">{post.comment_count || 0}</span>
        </button>
      </div>

      {/* Bottom swipe hint */}
      <div className="absolute bottom-28 left-0 right-0 flex justify-center gap-8 z-10">
        <button onClick={onSkip} className="flex flex-col items-center gap-1 px-4 py-2 rounded-2xl" style={{ backgroundColor: "rgba(200,107,107,0.2)" }}>
          <span className="text-lg">✕</span>
          <span className="text-[10px] text-white font-medium">Skip</span>
        </button>
        <div className="flex flex-col items-center gap-1 opacity-40">
          <ChevronDown className="w-4 h-4 text-white rotate-180" />
          <span className="text-[10px] text-white">swipe up</span>
        </div>
        <button onClick={() => { handleLike(); onNext(); }} className="flex flex-col items-center gap-1 px-4 py-2 rounded-2xl" style={{ backgroundColor: "rgba(60,110,90,0.2)" }}>
          <span className="text-lg">❤️</span>
          <span className="text-[10px] text-white font-medium">Like</span>
        </button>
      </div>

      {/* Comments drawer */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="absolute bottom-0 left-0 right-0 z-30 rounded-t-3xl"
            style={{ backgroundColor: "var(--bg-modal)", maxHeight: "70vh", display: "flex", flexDirection: "column" }}>
            <div className="flex items-center justify-between px-5 pt-4 pb-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>💬 Comments ({post.comment_count || 0})</p>
              <button onClick={() => setShowComments(false)}><X className="w-5 h-5" style={{ color: "var(--text-hint)" }} /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {comments.length === 0 && <p className="text-center text-sm py-6" style={{ color: "var(--text-hint)" }}>No comments yet. Be first!</p>}
              {comments.map(c => (
                <div key={c.id} className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
                    {(c.is_anonymous ? "A" : c.author_name?.[0] || "U").toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold mb-0.5" style={{ color: "var(--text-secondary)" }}>{c.is_anonymous ? "Anonymous" : c.author_name}</p>
                    {c.audio_url ? (
                      <audio src={c.audio_url} controls className="h-8" />
                    ) : (
                      <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{c.body}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {user && (
              <div className="px-4 py-3 flex gap-2 items-center" style={{ borderTop: "1px solid var(--border-subtle)", paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))" }}>
                <input value={commentText} onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && commentText.trim() && commentMut.mutate(commentText.trim())}
                  placeholder="Add a comment..."
                  className="flex-1 text-sm px-3 py-2 rounded-xl outline-none"
                  style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
                <VoiceRecorderMini onSend={(url) => voiceCommentMut.mutate(url)} />
                <button onClick={() => commentText.trim() && commentMut.mutate(commentText.trim())}
                  className="p-2 rounded-xl" style={{ backgroundColor: "var(--accent-primary)", color: "#fff" }}>
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SwipeModeView({ posts, debates, user, onUpvote, onClose }) {
  const [index, setIndex] = useState(0);

  const getDebate = (postId) => debates.find(d => d.post_id === postId);

  if (posts.length === 0) {
    return (
      <div className="fixed inset-0 z-40 flex flex-col items-center justify-center" style={{ backgroundColor: "#1a1a2e" }}>
        <p className="text-4xl mb-4">💬</p>
        <p className="text-white font-medium mb-6">No posts to swipe</p>
        <button onClick={onClose} className="px-5 py-2.5 rounded-full text-white font-semibold" style={{ backgroundColor: "#3C6E5A" }}>Go back</button>
      </div>
    );
  }

  if (index >= posts.length) {
    return (
      <div className="fixed inset-0 z-40 flex flex-col items-center justify-center" style={{ backgroundColor: "#1a1a2e" }}>
        <p className="text-5xl mb-4">🎉</p>
        <p className="text-white text-lg font-semibold mb-1">You've seen it all!</p>
        <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>Come back later for more</p>
        <button onClick={onClose} className="px-5 py-2.5 rounded-full text-white font-semibold" style={{ backgroundColor: "#3C6E5A" }}>Back to feed</button>
      </div>
    );
  }

  return (
    <>
      {/* Close button */}
      <button onClick={onClose}
        className="fixed top-12 right-5 z-50 w-9 h-9 rounded-full flex items-center justify-center"
        style={{ backgroundColor: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}>
        <X className="w-4 h-4 text-white" />
      </button>

      <AnimatePresence mode="wait">
        <motion.div key={posts[index]?.id}
          initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.18 }}>
          <SwipeCard
            post={posts[index]}
            debate={getDebate(posts[index]?.id)}
            user={user}
            onUpvote={onUpvote}
            onSkip={() => setIndex(i => Math.min(posts.length, i + 1))}
            onNext={() => setIndex(i => Math.min(posts.length, i + 1))}
            index={index}
            total={posts.length}
          />
        </motion.div>
      </AnimatePresence>
    </>
  );
}