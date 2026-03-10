import React, { useState, useRef } from "react";
import { MapPin, Link as LinkIcon, Lock, MessageCircle, Copy, Eye, Zap } from "lucide-react";

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
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const captionRef = useRef(null);

  const handleSettingChange = (field, value) => {
    setPostSettings((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Caption */}
      <div>
        <label className="text-sm font-semibold block mb-2" style={{ color: "var(--text-primary)" }}>
          Caption
        </label>
        <textarea
          ref={captionRef}
          value={postSettings.caption}
          onChange={(e) => handleSettingChange("caption", e.target.value)}
          placeholder="What's on your mind? ✨"
          className="w-full p-3 rounded-xl text-sm outline-none resize-none"
          style={{
            backgroundColor: "var(--bg-subtle)",
            border: "1px solid var(--border-light)",
            color: "var(--text-primary)",
            minHeight: "100px",
          }}
        />
        <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>
          {postSettings.caption.length} characters
        </p>
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
              className={`p-3 rounded-xl font-medium text-sm transition-all ${
                postSettings.privacy === option.value
                  ? "ring-2"
                  : ""
              }`}
              style={{
                backgroundColor:
                  postSettings.privacy === option.value
                    ? "var(--accent-primary-light)"
                    : "var(--bg-card)",
                color: "var(--text-primary)",
                borderColor: "var(--border-light)",
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

      {/* Location */}
      <div>
        <label className="text-sm font-semibold block mb-2 flex items-center gap-1">
          <MapPin className="w-4 h-4" />
          Location Tag
        </label>
        {postSettings.location ? (
          <div
            className="p-3 rounded-xl flex items-center justify-between"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
          >
            <div>
              <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                {postSettings.location.name}
              </p>
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>
                {postSettings.location.city}, {postSettings.location.region}
              </p>
            </div>
            <button
              onClick={() => handleSettingChange("location", null)}
              className="text-red-500 font-bold"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            className="w-full p-3 rounded-xl font-semibold"
            style={{ backgroundColor: "var(--bg-card)", color: "var(--accent-primary)" }}
          >
            <MapPin className="w-4 h-4 inline mr-1.5" />
            Add Location
          </button>
        )}
      </div>

      {/* Show in Nearby */}
      {postSettings.location && (
        <div
          className="p-3 rounded-xl flex items-center justify-between"
          style={{ backgroundColor: "var(--accent-primary-light)" }}
        >
          <label className="font-semibold text-sm flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Show in Nearby
          </label>
          <input
            type="checkbox"
            checked={postSettings.showInNearby}
            onChange={(e) => handleSettingChange("showInNearby", e.target.checked)}
            className="w-5 h-5 cursor-pointer"
          />
        </div>
      )}

      {/* More Options */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full p-3 rounded-xl font-semibold flex items-center justify-between"
        style={{ backgroundColor: "var(--bg-card)" }}
      >
        <span className="flex items-center gap-2">
          <Zap className="w-4 h-4" />
          More Options
        </span>
        <span>{showAdvanced ? "▼" : "▶"}</span>
      </button>

      {showAdvanced && (
        <div className="space-y-3 p-3 rounded-xl" style={{ backgroundColor: "var(--bg-card)" }}>
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