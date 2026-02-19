import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Heart, Send, EyeOff, Reply, ChevronDown, ChevronUp, Flag } from "lucide-react";
import ReportModal from "../components/moderation/ReportModal";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import VoiceRecorder from "../components/home/VoiceRecorder";
import VoiceBubble from "../components/home/VoiceBubble";
import PollOptions from "../components/home/PollOptions";

const typeColors = {
  question: "bg-amber-50 text-amber-700 border-amber-200",
  quote: "bg-emerald-50 text-emerald-700 border-emerald-200",
  concern: "bg-rose-50 text-rose-700 border-rose-200",
};

function ReplyItem({ reply, user, postId, allReplies, depth = 0, onReplyAdded }) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [sending, setSending] = useState(false);
  const [showChildren, setShowChildren] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const queryClient = useQueryClient();

  const children = allReplies.filter(r => r.parent_reply_id === reply.id && r.kind === "text");
  const hasLiked = reply.liked_by?.includes(user?.email);

  const likeMutation = useMutation({
    mutationFn: async () => {
      const newLikedBy = hasLiked
        ? (reply.liked_by || []).filter(e => e !== user?.email)
        : [...(reply.liked_by || []), user?.email];
      await base44.entities.Reply.update(reply.id, {
        like_count: newLikedBy.length,
        liked_by: newLikedBy,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["replies", postId] }),
  });

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    await base44.entities.Reply.create({
      post_id: postId,
      parent_reply_id: reply.id,
      text: replyText.trim(),
      author_name: isAnonymous ? "Anonymous" : (user?.display_name || user?.full_name || "User"),
      author_email: isAnonymous ? "" : (user?.email || ""),
      is_anonymous: isAnonymous,
      like_count: 0,
      liked_by: [],
    });
    setReplyText("");
    setSending(false);
    setShowReplyInput(false);
    onReplyAdded();
  };

  const marginLeft = depth > 0 ? `${Math.min(depth, 3) * 16}px` : "0px";

  return (
    <div style={{ marginLeft }}>
      <div className="rounded-xl p-3.5 flex gap-3" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0" style={{ backgroundColor: "var(--bg-app)", color: "var(--accent-primary)" }}>
          {reply.is_anonymous ? "?" : (reply.author_name?.[0]?.toUpperCase() || "U")}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              {reply.is_anonymous ? "Anonymous" : reply.author_name}
            </span>
            <span className="text-[10px]" style={{ color: "var(--text-hint)" }}>
              {new Date(reply.created_date).toLocaleDateString()}
            </span>
          </div>
          {reply.kind === "voice" ? (
            <VoiceBubble audioUrl={reply.audio_url} duration={reply.duration_seconds} authorName={reply.author_name} isAnonymous={reply.is_anonymous} canDelete={user?.email === reply.author_email} onDelete={() => {}} />
          ) : (
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{reply.text}</p>
          )}
          {/* Actions */}
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => user && likeMutation.mutate()}
              className="flex items-center gap-1 text-xs transition-colors"
              style={{ color: hasLiked ? "var(--accent-primary)" : "var(--text-hint)" }}
            >
              <Heart className={`w-3.5 h-3.5 ${hasLiked ? "fill-current" : ""}`} />
              {reply.like_count > 0 && <span>{reply.like_count}</span>}
            </button>
            {user && depth < 3 && (
              <button onClick={() => setShowReplyInput(v => !v)} className="flex items-center gap-1 text-xs" style={{ color: "var(--text-hint)" }}>
                <Reply className="w-3.5 h-3.5" /> Reply
              </button>
            )}
            {user && (
              <button onClick={() => setShowReport(true)} className="flex items-center gap-1 text-xs" style={{ color: "var(--text-hint)" }}>
                <Flag className="w-3 h-3" />
              </button>
            )}
            {children.length > 0 && (
              <button onClick={() => setShowChildren(v => !v)} className="flex items-center gap-1 text-xs ml-auto" style={{ color: "var(--text-hint)" }}>
                {showChildren ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {children.length} {children.length === 1 ? "reply" : "replies"}
              </button>
            )}
          </div>
          {showReplyInput && (
            <div className="flex gap-2 mt-2">
              <button onClick={() => setIsAnonymous(v => !v)} className="p-1.5 rounded-full shrink-0 transition-colors" style={{ color: isAnonymous ? "var(--accent-primary)" : "var(--text-hint)" }}>
                <EyeOff className="w-3.5 h-3.5" />
              </button>
              <Input
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder={isAnonymous ? "Reply anonymously..." : "Reply..."}
                className="flex-1 text-xs h-8 rounded-lg"
                style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-app)" }}
                onKeyDown={e => e.key === "Enter" && handleSendReply()}
                autoFocus
              />
              <button onClick={handleSendReply} disabled={!replyText.trim() || sending} className="p-1.5 rounded-lg disabled:opacity-40" style={{ backgroundColor: "var(--accent-primary)", color: "#fff" }}>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
      {showChildren && children.length > 0 && (
        <div className="mt-2 space-y-2 border-l-2 pl-2 ml-4" style={{ borderColor: "var(--border-light)" }}>
          {children.map(child => (
            <ReplyItem key={child.id} reply={child} user={user} postId={postId} allReplies={allReplies} depth={depth + 1} onReplyAdded={onReplyAdded} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PostDetail() {
  const params = new URLSearchParams(window.location.search);
  const postId = params.get("id");
  const [user, setUser] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [sending, setSending] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: post } = useQuery({
    queryKey: ["post", postId],
    queryFn: async () => {
      const posts = await base44.entities.Post.filter({ id: postId });
      return posts[0];
    },
    enabled: !!postId,
  });

  const { data: replies = [], refetch: refetchReplies } = useQuery({
    queryKey: ["replies", postId],
    queryFn: () => base44.entities.Reply.filter({ post_id: postId }, "created_date"),
    enabled: !!postId,
  });

  const { data: voiceReplies = [], refetch: refetchVoice } = useQuery({
    queryKey: ["voiceReplies", postId],
    queryFn: () => base44.entities.VoiceReply.filter({ post_id: postId }, "created_date"),
    enabled: !!postId,
  });

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    await base44.entities.Reply.create({
      post_id: postId,
      parent_reply_id: null,
      text: replyText.trim(),
      author_name: isAnonymous ? "Anonymous" : (user?.display_name || user?.full_name || "User"),
      author_email: isAnonymous ? "" : (user?.email || ""),
      is_anonymous: isAnonymous,
      like_count: 0,
      liked_by: [],
    });
    if (post) {
      await base44.entities.Post.update(postId, { reply_count: (post.reply_count || 0) + 1 });
      if (post.author_email && post.author_email !== user?.email) {
        base44.entities.Notification.create({
          recipient_email: post.author_email,
          actor_name: isAnonymous ? "Anonymous" : (user?.display_name || user?.full_name || "Someone"),
          actor_email: isAnonymous ? "" : (user?.email || ""),
          type: "post_replied",
          post_id: postId,
          post_text: post.text?.slice(0, 80),
          is_read: false,
        }).catch(() => {});
      }
    }
    setReplyText("");
    setSending(false);
    refetchReplies();
    queryClient.invalidateQueries({ queryKey: ["post", postId] });
  };

  // Merge: top-level text + all voice replies
  const topLevelReplies = replies
    .filter(r => !r.parent_reply_id)
    .map(r => ({ ...r, kind: "text" }));

  const voiceItems = voiceReplies.map(r => ({ ...r, kind: "voice" }));

  const allRepliesFlat = [
    ...replies.map(r => ({ ...r, kind: "text" })),
    ...voiceItems,
  ];

  const sortedTopLevel = [...topLevelReplies, ...voiceItems].sort(
    (a, b) => new Date(a.created_date) - new Date(b.created_date)
  );

  if (!post) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-app)", paddingBottom: "140px" }}>
      {/* Header */}
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center gap-3" style={{ backgroundColor: "var(--bg-nav)", borderBottom: "1px solid var(--border-light)" }}>
        <Link to={createPageUrl("Home")} className="p-2 rounded-full" style={{ color: "var(--text-secondary)" }}>
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Thread</span>
      </div>

      {/* Post */}
      <div className="px-5 mt-4">
        <div className="rounded-2xl p-5" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <div className="flex items-center justify-between mb-4">
            <span className={`text-xs px-3 py-1 rounded-full border capitalize ${typeColors[post.type]}`}>{post.type}</span>
            <span className="text-xs" style={{ color: "var(--text-hint)" }}>{post.is_anonymous ? "Anonymous" : post.author_name}</span>
          </div>
          <p className="text-xl leading-relaxed" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
            {post.text}
          </p>

          {post.type === "question" && post.answer_type && post.answer_type !== "open" && (
            <PollOptions post={post} user={user} compact={false} />
          )}

          {post.type === "question" && post.answer_type === "open" && (
            <p className="text-xs mt-4 px-2 py-2 rounded-lg" style={{ backgroundColor: "rgba(60,110,90,0.05)", color: "var(--text-hint)" }}>
              💭 Open Discussion — Share your thoughts below
            </p>
          )}

          <div className="flex items-center gap-4 mt-5 pt-4" style={{ borderTop: "1px solid var(--border-light)" }}>
            <span className="flex items-center gap-1 text-sm" style={{ color: "var(--text-hint)" }}>
              <Heart className="w-4 h-4" /> {post.like_count || 0}
            </span>
            <span className="text-sm" style={{ color: "var(--text-hint)" }}>{sortedTopLevel.length} replies</span>
          </div>
        </div>

        {/* Replies */}
        <div className="mt-5 space-y-3">
          <h3 className="text-sm font-semibold px-1 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            💬 Replies <span className="text-xs font-normal" style={{ color: "var(--text-hint)" }}>({sortedTopLevel.length})</span>
          </h3>
          {sortedTopLevel.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "var(--text-hint)" }}>No replies yet. Be the first.</p>
          ) : (
            sortedTopLevel.map(reply => (
              <ReplyItem
                key={reply.id}
                reply={reply}
                user={user}
                postId={postId}
                allReplies={allRepliesFlat}
                depth={0}
                onReplyAdded={() => { refetchReplies(); queryClient.invalidateQueries({ queryKey: ["post", postId] }); }}
              />
            ))
          )}
        </div>
      </div>

      {/* Reply input */}
      <div className="fixed left-0 right-0 p-3 z-50" style={{ bottom: "56px", backgroundColor: "var(--bg-nav)", borderTop: "1px solid var(--border-light)" }}>
        <div className="max-w-lg mx-auto flex items-center gap-2">
          <button
            onClick={() => setIsAnonymous(!isAnonymous)}
            className="p-2 rounded-full transition-colors shrink-0"
            style={{ color: isAnonymous ? "var(--accent-primary)" : "var(--text-hint)" }}
          >
            <EyeOff className="w-4 h-4" />
          </button>
          <Input
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder={isAnonymous ? "Reply anonymously..." : "Reply..."}
            className="flex-1 rounded-xl"
            style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-card)" }}
            onKeyDown={e => e.key === "Enter" && handleSendReply()}
          />
          <VoiceRecorder
            postId={postId}
            user={user}
            onSent={() => { refetchVoice(); queryClient.invalidateQueries(["post", postId]); }}
          />
          <Button
            onClick={handleSendReply}
            disabled={!replyText.trim() || sending}
            size="icon"
            className="rounded-xl shrink-0"
            style={{ backgroundColor: "var(--accent-primary)" }}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}