import React, { useState, useRef } from "react";
import { MapPin, Link as LinkIcon, Lock, MessageCircle, Eye, Zap, AlertCircle, EyeOff } from "lucide-react";
import LocationTagButton from "../LocationTagButton";
import ReactQuill from "react-quill";

const LOCATION_TYPES = ["city", "place", "event", "venue"];
const PRIVACY_OPTIONS = [
  { value: "public", label: "Public", icon: "🌍" },
  { value: "followers", label: "Followers", icon: "👥" },
  { value: "friends", label: "Friends", icon: "👫" },
  { value: "only_me", label: "Only Me", icon: "🔒" },
];
const LINK_TYPES = [
  { value: "website", label: "Website" },
  { value: "product", label: "Product" },
  { value: "portfolio", label: "Portfolio" },
  { value: "spotify", label: "Spotify" },
  { value: "fiverr", label: "Fiverr" },
  { value: "shopify", label: "Shopify" },
];

export default function PostSettingsStep({
  user,
  postSettings,
  setPostSettings,
  onNext,
  isLoading,
  gpsLocation,
  gpsCoords,
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const captionRef = useRef(null);

  const handleSettingChange = (field, value) => {
    setPostSettings((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-4 space-y-4 pb-32" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Caption */}
      <div>
        <label className="text-sm font-bold block mb-3" style={{ color: "var(--text-primary)", fontSize: "16px" }}>
          ✨ Add Caption
        </label>
        <textarea
          value={postSettings.caption}
          onChange={(e) => handleSettingChange("caption", e.target.value)}
          placeholder="Share what's on your mind, ask a question, or tell a story…"
          className="w-full p-4 rounded-2xl text-sm outline-none resize-none"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "2px solid var(--border-light)",
            color: "var(--text-primary)",
            minHeight: "120px",
            fontFamily: "var(--font-sans)",
          }}
        />
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs" style={{ color: "var(--text-hint)" }}>
            {postSettings.caption.length} characters
          </p>
          {postSettings.caption.length > 500 && (
            <p className="text-xs flex items-center gap-1" style={{ color: "var(--accent-secondary)" }}>
              <AlertCircle className="w-3 h-3" /> Getting long!
            </p>
          )}
        </div>
      </div>

      {/* Privacy */}
      <div>
        <label className="text-sm font-semibold block mb-2" style={{ color: "var(--text-primary)" }}>
          Who Can View
        </label>
        <div className="grid grid-cols-2 gap-2">
          {PRIVACY_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSettingChange("privacy", option.value)}
              className={`p-3 rounded-xl font-medium text-sm transition-all border-2 ${
                postSettings.privacy === option.value
                  ? ""
                  : ""
              }`}
              style={{
                backgroundColor:
                  postSettings.privacy === option.value
                    ? "var(--accent-primary)"
                    : "var(--bg-card)",
                color: postSettings.privacy === option.value ? "#fff" : "var(--text-primary)",
                borderColor: postSettings.privacy === option.value ? "var(--accent-primary)" : "var(--border-light)",
              }}
            >
              <span className="text-base mr-1">{option.icon}</span>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Add Link */}
      <div>
        <label className="text-sm font-semibold block mb-2" style={{ color: "var(--text-primary)" }}>
          Add Link
        </label>
        <div className="flex gap-2 mb-2">
          <select
            value={postSettings.linkType}
            onChange={(e) => handleSettingChange("linkType", e.target.value)}
            className="flex-1 px-3 py-2.5 rounded-lg text-sm outline-none"
            style={{
              backgroundColor: "var(--bg-subtle)",
              border: "1px solid var(--border-light)",
              color: "var(--text-primary)",
            }}
          >
            {LINK_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        <input
          type="url"
          value={postSettings.link}
          onChange={(e) => handleSettingChange("link", e.target.value)}
          placeholder="https://example.com"
          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
          style={{
            backgroundColor: "var(--bg-subtle)",
            border: "1px solid var(--border-light)",
            color: "var(--text-primary)",
          }}
        />
      </div>

      {/* Auto-detected location banner */}
      {(gpsLocation?.city || gpsLocation?.country) && !postSettings.location && (
        <div
          className="p-3 rounded-xl flex items-center gap-2 text-sm"
          style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}
        >
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span>
            📍 Auto-detected: <strong>
              {[gpsLocation.city, gpsLocation.region, gpsLocation.country].filter(Boolean).join(", ")}
            </strong>
          </span>
        </div>
      )}

      {/* Manual location tag */}
      <div>
        <label className="text-sm font-semibold block mb-2 flex items-center gap-1" style={{ color: "var(--text-primary)" }}>
          <MapPin className="w-4 h-4" />
          Tag a Specific Place (Optional)
        </label>
        <LocationTagButton 
          location={postSettings.location} 
          onLocation={(loc) => handleSettingChange("location", loc)} 
        />
        <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>
          e.g. Central Park, Brooklyn Bridge — GPS location is always stored automatically
        </p>
      </div>

      {/* Hide exact location privacy toggle */}
      <div
        className="p-3 rounded-xl flex items-center justify-between"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
      >
        <label className="font-semibold text-sm flex items-center gap-2 cursor-pointer">
          <EyeOff className="w-4 h-4" />
          Hide Exact Coordinates
          <span className="font-normal text-xs" style={{ color: "var(--text-hint)" }}>
            (show only city/country)
          </span>
        </label>
        <input
          type="checkbox"
          checked={postSettings.location_hide_exact || false}
          onChange={(e) => handleSettingChange("location_hide_exact", e.target.checked)}
          className="w-5 h-5 cursor-pointer"
        />
      </div>

      {/* More Options */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full p-3 rounded-xl font-semibold flex items-center justify-between"
        style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}
      >
        <span className="flex items-center gap-2">
          <Zap className="w-4 h-4" />
          More Options
        </span>
        <span>{showAdvanced ? "▼" : "▶"}</span>
      </button>

      {showAdvanced && (
        <div className="space-y-3 p-3 rounded-xl" style={{ backgroundColor: "var(--accent-primary-light)", border: "1px solid var(--accent-primary)" }}>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-semibold flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Allow Comments
            </span>
            <input
              type="checkbox"
              checked={postSettings.allowComments}
              onChange={(e) => handleSettingChange("allowComments", e.target.checked)}
              className="w-4 h-4"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-semibold">Allow Remix</span>
            <input
              type="checkbox"
              checked={postSettings.allowRemix}
              onChange={(e) => handleSettingChange("allowRemix", e.target.checked)}
              className="w-4 h-4"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-semibold">Allow Sharing</span>
            <input
              type="checkbox"
              checked={postSettings.allowSharing}
              onChange={(e) => handleSettingChange("allowSharing", e.target.checked)}
              className="w-4 h-4"
            />
          </label>

          <hr style={{ borderColor: "var(--border-light)" }} />

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-semibold">Mark as Event</span>
            <input
              type="checkbox"
              checked={postSettings.isEvent}
              onChange={(e) => handleSettingChange("isEvent", e.target.checked)}
              className="w-4 h-4"
            />
          </label>

          {user?.is_creator && (
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-semibold">Mark as Product/Service</span>
              <input
                type="checkbox"
                checked={postSettings.isProduct}
                onChange={(e) => handleSettingChange("isProduct", e.target.checked)}
                className="w-4 h-4"
              />
            </label>
          )}
        </div>
      )}
    </div>
  );
}