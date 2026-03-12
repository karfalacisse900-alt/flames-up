import React, { useState, useEffect } from "react";
import { X, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function TrendingGroupCard({ group, onDismiss, onJoin, onOpen, mutualMembers = [] }) {
  const [previewPosts, setPreviewPosts] = useState([]);

  const { data: posts = [] } = useQuery({
    queryKey: ["groupPosts", group.id],
    queryFn: () => base44.entities.CommunityPost.filter({ group_id: group.id }, "-created_date", 10),
  });

  useEffect(() => {
    if (posts.length > 0) {
      const withMedia = posts.filter(p => p.media_urls?.length > 0 || p.video_url);
      setPreviewPosts(withMedia.slice(0, 3));
    }
  }, [posts]);

  const getMediaUrl = (post) => {
    if (post.video_url) return post.video_url;
    if (post.media_urls?.[0]) return post.media_urls[0];
    return null;
  };

  return (
    <div
      className="shrink-0 rounded-3xl overflow-hidden"
      style={{
        width: 340,
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-light)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      }}>
      
      {/* Top section */}
      <div className="p-5 relative">
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "var(--bg-subtle)" }}>
          <X className="w-3.5 h-3.5" style={{ color: "var(--text-hint)" }} />
        </button>

        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
            style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)" }}>
            {group.cover_image_url ? (
              <img src={group.cover_image_url} alt="" className="w-full h-full rounded-2xl object-cover" />
            ) : (
              <span>{group.emoji || "💬"}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base leading-tight mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              {group.name}
            </h3>
            <p className="text-xs" style={{ color: "var(--text-hint)" }}>
              {mutualMembers.length > 0 ? (
                <>Friends with {mutualMembers.slice(0, 2).join(", ")}{mutualMembers.length > 2 && `, and ${mutualMembers.length - 2} others`}</>
              ) : (
                <><Users className="w-3 h-3 inline mr-0.5" />{(group.member_count || 0).toLocaleString()} members</>
              )}
            </p>
          </div>
        </div>

        {/* Content preview */}
        {previewPosts.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-hint)" }}>Recent posts</p>
            <div className="flex gap-2">
              {previewPosts.map((post, i) => {
                const mediaUrl = getMediaUrl(post);
                const isVideo = !!post.video_url;
                return (
                  <div
                    key={post.id}
                    onClick={() => onOpen(group)}
                    className="relative flex-1 aspect-square rounded-xl overflow-hidden cursor-pointer"
                    style={{ backgroundColor: "var(--bg-subtle)" }}>
                    {mediaUrl ? (
                      isVideo ? (
                        <>
                          <video src={mediaUrl} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                              <div style={{ width: 0, height: 0, borderLeft: "6px solid #000", borderTop: "4px solid transparent", borderBottom: "4px solid transparent", marginLeft: 2 }} />
                            </div>
                          </div>
                          {post.view_count && (
                            <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white"
                              style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
                              {post.view_count > 999 ? `${(post.view_count / 1000).toFixed(1)}K` : post.view_count} views
                            </div>
                          )}
                        </>
                      ) : (
                        <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">📷</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Description */}
        {group.description && (
          <p className="text-xs line-clamp-2 mb-4" style={{ color: "var(--text-secondary)" }}>
            {group.description}
          </p>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={onDismiss}
            className="flex-1 py-2.5 rounded-2xl text-sm font-semibold"
            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
            Not Interested
          </button>
          <button
            onClick={() => onJoin(group)}
            className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)" }}>
            Join Group
          </button>
        </div>
      </div>
    </div>
  );
}