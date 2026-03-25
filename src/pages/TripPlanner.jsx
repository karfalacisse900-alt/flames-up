import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, MapPin, Search, Bell } from "lucide-react";
import BoroughDetail from "@/components/explore/BoroughDetail";

const BOROUGHS = [
  {
    id: "manhattan",
    name: "Manhattan",
    tagline: "The heart of New York City",
    description: "World-famous skyline, iconic museums, hidden delis, and neighborhoods full of character",
    image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&h=400&fit=crop",
    emoji: "🏙️",
    neighborhoods: [
      {
        name: "SoHo",
        description: "Cast-iron architecture, boutique shopping, indie galleries and coffee shops on cobblestone streets",
        image: "https://images.unsplash.com/photo-1555529771-835f59fc5ef7?w=400&h=300&fit=crop",
        spots: [
          { name: "McNally Jackson Books", type: "📚 Bookstore", cost: "Free", desc: "Independent bookstore with great reads and a cozy reading nook" },
          { name: "Soho Square Park", type: "🌿 Public Space", cost: "Free", desc: "Great people-watching spot in the heart of SoHo" },
          { name: "Housing Works Bookstore", type: "📚 Thrift + Books", cost: "Free", desc: "Beloved used bookstore & café that funds a great cause" },
          { name: "Artists & Fleas Market", type: "🛍️ Market", cost: "Free entry", desc: "Local artisan market with unique jewelry, clothing, and art" },
        ],
      },
      {
        name: "Upper East Side",
        description: "Museum Mile, Central Park access, old-money charm, and hidden neighborhood gems",
        image: "https://images.unsplash.com/photo-1516557595335-b1b49fcb5b3d?w=400&h=300&fit=crop",
        spots: [
          { name: "The Metropolitan Museum", type: "🎨 Museum", cost: "Pay-what-you-wish (NY residents)", desc: "One of the world's greatest art museums spanning 5,000 years" },
          { name: "Central Park (East Side)", type: "🌿 Park", cost: "Free", desc: "Walk through Conservatory Garden or rent a rowboat at the lake" },
          { name: "Neue Galerie", type: "🎨 Museum", cost: "$25", desc: "Intimate German/Austrian art museum — stunning Klimt collection" },
          { name: "Carl Schurz Park", type: "🌿 Park", cost: "Free", desc: "Quiet riverside park with East River views — locals' favorite" },
        ],
      },
      {
        name: "Harlem",
        description: "Rich African-American culture, jazz history, gospel brunches, and soul food institutions",
        image: "https://images.unsplash.com/photo-1571986655572-b26ab95b8bcc?w=400&h=300&fit=crop",
        spots: [
          { name: "Marcus Garvey Park", type: "🌿 Park", cost: "Free", desc: "Historic park with amphitheater, pools, and community events" },
          { name: "Studio Museum in Harlem", type: "🎨 Museum", cost: "Free on Sundays", desc: "Celebrates artists of African descent with rotating exhibitions" },
          { name: "Apollo Theater", type: "🎭 Landmark", cost: "Free to walk by, tours from $16", desc: "Iconic venue where Ella Fitzgerald, James Brown and Michael Jackson launched" },
          { name: "Strivers' Row", type: "🏛️ Architecture", cost: "Free", desc: "Historic townhouses where Harlem Renaissance greats once lived" },
        ],
      },
      {
        name: "Lower East Side",
        description: "Immigrant history, vintage shops, street art, night markets, and budget-friendly eats",
        image: "https://images.unsplash.com/photo-1487659055127-d4b66b1690bb?w=400&h=300&fit=crop",
        spots: [
          { name: "Tenement Museum", type: "🏛️ Museum", cost: "$30", desc: "Walk through restored immigrant apartments — a must-see for NYC history" },
          { name: "Essex Market", type: "🍽️ Market", cost: "Free entry", desc: "Vibrant indoor market with vendors from all over the world" },
          { name: "Orchard Street", type: "🛍️ Shopping", cost: "Free to browse", desc: "Historic bargain shopping street now full of indie boutiques" },
          { name: "Sara D. Roosevelt Park", type: "🌿 Park", cost: "Free", desc: "Community park with basketball courts and seasonal farmers market" },
        ],
      },
      {
        name: "Greenwich Village",
        description: "Bohemian brownstones, live jazz clubs, The Strand, hidden gardens, and NYU energy",
        image: "https://images.unsplash.com/photo-1534080564842-39a9e635b032?w=400&h=300&fit=crop",
        spots: [
          { name: "Washington Square Park", type: "🌿 Park", cost: "Free", desc: "Iconic arch, chess players, musicians — the soul of the Village" },
          { name: "The Strand Bookstore", type: "📚 Bookstore", cost: "Free to browse", desc: "18 miles of books — legendary indie bookstore since 1927" },
          { name: "Village Vanguard", type: "🎵 Jazz Club", cost: "$35 + 2-drink min", desc: "The most storied jazz club in NYC, opened in 1935" },
          { name: "Jefferson Market Garden", type: "🌿 Garden", cost: "Free", desc: "Hidden community garden open to public on weekends in season" },
        ],
      },
      {
        name: "Chinatown & Little Italy",
        description: "Authentic dim sum, fish markets, festival streets, and a mix of generations of immigrants",
        image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=300&fit=crop",
        spots: [
          { name: "Columbus Park", type: "🌿 Park", cost: "Free", desc: "Watch mahjong games, tai chi, and community life — totally free" },
          { name: "Canal Street Market", type: "🛍️ Market", cost: "Free entry", desc: "Rotating vendors with food, art, and unique finds" },
          { name: "Museum of Chinese in America", type: "🏛️ Museum", cost: "$14", desc: "Tells the stories of Chinese Americans through powerful exhibits" },
          { name: "Mulberry Street", type: "🍕 Dining", cost: "Varies", desc: "Walk the original Little Italy strip — try a cannoli from Ferrara" },
        ],
      },
    ],
  },
  {
    id: "brooklyn",
    name: "Brooklyn",
    tagline: "Creative, cultural, and always evolving",
    description: "Rooftop bars with Manhattan views, street murals, artisan markets, beaches, and world-class dining",
    image: "https://images.unsplash.com/photo-1508779105133-6f9df59d3e65?w=600&h=400&fit=crop",
    emoji: "🌉",
    neighborhoods: [
      {
        name: "Williamsburg",
        description: "The epicenter of Brooklyn cool — vintage shops, rooftop bars, street art, and great coffee",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
        spots: [
          { name: "Brooklyn Flea Market", type: "🛍️ Market", cost: "Free entry", desc: "One of the best flea markets in the country, weekends year-round" },
          { name: "East River State Park", type: "🌿 Park", cost: "Free", desc: "Sit on the waterfront and enjoy stunning Manhattan skyline views" },
          { name: "Smorgasburg", type: "🍽️ Market", cost: "Free entry", desc: "100+ local food vendors every weekend — a NYC institution" },
          { name: "The Brooklyn Art Library", type: "📚 Gallery", cost: "Free", desc: "Quirky library housing thousands of hand-made sketchbooks from artists worldwide" },
        ],
      },
      {
        name: "DUMBO",
        description: "Instagram-famous bridge views, cobblestone streets, galleries, and weekend markets",
        image: "https://images.unsplash.com/photo-1569154941061-e231b4aa8ebb?w=400&h=300&fit=crop",
        spots: [
          { name: "Brooklyn Bridge Park", type: "🌿 Park", cost: "Free", desc: "Sprawling waterfront park with piers, gardens, mini golf, and kayaking" },
          { name: "Jane's Carousel", type: "🎠 Attraction", cost: "$3", desc: "Restored 1922 carousel in a stunning Nouvel-designed pavilion" },
          { name: "DUMBO Arts", type: "🎨 Gallery", cost: "Free", desc: "Gallery district with rotating exhibitions from emerging artists" },
          { name: "Washington Street Photo Spot", type: "📸 Landmark", cost: "Free", desc: "The iconic framed Manhattan Bridge view — most photographed in Brooklyn" },
        ],
      },
      {
        name: "Park Slope",
        description: "Leafy brownstones, Prospect Park, farmers markets, and a laid-back family vibe",
        image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
        spots: [
          { name: "Prospect Park", type: "🌿 Park", cost: "Free", desc: "Brooklyn's beloved park — boathouse, meadows, bike paths, and concerts" },
          { name: "Brooklyn Museum", type: "🎨 Museum", cost: "Pay-what-you-wish 1st Sat", desc: "World-class collection in a stunning Beaux-Arts building" },
          { name: "Brooklyn Botanic Garden", type: "🌸 Garden", cost: "Free Tues + select times", desc: "Japanese Garden, cherry blossoms in spring, and rose garden" },
          { name: "Grand Army Plaza Greenmarket", type: "🛒 Market", cost: "Free", desc: "Year-round farmers market with local produce, bread, and flowers" },
        ],
      },
      {
        name: "Coney Island",
        description: "Classic boardwalk, historic amusement rides, beaches, and Nathan's Famous hot dogs",
        image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop",
        spots: [
          { name: "Coney Island Beach", type: "🏖️ Beach", cost: "Free", desc: "3.5 miles of public beach — crowded but iconic in summer" },
          { name: "Luna Park", type: "🎡 Amusement", cost: "Pay per ride", desc: "Historic amusement park — ride the Cyclone roller coaster" },
          { name: "New York Aquarium", type: "🐟 Attraction", cost: "$22.95", desc: "Sharks, sea lions, and ocean wonders by the sea" },
          { name: "Coney Island Boardwalk", type: "🚶 Walk", cost: "Free", desc: "Classic American boardwalk — free to stroll with shops and food" },
        ],
      },
    ],
  },
  {
    id: "queens",
    name: "Queens",
    tagline: "The world's most diverse borough",
    description: "Over 160 languages spoken, incredible international food, Flushing Meadows, and Rockaway Beach",
    image: "https://images.unsplash.com/photo-1569154941061-e231b4aa8ebb?w=600&h=400&fit=crop",
    emoji: "🌏",
    neighborhoods: [
      {
        name: "Flushing",
        description: "Authentic Asian cuisine, bustling markets, and one of the largest Chinatowns outside Asia",
        image: "https://images.unsplash.com/photo-1555529771-835f59fc5ef7?w=400&h=300&fit=crop",
        spots: [
          { name: "New World Mall Food Court", type: "🍜 Dining", cost: "$5–15", desc: "Incredible, cheap Asian food — dumplings, noodles, bubble tea and more" },
          { name: "Flushing Meadows Corona Park", type: "🌿 Park", cost: "Free", desc: "Massive park with a lake, Unisphere, and Queens Museum" },
          { name: "Queens Museum", type: "🎨 Museum", cost: "Pay-what-you-wish", desc: "Home to the famous 1964 World's Fair Panorama of NYC" },
          { name: "Queens Botanical Garden", type: "🌸 Garden", cost: "$6 ($4 for NYC residents)", desc: "Peaceful garden in the middle of the city" },
        ],
      },
      {
        name: "Astoria",
        description: "Greek and Mediterranean food, live music venues, and a tight-knit arts community",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
        spots: [
          { name: "Socrates Sculpture Park", type: "🎨 Park", cost: "Free", desc: "Outdoor sculpture park on the waterfront with rotating exhibitions" },
          { name: "Museum of the Moving Image", type: "🎬 Museum", cost: "$20 (free Fri evenings)", desc: "Fascinating look at film, TV, and digital media" },
          { name: "Astoria Park", type: "🌿 Park", cost: "Free", desc: "Stunning views of the Hell Gate Bridge and East River" },
          { name: "31st Street Food Strip", type: "🍴 Dining", cost: "Varies", desc: "Line of authentic Greek restaurants and bakeries" },
        ],
      },
      {
        name: "Rockaway Beach",
        description: "NYC's favorite summer escape — real waves, surfing, boardwalk, and seafood",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop",
        spots: [
          { name: "Rockaway Beach", type: "🏖️ Beach", cost: "Free", desc: "NYC's best surf beach with designated surfing sections" },
          { name: "The Rockaway Hotel Rooftop", type: "🍹 Bar", cost: "Free to visit", desc: "Cool rooftop bar with ocean views and sunset cocktails" },
          { name: "Rockaway Beach Surf Club", type: "🏄 Activity", cost: "Lessons from $100", desc: "Take a surfing lesson in NYC's only surf-able waves" },
          { name: "Fort Tilden", type: "🌿 Nature", cost: "Free", desc: "Abandoned military fort with dunes, trails, and secluded beaches" },
        ],
      },
    ],
  },
  {
    id: "bronx",
    name: "The Bronx",
    tagline: "Birthplace of hip-hop and so much more",
    description: "The New York Botanical Garden, amazing Bronx Zoo, Arthur Avenue Italian market, and hip-hop history",
    image: "https://images.unsplash.com/photo-1514924013411-cbf25faa35bb?w=600&h=400&fit=crop",
    emoji: "🎵",
    neighborhoods: [
      {
        name: "Fordham & Arthur Avenue",
        description: "The 'Real Little Italy' — old-school Italian bakeries, delis, and family restaurants",
        image: "https://images.unsplash.com/photo-1534080564842-39a9e635b032?w=400&h=300&fit=crop",
        spots: [
          { name: "Arthur Avenue Retail Market", type: "🧀 Market", cost: "Free entry", desc: "Indoor market with fresh pasta, cheese, meats, and produce — authentic Italian" },
          { name: "Bronx Zoo", type: "🦁 Zoo", cost: "From $25 (free Wednesdays)", desc: "One of the largest urban zoos in the world — over 6,000 animals" },
          { name: "New York Botanical Garden", type: "🌸 Garden", cost: "$35 (free Wednesdays)", desc: "250 stunning acres with world-class garden collections" },
          { name: "Fordham University Campus", type: "🏛️ Campus", cost: "Free to walk", desc: "Gothic stone buildings — one of NYC's most beautiful campuses" },
        ],
      },
      {
        name: "South Bronx & Hip-Hop Heritage",
        description: "The birthplace of hip-hop culture, street art, and community murals",
        image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop",
        spots: [
          { name: "Universal Hip Hop Museum", type: "🎵 Museum", cost: "Check for current pricing", desc: "Celebrating the birth and global impact of hip-hop culture" },
          { name: "1520 Sedgwick Avenue", type: "🏛️ Landmark", cost: "Free to view", desc: "The apartment building where DJ Kool Herc threw the first hip-hop party in 1973" },
          { name: "Andrew Freedman Home", type: "🎨 Gallery", cost: "Free events", desc: "Historic building with free community arts events and exhibitions" },
          { name: "Bronx River Trail", type: "🚴 Trail", cost: "Free", desc: "Scenic greenway along the Bronx River through the heart of the borough" },
        ],
      },
    ],
  },
  {
    id: "staten-island",
    name: "Staten Island",
    tagline: "NYC's hidden gem borough",
    description: "Free ferry views of the Statue of Liberty, snug Harbor, historic village, and beautiful waterfront parks",
    image: "https://images.unsplash.com/photo-1571986655572-b26ab95b8bcc?w=600&h=400&fit=crop",
    emoji: "⛴️",
    neighborhoods: [
      {
        name: "St. George & Ferry Terminal",
        description: "The arrival point — Staten Island ferry, waterfront arts, and Sailor's Snug Harbor",
        image: "https://images.unsplash.com/photo-1516557595335-b1b49fcb5b3d?w=400&h=300&fit=crop",
        spots: [
          { name: "Staten Island Ferry", type: "⛴️ Ferry", cost: "FREE", desc: "Best free attraction in NYC — stunning Statue of Liberty and Manhattan skyline views" },
          { name: "Snug Harbor Cultural Center", type: "🎨 Park & Museum", cost: "Free grounds, $8 museum", desc: "Stunning 83-acre park with Greek Revival buildings, Chinese Scholar's Garden, and galleries" },
          { name: "Staten Island Museum", type: "🏛️ Museum", cost: "$10 (free Sundays)", desc: "Natural history, art, and culture of Staten Island" },
          { name: "St. George Theatre", type: "🎭 Theater", cost: "Varies by show", desc: "Beautifully restored 1929 theater with regular performances" },
        ],
      },
      {
        name: "Historic Richmond Town",
        description: "Living history museum of colonial-era New York on 100 acres",
        image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
        spots: [
          { name: "Historic Richmond Town", type: "🏛️ Museum Village", cost: "$10", desc: "28 historic buildings — live demonstrations of colonial-era life in NYC" },
          { name: "LaTourette Park & Golf", type: "🌿 Park", cost: "Free to hike", desc: "Over 500 acres of forest with hiking trails and a historic house" },
          { name: "Voelcker's Beer Garden", type: "🍺 Historic Site", cost: "Free to visit exterior", desc: "One of the last historic beer gardens from the 19th century" },
          { name: "Clay Pit Ponds", type: "🌿 Nature", cost: "Free", desc: "NYC's only state park preserve — spring-fed streams, birds, and peace" },
        ],
      },
    ],
  },
];

export default function TripPlanner() {
  const [selectedBorough, setSelectedBorough] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = searchQuery.trim()
    ? BOROUGHS.map(b => ({
        ...b,
        neighborhoods: b.neighborhoods.filter(n =>
          n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.spots?.some(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
        ),
      })).filter(b => b.neighborhoods.length > 0)
    : BOROUGHS;

  if (selectedBorough) {
    return (
      <BoroughDetail
        borough={selectedBorough}
        onBack={() => setSelectedBorough(null)}
      />
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div
        className="sticky top-0 z-30 px-4 pb-4"
        style={{
          paddingTop: "max(env(safe-area-inset-top, 16px), 16px)",
          backgroundColor: "var(--bg-nav)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-semibold" style={{ color: "var(--text-hint)" }}>Explore</p>
            <h1
              className="text-2xl font-black leading-tight"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}
            >
              New York City
            </h1>
          </div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
            🗽
          </div>
        </div>

        {/* Search */}
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-2xl"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
        >
          <Search className="w-4 h-4 shrink-0" style={{ color: "var(--text-hint)" }} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search neighborhoods, spots…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--text-primary)", border: "none", minHeight: "unset", boxShadow: "none", padding: 0 }}
          />
        </div>
      </div>

      <div className="px-4 pt-5 pb-32">
        {/* Intro blurb */}
        {!searchQuery && (
          <p className="text-sm mb-5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Discover hidden spots, free activities, local dining, libraries, markets, and community events — across all five boroughs.
          </p>
        )}

        {/* Borough Cards */}
        <div className="space-y-4">
          {filtered.map((borough, idx) => (
            <motion.button
              key={borough.id}
              onClick={() => setSelectedBorough(borough)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              whileTap={{ scale: 0.98 }}
              className="w-full rounded-3xl overflow-hidden text-left relative"
              style={{ height: 220, display: "block" }}
            >
              {/* Background image */}
              <img
                src={borough.image}
                alt={borough.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Gradient overlay */}
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.7) 100%)" }}
              />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{borough.emoji}</span>
                      <h2 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-serif)" }}>
                        {borough.name}
                      </h2>
                    </div>
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>
                      {borough.tagline}
                    </p>
                  </div>
                  <div
                    className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold"
                    style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "#fff", backdropFilter: "blur(8px)" }}
                  >
                    {borough.neighborhoods.length} areas →
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}