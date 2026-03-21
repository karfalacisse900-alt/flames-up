import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Type, Music, Mic, Sliders, Volume2, Wand2, Tag } from "lucide-react";
import MusicLibrarySheet from "../../music/MusicLibrarySheet";
import TagEditor from "../TagEditor";

const TOOLS = [
  { id: "text",    icon: Type,    label: "Text" },
  { id: "sound",   icon: Music,   label: "Sound" },
  { id: "voice",   icon: Mic,     label: "Voice" },
  { id: "adjust",  icon: Sliders, label: "Adjust" },
  { id: "volume",  icon: Volume2, label: "Volume" },
  { id: "effects", icon: Wand2,   label: "FX" },
  { id: "tag",     icon: Tag,     label: "Tag" },
];

const EFFECTS = [
  { name: "Normal",  filter: "" },
  { name: "Warm",    filter: "sepia(0.4) saturate(1.2)" },
  { name: "Cool",    filter: "saturate(1.2) hue-rotate(-20deg)" },
  { name: "B&W",     filter: "grayscale(1)" },
  { name: "Vintage", filter: "sepia(0.3) saturate(0.8)" },
  { name: "Vivid",   filter: "saturate(1.8) contrast(1.1)" },
  { name: "Fade",    filter: "brightness(1.08) contrast(0.9) saturate(0.85)" },
];

export default function CreatorEditorStep({
  mediaItems,
  setMediaItems,
  currentEditingIndex,
  setCurrentEditingIndex,
  selectedTrack,
  onSelectTrack,
}) {
  const [activeTool, setActiveTool] = useState(null);
  const [showMusicSheet, setShowMusicSheet] = useState(false);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [volume, setVolume] = useState(100);
  const [textOverlay, setTextOverlay] = useState(
    () => mediaItems[0]?.edits?.textOverlay || ""
  );

  const currentItem = mediaItems[currentEditingIndex];
  if (!currentItem) return null;
  const isVideo = currentItem.type?.startsWith("video");

  const applyEdits = (updates) => {
    setMediaItems((prev) => {
      const next = [...prev];
      next[currentEditingIndex] = {
        ...next[currentEditingIndex],
        edits: { ...next[currentEditingIndex].edits, ...updates },
      };
      return next;
    });
  };

  const getFilterStyle = () => {
    let f = "";
    if (brightness !== 0) f += `brightness(${100 + brightness}%) `;
    if (contrast !== 0) f += `contrast(${100 + contrast}%) `;
    if (saturation !== 0) f += `saturate(${100 + saturation}%) `;
    if (currentItem.edits?.effectFilter) f += currentItem.edits.effectFilter;
    return f.trim() || "none";
  };

  const adjusters = [
    { label: "Brightness", value: brightness, set: (v) => { setBrightness(v); applyEdits({ brightness: v }); } },
    { label: "Contrast",   value: contrast,   set: (v) => { setContrast(v);   applyEdits({ contrast: v }); } },
    { label: "Saturation", value: saturation, set: (v) => { setSaturation(v); applyEdits({ saturation: v }); } },
  ];

  return (
    <div className="flex flex-col" style={{ height: "100%", backgroundColor: "#000" }}>
      {/* Multi-media thumbnail strip */}
      {mediaItems.length > 1 && (
        <div className="flex gap-2 px-3 py-2 overflow-x-auto flex-shrink-0" style={{ backgroundColor: "#111" }}>
          {mediaItems.map((item, idx) => (
            <button key={item.id} onClick={() => setCurrentEditingIndex(idx)}
              className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 transition-all"
              style={{ border: idx === currentEditingIndex ? "2px solid #4CAF7D" : "2px solid #333" }}>
              {item.type?.startsWith("video")
                ? <video src={item.preview} className="w-full h-full object-cover" />
                : <img src={item.preview} alt="" className="w-full h-full object-cover" />}
            </button>
          ))}
          <button onClick={() => {}} className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center text-xl"
            style={{ backgroundColor: "#222", border: "2px dashed #444" }}>
            +
          </button>
        </div>
      )}

      {/* Media preview area */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center" style={{ backgroundColor: "#0a0a0a" }}>
        {isVideo ? (
          <video src={currentItem.preview} controls
            className="max-h-full max-w-full"
            style={{ filter: getFilterStyle(), objectFit: "contain" }} />
        ) : (
          <img src={currentItem.preview} alt=""
            className="max-h-full max-w-full"
            style={{ filter: getFilterStyle(), objectFit: "contain" }} />
        )}

        {/* Text overlay preview */}
        {textOverlay && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-8">
            <div className="px-5 py-2.5 rounded-xl max-w-full" style={{ backgroundColor: "rgba(0,0,0,0.65)" }}>
              <p className="text-white text-xl font-bold text-center break-words" style={{ 
                overflowWrap: "break-word", 
                wordBreak: "break-word",
                maxWidth: "100%",
                hyphens: "auto"
              }}>{textOverlay}</p>
            </div>
          </div>
        )}

        {/* Media navigation arrows for multi-item */}
        {mediaItems.length > 1 && (
          <>
            <button onClick={() => setCurrentEditingIndex(Math.max(0, currentEditingIndex - 1))}
              disabled={currentEditingIndex === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-20"
              style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <button onClick={() => setCurrentEditingIndex(Math.min(mediaItems.length - 1, currentEditingIndex + 1))}
              disabled={currentEditingIndex === mediaItems.length - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-20"
              style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </>
        )}
      </div>

      {/* Active tool panel */}
      {activeTool && (
        <div className="flex-shrink-0 px-4 py-4" style={{ backgroundColor: "#111", borderTop: "1px solid #2a2a2a" }}>
          {activeTool === "text" && (
            <div className="flex gap-2">
              <input value={textOverlay} onChange={(e) => {
                  setTextOverlay(e.target.value);
                  applyEdits({ textOverlay: e.target.value });
                }}
                placeholder="Type overlay text…"
                className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ backgroundColor: "#1e1e1e", border: "1px solid #333", color: "#fff" }} />
              <button onClick={() => { applyEdits({ textOverlay }); setActiveTool(null); }}
                className="px-4 py-2 rounded-xl text-white text-sm font-semibold"
                style={{ backgroundColor: "#2E6B4F" }}>
                Done
              </button>
            </div>
          )}

          {activeTool === "adjust" && (
            <div className="space-y-3">
              {adjusters.map(({ label, value, set }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-white text-xs font-medium w-20">{label}</span>
                  <input type="range" min="-50" max="50" value={value}
                    onChange={(e) => set(Number(e.target.value))} className="flex-1 accent-green-500" />
                  <span className="text-xs w-8 text-right" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {value > 0 ? "+" : ""}{value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {activeTool === "volume" && isVideo && (
            <div className="flex items-center gap-3">
              <Volume2 className="w-4 h-4 text-white flex-shrink-0" />
              <input type="range" min="0" max="100" value={volume}
                onChange={(e) => { setVolume(Number(e.target.value)); applyEdits({ volume: Number(e.target.value) }); }}
                className="flex-1 accent-green-500" />
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{volume}%</span>
            </div>
          )}
          {activeTool === "volume" && !isVideo && (
            <p className="text-center text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              Volume control is available for videos only
            </p>
          )}

          {activeTool === "effects" && (
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
              {EFFECTS.map(({ name, filter }) => {
                const isActive = (currentItem.edits?.effectFilter || "") === filter;
                return (
                  <button key={name} onClick={() => applyEdits({ effectFilter: filter })}
                    className="flex-shrink-0 flex flex-col items-center gap-1.5">
                    <div className="w-14 h-14 rounded-xl overflow-hidden"
                      style={{ border: isActive ? "2px solid #4CAF7D" : "2px solid #333" }}>
                      <img src={currentItem.preview} alt="" className="w-full h-full object-cover"
                        style={{ filter: filter || "none" }} />
                    </div>
                    <span className="text-[10px] font-semibold" style={{ color: isActive ? "#4CAF7D" : "rgba(255,255,255,0.6)" }}>
                      {name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {activeTool === "sound" && (
            <div className="space-y-2">
              {selectedTrack ? (
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                  style={{ backgroundColor: "rgba(46,107,79,0.25)", border: "1px solid rgba(46,107,79,0.5)" }}>
                  <div className="w-2 h-2 rounded-full animate-pulse flex-shrink-0" style={{ backgroundColor: "#4CAF7D" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{selectedTrack.title}</p>
                    <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.45)" }}>{selectedTrack.artist_name}</p>
                  </div>
                  <button onClick={() => onSelectTrack(null)} className="text-xs px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>Remove</button>
                </div>
              ) : (
                <p className="text-xs text-center pb-1" style={{ color: "rgba(255,255,255,0.3)" }}>No sound selected</p>
              )}
              <button onClick={() => setShowMusicSheet(true)}
                className="w-full py-2.5 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2"
                style={{ backgroundColor: "#2E6B4F" }}>
                <Music className="w-4 h-4" /> Browse Music Library
              </button>
            </div>
          )}

          {activeTool === "voice" && (
            <div className="text-center py-3">
              <p className="text-sm font-medium text-white mb-3">Record a voiceover</p>
              <button
                className="w-full py-3 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2"
                style={{ backgroundColor: "#2E6B4F" }}
                onClick={() => {
                  alert("Voice recording feature will be implemented soon!");
                }}
              >
                <Mic className="w-4 h-4" /> Start Recording
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tag Editor overlay */}
      {activeTool === "tag" && currentItem && (
        <TagEditor
          imageUrl={currentItem.preview}
          existingTags={currentItem.edits?.tags || []}
          onSave={(tags) => { applyEdits({ tags }); setActiveTool(null); }}
          onClose={() => setActiveTool(null)}
        />
      )}

      <MusicLibrarySheet
        open={showMusicSheet}
        onClose={() => setShowMusicSheet(false)}
        onSelectTrack={(track) => { onSelectTrack?.(track); setShowMusicSheet(false); }}
        selectedTrack={selectedTrack}
      />

      {/* Bottom toolbar */}
      <div className="flex-shrink-0 flex items-center justify-around px-2 py-3"
        style={{ backgroundColor: "#0a0a0a", borderTop: "1px solid #1e1e1e" }}>
        {TOOLS.map(({ id, icon: Icon, label }) => {
          const isActive = activeTool === id;
          return (
            <button key={id} onClick={() => setActiveTool(isActive ? null : id)}
              className="flex flex-col items-center gap-1.5 px-2 py-1 rounded-xl transition-all"
              style={{
                backgroundColor: isActive ? "rgba(78,175,125,0.15)" : "transparent",
                color: isActive ? "#4CAF7D" : "rgba(255,255,255,0.55)",
              }}>
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-bold uppercase tracking-wide">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}