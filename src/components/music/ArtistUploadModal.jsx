import React, { useState } from "react";
import { X, Upload, Music2, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const LICENSE_TEXT =
  "I confirm that I am the original creator of this music, or I hold the full rights to distribute it. I grant this platform a non-exclusive, royalty-free license to make this audio available for users to add to their videos. I understand that submitting copyrighted material without authorization may result in removal and permanent account action.";

const CATEGORIES = [
  { value: "pop", label: "Pop" },
  { value: "hip_hop", label: "Hip Hop" },
  { value: "electronic", label: "Electronic" },
  { value: "ambient", label: "Ambient" },
  { value: "rock", label: "Rock" },
  { value: "jazz", label: "Jazz" },
  { value: "user_generated", label: "User Sound / Other" },
];

export default function ArtistUploadModal({ open, onClose, onUploaded }) {
  const [form, setForm] = useState({ title: "", artist_name: "", category: "user_generated", bpm: "" });
  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [licenseAccepted, setLicenseAccepted] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!audioFile || !form.title || !form.artist_name || !licenseAccepted) return;
    setUploading(true);
    try {
      const user = await base44.auth.me().catch(() => null);
      const { file_url: audio_url } = await base44.integrations.Core.UploadFile({ file: audioFile });
      let cover_url = "";
      if (coverFile) {
        const res = await base44.integrations.Core.UploadFile({ file: coverFile });
        cover_url = res.file_url;
      }
      await base44.entities.MusicTrack.create({
        title: form.title,
        artist_name: form.artist_name,
        artist_email: user?.email || "",
        audio_url,
        cover_url,
        category: form.category,
        license_type: "artist_owned",
        license_text: LICENSE_TEXT,
        bpm: form.bpm ? Number(form.bpm) : undefined,
        is_approved: false,
        is_disabled: false,
        is_trending: false,
        play_count: 0,
        use_count: 0,
        report_count: 0,
        reported_by: [],
      });
      onUploaded?.();
    } catch (err) {
      console.error("Music upload error:", err);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "var(--font-serif)" }}>Upload Your Sound</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Audio file picker */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wide block mb-1.5" style={{ color: "var(--text-hint)" }}>
              Audio File *
            </label>
            <label
              className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer border-2 border-dashed"
              style={{
                borderColor: audioFile ? "var(--accent-primary)" : "var(--border-medium)",
                backgroundColor: "var(--bg-subtle)",
              }}
            >
              <Music2 className="w-5 h-5 flex-shrink-0" style={{ color: "var(--accent-primary)" }} />
              <div className="flex-1 min-w-0">
                {audioFile ? (
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{audioFile.name}</p>
                ) : (
                  <p className="text-sm" style={{ color: "var(--text-hint)" }}>MP3, WAV, M4A — max 50 MB</p>
                )}
              </div>
              <input type="file" accept="audio/*" className="hidden" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} />
            </label>
          </div>

          {/* Cover art */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wide block mb-1.5" style={{ color: "var(--text-hint)" }}>
              Cover Art (optional)
            </label>
            <label
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}
            >
              <span className="text-xl">🎨</span>
              <span className="text-sm flex-1 truncate" style={{ color: coverFile ? "var(--text-primary)" : "var(--text-hint)" }}>
                {coverFile ? coverFile.name : "Upload cover image"}
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
            </label>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wide block mb-1.5" style={{ color: "var(--text-hint)" }}>Track Title *</label>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Song or sound name"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
          </div>

          {/* Artist name */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wide block mb-1.5" style={{ color: "var(--text-hint)" }}>Artist Name *</label>
            <input value={form.artist_name} onChange={(e) => set("artist_name", e.target.value)} placeholder="Your artist name"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
          </div>

          {/* Category + BPM */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide block mb-1.5" style={{ color: "var(--text-hint)" }}>Category</label>
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger className="rounded-xl text-sm" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide block mb-1.5" style={{ color: "var(--text-hint)" }}>BPM (optional)</label>
              <input type="number" value={form.bpm} onChange={(e) => set("bpm", e.target.value)} placeholder="e.g. 120"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
            </div>
          </div>

          {/* License */}
          <div className="rounded-xl p-4 space-y-3"
            style={{ backgroundColor: "var(--accent-primary-light)", border: "1px solid var(--border-light)" }}>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--accent-primary)" }}>License Agreement</p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{LICENSE_TEXT}</p>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={licenseAccepted} onChange={(e) => setLicenseAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4" style={{ accentColor: "var(--accent-primary)" }} />
              <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                I confirm I own or have full rights to this music and accept the above terms.
              </span>
            </label>
          </div>

          <div className="rounded-xl px-4 py-3 text-xs" style={{ backgroundColor: "rgba(217,139,98,0.1)", color: "var(--accent-secondary)" }}>
            ⏳ Your submission will be reviewed before appearing in the library (typically 1–2 days).
          </div>

          <button onClick={handleSubmit}
            disabled={uploading || !audioFile || !form.title || !form.artist_name || !licenseAccepted}
            className="w-full py-3 rounded-2xl text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: "var(--accent-primary)" }}>
            {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><Upload className="w-4 h-4" /> Submit for Review</>}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}