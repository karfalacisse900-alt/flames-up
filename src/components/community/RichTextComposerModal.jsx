import React, { useMemo, useRef, useState } from "react";
import ReactQuill from "react-quill";
import { X, ImagePlus, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const CATEGORIES = ["general", "food", "travel", "music", "question", "events", "local_tips"];
const QUILL_MODULES = {
  toolbar: [
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};
const QUILL_FORMATS = ["bold", "italic", "underline", "list", "bullet", "link"];

export default function RichTextComposerModal({ user, onClose, onCreated }) {
  const fileInputRef = useRef(null);
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("general");
  const [imageFiles, setImageFiles] = useState([]);
  const [saving, setSaving] = useState(false);

  const isBodyEmpty = useMemo(() => (body || "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim().length === 0, [body]);

  const handleImages = (event) => {
    const files = Array.from(event.target.files || []).slice(0, 4);
    const next = files.map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setImageFiles(next);
    event.target.value = "";
  };

  const handleSubmit = async () => {
    if (!user || isBodyEmpty || saving) return;
    setSaving(true);
    const uploaded = imageFiles.length
      ? await Promise.all(imageFiles.map((item) => base44.integrations.Core.UploadFile({ file: item.file })))
      : [];
    const imageUrls = uploaded.map((item) => item.file_url);

    await base44.entities.CommunityPost.create({
      type: "discussion",
      body,
      author_email: user.email,
      author_name: user.full_name || user.email,
      author_avatar_url: user.avatar_url || "",
      is_anonymous: false,
      image_url: imageUrls[0] || undefined,
      image_urls: imageUrls.length ? imageUrls : undefined,
      tags: [category],
      media_type: "general",
      moderation_status: "approved",
      upvotes: 0,
      downvotes: 0,
      comment_count: 0,
      engagement_score: 0,
    });

    setSaving(false);
    onCreated?.();
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0" style={{ backgroundColor: "rgba(15,23,42,0.52)", backdropFilter: "blur(10px)" }} />
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-[32px] border"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "rgba(148,163,184,0.18)", boxShadow: "var(--elevation-5)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: "var(--border-light)", background: "linear-gradient(135deg, rgba(79,70,229,0.10), rgba(20,184,166,0.08))" }}>
          <div>
            <h2 className="h4" style={{ color: "var(--text-primary)" }}>Create rich post</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>Write with formatting, choose a category, and attach images.</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2" style={{ backgroundColor: "rgba(255,255,255,0.72)" }}>
            <X className="h-4 w-4" style={{ color: "var(--text-primary)" }} />
          </button>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1fr_280px]">
          <div className="p-6">
            <div className="rounded-[24px] overflow-hidden border" style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-subtle)" }}>
              <ReactQuill
                theme="snow"
                value={body}
                onChange={setBody}
                modules={QUILL_MODULES}
                formats={QUILL_FORMATS}
                placeholder="Share something thoughtful with the community..."
              />
            </div>
          </div>

          <div className="border-l p-6 space-y-5" style={{ borderColor: "var(--border-light)", backgroundColor: "rgba(248,250,252,0.7)" }}>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-hint)" }}>Category</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {CATEGORIES.map((item) => (
                  <button
                    key={item}
                    onClick={() => setCategory(item)}
                    className="rounded-full px-3 py-2 text-sm font-semibold capitalize"
                    style={{ backgroundColor: category === item ? "var(--accent-primary)" : "white", color: category === item ? "white" : "var(--text-secondary)", border: `1px solid ${category === item ? 'var(--accent-primary)' : 'var(--border-light)'}` }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-hint)" }}>Images</div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
              <button onClick={() => fileInputRef.current?.click()} className="mt-3 inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold" style={{ backgroundColor: "white", color: "var(--text-primary)", border: "1px solid var(--border-light)" }}>
                <ImagePlus className="h-4 w-4" /> Add images
              </button>
              {imageFiles.length ? (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {imageFiles.map((item, index) => (
                    <div key={index} className="overflow-hidden rounded-[18px] border" style={{ borderColor: "var(--border-light)" }}>
                      <img src={item.preview} alt="preview" className="h-24 w-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t px-6 py-5" style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-card)" }}>
          <div className="text-sm" style={{ color: "var(--text-secondary)" }}>This publishes directly into the community feed.</div>
          <button
            onClick={handleSubmit}
            disabled={isBodyEmpty || saving}
            className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: "var(--accent-primary)" }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? "Publishing..." : "Publish post"}
          </button>
        </div>
      </div>
    </div>
  );
}