import React, { useState, useEffect, useCallback } from "react";
import { ArrowLeft, MapPin, Calendar, Clock, Bookmark, Users, Zap, Loader2, Star } from "lucide-react";
import { base44 } from "@/api/base44Client";

function EventCard({ event, onSelect }) {
  const [saved, setSaved] = useState(false);
  const photos = event.photos || [];

  return (
    <div
      className="rounded-3xl overflow-hidden mb-5"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "var(--elevation-2)" }}
    >
      {/* Photo collage */}
      <button className="w-full relative" style={{ minHeight: "unset", minWidth: "unset", background: "none", border: "none", padding: 0 }} onClick={() => onSelect(event)}>
        {photos.length >= 4 ? (
          <div className="grid grid-cols-2 gap-0.5" style={{ height: 220 }}>
            <div className="row-span-2 relative overflow-hidden">
              <img src={photos[0]} alt="" className="w-full h-full object-cover" />
              {event.isFree && (
                <span className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: "#16A34A", color: "#fff" }}>Free</span>
              )}
            </div>
            <div className="relative overflow-hidden">
              <img src={photos[1]} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="relative overflow-hidden">
              <img src={photos[2]} alt="" className="w-full h-full object-cover" />
              <span className="absolute bottom-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "#fff" }}>
                {event.neighborhood}
              </span>
            </div>
          </div>
        ) : photos.length > 0 ? (
          <div className="relative overflow-hidden" style={{ height: 200 }}>
            <img src={photos[0]} alt={event.name} className="w-full h-full object-cover" />
            {event.isFree && (
              <span className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: "#16A34A", color: "#fff" }}>Free</span>
            )}
            <span className="absolute bottom-3 right-3 text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "#fff" }}>
              {event.neighborhood}
            </span>
          </div>
        ) : (
          <div className="w-full flex items-center justify-center text-5xl" style={{ height: 160, backgroundColor: "var(--bg-subtle)" }}>
            🎉
          </div>
        )}
      </button>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <button onClick={() => onSelect(event)} className="text-left" style={{ minHeight: "unset", minWidth: "unset", background: "none", border: "none", padding: 0 }}>
            <h3 className="text-lg font-bold leading-tight" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>{event.name}</h3>
          </button>
          <div className="flex items-center gap-1 shrink-0">
            {event.user_ratings_total && (
              <span className="text-xs flex items-center gap-0.5" style={{ color: "var(--text-hint)" }}>
                <Users className="w-3 h-3" />{event.user_ratings_total > 1000 ? (event.user_ratings_total/1000).toFixed(1)+"k" : event.user_ratings_total}
              </span>
            )}
          </div>
        </div>

        {event.description && (
          <p className="text-sm leading-relaxed mb-3 line-clamp-2" style={{ color: "var(--text-secondary)" }}>{event.description}</p>
        )}

        <div className="space-y-1.5 mb-3">
          {event.address && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--accent-secondary)" }} />
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{event.neighborhood}</span>
            </div>
          )}
          {event.rating && (
            <div className="flex items-center gap-2">
              <Star className="w-3.5 h-3.5 shrink-0" style={{ color: "#F59E0B", fill: "#F59E0B" }} />
              <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>{event.rating} · {event.user_ratings_total?.toLocaleString()} ratings</span>
            </div>
          )}
          {event.open_now !== undefined && (
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--accent-secondary)" }} />
              <span className="text-xs font-semibold" style={{ color: event.open_now ? "#16A34A" : "#DC2626" }}>
                {event.open_now ? "Open now" : "Currently closed"}
              </span>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {event.tags.map((tag, i) => (
            <span key={i} className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}>
              {tag}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-3" style={{ borderTop: "1px solid var(--border-light)" }}>
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(event.name + " " + event.address)}`}
            target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-bold"
            style={{ backgroundColor: "var(--accent-primary)", color: "#fff" }}>
            <Zap className="w-4 h-4" />
            RSVP / Visit
          </a>
          <button
            onClick={() => setSaved(v => !v)}
            className="w-10 h-10 flex items-center justify-center rounded-2xl shrink-0"
            style={{ backgroundColor: saved ? "var(--accent-primary-light)" : "var(--bg-subtle)", border: "1px solid var(--border-light)", minHeight: "unset", minWidth: "unset" }}>
            <Bookmark className="w-4 h-4" style={{ color: saved ? "var(--accent-primary)" : "var(--text-secondary)", fill: saved ? "var(--accent-primary)" : "none" }} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NearbyEventsPage({ coords, locationName, onClose, onSelectEvent }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [neighborhoods, setNeighborhoods] = useState(["All"]);
  const [activeNeighborhood, setActiveNeighborhood] = useState("All");
  const [city, setCity] = useState(locationName || "your city");

  useEffect(() => {
    setLoading(true);
    base44.functions.invoke("nearbyEvents", {
      lat: coords?.lat,
      lng: coords?.lng,
      city: locationName || "New York City",
    }).then(res => {
      if (res.data?.events) {
        setEvents(res.data.events);
        setNeighborhoods(res.data.neighborhoods || ["All"]);
        setCity(res.data.city || locationName || "your city");
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [coords, locationName]);

  const filtered = activeNeighborhood === "All"
    ? events
    : events.filter(e => e.neighborhood === activeNeighborhood);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="sticky top-0 z-30"
        style={{ backgroundColor: "var(--bg-app)", borderBottom: "1px solid var(--border-light)", paddingTop: "max(env(safe-area-inset-top,12px),12px)" }}>
        <div className="flex items-center gap-3 px-4 pb-2">
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full shrink-0"
            style={{ backgroundColor: "var(--bg-subtle)", minHeight: "unset", minWidth: "unset" }}>
            <ArrowLeft className="w-5 h-5" style={{ color: "var(--text-primary)" }} />
          </button>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>Events & Activities</h1>
              {!loading && (
                <div className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
                  <Zap className="w-3 h-3" />{filtered.length} events
                </div>
              )}
            </div>
            <p className="text-xs" style={{ color: "var(--text-hint)" }}>Things to do across {city} 🗽</p>
          </div>
        </div>

        {/* Neighborhood pills */}
        {neighborhoods.length > 1 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-3">
            {neighborhoods.map(n => (
              <button key={n} onClick={() => setActiveNeighborhood(n)}
                className="px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap shrink-0"
                style={{
                  backgroundColor: activeNeighborhood === n ? "var(--accent-primary)" : "var(--bg-card)",
                  color: activeNeighborhood === n ? "#fff" : "var(--text-secondary)",
                  border: `1px solid ${activeNeighborhood === n ? "transparent" : "var(--border-light)"}`,
                  minHeight: "unset", minWidth: "unset",
                }}>
                {n}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 pt-4 pb-28">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-24">
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: "var(--accent-primary)" }} />
            <p className="text-sm" style={{ color: "var(--text-hint)" }}>Finding events near you…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <div className="text-5xl">🎉</div>
            <p className="text-base font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>No events found</p>
            <p className="text-sm" style={{ color: "var(--text-hint)" }}>Try a different neighborhood filter</p>
          </div>
        ) : (
          filtered.map(event => (
            <EventCard key={event.id} event={event} onSelect={onSelectEvent} />
          ))
        )}
      </div>
    </div>
  );
}