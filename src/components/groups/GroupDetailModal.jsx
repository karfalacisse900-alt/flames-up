import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, ChevronLeft, MessageSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import moment from "moment";

const CATEGORY_GRADIENTS = {
  fitness:  ["#0d9488","#16a34a"], food: ["#ea580c","#d97706"],
  travel:   ["#0284c7","#6d28d9"], tech: ["#0284c7","#0369a1"],
  art:      ["#7c3aed","#a21caf"], music: ["#db2777","#be185d"],
  gaming:   ["#16a34a","#15803d"], movies: ["#7c3aed","#4338ca"],
  sports:   ["#ea580c","#dc2626"], general: ["#64748b","#475569"],
};

function getGrad(cat) {
  const [a, b] = CATEGORY_GRADIENTS[cat] || CATEGORY_GRADIENTS.general;
  return `linear-gradient(135deg, ${a}, ${b})`;
}

function getTags(group) {
  const tags = [];
  if (group.category) tags.push(group.category);
  const words = (group.name || "").toLowerCase().split(/\s+/).filter(w => w.length > 3);
  words.slice(0, 3).forEach(w => { if (!tags.includes(w)) tags.push(w); });
  return tags.slice(0, 5);
}

function Avatar({ name, imageUrl, size = 36 }) {
  const letter = (name?.[0] || "U").toUpperCase();
  const colors = ["#4F46E5","#7C3AED","#DB2777","#EA580C","#16A34A","#0284C7"];
  const idx = name ? name.charCodeAt(0) % colors.length : 0;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
      backgroundColor: colors[idx], display: "flex", alignItems: "center", justifyContent: "center",
      color: "white", fontWeight: 700, fontSize: size * 0.4 }}>
      {imageUrl ? <img src={imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : letter}
    </div>
  );
}

export default function GroupDetailModal({ group, isMember, onClose, onJoin, onOpen }) {
  if (!group) return null;

  const { data: posts = [] } = useQuery({
    queryKey: ["groupPostsPreview", group.id],
    queryFn: () => base44.entities.CommunityPost.filter({ group_id: group.id }, "-created_date", 5),
    staleTime: 60000,
  });

  const previewPosts = posts.slice(0, 3);
  const tags = getTags(group);

  // Derive a "creator" display post — the description as if authored by admin
  const authorHandle = group.creator_name
    ? group.creator_name.toLowerCase().replace(/\s+/g, "_")
    : group.creator_email?.split("@")[0] || "admin";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150]" onClick={onClose}
        style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}>
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute bottom-0 left-0 right-0 rounded-t-[28px] overflow-hidden"
          style={{ backgroundColor: "#ffffff", maxHeight: "92dvh", overflowY: "auto" }}
          onClick={e => e.stopPropagation()}
        >
          {/* Top bar */}
          <div className="flex items-center px-4 pt-4 pb-2">
            <button onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--bg-subtle)" }}>
              <ChevronLeft className="w-4 h-4" style={{ color: "var(--text-primary)" }} />
            </button>
            <p className="flex-1 text-center text-base font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              {group.name}
            </p>
            <div className="w-9 h-9" />
          </div>

          {/* Cover image / gradient */}
          <div className="relative mx-4 rounded-2xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
            {group.cover_url ? (
              <img src={group.cover_url} alt={group.name} className="w-full h-full object-cover" />
            ) : group.logo_url ? (
              <img src={group.logo_url} alt={group.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl"
                style={{ background: getGrad(group.category) }}>
                {group.emoji || "💬"}
              </div>
            )}
            {/* Slide dots indicator */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
              <div className="w-4 h-1 rounded-full bg-white opacity-90" />
              <div className="w-1 h-1 rounded-full bg-white opacity-50" />
              <div className="w-1 h-1 rounded-full bg-white opacity-50" />
            </div>
            {/* Member count badge */}
            {group.member_count > 0 && (
              <div className="absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1 rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)" }}>
                <Users className="w-3 h-3" style={{ color: "#0F172A" }} />
                <span className="text-xs font-bold" style={{ color: "#0F172A" }}>{group.member_count}</span>
              </div>
            )}
          </div>

          {/* Description + tags */}
          <div className="px-5 pt-4 pb-3">
            <p className="text-sm leading-relaxed mb-2" style={{ color: "var(--text-primary)" }}>
              <span className="font-bold">{authorHandle} </span>
              {group.description || `Join ${group.name} and connect with others!`}
            </p>
            {tags.length > 0 && (
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {tags.map(t => `#${t}`).join(" ")}
              </p>
            )}
          </div>

          {/* Comment-style recent posts */}
          {previewPosts.length > 0 && (
            <div className="px-5 pb-2">
              {previewPosts.map(post => {
                const handle = (post.author_name || post.author_email || "user")
                  .toLowerCase().replace(/\s+/g, "_").replace(/@.*/, "");
                return (
                  <div key={post.id} className="flex gap-3 mb-4">
                    <Avatar name={post.author_name || post.author_email} size={36} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{handle}</span>
                        <span className="text-xs" style={{ color: "var(--text-hint)" }}>
                          {moment(post.created_date).fromNow(true)}
                        </span>
                      </div>
                      <p className="text-sm leading-snug line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                        {post.text || post.content || "Shared a post"}
                      </p>
                      <button className="text-xs font-semibold mt-1" style={{ color: "var(--text-hint)" }}>Reply</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom action bar */}
          <div className="sticky bottom-0 bg-white px-4 pb-6 pt-3 flex items-center gap-3"
            style={{ borderTop: "1px solid var(--border-light)" }}>
            <button onClick={() => { onClose(); onOpen(group); }}
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: "var(--bg-subtle)" }}>
              <MessageSquare className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
            </button>
            {isMember ? (
              <button onClick={() => { onClose(); onOpen(group); }}
                className="flex-1 py-3.5 rounded-2xl text-base font-bold text-white"
                style={{ backgroundColor: "#0F172A" }}>
                Open chat
              </button>
            ) : (
              <button onClick={() => { onJoin(group); onClose(); }}
                className="flex-1 py-3.5 rounded-2xl text-base font-bold text-white"
                style={{ backgroundColor: "#0F172A" }}>
                Join now
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}