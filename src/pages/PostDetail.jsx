import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Heart, Send, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const typeLabels = { question: "Question", quote: "Quote", concern: "Concern" };
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

  if (!post) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-[#7C8C6E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center gap-3" style={{ backgroundColor: "rgba(250,248,245,0.95)", backdropFilter: "blur(10px)" }}>
        <Link to={createPageUrl("Home")} className="p-2 rounded-full hover:bg-white/80">
          <ArrowLeft className="w-5 h-5 text-[#2C2C2C]" />
        </Link>
        <span className="text-sm font-medium text-[#6B6B6B]">Thread</span>
      </div>

      <div className="px-5 mt-2">
        <div className="bg-white rounded-2xl p-6 border border-[#EDE9E3]">
          <div className="flex items-center justify-between mb-4">
            <span className={`text-xs px-3 py-1 rounded-full border ${typeColors[post.type]}`}>
              {typeLabels[post.type]}
            </span>
            <span className="text-xs text-[#9B9B9B]">
              {post.is_anonymous ? "Anonymous" : post.author_name}
            </span>
          </div>
          <p className="text-xl leading-relaxed text-[#2C2C2C]" style={{ fontFamily: "var(--font-serif)" }}>
            {post.text}
          </p>
          <div className="flex items-center gap-4 mt-5 pt-4 border-t border-[#EDE9E3]">
            <span className="flex items-center gap-1 text-sm text-[#9B9B9B]">
              <Heart className="w-4 h-4" /> {post.like_count || 0}
            </span>
            <span className="text-sm text-[#9B9B9B]">{replies.length} replies</span>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-medium text-[#6B6B6B] px-1">Replies</h3>
          {replies.length === 0 ? (
            <p className="text-sm text-[#9B9B9B] text-center py-8">No replies yet. Be the first.</p>
          ) : (
            replies.map((reply) => (
              <div key={reply.id} className="bg-white rounded-xl p-4 border border-[#EDE9E3]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[#6B6B6B]">
                    {reply.is_anonymous ? "Anonymous" : reply.author_name}
                  </span>
                  <span className="text-xs text-[#9B9B9B]">
                    {new Date(reply.created_date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-[#2C2C2C] leading-relaxed">{reply.text}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Reply input */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#EDE9E3] p-4 z-50">
        <div className="max-w-lg mx-auto flex items-center gap-2">
          <button onClick={() => setIsAnonymous(!isAnonymous)} className={`p-2 rounded-full transition-colors ${isAnonymous ? "bg-[#7C8C6E]/10 text-[#7C8C6E]" : "text-[#9B9B9B] hover:bg-gray-100"}`}>
            <EyeOff className="w-4 h-4" />
          </button>
          <Input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            className="flex-1 border-[#EDE9E3] rounded-xl"
            onKeyDown={(e) => e.key === "Enter" && handleSendReply()}
          />
          <Button
            onClick={handleSendReply}
            disabled={!replyText.trim() || sending}
            size="icon"
            className="bg-[#7C8C6E] hover:bg-[#6B7B5E] rounded-xl"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}