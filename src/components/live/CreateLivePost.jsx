import React, { useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { X, MapPin, Users, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import PlaceSearchInput from "../community/PlaceSearchInput";

const ACTIVITY_TYPES = [
  { key: "study", label: "Study", emoji: "📚" },
  { key: "sports", label: "Sports", emoji: "⚽" },
  { key: "coffee", label: "Coffee", emoji: "☕" },
  { key: "hangout", label: "Hangout", emoji: "🎉" },
  { key: "gaming", label: "Gaming", emoji: "🎮" },
  { key: "other", label: "Other", emoji: "✨" },
];

export default function CreateLivePost({ user, onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [activityType, setActivityType] = useState("");
  const [participantLimit, setParticipantLimit] = useState("");
  const [isAnon, setIsAnon] = useState(false);
  const [location, setLocation] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSaving(true);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const postData = {
      title: title.trim(),
      description: description.trim() || undefined,
      author_email: user?.email || "",
      author_name: user?.full_name || user?.username || "Anonymous",
      author_avatar_url: user?.avatar_url || "",
      is_anonymous: isAnon,
      activity_type: activityType || "other",
      participant_limit: participantLimit ? parseInt(participantLimit) : undefined,
      participants: [],
      location_name: location?.name || undefined,
      location_city: location?.city || undefined,
      location_lat: location?.lat || undefined,
      location_lng: location?.lng || undefined,
      expires_at: expiresAt.toISOString(),
      is_full: false,
    };

    await base44.entities.LivePost.create(postData);
    setSaving(false);
    onCreated?.();
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end lg:items-center lg:justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-lg mx-auto rounded-t-3xl lg:rounded-3xl overflow-hidden"
        style={{
          backgroundColor: "var(--bg-card)",
          maxHeight: "90vh",
          overflowY: "auto",
          color: "var(--text-primary)"
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: "var(--border-light)" }}>
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: "var(--font-serif)" }}>
            <Clock className="w-5 h-5" style={{ color: "var(--accent-primary)" }} />
            Create Live Post
          </h2>
          <button onClick={onClose}>
            <X className="w-5 h-5" style={{ color: "var(--text-hint)" }} />
          </button>
        </div>

        <div className="px-5 py-6 space-y-4">
          <div className="rounded-xl p-4" style={{ backgroundColor: "var(--accent-primary-light)", border: "1px solid var(--accent-primary)" }}>
            <p className="text-xs font-semibold flex items-center gap-2" style={{ color: "var(--accent-primary)" }}>
              <Clock className="w-3.5 h-3.5" />
              Temporary post • Expires in 24 hours
            </p>
            <p className="text-[11px] mt-1" style={{ color: "var(--text-secondary)" }}>
              Perfect for quick meetups, study sessions, or spontaneous activities
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
              What are you doing?
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Basketball at gym at 7pm, need 3 more players"
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
              Activity Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ACTIVITY_TYPES.map(type => (
                <button
                  key={type.key}
                  onClick={() => setActivityType(type.key)}
                  className="p-3 rounded-xl text-center transition-all active:scale-95"
                  style={{
                    backgroundColor: activityType === type.key ? "var(--accent-primary)" : "var(--bg-subtle)",
                    color: activityType === type.key ? "white" : "var(--text-primary)",
                    border: `1px solid ${activityType === type.key ? "var(--accent-primary)" : "var(--border-light)"}`
                  }}>
                  <p className="text-xl mb-1">{type.emoji}</p>
                  <p className="text-[11px] font-semibold">{type.label}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
              Details (optional)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details about your activity..."
              rows={3}
              maxLength={300}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
              <Users className="w-4 h-4" />
              Participant Limit (optional)
            </label>
            <Input
              type="number"
              value={participantLimit}
              onChange={(e) => setParticipantLimit(e.target.value)}
              placeholder="e.g. 4"
              min="1"
              max="50"
            />
            <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>
              Leave empty for unlimited participants
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
              <MapPin className="w-4 h-4" />
              Location (optional)
            </label>
            <PlaceSearchInput location={location} onLocation={setLocation} placeholder="Campus gym, library, coffee shop..." />
          </div>

          <div className="flex items-center justify-between py-2">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Post anonymously</p>
            <button
              onClick={() => setIsAnon(v => !v)}
              className="w-10 h-5 rounded-full transition-all relative"
              style={{ backgroundColor: isAnon ? "var(--accent-primary)" : "var(--border-medium)" }}>
              <div className="w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all" style={{ left: isAnon ? "calc(100% - 18px)" : "2px" }} />
            </button>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={saving || !title.trim()}
            className="w-full py-6 text-base font-bold"
            style={{ backgroundColor: "var(--accent-primary)" }}>
            {saving ? "Creating..." : "Post Live Activity"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}