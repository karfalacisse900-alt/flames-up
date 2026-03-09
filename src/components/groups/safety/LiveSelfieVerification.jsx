import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Camera, CheckCircle, RotateCcw } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function LiveSelfieVerification({ user, onVerified, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [phase, setPhase] = useState("intro"); // intro | camera | preview | uploading | done
  const [capturedUrl, setCapturedUrl] = useState(null);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(null);

  const startCamera = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 640 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setPhase("camera");
    } catch (e) {
      setError("Camera access denied. Please allow camera permissions and try again.");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  useEffect(() => () => stopCamera(), []);

  const startCountdown = () => {
    setCountdown(3);
    let n = 3;
    const iv = setInterval(() => {
      n--;
      setCountdown(n > 0 ? n : null);
      if (n <= 0) {
        clearInterval(iv);
        capturePhoto();
      }
    }, 1000);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      setCapturedUrl(url);
      stopCamera();
      setPhase("preview");
    }, "image/jpeg", 0.85);
  };

  const retake = () => {
    setCapturedUrl(null);
    setPhase("intro");
  };

  const confirmSelfie = async () => {
    if (!capturedUrl) return;
    setPhase("uploading");
    const canvas = canvasRef.current;
    canvas.toBlob(async (blob) => {
      const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ is_selfie_verified: true, selfie_url: file_url });
      setPhase("done");
      onVerified?.();
    }, "image/jpeg", 0.85);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-end justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      onClick={onClose}>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-lg rounded-t-3xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-card)", maxHeight: "92vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>
        <div className="h-1.5 w-12 rounded-full mx-auto mt-3 mb-1" style={{ backgroundColor: "var(--border-medium)" }} />
        <div className="px-5 pt-2 pb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5" style={{ color: "#9333EA" }} />
              <h2 className="text-base font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Live Selfie Verification</h2>
            </div>
            <button onClick={() => { stopCamera(); onClose(); }}><X className="w-5 h-5" style={{ color: "var(--text-hint)" }} /></button>
          </div>

          {phase === "intro" && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center" style={{ backgroundColor: "#FDF4FF" }}>
                <Camera className="w-8 h-8" style={{ color: "#9333EA" }} />
              </div>
              <h3 className="font-bold text-base" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Take a Live Selfie</h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                We'll use your front camera to take a live photo. This helps attendees trust you at real-world meetups.
              </p>
              <div className="text-left space-y-2 px-2">
                {["Make sure your face is well-lit", "Look straight at the camera", "Remove sunglasses or hats"].map(tip => (
                  <div key={tip} className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                    <span style={{ color: "#9333EA" }}>•</span> {tip}
                  </div>
                ))}
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button onClick={startCamera}
                className="w-full py-3.5 rounded-2xl text-sm font-bold text-white"
                style={{ backgroundColor: "#9333EA", boxShadow: "0 4px 16px rgba(147,51,234,0.3)" }}>
                Open Camera
              </button>
            </div>
          )}

          {phase === "camera" && (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: "1", backgroundColor: "#000" }}>
                <video ref={videoRef} playsInline muted className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
                {/* Face guide circle */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 rounded-full border-4 border-dashed border-white/60" />
                </div>
                {countdown !== null && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <span className="text-7xl font-black text-white">{countdown}</span>
                  </div>
                )}
              </div>
              <canvas ref={canvasRef} className="hidden" />
              <button onClick={startCountdown}
                className="w-full py-3.5 rounded-2xl text-sm font-bold text-white"
                style={{ backgroundColor: "#9333EA" }}>
                📸 Take Selfie (3s timer)
              </button>
              <button onClick={() => { stopCamera(); setPhase("intro"); }}
                className="w-full py-2 text-xs" style={{ color: "var(--text-hint)" }}>
                Cancel
              </button>
            </div>
          )}

          {phase === "preview" && capturedUrl && (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: "1" }}>
                <img src={capturedUrl} alt="Selfie preview" className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
              </div>
              <canvas ref={canvasRef} className="hidden" />
              <p className="text-sm text-center" style={{ color: "var(--text-secondary)" }}>Happy with this photo?</p>
              <div className="flex gap-3">
                <button onClick={retake}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold border"
                  style={{ borderColor: "var(--border-medium)", color: "var(--text-secondary)" }}>
                  <RotateCcw className="w-4 h-4" /> Retake
                </button>
                <button onClick={confirmSelfie}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold text-white"
                  style={{ backgroundColor: "#9333EA" }}>
                  ✅ Use This
                </button>
              </div>
            </div>
          )}

          {phase === "uploading" && (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full border-4 border-purple-500 border-t-transparent animate-spin mx-auto" />
              <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Uploading your selfie…</p>
            </div>
          )}

          {phase === "done" && (
            <div className="py-8 text-center space-y-4">
              <CheckCircle className="w-16 h-16 mx-auto" style={{ color: "#9333EA" }} />
              <h3 className="font-bold text-base" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Selfie Verified! 🎉</h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Your live selfie has been saved to your profile.</p>
              <button onClick={onClose}
                className="w-full py-3.5 rounded-2xl text-sm font-bold text-white"
                style={{ backgroundColor: "#9333EA" }}>
                Done
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}