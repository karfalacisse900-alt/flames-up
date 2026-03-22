import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Play, Pause } from "lucide-react";

// Group status = a short-lived post (24h) attached to a group, visible only on Groups page

const COLORS = ["#7C3AED", "#0F766E", "#E53935", "#D97706", "#1D4ED8", "#DB2777"];
const avatarColor = (email) => COLORS[(email || "a").charCodeAt(0) % COLORS.length];

function StatusViewer({ statuses, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex || 0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const status = statuses[idx];

  React.useEffect(() => {
    setProgress(0);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(timerRef.current);
          if (idx < statuses.length - 1) setIdx(i => i + 1);
          else onClose();
          return 0;
        }
        return p + 2;
      });
    }, 100);
    return () => clearInterval(timerRef.current);
  }, [idx]);

  if (!status) return null;

  return (
    <div className="fixed inset-0 z-[300] flex flex-col" style={{ background: "#000" }} onClick={onClose}>
      {/* Progress bars */}
      <div className="flex gap-1 px-3 pt-3 pb-2 z-10" style={{ paddingTop: "max(env(safe-area-inset-top,0px),12px)" }}>
        {statuses.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.3)" }}>
            <div className="h-full rounded-full bg-white transition-none"
              style={{ width: i < idx ? "100%" : i === idx ? `${progress}%` : "0%" }} />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pb-2" onClick={e => e.stopPropagation()}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
          style={{ background: `linear-gradient(135deg, ${avatarColor(status.author_email)}, #7C3AED)`, color: "#fff" }}>
          {(status.author_name || "?")[0].toUpperCase()}
        </div>
        <div>
          <p className="text-white font-semibold text-sm">{status.author_name || "Someone"}</p>
          <p className="text-white/50 text-[11px]">{status.group_name}</p>
        </div>
        <button className="ml-auto p-2" onClick={onClose}>
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6" onClick={e => e.stopPropagation()}>
        {status.media_url ? (
          <img src={status.media_url} alt="" className="max-w-full max-h-full rounded-2xl object-contain" />
        ) : (
          <div className="w-full rounded-3xl p-8 text-center"
            style={{ background: `linear-gradient(135deg, ${avatarColor(status.author_email)}, #1e1b4b)` }}>
            <p className="text-white text-xl font-bold leading-relaxed" style={{ fontFamily: "var(--font-serif)" }}>
              {status.text}
            </p>
          </div>
        )}
      </div>

      {/* Tap zones */}
      <div className="absolute inset-0 flex z-0" style={{ pointerEvents: "none" }}>
        <div style={{ flex: 1, pointerEvents: "auto" }} onClick={e => { e.stopPropagation(); setIdx(i => Math.max(0, i - 1)); }} />
        <div style={{ flex: 1, pointerEvents: "auto" }} onClick={e => { e.stopPropagation(); if (idx < statuses.length - 1) setIdx(i => i + 1); else onClose(); }} />
      </div>
    </div>
  );
}

export default function GroupStatusBar({ user, groups, membershipMap }) {
  const [uploading, setUploading] = useState(false);
  const [viewerData, setViewerData] = useState(null);
  const [showCreateFor, setShowCreateFor] = useState(null);
  const [statusText, setStatusText] = useState("");
  const fileRef = useRef(null);
  const qc = useQueryClient();

  // Fetch recent group statuses (last 24h)
  const myGroupIds = groups.filter(g => membershipMap[g.id]).map(g => g.id);

  const { data: allStatuses = [] } = useQuery({
    queryKey: ["groupStatuses"],
    queryFn: async () => {
      if (!myGroupIds.length) return [];
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      // Fetch statuses for each group (simplified: fetch all recent ones)
      const results = await base44.entities.LivePost.filter({}, "-created_date", 100);
      return results.filter(s => s.type === "group_status" && myGroupIds.includes(s.group_id) && s.created_date > since);
    },
    enabled: !!user?.email && myGroupIds.length > 0,
    refetchInterval: 30000,
  });

  // Group statuses by group
  const statusByGroup = {};
  allStatuses.forEach(s => {
    if (!statusByGroup[s.group_id]) statusByGroup[s.group_id] = [];
    statusByGroup[s.group_id].push(s);
  });

  const myGroupsWithStatus = groups.filter(g => membershipMap[g.id]);
  const isOwner = (group) => group.created_by === user?.email || membershipMap[group.id]?.role === "admin";

  const handleCreateStatus = async (group, mediaUrl = null) => {
    if (!statusText.trim() && !mediaUrl) return;
    setUploading(true);
    await base44.entities.LivePost.create({
      type: "group_status",
      group_id: group.id,
      group_name: group.name,
      author_email: user.email,
      author_name: user.full_name || user.email,
      text: statusText,
      media_url: mediaUrl || null,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
    setStatusText("");
    setShowCreateFor(null);
    setUploading(false);
    qc.invalidateQueries({ queryKey: ["groupStatuses"] });
  };

  const handleFileUpload = async (file, group) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await handleCreateStatus(group, file_url);
    setUploading(false);
  };

  if (myGroupsWithStatus.length === 0) return null;

  return (
    <>
      <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide py-3">
        {myGroupsWithStatus.map(group => {
          const statuses = statusByGroup[group.id] || [];
          const hasStatus = statuses.length > 0;
          const canPost = isOwner(group);

          return (
            <div key={group.id} className="flex flex-col items-center gap-1.5 shrink-0" style={{ width: 64 }}>
              <button
                onClick={() => hasStatus ? setViewerData({ statuses, startIndex: 0 }) : canPost ? setShowCreateFor(group) : null}
                className="relative w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-xl font-bold"
                style={{
                  background: hasStatus ? "transparent" : "linear-gradient(135deg, #1e1b4b, #312e81)",
                  border: hasStatus ? "2.5px solid #7C3AED" : "2.5px solid rgba(255,255,255,0.1)",
                  boxShadow: hasStatus ? "0 0 0 1px rgba(124,58,237,0.3)" : "none",
                }}>
                {group.logo_url ? (
                  <img src={group.logo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span>{group.emoji || "💬"}</span>
                )}
                {canPost && !hasStatus && (
                  <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "#7C3AED", border: "1.5px solid #fff" }}>
                    <Plus className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </button>
              <p className="text-[10px] font-medium truncate text-center w-full" style={{ color: "var(--text-secondary)" }}>
                {group.name.split(" ")[0]}
              </p>
            </div>
          );
        })}
      </div>

      {/* Create status sheet */}
      {showCreateFor && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowCreateFor(null)}>
          <div className="w-full rounded-t-3xl p-5" style={{ backgroundColor: "var(--bg-card)" }}
            onClick={e => e.stopPropagation()}>
            <p className="font-bold text-base mb-3" style={{ fontFamily: "var(--font-serif)" }}>
              Post status for <span style={{ color: "var(--accent-primary)" }}>{showCreateFor.name}</span>
            </p>
            <textarea
              value={statusText}
              onChange={e => setStatusText(e.target.value)}
              placeholder="What's happening in your group?"
              rows={3}
              className="w-full rounded-2xl px-4 py-3 text-sm resize-none outline-none mb-3"
              style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", border: "1px solid var(--border-light)" }}
            />
            <div className="flex gap-2">
              <button onClick={() => fileRef.current?.click()}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold"
                style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
                📷 Add Photo
              </button>
              <button onClick={() => handleCreateStatus(showCreateFor)}
                disabled={uploading || !statusText.trim()}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-white"
                style={{ backgroundColor: "var(--accent-primary)", opacity: uploading ? 0.6 : 1 }}>
                {uploading ? "Posting…" : "Post Status"}
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, showCreateFor); }} />
          </div>
        </div>
      )}

      {/* Status viewer */}
      {viewerData && (
        <StatusViewer
          statuses={viewerData.statuses}
          startIndex={viewerData.startIndex}
          onClose={() => setViewerData(null)}
        />
      )}
    </>
  );
}