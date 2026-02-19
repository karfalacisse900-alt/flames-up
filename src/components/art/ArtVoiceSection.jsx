import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Mic, Square, Play, Pause, Trash2, Send, Loader2 } from "lucide-react";

function ArtVoiceBubble({ comment, canDelete, onDelete }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [realDuration, setRealDuration] = useState(comment.duration_seconds || 0);
  const audioRef = useRef(null);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setProgress((audioRef.current.currentTime / (audioRef.current.duration || 1)) * 100);
  };

  const handleEnded = () => { setPlaying(false); setProgress(0); };
  const handleLoaded = () => { if (audioRef.current?.duration) setRealDuration(Math.round(audioRef.current.duration)); };

  const seekTo = (e) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pct * (audioRef.current.duration || 0);
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div className="flex items-center gap-3 group">
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
        style={{ backgroundColor: "var(--bg-card)", color: "var(--accent-primary)" }}>
        {comment.is_anonymous ? "?" : (comment.author_name?.[0]?.toUpperCase() || "?")}
      </div>
      <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
        <button onClick={toggle} className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white"
          style={{ backgroundColor: "var(--accent-primary)" }}>
          {playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
        </button>
        <div className="flex-1 h-1.5 rounded-full cursor-pointer" style={{ backgroundColor: "var(--border-medium)" }} onClick={seekTo}>
          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: "var(--accent-primary)" }} />
        </div>
        <span className="text-[10px] shrink-0" style={{ color: "var(--text-hint)" }}>{fmt(realDuration)}</span>
        {canDelete && (
          <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Trash2 className="w-3.5 h-3.5" style={{ color: "var(--text-hint)" }} />
          </button>
        )}
      </div>
      <audio ref={audioRef} src={comment.audio_url} onTimeUpdate={handleTimeUpdate} onEnded={handleEnded} onLoadedMetadata={handleLoaded} preload="metadata" />
    </div>
  );
}

export default function ArtVoiceSection({ artId, user }) {
  const queryClient = useQueryClient();
  const [recording, setRecording] = useState(false);
  const [blob, setBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const previewAudioRef = useRef(null);
  const [previewPlaying, setPreviewPlaying] = useState(false);

  const { data: comments = [] } = useQuery({
    queryKey: ["artVoiceComments", artId],
    queryFn: () => base44.entities.ArtVoiceComment.filter({ art_id: artId }, "-created_date"),
    enabled: !!artId,
  });

  useEffect(() => () => {
    clearInterval(timerRef.current);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const getMimeType = () => {
    const types = ["audio/webm", "audio/mp4", "audio/ogg", "audio/wav"];
    return types.find(t => MediaRecorder.isTypeSupported(t)) || "";
  };

  const startRecording = async () => {
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      alert("Microphone access denied. Please allow microphone access and try again.");
      return;
    }
    const mimeType = getMimeType();
    const options = mimeType ? { mimeType } : {};
    const mr = new MediaRecorder(stream, options);
    mediaRef.current = mr;
    chunksRef.current = [];
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const b = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
      setBlob(b);
      setPreviewUrl(URL.createObjectURL(b));
      stream.getTracks().forEach((t) => t.stop());
    };
    mr.start(100);
    setRecording(true);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
    clearInterval(timerRef.current);
  };

  const sendComment = async () => {
    if (!blob) return;
    setUploading(true);
    const mimeType = blob.type || "audio/webm";
    const ext = mimeType.includes("mp4") ? "mp4" : mimeType.includes("ogg") ? "ogg" : mimeType.includes("wav") ? "wav" : "webm";
    const file = new File([blob], `art_voice.${ext}`, { type: mimeType });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.ArtVoiceComment.create({
      art_id: artId,
      audio_url: file_url,
      duration_seconds: elapsed,
      author_email: user?.email || "",
      author_name: user?.full_name || "Anonymous",
      is_anonymous: false,
    });
    setBlob(null);
    setPreviewUrl(null);
    setElapsed(0);
    setPreviewPlaying(false);
    setUploading(false);
    queryClient.invalidateQueries({ queryKey: ["artVoiceComments", artId] });
  };

  const discardPreview = () => {
    setBlob(null);
    setPreviewUrl(null);
    setElapsed(0);
    setPreviewPlaying(false);
  };

  const togglePreview = () => {
    if (!previewAudioRef.current) return;
    if (previewPlaying) { previewAudioRef.current.pause(); setPreviewPlaying(false); }
    else { previewAudioRef.current.play(); setPreviewPlaying(true); }
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="mt-5">
      <p className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: "var(--text-hint)" }}>Voice Comments</p>

      {/* Comments list */}
      <div className="space-y-2 mb-4">
        {comments.length === 0 && !recording && !blob && (
          <p className="text-xs text-center py-3" style={{ color: "var(--text-hint)" }}>No voice comments yet</p>
        )}
        {comments.map((c) => (
          <ArtVoiceBubble
            key={c.id}
            comment={c}
            canDelete={user?.email === c.author_email}
            onDelete={async () => {
              await base44.entities.ArtVoiceComment.delete(c.id);
              queryClient.invalidateQueries({ queryKey: ["artVoiceComments", artId] });
            }}
          />
        ))}
      </div>

      {/* Recording controls */}
      {user && (
        <div className="flex items-center gap-3">
          {!recording && !blob && (
            <button
              onClick={startRecording}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: "var(--accent-primary)" }}
            >
              <Mic className="w-4 h-4" /> Add voice comment
            </button>
          )}

          {recording && (
            <>
              <div className="flex items-center gap-2 px-3 py-2 rounded-full" style={{ backgroundColor: "rgba(220,60,60,0.08)", border: "1px solid rgba(220,60,60,0.2)" }}>
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-mono text-red-600">{fmt(elapsed)}</span>
              </div>
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white bg-red-500"
              >
                <Square className="w-3.5 h-3.5" /> Stop
              </button>
            </>
          )}

          {blob && !recording && (
            <div className="flex items-center gap-2 flex-1">
              <button
                onClick={togglePreview}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: "var(--accent-primary)" }}
              >
                {previewPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
              </button>
              <span className="text-xs" style={{ color: "var(--text-hint)" }}>{fmt(elapsed)}</span>
              <button
                onClick={discardPreview}
                className="p-1.5 rounded-full"
                style={{ color: "var(--text-hint)" }}
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={sendComment}
                disabled={uploading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-white ml-auto"
                style={{ backgroundColor: "var(--accent-primary)" }}
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {uploading ? "Sending..." : "Send"}
              </button>
              <audio ref={previewAudioRef} src={previewUrl} onEnded={() => setPreviewPlaying(false)} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}