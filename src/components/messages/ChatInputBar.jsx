import React, { useState, useRef } from "react";
import { Send, Mic, Square, Image, X, MapPin } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ChatInputBar({ onSendText, onSendVoice, onSendMedia, onSendGif, onSendLocation, replyTo, onCancelReply, disabled }) {
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [showGif, setShowGif] = useState(false);
  const [gifQuery, setGifQuery] = useState("");
  const [gifs, setGifs] = useState([]);
  const [loadingGifs, setLoadingGifs] = useState(false);
  const [uploading, setUploading] = useState(false);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const fileRef = useRef(null);
  const textRef = useRef(null);

  const handleSend = () => {
    if (!text.trim()) return;
    onSendText(text.trim());
    setText("");
    textRef.current?.focus();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRef.current = new MediaRecorder(stream);
      chunksRef.current = [];
      mediaRef.current.ondataavailable = (e) => chunksRef.current.push(e.data);
      mediaRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], "voice.webm", { type: "audio/webm" });
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        onSendVoice(file_url);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRef.current.start();
      setRecording(true);
    } catch { alert("Microphone permission denied"); }
  };

  const stopRecording = () => { mediaRef.current?.stop(); setRecording(false); };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setShowAttach(false);
    setUploading(true);
    const urls = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      urls.push(file_url);
    }
    onSendMedia(urls);
    setUploading(false);
    e.target.value = "";
  };

  const searchGifs = async () => {
    if (!gifQuery.trim()) return;
    setLoadingGifs(true);
    try {
      const res = await base44.functions.invoke("giphySearch", { query: gifQuery });
      const data = res.data?.gifs || res.data?.results || res.data?.data || [];
      setGifs(data);
    } catch { setGifs([]); }
    setLoadingGifs(false);
  };

  const shareLocation = () => {
    setShowAttach(false);
    navigator.geolocation?.getCurrentPosition(
      pos => onSendLocation?.({ lat: pos.coords.latitude, lng: pos.coords.longitude, name: "Current location" }),
      () => alert("Location permission denied")
    );
  };

  return (
    <div style={{ backgroundColor: "var(--bg-nav)", borderTop: "1px solid var(--border-light)" }}>
      {/* Reply strip */}
      {replyTo && (
        <div className="flex items-center gap-2 px-4 py-2 border-b" style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-subtle)" }}>
          <div className="flex-1 border-l-2 pl-2 text-xs truncate"
            style={{ borderLeftColor: "var(--accent-primary)", color: "var(--text-secondary)" }}>
            ↩ Replying: {replyTo.text || "Voice message"}
          </div>
          <button onClick={onCancelReply}><X className="w-3.5 h-3.5" style={{ color: "var(--text-hint)" }} /></button>
        </div>
      )}

      {/* GIF panel */}
      {showGif && (
        <div className="px-3 py-2 border-b" style={{ borderColor: "var(--border-light)" }}>
          <div className="flex gap-2 mb-2">
            <input value={gifQuery} onChange={e => setGifQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && searchGifs()}
              placeholder="Search GIFs..." className="flex-1 px-3 py-1.5 rounded-xl text-sm outline-none"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
            <button onClick={searchGifs} className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
              style={{ backgroundColor: "var(--accent-primary)" }}>Go</button>
            <button onClick={() => { setShowGif(false); setGifs([]); }}>
              <X className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
            </button>
          </div>
          {loadingGifs ? (
            <p className="text-xs text-center py-2" style={{ color: "var(--text-hint)" }}>Searching…</p>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {gifs.map((gif, i) => {
                const url = gif.images?.fixed_height?.url || gif.url || gif;
                return (
                  <button key={i} onClick={() => { onSendGif?.(url); setShowGif(false); setGifs([]); }}
                    className="shrink-0 rounded-xl overflow-hidden">
                    <img src={url} alt="" className="h-20 w-auto rounded-xl" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Attach panel */}
      {showAttach && (
        <div className="flex gap-3 px-4 py-3 border-b" style={{ borderColor: "var(--border-light)" }}>
          {[
            { icon: "🖼️", label: "Photo/Video", action: () => fileRef.current?.click() },
            { icon: "GIF", label: "GIF", action: () => { setShowAttach(false); setShowGif(true); } },
            { icon: "📍", label: "Location", action: shareLocation },
          ].map(({ icon, label, action }) => (
            <button key={label} onClick={action}
              className="flex flex-col items-center gap-1 p-3 rounded-2xl flex-1"
              style={{ backgroundColor: "var(--bg-subtle)" }}>
              <span className="text-xl">{icon}</span>
              <span className="text-[10px] font-medium" style={{ color: "var(--text-secondary)" }}>{label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main row */}
      <div className="flex items-end gap-2 px-3 py-2.5"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)" }}>
        <button onClick={() => { setShowAttach(v => !v); setShowGif(false); }}
          className="p-2.5 rounded-full shrink-0"
          style={{ backgroundColor: showAttach ? "var(--accent-primary-light)" : "var(--bg-subtle)", color: showAttach ? "var(--accent-primary)" : "var(--text-secondary)" }}>
          {showAttach ? <X className="w-4 h-4" /> : <Image className="w-4 h-4" />}
        </button>

        <textarea ref={textRef} value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder={disabled ? "Blocked" : uploading ? "Uploading…" : "Message…"}
          disabled={disabled || uploading}
          rows={1}
          className="flex-1 px-4 py-2.5 rounded-2xl text-sm resize-none outline-none"
          style={{
            backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)",
            color: "var(--text-primary)", maxHeight: 120, minHeight: 42, lineHeight: "1.4",
          }} />

        {text.trim() ? (
          <button onClick={handleSend} className="p-2.5 rounded-full shrink-0"
            style={{ backgroundColor: "var(--accent-primary)" }}>
            <Send className="w-4 h-4 text-white" />
          </button>
        ) : (
          <button onPointerDown={startRecording} onPointerUp={stopRecording}
            disabled={disabled}
            className={`p-2.5 rounded-full shrink-0 ${recording ? "animate-pulse" : ""}`}
            style={{ backgroundColor: recording ? "rgba(224,92,122,0.2)" : "var(--bg-subtle)", color: recording ? "#E05C7A" : "var(--text-secondary)" }}>
            {recording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileChange} />
    </div>
  );
}