import React, { useRef, useState } from "react";
import { Upload, Play, X, GripVertical, Cloud, Camera } from "lucide-react";
import { base44 } from "@/api/base44Client";
import CameraUploadStep from "./CameraUploadStep";

export default function MediaUploadStep({ mediaItems, setMediaItems, onNext }) {
  const photoVideoInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);
  const [compressing, setCompressing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [selectedMode, setSelectedMode] = useState("60s");

  const compressMedia = async (file) => {
    try {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      
      // Only compress images and videos
      if (!isImage && !isVideo) return file;

      // For small files (<500KB), skip compression
      if (file.size < 500000) return file;

      setCompressing(true);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', isImage ? 'image' : 'video');
      
      const response = await base44.functions.invoke('compressMedia', formData);
      
      setCompressing(false);
      
      // If compression succeeded and we have a URL, fetch and return as file
      if (response.data?.file_url && response.data?.compressed) {
        const blob = await fetch(response.data.file_url).then(r => r.blob());
        return new File([blob], file.name, { type: file.type });
      }
      
      return file;
    } catch (error) {
      console.error('Compression failed:', error);
      setCompressing(false);
      return file; // Return original on error
    }
  };

  const handleFileSelect = async (files) => {
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        alert("Please select images or videos only");
        continue;
      }

      // Compress before creating preview
      const processedFile = await compressMedia(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target.result;
        const item = {
          id: Date.now() + Math.random(),
          file: processedFile,
          preview,
          type: processedFile.type,
          duration: 0,
          edits: {},
        };

        // Get video duration
        if (processedFile.type.startsWith("video/")) {
          const video = document.createElement("video");
          video.onloadedmetadata = () => {
            item.duration = video.duration;
          };
          video.src = preview;
        }

        setMediaItems((prev) => [...prev, item]);
      };
      reader.readAsDataURL(processedFile);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      e.currentTarget.classList.add("drag-active");
    }
  };

  const handleDragLeave = (e) => {
    dragCounter.current--;
    if (dragCounter.current === 0) {
      e.currentTarget.classList.remove("drag-active");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    dragCounter.current = 0;
    e.currentTarget.classList.remove("drag-active");
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleRemove = (id) => {
    setMediaItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleReorder = (index, direction) => {
    const newItems = [...mediaItems];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newItems.length) return;
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    setMediaItems(newItems);
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Main content */}
      <div className="px-4 pt-6 max-w-2xl mx-auto">
        {mediaItems.length === 0 ? (
          <>
            {/* Empty state - Large upload area */}
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">📸</div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                Add Your Media
              </h2>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Upload photos, videos, or files to share with the community
              </p>
              {compressing && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm" style={{ color: "var(--accent-primary)" }}>
                  <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
                  Compressing media...
                </div>
              )}
            </div>

            {/* Three main buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {/* Photos & Videos */}
              <button
                onClick={() => photoVideoInputRef.current?.click()}
                className="p-6 rounded-2xl flex flex-col items-center gap-3 text-white font-bold transition-all active:scale-95 shadow-lg"
                style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)" }}
              >
                <Cloud className="w-8 h-8" />
                <div>
                  <p className="text-base">📷 Photos</p>
                  <p className="text-xs font-normal opacity-80">& Videos</p>
                </div>
              </button>

              {/* Camera Record */}
              <button
                onClick={() => setShowCamera(true)}
                className="p-6 rounded-2xl flex flex-col items-center gap-3 text-white font-bold transition-all active:scale-95 shadow-lg"
                style={{ background: "linear-gradient(135deg, #E05C2A, #F97316)" }}
              >
                <Camera className="w-8 h-8" />
                <div>
                  <p className="text-base">📷 Camera</p>
                  <p className="text-xs font-normal opacity-80">Record Video</p>
                </div>
              </button>
            </div>

            {/* Drag and drop zone */}
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-3 border-dashed rounded-2xl p-8 text-center transition-all"
              style={{ borderColor: "var(--accent-primary)", backgroundColor: "var(--accent-primary-light)" }}
            >
              <Upload className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--accent-primary)" }} />
              <p className="font-bold mb-1 text-lg" style={{ color: "var(--accent-primary)" }}>
                Drag & Drop Here
              </p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Drop your photos, videos, or files to start
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Selected media preview */}
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-4" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                {mediaItems.length} item{mediaItems.length !== 1 ? "s" : ""} selected
              </h3>
              <div className="space-y-3">
                {mediaItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-4 rounded-2xl transition-all"
                    style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
                  >
                    {/* Reorder controls */}
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleReorder(idx, "up")}
                        disabled={idx === 0}
                        className="px-2 py-1 rounded disabled:opacity-30 font-bold"
                        style={{ color: "var(--accent-primary)" }}
                      >
                        ▲
                      </button>
                      <GripVertical className="w-4 h-4 mx-auto" style={{ color: "var(--text-hint)" }} />
                      <button
                        onClick={() => handleReorder(idx, "down")}
                        disabled={idx === mediaItems.length - 1}
                        className="px-2 py-1 rounded disabled:opacity-30 font-bold"
                        style={{ color: "var(--accent-primary)" }}
                      >
                        ▼
                      </button>
                    </div>

                    {/* Media preview */}
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2" style={{ borderColor: "var(--border-light)" }}>
                      {item.type.startsWith("video") ? (
                        <>
                          <video src={item.preview} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.3)" }}>
                            <Play className="w-4 h-4 text-white fill-white" />
                          </div>
                        </>
                      ) : (
                        <img src={item.preview} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>
                        {item.file.name.substring(0, 25)}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-hint)" }}>
                        {item.type.startsWith("video") ? `${Math.round(item.duration)}s` : "Photo"}
                      </p>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="p-2 rounded-lg transition-all active:scale-95"
                      style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444" }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add more button */}
              <button
                onClick={() => photoVideoInputRef.current?.click()}
                className="w-full mt-4 py-3 rounded-2xl border-2 border-dashed font-bold transition-all"
                style={{ borderColor: "var(--accent-primary)", color: "var(--accent-primary)", backgroundColor: "var(--accent-primary-light)" }}
              >
                + Add More Media
              </button>

              {/* Next button */}
              <button
                onClick={onNext}
                className="w-full mt-4 py-3 rounded-2xl text-white font-bold text-lg transition-all active:scale-95"
                style={{ backgroundColor: "var(--accent-primary)" }}
              >
                Next: Edit Media
              </button>
            </div>
          </>
        )}

        {/* Hidden file inputs */}
        <input
          ref={photoVideoInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={(e) => handleFileSelect(e.target.files || [])}
          className="hidden"
        />
        
        <input
          ref={cameraInputRef}
          type="file"
          accept="video/*"
          capture="environment"
          onChange={(e) => handleFileSelect(e.target.files || [])}
          className="hidden"
        />

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
          onChange={(e) => handleFileSelect(e.target.files || [])}
          className="hidden"
        />
      </div>
    </div>
  );
}