import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, VolumeX, Ban, Filter, X, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function HostModerationPanel({ room, onRoomUpdated }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("users");
  const [newKeyword, setNewKeyword] = useState("");

  const mutedUsers = room?.muted_users || [];
  const bannedUsers = room?.banned_users || [];
  const keywordFilters = room?.keyword_filters || [];

  const unmuteUser = async (email) => {
    const updated = mutedUsers.filter((e) => e !== email);
    await base44.entities.LiveRoom.update(room.id, { muted_users: updated });
    onRoomUpdated();
  };

  const unbanUser = async (email) => {
    const updated = bannedUsers.filter((e) => e !== email);
    await base44.entities.LiveRoom.update(room.id, { banned_users: updated });
    onRoomUpdated();
  };

  const addKeyword = async () => {
    const word = newKeyword.trim().toLowerCase();
    if (!word || keywordFilters.includes(word)) return;
    await base44.entities.LiveRoom.update(room.id, { keyword_filters: [...keywordFilters, word] });
    setNewKeyword("");
    onRoomUpdated();
  };

  const removeKeyword = async (word) => {
    await base44.entities.LiveRoom.update(room.id, { keyword_filters: keywordFilters.filter((w) => w !== word) });
    onRoomUpdated();
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
        style={{ backgroundColor: "var(--bg-subtle)", color: "var(--accent-primary)", border: "1px solid var(--border-light)" }}
      >
        <Shield className="w-3.5 h-3.5" /> Mod
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
            <motion.div
              className="relative w-full max-w-lg rounded-t-3xl"
              style={{ backgroundColor: "var(--bg-card)", maxHeight: "70dvh", overflowY: "auto" }}
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
            >
              <div className="px-5 pt-5 pb-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-light)" }}>
                <h3 className="font-semibold flex items-center gap-2" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
                  <Shield className="w-4 h-4" style={{ color: "var(--accent-primary)" }} /> Moderation
                </h3>
                <button onClick={() => setOpen(false)} className="p-1 rounded-full" style={{ color: "var(--text-hint)" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex px-5 pt-3 gap-2">
                {[["users", "Users"], ["keywords", "Keywords"]].map(([val, label]) => (
                  <button key={val} onClick={() => setTab(val)}
                    className="px-4 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={{
                      backgroundColor: tab === val ? "var(--accent-primary)" : "var(--bg-subtle)",
                      color: tab === val ? "#fff" : "var(--text-secondary)",
                    }}>
                    {label}
                  </button>
                ))}
              </div>

              <div className="p-5 space-y-4">
                {tab === "users" && (
                  <>
                    {mutedUsers.length === 0 && bannedUsers.length === 0 ? (
                      <p className="text-sm text-center py-4" style={{ color: "var(--text-hint)" }}>No muted or banned users. Mute/ban from chat messages.</p>
                    ) : null}

                    {mutedUsers.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
                          <VolumeX className="w-3.5 h-3.5" /> Muted
                        </p>
                        <div className="space-y-2">
                          {mutedUsers.map((email) => (
                            <div key={email} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
                              <span className="text-sm truncate" style={{ color: "var(--text-primary)" }}>{email}</span>
                              <button onClick={() => unmuteUser(email)} className="text-xs px-2 py-1 rounded-lg ml-2 shrink-0" style={{ color: "var(--accent-primary)", backgroundColor: "var(--accent-primary-light)" }}>Unmute</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {bannedUsers.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
                          <Ban className="w-3.5 h-3.5" /> Banned
                        </p>
                        <div className="space-y-2">
                          {bannedUsers.map((email) => (
                            <div key={email} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
                              <span className="text-sm truncate" style={{ color: "var(--text-primary)" }}>{email}</span>
                              <button onClick={() => unbanUser(email)} className="text-xs px-2 py-1 rounded-lg ml-2 shrink-0" style={{ color: "#E05C5C", backgroundColor: "rgba(224,92,92,0.08)" }}>Unban</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {tab === "keywords" && (
                  <div>
                    <p className="text-xs mb-3" style={{ color: "var(--text-hint)" }}>Messages containing these words will be auto-blocked.</p>
                    <div className="flex gap-2 mb-3">
                      <Input
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        placeholder="Add keyword..."
                        className="rounded-xl flex-1 text-sm"
                        onKeyDown={(e) => e.key === "Enter" && addKeyword()}
                      />
                      <Button onClick={addKeyword} size="icon" className="rounded-xl shrink-0">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {keywordFilters.length === 0 ? (
                      <p className="text-sm text-center py-4" style={{ color: "var(--text-hint)" }}>No keyword filters yet</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {keywordFilters.map((word) => (
                          <span key={word} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", border: "1px solid var(--border-light)" }}>
                            {word}
                            <button onClick={() => removeKeyword(word)} style={{ color: "var(--text-hint)" }}><X className="w-3 h-3" /></button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}