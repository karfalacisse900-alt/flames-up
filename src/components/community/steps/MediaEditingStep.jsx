import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Wand2, Type, Music, Volume2 } from "lucide-react";

export default function MediaEditingStep({
  mediaItems,
  setMediaItems,
  currentEditingIndex,
  setCurrentEditingIndex,
}) {
  const [editMode, setEditMode] = useState("adjust"); // adjust, text, effects
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [exposure, setExposure] = useState(0);
  const [volume, setVolume] = useState(100);

  const currentItem = mediaItems[currentEditingIndex];
  const isVideo = currentItem?.type.startsWith("video");

  const applyEdits = (updates) => {
    setMediaItems((prev) => {
      const newItems = [...prev];
      newItems[currentEditingIndex].edits = {
        ...newItems[currentEditingIndex].edits,
        ...updates,
      };
      return newItems;
    });
  };

  const handleBrightnessChange = (value) => {
    setBrightness(value);
    applyEdits({ brightness: value });
  };

  const handleContrastChange = (value) => {
    setContrast(value);
    applyEdits({ contrast: value });
  };

  const handleSaturationChange = (value) => {
    setSaturation(value);
    applyEdits({ saturation: value });
  };

  const handleExposureChange = (value) => {
    setExposure(value);
    applyEdits({ exposure: value });
  };

  const handleVolumeChange = (value) => {
    setVolume(value);
    applyEdits({ volume: value });
  };

  const getFilterStyle = () => {
    let filter = "";
    if (brightness !== 0) filter += `brightness(${100 + brightness}%) `;
    if (contrast !== 0) filter += `contrast(${100 + contrast}%) `;
    if (saturation !== 0) filter += `saturate(${100 + saturation}%) `;
    if (exposure !== 0) filter += `brightness(${100 + exposure}%) `;
    return filter;
  };

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Media Navigation */}
      {mediaItems.length > 1 && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentEditingIndex(Math.max(0, currentEditingIndex - 1))}
            disabled={currentEditingIndex === 0}
            className="p-2 rounded-lg disabled:opacity-30"
            style={{ backgroundColor: "var(--bg-card)" }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 flex gap-2 overflow-x-auto">
            {mediaItems.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => setCurrentEditingIndex(idx)}
                className={`w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden ${
                  idx === currentEditingIndex ? "ring-2" : ""
                }`}
                style={{
                  borderColor: "var(--border-light)",
                  ringColor: "var(--accent-primary)",
                }}
              >
                {item.type.startsWith("video") ? (
                  <video src={item.preview} className="w-full h-full object-cover" />
                ) : (
                  <img src={item.preview} alt="" className="w-full h-full object-cover" />
                )}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCurrentEditingIndex(Math.min(mediaItems.length - 1, currentEditingIndex + 1))}
            disabled={currentEditingIndex === mediaItems.length - 1}
            className="p-2 rounded-lg disabled:opacity-30"
            style={{ backgroundColor: "var(--bg-card)" }}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Preview */}
      <div className="rounded-2xl overflow-hidden relative aspect-square" style={{ backgroundColor: "#1a1a1a", border: "2px solid var(--accent-primary)" }}>
        {isVideo ? (
          <video
            src={currentItem.preview}
            className="w-full h-full object-cover"
            style={{ filter: getFilterStyle() }}
            controls
          />
        ) : (
          <img
            src={currentItem.preview}
            alt=""
            className="w-full h-full object-cover"
            style={{ filter: getFilterStyle() }}
          />
        )}
      </div>

      {/* Edit Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setEditMode("adjust")}
          className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all ${
            editMode === "adjust"
              ? "text-white"
              : "text-gray-600"
          }`}
          style={{
            backgroundColor: editMode === "adjust" ? "var(--accent-primary)" : "var(--bg-card)",
            border: editMode === "adjust" ? "none" : "1px solid var(--border-light)"
          }}
        >
          Adjust
        </button>
        <button
          onClick={() => setEditMode("text")}
          className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all ${
            editMode === "text"
              ? "text-white"
              : "text-gray-600"
          }`}
          style={{
            backgroundColor: editMode === "text" ? "var(--accent-primary)" : "var(--bg-card)",
            border: editMode === "text" ? "none" : "1px solid var(--border-light)"
          }}
        >
          <Type className="w-4 h-4 inline mr-1" />
          Text
        </button>
        <button
          onClick={() => setEditMode("effects")}
          className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all ${
            editMode === "effects"
              ? "text-white"
              : "text-gray-600"
          }`}
          style={{
            backgroundColor: editMode === "effects" ? "var(--accent-primary)" : "var(--bg-card)",
            border: editMode === "effects" ? "none" : "1px solid var(--border-light)"
          }}
        >
          <Wand2 className="w-4 h-4 inline mr-1" />
          FX
        </button>
      </div>

      {/* Adjust Mode */}
      {editMode === "adjust" && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold flex items-center justify-between mb-2">
              <span>Brightness</span>
              <span style={{ color: "var(--text-hint)" }}>{brightness > 0 ? "+" : ""}{brightness}</span>
            </label>
            <input
              type="range"
              min="-50"
              max="50"
              value={brightness}
              onChange={(e) => handleBrightnessChange(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-sm font-semibold flex items-center justify-between mb-2">
              <span>Contrast</span>
              <span style={{ color: "var(--text-hint)" }}>{contrast > 0 ? "+" : ""}{contrast}</span>
            </label>
            <input
              type="range"
              min="-50"
              max="50"
              value={contrast}
              onChange={(e) => handleContrastChange(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-sm font-semibold flex items-center justify-between mb-2">
              <span>Saturation</span>
              <span style={{ color: "var(--text-hint)" }}>{saturation > 0 ? "+" : ""}{saturation}</span>
            </label>
            <input
              type="range"
              min="-50"
              max="50"
              value={saturation}
              onChange={(e) => handleSaturationChange(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-sm font-semibold flex items-center justify-between mb-2">
              <span>Exposure</span>
              <span style={{ color: "var(--text-hint)" }}>{exposure > 0 ? "+" : ""}{exposure}</span>
            </label>
            <input
              type="range"
              min="-50"
              max="50"
              value={exposure}
              onChange={(e) => handleExposureChange(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {isVideo && (
            <div>
              <label className="text-sm font-semibold flex items-center justify-between mb-2">
                <span className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  Volume
                </span>
                <span style={{ color: "var(--text-hint)" }}>{volume}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-full"
              />
            </div>
          )}
        </div>
      )}

      {/* Text Mode */}
      {editMode === "text" && (
        <div className="p-4 rounded-2xl text-center" style={{ backgroundColor: "var(--accent-primary-light)", border: "2px dashed var(--accent-primary)" }}>
          <p style={{ color: "var(--accent-primary)" }}>Text overlay & captions coming soon</p>
        </div>
      )}

      {/* Effects Mode */}
      {editMode === "effects" && (
        <div className="space-y-2">
          {["Warm", "Cool", "B&W", "Vintage", "Vibrant"].map((filter) => (
            <button
              key={filter}
              className="w-full py-3 rounded-lg font-semibold text-white"
              style={{
                backgroundColor: "var(--accent-primary)",
              }}
            >
              {filter}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}