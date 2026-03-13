import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";
import NowCommentComposer from "./NowCommentComposer";

const REACTIONS = ["🔥", "😂", "👏", "🤯", "💡"];

function CommentBubble({ comment, currentUser, onReaction, onRefresh }) {
  const [userReaction, setUserReaction] = useState(null);

  useEffect(() => {
    if (currentUser && comment.reaction_users) {
      for (const [emoji, users] of Object.entries(comment.reaction_users)) {
        if (users.includes(currentUser.email)) {
          setUserReaction(emoji);
          break;
        }
      }
    }
  }, [comment, currentUser]);

  const handleReaction = async (emoji) => {
    if (!currentUser) return;

    const reactions = { ...comment.reactions } || {};
    const reactionUsers = { ...comment.reaction_users } || {};

    if (userReaction === emoji) {
      reactions[emoji] = (reactions[emoji] || 1) - 1;
      if (reactions[emoji] === 0) delete reactions[emoji];
      reactionUsers[emoji] = (reactionUsers[emoji] || []).filter(e => e !== currentUser.email);
      if (reactionUsers[emoji].length === 0) delete reactionUsers[emoji];
      setUserReaction(null);
    } else {
      if (userReaction) {
        reactions[userReaction] = (reactions[userReaction] || 1) - 1;
        reactionUsers[userReaction] = (reactionUsers[userReaction] || []).filter(e => e !== currentUser.email);
      }
      reactions[emoji] = (reactions[emoji] || 0) + 1;
      reactionUsers[emoji] = [...(reactionUsers[emoji] || []), currentUser.email];
      setUserReaction(emoji);
    }

    await base44.entities.NowStatusComment.update(comment.id, { reactions, reaction_users: reactionUsers });
    onRefresh();
  };

  return (
    <div className="mb-4">
      <div className="flex gap-2.5">
        <img src={comment.author_avatar_url || "https://via.placeholder.com/40"}
          alt="" className="w-8 h-8 rounded-full shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="rounded-2xl p-3" style={{ backgroundColor: "var(--bg-subtle)" }}>
            <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
              {comment.author_name?.split(" ")[0] || "User"}
            </p>
            {comment.comment_type === "text" && (
              <p className="text-sm mt-1" style={{ color: "var(--text-primary)" }}>
                {comment.text}
              </p>
            )}
            {comment.comment_type === "emoji" && (
              <span className="text-2xl inline-block mt-1">{comment.emoji}</span>
            )}
            {(comment.comment_type === "photo" || comment.comment_type === "video") && (
              <div className="mt-2 rounded-lg overflow-hidden" style={{ maxHeight: "200px" }}>
                {comment.comment_type === "photo" ? (
                  <img src={comment.media_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <video src={comment.media_url} className="w-full h-full object-cover" />
                )}
              </div>
            )}
          </div>
          <p className="text-[10px] mt-1" style={{ color: "var(--text-hint)" }}>
            {formatDistanceToNow(new Date(comment.created_date), { addSuffix: true })}
          </p>
          
          {/* Reactions */}
          <div className="flex gap-1 mt-2 flex-wrap">
            {REACTIONS.map(emoji => {
              const count = comment.reactions?.[emoji] || 0;
              return (
                <button key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-all"
                  style={{
                    backgroundColor: userReaction === emoji ? "var(--accent-primary)" : "var(--bg-card)",
                    border: `1px solid ${userReaction === emoji ? "var(--accent-primary)" : "var(--border-light)"}`
                  }}>
                  <span>{emoji}</span>
                  {count > 0 && <span style={{ color: userReaction === emoji ? "white" : "var(--text-hint)", fontSize: "9px" }} className="font-semibold">{count}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NowStatusComments({ statusId, currentUser, onRefresh }) {
  const { data: comments = [], isLoading, refetch } = useQuery({
    queryKey: ["nowComments", statusId],
    queryFn: async () => {
      const all = await base44.entities.NowStatusComment.filter({ status_id: statusId }, "-created_date");
      return all.filter(c => !c.reply_to_id); // Only top-level comments
    },
    staleTime: 15000,
  });

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
        Comments ({comments.length})
      </h3>

      {/* Composer */}
      <NowCommentComposer
        statusId={statusId}
        currentUser={currentUser}
        onCommented={() => {
          refetch();
          onRefresh();
        }}
      />

      {/* Comments List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--accent-primary)" }} />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: "var(--text-hint)" }}>
            No comments yet. Be first to reply! 💬
          </p>
        ) : (
          comments.map(comment => (
            <CommentBubble
              key={comment.id}
              comment={comment}
              currentUser={currentUser}
              onReaction={() => refetch()}
              onRefresh={() => refetch()}
            />
          ))
        )}
      </div>
    </div>
  );
}