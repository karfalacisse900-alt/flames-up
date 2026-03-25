import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Bookmark, MessageSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import moment from "moment";

const GRADIENTS = {
  sports: "linear-gradient(135deg,#ea580c,#dc2626)",
  fitness: "linear-gradient(135deg,#0d9488,#16a34a)",
  food: "linear-gradient(135deg,#ea580c,#d97706)",
  music: "linear-gradient(135deg,#db2777,#be185d)",
  tech: "linear-gradient(135deg,#0284c7,#0369a1)",
  art: "linear-gradient(135deg,#7c3aed,#a21caf)",
  travel: "linear-gradient(135deg,#0284c7,#6d28d9)",
  gaming: "linear-gradient(135deg,#16a34a,#15803d)",
  movies: "linear-gradient(135deg,#7c3aed,#4338ca)",
  general: "linear-gradient(135deg,#64748b,#475569)",
};

function Avatar({ name, size = 38 }) {
  const colors = ["#4F46E5","#7C3AED","#DB2777","#EA580C","#16A34A","#0284C7"];
  const idx = name ? name.charCodeAt(0) % colors.length : 0;
  const letter = (name?.[0] || "U").toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", backgroundColor: colors[idx], flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
      fontWeight: 700, fontSize: size * 0.38 }}>
      {letter}
    </div>
  );
}

function getTags(group) {
  const tags = [];
  if (group.category) tags.push(group.category);
  const words = (group.name || "").toLowerCase().split(/\s+/).filter(w => w.length > 3);
  words.slice(0, 4).forEach(w => { if (!tags.includes(w)) tags.push(w); });
  return tags.slice(0, 6);
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

  const authorHandle = (group.creator_name || group.creator_email || "admin")
    .toLowerCase().replace(/\s+/g, "_").replace(/@.*/, "");

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150]" onClick={onClose}
        style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute bottom-0 left-0 right-0"
          style={{ backgroundColor: "#ffffff", borderRadius: "28px 28px 0 0",
            maxHeight: "92dvh", overflowY: "auto" }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header bar */}
          <div style={{ display: "flex", alignItems: "center", padding: "16px 16px 8px" }}>
            <button onClick={onClose}
              style={{ width: 36, height: 36, borderRadius: "50%", border: "none",
                backgroundColor: "#F1F5F9", display: "flex", alignItems: "center",
                justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
              <ChevronLeft style={{ width: 18, height: 18, color: "#0F172A" }} />
            </button>
            <p style={{ flex: 1, textAlign: "center", fontSize: 17, fontWeight: 700,
              color: "#0F172A", fontFamily: "var(--font-serif)" }}>
              {group.name}
            </p>
            <div style={{ width: 36 }} />
          </div>

          {/* Cover image */}
          <div style={{ margin: "0 16px", borderRadius: 20, overflow: "hidden", position: "relative", aspectRatio: "16/10" }}>
            {group.cover_url || group.logo_url ? (
              <img src={group.cover_url || group.logo_url} alt={group.name}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", background: GRADIENTS[group.category] || GRADIENTS.general,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 60 }}>
                {group.emoji || "💬"}
              </div>
            )}
            {/* Bookmark */}
            <button style={{ position: "absolute", top: 12, right: 12, width: 34, height: 34,
              borderRadius: 10, backgroundColor: "rgba(255,255,255,0.88)", backdropFilter: "blur(8px)",
              border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bookmark style={{ width: 16, height: 16, color: "#0F172A" }} />
            </button>
            {/* Dot indicators */}
            <div style={{ position: "absolute", bottom: 10, left: 0, right: 0,
              display: "flex", justifyContent: "center", gap: 4 }}>
              <div style={{ width: 20, height: 4, borderRadius: 99, backgroundColor: "rgba(255,255,255,0.95)" }} />
              <div style={{ width: 4, height: 4, borderRadius: 99, backgroundColor: "rgba(255,255,255,0.5)" }} />
              <div style={{ width: 4, height: 4, borderRadius: 99, backgroundColor: "rgba(255,255,255,0.5)" }} />
            </div>
          </div>

          {/* Description */}
          <div style={{ padding: "16px 20px 8px" }}>
            <p style={{ fontSize: 15, color: "#0F172A", lineHeight: 1.6, marginBottom: 6 }}>
              <span style={{ fontWeight: 700 }}>{authorHandle} </span>
              {group.description || `Join ${group.name} and connect with others!`}
            </p>
            {tags.length > 0 && (
              <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.7 }}>
                {tags.map(t => `#${t}`).join(" ")}
              </p>
            )}
          </div>

          {/* Comments / recent posts */}
          <div style={{ padding: "8px 20px 16px" }}>
            {previewPosts.map(post => {
              const handle = (post.author_name || post.author_email || "user")
                .toLowerCase().replace(/\s+/g, "_").replace(/@.*/, "");
              return (
                <div key={post.id} style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "flex-start" }}>
                  <Avatar name={post.author_name || post.author_email} size={38} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{handle}</span>
                      <span style={{ fontSize: 12, color: "#94A3B8" }}>
                        {moment(post.created_date).fromNow(true)}
                      </span>
                    </div>
                    <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.5,
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {post.text || post.content || "Shared a post in this group."}
                    </p>
                    <button style={{ fontSize: 13, color: "#94A3B8", fontWeight: 600, background: "none",
                      border: "none", padding: 0, marginTop: 4, cursor: "pointer" }}>
                      Reply
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom action bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px 28px",
            borderTop: "1px solid #F1F5F9", backgroundColor: "#fff" }}>
            <button onClick={() => { onClose(); onOpen(group); }}
              style={{ width: 50, height: 50, borderRadius: 16, border: "1.5px solid #E2E8F0",
                backgroundColor: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, cursor: "pointer" }}>
              <MessageSquare style={{ width: 20, height: 20, color: "#0F172A" }} />
            </button>
            {isMember ? (
              <button onClick={() => { onClose(); onOpen(group); }}
                style={{ flex: 1, padding: "15px 0", borderRadius: 999, border: "none",
                  backgroundColor: "#0F172A", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
                Open chat
              </button>
            ) : (
              <button onClick={() => { onJoin(group); onClose(); }}
                style={{ flex: 1, padding: "15px 0", borderRadius: 999, border: "none",
                  backgroundColor: "#0F172A", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
                Join now
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}