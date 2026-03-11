import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, X, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { useLocationDetection } from "../components/hooks/useLocationDetection";
import CameraUploadStep from "../components/community/creator/CameraUploadStep";
import CreatorEditorStep from "../components/community/creator/CreatorEditorStep";
import PostSettingsPanel from "../components/community/creator/PostSettingsPanel";

// Step IDs
const STEP_CAMERA   = "camera";
const STEP_EDITOR   = "editor";
const STEP_SETTINGS = "settings";

export default function CreatePostFlow() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(STEP_CAMERA);

  const [mediaItems, setMediaItems] = useState([]);
  const [currentEditingIndex, setCurrentEditingIndex] = useState(0);

  const [postSettings, setPostSettings] = useState({
    caption: "",
    hashtags: [],
    link: "",
    showInNearby: false,
    location: null,
    location_hide_exact: false,
    privacy: "public",
    allowComments: true,
    allowRemix: false,
    allowSharing: true,
    isProduct: false,
    isAIGenerated: false,
  });

  const [isPosting, setIsPosting] = useState(false);
  const { coords: gpsCoords, locationInfo: gpsLocation } = useLocationDetection({ autoDetect: true });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => navigate(createPageUrl("Home")));
  }, []);

  const handleMediaSelected = (items) => {
    setMediaItems(items);
    setCurrentEditingIndex(0);
    setStep(STEP_EDITOR);
  };

  const handlePost = async () => {
    if (!user || mediaItems.length === 0) return;
    setIsPosting(true);

    const uploadedUrls = [];
    const isVideo = mediaItems.length === 1 && mediaItems[0].type?.startsWith("video");

    for (const item of mediaItems) {
      if (item.file) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: item.file });
        uploadedUrls.push(file_url);
      }
    }

    const manualLoc = postSettings.location;
    const hashtagText = (postSettings.hashtags || []).map((t) => `#${t}`).join(" ");
    const captionBody = [postSettings.caption, hashtagText].filter(Boolean).join("\n\n");

    await base44.entities.CommunityPost.create({
      type: "opinion",
      body: captionBody || "Check out this post!",
      author_email: user.email,
      author_name: user.display_name || user.full_name || "Anonymous",
      author_avatar_url: user.avatar_url || "",
      is_anonymous: false,
      media_type: "general",
      video_url: isVideo ? uploadedUrls[0] : undefined,
      image_urls: !isVideo && uploadedUrls.length > 0 ? uploadedUrls : undefined,
      location_name: manualLoc?.name || undefined,
      location_city: manualLoc?.city || gpsLocation?.city || undefined,
      location_region: manualLoc?.region || gpsLocation?.region || undefined,
      location_country: manualLoc?.country || gpsLocation?.country || undefined,
      location_lat: manualLoc?.lat || gpsCoords?.lat || undefined,
      location_lng: manualLoc?.lng || gpsCoords?.lng || undefined,
      location_hide_exact: postSettings.location_hide_exact || false,
      place_tags: manualLoc ? [manualLoc.type || "place"] : [],
      moderation_status: "approved",
      is_pinned: false,
      upvotes: 0,
      downvotes: 0,
      comment_count: 0,
      engagement_score: 0,
    });

    navigate(createPageUrl("Home"));
    setIsPosting(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-app)" }}>
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "var(--accent-primary)" }} />
      </div>
    );
  }

  /* ── STEP 1: Camera / Upload (full-screen overlay) ── */
  if (step === STEP_CAMERA) {
    return (
      <CameraUploadStep
        onMediaSelected={handleMediaSelected}
        onClose={() => navigate(createPageUrl("Home"))}
      />
    );
  }

  /* ── STEP 2: Creator Editor (dark, full-screen) ── */
  if (step === STEP_EDITOR) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: "#000" }}>
        {/* Thin top bar */}
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ backgroundColor: "#0a0a0a", borderBottom: "1px solid #1e1e1e",
            paddingTop: "max(env(safe-area-inset-top, 0px), 12px)" }}>
          <button onClick={() => setStep(STEP_CAMERA)} className="p-2 -m-1 rounded-full"
            style={{ color: "rgba(255,255,255,0.7)" }}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold text-white tracking-wide">Edit</span>
          <button
            onClick={() => setStep(STEP_SETTINGS)}
            className="px-5 py-1.5 rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: "#2E6B4F" }}>
            Next →
          </button>
        </div>

        {/* Editor takes remaining height */}
        <div className="flex-1 overflow-hidden">
          <CreatorEditorStep
            mediaItems={mediaItems}
            setMediaItems={setMediaItems}
            currentEditingIndex={currentEditingIndex}
            setCurrentEditingIndex={setCurrentEditingIndex}
          />
        </div>
      </div>
    );
  }

  /* ── STEP 3: Post Settings ── */
  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{
          backgroundColor: "var(--bg-card)",
          borderBottom: "1px solid var(--border-light)",
          paddingTop: "max(env(safe-area-inset-top, 0px), 12px)",
        }}>
        <button onClick={() => setStep(STEP_EDITOR)} className="p-2 -m-1"
          style={{ color: "var(--text-secondary)" }}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-base font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
          Post Details
        </span>
        <div style={{ width: 36 }} />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <PostSettingsPanel
          user={user}
          postSettings={postSettings}
          setPostSettings={setPostSettings}
          mediaItems={mediaItems}
          gpsLocation={gpsLocation}
        />
      </div>

      {/* Sticky footer */}
      <div className="flex-shrink-0 flex gap-3 px-4 py-3"
        style={{
          backgroundColor: "var(--bg-card)",
          borderTop: "1px solid var(--border-light)",
          paddingBottom: "max(env(safe-area-inset-bottom, 0px), 12px)",
        }}>
        <button
          className="flex-1 py-3 rounded-2xl text-sm font-bold border"
          style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)", borderColor: "var(--border-light)" }}>
          Drafts
        </button>
        <button
          onClick={handlePost}
          disabled={isPosting}
          className="flex-[2] py-3 rounded-2xl text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ backgroundColor: "var(--accent-primary)" }}>
          {isPosting ? <><Loader2 className="w-4 h-4 animate-spin" /> Posting…</> : "Post"}
        </button>
      </div>
    </div>
  );
}