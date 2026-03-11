import React, { useState, useRef } from "react";
import { Send, Mic, Square, Paperclip, X, MapPin, Image, Smile } from "lucide-react";
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
    <div style={{ backgroundColor: "#F0F0F0", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>

      {/* Reply strip */}
      {replyTo && (
        <div className="flex items-center gap-2 px-4 py-2" style={{ backgroundColor: "#fff", borderTop: "1px solid #E0E0E0" }}>
          <div className="flex-1 border-l-4 pl-3 py-1 rounded" style={{ borderLeftColor: "#25D366", backgroundColor: "#F5F5F5" }}>
            <p className="text-[12px] font-semibold" style={{ color: "#25D366" }}>Replying</p>
            <p className="text-[13px] truncate" style={{ color: "#555" }}>{replyTo.text || "Voice message"}</p>
          </div>
          <button onClick={onCancelReply} className="p-1">
            <X className="w-4 h-4" style={{ color: "#999" }} />
          </button>
        </div>
      )}

      {/* GIF panel */}
      {showGif && (
        <div className="px-3 py-2" style={{ backgroundColor: "#fff", borderTop: "1px solid #E0E0E0" }}>
          <div className="flex gap-2 mb-2">
            <input value={gifQuery} onChange={e => setGifQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && searchGifs()}
              placeholder="Search GIFs…"
              className="flex-1 px-3 py-2 rounded-full text-sm outline-none"
              style={{ backgroundColor: "#F5F5F5", border: "none", color: "#111" }} />
            <button onClick={searchGifs} className="px-4 py-2 rounded-full text-sm font-semibold text-white"
              style={{ backgroundColor: "#25D366" }}>Search</button>
            <button onClick={() => { setShowGif(false); setGifs([]); }}>
              <X className="w-5 h-5" style={{ color: "#999" }} />
            </button>
          </div>
          {loadingGifs ? (
            <p className="text-xs text-center py-2" style={{ color: "#999" }}>Searching…</p>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
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
        <div className="grid grid-cols-3 gap-3 px-6 py-4" style={{ backgroundColor: "#fff", borderTop: "1px solid #E0E0E0" }}>
          {[
            { icon: Image, label: "Photo & Video", color: "#E040FB", action: () => fileRef.current?.click() },
            { icon: Smile, label: "GIF", color: "#FF9800", action: () => { setShowAttach(false); setShowGif(true); } },
            { icon: MapPin, label: "Location", color: "#F44336", action: shareLocation },
          ].map(({ icon: Icon, label, color, action }) => (
            <button key={label} onClick={action} className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ backgroundColor: color }}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-[12px] font-medium" style={{ color: "#555" }}>{label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Recording indicator */}
      {recording && (
        <div className="flex items-center gap-3 px-5 py-2" style={{ backgroundColor: "#fff", borderTop: "1px solid #E0E0E0" }}>
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#F44336" }} />
          <span className="text-sm font-medium" style={{ color: "#F44336" }}>Recording… tap stop when done</span>
        </div>
      )}

      {/* Main input row */}
      <div className="flex items-end gap-2 px-2 py-2">
        {/* Left: paperclip + emoji */}
        <div className="flex items-center gap-1">
          <button onClick={() => { setShowAttach(v => !v); setShowGif(false); }}
            className="w-10 h-10 flex items-center justify-center rounded-full"
            style={{ backgroundColor: showAttach ? "#25D366" : "#fff" }}>
            {showAttach
              ? <X className="w-5 h-5" style={{ color: "#fff" }} />
              : <Paperclip className="w-5 h-5" style={{ color: "#666" }} />}
          </button>
        </div>

        {/* Text input */}
        <div className="flex-1 flex items-end rounded-3xl px-4 py-2"
          style={{ backgroundColor: "#fff", minHeight: 44, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <textarea
            ref={textRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={disabled ? "You have blocked this user" : uploading ? "Uploading…" : "Message"}
            disabled={disabled || uploading}
            rows={1}
            className="flex-1 bg-transparent text-sm resize-none outline-none"
            style={{ color: "#111", maxHeight: 120, lineHeight: "1.5", paddingTop: 2 }}
          />
        </div>

        {/* Right: send or mic */}
        {text.trim() ? (
          <button onClick={handleSend}
            className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#25D366", boxShadow: "0 2px 6px rgba(37,211,102,0.4)" }}>
            <Send className="w-5 h-5 text-white" />
          </button>
        ) : (
          <button
            onPointerDown={startRecording}
            onPointerUp={stopRecording}
            disabled={disabled}
            className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
            style={{
              backgroundColor: recording ? "#F44336" : "#25D366",
              boxShadow: `0 2px 6px ${recording ? "rgba(244,67,54,0.4)" : "rgba(37,211,102,0.4)"}`,
            }}>
            {recording ? <Square className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
          </button>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileChange} />
    </div>
  );
}