import React, { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, Bookmark, BookmarkCheck, Users, Clock, Zap } from "lucide-react";

const EVENTS = [
  {
    id: 1,
    title: "Union Square Greenmarket",
    type: "🥕 Farmers Market",
    borough: "Manhattan",
    neighborhood: "Union Square",
    address: "E 17th St & Union Square W, Manhattan",
    schedule: "Every Mon, Wed, Fri & Sat",
    time: "8am – 6pm",
    cost: "Free",
    image: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=400&h=250&fit=crop",
    tags: ["Farmers Market", "Food", "Weekly"],
    description: "One of NYC's largest greenmarkets. Over 140 regional farmers, fishers, and bakers selling fresh produce, cheese, bread, and flowers.",
    attendees: 340,
  },
  {
    id: 2,
    title: "SummerStage: Free Outdoor Concert",
    type: "🎵 Live Music",
    borough: "Manhattan",
    neighborhood: "Central Park",
    address: "Rumsey Playfield, Central Park",
    schedule: "Weekends Jun–Aug",
    time: "3pm – 7pm",
    cost: "Free",
    image: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400&h=250&fit=crop",
    tags: ["Music", "Outdoor", "Free"],
    description: "NYC Parks' beloved free outdoor performing arts festival. Local and international artists performing concerts, dance, and theater.",
    attendees: 1200,
  },
  {
    id: 3,
    title: "Brooklyn Night Bazaar",
    type: "🛍️ Night Market",
    borough: "Brooklyn",
    neighborhood: "Greenpoint",
    address: "165 Banker St, Brooklyn",
    schedule: "Every Fri & Sat",
    time: "6pm – 12am",
    cost: "Free",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=250&fit=crop",
    tags: ["Market", "Art", "Nightlife"],
    description: "A massive indoor night market with 100+ vendors selling vintage clothing, art, handmade goods, street food, and live music on two stages.",
    attendees: 560,
  },
  {
    id: 4,
    title: "Bronx Culture Trolley",
    type: "🎨 Arts Walk",
    borough: "The Bronx",
    neighborhood: "South Bronx",
    address: "Starts at Third Ave & 140th St",
    schedule: "1st Fri of each month",
    time: "5pm – 9pm",
    cost: "Free",
    image: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=400&h=250&fit=crop",
    tags: ["Art", "Culture", "Free"],
    description: "Free trolley connecting galleries, studios, and cultural spaces across the South Bronx arts district. Meet local artists and see works in progress.",
    attendees: 180,
  },
  {
    id: 5,
    title: "Queens Night Market",
    type: "🍜 Food Market",
    borough: "Queens",
    neighborhood: "Flushing Meadows",
    address: "Flushing Meadows Corona Park",
    schedule: "Saturdays May–Oct",
    time: "5pm – 11pm",
    cost: "Free entry",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=250&fit=crop",
    tags: ["Food", "Cultural", "Outdoors"],
    description: "The world's most diverse food market — 80+ vendors from 80+ countries, all dishes under $6. A true celebration of Queens' incredible immigrant food culture.",
    attendees: 2100,
  },
  {
    id: 6,
    title: "Free Yoga in Prospect Park",
    type: "🧘 Wellness",
    borough: "Brooklyn",
    neighborhood: "Prospect Park",
    address: "Long Meadow, Prospect Park",
    schedule: "Every Sun morning",
    time: "9am – 10:30am",
    cost: "Free",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=250&fit=crop",
    tags: ["Wellness", "Outdoors", "Free"],
    description: "Community yoga sessions on the Long Meadow grass — all levels welcome. Bring your own mat. Organized by local instructors as a gift to the community.",
    attendees: 90,
  },
  {
    id: 7,
    title: "Staten Island Ferry Flea",
    type: "🛍️ Flea Market",
    borough: "Staten Island",
    neighborhood: "St. George",
    address: "1 Bay St, Staten Island",
    schedule: "Every weekend",
    time: "10am – 5pm",
    cost: "Free",
    image: "https://images.unsplash.com/photo-1472653431158-6364773b2a56?w=400&h=250&fit=crop",
    tags: ["Shopping", "Vintage", "Community"],
    description: "Flea market right at the ferry terminal — vintage goods, handmade crafts, local art. Great combo with the free ferry ride and harbor views.",
    attendees: 210,
  },
  {
    id: 8,
    title: "NYC Cultural Workshop Series",
    type: "🎭 Workshop",
    borough: "Manhattan",
    neighborhood: "Harlem",
    address: "Apollo Theater, 253 W 125th St",
    schedule: "Every other Saturday",
    time: "2pm – 5pm",
    cost: "Free",
    image: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=400&h=250&fit=crop",
    tags: ["Workshop", "Culture", "Free"],
    description: "Free workshops on photography, spoken word, dance, and visual art led by professional Harlem-based artists. Open to all ages and skill levels.",
    attendees: 75,
  },
  {
    id: 9,
    title: "Hip-Hop Heritage Walk",
    type: "🎤 Guided Tour",
    borough: "The Bronx",
    neighborhood: "South Bronx",
    address: "1520 Sedgwick Ave, Bronx",
    schedule: "Every Saturday",
    time: "12pm – 2pm",
    cost: "Free",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=250&fit=crop",
    tags: ["Hip-Hop", "History", "Culture"],
    description: "Walk the birthplace of hip-hop with community guides who lived through it. Visit 1520 Sedgwick, Crotona Park, and hear real stories from real people.",
    attendees: 60,
  },
  {
    id: 10,
    title: "Smorgasburg Brooklyn",
    type: "🍔 Food Festival",
    borough: "Brooklyn",
    neighborhood: "Williamsburg",
    address: "East River State Park, Brooklyn",
    schedule: "Every Saturday Apr–Oct",
    time: "11am – 6pm",
    cost: "Free entry",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=250&fit=crop",
    tags: ["Food", "Festival", "Outdoor"],
    description: "100+ local food vendors with NYC skyline views. The original open-air food market that launched a movement. Iconic eats from ramen burgers to lobster rolls.",
    attendees: 3000,
  },
  {
    id: 11,
    title: "Bryant Park Movie Nights",
    type: "🎬 Outdoor Cinema",
    borough: "Manhattan",
    neighborhood: "Midtown",
    address: "Bryant Park, 6th Ave & 42nd St",
    schedule: "Every Mon Jun–Aug",
    time: "Dusk (~8:30pm)",
    cost: "Free",
    image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=250&fit=crop",
    tags: ["Movies", "Outdoor", "Free"],
    description: "Classic films screened outdoors in the heart of Manhattan. Bring a blanket, arrive early for a spot on the lawn, and enjoy the NYC skyline backdrop.",
    attendees: 4000,
  },
  {
    id: 12,
    title: "Socrates Sculpture Park Sundays",
    type: "🗿 Art & Community",
    borough: "Queens",
    neighborhood: "Astoria",
    address: "32-01 Vernon Blvd, Astoria",
    schedule: "Sundays year-round",
    time: "9am – 5pm",
    cost: "Free",
    image: "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=400&h=250&fit=crop",
    tags: ["Art", "Outdoors", "Community"],
    description: "Rotating large-scale outdoor sculpture installations on the East River waterfront. Weekend programming includes art tours, fitness classes, and community markets.",
    attendees: 300,
  },
  {
    id: 13,
    title: "Coney Island Mermaid Parade",
    type: "🧜 Parade",
    borough: "Brooklyn",
    neighborhood: "Coney Island",
    address: "Surf Ave, Coney Island",
    schedule: "June (annual)",
    time: "1pm – 5pm",
    cost: "Free to watch",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=250&fit=crop",
    tags: ["Parade", "Art", "Festival"],
    description: "America's largest art parade — thousands of wildly costumed mermaids, sea creatures, and floats marching along the legendary Coney Island boardwalk.",
    attendees: 50000,
  },
  {
    id: 14,
    title: "Manhattan Chess in the Park",
    type: "♟️ Game & Social",
    borough: "Manhattan",
    neighborhood: "Washington Square",
    address: "Washington Square Park, Greenwich Village",
    schedule: "Daily (weather permitting)",
    time: "All day",
    cost: "Free",
    image: "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=400&h=250&fit=crop",
    tags: ["Chess", "Social", "Free"],
    description: "Join the legendary chess scene in Washington Square Park. Watch grandmasters and beginners battle it out. Pull up a chair and play anyone — all welcome.",
    attendees: 150,
  },
  {
    id: 15,
    title: "Harlem Jazz & Soul Festival",
    type: "🎷 Jazz Festival",
    borough: "Manhattan",
    neighborhood: "Harlem",
    address: "Marcus Garvey Park, 18 Mt Morris Park W",
    schedule: "Sundays Jun–Aug",
    time: "3pm – 8pm",
    cost: "Free",
    image: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=400&h=250&fit=crop",
    tags: ["Jazz", "Music", "Culture"],
    description: "Free outdoor jazz performances celebrating Harlem's musical heritage. Local and international artists, food vendors, and community gathering on summer Sundays.",
    attendees: 800,
  },
  {
    id: 16,
    title: "Brooklyn Flea — Fort Greene",
    type: "🪴 Flea & Market",
    borough: "Brooklyn",
    neighborhood: "Fort Greene",
    address: "176 Lafayette Ave, Brooklyn",
    schedule: "Saturdays year-round",
    time: "10am – 5pm",
    cost: "Free entry",
    image: "https://images.unsplash.com/photo-1567529684892-09290a1b2d05?w=400&h=250&fit=crop",
    tags: ["Flea", "Vintage", "Shopping"],
    description: "Brooklyn's beloved weekly flea market with the city's best vintage furniture, jewelry, clothing, and local food vendors. A neighborhood institution since 2008.",
    attendees: 1500,
  },
];

const BOROUGH_FILTERS = ["All", "Manhattan", "Brooklyn", "Queens", "The Bronx", "Staten Island"];

export default function CommunityEvents() {
  const [saved, setSaved] = useState(new Set());
  const [rsvped, setRsvped] = useState(new Set());
  const [filter, setFilter] = useState("All");

  const toggle = (set, setFn, id) => {
    setFn(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtered = filter === "All" ? EVENTS : EVENTS.filter(e => e.borough === filter);

  return (
    <div className="py-4 pb-8">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <div>
          <h2 className="text-lg font-black" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
            Events & Activities
          </h2>
          <p className="text-xs" style={{ color: "var(--text-hint)" }}>Things to do across NYC 🗽</p>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
          style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
          <Zap className="w-3 h-3" /> {filtered.length} events
        </span>
      </div>

      {/* Borough filter pills */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-3">
        {BOROUGH_FILTERS.map(b => (
          <button
            key={b}
            onClick={() => setFilter(b)}
            className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap"
            style={{
              backgroundColor: filter === b ? "#4F46E5" : "var(--bg-card)",
              color: filter === b ? "#fff" : "var(--text-secondary)",
              border: `1px solid ${filter === b ? "#4F46E5" : "var(--border-light)"}`,
            }}
          >
            {b}
          </button>
        ))}
      </div>

      {/* Events list */}
      <div className="px-4 space-y-4">
        {filtered.map((event, i) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="rounded-3xl overflow-hidden"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}
          >
            {/* Image */}
            <div className="relative" style={{ height: 160 }}>
              <img src={event.image} alt={event.title} className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0) 30%, rgba(0,0,0,0.65) 100%)" }} />

              {/* Cost badge */}
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold"
                style={{ backgroundColor: event.cost === "Free" || event.cost === "Free entry" ? "rgba(16,185,129,0.9)" : "rgba(0,0,0,0.6)", color: "#fff", backdropFilter: "blur(4px)" }}>
                {event.cost}
              </div>

              {/* Attendees badge */}
              <div className="absolute top-3 right-12 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1"
                style={{ backgroundColor: "rgba(0,0,0,0.5)", color: "#fff", backdropFilter: "blur(4px)" }}>
                <Users className="w-3 h-3" /> {event.attendees.toLocaleString()}
              </div>

              {/* Save button */}
              <button onClick={() => toggle(saved, setSaved, event.id)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}>
                {saved.has(event.id)
                  ? <BookmarkCheck className="w-4 h-4" style={{ color: "#818CF8" }} />
                  : <Bookmark className="w-4 h-4 text-white" />}
              </button>

              {/* Type + neighborhood at bottom */}
              <div className="absolute bottom-3 left-3">
                <span className="text-sm font-semibold text-white">{event.type}</span>
              </div>
              <div className="absolute bottom-3 right-3">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "#fff", backdropFilter: "blur(4px)" }}>
                  {event.borough}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="font-black text-base mb-1 leading-tight" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                {event.title}
              </h3>
              <p className="text-xs mb-3 leading-relaxed line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                {event.description}
              </p>

              {/* Meta row */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
                <div className="flex items-center gap-1 text-xs" style={{ color: "var(--text-hint)" }}>
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span>{event.neighborhood}</span>
                </div>
                <div className="flex items-center gap-1 text-xs" style={{ color: "var(--text-hint)" }}>
                  <Calendar className="w-3 h-3" />
                  <span>{event.schedule}</span>
                </div>
                <div className="flex items-center gap-1 text-xs" style={{ color: "var(--text-hint)" }}>
                  <Clock className="w-3 h-3" />
                  <span>{event.time}</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex gap-1.5 flex-wrap mb-3">
                {event.tags.map(tag => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}>
                    {tag}
                  </span>
                ))}
              </div>

              {/* RSVP / Save */}
              <div className="flex gap-2">
                <button onClick={() => toggle(rsvped, setRsvped, event.id)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                  style={{
                    background: rsvped.has(event.id) ? "linear-gradient(135deg,#4F46E5,#7C3AED)" : "var(--bg-subtle)",
                    color: rsvped.has(event.id) ? "#fff" : "var(--text-primary)",
                    border: rsvped.has(event.id) ? "none" : "1px solid var(--border-light)",
                  }}>
                  {rsvped.has(event.id) ? "✓ Going" : "RSVP"}
                </button>
                <button onClick={() => toggle(saved, setSaved, event.id)}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold"
                  style={{
                    backgroundColor: saved.has(event.id) ? "#EEF2FF" : "var(--bg-subtle)",
                    color: saved.has(event.id) ? "#4F46E5" : "var(--text-secondary)",
                    border: `1px solid ${saved.has(event.id) ? "#C7D2FE" : "var(--border-light)"}`,
                  }}>
                  {saved.has(event.id) ? "Saved ✓" : "Save"}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}