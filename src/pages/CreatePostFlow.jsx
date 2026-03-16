import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, ChevronRight, BookMarked, Send, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { useLocationDetection } from "../components/hooks/useLocationDetection";

import CameraUploadStep from "../components/community/creator/CameraUploadStep";
import CreatorEditorStep from "../components/community/creator/CreatorEditorStep";
import PostSettingsPanel from "../components/community/creator/PostSettingsPanel";

// Strip HTML tags from ReactQuill output to get plain text
function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}

export default function CreatePostFlow() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const urlParams = new URLSearchParams(window.location.search);
  const presetLocation = urlParams.get("location") ? JSON.parse(decodeURIComponent(urlParams.get("location"))) : null;

  // step: 1 = camera/upload, 2 = editor/effects, 3 = caption/settings/post
  const [step, setStep] = useState(1);

  const [mediaItems, setMediaItems] = useState([]);
  const [currentEditingIndex, setCurrentEditingIndex] = useState(0);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [postResult, setPostResult] = useState(null); // null | 'success' | 'error'
  const [postError, setPostError] = useState(null);

  const [postSettings, setPostSettings] = useState({
    caption: "",
    hashtags: [],
    link: "",
    linkType: "website",
    showInNearby: false,
    location: presetLocation,
    location_hide_exact: false,
    privacy: "public",
    allowComments: true,
    allowRemix: false,
    allowSharing: true,
    isEvent: false,
    isProduct: false,
    isAIGenerated: false,
  });

  const { coords: gpsCoords, locationInfo: gpsLocation } = useLocationDetection({ autoDetect: true });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => navigate(createPageUrl("Home")));
  }, []);

  const doPost = async (asDraft = false) => {
    // Guard: must not already be posting or succeeded
    if (isPosting || postResult === "success") return;

    // Guard: user must be loaded — redirect to login if missing
    if (!user) {
      alert("No user session found. Redirecting to login...");
      base44.auth.redirectToLogin(window.location.href);
      return;
    }

    setPostResult(null);
    setPostError(null);
    setIsPosting(true);

    try {
      const uploadedUrls = [];
      const isVideo = mediaItems.length === 1 && mediaItems[0].type?.startsWith("video");
      const allTags = [];

      for (let i = 0; i < mediaItems.length; i++) {
        const item = mediaItems[i];
        if (item.file) {
          const { file_url } = await base44.integrations.Core.UploadFile({ file: item.file });
          uploadedUrls.push(file_url);
        } else if (item.preview) {
          uploadedUrls.push(item.preview);
        }
        if (item.edits?.tags) {
          item.edits.tags.forEach(tag => allTags.push({ ...tag, imageIndex: i }));
        }
      }

      const manualLoc = postSettings.location;
      const hashtagStr = (postSettings.hashtags || []).map((t) => `#${t}`).join(" ");
      const rawCaption = stripHtml(postSettings.caption || "");

      const postData = {
        type: "opinion",
        body: rawCaption + (hashtagStr ? `\n${hashtagStr}` : ""),
        author_email: user.email,
        author_name: postSettings.isAnonymous ? "Anonymous" : (user.display_name || user.full_name || "Anonymous"),
        author_avatar_url: postSettings.isAnonymous ? "" : (user.avatar_url || ""),
        is_anonymous: postSettings.isAnonymous || false,
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
        moderation_status: asDraft ? "pending" : "approved",
        tags: postSettings.hashtags || [],
        upvotes: 0,
        downvotes: 0,
        comment_count: 0,
        engagement_score: 0,
        is_creator_post: user.is_creator || false,
        media_tags: allTags.length > 0 ? allTags : undefined,
      };

      // This awaits confirmation from the server before proceeding
      const created = await base44.entities.CommunityPost.create(postData);

      if (!created?.id) throw new Error("Server returned no post ID");

      setPostResult("success");
      setTimeout(() => navigate(createPageUrl("Home")), 1200);
    } catch (err) {
      setPostResult("error");
      setPostError(err?.message || "Something went wrong. Tap to retry.");
    } finally {
      setIsPosting(false);
    }
  };

  // Loading
  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "#000" }}>
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  // ── STEP 1: Camera / Upload ───────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="fixed inset-0 z-50">
        <CameraUploadStep
          onMediaSelected={(items) => {
            setMediaItems(items);
            setStep(2);
          }}
          onClose={() => navigate(createPageUrl("Home"))}
        />
      </div>
    );
  }

  // ── STEP 2: Editor / Effects ──────────────────────────────────────────────
  if (step === 2) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: "#000" }}>
        {/* Header */}
        <div
          className="flex-shrink-0 flex items-center gap-3 px-4"
          style={{
            paddingTop: "max(env(safe-area-inset-top, 0px), 44px)",
            paddingBottom: 12,
            backgroundColor: "#0d0d0d",
            borderBottom: "1px solid #1e1e1e",
          }}
        >
          <button
            onClick={() => setStep(1)}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid #333" }}
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>

          <h1 className="flex-1 text-center text-base font-bold text-white" style={{ fontFamily: "var(--font-serif)" }}>
            Edit
          </h1>

          <button
            onClick={() => setStep(3)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: "var(--accent-primary)" }}
          >
            Next <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Editor fills remaining space */}
        <div className="flex-1 overflow-hidden">
          <CreatorEditorStep
            mediaItems={mediaItems}
            setMediaItems={setMediaItems}
            currentEditingIndex={currentEditingIndex}
            setCurrentEditingIndex={setCurrentEditingIndex}
            selectedTrack={selectedTrack}
            onSelectTrack={setSelectedTrack}
          />
        </div>
      </div>
    );
  }

  // ── STEP 3: Caption / Settings / Post ─────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div
        className="flex-shrink-0 flex items-center gap-3 px-4"
        style={{
          paddingTop: "max(env(safe-area-inset-top, 0px), 44px)",
          paddingBottom: 12,
          backgroundColor: "var(--bg-card)",
          borderBottom: "1px solid var(--border-light)",
        }}
      >
        <button
          onClick={() => setStep(2)}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}
        >
          <ArrowLeft className="w-4 h-4" style={{ color: "var(--text-primary)" }} />
        </button>

        <h1 className="flex-1 text-center text-base font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
          New Post
        </h1>

        <button
          type="button"
          onClick={() => doPost(false)}
          disabled={isPosting || postResult === "success"}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold text-white disabled:opacity-70"
          style={{
            backgroundColor: postResult === "success" ? "#16a34a" : postResult === "error" ? "#dc2626" : "var(--accent-primary)",
            pointerEvents: postResult === "success" ? "none" : "auto",
          }}
        >
          {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : postResult === "success" ? "✓ Posted!" : postResult === "error" ? "✗ Failed" : <><Send className="w-3.5 h-3.5" /> Post</>}
        </button>
      </div>

      {/* Scrollable settings */}
      <div className="flex-1 overflow-y-auto">
        <PostSettingsPanel
          user={user}
          postSettings={postSettings}
          setPostSettings={setPostSettings}
          mediaItems={mediaItems}
          gpsLocation={gpsLocation}
        />

        {/* Post + Save Draft buttons */}
        <div
          className="px-4 flex flex-col gap-3"
          style={{
            paddingBottom: "max(env(safe-area-inset-bottom, 0px), 24px)",
            paddingTop: 12,
            borderTop: "1px solid var(--border-light)",
          }}
        >
          <button
            type="button"
            onClick={() => doPost(false)}
            disabled={isPosting || postResult === "success"}
            className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 text-white"
            style={{
              backgroundColor: postResult === "success" ? "#16a34a" : postResult === "error" ? "#dc2626" : "var(--accent-primary)",
              opacity: isPosting ? 0.8 : 1,
              pointerEvents: postResult === "success" ? "none" : "auto",
            }}
          >
            {isPosting
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Posting…</>
              : postResult === "success"
              ? "✓ Post Shared!"
              : postResult === "error"
              ? `✗ ${postError || "Failed — tap to retry"}`
              : <><Send className="w-4 h-4" /> Share Post</>}
          </button>
          <button
            type="button"
            onClick={() => doPost(true)}
            disabled={isPosting}
            className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}
          >
            <BookMarked className="w-4 h-4" />
            Save Draft
          </button>
        </div>
      </div>
    </div>
  );
}