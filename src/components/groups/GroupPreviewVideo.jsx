import React, { useState, useRef } from "react";
import { Play, Pause, Video, X, Upload, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function GroupPreviewVideo({ group, isAdmin, onUpdated }) {
  const [playing, setPlaying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUploadUI, setShowUploadUI] = useState(false);
  const videoRef = useRef(null);
  const fileRef = useRef(null);

  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
      setPlaying(false);
    } else {
      videoRef.current.play();
      setPlaying(true);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.Group.update(group.id, { preview_video_url: file_url });
    setUploading(false);
    setShowUploadUI(false);
    onUpdated?.({ ...group, preview_video_url: file_url });
    e.target.value = "";
  };

  const handleRemove = async () => {
    await base44.entities.Group.update(group.id, { preview_video_url: null });
    onUpdated?.({ ...group, preview_video_url: null });
    setShowUploadUI(false);
  };

  if (!group.preview_video_url) {
    if (!isAdmin) return null;
    return (
      <div className="mx-4 mt-3">
        <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleUpload} />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed text-sm font-semibold transition-all"
          style={{ borderColor: "var(--border-medium)", color: "var(--text-hint)", backgroundColor: "var(--bg-subtle)" }}>
          {uploading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading preview…</>
            : <><Video className="w-4 h-4" /> Add Group Preview Video</>}
        </button>
        <p className="text-center text-[11px] mt-1.5" style={{ color: "var(--text-hint)" }}>
          Short clip showing what your group does (e.g. yoga session, run, meetup)
        </p>
      </div>
    );
  }

  return (
    <div className="mx-4 mt-3 rounded-2xl overflow-hidden relative"
      style={{ border: "2px solid var(--border-light)", backgroundColor: "#000" }}>
      {/* Badge */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold text-white"
        style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}>
        <Video className="w-2.5 h-2.5" /> Group Preview
      </div>

      {/* Admin controls */}
      {isAdmin && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
          <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleUpload} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold text-white"
            style={{ backgroundColor: "rgba(46,107,79,0.75)", backdropFilter: "blur(6px)" }}>
            {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            {uploading ? "…" : "Change"}
          </button>
          <button onClick={handleRemove}
            className="w-6 h-6 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: "rgba(220,53,69,0.7)", backdropFilter: "blur(6px)" }}>
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Video */}
      <video
        ref={videoRef}
        src={group.preview_video_url}
        className="w-full"
        style={{ maxHeight: 240, objectFit: "cover", display: "block" }}
        playsInline
        loop
        muted
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
      />

      {/* Play / Pause overlay */}
      <button
        onClick={handleTogglePlay}
        className="absolute inset-0 flex items-center justify-center transition-opacity"
        style={{ opacity: playing ? 0 : 1 }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}>
          {playing ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
        </div>
      </button>
    </div>
  );
}