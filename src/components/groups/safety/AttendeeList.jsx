import React, { useState } from "react";
import { Users, ChevronDown, ChevronUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}
const avatarColors = ["#7C69C4", "#D98B62", "#3C6E5A", "#E05C7A", "#4A7FC1", "#B07843"];
const getColor = (str) => avatarColors[(str || "").charCodeAt(0) % avatarColors.length];

function AttendeeChip({ email, showRealName }) {
  const { data: userData } = useQuery({
    queryKey: ["userProfile", email],
    queryFn: () => base44.entities.User.filter({ email }),
    select: d => d[0] || null,
    staleTime: 60000,
  });

  // Determine what name to show
  const name = userData
    ? (showRealName && userData.show_real_name_at_events
        ? userData.full_name?.split(" ")[0]
        : userData.display_name || userData.full_name)
    : email.split("@")[0];

  const color = getColor(name);
  const initials = getInitials(name);

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ backgroundColor: `${color}18`, border: `1px solid ${color}33`, color: "var(--text-secondary)" }}>
      <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0"
        style={{ backgroundColor: color }}>
        {initials}
      </div>
      {name}
    </div>
  );
}

export default function AttendeeList({ event }) {
  const [expanded, setExpanded] = useState(false);

  const goingCount = event.rsvp_yes?.length || 0;
  const interestedCount = event.rsvp_interested?.length || 0;

  if (goingCount === 0 && interestedCount === 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-hint)" }}>
        <Users className="w-3.5 h-3.5" />
        Be the first to RSVP!
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center gap-1.5 text-xs font-semibold mb-2"
        style={{ color: "var(--accent-primary)" }}>
        <Users className="w-3.5 h-3.5" />
        <span>{goingCount} going</span>
        {interestedCount > 0 && <span style={{ color: "var(--text-hint)", fontWeight: 400 }}>· {interestedCount} interested</span>}
        {expanded ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
      </button>

      {expanded && (
        <div className="space-y-2">
          {event.rsvp_yes?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-hint)" }}>
                ✅ Going ({goingCount})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {event.rsvp_yes.slice(0, 20).map(email => (
                  <AttendeeChip key={email} email={email} showRealName />
                ))}
                {event.rsvp_yes.length > 20 && (
                  <span className="px-2.5 py-1 rounded-full text-xs" style={{ color: "var(--text-hint)", backgroundColor: "var(--bg-subtle)" }}>
                    +{event.rsvp_yes.length - 20} more
                  </span>
                )}
              </div>
            </div>
          )}
          {event.rsvp_interested?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-hint)" }}>
                ⭐ Interested ({interestedCount})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {event.rsvp_interested.slice(0, 12).map(email => (
                  <AttendeeChip key={email} email={email} showRealName />
                ))}
                {event.rsvp_interested.length > 12 && (
                  <span className="px-2.5 py-1 rounded-full text-xs" style={{ color: "var(--text-hint)", backgroundColor: "var(--bg-subtle)" }}>
                    +{event.rsvp_interested.length - 12} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}