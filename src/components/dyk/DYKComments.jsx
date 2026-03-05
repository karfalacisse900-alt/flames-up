import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ThumbsUp, CornerDownRight, Send } from "lucide-react";

export default function DYKComments({ factId, user, onCommented }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null); // { id, author_name }
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    load();
  }, [factId]);

  async function load() {
    const all = await base44.entities.DYKComment.filter({ fact_id: factId }, "created_date", 100);
    setComments(all);
  }

  async function submit() {
    if (!text.trim() || !user || submitting) return;
    setSubmitting(true);
    await base44.entities.DYKComment.create({
      fact_id: factId,
      parent_id: replyTo?.id || null,
      author_email: user.email,
      author_name: user.full_name || "User",
      text: text.trim(),
    });
    // Update comment count
    const fact = await base44.entities.DidYouKnow.filter({ id: factId });
    if (fact[0]) {
      await base44.entities.DidYouKnow.update(factId, { comment_count: (fact[0].comment_count || 0) + 1 });
    }
    setText("");
    setReplyTo(null);
    await load();
    onCommented?.();
    setSubmitting(false);
  }

  async function toggleLike(comment) {
    if (!user) return;
    const liked = (comment.liked_by || []).includes(user.email);
    const liked_by = liked
      ? comment.liked_by.filter(e => e !== user.email)
      : [...(comment.liked_by || []), user.email];
    await base44.entities.DYKComment.update(comment.id, {
      liked_by,
      like_count: liked_by.length,
    });
    load();
  }

  // Build threaded structure
  const topLevel = comments.filter(c => !c.parent_id);
  const replies = comments.filter(c => c.parent_id);
  const getReplies = (id) => replies.filter(r => r.parent_id === id);

  return (
    <div className="space-y-3">
      {/* Input */}
      <div className="flex gap-2 items-start">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
          style={{ backgroundColor: "var(--accent-primary, #6366f1)", color: "#fff" }}>
          {user?.full_name?.[0] || "?"}
        </div>
        <div className="flex-1 flex gap-2">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()}
            placeholder={replyTo ? `Replying to ${replyTo.author_name}...` : "Add a comment..."}
            className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
            style={{ backgroundColor: "var(--bg-subtle, #f3f4f6)", border: "1px solid var(--border-light, #e5e7eb)", color: "var(--text-primary, #111)" }}
          />
          {replyTo && (
            <button onClick={() => setReplyTo(null)} className="text-xs px-2" style={{ color: "var(--text-hint, #9ca3af)" }}>✕</button>
          )}
          <button
            onClick={submit}
            disabled={!text.trim() || submitting}
            className="p-2 rounded-xl transition-opacity disabled:opacity-40"
            style={{ backgroundColor: "var(--accent-primary, #6366f1)" }}>
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Comments */}
      {topLevel.map(comment => (
        <CommentItem
          key={comment.id}
          comment={comment}
          user={user}
          onReply={() => setReplyTo({ id: comment.id, author_name: comment.author_name })}
          onLike={() => toggleLike(comment)}
          replies={getReplies(comment.id)}
          allReplies={replies}
          onReplyToReply={(r) => setReplyTo({ id: comment.id, author_name: r.author_name })}
          onLikeReply={toggleLike}
        />
      ))}

      {comments.length === 0 && (
        <p className="text-center text-sm py-2" style={{ color: "var(--text-hint, #9ca3af)" }}>No comments yet. Be first!</p>
      )}
    </div>
  );
}

function CommentItem({ comment, user, onReply, onLike, replies, onLikeReply }) {
  const liked = (comment.liked_by || []).includes(user?.email);

  return (
    <div>
      <div className="flex gap-2">
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{ backgroundColor: "var(--bg-subtle, #f3f4f6)", color: "var(--text-secondary, #6b7280)" }}>
          {comment.author_name?.[0] || "?"}
        </div>
        <div className="flex-1">
          <div className="rounded-xl px-3 py-2" style={{ backgroundColor: "var(--bg-subtle, #f3f4f6)" }}>
            <p className="text-xs font-semibold" style={{ color: "var(--text-primary, #111)" }}>{comment.author_name}</p>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-primary, #111)" }}>{comment.text}</p>
          </div>
          <div className="flex items-center gap-3 mt-1 px-1">
            <button onClick={onLike} className="text-xs flex items-center gap-1"
              style={{ color: liked ? "var(--accent-primary, #6366f1)" : "var(--text-hint, #9ca3af)", fontWeight: liked ? 600 : 400 }}>
              <ThumbsUp className="w-3 h-3" />
              {comment.like_count > 0 && comment.like_count}
            </button>
            <button onClick={onReply} className="text-xs flex items-center gap-1"
              style={{ color: "var(--text-hint, #9ca3af)" }}>
              <CornerDownRight className="w-3 h-3" /> Reply
            </button>
          </div>
        </div>
      </div>

      {/* Nested replies */}
      {replies.length > 0 && (
        <div className="ml-9 mt-2 space-y-2 border-l-2 pl-3" style={{ borderColor: "var(--border-light, #e5e7eb)" }}>
          {replies.map(reply => {
            const rLiked = (reply.liked_by || []).includes(user?.email);
            return (
              <div key={reply.id} className="flex gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ backgroundColor: "var(--bg-subtle, #f3f4f6)", color: "var(--text-secondary, #6b7280)" }}>
                  {reply.author_name?.[0] || "?"}
                </div>
                <div className="flex-1">
                  <div className="rounded-xl px-3 py-2" style={{ backgroundColor: "var(--bg-subtle, #f3f4f6)" }}>
                    <p className="text-xs font-semibold" style={{ color: "var(--text-primary, #111)" }}>{reply.author_name}</p>
                    <p className="text-sm mt-0.5" style={{ color: "var(--text-primary, #111)" }}>{reply.text}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-1 px-1">
                    <button onClick={() => onLikeReply(reply)} className="text-xs flex items-center gap-1"
                      style={{ color: rLiked ? "var(--accent-primary, #6366f1)" : "var(--text-hint, #9ca3af)", fontWeight: rLiked ? 600 : 400 }}>
                      <ThumbsUp className="w-3 h-3" />
                      {reply.like_count > 0 && reply.like_count}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}