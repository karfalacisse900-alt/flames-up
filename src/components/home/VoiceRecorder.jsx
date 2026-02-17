import React, { useState, useRef } from "react";
import { Mic, MicOff, Send, Square } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function VoiceRecorder({ postId, user, onSent }) {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRef.current = new MediaRecorder(stream);
    chunksRef.current = [];
    mediaRef.current.ondataavailable = (e) => chunksRef.current.push(e.data);
    mediaRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setAudioBlob(blob);
      setAudioUrl(URL.createObjectURL(blob));
      stream.getTracks().forEach((t) => t.stop());
    };
    mediaRef.current.start();
    setRecording(true);
    setDuration(0);
    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
    clearInterval(timerRef.current);
  };

  const send = async () => {
    if (!audioBlob) return;
    setUploading(true);
    const file = new File([audioBlob], "voice.webm", { type: "audio/webm" });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.VoiceReply.create({
      post_id: postId,
      author_email: user?.email || "",
      author_name: user?.full_name || "User",
      audio_url: file_url,
      duration_seconds: duration,
      is_anonymous: false,
    });
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setUploading(false);
    onSent();
  };

  const cancel = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
  };

  if (audioUrl) {
    return (
      <div className="flex items-center gap-2 bg-[#F5F0EB] rounded-xl p-2">
        <audio src={audioUrl} controls className="h-8 flex-1" style={{ minWidth: 0 }} />
        <button onClick={send} disabled={uploading} className="p-2 bg-[#7C8C6E] text-white rounded-lg shrink-0">
          <Send className="w-3.5 h-3.5" />
        </button>
        <button onClick={cancel} className="p-2 text-[#9B9B9B] rounded-lg shrink-0">✕</button>
      </div>
    );
  }

  return (
    <button
      onPointerDown={startRecording}
      onPointerUp={stopRecording}
      className={`p-2.5 rounded-xl transition-colors ${
        recording ? "bg-rose-100 text-rose-500 animate-pulse" : "bg-[#F5F0EB] text-[#6B6B6B] hover:text-[#7C8C6E]"
      }`}
      title="Hold to record voice"
    >
      {recording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
    </button>
  );
}