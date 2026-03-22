import React, { useEffect, useRef, useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * Shows a "Processing video…" banner while the Cloudflare Stream video
 * is not yet ready. Polls the backend every 8 seconds, and auto-updates
 * the post in the database when ready (triggering real-time subscription).
 */
export default function VideoProcessingBanner({ postId, videoId, thumbnail, onReady }) {
  const [status, setStatus] = useState("processing"); // processing | ready | error
  const intervalRef = useRef(null);
  const maxAttempts = 30; // ~4 minutes
  const attempts = useRef(0);

  useEffect(() => {
    if (!postId || !videoId) return;

    const checkStatus = async () => {
      attempts.current += 1;
      if (attempts.current > maxAttempts) {
        clearInterval(intervalRef.current);
        setStatus("error");
        return;
      }
      try {
        const res = await base44.functions.invoke("checkVideoStatus", { video_id: videoId });
        const state = res.data?.status;
        if (state === "ready") {
          clearInterval(intervalRef.current);
          // Update the post so all clients see it via real-time subscription
          await base44.entities.CommunityPost.update(postId, { video_status: "ready" });
          setStatus("ready");
          setTimeout(() => onReady?.(), 600);
        }
      } catch (_) {}
    };

    // Check immediately, then every 8s
    checkStatus();
    intervalRef.current = setInterval(checkStatus, 8000);
    return () => clearInterval(intervalRef.current);
  }, [postId, videoId]);

  if (status === "ready") {
    return (
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none"
        style={{ zIndex: 10, background: "rgba(0,0,0,0.4)", borderRadius: 0, animation: "fadeOut 0.6s 0.5s ease forwards" }}
      >
        <CheckCircle2 className="w-10 h-10 text-green-400" />
        <span className="text-white text-sm font-semibold">Video ready!</span>
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-3"
      style={{ zIndex: 10, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
    >
      {thumbnail && (
        <img
          src={thumbnail}
          alt=""
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: "cover", zIndex: -1, opacity: 0.4 }}
        />
      )}
      <Loader2 className="w-9 h-9 text-white animate-spin" />
      <div className="text-center">
        <p className="text-white font-semibold text-sm">Processing video…</p>
        <p className="text-white/60 text-xs mt-0.5">This usually takes under a minute</p>
      </div>
      <style>{`
        @keyframes fadeOut {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
      `}</style>
    </div>
  );
}