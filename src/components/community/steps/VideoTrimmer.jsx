import React, { useRef, useState, useEffect } from "react";
import { X, Check } from "lucide-react";

export default function VideoTrimmer({ videoFile, maxDurationMs, onTrimmed, onCancel }) {
  const videoRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [isTrimming, setIsTrimming] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleLoadedMetadata = () => {
      const totalDuration = Math.floor(video.duration * 1000);
      const maxDuration = maxDurationMs || totalDuration;
      const clamped = Math.min(totalDuration, maxDuration);
      setDuration(totalDuration);
      setEndTime(clamped);
    };
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    return () => video.removeEventListener("loadedmetadata", handleLoadedMetadata);
  }, [maxDurationMs]);

  const maxDuration = maxDurationMs || duration;
  const trimDurationMs = endTime - startTime;

  const handleTrim = async () => {
    if (!videoFile || trimDurationMs < 1000) return;
    setIsTrimming(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0);
      const trimmedFile = new File([videoFile], videoFile.name, { type: "video/webm" });
      trimmedFile.startTime = startTime;
      trimmedFile.endTime = endTime;
      onTrimmed(trimmedFile);
    } catch (err) {
      console.error("Trim error:", err);
    } finally {
      setIsTrimming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black" style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 16px)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <button onClick={onCancel} className="p-2 hover:bg-gray-800 rounded">
          <X className="w-5 h-5 text-white" />
        </button>
        <h2 className="text-white font-semibold">Trim Video</h2>
        <div className="w-10" />
      </div>

      {/* Video preview */}
      <div className="flex-1 flex items-center justify-center bg-black p-4 overflow-hidden">
        <video
          ref={videoRef}
          src={URL.createObjectURL(videoFile)}
          className="max-w-full max-h-full rounded-lg"
          controls
        />
      </div>

      {/* Trimmer controls */}
      <div className="bg-gray-900 p-4 border-t border-gray-700">
        {/* Info */}
        <div className="text-white text-sm mb-4">
          <p>Duration: {(trimDurationMs / 1000).toFixed(1)}s / {(maxDuration / 1000).toFixed(0)}s max</p>
          {trimDurationMs > maxDuration && (
            <p className="text-red-400 mt-1">⚠️ Exceeds max duration</p>
          )}
        </div>

        {/* Start time slider */}
        <div className="mb-4">
          <label className="text-white text-xs font-semibold block mb-2">Start: {(startTime / 1000).toFixed(1)}s</label>
          <input
            type="range"
            min="0"
            max={duration}
            value={startTime}
            onChange={(e) => {
              const newStart = parseInt(e.target.value);
              if (newStart < endTime) setStartTime(newStart);
            }}
            className="w-full"
          />
        </div>

        {/* End time slider */}
        <div className="mb-4">
          <label className="text-white text-xs font-semibold block mb-2">End: {(endTime / 1000).toFixed(1)}s</label>
          <input
            type="range"
            min="0"
            max={duration}
            value={endTime}
            onChange={(e) => {
              const newEnd = parseInt(e.target.value);
              if (newEnd > startTime) setEndTime(Math.min(newEnd, startTime + maxDuration));
            }}
            className="w-full"
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg bg-gray-700 text-white font-semibold hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleTrim}
            disabled={trimDurationMs > maxDuration || isTrimming}
            className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            {isTrimming ? "Trimming..." : "Done"}
          </button>
        </div>
      </div>
    </div>
  );
}