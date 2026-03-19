import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import SmartText from "./SmartText";

import { MessageCircle, Share2, Bookmark, Plus, Trash2, MoreHorizontal, Flag, Link as LinkIcon, EyeOff, MapPin, Heart, ExternalLink } from "lucide-react";
import AutoplayVideo from "./AutoplayVideo";
import WantToGoButton from "./WantToGoButton";
import PhotoCarousel from "./PhotoCarousel";
import SavePostModal from "./SavePostModal";
import TipButton from "./TipButton";
import PollComponent from "./PollComponent";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
const REACTIONS = ["❤️", "🔥", "😂", "😮", "👏", "💯"];

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

const avatarColors = ["#7C69C4", "#D98B62", "#3C6E5A", "#E05C7A", "#4A7FC1", "#B07843"];
const getAvatarColor = (name) => avatarColors[(name || "U").charCodeAt(0) % avatarColors.length];

function PollDisplay({ postId, pollId, user }) {
  const { data: poll, isLoading } = useQuery({
    queryKey: ["poll", pollId],
    queryFn: () => base44.entities.Poll.filter({ id: pollId }),
    select: (data) => data[0] || null,
  });

  if (isLoading || !poll) return null;
  return <PollComponent poll={poll} currentUserEmail={user?.email || ""} isReadOnly={!user} />;
}

// Detect if body is rich text (HTML/markdown)
function isRichText(text) {
  return text && (/<[a-z][\s\S]*>/i.test(text) || /^#{1,6}\s|^\*\*|^\*[^*]|^- |^\d+\. /m.test(text));
}

// Strip HTML tags and return clean plain text
function stripHtml(html) {
  if (!html) return "";
  // First unescape any HTML entities that might be double-encoded
  const unescaped = html
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  const div = document.createElement("div");
  div.innerHTML = unescaped;
  const text = (div.textContent || div.innerText || "").trim();
  // Replace multiple blank lines with a single one
  return text.replace(/\n{3,}/g, "\n\n");
}

export default function CommunityPostCard({ post, user, onUpvote, onLocationClick, onTap }) {
  const hasLiked = user?.email && post.upvoted_by?.includes(user.email);
  const [showReactions, setShowReactions] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reported, setReported] = useState(false);
  const [likeBounce, setLikeBounce] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const longPressTimer = useRef(null);
  const qc = useQueryClient();

  const avatarColor = getAvatarColor(post.author_name);
  const initials = (post.author_name?.[0] || "U").toUpperCase();
  const showAuthor = !post.is_anonymous && !!post.author_email;
  const isOwnPost = user?.email && post.author_email === user.email;

  const handleDelete = async () => {
    if (!window.confirm("Delete this post?")) return;
    await base44.entities.CommunityPost.delete(post.id);
    qc.invalidateQueries({ queryKey: ["communityPosts"] });
  };

  const { data: followRecord } = useQuery({
    queryKey: ["followStatus", user?.email, post.author_email],
    queryFn: () => base44.entities.Follow.filter({ follower_email: user.email, following_email: post.author_email }),
    enabled: !!user?.email && !isOwnPost && !post.is_anonymous,
    select: (data) => data[0] || null,
  });

  const isFollowing = !!followRecord;

  const handleFollow = async () => {
    if (!user || isOwnPost) return;
    // Optimistic update — don't invalidate broad queries to prevent post list jumping
    if (isFollowing && followRecord) {
      await base44.entities.Follow.delete(followRecord.id);
    } else {
      await base44.entities.Follow.create({
        follower_email: user.email,
        follower_name: user.full_name || user.email,
        following_email: post.author_email,
        following_name: post.author_name,
      });
    }
    qc.invalidateQueries({ queryKey: ["followStatus", user?.email, post.author_email] });
  };

  const handleReport = async () => {
    if (!user || reported) return;
    await base44.entities.Report.create({ content_type: "post", content_id: post.id, reason: "Community report", reporter_email: user.email, status: "pending" });
    await base44.entities.CommunityPost.update(post.id, { is_reported: true });
    setReported(true);
    setShowMenu(false);
  };

  const handleShare = () => {
    const url = `${window.location.origin}?post=${post.id}`;
    if (navigator.share) navigator.share({ title: "Post", url });
    else { navigator.clipboard.writeText(url); }
    setShowMenu(false);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}?post=${post.id}`;
    navigator.clipboard.writeText(url);
    setShowMenu(false);
  };

  const [notInterested, setNotInterested] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  if (notInterested) return null;

  const handleLike = () => {
    setLikeBounce(true);
    setTimeout(() => setLikeBounce(false), 500);
    // Fire like notification (only when liking, not unliking, and not own post)
    if (!hasLiked && user?.email && post.author_email && post.author_email !== user.email) {
      base44.entities.Notification.create({
        recipient_email: post.author_email,
        actor_name: user.full_name || user.email,
        actor_email: user.email,
        type: "post_liked",
        post_text: (post.title || post.body || "").slice(0, 100),
        ref_id: post.id,
        is_read: false,
      }).catch(() => {});
    }
    onUpvote();
  };

  const handlePressStart = () => { longPressTimer.current = setTimeout(() => setShowReactions(true), 400); };
  const handlePressEnd = () => { clearTimeout(longPressTimer.current); };

  const bodyIsRich = isRichText(post.body);
  const isTextOnly = post.type === "text_only";

  // ── Text-Only card layout ──────────────────────────────────────────────────
  if (isTextOnly) {
    return (
      <div className="relative mx-3 my-2">
        <div className="rounded-3xl overflow-hidden"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>

          {/* Author header */}
          <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
            <div className="shrink-0">
              {showAuthor ? (
                <Link to={`/user/${encodeURIComponent(post.author_email)}`}>
                  {post.author_avatar_url ? (
                    <img src={post.author_avatar_url} alt={post.author_name}
                      loading="lazy" decoding="async"
                      className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: `linear-gradient(135deg, ${avatarColor}33, ${avatarColor}66)`, color: avatarColor }}>
                      {initials}
                    </div>
                  )}
                </Link>
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: "linear-gradient(135deg, #ccc3, #ccc5)", color: "#999" }}>?</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              {showAuthor ? (
                <Link to={`/user/${encodeURIComponent(post.author_email)}`}
                  className="text-xs font-bold block truncate" style={{ color: "var(--text-primary)" }}>
                  {post.author_name || "User"}
                </Link>
              ) : (
                <span className="text-xs font-bold block" style={{ color: "var(--text-secondary)" }}>Anonymous</span>
              )}
              <span className="text-[10px]" style={{ color: "var(--text-hint)" }}>{timeAgo(post.created_date)}</span>
            </div>
            {/* Three-dot menu */}
            <div className="relative">
              <button onClick={() => setShowMenu(v => !v)} className="p-1.5 rounded-full" style={{ color: "var(--text-hint)" }}>
                <MoreHorizontal className="w-4 h-4" />
              </button>
              <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.88, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.88, y: -8 }}
                  transition={{ duration: 0.16, ease: [0.34, 1.56, 0.64, 1] }}
                  className="absolute right-0 top-full mt-1 rounded-2xl overflow-hidden z-40 min-w-[140px]"
                  style={{ backgroundColor: "#FFFFFF", boxShadow: "0 8px 32px rgba(0,0,0,0.18)", border: "1px solid #E2E8F0", transformOrigin: "top right" }}>
                  {post.link && (
                    <button onClick={() => { window.open(post.link, "_blank"); setShowMenu(false); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left font-semibold" style={{ color: "var(--accent-primary)" }}>
                      <ExternalLink className="w-3.5 h-3.5" /> Open link
                    </button>
                  )}
                  <button onClick={handleCopyLink} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left" style={{ color: "var(--text-primary)" }}>
                    <LinkIcon className="w-3.5 h-3.5" /> Copy link
                  </button>
                  <button onClick={() => { setNotInterested(true); setShowMenu(false); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left" style={{ color: "var(--text-primary)" }}>
                    <EyeOff className="w-3.5 h-3.5" /> Not interested
                  </button>
                  {!isOwnPost && user && (
                    <div className="relative">
                      <TipButton postAuthorEmail={post.author_email} postId={post.id} isMenu={true} />
                    </div>
                  )}
                  {isOwnPost && (
                    <button onClick={handleDelete} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left" style={{ color: "#E05C7A" }}>
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  )}
                  {!isOwnPost && (
                   <button onClick={handleReport} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left" style={{ color: "#E05C7A" }}>
                     <Flag className="w-3.5 h-3.5" /> Report post
                   </button>
                  )}
                  </motion.div>
                  )}
                  </AnimatePresence>
                  </div>
                  </div>

          {/* Big centered text */}
          <div className="px-5 pb-5 text-center">
            {(() => {
              const cleanText = stripHtml(post.body);
              const fontSize = cleanText.length > 120 ? 16 : cleanText.length > 60 ? 19 : 22;
              return (
                <p className="leading-relaxed whitespace-pre-line"
                  style={{
                    color: "var(--text-primary)",
                    fontSize,
                    fontWeight: 600,
                    fontFamily: "var(--font-serif)",
                    lineHeight: 1.45,
                  }}>
                  <SmartText text={cleanText} />
                </p>
              );
            })()}
          </div>

          {/* Actions */}
          <div className="flex items-center px-2 pb-2 border-t" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="relative">
              <button
                onTouchStart={handlePressStart} onTouchEnd={handlePressEnd}
                onMouseDown={handlePressStart} onMouseUp={handlePressEnd}
                onClick={handleLike}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-full text-xs font-medium transition-all ${likeBounce ? "heart-bounce" : ""}`}
                style={{ color: hasLiked ? "#E05C7A" : "var(--text-hint)", minWidth: 44, minHeight: 44, justifyContent: "center" }}>
                <span className="text-[16px] leading-none">{hasLiked ? "❤️" : "🤍"}</span>
                {(post.upvotes || 0) > 0 && <span>{post.upvotes}</span>}
              </button>
              {showReactions && (
                <div
                  className="absolute bottom-full left-0 mb-2 flex gap-1 p-2 rounded-2xl z-30"
                  style={{ backgroundColor: "var(--bg-card)", boxShadow: "0 8px 32px rgba(0,0,0,0.18)", border: "1px solid var(--border-light)", animation: "fadeIn 0.12s ease" }}
                  onMouseLeave={() => setShowReactions(false)}>
                  {REACTIONS.map(r => (
                    <button key={r}
                      onClick={() => { handleLike(); setShowReactions(false); }}
                      className="text-xl w-10 h-10 flex items-center justify-center rounded-full chip"
                      style={{ backgroundColor: "var(--bg-subtle)" }}>{r}</button>
                  ))}
                </div>
              )}
            </div>
            <Link to={createPageUrl(`PostComments?postId=${post.id}`)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-full text-xs font-semibold chip"
              style={{ color: "var(--text-hint)", minWidth: 44, minHeight: 44, justifyContent: "center" }}>
              <MessageCircle className="w-[18px] h-[18px]" />
              {(post.comment_count || 0) > 0 && <span>{post.comment_count}</span>}
            </Link>
            <button onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-full text-xs font-semibold chip"
              style={{ color: "var(--text-hint)", minWidth: 44, minHeight: 44, justifyContent: "center" }}>
              <Share2 className="w-[18px] h-[18px]" />
            </button>
            <button onClick={() => user ? setShowSaveModal(true) : null}
              className="ml-auto flex items-center justify-center rounded-full transition-all chip"
              style={{ color: saved ? "var(--accent-primary)" : "var(--text-hint)", minWidth: 44, minHeight: 44 }}>
              <Bookmark className="w-[18px] h-[18px]" style={{ fill: saved ? "var(--accent-primary)" : "none" }} />
            </button>
          </div>
        </div>

        {showMenu && <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />}
        {showSaveModal && <SavePostModal post={post} user={user} onClose={() => { setShowSaveModal(false); setSaved(true); }} />}
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Modern card container */}
      <div className="w-full overflow-hidden" 
        style={{ 
          backgroundColor: "var(--bg-card)",
          borderTop: "1px solid var(--border-subtle)",
          borderBottom: "1px solid var(--border-subtle)",
        }}>
        {/* ── HEADER SECTION ── */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 flex-1 min-w-0 overflow-hidden">
            {/* Profile Picture */}
            <div className="shrink-0 flex-shrink-0">
              {showAuthor ? (
                <Link to={`/user/${encodeURIComponent(post.author_email)}`}>
                  {post.author_avatar_url ? (
                    <img src={post.author_avatar_url} alt={post.author_name}
                      loading="lazy" decoding="async"
                      className="w-11 h-11 rounded-full object-cover"
                      style={{ border: "2px solid var(--border-light)" }} />
                  ) : (
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ background: `linear-gradient(135deg, ${avatarColor}55, ${avatarColor}88)`, color: avatarColor, border: "2px solid var(--border-light)" }}>
                      {initials}
                    </div>
                  )}
                </Link>
              ) : (
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: "linear-gradient(135deg, #ddd, #bbb)", color: "#888", border: "2px solid var(--border-light)" }}>
                  ?
                </div>
              )}
            </div>

            {/* Username + Meta Info */}
            <div className="flex-1 min-w-0 overflow-hidden">
              {showAuthor ? (
                <Link to={`/user/${encodeURIComponent(post.author_email)}`}
                  className="text-sm font-bold block truncate leading-tight whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: "var(--text-primary)" }}>
                  {post.author_name || "User"}
                </Link>
              ) : (
                <span className="text-sm font-bold block leading-tight" style={{ color: "var(--text-secondary)" }}>Anonymous</span>
              )}
              <div className="flex items-center gap-1.5 mt-0.5 overflow-hidden">
                <span className="text-xs font-medium shrink-0" style={{ color: "var(--text-hint)" }}>{timeAgo(post.created_date)}</span>
                {(post.location_name || post.location_city) && (
                  <>
                    <span className="shrink-0" style={{ color: "var(--text-hint)" }}>•</span>
                    <button
                      onClick={() => {
                        const query = post.location_lat && post.location_lng
                          ? `${post.location_lat},${post.location_lng}`
                          : encodeURIComponent([post.location_name, post.location_city, post.location_region, post.location_country].filter(Boolean).join(", "));
                        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
                      }}
                      className="flex items-center gap-0.5 text-xs font-semibold truncate overflow-hidden"
                      style={{ color: "var(--accent-primary)" }}>
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{post.location_name || [post.location_city, post.location_region].filter(Boolean).join(", ")}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {!isOwnPost && showAuthor && !!user && (
              <button onClick={handleFollow}
                className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                style={{
                  backgroundColor: isFollowing ? "var(--accent-primary-light)" : "var(--bg-card)",
                  color: isFollowing ? "var(--accent-primary)" : "#111",
                  border: `1.5px solid ${isFollowing ? "var(--accent-primary)" : "var(--border-medium)"}`,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
                }}>
                {isFollowing ? "Following" : "Follow"}
              </button>
            )}
            {/* Three-dot menu */}
            <div className="relative">
              <button onClick={() => setShowMenu(v => !v)} className="p-2 rounded-full hover:bg-[var(--bg-subtle)] transition-colors" style={{ color: "var(--text-hint)" }}>
                <MoreHorizontal className="w-5 h-5" />
              </button>
              <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.88, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.88, y: -8 }}
                  transition={{ duration: 0.16, ease: [0.34, 1.56, 0.64, 1] }}
                  className="absolute right-0 top-full mt-2 rounded-2xl overflow-hidden z-40 min-w-[160px]"
                  style={{ backgroundColor: "#FFFFFF", boxShadow: "0 12px 40px rgba(0,0,0,0.2)", border: "1px solid #E2E8F0", transformOrigin: "top right" }}>
                  {post.link && (
                    <button onClick={() => { window.open(post.link, "_blank"); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left font-semibold hover:bg-[var(--bg-subtle)] transition-colors" style={{ color: "var(--accent-primary)" }}>
                      <ExternalLink className="w-4 h-4" /> Open link
                    </button>
                  )}
                  <button onClick={handleCopyLink} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-[var(--bg-subtle)] transition-colors" style={{ color: "var(--text-primary)" }}>
                    <LinkIcon className="w-4 h-4" /> Copy link
                  </button>
                  <button onClick={() => { setNotInterested(true); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-[var(--bg-subtle)] transition-colors" style={{ color: "var(--text-primary)" }}>
                    <EyeOff className="w-4 h-4" /> Not interested
                  </button>
                  {!isOwnPost && user && (
                    <div className="w-full">
                      <TipButton postAuthorEmail={post.author_email} postId={post.id} isMenu={true} />
                    </div>
                  )}
                  {isOwnPost && (
                    <button onClick={handleDelete} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-[var(--bg-subtle)] transition-colors" style={{ color: "#E05C7A" }}>
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  )}
                  {!isOwnPost && (
                    <button onClick={handleReport} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-[var(--bg-subtle)] transition-colors" style={{ color: "#E05C7A" }}>
                      <Flag className="w-4 h-4" /> Report post
                    </button>
                  )}
                </motion.div>
              )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── CAPTION (ABOVE MEDIA) ── */}
        {(post.title || post.body) && (
          <div className="px-4 pb-3">
            {post.title && (
              <h3 className="font-bold text-base mb-1.5 leading-snug break-words" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                {post.title}
              </h3>
            )}
            {post.body && (() => {
              const cleanText = bodyIsRich ? stripHtml(post.body) : (post.type === "quote_of_day" ? `"${post.body}"` : post.body);
              const isLong = cleanText.length > 200;
              const displayText = !captionExpanded && isLong ? cleanText.slice(0, 200) : cleanText;
              
              return (
                <div className="text-[15px] leading-relaxed break-words"
                  style={{
                    color: "var(--text-secondary)",
                    fontFamily: post.type === "quote_of_day" ? "var(--font-serif)" : "var(--font-sans)",
                    fontStyle: post.type === "quote_of_day" ? "italic" : "normal",
                    wordWrap: "break-word",
                    overflowWrap: "break-word",
                  }}>
                  {bodyIsRich && captionExpanded ? (
                    <div className="rich-body" dangerouslySetInnerHTML={{ __html: post.body }} />
                  ) : (
                    <p className="whitespace-pre-line break-words">
                      <SmartText text={displayText} />
                      {!captionExpanded && isLong && "..."}
                    </p>
                  )}
                  {isLong && (
                    <button 
                      onClick={() => setCaptionExpanded(v => !v)}
                      className="text-sm font-semibold mt-1 block"
                      style={{ color: "var(--accent-primary)" }}>
                      {captionExpanded ? "See less" : "See more"}
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* ── MEDIA SECTION ── */}
        {(() => {
        const imgs = post.image_urls?.length > 0 ? post.image_urls : post.image_url ? [post.image_url] : [];
        if (imgs.length === 0 && !post.video_url) return null;
        return (
          <div className="w-full relative mb-3">
            {imgs.length > 0 && (
              <div className="w-full">
                <PhotoCarousel images={imgs} tags={post.media_tags} aspectRatio="4/5" />
              </div>
            )}
            {post.video_url && post.video_url.trim() && (
              <div className="w-full">
                <AutoplayVideo
                  src={post.video_url}
                  postId={post.id}
                  onDoubleTap={() => handleLike()}
                />
              </div>
            )}
          </div>
        );
        })()}

        {/* ── Poll ── */}
        {post.poll_id && (
          <div className="px-4 mb-3">
            <PollDisplay postId={post.id} pollId={post.poll_id} user={user} />
          </div>
        )}

        {/* ── Place tags ── */}
        {post.place_tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 mb-3">
            {post.place_tags.map(tag => (
              <span key={tag} className="text-xs px-3 py-1.5 rounded-full font-semibold"
                style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
                {tag === "food" ? "🍔" : tag === "events" ? "🎉" : tag === "park" ? "🌳" : tag === "coffee" ? "☕" : tag === "hidden_spot" ? "🔍" : tag === "free_activities" ? "🆓" : tag === "study_spot" ? "📚" : tag === "travel" ? "✈️" : "📍"} {tag.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        )}

        {/* ── ENGAGEMENT ACTIONS ── */}
        <div className="flex items-center justify-start flex-wrap px-3 py-2 gap-1">
          {/* Like */}
          <div className="relative">
            <button
              onTouchStart={handlePressStart} onTouchEnd={handlePressEnd}
              onMouseDown={handlePressStart} onMouseUp={handlePressEnd}
              onClick={handleLike}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-full transition-all ${likeBounce ? "heart-bounce" : ""}`}
              style={{ color: hasLiked ? "#E05C7A" : "var(--text-secondary)", minHeight: "44px" }}>
              <Heart className="w-5 h-5" style={{ fill: hasLiked ? "#E05C7A" : "none", strokeWidth: hasLiked ? 0 : 2 }} />
              <span className="text-sm font-semibold">Like</span>
              {(post.upvotes || 0) > 0 && <span className="text-sm font-semibold">{post.upvotes}</span>}
            </button>
            {showReactions && (
              <div
                className="absolute bottom-full left-0 mb-2 flex gap-1.5 p-2.5 rounded-2xl z-30"
                style={{ backgroundColor: "var(--bg-card)", boxShadow: "0 12px 40px rgba(0,0,0,0.2)", border: "1px solid var(--border-light)" }}
                onMouseLeave={() => setShowReactions(false)}>
                {REACTIONS.map(r => (
                  <button key={r}
                    onClick={() => { handleLike(); setShowReactions(false); }}
                    className="text-2xl w-11 h-11 flex items-center justify-center rounded-full transition-transform hover:scale-110"
                    style={{ backgroundColor: "var(--bg-subtle)" }}>
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Comment */}
          <Link to={createPageUrl(`PostComments?postId=${post.id}`)}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-full transition-colors hover:bg-[var(--bg-subtle)]"
            style={{ color: "var(--text-secondary)", minHeight: "44px" }}>
            <MessageCircle className="w-5 h-5" strokeWidth={2} />
            <span className="text-sm font-semibold">Comment</span>
            {(post.comment_count || 0) > 0 && <span className="text-sm font-semibold">{post.comment_count}</span>}
          </Link>

          {/* Share */}
          <button onClick={handleShare}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-full transition-colors hover:bg-[var(--bg-subtle)]"
            style={{ color: "var(--text-secondary)", minHeight: "44px" }}>
            <Share2 className="w-5 h-5" strokeWidth={2} />
            <span className="text-sm font-semibold">Share</span>
          </button>

          {/* Save — pushed right */}
          <button onClick={() => user ? setShowSaveModal(true) : null}
            className="ml-auto flex items-center justify-center p-2 rounded-full transition-colors hover:bg-[var(--bg-subtle)]"
            style={{ color: saved ? "var(--accent-primary)" : "var(--text-secondary)", minHeight: "44px", minWidth: "44px" }}>
            <Bookmark className="w-5 h-5" strokeWidth={2} style={{ fill: saved ? "var(--accent-primary)" : "none" }} />
          </button>
        </div>


        {post.tags?.includes("daily_challenge") && (
          <div className="px-4 pb-3">
            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-bold" style={{ backgroundColor: "#1A423122", color: "#2E6B4F" }}>
              ⚡ Daily Challenge Entry
            </span>
          </div>
        )}
      </div>

      {/* Backdrop to close menu */}
      {showMenu && <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />}

      {showSaveModal && (
        <SavePostModal post={post} user={user} onClose={() => { setShowSaveModal(false); setSaved(true); }} />
      )}
    </div>
  );
}