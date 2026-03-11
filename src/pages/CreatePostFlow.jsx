import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, X, BookMarked, Send, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { useLocationDetection } from "../components/hooks/useLocationDetection";

import CameraUploadStep from "../components/community/creator/CameraUploadStep";
import CreatorEditorStep from "../components/community/creator/CreatorEditorStep";
import PostSettingsPanel from "../components/community/creator/PostSettingsPanel";

export default function CreatePostFlow() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  // step: 1 = camera/upload, 2 = editor, 3 = settings
  const [step, setStep] = useState(1);

  const [mediaItems, setMediaItems] = useState([]);
  const [currentEditingIndex, setCurrentEditingIndex] = useState(0);
  const [selectedTrack, setSelectedTrack] = useState(null);

  const [postSettings, setPostSettings] = useState({
    caption: "",
    hashtags: [],
    link: "",
    linkType: "website",
    showInNearby: false,
    location: null,
    location_hide_exact: false,
    privacy: "public",
    allowComments: true,
    allowRemix: false,
    allowSharing: true,
    isEvent: false,
    isProduct: false,
    isAIGenerated: false,
  });

  const [isPosting, setIsPosting] = useState(false);

  const { coords: gpsCoords, locationInfo: gpsLocation } = useLocationDetection({ autoDetect: true });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => navigate(createPageUrl("Home")));
  }, []);

  // ── post logic ────────────────────────────────────────────────────────────
  const doPost = async (asDraft = false) => {
    if (!user || mediaItems.length === 0) {
      alert("Please add at least one media item");
      return;
    }
    setIsPosting(true);
    try {
      const uploadedUrls = [];
      const isVideo = mediaItems.length === 1 && mediaItems[0].type?.startsWith("video");

      for (const item of mediaItems) {
        if (item.file) {
          const { file_url } = await base44.integrations.Core.UploadFile({ file: item.file });
          uploadedUrls.push(file_url);
        } else if (item.preview) {
          uploadedUrls.push(item.preview);
        }
      }

      const manualLoc = postSettings.location;
      const hashtagStr = (postSettings.hashtags || []).map((t) => `#${t}`).join(" ");
      const rawCaption = postSettings.caption || "";

      const postData = {
        type: "opinion",
        body: rawCaption + (hashtagStr ? `\n${hashtagStr}` : ""),
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
        moderation_status: asDraft ? "pending" : "approved",
        tags: postSettings.hashtags || [],
        upvotes: 0,
        downvotes: 0,
        comment_count: 0,
        engagement_score: 0,
        is_creator_post: user.is_creator || false,
      };

      await base44.entities.CommunityPost.create(postData);
      navigate(createPageUrl("Home"));
    } catch (err) {
      console.error("Post error:", err);
      alert("Failed to post. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  // ── loading ───────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: "#000" }}>
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  // ── Step 1: Full-screen camera / upload ───────────────────────────────────
  if (step === 1) {
    return (
      <CameraUploadStep
        onMediaSelected={(items) => {
          setMediaItems(items);
          setStep(2);
        }}
        onClose={() => navigate(createPageUrl("Home"))}
      />
    );
  }

  // ── Step 2 & 3 share a chrome ─────────────────────────────────────────────
  return (
    <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: step === 2 ? "#000" : "var(--bg-app)" }}>

      {/* ── Header ── */}
      <div
        className="flex-shrink-0 flex items-center gap-3 px-4"
        style={{
          paddingTop: "max(env(safe-area-inset-top, 0px), 44px)",
          paddingBottom: 12,
          backgroundColor: step === 2 ? "#0d0d0d" : "var(--bg-card)",
          borderBottom: step === 2 ? "1px solid #1e1e1e" : "1px solid var(--border-light)",
        }}
      >
        <button
          onClick={() => setStep(step - 1)}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: step === 2 ? "rgba(255,255,255,0.08)" : "var(--bg-subtle)",
            border: step === 2 ? "1px solid #333" : "1px solid var(--border-light)",
          }}
        >
          <ArrowLeft className="w-4 h-4" style={{ color: step === 2 ? "#fff" : "var(--text-primary)" }} />
        </button>

        <h1
          className="flex-1 text-center text-base font-bold"
          style={{ color: step === 2 ? "#fff" : "var(--text-primary)", fontFamily: "var(--font-serif)" }}
        >
          {step === 2 ? "Edit" : "New Post"}
        </h1>

        <button
          onClick={() => setStep(step + 1)}
          className="px-5 py-2 rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: "var(--accent-primary)" }}
        >
          Next
        </button>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {step === 2 && (
          <CreatorEditorStep
            mediaItems={mediaItems}
            setMediaItems={setMediaItems}
            currentEditingIndex={currentEditingIndex}
            setCurrentEditingIndex={setCurrentEditingIndex}
            selectedTrack={selectedTrack}
            onSelectTrack={setSelectedTrack}
          />
        )}

        {step === 3 && (
          <PostSettingsPanel
            user={user}
            postSettings={postSettings}
            setPostSettings={setPostSettings}
            mediaItems={mediaItems}
            gpsLocation={gpsLocation}
          />
        )}
      </div>

      {/* ── Step 3 footer: Drafts + Post ── */}
      {step === 3 && (
        <div
          className="flex-shrink-0 flex gap-3 px-4"
          style={{
            paddingBottom: "max(env(safe-area-inset-bottom, 0px), 20px)",
            paddingTop: 12,
            backgroundColor: "var(--bg-card)",
            borderTop: "1px solid var(--border-light)",
          }}
        >
          <button
            onClick={() => doPost(true)}
            disabled={isPosting}
            className="flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}
          >
            <BookMarked className="w-4 h-4" />
            Save Draft
          </button>
          <button
            onClick={() => doPost(false)}
            disabled={isPosting}
            className="flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--accent-primary)" }}
          >
            {isPosting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" /> Post
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}