import React, { useState, useRef } from "react";
import { Mic, Square, Send, X, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * Generic voice comment component — posts to ArtComment entity with audio_url
 */
export default function ArtVoiceComment({ artworkId, user, onSent }) {
  const [state, setState] = useState("idle"); // idle | recording | preview | uploading | error
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  const reset = () => {
    clearInterval(timerRef.current);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null); setAudioUrl(null); setDuration(0); setErrorMsg(""); setState("idle");
  };

  const startRecording = async () => {
    setErrorMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data?.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob); setAudioUrl(url); setState("preview");
      };
      recorder.start(100);
      setState("recording"); setDuration(0);
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } catch (err) {
      setErrorMsg(err.name === "NotAllowedError" ? "Microphone permission denied." : "Could not start recording.");
      setState("error");
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    if (mediaRef.current?.state !== "inactive") mediaRef.current.stop();
  };

  const send = async () => {
    if (!audioBlob) return;
    setState("uploading");
    const ext = audioBlob.type.includes("mp4") ? "mp4" : "webm";
    const file = new File([audioBlob], `voice.${ext}`, { type: audioBlob.type });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.ArtComment.create({
      artwork_id: artworkId,
      user_email: user?.email || "",
      user_name: user?.full_name || "Artist",
      text: "🎙️ Voice comment",
      audio_url: file_url,
      duration_seconds: duration,
    });
    reset();
    onSent?.();
  };

  if (state === "error") return (
    <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs" style={{ backgroundColor: "#FFF0F0", color: "#E07070" }}>
      <AlertCircle className="w-4 h-4 shrink-0" />
      <span className="flex-1 min-w-0 truncate">{errorMsg}</span>
      <button onClick={reset}><X className="w-3 h-3" /></button>
    </div>
  );

  if (state === "preview" || state === "uploading") return (
    <div className="flex items-center gap-2 rounded-xl p-2 w-full" style={{ backgroundColor: "#E6EFEA" }}>
      <audio src={audioUrl} controls className="h-8 flex-1" style={{ minWidth: 0 }} />
      <span className="text-xs shrink-0" style={{ color: "#A0A0A0" }}>{duration}s</span>
      <button onClick={send} disabled={state === "uploading"} className="p-2 rounded-lg shrink-0" style={{ backgroundColor: "#3C6E5A", color: "#fff" }}>
        {state === "uploading" ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-3.5 h-3.5" />}
      </button>
      <button onClick={reset} className="p-2 rounded-lg shrink-0" style={{ color: "#A0A0A0" }}><X className="w-3.5 h-3.5" /></button>
    </div>
  );

  if (state === "recording") return (
    <button onClick={stopRecording} className="flex items-center gap-1.5 px-3 py-2 rounded-xl shrink-0" style={{ backgroundColor: "#FFF0F0", color: "#E07070", border: "1px solid #E07070" }}>
      <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#E07070" }} />
      <span className="text-xs font-medium">{duration}s</span>
      <Square className="w-3.5 h-3.5" />
    </button>
  );

  return (
    <button onClick={startRecording} className="p-2.5 rounded-xl shrink-0" style={{ backgroundColor: "#EEF3F0", color: "#6B6B6B" }} title="Voice comment">
      <Mic className="w-4 h-4" />
    </button>
  );
}