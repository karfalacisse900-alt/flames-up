import React, { useState, useRef } from "react";
import { Play, Pause } from "lucide-react";

export default function VoiceBubble({ audioUrl, duration, authorName, isAnonymous }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setProgress((audioRef.current.currentTime / (audioRef.current.duration || 1)) * 100);
  };

  const handleEnded = () => { setPlaying(false); setProgress(0); };

  return (
    <div className="flex items-center gap-2 bg-[#F5F0EB] rounded-xl px-3 py-2 max-w-[240px]">
      <button onClick={toggle} className="w-8 h-8 rounded-full bg-[#7C8C6E] text-white flex items-center justify-center shrink-0">
        {playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="h-1.5 bg-[#EDE9E3] rounded-full overflow-hidden">
          <div className="h-full bg-[#7C8C6E] rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-[10px] text-[#9B9B9B] mt-1">
          {isAnonymous ? "Anonymous" : authorName} · {duration || 0}s
        </p>
      </div>
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
    </div>
  );
}