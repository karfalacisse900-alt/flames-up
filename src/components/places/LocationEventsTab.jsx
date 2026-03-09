import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Calendar, MapPin, Users, CheckCircle, Star, Zap } from "lucide-react";
import { format } from "date-fns";

function EventMiniCard({ event, user }) {
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const qc = useQueryClient();

  const myRsvp = event.rsvp_yes?.includes(user?.email) ? "yes"
    : event.rsvp_interested?.includes(user?.email) ? "interested" : null;

  const toggleRsvp = async (type) => {
    if (!user || rsvpLoading) return;
    setRsvpLoading(true);
    const isYes = event.rsvp_yes?.includes(user.email);
    const isInt = event.rsvp_interested?.includes(user.email);
    const remove = (arr) => (arr || []).filter(e => e !== user.email);
    const add = (arr) => [...(arr || []), user.email];
    await base44.entities.GroupEvent.update(event.id, {
      rsvp_yes: type === "yes" ? (isYes ? remove(event.rsvp_yes) : add(remove(event.rsvp_yes))) : remove(event.rsvp_yes),
      rsvp_interested: type === "interested" ? (isInt ? remove(event.rsvp_interested) : add(remove(event.rsvp_interested))) : remove(event.rsvp_interested),
    });
    qc.invalidateQueries({ queryKey: ["locationEvents"] });
    setRsvpLoading(false);
  };

  const date = event.event_date ? new Date(event.event_date) : null;
  const isPast = date && date < new Date();

  return (
    <div className="p-4 rounded-2xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            {event.host_is_verified && (
              <span className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: "#E0F2FE", color: "#0369A1" }}>
                <CheckCircle className="w-2.5 h-2.5" /> Verified
              </span>
            )}
            {isPast && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>Past</span>
            )}
          </div>
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{event.title}</p>
          {event.group_name && (
            <p className="text-xs" style={{ color: "var(--text-hint)" }}>by {event.group_name}</p>
          )}
        </div>
        {event.host_avg_rating > 0 && (
          <div className="flex items-center gap-0.5 shrink-0">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>{event.host_avg_rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-xs mb-3" style={{ color: "var(--text-hint)" }}>
        {date && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {format(date, "MMM d, h:mm a")}
          </span>
        )}
        {event.location_name && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {event.location_name}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {event.rsvp_yes?.length || 0} going
        </span>
      </div>

      {!isPast && user && (
        <div className="flex gap-2">
          <button onClick={() => toggleRsvp("yes")} disabled={rsvpLoading}
            className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
            style={{
              backgroundColor: myRsvp === "yes" ? "var(--accent-primary)" : "var(--bg-subtle)",
              color: myRsvp === "yes" ? "#fff" : "var(--text-secondary)",
            }}>
            ✅ Going
          </button>
          <button onClick={() => toggleRsvp("interested")} disabled={rsvpLoading}
            className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
            style={{
              backgroundColor: myRsvp === "interested" ? "#FEF9C3" : "var(--bg-subtle)",
              color: myRsvp === "interested" ? "#92400E" : "var(--text-secondary)",
            }}>
            ⭐ Interested
          </button>
        </div>
      )}
    </div>
  );
}

export default function LocationEventsTab({ locationName, locationData, user, onCreateMeetup }) {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["locationEvents", locationName],
    queryFn: async () => {
      const all = await base44.entities.GroupEvent.list("-event_date", 100);
      const locLower = locationName.toLowerCase();
      const cityLower = (locationData?.city || "").toLowerCase();
      return all.filter(e =>
        (e.location_name && e.location_name.toLowerCase().includes(locLower)) ||
        (cityLower && e.location_address && e.location_address.toLowerCase().includes(cityLower)) ||
        (e.group_name && locLower && false) // group_id match would need separate query
      ).sort((a, b) => new Date(b.event_date) - new Date(a.event_date));
    },
    enabled: !!locationName,
  });

  const upcoming = events.filter(e => new Date(e.event_date) >= new Date());
  const past = events.filter(e => new Date(e.event_date) < new Date());

  return (
    <div className="p-4 pb-28 space-y-3">
      {/* Meetup invite button */}
      {user && (
        <button onClick={onCreateMeetup}
          className="w-full flex items-center gap-2 px-4 py-3.5 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.99]"
          style={{ background: "linear-gradient(135deg, #2E6B4F, #4CAF7D)", boxShadow: "0 4px 16px rgba(46,107,79,0.2)" }}>
          <Zap className="w-4 h-4" />
          Invite people here → Spontaneous Meetup
        </button>
      )}

      {isLoading ? (
        <div className="py-8 text-center text-sm" style={{ color: "var(--text-hint)" }}>Loading events…</div>
      ) : events.length === 0 ? (
        <div className="py-12 text-center">
          <Calendar className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-hint)" }} />
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>No events here yet</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>Create a group event and tag this location!</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <p className="text-xs font-bold mb-2" style={{ color: "var(--text-secondary)" }}>UPCOMING</p>
              <div className="space-y-3">
                {upcoming.map(e => <EventMiniCard key={e.id} event={e} user={user} />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-bold mb-2" style={{ color: "var(--text-hint)" }}>PAST EVENTS</p>
              <div className="space-y-3">
                {past.slice(0, 5).map(e => <EventMiniCard key={e.id} event={e} user={user} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}