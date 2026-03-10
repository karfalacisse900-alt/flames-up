import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "../utils";
import { ArrowLeft, MessageSquare, Heart, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

const PLATFORM_ICONS = {
  fiverr: "💼",
  spotify: "🎵",
  shopify: "🛍️",
  instagram: "📸",
  twitter: "𝕏",
  tiktok: "🎬",
  youtube: "▶️",
  linkedin: "💻",
  portfolio: "🌐",
};

export default function CreatorProfile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const creatorEmail = searchParams.get("email");
  const [creator, setCreator] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then((u) => {
      setCurrentUser(u);
      setIsOwnProfile(u?.email === creatorEmail);
    });
  }, [creatorEmail]);

  const { data: creatorData } = useQuery({
    queryKey: ["creator", creatorEmail],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users.find((u) => u.email === creatorEmail);
    },
    enabled: !!creatorEmail,
  });

  const { data: creatorApp } = useQuery({
    queryKey: ["creatorApp", creatorEmail],
    queryFn: () => base44.entities.CreatorApplication.filter({ user_email: creatorEmail }),
    enabled: !!creatorEmail,
  });

  useEffect(() => {
    if (creatorData) {
      setCreator(creatorData);
    }
  }, [creatorData]);

  if (!creator) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)" }} />
      </div>
    );
  }

  const creatorInfo = creatorApp?.[0];

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b px-4 py-3 flex items-center gap-3" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)" }}>
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:opacity-70">
          <ArrowLeft className="w-5 h-5" style={{ color: "var(--text-primary)" }} />
        </button>
        <h1 className="text-lg font-bold flex-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
          Creator Profile
        </h1>
      </div>

      {/* Creator Banner */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, var(--accent-primary), #4CAF7D)", height: "160px" }}>
        <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle at 20% 50%, #fff, transparent)` }} />
      </div>

      {/* Profile Info */}
      <div className="max-w-lg mx-auto px-4">
        {/* Avatar */}
        <div className="flex flex-col items-center -mt-20 relative z-10 mb-6">
          <div
            className="w-32 h-32 rounded-full flex items-center justify-center text-5xl font-bold shadow-lg border-4"
            style={{
              backgroundColor: "var(--bg-card)",
              borderColor: "var(--accent-primary)",
              color: "var(--accent-primary)",
            }}
          >
            {creator.avatar_url ? (
              <img src={creator.avatar_url} alt={creator.full_name} className="w-full h-full object-cover rounded-full" />
            ) : (
              creator.full_name?.[0]?.toUpperCase()
            )}
          </div>

          {/* Name & Category */}
          <h2 className="text-2xl font-bold mt-4" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
            {creator.full_name || creator.email}
          </h2>
          {creatorInfo && (
            <p className="text-sm mt-1" style={{ color: "var(--accent-primary)" }}>
              ⭐ {creatorInfo.creator_category.replace("_", " ").toUpperCase()}
            </p>
          )}

          {/* Bio */}
          {creator.about_me && (
            <p className="text-sm text-center mt-4 leading-relaxed max-w-md" style={{ color: "var(--text-secondary)" }}>
              {creator.about_me}
            </p>
          )}

          {/* Creator Description */}
          {creatorInfo?.description && (
            <div className="mt-6 p-4 rounded-2xl w-full" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
              <p className="text-xs font-semibold mb-2 uppercase" style={{ color: "var(--text-hint)" }}>
                About Their Work
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
                {creatorInfo.description}
              </p>
            </div>
          )}

          {/* Action Buttons - Only for other users */}
          {!isOwnProfile && currentUser && (
            <div className="flex gap-3 w-full mt-6">
              <button
                onClick={() => navigate(createPageUrl(`Messages?email=${creatorEmail}`))}
                className="flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-white"
                style={{ backgroundColor: "var(--accent-primary)" }}
              >
                <MessageSquare className="w-4 h-4" />
                Message
              </button>
              <button
                className="flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                style={{ backgroundColor: "var(--bg-subtle)", color: "var(--accent-primary)", border: "1px solid var(--border-light)" }}
              >
                <Heart className="w-4 h-4" />
                Tip
              </button>
            </div>
          )}

          {/* External Links */}
          {creatorInfo?.external_links && Object.keys(creatorInfo.external_links).length > 0 && (
            <div className="mt-6 w-full">
              <p className="text-xs font-semibold mb-3 uppercase" style={{ color: "var(--text-hint)" }}>
                Find Them On
              </p>
              <div className="space-y-2">
                {Object.entries(creatorInfo.external_links).map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl transition-all active:scale-95"
                    style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
                  >
                    <span className="text-lg">{PLATFORM_ICONS[platform] || "🔗"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </p>
                      <p className="text-xs truncate" style={{ color: "var(--text-hint)" }}>
                        {url}
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio Link */}
          {creatorInfo?.portfolio_link && (
            <a
              href={creatorInfo.portfolio_link}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full mt-6 py-3 rounded-xl font-bold text-center border-2 transition-all"
              style={{
                borderColor: "var(--accent-primary)",
                color: "var(--accent-primary)",
                backgroundColor: "var(--accent-primary-light)",
              }}
            >
              View Full Portfolio →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}