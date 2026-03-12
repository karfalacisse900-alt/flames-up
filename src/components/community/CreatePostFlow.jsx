import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, X } from "lucide-react";
import MediaUploadStep from "./steps/MediaUploadStep";
import MediaEditingStep from "./steps/MediaEditingStep";
import PostSettingsStep from "./steps/PostSettingsStep";

export default function CreatePostFlow({ onClose, onSuccess }) {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1);
  const [selectedMode, setSelectedMode] = useState("60s"); // Photo, 15s, 60s, 3min
  
  // Media state
  const [mediaItems, setMediaItems] = useState([]); // Array of { id, file, preview, type, duration, edits }
  
  // Editing state
  const [currentEditingIndex, setCurrentEditingIndex] = useState(0);
  
  // Settings state
  const [postSettings, setPostSettings] = useState({
    caption: "",
    link: "",
    linkType: "website", // website, product, portfolio, spotify, fiverr, shopify
    showInNearby: false,
    location: null,
    privacy: "public", // public, friends, followers, only_me
    allowComments: true,
    allowRemix: false,
    allowSharing: true,
    isEvent: false,
    isProduct: false,
  });
  
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
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
    if (!user) return;
    
    setIsPosting(true);
    try {
      // Upload media files
      const uploadedUrls = [];
      const isVideo = mediaItems.length === 1 && mediaItems[0].type.startsWith("video");
      
      for (const item of mediaItems) {
        if (item.file) {
          const uploadedFile = await base44.integrations.Core.UploadFile({
            file: item.file,
          });
          uploadedUrls.push(uploadedFile.file_url);
        }
      }

      // Create community post
      const postData = {
        type: "opinion",
        body: postSettings.caption || "",
        author_email: user.email,
        author_name: user.full_name,
        author_avatar_url: user.avatar_url || "",
        is_anonymous: false,
        media_type: "general",
        video_url: isVideo ? uploadedUrls[0] : undefined,
        image_urls: mediaItems.length > 1 || (mediaItems[0]?.type.startsWith("image")) ? uploadedUrls : undefined,
        location_city: postSettings.location?.city,
        location_region: postSettings.location?.region,
        location_country: postSettings.location?.country,
        location_lat: postSettings.location?.lat,
        location_lng: postSettings.location?.lng,
        location_name: postSettings.location?.name,
        place_tags: postSettings.location ? [postSettings.location.type] : [],
        moderation_status: "pending",
        is_pinned: false,
        upvotes: 0,
        downvotes: 0,
        comment_count: 0,
      };

      // Add external link if provided
      if (postSettings.link) {
        postData.document_url = postSettings.link;
        postData.document_name = `Link: ${postSettings.linkType}`;
      }

      // Add location data for nearby discovery
      if (postSettings.showInNearby && postSettings.location) {
        postData.place_tags = [...(postData.place_tags || []), "nearby_discovery"];
      }

      const created = await base44.entities.CommunityPost.create(postData);
      
      onSuccess?.(created);
      onClose?.();
    } catch (error) {
      console.error("Error posting:", error);
      alert("Failed to post. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  const stepTitles = ["Upload Media", "Edit Media", "Post Settings"];

  return (
    <div className="fixed inset-0 z-50 bg-black" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-3 border-b flex items-center justify-between" 
        style={{ background: "linear-gradient(135deg, var(--accent-primary), #4CAF7D)", borderColor: "var(--accent-primary)" }}>
        <button onClick={step === 1 ? onClose : handleBack} className="p-2 -m-2" style={{ color: "#fff" }}>
          {step === 1 ? <X className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
        </button>
        <div className="text-center flex-1">
          <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>STEP {step} OF 3</p>
          <h1 className="text-lg font-bold" style={{ color: "#fff" }}>{stepTitles[step - 1]}</h1>
        </div>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="overflow-y-auto" style={{ height: "calc(100% - 120px)" }}>
        {step === 1 && (
          <MediaUploadStep
            mediaItems={mediaItems}
            setMediaItems={setMediaItems}
            onNext={handleNext}
            setSelectedMode={setSelectedMode}
          />
        )}
        
        {step === 2 && (
          <MediaEditingStep
            mediaItems={mediaItems}
            setMediaItems={setMediaItems}
            currentEditingIndex={currentEditingIndex}
            setCurrentEditingIndex={setCurrentEditingIndex}
            selectedMode={selectedMode}
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