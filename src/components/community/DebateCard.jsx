import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Send } from "lucide-react";

export default function DebateCard({ post, debate, user, onUpvote, onDownvote, isExpanded, onToggle }) {
  const qc = useQueryClient();
  const [commentText, setCommentText] = useState("");
  const [commentSide, setCommentSide] = useState("neutral");

  const { data: comments = [] } = useQuery({
    queryKey: ["communityComments", post.id],
    queryFn: () => base44.entities.CommunityComment.filter({ post_id: post.id }, "-created_date", 30),
    enabled: isExpanded,
  });

  const totalVotes = debate ? (debate.side_a_votes || 0) + (debate.side_b_votes || 0) : 0;
  const pctA = totalVotes > 0 ? Math.round(((debate.side_a_votes || 0) / totalVotes) * 100) : 50;
  const pctB = 100 - pctA;

  const hasVotedA = user?.email && debate?.side_a_voters?.includes(user.email);
  const hasVotedB = user?.email && debate?.side_b_voters?.includes(user.email);
  const hasVoted = hasVotedA || hasVotedB;

  const voteDebateMut = useMutation({
    mutationFn: async (side) => {
      if (!debate) return;
      if (side === "a") {
        await base44.entities.CommunityDebate.update(debate.id, {
          side_a_votes: (debate.side_a_votes || 0) + 1,
          side_a_voters: [...(debate.side_a_voters || []), user.email],
        });
      } else {
        await base44.entities.CommunityDebate.update(debate.id, {
          side_b_votes: (debate.side_b_votes || 0) + 1,
          side_b_voters: [...(debate.side_b_voters || []), user.email],
        });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["communityDebates"] }),
  });

  const commentMut = useMutation({
    mutationFn: () => base44.entities.CommunityComment.create({
      post_id: post.id,
      author_email: user?.email || "",
      author_name: user?.display_name || user?.full_name || "Anonymous",
      body: commentText.trim(),
      debate_side: commentSide,
    }),
    onSuccess: async () => {
      setCommentText("");
      await base44.entities.CommunityPost.update(post.id, { comment_count: (post.comment_count || 0) + 1 });
      qc.invalidateQueries({ queryKey: ["communityComments", post.id] });
      qc.invalidateQueries({ queryKey: ["communityPosts"] });
    },
  });

  const sideAComments = comments.filter(c => c.debate_side === "a");
  const sideBComments = comments.filter(c => c.debate_side === "b");

  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
      {/* Top accent */}
      <div className="h-1.5" style={{ background: "linear-gradient(90deg, #3C6E5A, #D98B62)" }} />

      <div className="p-4">
        {/* Label */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">⚔️</span>
          <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#D98B62" }}>Debate</span>
          {post.media_type && post.media_type !== "general" && (
            <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>
              {post.media_ref_title || post.media_type}
            </span>
          )}
          <span className="ml-auto text-[11px]" style={{ color: "var(--text-hint)" }}>
            {post.is_anonymous ? "Anonymous" : (post.author_name || "User")}
          </span>
        </div>

        {/* Topic */}
        <p className="font-semibold text-sm mb-1" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
          {debate?.topic || post.title || post.body}
        </p>
        {post.body && post.body !== debate?.topic && (
          <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>{post.body}</p>
        )}

        {/* Voting sides */}
        {debate && (
          <div className="mt-3">
            {/* Progress bar */}
            <div className="h-2 rounded-full overflow-hidden flex mb-2" style={{ backgroundColor: "var(--bg-subtle)" }}>
              <motion.div animate={{ width: `${pctA}%` }} transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full rounded-l-full" style={{ backgroundColor: "#3C6E5A" }} />
              <motion.div animate={{ width: `${pctB}%` }} transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full rounded-r-full" style={{ backgroundColor: "#D98B62" }} />
            </div>

            {/* Side labels & percentages */}
            <div className="flex gap-2">
              <button
                onClick={() => user && !hasVoted && voteDebateMut.mutate("a")}
                disabled={hasVoted}
                className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold text-left transition-all active:scale-95 disabled:opacity-80"
                style={{
                  backgroundColor: hasVotedA ? "#3C6E5A" : "var(--bg-subtle)",
                  color: hasVotedA ? "#fff" : "var(--text-secondary)",
                  border: hasVotedA ? "none" : "1px solid var(--border-light)"
                }}>
                <p className="text-base mb-0.5">🟢</p>
                <p>{debate.side_a_label}</p>
                <p className="text-sm font-bold mt-0.5" style={{ color: hasVotedA ? "#fff" : "#3C6E5A" }}>{pctA}%</p>
              </button>
              <button
                onClick={() => user && !hasVoted && voteDebateMut.mutate("b")}
                disabled={hasVoted}
                className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold text-left transition-all active:scale-95 disabled:opacity-80"
                style={{
                  backgroundColor: hasVotedB ? "#D98B62" : "var(--bg-subtle)",
                  color: hasVotedB ? "#fff" : "var(--text-secondary)",
                  border: hasVotedB ? "none" : "1px solid var(--border-light)"
                }}>
                <p className="text-base mb-0.5">🟠</p>
                <p>{debate.side_b_label}</p>
                <p className="text-sm font-bold mt-0.5" style={{ color: hasVotedB ? "#fff" : "#D98B62" }}>{pctB}%</p>
              </button>
            </div>
            <p className="text-[10px] text-center mt-1.5" style={{ color: "var(--text-hint)" }}>
              {totalVotes} vote{totalVotes !== 1 ? "s" : ""}{!hasVoted && user ? " · Tap a side to vote" : ""}
            </p>
          </div>
        )}

        {/* Engagement row */}
        <div className="flex items-center gap-3 mt-3">
          <button onClick={onUpvote} disabled={post.upvoted_by?.includes(user?.email)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all active:scale-90 disabled:opacity-60"
            style={{ backgroundColor: post.upvoted_by?.includes(user?.email) ? "var(--accent-primary)" : "var(--bg-subtle)", color: post.upvoted_by?.includes(user?.email) ? "#fff" : "var(--text-secondary)" }}>
            ▲ {post.upvotes || 0}
          </button>
          <span className="text-xs font-medium" style={{ color: "var(--text-hint)" }}>
            +{(post.upvotes || 0) - (post.downvotes || 0)}
          </span>
          <button onClick={onToggle} className="ml-auto flex items-center gap-1.5 text-xs" style={{ color: "var(--text-hint)" }}>
            💬 {post.comment_count || 0} arguments
            <ChevronDown className="w-3.5 h-3.5 transition-transform" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }} />
          </button>
        </div>

        {/* Comments / arguments */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }} className="overflow-hidden">
              <div className="pt-3 mt-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                {/* Two-column arguments */}
                {debate && (sideAComments.length > 0 || sideBComments.length > 0) && (
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <p className="text-[10px] font-bold mb-1.5" style={{ color: "#3C6E5A" }}>🟢 {debate.side_a_label}</p>
                      <div className="space-y-1.5">
                        {sideAComments.slice(0, 3).map(c => (
                          <div key={c.id} className="p-2 rounded-xl text-[11px] leading-snug" style={{ backgroundColor: "#EEF3F0", color: "var(--text-secondary)" }}>
                            {c.body}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold mb-1.5" style={{ color: "#D98B62" }}>🟠 {debate.side_b_label}</p>
                      <div className="space-y-1.5">
                        {sideBComments.slice(0, 3).map(c => (
                          <div key={c.id} className="p-2 rounded-xl text-[11px] leading-snug" style={{ backgroundColor: "#FFF3E8", color: "var(--text-secondary)" }}>
                            {c.body}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Neutral comments */}
                {comments.filter(c => c.debate_side === "neutral").map(c => (
                  <div key={c.id} className="flex gap-2 mb-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--accent-primary)" }}>
                      {(c.author_name?.[0] || "U").toUpperCase()}
                    </div>
                    <p className="text-[11px] leading-relaxed flex-1" style={{ color: "var(--text-secondary)" }}>
                      <span className="font-medium" style={{ color: "var(--text-hint)" }}>{c.is_anonymous ? "Anonymous" : c.author_name}: </span>
                      {c.body}
                    </p>
                  </div>
                ))}

                {/* Comment input */}
                {user && (
                  <div className="mt-2">
                    {debate && (
                      <div className="flex gap-1.5 mb-1.5">
                        {[["a", `🟢 ${debate.side_a_label}`], ["b", `🟠 ${debate.side_b_label}`], ["neutral", "💬 Neutral"]].map(([s, label]) => (
                          <button key={s} onClick={() => setCommentSide(s)}
                            className="px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all"
                            style={{
                              backgroundColor: commentSide === s ? "var(--accent-primary)" : "transparent",
                              color: commentSide === s ? "#fff" : "var(--text-hint)",
                              borderColor: commentSide === s ? "var(--accent-primary)" : "var(--border-light)",
                            }}>{label}</button>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input value={commentText} onChange={e => setCommentText(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && commentText.trim() && commentMut.mutate()}
                        placeholder={debate ? "Add your argument..." : "Add a comment..."}
                        className="flex-1 text-xs px-3 py-2 rounded-xl outline-none"
                        style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }} />
                      <button onClick={() => commentText.trim() && commentMut.mutate()}
                        className="p-2 rounded-xl" style={{ backgroundColor: "var(--accent-primary)", color: "#fff" }}>
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}