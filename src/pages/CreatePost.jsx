import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { X, ImageIcon, Video, Save, ArrowLeft, MapPin, Eye, EyeOff } from "lucide-react";
import ReactQuill from "react-quill";
import { checkContent, createModerationReport } from "@/components/moderation/moderationHelper";
import LocationTagButton from "@/components/community/LocationTagButton";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

const QUILL_MODULES = {
  toolbar: [
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};
const QUILL_FORMATS = ["bold", "italic", "underline", "list", "bullet", "link"];

const POST_TYPES = [
  { key: "opinion",      label: "Opinion",   emoji: "💬", desc: "Share your take on anything" },
  { key: "question",     label: "Question",  emoji: "❓", desc: "Ask the community" },
  { key: "quote_of_day", label: "Quote",     emoji: "✦",  desc: "Share an inspiring quote" },
  { key: "discussion",   label: "Discussion",emoji: "🗣️", desc: "Start a conversation" },
];

export default function CreatePost() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [step, setStep] = useState("type");
  const [type, setType] = useState("");
  const [body, setBody] = useState("");
  const [isAnon, setIsAnon] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoError, setVideoError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [location, setLocation] = useState(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {
      navigate(createPageUrl("Home"));
    });
  }, []);

  const isBodyEmpty = (html) =>
    (html || "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/\s/g, "").trim().length === 0;

  const cleanBody = (html) => {
    if (!html) return "";
    return html
      .replace(/^(<p>\s*(<br>)?\s*<\/p>\s*)+/gi, "")
      .replace(/(\s*<p>\s*(<br>)?\s*<\/p>)+$/gi, "")
      .trim();
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newEntries = files.map(f => ({ file: f, preview: URL.createObjectURL(f) }));
    setImageFiles(prev => [...prev, ...newEntries].slice(0, 10));
    setVideoFile(null);
    setVideoPreview(null);
    e.target.value = "";
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const vid = document.createElement("video");
    vid.src = url;
    vid.onloadedmetadata = () => {
      if (vid.duration > 60) { setVideoError("Video must be 60 seconds or less."); return; }
      setVideoFile(file);
      setVideoPreview(url);
      setVideoDuration(Math.round(vid.duration));
      setVideoError("");
      setImageFiles([]);
    };
    e.target.value = "";
  };

  const handleSubmit = async () => {
    if (!user) return;
    const cleanedBody = cleanBody(body);
    if (isBodyEmpty(cleanedBody)) return;
    setSaving(true);

    let finalImageUrl = null;
    let finalImageUrls = [];
    let finalVideoUrl = null;

    if (imageFiles.length > 0) {
      setUploading(true);
      const uploads = await Promise.all(imageFiles.map(({ file }) => base44.integrations.Core.UploadFile({ file })));
      finalImageUrls = uploads.map(r => r.file_url);
      finalImageUrl = finalImageUrls[0];
      setUploading(false);
    } else if (videoFile) {
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: videoFile });
      finalVideoUrl = file_url;
      setUploading(false);
    }

    const textToCheck = cleanedBody.replace(/<[^>]*>/g, " ");
    const modResult = await checkContent(textToCheck);

    const postData = {
      type,
      body: cleanedBody,
      author_email: user.email || "",
      author_name: user.display_name || user.full_name || "Anonymous",
      author_avatar_url: user.avatar_url || "",
      is_anonymous: isAnon,
      image_url: finalImageUrl || undefined,
      image_urls: finalImageUrls.length > 0 ? finalImageUrls : undefined,
      video_url: finalVideoUrl || undefined,
      location_city: location?.city || undefined,
      location_region: location?.region || undefined,
      location_country: location?.country || undefined,
      location_lat: location?.lat || undefined,
      location_lng: location?.lng || undefined,
      upvotes: 0, downvotes: 0, comment_count: 0, engagement_score: 0,
      is_daily_spotlight: false,
      moderation_status: modResult.safe ? "approved" : "pending",
      is_reported: !modResult.safe,
    };

    const newPost = await base44.entities.CommunityPost.create(postData);
    if (!modResult.safe) {
      await createModerationReport("post", newPost.id, user.email, user.display_name || user.full_name, modResult.flags, modResult.confidence);
    }

    setSaving(false);
    navigate(createPageUrl("Home"));
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-app)" }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--border-medium)", borderTopColor: "var(--accent-primary)" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3"
        style={{ backgroundColor: "var(--bg-nav)", borderBottom: "1px solid var(--border-light)", backdropFilter: "blur(20px)" }}>
        <button onClick={() => step === "compose" ? setStep("type") : navigate(-1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95"
          style={{ backgroundColor: "var(--bg-subtle)" }}>
          <ArrowLeft className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
        </button>
        <h1 className="text-base font-bold flex-1" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
          {step === "type" ? "New Post" : "Compose Post"}
        </h1>
        {step === "compose" && (
          <button
            onClick={handleSubmit}
            disabled={saving || isBodyEmpty(cleanBody(body))}
            className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-40"
            style={{ backgroundColor: "var(--accent-primary)" }}>
            {saving ? (uploading ? "Uploading…" : "Posting…") : "Post"}
          </button>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6">
        {/* Step 1: Pick post type */}
        {step === "type" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>What kind of post do you want to create?</p>
            <div className="grid grid-cols-2 gap-3">
              {POST_TYPES.map(t => (
                <button
                  key={t.key}
                  onClick={() => { setType(t.key); setStep("compose"); }}
                  className="p-4 rounded-2xl text-left transition-all active:scale-95 hover:shadow-md"
                  style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                  <p className="text-3xl mb-2">{t.emoji}</p>
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{t.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-hint)" }}>{t.desc}</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 2: Compose */}
        {step === "compose" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Post type pill */}
            <div className="flex items-center gap-2">
              <span className="text-xl">{POST_TYPES.find(t => t.key === type)?.emoji}</span>
              <span className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
                {POST_TYPES.find(t => t.key === type)?.label}
              </span>
            </div>

            {/* Author row */}
            <div className="flex items-center gap-3">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
                  style={{ backgroundColor: "var(--accent-primary)" }}>
                  {(user.full_name || user.email)?.[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {isAnon ? "Anonymous" : (user.display_name || user.full_name || user.email)}
                </p>
                <button
                  onClick={() => setIsAnon(v => !v)}
                  className="flex items-center gap-1 text-xs mt-0.5 transition-colors"
                  style={{ color: "var(--text-hint)" }}>
                  {isAnon ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {isAnon ? "Posting anonymously" : "Post as yourself"}
                </button>
              </div>
            </div>

            {/* Rich text editor */}
            <div className="rounded-2xl overflow-hidden"
              style={{ border: "1px solid var(--border-light)", backgroundColor: "var(--bg-card)" }}>
              <ReactQuill
                theme="snow"
                value={body}
                onChange={setBody}
                modules={QUILL_MODULES}
                formats={QUILL_FORMATS}
                placeholder="What's on your mind?"
                style={{ fontSize: 15, minHeight: 160 }}
              />
            </div>

            {/* Hidden file inputs */}
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} />
            <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />

            {/* Video preview */}
            {videoPreview && (
              <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: "4/5", maxHeight: 480 }}>
                <video src={videoPreview} controls className="w-full h-full object-cover" />
                <div className="absolute top-3 right-3 flex gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white"
                    style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>⏱ {videoDuration}s</span>
                  <button onClick={() => { setVideoFile(null); setVideoPreview(null); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            {videoError && <p className="text-xs" style={{ color: "#E05C7A" }}>{videoError}</p>}

            {/* Image grid */}
            {imageFiles.length > 0 && (
              <div>
                <div className={`grid gap-2 ${imageFiles.length === 1 ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3"}`}>
                  {imageFiles.map((img, i) => (
                    <div key={i} className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "1/1" }}>
                      <img src={img.preview} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setImageFiles(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                      {i === 0 && imageFiles.length > 1 && (
                        <div className="absolute bottom-2 left-2 text-[10px] font-bold text-white px-2 py-0.5 rounded-md"
                          style={{ backgroundColor: "rgba(46,107,79,0.85)" }}>Cover</div>
                      )}
                    </div>
                  ))}
                  {imageFiles.length < 10 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-xl flex flex-col items-center justify-center gap-1.5 border-2 border-dashed transition-all active:scale-95"
                      style={{ aspectRatio: "1/1", borderColor: "var(--border-medium)", color: "var(--text-hint)" }}>
                      <ImageIcon className="w-5 h-5" />
                      <span className="text-xs">Add more</span>
                    </button>
                  )}
                </div>
                <p className="text-xs mt-2" style={{ color: "var(--text-hint)" }}>{imageFiles.length}/10 photos</p>
              </div>
            )}

            {/* Media buttons (shown when no media selected) */}
            {imageFiles.length === 0 && !videoPreview && (
              <div className="flex gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium border transition-all active:scale-95"
                  style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)", color: "var(--text-secondary)" }}>
                  <ImageIcon className="w-4 h-4" />
                  Photos / GIFs
                </button>
                <button
                  onClick={() => videoInputRef.current?.click()}
                  className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium border transition-all active:scale-95"
                  style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)", color: "var(--text-secondary)" }}>
                  <Video className="w-4 h-4" />
                  Video (≤60s)
                </button>
              </div>
            )}

            {/* Location */}
            <LocationTagButton location={location} onLocation={setLocation} />

            {/* Submit button (also available at bottom for convenience) */}
            <button
              onClick={handleSubmit}
              disabled={saving || isBodyEmpty(cleanBody(body))}
              className="w-full py-4 rounded-2xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-40"
              style={{ backgroundColor: "var(--accent-primary)", boxShadow: "0 4px 16px rgba(46,107,79,0.3)" }}>
              {saving ? (uploading ? "Uploading media…" : "Posting…") : "✦ Post to Community"}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}