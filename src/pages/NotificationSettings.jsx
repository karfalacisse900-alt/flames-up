import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Bell, Heart, MessageSquare, UserPlus, Zap, AtSign } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";

const NOTIFICATION_PREFS = [
  { key: "new_follower", icon: UserPlus, label: "New Followers", desc: "When someone follows you", color: "#3C6E5A" },
  { key: "post_liked", icon: Heart, label: "Post Likes", desc: "When someone likes your post", color: "#E05C7A" },
  { key: "post_replied", icon: MessageSquare, label: "Comments & Replies", desc: "When someone replies to your post", color: "#5579A6" },
  { key: "mention", icon: AtSign, label: "Mentions", desc: "When someone mentions you", color: "#8B5CF6" },
  { key: "direct_message", icon: MessageSquare, label: "Direct Messages", desc: "When you receive a new DM", color: "#F59E0B" },
  { key: "post_boosted", icon: Zap, label: "Boosts", desc: "When your post gets boosted", color: "#F59E0B" },
];

export default function NotificationSettings() {
  const [user, setUser] = useState(null);
  const [prefs, setPrefs] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      const defaults = {};
      NOTIFICATION_PREFS.forEach(p => { defaults[p.key] = true; });
      setPrefs({ ...defaults, ...(u?.notification_prefs || {}) });
    }).catch(() => {});
  }, []);

  const toggle = (key) => setPrefs(prev => ({ ...prev, [key]: !prev[key] }));

  const handleSave = async () => {
    await base44.auth.updateMe({ notification_prefs: prefs });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "var(--bg-app)" }}>
      <div className="px-5 pt-5 pb-4 flex items-center gap-3" style={{ backgroundColor: "var(--bg-nav)", borderBottom: "1px solid var(--border-light)" }}>
        <Link to={createPageUrl("Notifications")} className="p-2 rounded-full" style={{ backgroundColor: "var(--bg-app)", color: "var(--text-secondary)" }}>
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Notification Settings</h1>
          <p className="text-xs" style={{ color: "var(--text-hint)" }}>Choose what you want to be notified about</p>
        </div>
      </div>

      <div className="px-5 py-4 space-y-3">
        {NOTIFICATION_PREFS.map(({ key, icon: Icon, label, desc, color }) => (
          <div
            key={key}
            className="flex items-center justify-between p-4 rounded-2xl"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}18` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{label}</p>
                <p className="text-xs" style={{ color: "var(--text-hint)" }}>{desc}</p>
              </div>
            </div>
            <button
              onClick={() => toggle(key)}
              className="relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0"
              style={{ backgroundColor: prefs[key] ? "#3C6E5A" : "var(--bg-subtle)", border: "1px solid var(--border-light)" }}
            >
              <span
                className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
                style={{ transform: prefs[key] ? "translateX(20px)" : "translateX(0)" }}
              />
            </button>
          </div>
        ))}
      </div>

      <div className="px-5 mt-2">
        <Button onClick={handleSave} className="w-full rounded-2xl" style={{ backgroundColor: "#3C6E5A" }}>
          {saved ? "✓ Saved!" : "Save Preferences"}
        </Button>
      </div>
    </div>
  );
}