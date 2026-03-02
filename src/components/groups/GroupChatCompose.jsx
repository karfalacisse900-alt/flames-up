import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Send, Image as ImageIcon, X, Loader2 } from "lucide-react";
import { checkContent } from "@/components/moderation/moderationHelper";
import { useTypingBroadcast } from "./TypingIndicator";

export default function GroupChatCompose({ group, user, members = [], replyTo, onClearReply, onPosted, fileInputRef }) {
  const [body, setBody] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [mentionQuery, setMentionQuery] = useState(null); // string or null
  const [mentionStart, setMentionStart] = useState(-1);
  const textareaRef = useRef(null);
  const localFileRef = useRef(null);
  const usedRef = fileInputRef || localFileRef;

  // Detect @mention trigger
  const handleBodyChange = (e) => {
    const val = e.target.value;
    setBody(val);
    const cursor = e.target.selectionStart;
    const textBefore = val.slice(0, cursor);
    const atMatch = textBefore.match(/@(\w*)$/);
    if (atMatch) {
      setMentionQuery(atMatch[1].toLowerCase());
      setMentionStart(textBefore.lastIndexOf("@"));
    } else {
      setMentionQuery(null);
      setMentionStart(-1);
    }
  };

  const insertMention = (member) => {
    const before = body.slice(0, mentionStart);
    const after = body.slice(mentionStart + (mentionQuery?.length || 0) + 1);
    const newBody = `${before}@${member.user_name} ${after}`;
    setBody(newBody);
    setMentionQuery(null);
    setMentionStart(-1);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const filteredMembers = mentionQuery !== null
    ? members.filter(m => m.user_name?.toLowerCase().includes(mentionQuery) && m.user_email !== user?.email).slice(0, 5)
    : [];

  const handleImagePick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
    e.target.value = "";
  };

  const extractMentions = (text) => {
    const found = [];
    const regex = /@([\w\s.]+?)(?=\s|$)/g;
    let m;
    while ((m = regex.exec(text)) !== null) {
      const name = m[1].trim();
      const member = members.find(mb => mb.user_name === name);
      if (member) found.push(member.user_email);
    }
    return found;
  };

  const handleSubmit = async () => {
    if (!body.trim() || saving) return;
    setSaving(true);

    let imageUrl = null;
    if (imageFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
      imageUrl = file_url;
    }

    const mentions = extractMentions(body);

    const newPost = await base44.entities.CommunityPost.create({
      type: "opinion",
      body: body.trim(),
      author_email: user.email,
      author_name: user.full_name || user.email,
      image_url: imageUrl || undefined,
      group_id: group.id,
      group_name: group.name,
      mentions: mentions.length > 0 ? mentions : undefined,
      reply_to_id: replyTo?.id || undefined,
      reply_to_author: replyTo?.author_name || undefined,
      reply_to_preview: replyTo ? replyTo.body?.slice(0, 60) : undefined,
      upvotes: 0, downvotes: 0, comment_count: 0, engagement_score: 0,
      read_by: [user.email],
      moderation_status: "approved", // default, AI will override if needed
    });

    // Run AI moderation in background (non-blocking)
    base44.functions.invoke("moderateGroupPost", {
      post_id: newPost.id,
      post_body: body.trim(),
      group_id: group.id,
      author_email: user.email,
    }).catch(() => {});

    await base44.entities.Group.update(group.id, { post_count: (group.post_count || 0) + 1 });

    setBody("");
    setImageFile(null);
    setImagePreview(null);
    onClearReply?.();
    setSaving(false);
    onPosted?.();
  };

  return (
    <div>
      {/* Reply preview bar */}
      <AnimatePresence>
        {replyTo && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 px-4 py-2 border-t"
            style={{ backgroundColor: "var(--bg-subtle)", borderColor: "var(--border-light)" }}>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold" style={{ color: "var(--accent-primary)" }}>↩ Replying to {replyTo.author_name}</p>
              <p className="text-xs truncate" style={{ color: "var(--text-hint)" }}>{replyTo.body?.slice(0, 60)}</p>
            </div>
            <button onClick={onClearReply}><X className="w-4 h-4" style={{ color: "var(--text-hint)" }} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image preview */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="px-4 py-2 border-t relative" style={{ borderColor: "var(--border-light)" }}>
            <img src={imagePreview} alt="" className="h-20 rounded-xl object-cover" />
            <button onClick={() => { setImageFile(null); setImagePreview(null); }}
              className="absolute top-3 right-5 w-6 h-6 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mention suggestions */}
      <AnimatePresence>
        {filteredMembers.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="mx-4 mb-1 rounded-xl shadow-lg overflow-hidden border"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)" }}>
            {filteredMembers.map(m => (
              <button key={m.user_email} onClick={() => insertMention(m)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--bg-subtle)] transition-colors">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)" }}>
                  {m.user_name?.[0]?.toUpperCase() || "U"}
                </div>
                <span style={{ color: "var(--text-primary)" }}>@{m.user_name}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compose row */}
      <div className="flex items-end gap-2 px-3 py-2.5 border-t" style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-card)" }}>
        <input ref={usedRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
        <button onClick={() => usedRef.current?.click()} className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all"
          style={{ backgroundColor: "var(--bg-subtle)" }}>
          <ImageIcon className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
        </button>

        <textarea ref={textareaRef} value={body} onChange={handleBodyChange} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
          placeholder="Message… (@ to mention)"
          rows={1}
          className="flex-1 px-3 py-2 rounded-xl text-sm outline-none resize-none"
          style={{
            backgroundColor: "var(--bg-subtle)",
            border: "1px solid var(--border-light)",
            color: "var(--text-primary)",
            maxHeight: 100,
            overflowY: "auto",
          }} />

        <button onClick={handleSubmit} disabled={!body.trim() || saving}
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-40 transition-all active:scale-90"
          style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)" }}>
          {saving ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
        </button>
      </div>
    </div>
  );
}