import React, { useState, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { X, Heart, MessageCircle, Send, Mic, MicOff, RotateCcw } from "lucide-react";

const TYPE_CONFIG = {
  opinion:         { label: "Opinion",     emoji: "💬", color: "#8B6914",  bg: "#FBF5E6" },
  question:        { label: "Question",    emoji: "❓", color: "#7C69C4",  bg: "#F3F0FC" },
  list:            { label: "List",        emoji: "📋", color: "#4A7FC1",  bg: "#EFF5FE" },
  quote_of_day:    { label: "Quote",       emoji: "✦",  color: "#B07843",  bg: "#FDF3E7" },
  debate:          { label: "Debate",      emoji: "⚔️", color: "#D98B62",  bg: "#FFF4ED" },
  discussion:      { label: "Discussion",  emoji: "🗣",  color: "#5B7FA6",  bg: "#EFF5FB" },
};

// Card gradients per type
const CARD_GRADIENTS = {
  opinion:      ["#FDF6E3", "#F5E6C8"],
  question:     ["#F5F0FF", "#E8DFFF"],
  list:         ["#EEF4FF", "#DCE8FF"],
  quote_of_day: ["#FFF8EC", "#FDECD0"],
  debate:       ["#FFF4ED", "#FFE4CF"],
  discussion:   ["#EEF4F9", "#DCE8F5"],
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

  const stop = () => { mediaRef.current?.stop(); setRecording(false); };

  const handleSend = async () => {
    if (!audioBlob) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file: audioBlob });
    onSend(file_url);
    setAudioBlob(null);
  };

  if (audioBlob) return (
    <div className="flex items-center gap-2">
      <audio src={URL.createObjectURL(audioBlob)} controls className="h-7 flex-1" style={{ maxWidth: 120 }} />
      <button onClick={handleSend} className="px-3 py-1.5 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: "#B07843" }}>Send</button>
      <button onClick={() => setAudioBlob(null)} className="text-xs font-bold" style={{ color: "#C86B6B" }}>✕</button>
    </div>
  );

  return (
    <button onPointerDown={start} onPointerUp={stop} onPointerLeave={stop}
      className="p-2.5 rounded-full transition-all"
      style={{ backgroundColor: recording ? "#FEE2E2" : "#F0EDE5", border: `2px solid ${recording ? "#C86B6B" : "#DDD0B0"}` }}>
      {recording ? <MicOff className="w-4 h-4" style={{ color: "#C86B6B" }} /> : <Mic className="w-4 h-4" style={{ color: "#8B6914" }} />}
    </button>
  );
}

function DatingCard({ post, debate, user, onLike, onSkip, onNext, isTop }) {
  const qc = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [liked, setLiked] = useState(post.upvoted_by?.includes(user?.email));
  const cfg = TYPE_CONFIG[post.type] || TYPE_CONFIG.opinion;
  const gradients = CARD_GRADIENTS[post.type] || CARD_GRADIENTS.opinion;

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const likeOpacity = useTransform(x, [30, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, -30], [1, 0]);
  const scale = useTransform(x, [-200, 0, 200], [0.95, 1, 0.95]);

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
      body: "🎤 Voice comment", audio_url,
    }),
    onSuccess: async () => {
      await base44.entities.CommunityPost.update(post.id, { comment_count: (post.comment_count || 0) + 1 });
      qc.invalidateQueries({ queryKey: ["communityComments", post.id] });
    },
  });

  const handleDragEnd = (_, info) => {
    if (info.offset.x > 100) { handleLike(); }
    else if (info.offset.x < -100) { onSkip(); }
  };

  const handleLike = () => {
    if (!liked) { setLiked(true); onLike(post); }
    onNext();
  };

  const totalVotes = debate ? (debate.side_a_votes || 0) + (debate.side_b_votes || 0) : 0;
  const pctA = totalVotes > 0 ? Math.round(((debate?.side_a_votes || 0) / totalVotes) * 100) : 50;

  return (
    <motion.div
      style={{ x, rotate, scale, position: "absolute", inset: 0, cursor: isTop ? "grab" : "default", touchAction: "none" }}
      drag={isTop && !showComments ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: "grabbing" }}
    >
      {/* LIKE stamp */}
      {isTop && (
        <motion.div style={{ opacity: likeOpacity }}
          className="absolute top-12 left-6 z-20 border-4 rounded-xl px-3 py-1 rotate-[-20deg]"
          style={{ borderColor: "#3C6E5A", color: "#3C6E5A", opacity: likeOpacity }}>
          <span className="text-2xl font-black tracking-widest">LIKE</span>
        </motion.div>
      )}

      {/* NOPE stamp */}
      {isTop && (
        <motion.div style={{ opacity: nopeOpacity }}
          className="absolute top-12 right-6 z-20 border-4 rounded-xl px-3 py-1 rotate-[20deg]"
          style={{ borderColor: "#C86B6B", color: "#C86B6B", opacity: nopeOpacity }}>
          <span className="text-2xl font-black tracking-widest">NOPE</span>
        </motion.div>
      )}

      {/* Card */}
      <div className="absolute inset-4 rounded-[28px] overflow-hidden flex flex-col" style={{ bottom: "104px" }}
        style={{ background: `linear-gradient(160deg, ${gradients[0]} 0%, ${gradients[1]} 100%)`, boxShadow: "0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)", border: "1px solid rgba(255,255,255,0.8)" }}>

        {/* Color strip at top */}
        <div className="h-1.5 w-full" style={{ backgroundColor: cfg.color, opacity: 0.7 }} />

        {/* Card body */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden">
          {/* Type badge */}
          <div className="flex items-center justify-between mb-5">
            <span className="text-xs font-bold px-3 py-1.5 rounded-full"
              style={{ backgroundColor: "rgba(255,255,255,0.7)", color: cfg.color, border: `1px solid ${cfg.color}30` }}>
              {cfg.emoji} {cfg.label}
            </span>
            <span className="text-xs font-medium" style={{ color: cfg.color + "99" }}>
              {post.is_anonymous ? "Anonymous" : (post.author_name || "User")}
            </span>
          </div>

          {/* Content — always centered */}
          <div className="flex-1 flex flex-col justify-center items-center text-center overflow-hidden">
          {post.image_url && (
            <img src={post.image_url} alt="" className="w-full rounded-2xl mb-3 object-cover max-h-40" />
          )}
          {post.title && (
            <p className="text-2xl font-bold leading-tight mb-4 w-full text-center" style={{ color: "#1C0E00", fontFamily: "var(--font-serif)" }}>
              {post.title}
            </p>
          )}
          <p className="text-lg leading-relaxed w-full text-center" style={{
            color: "#3A2000",
            fontFamily: post.type === "quote_of_day" ? "var(--font-serif)" : "var(--font-sans)",
            fontStyle: post.type === "quote_of_day" ? "italic" : "normal",
            fontSize: (post.body?.length || 0) > 120 ? "1rem" : "1.1rem",
          }}>
            {post.type === "quote_of_day" ? `"${post.body}"` : post.body}
          </p>

          {/* List items */}
          {post.type === "list" && post.list_items?.length > 0 && (
              <ol className="mt-4 space-y-2">
                {post.list_items.map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm" style={{ color: "#3A2000" }}>
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0" style={{ backgroundColor: cfg.color + "22", color: cfg.color }}>{i + 1}</span>
                    {item}
                  </li>
                ))}
              </ol>
            )}

            {/* Debate bar */}
            {post.type === "debate" && debate && (
              <div className="mt-4 rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.8)" }}>
                <div className="h-3 rounded-full overflow-hidden flex mb-2.5" style={{ backgroundColor: "rgba(0,0,0,0.08)" }}>
                  <div className="h-full rounded-l-full transition-all" style={{ width: `${pctA}%`, backgroundColor: "#3C6E5A" }} />
                  <div className="h-full rounded-r-full" style={{ width: `${100 - pctA}%`, backgroundColor: "#D98B62" }} />
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span style={{ color: "#3C6E5A" }}>🟢 {debate.side_a_label} · {pctA}%</span>
                  <span style={{ color: "#D98B62" }}>{100 - pctA}% · {debate.side_b_label} 🟠</span>
                </div>
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-3 mt-4 pt-4" style={{ borderTop: `1px solid ${cfg.color}20` }}>
            <span className="text-xs font-medium" style={{ color: cfg.color + "99" }}>▲ {post.upvotes || 0}</span>
            <span className="text-xs font-medium" style={{ color: cfg.color + "99" }}>💬 {post.comment_count || 0}</span>
          </div>
        </div>
      </div>

      {/* Action buttons (outside card, below) */}
      {isTop && (
        <div className="absolute left-0 right-0 flex items-center justify-center gap-6 z-10 px-4"
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)", height: "80px" }}>
          {/* Nope */}
          <button onClick={onSkip}
            className="w-16 h-16 rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-transform"
            style={{ backgroundColor: "#EEF3F0", border: "2px solid #FECACA", boxShadow: "0 8px 24px rgba(200,107,107,0.25)" }}>
            <X className="w-7 h-7" style={{ color: "#EF4444" }} />
          </button>

          {/* Comments */}
          <button onClick={() => setShowComments(true)}
            className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
            style={{ backgroundColor: "#EEF3F0", border: "2px solid #C4D4CC", boxShadow: "0 6px 16px rgba(0,0,0,0.1)" }}>
            <MessageCircle className="w-5 h-5" style={{ color: "#3C6E5A" }} />
          </button>

          {/* Like */}
          <button onClick={handleLike}
            className="w-16 h-16 rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-transform"
            style={{ backgroundColor: liked ? "#3C6E5A" : "#EEF3F0", border: `2px solid ${liked ? "#3C6E5A" : "#3C6E5A"}`, boxShadow: "0 8px 24px rgba(60,110,90,0.25)" }}>
            <Heart className={`w-7 h-7`} style={{ color: liked ? "#fff" : "#3C6E5A", fill: liked ? "#fff" : "none" }} />
          </button>
        </div>
      )}

      {/* Comments drawer */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="absolute inset-x-4 bottom-0 z-30 rounded-t-3xl overflow-hidden flex flex-col"
            style={{ backgroundColor: "#FDFAF3", maxHeight: "65vh", border: "1px solid #EDE0C8", borderBottom: "none", boxShadow: "0 -8px 30px rgba(0,0,0,0.15)" }}>
            <div className="flex items-center justify-between px-5 pt-4 pb-3" style={{ borderBottom: "1px solid #EDE0C8" }}>
              <p className="font-bold text-sm" style={{ color: "#2C1A00", fontFamily: "var(--font-serif)" }}>
                💬 Comments ({post.comment_count || 0})
              </p>
              <button onClick={() => setShowComments(false)}>
                <X className="w-5 h-5" style={{ color: "#A08060" }} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {comments.length === 0 && (
                <p className="text-center text-sm py-6" style={{ color: "#A08060" }}>No comments yet. Be first!</p>
              )}
              {comments.map(c => (
                <div key={c.id} className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ backgroundColor: "#EDE0C8", color: "#8B6914" }}>
                    {(c.is_anonymous ? "A" : c.author_name?.[0] || "U").toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold mb-0.5" style={{ color: "#A08060" }}>{c.is_anonymous ? "Anonymous" : c.author_name}</p>
                    {c.audio_url ? (
                      <audio src={c.audio_url} controls className="h-7" />
                    ) : (
                      <p className="text-sm leading-relaxed" style={{ color: "#4A3520" }}>{c.body}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {user && (
              <div className="px-4 py-3 flex gap-2 items-center"
                style={{ borderTop: "1px solid #EDE0C8", paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))", backgroundColor: "#FDFAF3" }}>
                <input value={commentText} onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && commentText.trim() && commentMut.mutate(commentText.trim())}
                  placeholder="Add a comment..."
                  className="flex-1 text-sm px-3 py-2 rounded-xl outline-none"
                  style={{ backgroundColor: "#F5EDDB", border: "1px solid #DDD0B0", color: "#2C1A00" }} />
                <VoiceRecorderMini onSend={(url) => voiceCommentMut.mutate(url)} />
                <button onClick={() => commentText.trim() && commentMut.mutate(commentText.trim())}
                  className="p-2 rounded-xl active:scale-90 transition-transform"
                  style={{ backgroundColor: "#B07843", color: "#fff" }}>
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function SwipeModeView({ posts, debates, user, onUpvote, onClose }) {
  const [index, setIndex] = useState(0);
  const [gone, setGone] = useState(new Set());

  const getDebate = (postId) => debates.find(d => d.post_id === postId);

  const handleNext = () => setIndex(i => i + 1);
  const handleSkip = () => setIndex(i => i + 1);
  const handleUndo = () => setIndex(i => Math.max(0, i - 1));

  if (posts.length === 0) return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center" style={{ backgroundColor: "#E8EDE6" }}>
      <p className="text-5xl mb-4">💬</p>
      <p className="font-semibold mb-6" style={{ color: "#2F2F2F" }}>No posts to swipe</p>
      <button onClick={onClose} className="px-5 py-2.5 rounded-full text-white font-semibold" style={{ backgroundColor: "#3C6E5A" }}>Go back</button>
    </div>
  );

  if (index >= posts.length) return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center" style={{ backgroundColor: "#E8EDE6" }}>
      <p className="text-5xl mb-4">🎉</p>
      <p className="text-lg font-bold mb-1" style={{ color: "#2F2F2F", fontFamily: "var(--font-serif)" }}>You've seen it all!</p>
      <p className="text-sm mb-6" style={{ color: "#6B6B6B" }}>Come back later for more</p>
      <div className="flex gap-3">
        <button onClick={handleUndo} className="flex items-center gap-1.5 px-5 py-2.5 rounded-full font-semibold" style={{ backgroundColor: "#EEF3F0", color: "#3C6E5A", border: "1px solid #C4D4CC" }}>
          <RotateCcw className="w-4 h-4" /> Undo
        </button>
        <button onClick={onClose} className="px-5 py-2.5 rounded-full text-white font-semibold" style={{ backgroundColor: "#3C6E5A" }}>Back to feed</button>
      </div>
    </div>
  );

  // Show current + next card stacked (next card slightly scaled down behind)
  const current = posts[index];
  const next = posts[index + 1];

  return (
    <div className="fixed inset-0 z-40" style={{ backgroundColor: "#E8EDE6" }}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-5 pt-12 pb-2">
        <button onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)" }}>
          <X className="w-4 h-4" style={{ color: "#8B6914" }} />
        </button>
        <div className="flex flex-col items-center">
          <p className="text-xs font-bold tracking-widest" style={{ color: "#8B6914" }}>COMMUNITY</p>
          <div className="flex gap-1 mt-1">
            {posts.slice(Math.max(0, index - 2), index + 5).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full transition-all"
                style={{ backgroundColor: i === (index < 2 ? index : 2) ? "#B07843" : "#DDD0B0", transform: i === (index < 2 ? index : 2) ? "scale(1.3)" : "scale(1)" }} />
            ))}
          </div>
        </div>
        <button onClick={handleUndo}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)" }}
          disabled={index === 0}>
          <RotateCcw className="w-4 h-4" style={{ color: index === 0 ? "#CCC" : "#8B6914" }} />
        </button>
      </div>

      {/* Card stack */}
      <div className="absolute inset-0" style={{ paddingTop: 80, paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 100px)" }}>
        {/* Background card */}
        {next && (
          <div className="absolute inset-4 rounded-[28px]" style={{ bottom: "104px" }}
            style={{
              background: `linear-gradient(160deg, ${(CARD_GRADIENTS[next.type] || CARD_GRADIENTS.opinion)[0]} 0%, ${(CARD_GRADIENTS[next.type] || CARD_GRADIENTS.opinion)[1]} 100%)`,
              transform: "scale(0.93) translateY(16px)",
              opacity: 0.7,
              border: "1px solid rgba(255,255,255,0.6)",
            }} />
        )}

        {/* Active swipe card */}
        <AnimatePresence mode="wait">
          <motion.div key={current.id} className="absolute inset-0"
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <DatingCard
              post={current}
              debate={getDebate(current.id)}
              user={user}
              onLike={onUpvote}
              onSkip={handleSkip}
              onNext={handleNext}
              isTop={true}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}