import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, X } from "lucide-react";
import MediaUploadStep from "../components/community/steps/MediaUploadStep";
import MediaEditingStep from "../components/community/steps/MediaEditingStep";
import PostSettingsStep from "../components/community/steps/PostSettingsStep";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { useLocationDetection } from "../components/hooks/useLocationDetection";

export default function CreatePostFlow() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1);
  
  // Media state
  const [mediaItems, setMediaItems] = useState([]);

  // Editing state
  const [currentEditingIndex, setCurrentEditingIndex] = useState(0);

  // Settings state
  const [postSettings, setPostSettings] = useState({
    caption: "",
    link: "",
    linkType: "website",
    showInNearby: false,
    location: null,
    privacy: "public",
    allowComments: true,
    allowRemix: false,
    allowSharing: true,
    isEvent: false,
    isProduct: false,
  });
  
  const [isPosting, setIsPosting] = useState(false);

  // Auto-detect GPS location in background
  const { coords: gpsCoords, locationInfo: gpsLocation } = useLocationDetection({ autoDetect: true });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => navigate(createPageUrl("Home")));
  }, []);

  const handleNext = () => {
    if (step === 1 && mediaItems.length === 0) {
      alert("Please select at least one media item");
      return;
    }
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handlePost = async () => {
    if (!user || mediaItems.length === 0) {
      alert("Please add at least one media item");
      return;
    }
    
    setIsPosting(true);
    try {
      const uploadedUrls = [];
      const isVideo = mediaItems.length === 1 && mediaItems[0].type.startsWith("video");
      
      // Upload all media files
      for (const item of mediaItems) {
        if (item.file) {
          const uploadedFile = await base44.integrations.Core.UploadFile({
            file: item.file,
          });
          uploadedUrls.push(uploadedFile.file_url);
        }
      }

      // Merge: manual location tag overrides GPS, but GPS fills any blanks
      const manualLoc = postSettings.location;
      const postData = {
        type: "opinion",
        body: postSettings.caption || "Check out this post!",
        author_email: user.email,
        author_name: user.display_name || user.full_name || "Anonymous",
        author_avatar_url: user.avatar_url || "",
        is_anonymous: false,
        media_type: "general",
        video_url: isVideo ? uploadedUrls[0] : undefined,
        image_urls: !isVideo && uploadedUrls.length > 0 ? uploadedUrls : undefined,
        // Location: manual tag takes priority, GPS auto-fills the rest
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
      };

      await base44.entities.CommunityPost.create(postData);
      navigate(createPageUrl("Home"));
    } catch (error) {
      console.error("Error posting:", error);
      alert("Failed to post. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  const stepTitles = ["Upload Media", "Edit Media", "Post Settings"];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-app)" }}>
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-3 border-b flex items-center justify-between" 
        style={{ background: "linear-gradient(135deg, var(--accent-primary), #4CAF7D)", borderColor: "var(--accent-primary)" }}>
        <button onClick={step === 1 ? () => navigate(createPageUrl("Home")) : handleBack} className="p-2 -m-2" style={{ color: "#fff" }}>
          {step === 1 ? <X className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
        </button>
        <div className="text-center flex-1">
          <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>STEP {step} OF 3</p>
          <h1 className="text-lg font-bold" style={{ color: "#fff" }}>{stepTitles[step - 1]}</h1>
        </div>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="overflow-y-auto" style={{ height: "calc(100vh - 120px)" }}>
        {step === 1 && (
          <MediaUploadStep
            mediaItems={mediaItems}
            setMediaItems={setMediaItems}
            onNext={step < 3 ? handleNext : undefined}
          />
        )}
        
        {step === 2 && (
          <MediaEditingStep
            mediaItems={mediaItems}
            setMediaItems={setMediaItems}
            currentEditingIndex={currentEditingIndex}
            setCurrentEditingIndex={setCurrentEditingIndex}
            onNext={handleNext}
          />
        )}
        
        {step === 3 && (
          <PostSettingsStep
            user={user}
            postSettings={postSettings}
            setPostSettings={setPostSettings}
            onNext={handlePost}
            isLoading={isPosting}
            gpsLocation={gpsLocation}
            gpsCoords={gpsCoords}
          />
        )}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 px-4 py-3 border-t gap-2 flex" 
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--accent-primary-light)", borderTopWidth: "2px" }}>
        {step > 1 && (
          <button
            onClick={handleBack}
            className="flex-1 py-3 rounded-xl font-bold"
            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", border: "1px solid var(--border-light)" }}
          >
            Back
          </button>
        )}
        <button
          onClick={step === 3 ? handlePost : handleNext}
          disabled={isPosting}
          className="flex-1 py-3 rounded-xl font-bold text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--accent-primary)" }}
        >
          {isPosting ? "Posting..." : step === 3 ? "Post" : "Next"}
        </button>
      </div>
    </div>
  );
}