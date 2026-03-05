import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ImageIcon, Smile, Mic, Square, Play, Pause, Hash, Pin, Flag, Trash2 } from "lucide-react";

function timeAgo(d) {
  if (!d) return "";
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

const avatarColors = ["#7C69C4","#D98B62","#3C6E5A","#E05C7A","#4A7FC1","#B07843"];
const getColor = (name) => avatarColors[(name||"U").charCodeAt(0) % avatarColors.length];

export default function GroupChannelFeed({ group, channel, user, isMember }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const qc = useQueryClient();
  const bottomRef = useRef(null);
  const fileRef = useRef(null);

  const channelKey = `${group.id}::${channel.id}`;

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["channelPosts", channelKey],
    queryFn: () => base44.entities.CommunityPost.filter(
      { group_id: group.id, tags: [channel.id] },
      "created_date", 100
    ),
    refetchInterval: 8000,
  });

  useQuery({
    queryKey: ["channelSubscribe", channelKey],
    queryFn: () => null,
    enabled: false,
  });

  React.useEffect(() => {
    const unsub = base44.entities.CommunityPost.subscribe((e) => {
      if (e.data?.group_id === group.id && e.data?.tags?.includes(channel.id)) {
        qc.invalidateQueries({ queryKey: ["channelPosts", channelKey] });
      }
    });
    return unsub;
  }, [channelKey, group.id, channel.id, qc]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [posts.length]);

  const send = async () => {
    const t = text.trim();
    if (!t || !user || sending) return;
    setSending(true);
    setText("");
    await base44.entities.CommunityPost.create({
      group_id: group.id,
      group_name: group.name,
      type: "discussion",
      body: t,
      author_email: user.email,
      author_name: user.full_name || user.email,
      author_avatar_url: user.avatar_url || "",
      tags: [channel.id],
      moderation_status: "approved",
    });
    qc.invalidateQueries({ queryKey: ["channelPosts", channelKey] });
    setSending(false);
  };

  const handleImage = async (file) => {
    if (!file || !user) return;
    setSending(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.CommunityPost.create({
      group_id: group.id,
      group_name: group.name,
      type: "discussion",
      body: "",
      image_url: file_url,
      author_email: user.email,
      author_name: user.full_name || user.email,
      author_avatar_url: user.avatar_url || "",
      tags: [channel.id],
      moderation_status: "approved",
    });
    qc.invalidateQueries({ queryKey: ["channelPosts", channelKey] });
    setSending(false);
  };

  const deletePost = async (post) => {
    await base44.entities.CommunityPost.delete(post.id);
    qc.invalidateQueries({ queryKey: ["channelPosts", channelKey] });
  };

  return (
    <div className="flex flex-col" style={{ height: "100%", minHeight: 0 }}>
      {/* Channel header */}
      <div className="px-4 py-2.5 flex items-center gap-2 border-b shrink-0"
        style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}>
        <Hash className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
        <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{channel.name}</span>
        {channel.description && (
          <>
            <span style={{ color: "var(--border-medium)" }}>·</span>
            <span className="text-xs truncate" style={{ color: "var(--text-hint)" }}>{channel.description}</span>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1" style={{ overscrollBehavior: "contain" }}>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
          </div>
        ) : posts.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-4xl mb-2">💬</div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>No messages yet</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>Be the first to say something in #{channel.name}</p>
          </div>
        ) : (
          posts.map((post, i) => {
            const isOwn = user?.email === post.author_email;
            const color = getColor(post.author_name);
            const showAvatar = i === 0 || posts[i-1]?.author_email !== post.author_email;
            return (
              <motion.div key={post.id}
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2.5 group/msg ${showAvatar ? "mt-3" : "mt-0.5"}`}>
                {/* Avatar column */}
                <div className="w-8 shrink-0">
                  {showAvatar && (
                    post.author_avatar_url ? (
                      <img src={post.author_avatar_url} alt={post.author_name}
                        className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: `linear-gradient(135deg, ${color}33, ${color}66)`, color }}>
                        {(post.author_name?.[0] || "U").toUpperCase()}
                      </div>
                    )
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {showAvatar && (
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{post.author_name || "User"}</span>
                      <span className="text-[10px]" style={{ color: "var(--text-hint)" }}>{timeAgo(post.created_date)}</span>
                    </div>
                  )}
                  {post.image_url ? (
                    <img src={post.image_url} alt="" className="rounded-xl mt-1 max-w-xs object-cover"
                      style={{ maxHeight: 200, border: "1px solid var(--border-subtle)" }} />
                  ) : (
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{post.body}</p>
                  )}
                </div>

                {/* Delete on hover */}
                {isOwn && (
                  <button onClick={() => deletePost(post)}
                    className="opacity-0 group-hover/msg:opacity-100 transition-opacity p-1 rounded self-center shrink-0"
                    style={{ color: "#E05C7A" }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </motion.div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {isMember && user && (
        <div className="px-3 py-2.5 shrink-0"
          style={{ borderTop: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-card)" }}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl"
            style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
              placeholder={`Message #${channel.name}`}
              className="flex-1 text-sm bg-transparent outline-none"
              style={{ color: "var(--text-primary)", fontSize: 16 }}
            />
            <button onClick={() => fileRef.current?.click()} className="p-1.5 rounded-full shrink-0"
              style={{ color: "var(--text-hint)" }}>
              <ImageIcon className="w-4 h-4" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files?.[0] && handleImage(e.target.files[0])} />
            {text.trim() && (
              <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }}
                onClick={send} disabled={sending}
                className="p-1.5 rounded-full shrink-0"
                style={{ backgroundColor: "var(--accent-primary)", color: "#fff" }}>
                <Send className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}