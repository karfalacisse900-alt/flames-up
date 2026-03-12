import React from "react";
import { Users, DollarSign, ChevronRight } from "lucide-react";

export default function GroupPreviewCard({ group, onOpen }) {
  return (
    <div
      onClick={() => onOpen(group)}
      className="cursor-pointer rounded-2xl overflow-hidden active:scale-95 transition-transform"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
      
      <div className="relative h-40 overflow-hidden" style={{ backgroundColor: "var(--bg-subtle)" }}>
        {group.preview_video_url ? (
          <video
            src={group.preview_video_url}
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
        ) : group.cover_image_url ? (
          <img src={group.cover_image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">{group.emoji || "💬"}</div>
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)" }} />
        
        {group.is_paid && (
          <div className="absolute top-2 right-2 px-2 py-1 rounded-lg flex items-center gap-1 text-xs font-bold text-white" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
            <DollarSign className="w-3 h-3" /> ${group.monthly_fee}/mo
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="font-bold text-sm line-clamp-1" style={{ color: "var(--text-primary)" }}>{group.group_name}</h3>
        <p className="text-xs line-clamp-1 mt-0.5" style={{ color: "var(--text-hint)" }}>{group.description || "No description"}</p>
        
        <div className="flex items-center justify-between mt-2.5 pt-2.5" style={{ borderTop: "1px solid var(--border-light)" }}>
          <div className="flex items-center gap-1 text-[11px]" style={{ color: "var(--text-hint)" }}>
            <Users className="w-3 h-3" />
            <span>{(group.member_count || 0).toLocaleString()}</span>
          </div>
          <ChevronRight className="w-4 h-4" style={{ color: "var(--text-hint)" }} />
        </div>
      </div>
    </div>
  );
}