import React, { useState, useRef, useEffect } from "react";
import { Mic, X, Send, Play, Pause } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function VoiceRecorder({ onSend, onCancel }) {
  const [state, setState] = useState("idle"); // idle | recording | preview
  const [elapsed, setElapsed] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bars, setBars] = useState(Array(24).fill(3));
  const [uploading, setUploading] = useState(false);

  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const analyserRef = useRef(null);
  const animRef = useRef(null);
  const audioRef = useRef(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    mediaRef.current = recorder;
    chunksRef.current = [];

    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    source.connect(analyser);
    analyserRef.current = analyser;

    recorder.ondataavailable = e => chunksRef.current.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setAudioUrl(URL.createObjectURL(blob));
      setState("preview");
      stream.getTracks().forEach(t => t.stop());
      cancelAnimationFrame(animRef.current);
    };

    recorder.start();
    setState("recording");
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);

    const draw = () => {
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      const newBars = Array.from({ length: 24 }, (_, i) => Math.max(3, Math.round((data[i * 2] / 255) * 40)));
      setBars(newBars);
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    mediaRef.current?.stop();
  };

  const handleSend = async () => {
    if (!audioUrl) return;
    setUploading(true);
    const response = await fetch(audioUrl);
    const blob = await response.blob();
    const file = new File([blob], "voice.webm", { type: "audio/webm" });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUploading(false);
    onSend(file_url);
  };

  useEffect(() => () => {
    clearInterval(timerRef.current);
    cancelAnimationFrame(animRef.current);
    mediaRef.current?.state === "recording" && mediaRef.current.stop();
  }, []);

  const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (state === "idle") {
    return (
      <button onMouseDown={startRecording} onTouchStart={startRecording}
        className="w-11 h-11 rounded-full flex items-center justify-center"
        style={{ backgroundColor: "var(--accent-primary)" }}>
        <Mic className="w-5 h-5 text-white" />
      </button>
    );
  }

  if (state === "recording") {
    return (
      <div className="flex items-center gap-3 flex-1 px-3 py-2 rounded-2xl"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <div className="flex items-end gap-0.5 h-8 flex-1">
          {bars.map((h, i) => (
            <div key={i} className="w-1 rounded-full flex-1" style={{ height: h, backgroundColor: "var(--accent-primary)", transition: "height 0.08s" }} />
          ))}
        </div>
        <span className="text-xs font-mono tabular-nums" style={{ color: "var(--text-secondary)" }}>{fmt(elapsed)}</span>
        <button onClick={onCancel} className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(239,68,68,0.1)" }}>
          <X className="w-4 h-4 text-red-500" />
        </button>
        <button onClick={stopRecording} className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "var(--accent-primary)" }}>
          <Send className="w-3.5 h-3.5 text-white" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 flex-1 px-3 py-2 rounded-2xl"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
      <button onClick={() => {
        if (isPlaying) { audioRef.current?.pause(); setIsPlaying(false); }
        else { audioRef.current?.play(); setIsPlaying(true); }
      }} className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ backgroundColor: "var(--accent-primary)" }}>
        {isPlaying ? <Pause className="w-3.5 h-3.5 text-white" /> : <Play className="w-3.5 h-3.5 text-white" />}
      </button>
      <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
      <div className="flex items-end gap-0.5 h-6 flex-1">
        {bars.map((h, i) => (
          <div key={i} className="w-1 rounded-full flex-1" style={{ height: Math.max(3, h * 0.6), backgroundColor: "var(--border-medium)" }} />
        ))}
      </div>
      <span className="text-xs font-mono" style={{ color: "var(--text-hint)" }}>{fmt(elapsed)}</span>
      <button onClick={onCancel} className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ backgroundColor: "rgba(239,68,68,0.1)" }}>
        <X className="w-4 h-4 text-red-500" />
      </button>
      <button onClick={handleSend} disabled={uploading}
        className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-50"
        style={{ backgroundColor: "var(--accent-primary)" }}>
        <Send className="w-3.5 h-3.5 text-white" />
      </button>
    </div>
  );
}