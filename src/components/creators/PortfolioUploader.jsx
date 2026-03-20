import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, X, Loader2, ImageIcon } from "lucide-react";
import { uploadToCloudflare } from "@/utils/uploadToCloudflare";

export default function PortfolioUploader({ creator, onUpdated }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);
  const images = creator.portfolio_images || [];

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const urls = [];
    for (const file of files) {
      const { file_url } = await uploadToCloudflare(file);
      urls.push(file_url);
    }
    const updated = await base44.entities.Creator.update(creator.id, {
      portfolio_images: [...images, ...urls],
    });
    onUpdated({ ...creator, portfolio_images: [...images, ...urls] });
    setUploading(false);
    e.target.value = "";
  };

  const remove = async (idx) => {
    const next = images.filter((_, i) => i !== idx);
    await base44.entities.Creator.update(creator.id, { portfolio_images: next });
    onUpdated({ ...creator, portfolio_images: next });
  };

  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-hint)" }}>My Work / Portfolio</p>
        <button onClick={() => inputRef.current?.click()} disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white"
          style={{ background: "linear-gradient(135deg,#E05C2A,#F97316)" }}>
          {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          Add Photos
        </button>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
      </div>

      {images.length === 0 ? (
        <button onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center w-full h-24 rounded-xl gap-2"
          style={{ border: "2px dashed var(--border-medium)", backgroundColor: "var(--bg-subtle)" }}>
          <ImageIcon className="w-6 h-6" style={{ color: "var(--text-hint)" }} />
          <p className="text-xs" style={{ color: "var(--text-hint)" }}>Upload photos of your work</p>
        </button>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {images.map((url, i) => (
            <div key={i} className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "1" }}>
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button onClick={() => remove(i)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}