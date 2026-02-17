import React, { useState, useRef } from "react";
import { Play, Pause, Trash2 } from "lucide-react";

export default function VoiceBubble({ audioUrl, duration, authorName, isAnonymous, canDelete, onDelete }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [realDuration, setRealDuration] = useState(duration || 0);
  const audioRef = useRef(null);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const dur = audioRef.current.duration || realDuration || 1;
    setCurrentTime(Math.floor(audioRef.current.currentTime));
    setProgress((audioRef.current.currentTime / dur) * 100);
  };

  const handleLoaded = () => {
    if (audioRef.current?.duration && isFinite(audioRef.current.duration)) {
      setRealDuration(Math.round(audioRef.current.duration));
    }
  };

  const handleEnded = () => { setPlaying(false); setProgress(0); setCurrentTime(0); };

  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="flex items-center gap-2 bg-[#F5F0EB] rounded-2xl px-3 py-2.5 max-w-[260px] group">
      <button
        onClick={toggle}
        className="w-9 h-9 rounded-full bg-[#7C8C6E] text-white flex items-center justify-center shrink-0 active:scale-95 transition-transform"
      >
        {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div
          className="h-1.5 bg-[#EDE9E3] rounded-full overflow-hidden cursor-pointer"
          onClick={(e) => {
            if (!audioRef.current) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            audioRef.current.currentTime = pct * (audioRef.current.duration || 0);
          }}
        >
          <div className="h-full bg-[#7C8C6E] rounded-full transition-all duration-100" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-[10px] text-[#9B9B9B]">{isAnonymous ? "Anonymous" : authorName}</p>
          <p className="text-[10px] text-[#9B9B9B]">{playing ? fmtTime(currentTime) : fmtTime(realDuration)}</p>
        </div>
      </div>
      {canDelete && (
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-rose-400 hover:text-rose-600 shrink-0"
          title="Delete voice comment"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadedMetadata={handleLoaded}
      />
    </div>
  );
}