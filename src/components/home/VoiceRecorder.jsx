import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Send, X, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function VoiceRecorder({ postId, user, onSent }) {
  const [state, setState] = useState("idle"); // idle | recording | preview | uploading | error
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, []);

  const startRecording = async () => {
    setErrorMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Pick best supported format
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";

      const options = mimeType ? { mimeType } : {};
      const recorder = new MediaRecorder(stream, options);
      mediaRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onerror = (e) => {
        setErrorMsg(`Recording error: ${e.error}`);
        setState("error");
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (chunksRef.current.length === 0) {
          setErrorMsg("No audio data recorded. Please try again.");
          setState("error");
          return;
        }
        const finalMime = mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: finalMime });
        if (blob.size === 0) {
          setErrorMsg("Failed to create audio file. Please try again.");
          setState("error");
          return;
        }
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setState("preview");
      };

      recorder.start(100);
      setState("recording");
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch (err) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMsg("Microphone permission denied. Please allow it in your browser settings.");
      } else {
        setErrorMsg("Could not start recording. Please try again.");
      }
      setState("error");
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    if (mediaRef.current && mediaRef.current.state !== "inactive") {
      mediaRef.current.stop();
    }
  };

  const send = async () => {
    if (!audioBlob) return;
    setState("uploading");
    const ext = audioBlob.type.includes("mp4") ? "mp4" : "webm";
    const file = new File([audioBlob], `voice.${ext}`, { type: audioBlob.type });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.VoiceReply.create({
      post_id: postId,
      author_email: user?.email || "",
      author_name: user?.full_name || "User",
      audio_url: file_url,
      duration_seconds: duration,
      is_anonymous: false,
    });
    reset();
    onSent();
  };

  const reset = () => {
    clearInterval(timerRef.current);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setErrorMsg("");
    setState("idle");
  };

  if (state === "error") {
    return (
      <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 text-xs text-rose-600 max-w-full">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span className="flex-1 min-w-0 truncate">{errorMsg}</span>
        <button onClick={reset} className="shrink-0 p-1"><X className="w-3 h-3" /></button>
      </div>
    );
  }

  if (state === "preview" || state === "uploading") {
    return (
      <div className="flex items-center gap-2 bg-[#F5F0EB] rounded-xl p-2 w-full">
        <audio src={audioUrl} controls className="h-8 flex-1" style={{ minWidth: 0 }} />
        <span className="text-xs text-[#9B9B9B] shrink-0">{duration}s</span>
        <button
          onClick={send}
          disabled={state === "uploading"}
          className="p-2 bg-[#7C8C6E] text-white rounded-lg shrink-0 disabled:opacity-50"
        >
          {state === "uploading"
            ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <Send className="w-3.5 h-3.5" />
          }
        </button>
        <button onClick={reset} className="p-2 text-[#9B9B9B] rounded-lg shrink-0"><X className="w-3.5 h-3.5" /></button>
      </div>
    );
  }

  if (state === "recording") {
    return (
      <button
        onClick={stopRecording}
        className="flex items-center gap-2 px-3 py-2 bg-rose-100 text-rose-500 rounded-xl border border-rose-200 shrink-0"
      >
        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
        <span className="text-xs font-medium">{duration}s</span>
        <Square className="w-3.5 h-3.5" />
      </button>
    );
  }

  // idle
  return (
    <button
      onClick={startRecording}
      className="p-2.5 rounded-xl bg-[#F5F0EB] text-[#6B6B6B] hover:text-[#7C8C6E] hover:bg-[#EDE9E3] transition-colors shrink-0"
      title="Record voice reply"
    >
      <Mic className="w-4 h-4" />
    </button>
  );
}