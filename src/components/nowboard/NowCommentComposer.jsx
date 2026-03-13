import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Smile, Camera, Send, Loader2, X } from "lucide-react";

const QUICK_EMOJIS = ["😂", "🔥", "👏", "😍", "🤔", "😢", "🤯", "💡", "👌", "🙌"];

export default function NowCommentComposer({ statusId, currentUser, onCommented }) {
  const [commentType, setCommentType] = useState("text");
  const [text, setText] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState(null);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const mediaInputRef = useRef(null);

  const handleMediaPick = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
    setCommentType(type);
    e.target.value = "";
  };

  const handleSubmit = async () => {
    if (!currentUser) return;

    if (commentType === "text" && !text.trim()) return;
    if (commentType === "emoji" && !selectedEmoji) return;
    if (commentType !== "emoji" && commentType !== "text" && !mediaFile) return;

    setSaving(true);
    setUploading(mediaFile ? true : false);

    try {
      let mediaUrl = null;
      if (mediaFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: mediaFile });
        mediaUrl = file_url;
        setUploading(false);
      }

      await base44.entities.NowStatusComment.create({
        status_id: statusId,
        author_email: currentUser.email,
        author_name: currentUser.full_name || currentUser.email,
        author_avatar_url: currentUser.avatar_url || "",
        comment_type: commentType,
        text: commentType === "text" ? text.trim() : undefined,
        emoji: commentType === "emoji" ? selectedEmoji : undefined,
        media_url: mediaUrl,
        reactions: {},
        reaction_users: {},
      });

      setText("");
      setSelectedEmoji(null);
      setMediaFile(null);
      setMediaPreview(null);
      setCommentType("text");
      setShowEmojiPicker(false);
      onCommented();
    } catch (err) {
      console.error("Error creating comment:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Input Area */}
      {commentType === "text" && (
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Add a comment..."
            maxLength={280}
            className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
            style={{
              backgroundColor: "var(--bg-subtle)",
              border: "1px solid var(--border-light)",
              color: "var(--text-primary)"
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || saving}
            className="px-3 py-2 rounded-xl font-semibold text-white disabled:opacity-50 transition-all flex items-center gap-1"
            style={{ backgroundColor: "var(--accent-primary)" }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      )}

      {/* Emoji Picker */}
      {commentType === "emoji" && (
        <div className="space-y-2">
          <div className="flex gap-2 flex-wrap">
            {QUICK_EMOJIS.map(emoji => (
              <button
                key={emoji}
                onClick={() => setSelectedEmoji(emoji)}
                className="w-10 h-10 rounded-lg text-xl transition-all flex items-center justify-center"
                style={{
                  backgroundColor: selectedEmoji === emoji ? "var(--accent-primary)" : "var(--bg-subtle)",
                  border: `1px solid ${selectedEmoji === emoji ? "var(--accent-primary)" : "var(--border-light)"}`
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
          {selectedEmoji && (
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedEmoji(null)}
                className="flex-1 px-3 py-2 rounded-xl font-semibold transition-all"
                style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}
              >
                Clear
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 px-3 py-2 rounded-xl font-semibold text-white disabled:opacity-50 transition-all"
                style={{ backgroundColor: "var(--accent-primary)" }}
              >
                {saving ? "..." : "Send"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Media Preview */}
      {(commentType === "photo" || commentType === "video") && (
        <div className="space-y-2">
          {mediaPreview ? (
            <div className="relative rounded-xl overflow-hidden" style={{ maxHeight: "200px" }}>
              {commentType === "photo" ? (
                <img src={mediaPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <video src={mediaPreview} className="w-full h-full object-cover" />
              )}
              <button
                onClick={() => {
                  setMediaFile(null);
                  setMediaPreview(null);
                  setCommentType("text");
                }}
                className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "white" }}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => mediaInputRef.current?.click()}
              className="w-full py-3 rounded-xl border-2 border-dashed text-sm font-medium transition-all"
              style={{
                borderColor: "var(--border-medium)",
                color: "var(--text-hint)",
                backgroundColor: "var(--bg-subtle)"
              }}
            >
              + Choose {commentType}
            </button>
          )}
          {mediaPreview && (
            <button
              onClick={handleSubmit}
              disabled={!mediaFile || saving}
              className="w-full px-3 py-2 rounded-xl font-semibold text-white disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              style={{ backgroundColor: "var(--accent-primary)" }}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {uploading ? "Uploading..." : "Posting..."}
                </>
              ) : (
                "Post Remix"
              )}
            </button>
          )}
        </div>
      )}

      {/* Type Selector */}
      <div className="flex gap-2 pt-2 border-t" style={{ borderColor: "var(--border-light)" }}>
        <button
          onClick={() => setCommentType("text")}
          className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
          style={{
            backgroundColor: commentType === "text" ? "var(--accent-primary)" : "var(--bg-subtle)",
            color: commentType === "text" ? "white" : "var(--text-secondary)"
          }}
        >
          💬 Text
        </button>
        <button
          onClick={() => {
            setCommentType("emoji");
            setShowEmojiPicker(!showEmojiPicker);
          }}
          className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
          style={{
            backgroundColor: commentType === "emoji" ? "var(--accent-primary)" : "var(--bg-subtle)",
            color: commentType === "emoji" ? "white" : "var(--text-secondary)"
          }}
        >
          😂 Emoji
        </button>
        <button
          onClick={() => {
            setCommentType("photo");
            mediaInputRef.current?.click();
          }}
          className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
          style={{
            backgroundColor: commentType === "photo" ? "var(--accent-primary)" : "var(--bg-subtle)",
            color: commentType === "photo" ? "white" : "var(--text-secondary)"
          }}
        >
          📷 Photo
        </button>
        <button
          onClick={() => {
            setCommentType("video");
            mediaInputRef.current?.click();
          }}
          className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
          style={{
            backgroundColor: commentType === "video" ? "var(--accent-primary)" : "var(--bg-subtle)",
            color: commentType === "video" ? "white" : "var(--text-secondary)"
          }}
        >
          🎥 Video
        </button>
      </div>

      <input
        ref={mediaInputRef}
        type="file"
        accept={commentType === "photo" ? "image/*" : "video/*"}
        onChange={(e) => handleMediaPick(e, commentType)}
        className="hidden"
      />
    </div>
  );
}