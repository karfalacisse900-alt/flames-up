import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Heart, Send, EyeOff } from "lucide-react";
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
      author_name: isAnonymous ? "Anonymous" : (user?.full_name || "User"),
      author_email: user?.email || "",
      is_anonymous: isAnonymous,
      like_count: 0,
      liked_by: [],
    });
    if (post) {
      await base44.entities.Post.update(postId, { reply_count: (post.reply_count || 0) + 1 });
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-[#7C8C6E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-warm)", paddingBottom: "140px" }}>
      {/* Header */}
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center gap-3 bg-white border-b border-[#EDE9E3]">
        <Link to={createPageUrl("Home")} className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-[#2C2C2C]" />
        </Link>
        <span className="text-sm font-medium text-[#6B6B6B]">Thread</span>
      </div>

      {/* Post */}
      <div className="px-5 mt-4">
        <div className="bg-white rounded-2xl p-6 border border-[#EDE9E3]">
          <div className="flex items-center justify-between mb-4">
            <span className={`text-xs px-3 py-1 rounded-full border capitalize ${typeColors[post.type]}`}>{post.type}</span>
            <span className="text-xs text-[#9B9B9B]">{post.is_anonymous ? "Anonymous" : post.author_name}</span>
          </div>
          <p className="text-xl leading-relaxed text-[#2C2C2C]" style={{ fontFamily: "var(--font-serif)" }}>
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

          <div className="flex items-center gap-4 mt-5 pt-4 border-t border-[#EDE9E3]">
            <span className="flex items-center gap-1 text-sm text-[#9B9B9B]">
              <Heart className="w-4 h-4" /> {post.like_count || 0}
            </span>
            <span className="text-sm text-[#9B9B9B]">{allReplies.length} replies</span>
          </div>
        </div>

        {/* Replies Section */}
         <div className="mt-6 space-y-3">
           <h3 className="text-sm font-semibold text-[#2C2C2C] px-1 flex items-center gap-2">
             💬 Replies <span className="text-xs font-normal" style={{ color: "var(--text-hint)" }}>({allReplies.length})</span>
           </h3>
          {allReplies.length === 0 ? (
            <p className="text-sm text-[#9B9B9B] text-center py-8">No replies yet. Be the first.</p>
          ) : (
            allReplies.map((reply) => (
              <div key={reply.id} className="bg-white rounded-xl p-4 border border-[#EDE9E3] flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#F5F0EB] flex items-center justify-center text-xs font-medium shrink-0">
                  {reply.is_anonymous ? "?" : (reply.author_name?.[0]?.toUpperCase() || "U")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-medium text-[#6B6B6B]">
                      {reply.is_anonymous ? "Anonymous" : reply.author_name}
                    </span>
                    <span className="text-[10px] text-[#9B9B9B]">
                      {new Date(reply.created_date).toLocaleDateString()}
                    </span>
                  </div>
                  {reply.kind === "text" ? (
                    <p className="text-sm text-[#2C2C2C] leading-relaxed">{reply.text}</p>
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
      <div className="fixed left-0 right-0 bg-white border-t border-[#EDE9E3] p-3 z-50" style={{ bottom: "56px" }}>
        <div className="max-w-lg mx-auto space-y-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAnonymous(!isAnonymous)}
              className={`p-2 rounded-full transition-colors shrink-0 ${isAnonymous ? "bg-[#7C8C6E]/10 text-[#7C8C6E]" : "text-[#9B9B9B] hover:bg-gray-100"}`}
              title={isAnonymous ? "Anonymous" : "Public"}
            >
              <EyeOff className="w-4 h-4" />
            </button>
            <Input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={isAnonymous ? "Reply anonymously..." : "Reply..."}
              className="flex-1 border-[#EDE9E3] rounded-xl"
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
              className="bg-[#7C8C6E] hover:bg-[#6B7B5E] rounded-xl shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}