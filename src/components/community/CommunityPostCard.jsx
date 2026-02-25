import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageCircle, Share2, Bookmark, Mic, Square, Play, Pause } from "lucide-react";
import MuteBlockMenu from "./MuteBlockMenu";
import { checkContent, createModerationReport } from "../moderation/moderationHelper";
import { requireVerified } from "../auth/EmailVerificationGate";

const REACTIONS = ["❤️", "🔥", "😂", "😮", "👏", "💯"];

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

const avatarColors = ["#7C69C4", "#D98B62", "#3C6E5A", "#E05C7A", "#4A7FC1", "#B07843"];
const getAvatarColor = (name) => avatarColors[(name || "U").charCodeAt(0) % avatarColors.length];

// ── Inline voice player ──
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
      audioRef.current.pause();
      clearInterval(tickRef.current);
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
      tickRef.current = setInterval(() => {
        const a = audioRef.current;
        if (a) setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0);
      }, 100);
    }
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div className="flex items-center gap-2 mt-1.5 px-3 py-2 rounded-2xl" style={{ backgroundColor: "var(--bg-subtle)", maxWidth: 200 }}>
      <button onClick={toggle} className="w-7 h-7 flex items-center justify-center rounded-full shrink-0"
        style={{ backgroundColor: "var(--accent-primary)", color: "#fff" }}>
        {playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
      </button>
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border-light)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: "var(--accent-primary)" }} />
      </div>
      {duration > 0 && <span className="text-[10px] shrink-0" style={{ color: "var(--text-hint)" }}>{fmt(duration)}</span>}
    </div>
  );
}

// ── Voice recorder ──
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
      className="flex items-center gap-1 p-2 rounded-full transition-all active:scale-90"
      style={{ color: recording ? "#E05C7A" : "var(--text-hint)" }}>
      {recording ? (
        <><Square className="w-3.5 h-3.5" fill="currentColor" /><span className="text-[10px] font-mono">{seconds}s</span></>
      ) : (
        <Mic className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

export default function CommunityPostCard({ post, user, onUpvote, isExpanded, onToggle }) {
  const qc = useQueryClient();
  const hasLiked = user?.email && post.upvoted_by?.includes(user.email);
  const [showReactions, setShowReactions] = useState(false);
  const [saved, setSaved] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [reported, setReported] = useState(false);
  const longPressTimer = useRef(null);

  const avatarColor = getAvatarColor(post.author_name);
  const initials = post.is_anonymous ? "?" : (post.author_name?.[0] || "U").toUpperCase();

  const { data: comments = [] } = useQuery({
    queryKey: ["communityComments", post.id],
    queryFn: () => base44.entities.CommunityComment.filter({ post_id: post.id }, "-created_date", 30),
    enabled: isExpanded,
  });

  const { data: voiceReplies = [] } = useQuery({
    queryKey: ["voiceReplies", post.id],
    queryFn: () => base44.entities.VoiceReply.filter({ post_id: post.id }, "-created_date", 10),
    enabled: isExpanded,
  });

  const commentMut = useMutation({
    mutationFn: async () => {
      if (!requireVerified(user)) throw new Error("Email not verified");
      const mod = await checkContent(commentText.trim());
      const comment = await base44.entities.CommunityComment.create({
        post_id: post.id,
        author_email: user?.email || "",
        author_name: user?.display_name || user?.full_name || "Anonymous",
        is_anonymous: false,
        body: commentText.trim(),
      });
      if (!mod.safe) await createModerationReport("reply", comment.id, user?.email, user?.full_name, mod.flags, mod.confidence);
      await base44.entities.CommunityPost.update(post.id, { comment_count: (post.comment_count || 0) + 1 });
      return comment;
    },
    onSuccess: () => {
      setCommentText("");
      qc.invalidateQueries({ queryKey: ["communityComments", post.id] });
      qc.invalidateQueries({ queryKey: ["communityPosts"] });
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

  const handleReport = async () => {
    if (!user || reported) return;
    await base44.entities.Report.create({ content_type: "post", content_id: post.id, reason: "Community report", reporter_email: user.email, status: "pending" });
    await base44.entities.CommunityPost.update(post.id, { is_reported: true });
    setReported(true);
  };

  const handleShare = () => {
    const url = `${window.location.origin}?post=${post.id}`;
    if (navigator.share) navigator.share({ title: "Post", url });
    else navigator.clipboard.writeText(url);
  };

  // Long press for reactions
  const handlePressStart = () => { longPressTimer.current = setTimeout(() => setShowReactions(true), 400); };
  const handlePressEnd = () => { clearTimeout(longPressTimer.current); };

  return (
    <div>
      {/* ── Post row ── */}
      <div className="flex gap-3 px-4 py-4">
        {/* Avatar */}
        <div className="shrink-0 flex flex-col items-center">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ backgroundColor: `${avatarColor}22`, color: avatarColor, border: `2px solid ${avatarColor}33` }}>
            {initials}
          </div>
          {isExpanded && <div className="w-px flex-1 mt-2" style={{ backgroundColor: "var(--border-subtle)", minHeight: 20 }} />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>
                {post.is_anonymous ? "Anonymous" : (post.author_name || "User")}
              </span>
              <span className="text-xs shrink-0" style={{ color: "var(--text-hint)" }}>· {timeAgo(post.created_date)}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => setSaved(v => !v)} className="p-1 rounded-full transition-all active:scale-90">
                <Bookmark className="w-3.5 h-3.5" style={{ color: saved ? "var(--accent-primary)" : "var(--text-hint)", fill: saved ? "var(--accent-primary)" : "none" }} />
              </button>
              {!post.is_anonymous && post.author_email && (
                <MuteBlockMenu targetEmail={post.author_email} targetName={post.author_name} user={user} onReport={handleReport} />
              )}
            </div>
          </div>

          {/* Text content */}
          {post.title && (
            <p className="font-bold text-sm mb-1 leading-snug" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              {post.title}
            </p>
          )}
          <p className="text-sm leading-relaxed mb-2" style={{
            color: "var(--text-primary)",
            fontFamily: post.type === "quote_of_day" ? "var(--font-serif)" : "var(--font-sans)",
            fontStyle: post.type === "quote_of_day" ? "italic" : "normal",
          }}>
            {post.type === "quote_of_day" ? `"${post.body}"` : post.body}
          </p>

          {/* Media */}
          {post.image_url && (
            <img src={post.image_url} alt="" loading="lazy"
              className="w-full rounded-2xl mb-2 object-cover max-h-72"
              style={{ border: "1px solid var(--border-subtle)" }} />
          )}

          {/* List items */}
          {post.type === "list" && post.list_items?.length > 0 && (
            <ol className="mb-2 space-y-1">
              {post.list_items.map((item, i) => (
                <li key={i} className="text-sm flex gap-2 items-start">
                  <span className="text-xs font-bold shrink-0 mt-0.5" style={{ color: "var(--text-hint)" }}>{i + 1}.</span>
                  <span style={{ color: "var(--text-secondary)" }}>{item}</span>
                </li>
              ))}
            </ol>
          )}

          {/* Media ref */}
          {post.media_ref_title && (
            <div className="mb-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs"
              style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
              🎬 {post.media_ref_title}
            </div>
          )}

          {/* ── Action row ── */}
          <div className="flex items-center gap-1 -ml-1.5">
            {/* Like / Reactions */}
            <div className="relative">
              <button
                onTouchStart={handlePressStart} onTouchEnd={handlePressEnd}
                onMouseDown={handlePressStart} onMouseUp={handlePressEnd}
                onClick={onUpvote} disabled={hasLiked}
                className="flex items-center gap-1 px-2 py-1.5 rounded-full text-xs font-medium transition-all active:scale-90"
                style={{ color: hasLiked ? "#E05C7A" : "var(--text-hint)" }}>
                <span className="text-base leading-none">{hasLiked ? "❤️" : "🤍"}</span>
                {(post.upvotes || 0) > 0 && <span>{post.upvotes}</span>}
              </button>
              <AnimatePresence>
                {showReactions && (
                  <motion.div initial={{ opacity: 0, scale: 0.8, y: 4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute bottom-full left-0 mb-2 flex gap-1 p-2 rounded-2xl z-30"
                    style={{ backgroundColor: "var(--bg-card)", boxShadow: "0 4px 20px rgba(0,0,0,0.15)", border: "1px solid var(--border-light)" }}
                    onMouseLeave={() => setShowReactions(false)}>
                    {REACTIONS.map(r => (
                      <button key={r} onClick={() => { onUpvote(); setShowReactions(false); }}
                        className="text-xl w-9 h-9 flex items-center justify-center rounded-full transition-all hover:scale-125 active:scale-90"
                        style={{ backgroundColor: "var(--bg-subtle)" }}>
                        {r}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Comment */}
            <button onClick={onToggle}
              className="flex items-center gap-1 px-2 py-1.5 rounded-full text-xs font-medium transition-all active:scale-90"
              style={{ color: isExpanded ? "var(--accent-primary)" : "var(--text-hint)" }}>
              <MessageCircle className="w-4 h-4" />
              {(post.comment_count || 0) > 0 && <span>{post.comment_count}</span>}
            </button>

            {/* Share */}
            <button onClick={handleShare}
              className="flex items-center gap-1 px-2 py-1.5 rounded-full text-xs font-medium transition-all active:scale-90"
              style={{ color: "var(--text-hint)" }}>
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {/* ── Comments section ── */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }} className="overflow-hidden">
                <div className="mt-3 space-y-3">
                  {/* Voice replies */}
                  {voiceReplies.map(vr => {
                    const vc = getAvatarColor(vr.author_name);
                    return (
                      <div key={vr.id} className="flex gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                          style={{ backgroundColor: `${vc}22`, color: vc }}>
                          {(vr.author_name?.[0] || "U").toUpperCase()}
                        </div>
                        <div>
                          <span className="text-[11px] font-semibold" style={{ color: "var(--text-secondary)" }}>{vr.author_name}</span>
                          <VoicePlayer audioUrl={vr.audio_url} />
                        </div>
                      </div>
                    );
                  })}

                  {/* Text comments */}
                  {comments.map(c => {
                    const cc = getAvatarColor(c.author_name);
                    return (
                      <div key={c.id} className="flex gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                          style={{ backgroundColor: `${cc}22`, color: cc }}>
                          {(c.is_anonymous ? "A" : (c.author_name?.[0] || "U")).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-[11px] font-semibold mr-1.5" style={{ color: "var(--text-secondary)" }}>
                            {c.is_anonymous ? "Anonymous" : c.author_name}
                          </span>
                          <span className="text-xs leading-relaxed" style={{ color: "var(--text-primary)" }}>{c.body}</span>
                        </div>
                      </div>
                    );
                  })}

                  {comments.length === 0 && voiceReplies.length === 0 && (
                    <p className="text-xs" style={{ color: "var(--text-hint)" }}>No replies yet</p>
                  )}

                  {/* Comment input */}
                  {user && (
                    <div className="flex gap-2 items-center pt-1">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                        style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>
                        {user?.full_name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 flex items-center gap-1 px-3 py-1.5 rounded-full"
                        style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
                        <input value={commentText} onChange={e => setCommentText(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && commentText.trim() && commentMut.mutate()}
                          placeholder="Reply…"
                          className="flex-1 text-xs bg-transparent outline-none"
                          style={{ color: "var(--text-primary)", backgroundColor: "transparent" }} />
                        <VoiceRecorder onSend={(blob) => voiceMut.mutate(blob)} />
                        {commentText.trim() && (
                          <button onClick={() => commentMut.mutate()} disabled={commentMut.isPending}
                            className="p-0.5 rounded-full transition-all active:scale-90 disabled:opacity-40"
                            style={{ color: "var(--accent-primary)" }}>
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ height: 1, backgroundColor: "var(--border-subtle)", marginLeft: 60 }} />
    </div>
  );
}