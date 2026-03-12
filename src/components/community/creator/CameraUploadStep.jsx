import React, { useRef, useState, useEffect } from "react";
import { X, RotateCcw, Zap, Sparkles, Clock, Music, Camera } from "lucide-react";
import MusicLibrarySheet from "../../music/MusicLibrarySheet";

const MODES = ["Photo", "15s", "60s", "3min"];

export default function CameraUploadStep({ onMediaSelected, onClose, setSelectedMode }) {
  const [cameraMode, setCameraMode] = useState("60s");
  const [flashOn, setFlashOn] = useState(false);
  const [frontCamera, setFrontCamera] = useState(false);
  const [stream, setStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [showMusicSheet, setShowMusicSheet] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  const captureInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: frontCamera ? "user" : "environment" },
        audio: false,
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach((t) => t.stop());
    setStream(null);
    setCameraActive(false);
  };

  const getDurationMs = () => {
    const map = { "15s": 15000, "60s": 60000, "3min": 180000 };
    return map[selectedMode] || 60000;
  };

  const takePhoto = () => {
    if (!videoRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    if (frontCamera) {
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, -canvas.width, 0);
    } else {
      ctx.drawImage(videoRef.current, 0, 0);
    }
    canvas.toBlob((blob) => {
      const file = new File([blob], `photo-${Date.now()}.png`, { type: "image/png" });
      handleFiles([file]);
    }, "image/png");
  };

  const startRecording = async () => {
    if (!stream) return;
    try {
      recordedChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" });
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordingTime(0);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        const file = new File([blob], `video-${Date.now()}.webm`, { type: "video/webm" });
        handleFiles([file]);
      };

      mediaRecorder.start();

      const durationMs = getDurationMs();
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((t) => {
          const newTime = t + 1;
          if (newTime * 1000 >= durationMs) {
            mediaRecorder.stop();
            clearInterval(recordingIntervalRef.current);
            setIsRecording(false);
            return 0;
          }
          return newTime;
        });
      }, 1000);
    } catch (err) {
      console.error("Recording error:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      clearInterval(recordingIntervalRef.current);
      setIsRecording(false);
      setRecordingTime(0);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (isRecording) stopRecording();
    };
  }, [frontCamera]);

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    };
  }, []);

  const handleFiles = (files) => {
    if (!files?.length) return;
    const items = Array.from(files).map((file) => ({
      id: Date.now() + Math.random(),
      file,
      preview: URL.createObjectURL(file),
      type: file.type,
      duration: 0,
      edits: {},
    }));
    stopCamera();
    if (setSelectedMode) setSelectedMode(cameraMode);
    onMediaSelected(items);
  };

  const TOOLS = [
    { icon: RotateCcw, label: "Flip", action: () => setFrontCamera((v) => !v) },
    { icon: Zap, label: "Flash", active: flashOn, action: () => setFlashOn((v) => !v) },
    { icon: Sparkles, label: "Beauty", action: () => {} },
    { icon: Clock, label: "Timer", action: () => {} },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: "#000" }}>
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pb-3"
        style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 44px)" }}>
        <button onClick={() => { stopCamera(); onClose(); }}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.15)" }}>
          <X className="w-5 h-5 text-white" />
        </button>
        <button onClick={() => setShowMusicSheet(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white"
          style={{ backgroundColor: selectedTrack ? "rgba(46,107,79,0.75)" : "rgba(0,0,0,0.55)", border: `1px solid ${selectedTrack ? "rgba(76,175,125,0.7)" : "rgba(255,255,255,0.2)"}` }}>
          <Music className="w-4 h-4" />
          {selectedTrack ? selectedTrack.title : "Add Sound"}
        </button>
        <div style={{ width: 40 }} />
      </div>

      {/* Camera viewport */}
      <div className="absolute inset-0">
        {cameraActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: frontCamera ? "scaleX(-1)" : "none" }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4"
            style={{ backgroundColor: "#0d0d0d" }}>
            <div className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "2px dashed rgba(255,255,255,0.2)" }}>
              <Camera className="w-10 h-10 text-white opacity-30" />
            </div>
            <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>
              Tap record or upload from gallery
            </p>
          </div>
        )}
        {/* Vignette */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.55) 100%)" }} />
        {/* Rule of thirds grid */}
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)", backgroundSize: "33.33% 33.33%" }} />
      </div>

      {/* Right side tools */}
      <div className="absolute right-3 z-20 flex flex-col gap-5"
        style={{ top: "50%", transform: "translateY(-50%)" }}>
        {TOOLS.map(({ icon: Icon, label, active, action }) => (
          <button key={label} onClick={action} className="flex flex-col items-center gap-1.5">
            <div className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: active ? "rgba(255,215,0,0.22)" : "rgba(0,0,0,0.55)",
                border: `1.5px solid ${active ? "rgba(255,215,0,0.7)" : "rgba(255,255,255,0.25)"}`,
              }}>
              <Icon className="w-5 h-5" style={{ color: active ? "#FFD700" : "#fff" }} />
            </div>
            <span className="text-white text-[10px] font-semibold drop-shadow">{label}</span>
          </button>
        ))}
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-5"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 28px)", paddingTop: 16 }}>
        {/* Mode pills */}
        <div className="flex justify-center gap-2 mb-6">
          {MODES.map((mode) => (
            <button key={mode} onClick={() => setCameraMode(mode)} disabled={isRecording}
              className="px-5 py-1.5 rounded-full text-sm font-bold transition-all disabled:opacity-50"
              style={{
                backgroundColor: cameraMode === mode ? "#fff" : "rgba(255,255,255,0.16)",
                color: cameraMode === mode ? "#000" : "#fff",
              }}>
              {mode}
            </button>
          ))}
        </div>

        {/* Recording timer */}
        {isRecording && (
          <div className="flex justify-center mb-6">
            <div className="text-white text-lg font-bold">
              {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, "0")}
            </div>
          </div>
        )}

        {/* Record row */}
        <div className="flex items-center justify-between">
          {/* Gallery button */}
          <button onClick={() => galleryInputRef.current?.click()} disabled={isRecording}
            className="flex flex-col items-center gap-1.5 disabled:opacity-50">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
              style={{ backgroundColor: "rgba(255,255,255,0.12)", border: "2px solid rgba(255,255,255,0.25)" }}>
              🖼️
            </div>
            <span className="text-white text-[10px] font-semibold">Gallery</span>
          </button>

          {/* Capture button - Photo or Video */}
          <button onClick={selectedMode === "Photo" ? takePhoto : (isRecording ? stopRecording : startRecording)}
            className="relative flex items-center justify-center active:scale-95 transition-transform"
            style={{ width: 88, height: 88 }}>
            <div className="absolute inset-0 rounded-full"
              style={{ border: "3px solid rgba(255,255,255,0.45)" }} />
            <div className="w-[68px] h-[68px] rounded-full"
              style={{
                backgroundColor: isRecording ? "#E53E3E" : "#fff",
                boxShadow: isRecording ? "0 0 0 10px rgba(229,62,62,0.3)" : "0 4px 12px rgba(0,0,0,0.3)",
              }} />
          </button>

          {/* Balanced spacer */}
          <div style={{ width: 56 }} />
        </div>
      </div>

      <MusicLibrarySheet
        open={showMusicSheet}
        onClose={() => setShowMusicSheet(false)}
        onSelectTrack={(track) => { setSelectedTrack(track); setShowMusicSheet(false); }}
        selectedTrack={selectedTrack}
      />

      {/* Hidden file inputs */}
      <input ref={captureInputRef} type="file" accept="image/*,video/*" capture="environment"
        className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      <input ref={galleryInputRef} type="file" accept="image/*,video/*" multiple
        className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      
      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}