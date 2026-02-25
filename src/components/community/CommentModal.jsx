import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Mic, Square, Play, Pause } from "lucide-react";
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
    <div className="flex items-center gap-2 mt-1 px-3 py-2 rounded-2xl" style={{ backgroundColor: "var(--bg-subtle)", maxWidth: 200 }}>
      <button onClick={toggle} className="w-6 h-6 flex items-center justify-center rounded-full shrink-0"
        style={{ backgroundColor: "var(--accent-primary)", color: "#fff" }}>
        {playing ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
      </button>
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border-light)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: "var(--accent-primary)" }} />
      </div>
      {duration > 0 && <span className="text-[10px] shrink-0" style={{ color: "var(--text-hint)" }}>{fmt(duration)}</span>}
    </div>
  );
}

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

export default function CommentModal({ post, debate, user, onClose }) {
  const [commentText, setCommentText] = useState("");
  const [commentSide, setCommentSide] = useState("neutral");
  const qc = useQueryClient();

  const { data: comments = [] } = useQuery({
    queryKey: ["communityComments", post.id],
    queryFn: () => base44.entities.CommunityComment.filter({ post_id: post.id }, "-created_date", 50),
  });

  const { data: voiceReplies = [] } = useQuery({
    queryKey: ["voiceReplies", post.id],
    queryFn: () => base44.entities.VoiceReply.filter({ post_id: post.id }, "-created_date", 20),
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
        debate_side: debate ? commentSide : undefined,
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

  const allReplies = [
    ...comments.map(c => ({ ...c, type: "text" })),
    ...voiceReplies.map(v => ({ ...v, type: "voice" })),
  ].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const sideAComments = debate ? comments.filter(c => c.debate_side === "a") : [];
  const sideBComments = debate ? comments.filter(c => c.debate_side === "b") : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-lg mx-auto rounded-t-3xl overflow-hidden flex flex-col"
        style={{ backgroundColor: "var(--bg-modal)", maxHeight: "85vh" }}
        onClick={e => e.stopPropagation()}>
        
        <div className="h-1.5 w-12 rounded-full mx-auto mt-3" style={{ backgroundColor: "var(--border-medium)" }} />
        
        <div className="px-5 py-3 flex items-center justify-between border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
            {debate ? "Arguments" : "Comments"} <span style={{ color: "var(--text-hint)" }}>({allReplies.length})</span>
          </h3>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: "var(--text-hint)" }} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
          {debate && (sideAComments.length > 0 || sideBComments.length > 0) && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <p className="text-xs font-bold mb-2 flex items-center gap-1" style={{ color: "#3C6E5A" }}>
                  🟢 {debate.side_a_label} ({sideAComments.length})
                </p>
                <div className="space-y-2">
                  {sideAComments.slice(0, 3).map(c => (
                    <div key={c.id} className="p-2.5 rounded-xl text-xs leading-snug" style={{ backgroundColor: "#EEF3F0", color: "var(--text-secondary)" }}>
                      <p className="font-semibold text-[10px] mb-0.5" style={{ color: "#3C6E5A" }}>{c.author_name}</p>
                      {c.body}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold mb-2 flex items-center gap-1" style={{ color: "#D98B62" }}>
                  🟠 {debate.side_b_label} ({sideBComments.length})
                </p>
                <div className="space-y-2">
                  {sideBComments.slice(0, 3).map(c => (
                    <div key={c.id} className="p-2.5 rounded-xl text-xs leading-snug" style={{ backgroundColor: "#FFF3E8", color: "var(--text-secondary)" }}>
                      <p className="font-semibold text-[10px] mb-0.5" style={{ color: "#D98B62" }}>{c.author_name}</p>
                      {c.body}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {allReplies.filter(r => !debate || r.debate_side === "neutral" || r.type === "voice").map(reply => {
            const color = getAvatarColor(reply.author_name);
            return (
              <div key={`${reply.type}-${reply.id}`} className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                  style={{ backgroundColor: `${color}22`, color }}>
                  {(reply.author_name?.[0] || "U").toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-1.5 mb-0.5">
                    <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                      {reply.author_name || "Anonymous"}
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--text-hint)" }}>
                      {timeAgo(reply.created_date)}
                    </span>
                  </div>
                  {reply.type === "voice" ? (
                    <VoicePlayer audioUrl={reply.audio_url} />
                  ) : (
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{reply.body}</p>
                  )}
                </div>
              </div>
            );
          })}

          {allReplies.length === 0 && (
            <p className="text-center py-8 text-sm" style={{ color: "var(--text-hint)" }}>
              No replies yet. Be the first!
            </p>
          )}
        </div>

        {user && (
          <div className="px-5 py-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
            {debate && (
              <div className="flex gap-1.5 mb-2">
                {[["a", `🟢 ${debate.side_a_label}`], ["b", `🟠 ${debate.side_b_label}`], ["neutral", "💬 Neutral"]].map(([s, label]) => (
                  <button key={s} onClick={() => setCommentSide(s)}
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all"
                    style={{
                      backgroundColor: commentSide === s ? "var(--accent-primary)" : "transparent",
                      color: commentSide === s ? "#fff" : "var(--text-hint)",
                      borderColor: commentSide === s ? "var(--accent-primary)" : "var(--border-light)",
                    }}>{label}</button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-2 rounded-full" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
              <input value={commentText} onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && commentText.trim() && commentMut.mutate()}
                placeholder="Write a reply..."
                className="flex-1 text-sm bg-transparent outline-none"
                style={{ color: "var(--text-primary)" }} />
              <VoiceRecorder onSend={(blob) => voiceMut.mutate(blob)} />
              {commentText.trim() && (
                <button onClick={() => commentMut.mutate()} disabled={commentMut.isPending}
                  className="p-1 rounded-full transition-all active:scale-90"
                  style={{ color: "var(--accent-primary)" }}>
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}