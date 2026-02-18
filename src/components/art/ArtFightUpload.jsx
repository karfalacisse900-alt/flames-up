import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ArtFightUpload({ user, open, onClose, onUploaded }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!["image/jpeg", "image/png"].includes(f.type)) { setError("Only JPG or PNG allowed."); return; }
    if (f.size > 10 * 1024 * 1024) { setError("Max file size is 10MB."); return; }
    setError("");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!file || !title.trim() || !user) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.ArtFightEntry.create({
      owner_email: user.email,
      owner_name: user.display_name || user.full_name || "Artist",
      image_url: file_url,
      title: title.trim(),
      description: description.trim(),
      status: "pending",
      wins: 0, losses: 0, fight_score: 1000,
    });
    setTitle(""); setDescription(""); setFile(null); setPreview(null);
    setUploading(false);
    onUploaded();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "var(--font-serif)" }}>Submit Art for Art Fight</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-xs" style={{ color: "var(--text-hint)" }}>
            Your art will be reviewed before entering fights. JPG or PNG, max 10MB.
          </p>
          {preview ? (
            <div className="relative rounded-xl overflow-hidden aspect-square">
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              <button onClick={() => { setFile(null); setPreview(null); }} className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full">
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-44 border-2 border-dashed rounded-xl cursor-pointer transition-colors"
              style={{ borderColor: "var(--border-medium)", backgroundColor: "var(--bg-card)" }}>
              <Upload className="w-7 h-7 mb-2" style={{ color: "var(--text-hint)" }} />
              <span className="text-sm" style={{ color: "var(--text-hint)" }}>Tap to upload</span>
              <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleFile} />
            </label>
          )}
          {error && <p className="text-xs text-red-500">{error}</p>}
          <Input placeholder="Title *" value={title} onChange={e => setTitle(e.target.value)} className="rounded-xl" style={{ borderColor: "var(--border-light)" }} />
          <Textarea placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} rows={2} className="rounded-xl resize-none" style={{ borderColor: "var(--border-light)" }} />
          <Button onClick={handleSubmit} disabled={!file || !title.trim() || uploading} className="w-full rounded-xl text-white" style={{ backgroundColor: "var(--accent-primary)" }}>
            {uploading ? "Uploading…" : "Submit for Review"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}