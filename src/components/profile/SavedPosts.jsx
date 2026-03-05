import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { FolderOpen, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function SavedPosts({ user }) {
  const [activeFolder, setActiveFolder] = useState(null);

  const { data: saved = [] } = useQuery({
    queryKey: ["savedPosts", user?.email],
    queryFn: () => base44.entities.SavedPost.filter({ user_email: user.email }, "-created_date"),
    enabled: !!user?.email,
  });

  const folders = [...new Set(saved.map(s => s.folder || "Saved"))];
  const filtered = activeFolder ? saved.filter(s => (s.folder || "Saved") === activeFolder) : saved;

  if (saved.length === 0) {
    return (
      <div className="text-center py-10">
        <FolderOpen className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-hint)" }} />
        <p className="text-sm" style={{ color: "var(--text-hint)" }}>No saved posts yet</p>
        <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>Tap the bookmark icon on any post to save it</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Folder filters */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        <button
          onClick={() => setActiveFolder(null)}
          className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 border transition-all"
          style={{
            backgroundColor: !activeFolder ? "var(--accent-primary)" : "transparent",
            color: !activeFolder ? "#fff" : "var(--text-secondary)",
            borderColor: !activeFolder ? "var(--accent-primary)" : "var(--border-light)",
          }}>
          All ({saved.length})
        </button>
        {folders.map(f => (
          <button key={f}
            onClick={() => setActiveFolder(f === activeFolder ? null : f)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 border transition-all"
            style={{
              backgroundColor: activeFolder === f ? "var(--accent-primary)" : "transparent",
              color: activeFolder === f ? "#fff" : "var(--text-secondary)",
              borderColor: activeFolder === f ? "var(--accent-primary)" : "var(--border-light)",
            }}>
            📁 {f} ({saved.filter(s => (s.folder || "Saved") === f).length})
          </button>
        ))}
      </div>

      {/* Post list */}
      {filtered.map(s => (
        <Link key={s.id} to={createPageUrl(`PostComments?postId=${s.post_id}`)}>
          <div className="flex items-start gap-3 p-3 rounded-2xl"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
            <MessageCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--accent-primary)" }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm line-clamp-2" style={{ color: "var(--text-primary)" }}>{s.post_preview || "View post"}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 rounded-full capitalize"
                  style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>{s.post_type || "post"}</span>
                <span className="text-xs" style={{ color: "var(--text-hint)" }}>📁 {s.folder || "Saved"}</span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}