import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, Square, Play, Pause, ImageIcon, Smile, Search, X, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SmartText from "./SmartText";
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

const STICKERS = ["😂","😍","🔥","💯","👏","🥺","😭","✨","💀","🤯","🫶","🙌","😤","🤩","😎","🥳","💪","🎉","❤️","🫠","👀","🌚","🤔","😴","🙃","💅","🫡","🤝","🥲","😇"];

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
    if (playing) { audioRef.current.pause(); clearInterval(tickRef.current); setPlaying(false); }
    else {
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
      <button onClick={toggle} className="w-7 h-7 flex items-center justify-center rounded-full shrink-0" style={{ backgroundColor: "var(--accent-primary)", color: "#fff" }}>
        {playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
      </button>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden cursor-pointer" style={{ backgroundColor: "var(--border-light)" }}>
        <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: "var(--accent-primary)" }} />
      </div>
      {duration > 0 && <span className="text-xs shrink-0 font-mono" style={{ color: "var(--text-hint)" }}>{fmt(duration)}</span>}
    </div>
  );
}

function VoiceRecorder({ onSend }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const stop = () => { mediaRef.current?.stop(); clearInterval(timerRef.current); setRecording(false); setSeconds(0); };
  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    mediaRef.current = mr; chunksRef.current = [];
    mr.ondataavailable = e => chunksRef.current.push(e.data);
    mr.onstop = () => { onSend(new Blob(chunksRef.current, { type: "audio/webm" })); stream.getTracks().forEach(t => t.stop()); };
    mr.start(); setRecording(true); setSeconds(0);
    timerRef.current = setInterval(() => setSeconds(s => { if (s >= 59) { mr.stop(); clearInterval(timerRef.current); setRecording(false); setSeconds(0); return s; } return s + 1; }), 1000);
  };
  return (
    <button onClick={recording ? stop : start} className="flex items-center gap-1 p-2 rounded-full transition-all" style={{ color: recording ? "#E05C7A" : "var(--text-hint)" }}>
      {recording ? (
        <div className="flex items-end gap-0.5 h-4">
          {[1,2,3,4,5].map(i => <div key={i} className="wave-bar w-0.5 rounded-full" style={{ height: 14, backgroundColor: "#E05C7A" }} />)}
          <span className="text-[10px] font-mono ml-1 text-pink-500">{seconds}s</span>
          <Square className="w-3 h-3 ml-1" fill="currentColor" />
        </div>
      ) : <Mic className="w-4 h-4" />}
    </button>
  );
}

function GifPicker({ onSelect, onClose }) {
  const [q, setQ] = useState("");
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => { fetchGifs("trending"); }, []);
  const fetchGifs = async (query) => {
    setLoading(true);
    try { const res = await base44.functions.invoke('giphySearch', { q: query, limit: '24' }); setGifs(res.data?.data || []); } catch (_) {}
    setLoading(false);
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 34 }}
        className="w-full max-w-lg mx-auto rounded-t-3xl flex flex-col"
        style={{ backgroundColor: "var(--bg-modal)", maxHeight: "65dvh" }}
        onClick={e => e.stopPropagation()}>
        <div className="h-1.5 w-12 rounded-full mx-auto mt-3 mb-2" style={{ backgroundColor: "var(--border-medium)" }} />
        <div className="px-4 pb-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-hint)" }} />
            <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && q.trim() && fetchGifs(q.trim())}
              placeholder="Search GIFs..." className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none"
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
            {gifs.map(g => <img key={g.id} src={g.preview || g.url} alt={g.title} onClick={() => { onSelect(g.url); onClose(); }} className="w-full rounded-xl cursor-pointer object-cover" style={{ height: 90 }} />)}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function StickerPicker({ onSelect }) {
  return (
    <div className="px-3 py-3 grid grid-cols-7 gap-2">
      {STICKERS.map(s => (
        <button key={s} onClick={() => onSelect(s)} className="text-2xl w-10 h-10 flex items-center justify-center rounded-xl" style={{ backgroundColor: "var(--bg-subtle)" }}>{s}</button>
      ))}
    </div>
  );
}

function CommentItem({ reply, currentUserEmail, onDelete }) {
  const [liked, setLiked] = useState(false);
  const color = getAvatarColor(reply.author_name);
  const isOwn = currentUserEmail && reply.author_email === currentUserEmail;
  return (
    <div className="rounded-[22px] p-4 mt-3" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "var(--elevation-1)" }}>
      <div className="flex gap-3">
        {reply.author_avatar_url ? (
          <img src={reply.author_avatar_url} alt={reply.author_name} className="w-9 h-9 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: `linear-gradient(135deg, ${color}33, ${color}55)`, color }}>
            {(reply.author_name?.[0] || "U").toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{reply.author_name || "Anonymous"}</span>
            <span className="text-xs" style={{ color: "var(--text-hint)" }}>• {timeAgo(reply.created_date)}</span>
            {isOwn && <button onClick={() => onDelete(reply)} className="ml-auto p-1 rounded-full" style={{ color: "#E05C7A" }}><Trash2 className="w-3.5 h-3.5" /></button>}
          </div>
          {reply.type === "voice" ? <VoicePlayer audioUrl={reply.audio_url} />
            : reply.type === "image" && reply.image_url ? <img src={reply.image_url} alt="comment" className="rounded-2xl mt-1 max-w-full object-cover" style={{ maxHeight: 200 }} />
            : reply.type === "sticker" ? <span className="text-4xl">{reply.body}</span>
            : reply.type === "gif" && reply.gif_url ? <img src={reply.gif_url} alt="GIF" className="rounded-2xl mt-1 max-w-full" style={{ maxHeight: 180 }} />
            : <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}><SmartText text={reply.body} /></p>}
          <div className="flex items-center gap-3 mt-3">
            <button onClick={() => setLiked(v => !v)} className="text-xs flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ color: liked ? "#E05C7A" : "var(--text-hint)", backgroundColor: "var(--bg-subtle)" }}>
              {liked ? "😊" : "🙂"} <span>1</span>
            </button>
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Reply</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CommentsSheet({ postId, user, onClose }) {
  const [commentText, setCommentText] = useState("");
  const [activePanel, setActivePanel] = useState(null);
  const [showGif, setShowGif] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const qc = useQueryClient();

  const { data: post } = useQuery({
    queryKey: ["communityPost", postId],
    queryFn: () => base44.entities.CommunityPost.filter({ id: postId }).then(r => r[0]),
    enabled: !!postId,
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

  useEffect(() => {
    if (!postId) return;
    const unsub = base44.entities.CommunityComment.subscribe((event) => {
      if (event.data?.post_id === postId) qc.invalidateQueries({ queryKey: ["communityComments", postId] });
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
        author_name: user?.display_name || user?.full_name || "Anonymous",
        author_avatar_url: user?.avatar_url || "",
        is_anonymous: false,
        body: body || "",
        type: type || "text",
        gif_url,
        image_url,
      });
      if (body && !mod.safe) await createModerationReport("reply", comment.id, user?.email, user?.full_name, mod.flags, mod.confidence);
      if (post) await base44.entities.CommunityPost.update(post.id, { comment_count: (post.comment_count || 0) + 1 });
      if (post?.author_email && post.author_email !== user?.email) {
        base44.entities.Notification.create({
          recipient_email: post.author_email,
          actor_name: user?.full_name || user?.email || "Someone",
          actor_email: user?.email || "",
          type: "post_replied",
          post_text: (post.title || post.body || "").slice(0, 100),
          ref_id: post.id,
          is_read: false,
        }).catch(() => {});
      }
      return comment;
    },
    onSuccess: () => { setCommentText(""); setActivePanel(null); invalidate(); },
  });

  const voiceMut = useMutation({
    mutationFn: async (blob) => {
      if (!requireVerified(user)) throw new Error("Email not verified");
      const { file_url } = await base44.integrations.Core.UploadFile({ file: blob });
      return base44.entities.VoiceReply.create({ post_id: postId, author_email: user?.email || "", author_name: user?.full_name || "Anonymous", audio_url: file_url, duration_seconds: 0 });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["voiceReplies", postId] }),
  });

  const handleDeleteComment = async (reply) => {
    if (!window.confirm("Delete this comment?")) return;
    if (reply.type === "voice") {
      await base44.entities.VoiceReply.delete(reply.id);
      qc.invalidateQueries({ queryKey: ["voiceReplies", postId] });
    } else {
      await base44.entities.CommunityComment.delete(reply.id);
      if (post) await base44.entities.CommunityPost.update(post.id, { comment_count: Math.max(0, (post.comment_count || 0) - 1) });
      invalidate();
    }
  };

  const allReplies = [
    ...comments.map(c => ({ ...c, type: c.type || "text" })),
    ...voiceReplies.map(v => ({ ...v, type: "voice" })),
  ].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 36 }}
        className="w-full max-w-lg mx-auto rounded-t-3xl flex flex-col"
        style={{ backgroundColor: "var(--bg-modal)", maxHeight: "80dvh", minHeight: "50dvh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle + header */}
        <div className="shrink-0 px-4 pt-3 pb-2">
          <div className="h-1.5 w-12 rounded-full mx-auto mb-3" style={{ backgroundColor: "var(--border-medium)" }} />
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
              Comments {allReplies.length > 0 && <span className="text-sm font-normal" style={{ color: "var(--text-hint)" }}>({allReplies.length})</span>}
            </h3>
            <button onClick={onClose} className="p-1.5 rounded-full" style={{ backgroundColor: "var(--bg-subtle)" }}>
              <X className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
            </button>
          </div>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-4 py-3" style={{ overscrollBehavior: "contain", backgroundColor: "#f6f8fc" }}>
          {allReplies.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-4xl mb-2">💬</p>
              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>No comments yet</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>Be the first to comment!</p>
            </div>
          ) : (
            allReplies.map(reply => <CommentItem key={`${reply.type}-${reply.id}`} reply={reply} currentUserEmail={user?.email} onDelete={handleDeleteComment} />)
          )}
          <div style={{ height: 16 }} />
        </div>

        {/* Sticker panel */}
        <AnimatePresence>
          {activePanel === "sticker" && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              style={{ overflow: "hidden", borderTop: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-modal)" }}>
              <StickerPicker onSelect={s => { commentMut.mutate({ body: s, type: "sticker" }); setActivePanel(null); }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input bar */}
        <div className="shrink-0 px-3 py-3" style={{
          backgroundColor: "var(--bg-card)",
          borderTop: "1px solid var(--border-subtle)",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)"
        }}>
          {user ? (
            <div className="flex items-center gap-2 px-3 py-3 rounded-[22px]" style={{ backgroundColor: "#fff", border: "2px solid #dbe4ff", boxShadow: "0 2px 10px rgba(15,23,42,0.04)" }}>
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && commentText.trim() && commentMut.mutate({ body: commentText.trim(), type: "text" })}
                placeholder="Write a comment…"
                className="flex-1 text-sm bg-transparent outline-none min-w-0"
                style={{ color: "var(--text-primary)", fontSize: 16 }}
              />
              <div className="flex items-center gap-0.5 shrink-0">
                <button onClick={() => fileRef.current?.click()} className="p-1.5 rounded-full" style={{ color: "var(--text-hint)" }}>
                  <ImageIcon className="w-4 h-4" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={async e => {
                  if (!e.target.files?.[0]) return;
                  setUploading(true);
                  const { file_url } = await base44.integrations.Core.UploadFile({ file: e.target.files[0] });
                  setUploading(false);
                  commentMut.mutate({ body: "", type: "image", image_url: file_url });
                }} />
                <button onClick={() => setShowGif(true)} className="p-1.5 rounded-full text-xs font-bold" style={{ color: "var(--text-hint)" }}>GIF</button>
                <button onClick={() => setActivePanel(p => p === "sticker" ? null : "sticker")} className="p-1.5 rounded-full"
                  style={{ color: activePanel === "sticker" ? "var(--accent-primary)" : "var(--text-hint)" }}>
                  <Smile className="w-4 h-4" />
                </button>
                <VoiceRecorder onSend={(blob) => voiceMut.mutate(blob)} />
                {commentText.trim() && (
                  <button onClick={() => commentMut.mutate({ body: commentText.trim(), type: "text" })}
                    disabled={commentMut.isPending || uploading}
                    className="p-1.5 rounded-full" style={{ backgroundColor: "var(--accent-primary)", color: "#fff" }}>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-center py-2" style={{ color: "var(--text-hint)" }}>Sign in to comment</p>
          )}
          {(commentMut.isPending || uploading) && <p className="text-xs text-center mt-1" style={{ color: "var(--text-hint)" }}>Sending…</p>}
        </div>
      </motion.div>

      <AnimatePresence>
        {showGif && (
          <GifPicker
            onSelect={(url) => { commentMut.mutate({ body: "", type: "gif", gif_url: url }); setShowGif(false); }}
            onClose={() => setShowGif(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}