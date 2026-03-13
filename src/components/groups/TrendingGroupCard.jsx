import React, { useState, useEffect } from "react";
import { X, Users, Play } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function TrendingGroupCard({ group, onDismiss, onJoin, onOpen, mutualMembers = [] }) {
  const { data: posts = [] } = useQuery({
    queryKey: ["groupPosts", group.id],
    queryFn: () => base44.entities.CommunityPost.filter({ group_id: group.id }, "-created_date", 8),
  });

  const previewPosts = posts.filter(p => p.media_urls?.length > 0 || p.video_url || p.image_url).slice(0, 4);

  return (
    <div
      onClick={() => onOpen(group)}
      className="shrink-0 rounded-[28px] overflow-hidden cursor-pointer"
      style={{
        width: "100%",
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-light)",
        boxShadow: "var(--elevation-3)",
      }}>
      
      {/* Top section */}
      <div className="p-4 relative">
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center z-10"
          style={{ backgroundColor: "rgba(250,250,248,0.95)", border: "1px solid var(--border-light)" }}>
          <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl shrink-0"
            style={{ background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))" }}>
            {group.logo_url || group.cover_image_url ? (
              <img src={group.logo_url || group.cover_image_url} alt="" className="w-full h-full rounded-full object-cover" loading="lazy" />
            ) : (
              <span>{group.emoji || "💬"}</span>
            )}
          </div>
          <div className="flex-1 min-w-0 pr-8">
            <h3 className="font-bold text-[15px] leading-tight mb-0.5" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              {group.name}
            </h3>
            <p className="text-[11px]" style={{ color: "var(--text-hint)" }}>
              {mutualMembers.length > 0 ? (
                <>Friends with {mutualMembers.slice(0, 2).join(", ")}{mutualMembers.length > 2 && `, and ${mutualMembers.length - 2} others`}</>
              ) : (
                <>{(group.member_count || 0).toLocaleString()} members</>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Content preview thumbnails - horizontal row */}
      {previewPosts.length > 0 && (
        <div className="px-4 pb-4">
          <div className="flex gap-2">
            {previewPosts.map((post) => {
              const isVideo = !!post.video_url;
              const mediaUrl = isVideo ? post.video_url : post.media_urls?.[0];
              return (
                <div
                  key={post.id}
                  className="relative flex-1 aspect-[3/4] rounded-xl overflow-hidden"
                  style={{ backgroundColor: "var(--bg-subtle)" }}>
                  {mediaUrl ? (
                    <>
                      {isVideo ? (
                        <video src={mediaUrl} className="w-full h-full object-cover" />
                      ) : (
                        <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
                      )}
                      {isVideo && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                            <Play className="w-4 h-4 ml-0.5" style={{ color: "#000" }} fill="#000" />
                          </div>
                        </div>
                      )}
                      {post.view_count && (
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
                          {post.view_count > 999 ? `${(post.view_count / 1000).toFixed(1)}K` : post.view_count}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">📷</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 px-4 pb-4">
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
          className="flex-1 py-2.5 rounded-2xl text-sm font-semibold"
          style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
          Not Interested
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onJoin(group); }}
          className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-white"
          style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)" }}>
          Join Group
        </button>
      </div>
    </div>
  );
}