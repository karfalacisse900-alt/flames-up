import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Mic, Square, Play, Pause, ImageIcon, Smile, Search } from "lucide-react";
import { checkContent, createModerationReport } from "../moderation/moderationHelper";
import { requireVerified } from "../auth/EmailVerificationGate";

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

// ── Sticker packs ──────────────────────────────────────────────
const STICKERS = [
  "😂","😍","🔥","💯","👏","🥺","😭","✨","💀","🤯",
  "🫶","🙌","😤","🤩","😎","🥳","💪","🎉","❤️","🫠",
  "👀","🌚","🤔","😴","🙃","💅","🫡","🤝","🥲","😇",
];

// ── Voice Player ───────────────────────────────────────────────
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
    <div className="flex items-center gap-2 mt-1 px-3 py-2 rounded-2xl" style={{ backgroundColor: "var(--bg-subtle)", maxWidth: 220 }}>
      <button onClick={toggle} className="w-6 h-6 flex items-center justify-center rounded-full shrink-0"
        style={{ backgroundColor: "var(--accent-primary)", color: "#fff" }}>
        {playing ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
      </button>
      <div className="flex-1 h-1 rounded-full overflow-hidden cursor-pointer" style={{ backgroundColor: "var(--border-light)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: "var(--accent-primary)" }} />
      </div>
      {duration > 0 && <span className="text-[10px] shrink-0" style={{ color: "var(--text-hint)" }}>{fmt(duration)}</span>}
    </div>
  );
}

// ── Voice Recorder with waveform ───────────────────────────────
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
      className="flex items-center gap-1.5 p-2 rounded-full transition-all"
      style={{ color: recording ? "#E05C7A" : "var(--text-hint)" }}>
      {recording ? (
        <div className="flex items-end gap-0.5 h-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="wave-bar w-0.5 rounded-full" style={{ height: 14, backgroundColor: "#E05C7A" }} />
          ))}
          <span className="text-[10px] font-mono ml-1">{seconds}s</span>
          <Square className="w-3 h-3 ml-1" fill="currentColor" />
        </div>
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </button>
  );
}

// ── GIF Search Panel ───────────────────────────────────────────
function GifPicker({ onSelect }) {
  const [q, setQ] = useState("");
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Trending on mount
  useEffect(() => {
    fetchGifs("trending");
  }, []);

  const fetchGifs = async (query) => {
    setLoading(true);
    try {
      const key = "dc6zaTOxFJmzC"; // public beta key
      const endpoint = query === "trending"
        ? `https://api.giphy.com/v1/gifs/trending?api_key=${key}&limit=20&rating=g`
        : `https://api.giphy.com/v1/gifs/search?api_key=${key}&q=${encodeURIComponent(query)}&limit=20&rating=g`;
      const res = await fetch(endpoint);
      const data = await res.json();
      setGifs(data.data || []);
    } catch (_) {}
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (q.trim()) fetchGifs(q.trim());
  };

  return (
    <div className="p-3" style={{ height: 280, display: "flex", flexDirection: "column", gap: 8 }}>
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--text-hint)" }} />
          <input value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search GIFs..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs outline-none"
            style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
        </div>
        <button type="submit" className="px-3 py-1.5 rounded-xl text-xs font-semibold"
          style={{ backgroundColor: "var(--accent-primary)", color: "#fff" }}>Go</button>
      </form>
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto grid grid-cols-3 gap-1.5 content-start">
          {gifs.map(g => (
            <img key={g.id}
              src={g.images?.fixed_height_small?.url}
              alt={g.title}
              onClick={() => onSelect(g.images?.downsized?.url || g.images?.fixed_height?.url)}
              className="w-full rounded-lg cursor-pointer object-cover hover:opacity-90 transition-opacity"
              style={{ height: 70 }}
            />
          ))}
        </div>
      )}
      <p className="text-[10px] text-center" style={{ color: "var(--text-hint)" }}>Powered by Giphy</p>
    </div>
  );
}

// ── Sticker Picker ─────────────────────────────────────────────
function StickerPicker({ onSelect }) {
  return (
    <div className="p-3 grid grid-cols-6 gap-2" style={{ maxHeight: 200, overflowY: "auto" }}>
      {STICKERS.map(s => (
        <button key={s} onClick={() => onSelect(s)}
          className="text-2xl w-10 h-10 flex items-center justify-center rounded-xl transition-all hover:scale-125"
          style={{ backgroundColor: "var(--bg-subtle)" }}>
          {s}
        </button>
      ))}
    </div>
  );
}

// ── Comment Item ───────────────────────────────────────────────
function CommentItem({ reply }) {
  const [liked, setLiked] = useState(false);
  const color = getAvatarColor(reply.author_name);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-2.5">
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
        style={{ background: `linear-gradient(135deg, ${color}33, ${color}55)`, color }}>
        {(reply.author_name?.[0] || "U").toUpperCase()}
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-1.5 mb-0.5">
          <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
            {reply.author_name || "Anonymous"}
          </span>
          <span className="text-[10px]" style={{ color: "var(--text-hint)" }}>
            {timeAgo(reply.created_date)}
          </span>
        </div>

        {reply.type === "voice" ? (
          <VoicePlayer audioUrl={reply.audio_url} />
        ) : reply.type === "image" ? (
          <img src={reply.image_url} alt="" loading="lazy"
            className="rounded-xl mt-1 object-cover"
            style={{ maxHeight: 160, maxWidth: 240 }} />
        ) : reply.type === "sticker" ? (
          <span className="text-4xl">{reply.body}</span>
        ) : reply.type === "gif" ? (
          <img src={reply.gif_url} alt="gif" loading="lazy"
            className="rounded-xl mt-1 object-cover"
            style={{ maxHeight: 140, maxWidth: 220 }} />
        ) : (
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{reply.body}</p>
        )}

        <button onClick={() => setLiked(v => !v)}
          className="mt-1 text-xs flex items-center gap-0.5 transition-all chip"
          style={{ color: liked ? "#E05C7A" : "var(--text-hint)" }}>
          {liked ? "❤️" : "🤍"} Like
        </button>
      </div>
    </motion.div>
  );
}

// ── Main CommentModal ──────────────────────────────────────────
export default function CommentModal({ post, debate, user, onClose }) {
  const [commentText, setCommentText] = useState("");
  const [commentSide, setCommentSide] = useState("neutral");
  const [activePanel, setActivePanel] = useState(null); // "gif" | "sticker" | null
  const [pendingImage, setPendingImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const qc = useQueryClient();

  const { data: comments = [] } = useQuery({
    queryKey: ["communityComments", post.id],
    queryFn: () => base44.entities.CommunityComment.filter({ post_id: post.id }, "-created_date", 50),
  });

  const { data: voiceReplies = [] } = useQuery({
    queryKey: ["voiceReplies", post.id],
    queryFn: () => base44.entities.VoiceReply.filter({ post_id: post.id }, "-created_date", 20),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["communityComments", post.id] });
    qc.invalidateQueries({ queryKey: ["communityPosts"] });
  };

  const commentMut = useMutation({
    mutationFn: async ({ body, type, gif_url, image_url }) => {
      if (!requireVerified(user)) throw new Error("Email not verified");
      const mod = body ? await checkContent(body.trim()) : { safe: true };
      const comment = await base44.entities.CommunityComment.create({
        post_id: post.id,
        author_email: user?.email || "",
        author_name: user?.display_name || user?.full_name || "Anonymous",
        is_anonymous: false,
        body: body || "",
        type: type || "text",
        gif_url,
        image_url,
        debate_side: debate ? commentSide : undefined,
      });
      if (body && !mod.safe) await createModerationReport("reply", comment.id, user?.email, user?.full_name, mod.flags, mod.confidence);
      await base44.entities.CommunityPost.update(post.id, { comment_count: (post.comment_count || 0) + 1 });
      return comment;
    },
    onSuccess: () => {
      setCommentText(""); setPendingImage(null); setActivePanel(null);
      invalidate();
    },
  });

  const voiceMut = useMutation({
    mutationFn: async (blob) => {
      if (!requireVerified(user)) throw new Error("Email not verified");
      const { file_url } = await base44.integrations.Core.UploadFile({ file: blob });
      return base44.entities.VoiceReply.create({
        post_id: post.id,
        author_email: user?.email || "",
        author_name: user?.full_name || "Anonymous",
        audio_url: file_url,
        duration_seconds: 0,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["voiceReplies", post.id] }),
  });

  const handleImageUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUploading(false);
    commentMut.mutate({ body: "", type: "image", image_url: file_url });
  };

  const handleSendText = () => {
    if (!commentText.trim() && !pendingImage) return;
    commentMut.mutate({ body: commentText.trim(), type: "text" });
  };

  const handleSendGif = (url) => {
    commentMut.mutate({ body: "", type: "gif", gif_url: url });
    setActivePanel(null);
  };

  const handleSendSticker = (sticker) => {
    commentMut.mutate({ body: sticker, type: "sticker" });
    setActivePanel(null);
  };

  const allReplies = [
    ...comments.map(c => ({ ...c, type: c.type || "text" })),
    ...voiceReplies.map(v => ({ ...v, type: "voice" })),
  ].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="w-full max-w-lg mx-auto rounded-t-3xl overflow-hidden flex flex-col"
        style={{ backgroundColor: "var(--bg-modal)", maxHeight: "88vh" }}
        onClick={e => e.stopPropagation()}>

        {/* Handle */}
        <div className="h-1.5 w-12 rounded-full mx-auto mt-3 mb-1" style={{ backgroundColor: "var(--border-medium)" }} />

        {/* Header */}
        <div className="px-5 py-3 flex items-center justify-between border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
            {debate ? "Arguments" : "Comments"}
            <span className="ml-1.5 text-sm font-normal" style={{ color: "var(--text-hint)" }}>({allReplies.length})</span>
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-full chip" style={{ backgroundColor: "var(--bg-subtle)" }}>
            <X className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
          </button>
        </div>

        {/* GIF / Sticker panel */}
        <AnimatePresence>
          {activePanel && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: "hidden", borderBottom: "1px solid var(--border-subtle)" }}>
              {activePanel === "gif" && <GifPicker onSelect={handleSendGif} />}
              {activePanel === "sticker" && <StickerPicker onSelect={handleSendSticker} />}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
          {allReplies.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-4xl mb-2">💬</p>
              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>No replies yet</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>Be the first to comment</p>
            </div>
          ) : allReplies.map(reply => (
            <CommentItem key={`${reply.type}-${reply.id}`} reply={reply} />
          ))}
        </div>

        {/* Input area */}
        {user && (
          <div className="px-4 py-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
            {/* Debate side selector */}
            {debate && (
              <div className="flex gap-1.5 mb-2 overflow-x-auto scrollbar-hide">
                {[["a", `🟢 ${debate.side_a_label}`], ["b", `🟠 ${debate.side_b_label}`], ["neutral", "💬 Neutral"]].map(([s, label]) => (
                  <button key={s} onClick={() => setCommentSide(s)}
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap chip border transition-all"
                    style={{
                      backgroundColor: commentSide === s ? "var(--accent-primary)" : "transparent",
                      color: commentSide === s ? "#fff" : "var(--text-hint)",
                      borderColor: commentSide === s ? "var(--accent-primary)" : "var(--border-light)",
                    }}>{label}</button>
                ))}
              </div>
            )}

            {/* Input row */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-2xl" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
              <input value={commentText} onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && commentText.trim() && handleSendText()}
                placeholder="Write a reply..."
                className="flex-1 text-sm bg-transparent outline-none min-w-0"
                style={{ color: "var(--text-primary)" }} />

              {/* Attachment buttons */}
              <div className="flex items-center gap-0.5 shrink-0">
                {/* Image upload */}
                <button onClick={() => fileRef.current?.click()}
                  className="p-1.5 rounded-full chip" style={{ color: "var(--text-hint)" }}>
                  <ImageIcon className="w-4 h-4" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />

                {/* GIF */}
                <button onClick={() => setActivePanel(p => p === "gif" ? null : "gif")}
                  className="p-1.5 rounded-full chip text-xs font-bold"
                  style={{ color: activePanel === "gif" ? "var(--accent-primary)" : "var(--text-hint)" }}>
                  GIF
                </button>

                {/* Stickers */}
                <button onClick={() => setActivePanel(p => p === "sticker" ? null : "sticker")}
                  className="p-1.5 rounded-full chip"
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

            {(commentMut.isPending || uploading) && (
              <p className="text-[10px] text-center mt-1" style={{ color: "var(--text-hint)" }}>Sending…</p>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}