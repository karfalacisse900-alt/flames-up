import React, { useRef } from "react";
import { Upload, Play, Image, Music, X, GripVertical } from "lucide-react";

export default function MediaUploadStep({ mediaItems, setMediaItems }) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const dragCounter = useRef(0);

  const handleFileSelect = (files) => {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        alert("Please select images or videos only");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target.result;
        const item = {
          id: Date.now() + Math.random(),
          file,
          preview,
          type: file.type,
          duration: 0,
          edits: {},
        };

        // Get video duration
        if (file.type.startsWith("video/")) {
          const video = document.createElement("video");
          video.onloadedmetadata = () => {
            item.duration = video.duration;
          };
          video.src = preview;
        }

        setMediaItems((prev) => [...prev, item]);
      };
      reader.readAsDataURL(file);
    });
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
    <div className="p-4 space-y-4 pb-20">
      {/* Upload Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="border-2 border-dashed rounded-2xl p-8 text-center transition-all"
        style={{ borderColor: "var(--accent-primary)", backgroundColor: "var(--accent-primary-light)" }}
      >
        <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--accent-primary)" }} />
        <p className="font-semibold mb-1" style={{ color: "var(--accent-primary)" }}>
          Drag media here
        </p>
        <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>
          or choose files below
        </p>
        <div className="flex gap-2 justify-center flex-wrap">
           <button
             onClick={() => fileInputRef.current?.click()}
             className="px-4 py-2 rounded-lg font-semibold text-sm text-white"
             style={{ backgroundColor: "var(--accent-primary)" }}
           >
             <Image className="w-4 h-4 inline mr-1.5" />
             Photos
           </button>
           <button
             onClick={() => fileInputRef.current?.click()}
             className="px-4 py-2 rounded-lg font-semibold text-sm text-white"
             style={{ backgroundColor: "var(--accent-primary)" }}
           >
             <Play className="w-4 h-4 inline mr-1.5" />
             Videos
           </button>
           <button
             onClick={() => cameraInputRef.current?.click()}
             className="px-4 py-2 rounded-lg font-semibold text-sm text-white"
             style={{ backgroundColor: "var(--accent-primary)" }}
           >
             📹 Record
           </button>
         </div>
      </div>

      <input
        ref={fileInputRef}
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

      {/* Media List */}
      {mediaItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase" style={{ color: "var(--text-hint)" }}>
            {mediaItems.length} item{mediaItems.length !== 1 ? "s" : ""} selected
          </p>
          <div className="space-y-2">
            {mediaItems.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
              >
                {/* Drag handle */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleReorder(idx, "up")}
                    disabled={idx === 0}
                    className="p-1 disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <GripVertical className="w-3.5 h-3.5" style={{ color: "var(--text-hint)" }} />
                  <button
                    onClick={() => handleReorder(idx, "down")}
                    disabled={idx === mediaItems.length - 1}
                    className="p-1 disabled:opacity-30"
                  >
                    ▼
                  </button>
                </div>

                {/* Preview */}
                <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  {item.type.startsWith("video") ? (
                    <>
                      <video src={item.preview} className="w-full h-full object-cover" />
                      <Play className="w-4 h-4 absolute top-1 right-1 text-white drop-shadow" />
                    </>
                  ) : (
                    <img src={item.preview} alt="" className="w-full h-full object-cover" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                    {item.file.name.substring(0, 20)}...
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-hint)" }}>
                    {item.type.startsWith("video") ? `${Math.round(item.duration)}s` : "Photo"}
                  </p>
                </div>

                {/* Remove */}
                <button
                  onClick={() => handleRemove(item.id)}
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444" }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}