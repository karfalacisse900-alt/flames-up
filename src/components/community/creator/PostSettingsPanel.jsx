import React, { useState } from "react";
import {
  MapPin, EyeOff, ChevronRight, Hash, Globe, Link as LinkIcon, Users, Bot, BarChart3,
} from "lucide-react";
import LocationTagButton from "../LocationTagButton";
import ReactQuill from "react-quill";
import PollCreator from "../PollCreator";

const PRIVACY_OPTIONS = [
  { value: "public",    label: "Everyone", icon: "🌍" },
  { value: "followers", label: "Followers", icon: "👥" },
  { value: "friends",   label: "Friends",   icon: "👫" },
  { value: "only_me",   label: "Only Me",   icon: "🔒" },
];

export default function PostSettingsPanel({
  user,
  postSettings,
  setPostSettings,
  mediaItems,
  gpsLocation,
}) {
  const [showMore, setShowMore] = useState(false);
  const [hashtagInput, setHashtagInput] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);

  const set = (field, value) => setPostSettings((prev) => ({ ...prev, [field]: value }));

  const addHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, "");
    if (!tag) return;
    set("hashtags", [...new Set([...(postSettings.hashtags || []), tag])]);
    setHashtagInput("");
  };

  const removeHashtag = (tag) =>
    set("hashtags", (postSettings.hashtags || []).filter((t) => t !== tag));

  const coverThumb = mediaItems?.[0];

  return (
    <div style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Cover thumbnail + caption */}
      <div className="flex gap-3 p-4" style={{ borderBottom: "1px solid var(--border-light)" }}>
        {coverThumb && (
          <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0"
            style={{ border: "1px solid var(--border-light)" }}>
            {coverThumb.type?.startsWith("video") ? (
              <video src={coverThumb.preview} className="w-full h-full object-cover" />
            ) : (
              <img src={coverThumb.preview} alt="" className="w-full h-full object-cover" />
            )}
          </div>
        )}
        <div className="flex-1">
          <div className="rounded-xl overflow-hidden"
            style={{ border: "1px solid var(--border-light)", backgroundColor: "var(--bg-card)" }}>
            <ReactQuill
              theme="snow"
              value={postSettings.caption}
              onChange={(v) => set("caption", v)}
              placeholder="Write a caption, ask a question, tell a story…"
              modules={{
                toolbar: [
                  ["bold", "italic"],
                  [{ list: "ordered" }, { list: "bullet" }],
                  ["link"],
                  ["clean"],
                ],
              }}
              formats={["bold", "italic", "list", "bullet", "link"]}
            />
          </div>
        </div>
      </div>

      {/* Hashtags */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-light)" }}>
        <div className="flex items-center gap-2 mb-2">
          <Hash className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Hashtags</span>
        </div>
        {(postSettings.hashtags || []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {(postSettings.hashtags || []).map((tag) => (
              <button key={tag} onClick={() => removeHashtag(tag)}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
                #{tag} ×
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            value={hashtagInput}
            onChange={(e) => setHashtagInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addHashtag()}
            placeholder="Add hashtag…"
            className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
            style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
          />
          <button onClick={addHashtag} className="px-4 py-2 rounded-xl text-white text-sm font-semibold"
            style={{ backgroundColor: "var(--accent-primary)" }}>
            +
          </button>
        </div>
      </div>

      {/* Who can view */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-light)" }}>
        <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--text-hint)" }}>
          Who can view
        </p>
        <div className="grid grid-cols-4 gap-2">
          {PRIVACY_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => set("privacy", opt.value)}
              className="py-2.5 rounded-xl text-center transition-all border"
              style={{
                backgroundColor: postSettings.privacy === opt.value ? "var(--accent-primary)" : "var(--bg-card)",
                color: postSettings.privacy === opt.value ? "#fff" : "var(--text-secondary)",
                borderColor: postSettings.privacy === opt.value ? "var(--accent-primary)" : "var(--border-light)",
              }}>
              <div className="text-base">{opt.icon}</div>
              <div className="text-[10px] font-semibold mt-0.5">{opt.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Location */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-light)" }}>
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Tag Location</span>
        </div>
        {(gpsLocation?.city || gpsLocation?.country) && !postSettings.location && (
          <div className="mb-2 text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5"
            style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
            <MapPin className="w-3 h-3" />
            Auto-detected: {[gpsLocation.city, gpsLocation.country].filter(Boolean).join(", ")}
          </div>
        )}
        <LocationTagButton location={postSettings.location} onLocation={(loc) => set("location", loc)} />
      </div>

      {/* Show in Nearby */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-light)" }}>
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
          <div>
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Show in Nearby</span>
            <p className="text-xs" style={{ color: "var(--text-hint)" }}>Visible to users near your location</p>
          </div>
        </div>
        <input type="checkbox" checked={postSettings.showInNearby || false}
          onChange={(e) => set("showInNearby", e.target.checked)}
          className="w-5 h-5 cursor-pointer" style={{ accentColor: "var(--accent-primary)" }} />
      </div>

      {/* Hide exact location */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-light)" }}>
        <div className="flex items-center gap-2">
          <EyeOff className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          <div>
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Hide Exact Coordinates</span>
            <p className="text-xs" style={{ color: "var(--text-hint)" }}>Show city/country only</p>
          </div>
        </div>
        <input type="checkbox" checked={postSettings.location_hide_exact || false}
          onChange={(e) => set("location_hide_exact", e.target.checked)}
          className="w-5 h-5 cursor-pointer" style={{ accentColor: "var(--accent-primary)" }} />
      </div>

      {/* Add Link */}
      <button onClick={() => setShowLinkInput((v) => !v)}
        className="w-full px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--border-light)" }}>
        <div className="flex items-center gap-2">
          <LinkIcon className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Add Link</span>
        </div>
        <ChevronRight className="w-4 h-4" style={{ color: "var(--text-hint)", transform: showLinkInput ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
      </button>
      {showLinkInput && (
        <div className="px-4 pb-3" style={{ borderBottom: "1px solid var(--border-light)" }}>
          <input type="url" value={postSettings.link || ""} onChange={(e) => set("link", e.target.value)}
            placeholder="https://example.com"
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
        </div>
      )}

      {/* Tag Friends */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-light)" }}>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Tag Friends</span>
        </div>
        <span className="text-xs" style={{ color: "var(--text-hint)" }}>Coming soon</span>
      </div>

      {/* More options toggle */}
      <button onClick={() => setShowMore((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3"
        style={{ borderBottom: showMore ? "none" : "1px solid var(--border-light)" }}>
        <span className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>More Options</span>
        <ChevronRight className="w-4 h-4"
          style={{ color: "var(--text-hint)", transform: showMore ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
      </button>

      {showMore && (
        <div style={{ borderBottom: "1px solid var(--border-light)" }}>
          {[
            { label: "Allow Comments",            key: "allowComments" },
            { label: "Allow Remix",               key: "allowRemix" },
            { label: "Allow Sharing",             key: "allowSharing" },
            { label: "AI-Generated Content",      key: "isAIGenerated", icon: Bot },
            { label: "Post Anonymously",          key: "isAnonymous" },
            ...(user?.is_creator ? [{ label: "Mark as Product/Service", key: "isProduct" }] : []),
          ].map(({ label, key }) => (
            <div key={key} className="px-4 py-3 flex items-center justify-between"
              style={{ borderBottom: "1px solid var(--border-light)" }}>
              <span className="text-sm" style={{ color: "var(--text-primary)" }}>{label}</span>
              <input type="checkbox" checked={postSettings[key] || false}
                onChange={(e) => set(key, e.target.checked)}
                className="w-5 h-5 cursor-pointer" style={{ accentColor: "var(--accent-primary)" }} />
            </div>
          ))}
        </div>
      )}

      {/* Bottom padding so footer doesn't overlap */}
      <div style={{ height: 100 }} />
    </div>
  );
}