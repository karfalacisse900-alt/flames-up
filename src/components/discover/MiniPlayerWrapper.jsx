import React from "react";
import { MiniStickyPlayer } from "./AudioPreviewPlayer";
import { useAudio } from "@/components/AudioContext";

export default function MiniPlayerWrapper() {
  const { currentTrack, setCurrentTrack } = useAudio();
  
  return <MiniStickyPlayer track={currentTrack} onClose={() => setCurrentTrack(null)} />;
}