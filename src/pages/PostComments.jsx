import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Mic, Square, Play, Pause, ImageIcon, Smile, Search, X } from "lucide-react";
import { checkContent, createModerationReport } from "../components/moderation/moderationHelper";
import { requireVerified } from "../components/auth/EmailVerificationGate";

const avatarColors = ["#7C69C4", "#D98B62", "#3C6E5A", "#E05C7A", "#4A7FC1", "#B07843"];
const getAvatarColor = (name) => avatarColors[(name || "U").charCodeAt(0) % avatarColors.length];

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

const STICKERS = [
  "😂","😍","🔥","💯","👏","🥺","😭","✨","💀","🤯",
  "🫶","🙌","😤","🤩","😎","🥳","💪","🎉","❤️","🫠",
  "👀","🌚","🤔","😴","🙃","💅","🫡","🤝","🥲","😇",
];

// ── Voice Player ──────────────────────────────────────────
function VoicePlayer({ audioUrl }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);
  const tickRef = useRef(null);

  useEffect(() => () => { audioRef.current?.pause(); clearInterval(tickRef.current); }, []);

  const toggle = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onloadedmetadata = () => setDuration(audioRef.current.duration);
      audioRef.current.onended = () => { setPlaying(false); setProgress(0); clearInterval(tickRef.current); };
    }
    if (playing) {
      audioRef.current.pause(); clearInterval(tickRef.current); setPlaying(false);
    } else {
      audioRef.current.play(); setPlaying(true);
      tickRef.current = setInterval(() => {
        const a = audioRef.current;
        if (a) setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0);
      }, 100);
    }
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div className="flex items-center gap-2 mt-1 px-3 py-2 rounded-2xl" style={{ backgroundColor: "var(--bg-subtle)", maxWidth: 240 }}>
      <button onClick={toggle} className="w-7 h-7 flex items-center justify-center rounded-full shrink-0"
        style={{ backgroundColor: "var(--accent-primary)", color: "#fff" }}>
        {playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
      </button>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden cursor-pointer" style={{ backgroundColor: "var(--border-light)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: "var(--accent-primary)" }} />
      </div>
      {duration > 0 && <span className="text-xs shrink-0" style={{ color: "var(--text-hint)" }}>{fmt(duration)}</span>}
    </div>
  );
}

// ── Voice Recorder ────────────────────────────────────────
function VoiceRecorder({ onSend }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    mediaRef.current = mr;
    chunksRef.current = [];
    mr.ondataavailable = e => chunksRef.current.push(e.data);
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      onSend(blob);
      stream.getTracks().forEach(t => t.stop());
    };
    mr.start();
    setRecording(true);
    setSeconds(0);
    timerRef.current = setInterval(() => setSeconds(s => {
      if (s >= 59) { stop(); return s; }
      return s + 1;
    }), 1000);
  };

  const stop = () => {
    mediaRef.current?.stop();
    clearInterval(timerRef.current);
    setRecording(false);
    setSeconds(0);
  };

  return (
    <button onClick={recording ? stop : start}
      className="flex items-center gap-1 p-2 rounded-full transition-all"
      style={{ color: recording ? "#E05C7A" : "var(--text-hint)" }}>
      {recording ? (
        <div className="flex items-end gap-0.5 h-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="wave-bar w-0.5 rounded-full" style={{ height: 14, backgroundColor: "#E05C7A" }} />
          ))}
          <span className="text-[10px] font-mono ml-1 text-pink-500">{seconds}s</span>
          <Square className="w-3 h-3 ml-1" fill="currentColor" />
        </div>
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </button>
  );
}

// ── GIF Picker ────────────────────────────────────────────
function GifPicker({ onSelect, onClose }) {
  const [q, setQ] = useState("");
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchGifs("trending"); }, []);

  const fetchGifs = async (query) => {
    setLoading(true);
    try {
      const key = "dc6zaTOxFJmzC";
      const endpoint = query === "trending"
        ? `https://api.giphy.com/v1/gifs/trending?api_key=${key}&limit=24&rating=g`
        : `https://api.giphy.com/v1/gifs/search?api_key=${key}&q=${encodeURIComponent(query)}&limit=24&rating=g`;
      const res = await fetch(endpoint);
      const data = await res.json();
      setGifs(data.data || []);
    } catch (_) {}
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 34 }}
        className="w-full max-w-lg mx-auto rounded-t-3xl flex flex-col"
        style={{ backgroundColor: "var(--bg-modal)", maxHeight: "70dvh" }}
        onClick={e => e.stopPropagation()}>
        <div className="h-1.5 w-12 rounded-full mx-auto mt-3 mb-2" style={{ backgroundColor: "var(--border-medium)" }} />
        <div className="px-4 pb-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-hint)" }} />
            <input value={q} onChange={e => setQ(e.target.value)}
              onKeyDown={e => e.key === "Enter" && q.trim() && fetchGifs(q.trim())}
              placeholder="Search GIFs..."
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
          </div>
          <button onClick={onClose} className="p-2 rounded-full" style={{ backgroundColor: "var(--bg-subtle)" }}>
            <X className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
          </button>
        </div>
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto grid grid-cols-3 gap-1.5 px-4 pb-4 content-start">
            {gifs.map(g => (
              <img key={g.id}
                src={g.images?.fixed_height_small?.url}
                alt={g.title}
                onClick={() => { onSelect(g.images?.downsized?.url || g.images?.fixed_height?.url); onClose(); }}
                className="w-full rounded-xl cursor-pointer object-cover"
                style={{ height: 90 }}
              />
            ))}
          </div>
        )}
        <p className="text-xs text-center py-2" style={{ color: "var(--text-hint)" }}>Powered by Giphy</p>
      </motion.div>
    </motion.div>
  );
}

// ── Sticker Picker (inline) ───────────────────────────────
function StickerPicker({ onSelect }) {
  return (
    <div className="px-3 py-3 grid grid-cols-7 gap-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
      {STICKERS.map(s => (
        <button key={s} onClick={() => onSelect(s)}
          className="text-2xl w-10 h-10 flex items-center justify-center rounded-xl"
          style={{ backgroundColor: "var(--bg-subtle)" }}>
          {s}
        </button>
      ))}
    </div>
  );
}

// ── Comment Item ──────────────────────────────────────────
function CommentItem({ reply }) {
  const [liked, setLiked] = useState(false);
  const color = getAvatarColor(reply.author_name);

  return (
    <div className="flex gap-3 py-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
        style={{ background: `linear-gradient(135deg, ${color}33, ${color}55)`, color }}>
        {(reply.author_name?.[0] || "U").toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {reply.author_name || "Anonymous"}
          </span>
          <span className="text-xs" style={{ color: "var(--text-hint)" }}>
            {timeAgo(reply.created_date)}
          </span>
        </div>

        {reply.type === "voice" ? (
          <VoicePlayer audioUrl={reply.audio_url} />
        ) : reply.type === "image" ? (
          <img src={reply.image_url} alt="" loading="lazy"
            className="rounded-2xl mt-1 object-cover"
            style={{ maxHeight: 200, maxWidth: "100%" }} />
        ) : reply.type === "sticker" ? (
          <span className="text-4xl">{reply.body}</span>
        ) : reply.type === "gif" ? (
          <img src={reply.gif_url} alt="gif" loading="lazy"
            className="rounded-2xl mt-1 object-cover"
            style={{ maxHeight: 180, maxWidth: "100%" }} />
        ) : (
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{reply.body}</p>
        )}

        <button onClick={() => setLiked(v => !v)}
          className="mt-1.5 text-xs flex items-center gap-1"
          style={{ color: liked ? "#E05C7A" : "var(--text-hint)" }}>
          {liked ? "❤️" : "🤍"} <span>Like</span>
        </button>
      </div>
    </div>
  );
}

// ── Post Preview ──────────────────────────────────────────
function PostPreview({ post }) {
  return (
    <div className="px-4 py-4" style={{ borderBottom: "2px solid var(--border-light)" }}>
      <p className="text-sm font-bold leading-snug mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
        {post.title || post.body?.slice(0, 120)}
      </p>
      {post.title && post.body && (
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {post.body?.slice(0, 120)}{post.body?.length > 120 ? "…" : ""}
        </p>
      )}
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs" style={{ color: "var(--text-hint)" }}>
          {post.is_anonymous ? "Anonymous" : post.author_name}
        </span>
        <span className="text-xs" style={{ color: "var(--text-hint)" }}>·</span>
        <span className="text-xs" style={{ color: "var(--text-hint)" }}>{timeAgo(post.created_date)}</span>
      </div>
    </div>
  );
}

// ── Main PostComments Page ────────────────────────────────
export default function PostComments() {
  const params = new URLSearchParams(window.location.search);
  const postId = params.get("postId");
  const debateId = params.get("debateId");

  const [user, setUser] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [commentSide, setCommentSide] = useState("neutral");
  const [activePanel, setActivePanel] = useState(null); // "sticker" | null
  const [showGif, setShowGif] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: post } = useQuery({
    queryKey: ["communityPost", postId],
    queryFn: () => base44.entities.CommunityPost.filter({ id: postId }).then(r => r[0]),
    enabled: !!postId,
  });

  const { data: debate } = useQuery({
    queryKey: ["communityDebate", debateId || post?.id],
    queryFn: () => base44.entities.CommunityDebate.filter({ post_id: post?.id }).then(r => r[0]),
    enabled: !!post?.id,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["communityComments", postId],
    queryFn: () => base44.entities.CommunityComment.filter({ post_id: postId }, "-created_date", 100),
    enabled: !!postId,
  });

  const { data: voiceReplies = [] } = useQuery({
    queryKey: ["voiceReplies", postId],
    queryFn: () => base44.entities.VoiceReply.filter({ post_id: postId }, "-created_date", 50),
    enabled: !!postId,
  });

  // Real-time
  useEffect(() => {
    if (!postId) return;
    const unsub = base44.entities.CommunityComment.subscribe((event) => {
      if (event.data?.post_id === postId) {
        qc.invalidateQueries({ queryKey: ["communityComments", postId] });
      }
    });
    return unsub;
  }, [postId, qc]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["communityComments", postId] });
    qc.invalidateQueries({ queryKey: ["communityPosts"] });
    qc.invalidateQueries({ queryKey: ["communityPost", postId] });
  };

  const commentMut = useMutation({
    mutationFn: async ({ body, type, gif_url, image_url }) => {
      if (!requireVerified(user)) throw new Error("Email not verified");
      const mod = body ? await checkContent(body.trim()) : { safe: true };
      const comment = await base44.entities.CommunityComment.create({
        post_id: postId,
        author_email: user?.email || "",
        author_name: user?.full_name || "Anonymous",
        is_anonymous: false,
        body: body || "",
        type: type || "text",
        gif_url,
        image_url,
        debate_side: debate ? commentSide : undefined,
      });
      if (body && !mod.safe) await createModerationReport("reply", comment.id, user?.email, user?.full_name, mod.flags, mod.confidence);
      if (post) await base44.entities.CommunityPost.update(post.id, { comment_count: (post.comment_count || 0) + 1 });
      return comment;
    },
    onSuccess: () => {
      setCommentText(""); setActivePanel(null);
      invalidate();
    },
  });

  const voiceMut = useMutation({
    mutationFn: async (blob) => {
      if (!requireVerified(user)) throw new Error("Email not verified");
      const { file_url } = await base44.integrations.Core.UploadFile({ file: blob });
      return base44.entities.VoiceReply.create({
        post_id: postId,
        author_email: user?.email || "",
        author_name: user?.full_name || "Anonymous",
        audio_url: file_url,
        duration_seconds: 0,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["voiceReplies", postId] }),
  });

  const handleImageUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUploading(false);
    commentMut.mutate({ body: "", type: "image", image_url: file_url });
  };

  const handleSendText = () => {
    if (!commentText.trim()) return;
    commentMut.mutate({ body: commentText.trim(), type: "text" });
  };

  const allReplies = [
    ...comments.map(c => ({ ...c, type: c.type || "text" })),
    ...voiceReplies.map(v => ({ ...v, type: "voice" })),
  ].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  const goBack = () => window.history.back();

  return (
    <div className="flex flex-col" style={{ height: "100dvh", backgroundColor: "var(--bg-app)", overflow: "hidden" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 shrink-0"
        style={{ backgroundColor: "var(--bg-nav)", borderBottom: "1px solid var(--border-light)", paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)" }}>
        <button onClick={goBack} className="p-2 rounded-full -ml-1" style={{ backgroundColor: "var(--bg-subtle)" }}>
          <ArrowLeft className="w-4 h-4" style={{ color: "var(--text-primary)" }} />
        </button>
        <h1 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
          {debate ? "Arguments" : "Comments"}
          {allReplies.length > 0 && (
            <span className="ml-1.5 text-sm font-normal" style={{ color: "var(--text-hint)" }}>({allReplies.length})</span>
          )}
        </h1>
      </div>

      {/* Scrollable content */}
      <div ref={listRef} className="flex-1 overflow-y-auto" style={{ overscrollBehavior: "contain" }}>
        {/* Post preview */}
        {post && <PostPreview post={post} />}

        {/* Debate vote bar */}
        {debate && (
          <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-hint)" }}>VOTE</p>
            <div className="flex gap-2">
              {[["a", debate.side_a_label, debate.side_a_votes || 0], ["b", debate.side_b_label, debate.side_b_votes || 0]].map(([side, label, votes]) => (
                <div key={side} className="flex-1 px-3 py-2 rounded-xl text-xs text-center"
                  style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
                  <div className="font-semibold truncate">{label}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>{votes} votes</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments list */}
        <div className="px-4">
          {allReplies.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-5xl mb-3">💬</p>
              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>No replies yet</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>Be the first to comment</p>
            </div>
          ) : (
            allReplies.map(reply => <CommentItem key={`${reply.type}-${reply.id}`} reply={reply} />)
          )}
        </div>
        <div style={{ height: 100 }} />
      </div>

      {/* Sticker panel (above input) */}
      <AnimatePresence>
        {activePanel === "sticker" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden", borderTop: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-modal)" }}>
            <StickerPicker onSelect={s => { commentMut.mutate({ body: s, type: "sticker" }); setActivePanel(null); }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      {user && (
        <div className="shrink-0 px-3 py-3" style={{
          backgroundColor: "var(--bg-nav)",
          borderTop: "1px solid var(--border-light)",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)"
        }}>
          {/* Debate side selector */}
          {debate && (
            <div className="flex gap-1.5 mb-2 overflow-x-auto scrollbar-hide">
              {[["a", `🟢 ${debate.side_a_label}`], ["b", `🟠 ${debate.side_b_label}`], ["neutral", "💬 Neutral"]].map(([s, label]) => (
                <button key={s} onClick={() => setCommentSide(s)}
                  className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap shrink-0"
                  style={{
                    backgroundColor: commentSide === s ? "var(--accent-primary)" : "var(--bg-subtle)",
                    color: commentSide === s ? "#fff" : "var(--text-hint)",
                  }}>{label}</button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl"
            style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
            <input
              ref={inputRef}
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && commentText.trim() && handleSendText()}
              placeholder="Write a reply…"
              className="flex-1 text-sm bg-transparent outline-none min-w-0"
              style={{ color: "var(--text-primary)", fontSize: 16 }}
            />

            <div className="flex items-center gap-0.5 shrink-0">
              {/* Image */}
              <button onClick={() => fileRef.current?.click()} className="p-1.5 rounded-full" style={{ color: "var(--text-hint)" }}>
                <ImageIcon className="w-4 h-4" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />

              {/* GIF */}
              <button onClick={() => setShowGif(true)}
                className="p-1.5 rounded-full text-xs font-bold"
                style={{ color: "var(--text-hint)" }}>
                GIF
              </button>

              {/* Stickers */}
              <button onClick={() => setActivePanel(p => p === "sticker" ? null : "sticker")}
                className="p-1.5 rounded-full"
                style={{ color: activePanel === "sticker" ? "var(--accent-primary)" : "var(--text-hint)" }}>
                <Smile className="w-4 h-4" />
              </button>

              {/* Voice */}
              <VoiceRecorder onSend={(blob) => voiceMut.mutate(blob)} />

              {/* Send */}
              {commentText.trim() && (
                <motion.button
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  onClick={handleSendText}
                  disabled={commentMut.isPending || uploading}
                  className="p-1.5 rounded-full"
                  style={{ backgroundColor: "var(--accent-primary)", color: "#fff" }}>
                  <Send className="w-3.5 h-3.5" />
                </motion.button>
              )}
            </div>
          </div>

          {(commentMut.isPending || voiceMut.isPending || uploading) && (
            <p className="text-xs text-center mt-1" style={{ color: "var(--text-hint)" }}>Sending…</p>
          )}
        </div>
      )}

      {/* GIF picker modal */}
      <AnimatePresence>
        {showGif && (
          <GifPicker
            onSelect={(url) => commentMut.mutate({ body: "", type: "gif", gif_url: url })}
            onClose={() => setShowGif(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}