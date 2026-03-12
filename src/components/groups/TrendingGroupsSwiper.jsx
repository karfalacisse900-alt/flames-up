import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { X, Play } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

function GroupPreviewCard({ group, onDismiss, onJoin, isMember, mutualFriends }) {
  const videoRefs = useRef([]);

  const { data: posts = [] } = useQuery({
    queryKey: ["groupPosts", group.id],
    queryFn: () => base44.entities.CommunityPost.filter({ group_id: group.id }, "-created_date", 20),
  });

  const mediaPosts = useMemo(() => 
    posts.filter(p => p.media_urls?.length > 0 || p.video_url).slice(0, 3),
    [posts]
  );

  useEffect(() => {
    // Auto-play all videos
    videoRefs.current.forEach(vid => {
      if (vid) {
        vid.muted = true;
        vid.playsInline = true;
        vid.play().catch(() => {});
      }
    });
    return () => {
      videoRefs.current.forEach(vid => {
        if (vid) vid.pause();
      });
    };
  }, [mediaPosts]);

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 pb-24">
      {/* Profile Picture */}
      <div className="w-40 h-40 rounded-full mb-6 overflow-hidden" style={{ border: "4px solid var(--bg-card)" }}>
        {group.cover_image_url ? (
          <img src={group.cover_image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl" style={{ backgroundColor: "var(--bg-subtle)" }}>
            {group.emoji || "💬"}
          </div>
        )}
      </div>

      {/* Group Name */}
      <h2 className="text-2xl font-bold mb-2 text-center" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
        {group.name}
      </h2>

      {/* Mutual Friends / Members */}
      {mutualFriends?.length > 0 ? (
        <div className="flex items-center gap-2 mb-6">
          <div className="flex -space-x-2">
            {mutualFriends.slice(0, 3).map((friend, i) => (
              <div key={i} className="w-6 h-6 rounded-full" style={{ border: "2px solid var(--bg-card)", backgroundColor: "var(--bg-subtle)" }} />
            ))}
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Friends with {mutualFriends[0]?.name || "JULIA D'ELIA"}, {mutualFriends[1]?.name || "Bianca"}, and {mutualFriends.length - 2} others
          </p>
        </div>
      ) : (
        <p className="text-sm mb-6" style={{ color: "var(--text-hint)" }}>
          {(group.member_count || 0).toLocaleString()} members
        </p>
      )}

      {/* Preview Posts */}
      {mediaPosts.length > 0 && (
        <div className="grid grid-cols-3 gap-2 w-full max-w-sm">
          {mediaPosts.map((post, i) => {
            const isVideo = !!post.video_url;
            const mediaUrl = isVideo ? post.video_url : post.media_urls?.[0];
            const viewCount = post.view_count || Math.floor(Math.random() * 600 + 100);

            return (
              <div key={post.id} className="aspect-[3/4] rounded-xl overflow-hidden relative" style={{ backgroundColor: "var(--bg-subtle)" }}>
                {isVideo ? (
                  <>
                    <video
                      ref={el => videoRefs.current[i] = el}
                      src={mediaUrl}
                      className="w-full h-full object-cover"
                      loop
                      playsInline
                      muted
                      autoPlay
                      preload="auto"
                      onLoadedData={(e) => {
                        e.currentTarget.muted = true;
                        e.currentTarget.play().catch(() => {});
                      }}
                    />
                    <div className="absolute top-2 left-2">
                      <Play className="w-4 h-4 text-white drop-shadow-lg" fill="white" />
                    </div>
                    <div className="absolute bottom-2 left-2 flex items-center gap-1">
                      <Play className="w-3 h-3 text-white drop-shadow-lg" fill="white" />
                      <span className="text-xs font-bold text-white drop-shadow-lg">{viewCount}</span>
                    </div>
                  </>
                ) : (
                  <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function TrendingGroupsSwiper({ groups, onDismiss, onJoin, onClose, membershipMap }) {
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const currentGroup = groups[currentGroupIndex];
  const isMember = membershipMap?.[currentGroup?.id];

  const handleDragEnd = (e, info) => {
    const threshold = 100;
    if (info.offset.x > threshold && currentGroupIndex > 0) {
      setDirection(-1);
      setCurrentGroupIndex(currentGroupIndex - 1);
    } else if (info.offset.x < -threshold && currentGroupIndex < groups.length - 1) {
      setDirection(1);
      setCurrentGroupIndex(currentGroupIndex + 1);
    }
  };

  const handleDismiss = () => {
    onDismiss(currentGroup);
    if (currentGroupIndex < groups.length - 1) {
      setDirection(1);
      setCurrentGroupIndex(currentGroupIndex + 1);
    } else if (currentGroupIndex > 0) {
      setDirection(-1);
      setCurrentGroupIndex(currentGroupIndex - 1);
    } else {
      onClose();
    }
  };

  const handleAction = () => {
    if (isMember) {
      // Leave group logic would go here
      onDismiss(currentGroup);
    } else {
      onJoin(currentGroup);
    }
  };

  if (!currentGroup) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "var(--bg-app)" }}>
        <div className="text-center px-6">
          <p className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
            That's all for now!
          </p>
          <p className="text-sm mb-6" style={{ color: "var(--text-hint)" }}>
            Check back later for more trending groups
          </p>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-2xl text-sm font-bold text-white"
            style={{ backgroundColor: "var(--accent-primary)" }}>
            Done
          </button>
        </div>
      </div>
    );
  }

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? 400 : -400, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -400 : 400, opacity: 0 }),
  };

  return (
    <div className="fixed inset-0 z-50" style={{ backgroundColor: "rgba(0,0,0,0.95)" }}>
      <button
        onClick={onClose}
        className="absolute top-4 left-4 w-10 h-10 rounded-full flex items-center justify-center z-50"
        style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
        <X className="w-5 h-5 text-white" />
      </button>

      <AnimatePresence custom={direction} mode="wait">
        <motion.div
          key={currentGroup.id}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.7}
          onDragEnd={handleDragEnd}
          className="h-full">
          <GroupPreviewCard
            group={currentGroup}
            onDismiss={handleDismiss}
            onJoin={handleAction}
            isMember={isMember}
            mutualFriends={[]}
          />
        </motion.div>
      </AnimatePresence>

      {/* Action Buttons - Fixed at bottom */}
      <div className="fixed bottom-8 left-0 right-0 px-6 flex gap-3 z-50">
        <button
          onClick={handleDismiss}
          className="flex-1 py-4 rounded-full text-base font-bold"
          style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white" }}>
          Not interested
        </button>
        <button
          onClick={handleAction}
          className="flex-1 py-4 rounded-full text-base font-bold text-white"
          style={{ backgroundColor: "#FF3B5C" }}>
          {isMember ? "Leave" : "Follow"}
        </button>
      </div>

      {/* Group counter */}
      <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-bold z-50"
        style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white" }}>
        {currentGroupIndex + 1} / {groups.length}
      </div>
    </div>
  );
}