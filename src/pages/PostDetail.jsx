import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Heart, Send, EyeOff, UserPlus, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import VoiceRecorder from "../components/home/VoiceRecorder";
import VoiceBubble from "../components/home/VoiceBubble";
import PollOptions from "../components/home/PollOptions";

const typeColors = {
  question: "",
  quote: "",
  concern: "",
};

export default function PostDetail() {
  const params = new URLSearchParams(window.location.search);
  const postId = params.get("id");
  const [user, setUser] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [sending, setSending] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      if (u?.email && postId) {
        const posts = await base44.entities.Post.filter({ id: postId });
        const p = posts[0];
        if (p?.author_email && p.author_email !== u.email) {
          const existing = await base44.entities.Follow.filter({ follower_email: u.email, following_email: p.author_email });
          setFollowing(existing.length > 0);
        }
      }
    }).catch(() => {});
  }, [postId]);

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
    queryFn: () => base44.entities.Reply.filter({ post_id: postId }, "-created_date"),
    enabled: !!postId,
  });

  const { data: voiceReplies = [], refetch: refetchVoice } = useQuery({
    queryKey: ["voiceReplies", postId],
    queryFn: () => base44.entities.VoiceReply.filter({ post_id: postId }, "-created_date"),
    enabled: !!postId,
  });

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    await base44.entities.Reply.create({
      post_id: postId,
      text: replyText.trim(),
      author_name: isAnonymous ? "Anonymous" : (user?.display_name || user?.full_name || "User"),
      author_email: isAnonymous ? "" : (user?.email || ""),
      is_anonymous: isAnonymous,
      like_count: 0,
      liked_by: [],
    });
    if (post) {
      await base44.entities.Post.update(postId, { reply_count: (post.reply_count || 0) + 1 });
      // Notify post author
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

  const handleDeleteVoiceReply = async (replyId) => {
    await base44.entities.VoiceReply.delete(replyId);
    refetchVoice();
  };

  // Merge text & voice replies by date
  const allReplies = [
    ...replies.map((r) => ({ ...r, kind: "text" })),
    ...voiceReplies.map((r) => ({ ...r, kind: "voice" })),
  ].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

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
        <Link to={createPageUrl("Home")} className="p-2 rounded-full" style={{ backgroundColor: "var(--bg-card)" }}>
          <ArrowLeft className="w-5 h-5" style={{ color: "var(--text-primary)" }} />
        </Link>
        <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Thread</span>
      </div>

      {/* Post */}
      <div className="px-5 mt-4">
        <div className="rounded-2xl p-6" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs px-3 py-1 rounded-full border capitalize" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)", borderColor: "var(--border-light)" }}>{post.type}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "var(--text-hint)" }}>{post.is_anonymous ? "Anonymous" : post.author_name}</span>
              {!post.is_anonymous && post.author_email && user?.email && post.author_email !== user.email && (
                <button
                  onClick={async () => {
                    setFollowLoading(true);
                    if (following) {
                      const existing = await base44.entities.Follow.filter({ follower_email: user.email, following_email: post.author_email });
                      if (existing[0]) await base44.entities.Follow.delete(existing[0].id);
                      setFollowing(false);
                    } else {
                      await base44.entities.Follow.create({
                        follower_email: user.email,
                        follower_name: user.display_name || user.full_name || user.email,
                        following_email: post.author_email,
                        following_name: post.author_name || post.author_email,
                      });
                      setFollowing(true);
                    }
                    setFollowLoading(false);
                  }}
                  disabled={followLoading}
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-all border"
                  style={{
                    backgroundColor: following ? "var(--accent-primary)" : "transparent",
                    color: following ? "#fff" : "var(--accent-primary)",
                    borderColor: "var(--accent-primary)"
                  }}>
                  {following ? <UserCheck className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                  {following ? "Following" : "Follow"}
                </button>
              )}
            </div>
          </div>
          <p className="text-xl leading-relaxed" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
            {post.text}
          </p>

          {/* Poll results for Yes/No and Multiple Choice */}
          {post.type === "question" && post.answer_type && post.answer_type !== "open" && (
            <>
              <PollOptions post={post} user={user} compact={false} />
            </>
          )}

          {/* Engagement stats */}
          {post.type === "question" && post.answer_type === "open" && (
            <p className="text-xs mt-4 px-2 py-2 rounded-lg" style={{ backgroundColor: "rgba(60,110,90,0.05)", color: "var(--text-hint)" }}>
              💭 Open Discussion — Share your thoughts in the replies below
            </p>
          )}

          <div className="flex items-center gap-4 mt-5 pt-4" style={{ borderTop: "1px solid var(--border-light)" }}>
            <span className="flex items-center gap-1 text-sm" style={{ color: "var(--text-hint)" }}>
              <Heart className="w-4 h-4" /> {post.like_count || 0}
            </span>
            <span className="text-sm" style={{ color: "var(--text-hint)" }}>{allReplies.length} replies</span>
          </div>
        </div>

        {/* Replies Section */}
         <div className="mt-6 space-y-3">
           <h3 className="text-sm font-semibold px-1 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
             💬 Replies <span className="text-xs font-normal" style={{ color: "var(--text-hint)" }}>({allReplies.length})</span>
           </h3>
          {allReplies.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "var(--text-hint)" }}>No replies yet. Be the first.</p>
          ) : (
            allReplies.map((reply) => (
              <div key={reply.id} className="rounded-xl p-4 flex gap-3" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0" style={{ backgroundColor: "var(--bg-app)", color: "var(--accent-primary)" }}>
                  {reply.is_anonymous ? "?" : (reply.author_name?.[0]?.toUpperCase() || "U")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                      {reply.is_anonymous ? "Anonymous" : reply.author_name}
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--text-hint)" }}>
                      {new Date(reply.created_date).toLocaleDateString()}
                    </span>
                  </div>
                  {reply.kind === "text" ? (
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{reply.text}</p>
                  ) : (
                    <VoiceBubble
                      audioUrl={reply.audio_url}
                      duration={reply.duration_seconds}
                      authorName={reply.author_name}
                      isAnonymous={reply.is_anonymous}
                      canDelete={user?.email === reply.author_email}
                      onDelete={() => handleDeleteVoiceReply(reply.id)}
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Reply input - sits above nav bar */}
      <div className="fixed left-0 right-0 p-3 z-50" style={{ bottom: "56px", backgroundColor: "var(--bg-nav)", borderTop: "1px solid var(--border-light)" }}>
        <div className="max-w-lg mx-auto space-y-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAnonymous(!isAnonymous)}
              className="p-2 rounded-full transition-colors shrink-0"
            style={{ backgroundColor: isAnonymous ? "var(--accent-primary-light)" : "transparent", color: isAnonymous ? "var(--accent-primary)" : "var(--text-hint)" }}
              title={isAnonymous ? "Anonymous" : "Public"}
            >
              <EyeOff className="w-4 h-4" />
            </button>
            <Input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={isAnonymous ? "Reply anonymously..." : "Reply..."}
              className="flex-1 rounded-xl"
              onKeyDown={(e) => e.key === "Enter" && handleSendReply()}
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
            className="rounded-xl shrink-0" style={{ backgroundColor: "var(--accent-primary)" }}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}