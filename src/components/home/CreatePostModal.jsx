import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { base44 } from "@/api/base44Client";

const postTypes = [
  { value: "question", label: "Question", emoji: "❓" },
  { value: "quote", label: "Quote", emoji: "💭" },
  { value: "concern", label: "Concern", emoji: "🫂" },
];

export default function CreatePostModal({ open, onClose, onCreated, user }) {
  const [type, setType] = useState("question");
  const [text, setText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    await base44.entities.Post.create({
      type, text: text.trim(), is_anonymous: isAnonymous,
      author_name: isAnonymous ? "Anonymous" : (user?.full_name || "User"),
      author_email: user?.email || "", like_count: 0, reply_count: 0, liked_by: [],
    });
    setText(""); setType("question"); setIsAnonymous(false);
    setLoading(false); onCreated(); onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <motion.div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="relative w-full max-w-lg bg-white rounded-t-3xl"
        style={{ maxHeight: "90dvh", overflowY: "auto" }}
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#EDE9E3]" />
        </div>

        <div className="px-5 pb-6 pt-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-serif)" }}>Create Post</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Type selector */}
          <div className="flex gap-2 mb-4">
            {postTypes.map((pt) => (
              <button
                key={pt.value}
                onClick={() => setType(pt.value)}
                className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                  type === pt.value ? "border-[#7C8C6E] bg-[#7C8C6E]/5" : "border-[#EDE9E3]"
                }`}
              >
                <span className="text-xl">{pt.emoji}</span>
                <span className="text-xs font-medium">{pt.label}</span>
              </button>
            ))}
          </div>

          <Textarea
            placeholder={
              type === "question" ? "What's on your mind?" :
              type === "quote" ? "Share a thought or quote..." : "What concerns you?"
            }
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[120px] border-[#EDE9E3] rounded-xl text-base resize-none"
            style={{ fontFamily: "var(--font-serif)" }}
          />

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-3">
              <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
              <div className="flex items-center gap-1.5 text-sm text-[#6B6B6B]">
                {isAnonymous ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {isAnonymous ? "Anonymous" : "Public"}
              </div>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!text.trim() || loading}
              className="bg-[#7C8C6E] hover:bg-[#6B7B5E] text-white rounded-xl px-6"
            >
              {loading ? "Posting..." : "Post"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}