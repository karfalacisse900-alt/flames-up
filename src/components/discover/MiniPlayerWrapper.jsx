import React from "react";
import { MiniStickyPlayer } from "./AudioPreviewPlayer";
import { useAudio } from "@/components/AudioContext";

export default function MiniPlayerWrapper() {
  const audioContext = useAudio();
  if (!audioContext) return null;
  
  const { currentTrack, setCurrentTrack } = audioContext;
  return <MiniStickyPlayer track={currentTrack} onClose={() => setCurrentTrack(null)} />;
}