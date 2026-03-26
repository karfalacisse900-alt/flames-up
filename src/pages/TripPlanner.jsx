import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Search, Sparkles, X, Loader2, Send, ChevronLeft } from "lucide-react";
import BoroughDetail from "@/components/explore/BoroughDetail";

// ─── Borough data ──────────────────────────────────────────────────────────────
const BOROUGHS = [
  {
    id: "manhattan", name: "Manhattan", tagline: "The heart of New York City",
    description: "World-famous skyline, iconic museums, hidden delis, and neighborhoods full of character",
    image: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&h=400&fit=crop", emoji: "🏙️",
    neighborhoods: [
      { name: "Midtown Gems", description: "Bryant Park, the best public library terrace, hidden rooftops and iconic Midtown spots locals actually use", image: "https://images.unsplash.com/photo-1538970272646-f61fabb3bfb2?w=400&h=300&fit=crop", spots: [
        { name: "Bryant Park", type: "🌿 Park", cost: "Free", desc: "Midtown's living room — free chess, pétanque, ice skating in winter, outdoor movies in summer, and the best people-watching in the city. Always something happening." },
        { name: "Stavros Niarchos Foundation Library (SNFL)", type: "📚 Library", cost: "Free", desc: "The stunning reimagined NYPL on 42nd St — free WiFi, beautiful reading rooms, amazing views from the roof terrace, and free community events all year." },
        { name: "The New York Public Library (42nd St)", type: "🏛️ Landmark", cost: "Free", desc: "Walk up the famous steps flanked by Patience and Fortitude (the marble lions). The Rose Main Reading Room is one of the most beautiful interior spaces in all of NYC." },
        { name: "Chelsea Market", type: "🍽️ Market", cost: "Free entry", desc: "A converted Nabisco factory turned food hall — great tacos, lobster, and coffee. Walk the whole thing even if you don't eat." },
        { name: "The High Line", type: "🌿 Walk", cost: "Free", desc: "Elevated park built on a former rail line. Walk the full 1.5 miles from Gansevoort to 34th St — public art, Hudson views, and well-designed greenery." },
        { name: "Rockefeller Center (Top of the Rock)", type: "🏙️ Landmark", cost: "Free to walk around; observation deck $40", desc: "The plaza is free and beautiful year-round. Ice skate in winter. If you want the best view of the Empire State Building, Top of the Rock beats the Empire State itself." },
        { name: "Eataly NYC Flatiron", type: "🍕 Food", cost: "Free to browse", desc: "Massive Italian market and food hall — browse the cheese cave, grab a slice of pizza, or just wander. No reservation needed for most counters." },
        { name: "The Vessel (Hudson Yards)", type: "🏗️ Landmark", cost: "Free to view", desc: "The honeycomb staircase sculpture at Hudson Yards — free to photograph from outside, very Instagrammable, and the Hudson Yards plaza itself has shops and a great lawn." },
      ] },
      { name: "SoHo", description: "Cast-iron architecture, boutique shopping, indie galleries and coffee shops on cobblestone streets",
        image: "https://images.unsplash.com/photo-1555529771-835f59fc5ef7?w=400&h=300&fit=crop", spots: [{ name: "McNally Jackson Books", type: "📚 Bookstore", cost: "Free", desc: "Independent bookstore with great reads and a cozy reading nook. Staff picks are always worth grabbing." }, { name: "Soho Square Park", type: "🌿 Public Space", cost: "Free", desc: "Tiny park perfect for people-watching, eating a sandwich, or just sitting on a bench between exploring." }, { name: "Housing Works Bookstore", type: "📚 Thrift + Books", cost: "Free", desc: "Beloved used bookstore & café that funds a great cause. You can score rare books for $1." }, { name: "Artists & Fleas Market", type: "🛍️ Market", cost: "Free entry", desc: "Local artisan market with unique jewelry, clothing, and art. Great for gifts and original finds." }, { name: "Pret A Manger SoHo", type: "☕ Café", cost: "$3–10", desc: "Casual coffee and sandwich spot — great for a quick sit-down between exploring the neighborhood." }, { name: "Spring Street Salt Shed Mural", type: "🎨 Street Art", cost: "Free", desc: "Massive public mural on the salt shed building — a great photo op and free art moment." }, { name: "New York Public Library (Science)", type: "📚 Library", cost: "Free", desc: "Browse the NYPL Science Library at the corner — free wifi, AC, and reading chairs for all." }, { name: "Prince Street", type: "🚶 Walk", cost: "Free", desc: "Classic SoHo stroll — street art, buskers, window shopping, and the best cast-iron architecture." }] },
      { name: "Upper East Side", description: "Museum Mile, Central Park access, old-money charm, and hidden neighborhood gems", image: "https://images.unsplash.com/photo-1516557595335-b1b49fcb5b3d?w=400&h=300&fit=crop", spots: [{ name: "The Metropolitan Museum", type: "🎨 Museum", cost: "Pay-what-you-wish (NY residents)", desc: "One of the world's greatest art museums spanning 5,000 years of human history." }, { name: "Central Park (East Side)", type: "🌿 Park", cost: "Free", desc: "Walk through Conservatory Garden or rent a rowboat at the lake for $15/hour." }, { name: "Neue Galerie", type: "🎨 Museum", cost: "$25", desc: "Intimate German/Austrian art museum — stunning Klimt collection in a beautiful mansion." }, { name: "Carl Schurz Park", type: "🌿 Park", cost: "Free", desc: "Quiet riverside park with East River views — locals jog and read here on weekends." }, { name: "Candle Cafe", type: "🍽️ Dining", cost: "$15–30", desc: "Popular vegan restaurant with a warm, neighborhood feel. Great for a casual lunch." }, { name: "Corner Bookstore", type: "📚 Bookstore", cost: "Free to browse", desc: "Classic small neighborhood bookshop on Madison Ave — been open since 1978." }, { name: "E 86th Street Pier", type: "🌊 Waterfront", cost: "Free", desc: "Head to the East River Esplanade and watch boats pass — peaceful and underrated." }, { name: "Lexington Ave Bagel Walk", type: "🥯 Food", cost: "$2–5", desc: "Grab a classic NYC bagel from any of the no-frills bagel shops along Lex — this is the real deal." }] },
      { name: "Harlem", description: "Rich African-American culture, jazz history, gospel brunches, and soul food institutions", image: "https://images.unsplash.com/photo-1571986655572-b26ab95b8bcc?w=400&h=300&fit=crop", spots: [{ name: "Marcus Garvey Park", type: "🌿 Park", cost: "Free", desc: "Historic park with amphitheater, pools, and free community events all summer long." }, { name: "Studio Museum in Harlem", type: "🎨 Museum", cost: "Free on Sundays", desc: "Celebrates artists of African descent with rotating exhibitions and community events." }, { name: "Apollo Theater", type: "🎭 Landmark", cost: "Free to walk by, tours from $16", desc: "Walk by the legendary marquee, or take a tour of where Ella Fitzgerald and MJ got their start." }, { name: "Strivers' Row", type: "🏛️ Architecture", cost: "Free", desc: "Stroll these historic townhouses on 138th–139th St where Harlem Renaissance greats once lived." }, { name: "Sylvia's Restaurant", type: "🍽️ Dining", cost: "$15–30", desc: "The institution of Harlem soul food since 1962. Sunday gospel brunch is a bucket list experience." }, { name: "Morningside Park", type: "🌿 Park", cost: "Free", desc: "Beloved neighborhood park with a small waterfall, community garden, and weekend drum circles." }, { name: "Harlem Book Fair (Summer)", type: "📚 Community", cost: "Free", desc: "Annual outdoor celebration of Black literature — authors, panels, and free books in July." }, { name: "Pinkberry on 125th", type: "☕ Café", cost: "$5–10", desc: "Casual spot on the main strip to grab a treat and watch the busy energy of 125th Street." }] },
      { name: "Lower East Side", description: "Immigrant history, vintage shops, street art, night markets, and budget-friendly eats", image: "https://images.unsplash.com/photo-1487659055127-d4b66b1690bb?w=400&h=300&fit=crop", spots: [{ name: "Tenement Museum", type: "🏛️ Museum", cost: "$30", desc: "Walk through restored 1800s immigrant apartments — among the most powerful NYC experiences." }, { name: "Essex Market", type: "🍽️ Market", cost: "Free entry", desc: "Vibrant indoor market with vendors from dozens of countries — cheap, delicious, and lively." }, { name: "Orchard Street", type: "🛍️ Shopping", cost: "Free to browse", desc: "Historic bargain shopping strip now full of indie boutiques, vintage clothing, and local designers." }, { name: "Sara D. Roosevelt Park", type: "🌿 Park", cost: "Free", desc: "Long community park with basketball courts, playgrounds, and a seasonal farmers market." }, { name: "Russ & Daughters", type: "🥯 Food", cost: "$8–20", desc: "A 100-year-old appetizing shop — get the classic bagel with lox. A pure NYC institution." }, { name: "Metrograph Cinema", type: "🎬 Cinema", cost: "$17", desc: "Indie movie theater showing curated classic and art-house films with a great little café." }, { name: "Dimes Square", type: "🚶 Walk", cost: "Free", desc: "The unofficial mini-plaza at Delancey & Canal — cool street scene, outdoor seating, and vibe." }, { name: "Doyers Street", type: "🏛️ Landmark", cost: "Free", desc: "The crooked lane in Chinatown with a wild NYC history — walk through and feel the old city." }] },
      { name: "Greenwich Village", description: "Bohemian brownstones, live jazz clubs, The Strand, hidden gardens, and NYU energy", image: "https://images.unsplash.com/photo-1534080564842-39a9e635b032?w=400&h=300&fit=crop", spots: [{ name: "Washington Square Park", type: "🌿 Park", cost: "Free", desc: "Iconic arch, chess players, street musicians — the living room of the Village. Always something happening." }, { name: "The Strand Bookstore", type: "📚 Bookstore", cost: "Free to browse", desc: "18 miles of books — legendary indie bookstore since 1927. Check the outdoor bargain carts ($1)." }, { name: "Village Vanguard", type: "🎵 Jazz Club", cost: "$35 + 2-drink min", desc: "The most storied jazz club in NYC, opened in 1935. Small, intimate, legendary." }, { name: "Jefferson Market Garden", type: "🌿 Garden", cost: "Free", desc: "Hidden community garden open to public on weekends — a secret oasis in the city." }, { name: "White Horse Tavern", type: "🍺 Bar", cost: "$5–15", desc: "Historic bar from 1880 where Dylan Thomas and Jack Kerouac drank. Very casual and very real." }, { name: "Bleecker Street Stroll", type: "🚶 Walk", cost: "Free", desc: "Walk Bleecker from 6th Ave to Hudson — boutiques, classic pizza, and some of the city's best brownstones." }, { name: "Joe's Pizza (Original)", type: "🍕 Food", cost: "$3–5", desc: "The most iconic NYC slice. No frills, tiny space, perfect pizza. Cash only. Lines move fast." }, { name: "Christopher Street Pier", type: "🌊 Waterfront", cost: "Free", desc: "Hudson River park pier — a chill spot to sit, watch the sunset, and feel the West Village vibe." }] },
      { name: "Chinatown & Little Italy", description: "Authentic dim sum, fish markets, festival streets, and generations of immigrant community life", image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=300&fit=crop", spots: [{ name: "Columbus Park", type: "🌿 Park", cost: "Free", desc: "Watch mahjong games, tai chi, and everyday community life. One of the most authentic free experiences in NYC." }, { name: "Canal Street Market", type: "🛍️ Market", cost: "Free entry", desc: "Rotating local vendors with food, art, plants, and unique finds. Great place to spend an hour." }, { name: "Nom Wah Tea Parlor", type: "🍽️ Dining", cost: "$10–20", desc: "NYC's oldest dim sum restaurant (1920). Go for the casual weekday lunch experience — no wait." }, { name: "Chinatown Ice Cream Factory", type: "🍦 Food", cost: "$4–7", desc: "Legendary shop with wild flavors like taro, lychee, and red bean. Always a line, always worth it." }] },
      { name: "NYC Nightlife & Clubs", description: "Underground clubs, late-night spots, and hidden bars that real New Yorkers go to", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=300&fit=crop", spots: [{ name: "Elsewhere (Bushwick)", type: "🎶 Nightclub", cost: "$15–25 cover", desc: "Three-floor venue in Bushwick with multiple stages, a rooftop, and the best underground electronic music in NYC. Not touristy at all." }, { name: "House of Yes (Ridgewood)", type: "🎭 Club", cost: "$20–30", desc: "Immersive performance club with circus acts, drag shows, and themed nights. Incredibly fun and creative — totally unique." }, { name: "Nowadays (Queens)", type: "🌿 Club", cost: "$15–25", desc: "Outdoor venue in Ridgewood with a garden dance floor. Some of the best DJs in NYC play here. Beloved by locals." }, { name: "Bossa Nova Civic Club (Bushwick)", type: "🎵 Club", cost: "$10–20", desc: "Tiny, legendary underground techno club. No photos policy, serious music heads only. Open until 8am on weekends." }, { name: "Output (Brooklyn)", type: "🎶 Club", cost: "$20–35", desc: "World-class sound system, waterfront location in Williamsburg. Friday & Saturday deep house and techno nights." }, { name: "Techno Brooklyn (various)", type: "🎵 Venue", cost: "Varies", desc: "Check RA (Resident Advisor) for pop-up warehouse events in Bushwick and East New York — best underground parties." }, { name: "The Slipper Room (LES)", type: "🎭 Bar", cost: "$10–20", desc: "Burlesque and variety shows in a tiny Lower East Side venue. Kitschy, fun, and very NYC." }, { name: "Queensbridge Park at Night", type: "🌉 Outdoor", cost: "Free", desc: "Walk the path under the bridge at night for stunning lit Manhattan skyline views. A local secret spot." }] },
      { name: "Fishing & Waterfront", description: "NYC has more fishing spots than most people realize — totally free and genuinely peaceful", image: "https://images.unsplash.com/photo-1545816250-e12bedba42bc?w=400&h=300&fit=crop", spots: [{ name: "Pier 17 Seaport Fishing", type: "🎣 Fishing", cost: "Free", desc: "Fish right off the pier at South Street Seaport with stunning views of the Brooklyn Bridge. No license needed off city piers." }, { name: "Sheepshead Bay (Brooklyn)", type: "🎣 Fishing", cost: "$40–60 for party boats", desc: "Take a party boat out for a few hours of real fishing in the Atlantic. Striped bass, fluke, and blackfish year-round." }, { name: "Prospect Park Lake (Brooklyn)", type: "🎣 Fishing", cost: "Free (license needed)", desc: "Fish for bass and catfish in the middle of the park. Incredibly peaceful — you forget you're in NYC." }, { name: "Van Cortlandt Park Lake (Bronx)", type: "🎣 Fishing", cost: "Free (license needed)", desc: "Large freshwater lake in the Bronx — great for carp, largemouth bass, and crappie. Rarely crowded." }, { name: "Orchard Beach Pier (Bronx)", type: "🎣 Fishing", cost: "Free", desc: "Fish from the pier at Orchard Beach in the Bronx — easy access, great views, calm water." }, { name: "Gateway National Recreation Area", type: "🏖️ Nature", cost: "Free", desc: "Over 26,000 acres of national parkland in NYC — trails, beaches, wildlife, and fishing on Jamaica Bay." }, { name: "City Island (Bronx)", type: "⛵ Waterfront", cost: "Free to visit", desc: "A tiny New England-style fishing village inside the Bronx. Fresh seafood restaurants, boat yards, and a completely different vibe." }, { name: "Jamaica Bay (Queens)", type: "🌊 Nature", cost: "Free", desc: "Kayak, bird-watch, or fish in Jamaica Bay. One of the most underrated natural spaces in NYC." }] },
    ],
  },
  {
    id: "brooklyn", name: "Brooklyn", tagline: "Creative, cultural, and always evolving",
    description: "Rooftop bars with Manhattan views, street murals, artisan markets, beaches, and world-class dining",
    image: "https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=600&h=400&fit=crop", emoji: "🌉",
    neighborhoods: [
      { name: "Williamsburg", description: "The epicenter of Brooklyn cool — vintage shops, rooftop bars, street art, and great coffee", image: "https://images.unsplash.com/photo-1555529771-835f59fc5ef7?w=400&h=300&fit=crop", spots: [{ name: "Brooklyn Flea Market", type: "🛍️ Market", cost: "Free entry", desc: "One of the best flea markets in the country — vintage furniture, clothing, jewelry, and local art." }, { name: "East River State Park", type: "🌿 Park", cost: "Free", desc: "Sit on the waterfront grass and enjoy stunning Manhattan skyline views. Smorgasburg sets up here on weekends." }, { name: "Smorgasburg", type: "🍽️ Market", cost: "Free entry", desc: "100+ local food vendors every weekend — a NYC institution. Try the original ramen burger." }, { name: "The Brooklyn Art Library", type: "📚 Gallery", cost: "Free", desc: "Quirky library housing thousands of hand-made sketchbooks from artists worldwide. You can submit your own." }, { name: "McCarren Park", type: "🌿 Park", cost: "Free", desc: "Big neighborhood park with weekend sports, a summer pool, picnic areas, and community events." }, { name: "Bedford Avenue Walk", type: "🚶 Walk", cost: "Free", desc: "The main strip — coffee shops, vintage stores, thrift spots, and great people-watching." }, { name: "Bakeri", type: "☕ Café", cost: "$5–12", desc: "Cozy Scandinavian bakery on a quiet block. Great for a pastry and slow morning coffee." }, { name: "Kinfolk Studios", type: "🎨 Gallery", cost: "Free", desc: "Community arts space with rotating exhibitions, workshops, and occasional free music events." }] },
      { name: "DUMBO", description: "Instagram-famous bridge views, cobblestone streets, galleries, and weekend markets", image: "https://images.unsplash.com/photo-1569154941061-e231b4aa8ebb?w=400&h=300&fit=crop", spots: [{ name: "Brooklyn Bridge Park", type: "🌿 Park", cost: "Free", desc: "Sprawling waterfront park with piers, gardens, mini golf, and free kayaking on summer weekends." }, { name: "Jane's Carousel", type: "🎠 Attraction", cost: "$3", desc: "Restored 1922 carousel inside a stunning glass pavilion — one of NYC's most beautiful spots." }, { name: "DUMBO Arts", type: "🎨 Gallery", cost: "Free", desc: "Gallery district with rotating exhibitions — walk in off the street most days." }, { name: "Washington Street Photo Spot", type: "📸 Landmark", cost: "Free", desc: "The iconic framed Manhattan Bridge view — most photographed in Brooklyn. Go early to beat crowds." }, { name: "Empire Fulton Ferry Park", type: "🌿 Park", cost: "Free", desc: "Grassy park right under the Brooklyn Bridge — sunbathe, picnic, or just enjoy the view." }, { name: "Time Out Market Brooklyn", type: "🍽️ Market", cost: "Free entry", desc: "Indoor food hall with Brooklyn's best restaurants under one roof. Budget-friendly portions available." }, { name: "Powerhouse Arena", type: "📚 Bookstore", cost: "Free", desc: "Stunning independent bookstore and event space in a converted factory building." }, { name: "Cobblestone Walk", type: "🚶 Walk", cost: "Free", desc: "Wander the original cobblestone streets under the Brooklyn Bridge — you'll feel transported to another era." }] },
      { name: "Park Slope", description: "Leafy brownstones, Prospect Park, farmers markets, and a laid-back family vibe", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop", spots: [{ name: "Prospect Park", type: "🌿 Park", cost: "Free", desc: "Brooklyn's beloved park — boathouse, meadows, bike paths, and free summer concerts." }, { name: "Brooklyn Museum", type: "🎨 Museum", cost: "Pay-what-you-wish 1st Sat", desc: "World-class collection in a stunning Beaux-Arts building. First Saturdays are free + fun." }, { name: "Brooklyn Botanic Garden", type: "🌸 Garden", cost: "Free Tues + select times", desc: "Japanese Garden, cherry blossoms in spring, rose garden — stunning any time of year." }, { name: "Grand Army Plaza Greenmarket", type: "🛒 Market", cost: "Free", desc: "Year-round farmers market with local produce, bread, honey, and flowers every Saturday." }, { name: "Fifth Avenue Shopping", type: "🛍️ Walk", cost: "Free to browse", desc: "Park Slope's Fifth Ave has indie bookshops, plant stores, vintage spots, and great local restaurants." }, { name: "Connecticut Muffin", type: "☕ Café", cost: "$3–8", desc: "Neighborhood breakfast spot with no pretense — the kind of place regulars go every single morning." }, { name: "Lefferts Historic House", type: "🏛️ Historic Site", cost: "Free", desc: "Free historic Dutch farmhouse in Prospect Park — great for a quick step back in time." }, { name: "Barclays Center Plaza", type: "🚶 Walk", cost: "Free", desc: "The plaza outside Barclays is often free with food trucks, live music, and community pop-ups." }] },
      { name: "Coney Island", description: "Classic boardwalk, historic amusement rides, beaches, and Nathan's Famous hot dogs", image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop", spots: [{ name: "Coney Island Beach", type: "🏖️ Beach", cost: "Free", desc: "3.5 miles of public beach — crowded but iconic in summer. Brighton Beach is quieter nearby." }, { name: "Luna Park", type: "🎡 Amusement", cost: "Pay per ride", desc: "Historic amusement park — ride the Cyclone roller coaster, in operation since 1927." }, { name: "New York Aquarium", type: "🐟 Attraction", cost: "$22.95", desc: "Sharks, sea lions, and ocean wonders right next to the beach." }, { name: "Coney Island Boardwalk", type: "🚶 Walk", cost: "Free", desc: "Classic American boardwalk — free to stroll with shops, food, and beach views." }, { name: "Nathan's Famous", type: "🌭 Food", cost: "$5–12", desc: "The original Nathan's hot dog stand since 1916. A New York rite of passage." }, { name: "Brighton Beach", type: "🏖️ Beach", cost: "Free", desc: "Less crowded than Coney, with a huge Russian community — great delis and bakeries nearby." }, { name: "Coney Island History Project", type: "🏛️ Museum", cost: "Free", desc: "Tiny free museum with fascinating photos and artifacts of Coney's history. Open in summer." }, { name: "Steeplechase Plaza", type: "🎭 Outdoor", cost: "Free", desc: "Free outdoor concerts, circus performances, and community events throughout the summer season." }] },
      { name: "Brooklyn Nightlife", description: "From dive bars in Bushwick to rooftop clubs in Williamsburg — Brooklyn's nights go hard", image: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=400&h=300&fit=crop", spots: [{ name: "Elsewhere (Bushwick)", type: "🎶 Club", cost: "$15–25", desc: "Three-floor venue with multiple stages, a huge rooftop, and the best underground electronic music nights in NYC. Always packed." }, { name: "House of Yes (Ridgewood)", type: "🎭 Club", cost: "$20–30", desc: "Immersive performance club with circus acts, drag shows, and themed nights. Incredibly creative and totally unique." }, { name: "Nowadays (Ridgewood)", type: "🌿 Club", cost: "$15–25", desc: "Garden dance floor, great DJs, beloved by locals. Some of the best outdoor sets in the city during summer." }, { name: "Bossa Nova Civic Club", type: "🎵 Club", cost: "$10–20", desc: "Tiny legendary underground techno club in Bushwick. No photos, serious music, open until 8am weekends." }, { name: "Brooklyn Bowl", type: "🎳 Venue", cost: "Varies", desc: "Live music + bowling + great food in Williamsburg. A surprisingly fun combo that works perfectly." }, { name: "Output (Williamsburg)", type: "🎶 Club", cost: "$20–35", desc: "World-class sound system on the waterfront. Friday & Saturday deep house and techno nights are legendary." }, { name: "The Bell House (Gowanus)", type: "🎵 Music", cost: "$10–20", desc: "Mid-size music venue and bar with a great back room — touring indie bands, comedy, and quiz nights." }, { name: "Maison Premiere (Williamsburg)", type: "🍹 Bar", cost: "$15–25 drinks", desc: "Gorgeous oyster bar and cocktail lounge with New Orleans vibes. One of Brooklyn's most beautiful spots." }] },
      { name: "Brooklyn Day Activities", description: "Outdoor adventures, cultural spots, and fun things to do from sunrise to sunset in Brooklyn", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop", spots: [{ name: "Brooklyn Botanic Garden", type: "🌸 Garden", cost: "Free Tues + select times", desc: "Japanese Garden, cherry blossoms in spring, rose garden — stunning any time of year." }, { name: "Prospect Park Boathouse", type: "🚣 Activity", cost: "Free pedal boats Sat/Sun", desc: "Rent a pedal boat or take a free volunteer-guided row on Prospect Park Lake on weekends." }, { name: "Brooklyn Flea (Williamsburg)", type: "🛍️ Market", cost: "Free entry", desc: "One of the best flea markets in the country — vintage furniture, clothing, jewelry, and food on weekends." }, { name: "Smorgasburg", type: "🍽️ Food Market", cost: "Free entry", desc: "100+ local food vendors every weekend at East River State Park — don't miss the original ramen burger." }, { name: "Brooklyn Museum", type: "🎨 Museum", cost: "Pay-what-you-wish 1st Sat", desc: "World-class collection in a stunning Beaux-Arts building. First Saturdays are free with live DJs and events." }, { name: "Greenpoint Avenue Explore", type: "🚶 Walk", cost: "Free", desc: "Wander Greenpoint's main strip for Polish bakeries, indie coffee shops, and a very local Brooklyn vibe." }, { name: "The Narrows (Bay Ridge)", type: "🌊 Waterfront", cost: "Free", desc: "Walk along the waterfront in Bay Ridge under the Verrazzano Bridge for spectacular harbor views." }, { name: "Red Hook Waterfront", type: "🌊 Walk", cost: "Free", desc: "Stroll the Red Hook waterfront for Statue of Liberty views, food vendors, and a very un-touristy NYC feel." }] },
    ],
  },
  {
    id: "queens", name: "Queens", tagline: "The world's most diverse borough",
    description: "Over 160 languages spoken, incredible international food, Flushing Meadows, and Rockaway Beach",
    image: "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=600&h=400&fit=crop", emoji: "🌏",
    neighborhoods: [
      { name: "Flushing", description: "Authentic Asian cuisine, bustling markets, and one of the largest Chinatowns outside Asia", image: "https://images.unsplash.com/photo-1555529771-835f59fc5ef7?w=400&h=300&fit=crop", spots: [{ name: "New World Mall Food Court", type: "🍜 Dining", cost: "$5–15", desc: "Incredible, cheap Asian food — dumplings, noodles, bubble tea and more from dozens of stalls." }, { name: "Flushing Meadows Corona Park", type: "🌿 Park", cost: "Free", desc: "Massive park with a lake, Unisphere sculpture, and weekend Latin music and activities." }, { name: "Queens Museum", type: "🎨 Museum", cost: "Pay-what-you-wish", desc: "Home to the 1964 World's Fair Panorama of NYC — a 9,335 sq ft scale model of every building in NYC." }, { name: "Queens Botanical Garden", type: "🌸 Garden", cost: "$6 ($4 for NYC residents)", desc: "Peaceful 39-acre garden in the middle of the city — great escape from the hustle." }, { name: "Flushing Library", type: "📚 Library", cost: "Free", desc: "One of the busiest libraries in the country — free WiFi, classes, and resources in dozens of languages." }, { name: "Mitchell Linden Café Row", type: "☕ Café", cost: "$3–10", desc: "Side streets off Main St have dozens of casual Taiwanese, Chinese, and Korean cafés. Explore and pick one." }, { name: "Kissena Park", type: "🌿 Park", cost: "Free", desc: "Serene neighborhood park with a pond, volleyball courts, and lovely walking trails." }, { name: "Unisphere (1964 World's Fair)", type: "🏛️ Landmark", cost: "Free", desc: "The 140-foot stainless steel globe is one of NYC's most iconic structures. Free to visit anytime." }] },
      { name: "Astoria", description: "Greek and Mediterranean food, live music venues, and a tight-knit arts community", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop", spots: [{ name: "Socrates Sculpture Park", type: "🎨 Park", cost: "Free", desc: "Outdoor sculpture park on the waterfront with rotating artist installations — always fresh." }, { name: "Museum of the Moving Image", type: "🎬 Museum", cost: "$20 (free Fri evenings)", desc: "Fascinating look at film, TV, and digital media — fun for non-film buffs too." }, { name: "Astoria Park", type: "🌿 Park", cost: "Free", desc: "Stunning views of the Hell Gate Bridge and East River. Great outdoor pool in summer." }, { name: "31st Street Food Strip", type: "🍴 Dining", cost: "Varies", desc: "Authentic Greek restaurants and bakeries — try the baklava and spanakopita for cheap." }, { name: "Astoria Park Pool", type: "🏊 Activity", cost: "Free (summer)", desc: "NYC Parks' largest outdoor pool, free to all NYC residents in summer — a hidden gem." }, { name: "Broadway Astoria", type: "🚶 Walk", cost: "Free", desc: "The neighborhood's main commercial strip — diverse restaurants, shops, and real neighborhood energy." }, { name: "Steinway Street", type: "🛍️ Walk", cost: "Free", desc: "Vibrant Middle Eastern commercial strip — great bakeries, spice shops, and very cheap eats." }, { name: "Bohemian Hall Beer Garden", type: "🍺 Bar", cost: "$5–15", desc: "NYC's oldest and largest beer garden, open since 1910. Casual, spacious, and very affordable." }] },
      { name: "Rockaway Beach", description: "NYC's favorite summer escape — real waves, surfing, boardwalk, and seafood", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop", spots: [{ name: "Rockaway Beach", type: "🏖️ Beach", cost: "Free", desc: "NYC's best surf beach with designated surfing sections. Free and accessible by A train." }, { name: "The Rockaway Hotel Rooftop", type: "🍹 Bar", cost: "Free to visit", desc: "Rooftop bar with ocean views and sunset cocktails — dress casually, very chill vibe." }, { name: "Rockaway Beach Surf Club", type: "🏄 Activity", cost: "Lessons from $100", desc: "Take a surfing lesson in NYC's only surf-able waves — beginner-friendly." }, { name: "Fort Tilden", type: "🌿 Nature", cost: "Free", desc: "Abandoned military fort with dunes, hiking trails, and secluded beaches. Very peaceful." }, { name: "Rippers", type: "🌭 Food", cost: "$5–15", desc: "Classic beachfront bar and grill — lobster rolls, burgers, and cold beers with ocean views." }, { name: "Jacob Riis Park", type: "🏖️ Park", cost: "Free", desc: "Beautiful free public beach with Art Deco bathhouse, volleyball, and very few tourists." }, { name: "Bungalow Bar", type: "🍺 Bar", cost: "$5–15", desc: "Dive-ish beachfront bar with a very local vibe — sit outside on a summer evening." }, { name: "Rockaway Taco", type: "🌮 Food", cost: "$5–12", desc: "Legendary fish tacos served right by the beach. The line is worth it every single time." }] },
      { name: "Queens Nightlife", description: "Astoria beer gardens, Jackson Heights clubs, and some of the most authentic late-night scenes in NYC", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=300&fit=crop", spots: [{ name: "Bohemian Hall Beer Garden (Astoria)", type: "🍺 Bar", cost: "$5–15", desc: "NYC's oldest and largest beer garden open since 1910. Huge outdoor space, affordable, and incredibly fun on weekend nights." }, { name: "Terraza 7 (Jackson Heights)", type: "🎵 Jazz", cost: "$10–15", desc: "Intimate jazz bar in Jackson Heights — outstanding Latin jazz, great cocktails, and zero pretension." }, { name: "Nowadays (Ridgewood)", type: "🌿 Club", cost: "$15–25", desc: "Outdoor garden dance floor with some of NYC's best DJs. Beloved by serious music fans and always a great crowd." }, { name: "QXT's (Jackson Heights)", type: "🕺 Bar", cost: "Free–$10", desc: "Neighborhood LGBTQ+ bar that's been a Queens institution for decades — welcoming, cheap, and real." }, { name: "Sky Bar (Flushing)", type: "🎤 Bar", cost: "$10–20", desc: "Karaoke bar in Flushing open until 4am — multiple private rooms, great drink specials, always packed on weekends." }, { name: "Astoria Craft (Astoria)", type: "🍺 Bar", cost: "$6–15", desc: "Local craft beer bar with great rotating taps and a relaxed neighborhood vibe — perfect for a low-key night." }, { name: "Jackson Diner After Dark", type: "🍜 Late Night", cost: "$10–25", desc: "One of many spots in Jackson Heights serving late-night Indian food — perfect way to end a night in Queens." }, { name: "Rego Park Hookah Lounges", type: "💨 Lounge", cost: "$20–40", desc: "Several hookah lounges on Queens Blvd serving late nights with tea and shisha — popular with the Middle Eastern community." }] },
      { name: "Queens Day Activities", description: "World culture immersion, parks, food markets, and outdoor adventures without leaving the borough", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop", spots: [{ name: "Flushing Meadows Corona Park", type: "🌿 Park", cost: "Free", desc: "Massive park with a lake, the iconic Unisphere, and weekend sports and cultural events from dozens of communities." }, { name: "Jackson Heights Food Walk", type: "🍜 Walk", cost: "$5–20", desc: "Walk Roosevelt Ave in Jackson Heights for incredible Indian, Bangladeshi, Tibetan, and Colombian food — some of the world's best cheap eats." }, { name: "Queens Night Market", type: "🛍️ Market", cost: "Free entry", desc: "Saturday night market at QSCP with 100+ vendors representing 80+ countries. One of the best events in all of NYC." }, { name: "Socrates Sculpture Park", type: "🎨 Park", cost: "Free", desc: "Outdoor sculpture park on the Astoria waterfront with rotating artist installations — always fresh and interesting." }, { name: "Museum of the Moving Image", type: "🎬 Museum", cost: "$20 (free Fri evenings)", desc: "Fascinating look at film, TV, and digital media — far more fun than it sounds. Great for all ages." }, { name: "Astoria Park Pool", type: "🏊 Activity", cost: "Free (summer)", desc: "NYC Parks' largest outdoor pool, free to all NYC residents in summer — stunning views of Hell Gate Bridge." }, { name: "Long Island City Waterfront", type: "🌊 Walk", cost: "Free", desc: "Walk Gantry Plaza State Park in LIC for the most photogenic Manhattan skyline view in all of NYC." }, { name: "Queens Botanical Garden", type: "🌸 Garden", cost: "$6", desc: "Peaceful 39-acre garden — a great escape with beautiful seasonal plantings and a very local crowd." }] },
    ],
  },
  {
    id: "bronx", name: "The Bronx", tagline: "Birthplace of hip-hop and so much more",
    description: "The New York Botanical Garden, amazing Bronx Zoo, Arthur Avenue Italian market, and hip-hop history",
    image: "https://images.unsplash.com/photo-1555724611-8d88b1de4bc0?w=600&h=400&fit=crop", emoji: "🎵",
    neighborhoods: [
      { name: "Fordham & Arthur Avenue", description: "The 'Real Little Italy' — old-school Italian bakeries, delis, and family restaurants", image: "https://images.unsplash.com/photo-1534080564842-39a9e635b032?w=400&h=300&fit=crop", spots: [{ name: "Arthur Avenue Retail Market", type: "🧀 Market", cost: "Free entry", desc: "Indoor market with fresh pasta, cheese, meats, and produce — more authentic than Manhattan's Little Italy." }, { name: "Bronx Zoo", type: "🦁 Zoo", cost: "From $25 (free Wednesdays)", desc: "One of the largest urban zoos in the world — over 6,000 animals on 265 acres." }, { name: "New York Botanical Garden", type: "🌸 Garden", cost: "$35 (free Wednesdays)", desc: "250 stunning acres with world-class garden collections and seasonal exhibitions." }, { name: "Fordham University Campus", type: "🏛️ Campus", cost: "Free to walk", desc: "Gothic stone buildings — walk the beautiful campus freely, open to the public." }, { name: "Mike's Deli (Arthur Ave)", type: "🥪 Food", cost: "$8–18", desc: "The legendary deli on Arthur Ave with towering hero sandwiches. A Bronx institution." }, { name: "Belmont Playground", type: "🌿 Park", cost: "Free", desc: "Local community park with courts, benches, and the sounds of a real Bronx neighborhood." }, { name: "Egidio Pastry Shop", type: "🍰 Café", cost: "$3–8", desc: "Old-school Italian bakery on Arthur Ave — cannolis, sfogliatelle, and espresso since forever." }, { name: "Bronx Community College Campus", type: "🏛️ Architecture", cost: "Free", desc: "Stanford White-designed campus on a hill — stunning architecture and sweeping views of the borough." }] },
      { name: "South Bronx & Hip-Hop Heritage", description: "The birthplace of hip-hop culture, street art, and community murals", image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop", spots: [{ name: "Universal Hip Hop Museum", type: "🎵 Museum", cost: "Check for current pricing", desc: "Celebrating the birth and global impact of hip-hop culture — a must for music fans." }, { name: "1520 Sedgwick Avenue", type: "🏛️ Landmark", cost: "Free to view", desc: "The apartment building where DJ Kool Herc threw the first hip-hop party in 1973. Walk by and feel the history." }, { name: "Andrew Freedman Home", type: "🎨 Gallery", cost: "Free events", desc: "Historic building with free community arts events and exhibitions from local artists." }, { name: "Bronx River Trail", type: "🚴 Trail", cost: "Free", desc: "Scenic greenway along the Bronx River — great for biking, jogging, or a peaceful walk." }, { name: "Lincoln Hospital Area Murals", type: "🎨 Street Art", cost: "Free", desc: "Walk the surrounding blocks to see massive, powerful community murals that tell the Bronx story." }, { name: "Hunts Point Produce Market", type: "🥦 Market", cost: "Free to visit surroundings", desc: "One of the largest food distribution markets in the world — the neighborhood around it has real character." }, { name: "Crotona Park", type: "🌿 Park", cost: "Free", desc: "Large South Bronx park with a lake, ball fields, and one of NYC's few natural swimming ponds." }, { name: "Third Avenue Strip", type: "🚶 Walk", cost: "Free", desc: "Walk the commercial heart of the South Bronx — Caribbean food, music shops, botanicas, and community life." }] },
      { name: "Bronx Nightlife", description: "Live salsa, late-night Dominican spots, and the real Bronx bar scene tourists never find", image: "https://images.unsplash.com/photo-1545996124-0501ebae84d0?w=400&h=300&fit=crop", spots: [{ name: "Hostos Center for the Arts", type: "🎭 Venue", cost: "$10–35", desc: "World-class Latin music, dance, and theater performances in the South Bronx — affordable and spectacular." }, { name: "Jimmy's Bronx Café", type: "🎵 Bar", cost: "$10–20", desc: "Live salsa and merengue most weekend nights — a real Bronx institution for dancing and fun." }, { name: "Yankee Tavern (near Stadium)", type: "🍺 Bar", cost: "$5–15", desc: "Historic bar open since 1923 near Yankee Stadium — great for game nights or just a cold beer in a real neighborhood spot." }, { name: "Mott Haven Bar & Grill", type: "🍸 Bar", cost: "$8–18", desc: "Trendy bar in the rapidly changing Mott Haven neighborhood — craft cocktails, good food, interesting crowd." }, { name: "Bronx Night Market", type: "🌃 Market", cost: "Free entry", desc: "Weekend night market celebrating Bronx food culture — over 50 local vendors, live music, and community energy." }, { name: "Fordham Road Bar Crawl", type: "🚶 Nightlife", cost: "Varies", desc: "Multiple low-key Caribbean and Dominican bars along Fordham Rd — the most authentic Bronx nightlife experience." }, { name: "The Lit Bar (Mott Haven)", type: "🍷 Bar", cost: "$10–20", desc: "Wine bar + independent bookstore in one — a beloved community gathering place, especially on weekend evenings." }, { name: "Castle Hill Latin Clubs", type: "🕺 Club", cost: "$10–20", desc: "Bachata and salsa clubs in Castle Hill open late — some of the best Latin dancing you'll find in NYC." }] },
      { name: "Bronx Day Activities", description: "World-class gardens, the Bronx Zoo, City Island, and parks that feel nothing like NYC", image: "https://images.unsplash.com/photo-1555724611-8d88b1de4bc0?w=400&h=300&fit=crop", spots: [{ name: "Bronx Zoo", type: "🦁 Zoo", cost: "From $25 (free Wednesdays)", desc: "One of the largest urban zoos in the world — over 6,000 animals on 265 acres. Free Wednesdays are crowded but worth it." }, { name: "New York Botanical Garden", type: "🌸 Garden", cost: "$35 (free Wednesdays)", desc: "250 stunning acres with world-class garden collections and seasonal exhibitions. Don't skip the Enid Haupt Conservatory." }, { name: "City Island", type: "⛵ Waterfront", cost: "Free to visit", desc: "A tiny New England-style fishing village inside the Bronx. Fresh seafood restaurants, boat yards, and a completely different vibe." }, { name: "Van Cortlandt Park", type: "🌿 Park", cost: "Free", desc: "NYC's third-largest park with trails, a lake, a golf course, and a cross-country course used by runners since 1913." }, { name: "Pelham Bay Park", type: "🌿 Nature", cost: "Free", desc: "NYC's largest park at 2,772 acres — hiking trails, Orchard Beach, and genuine wilderness within city limits." }, { name: "Poe Cottage (Edgar Allan Poe)", type: "🏛️ Museum", cost: "$5", desc: "The tiny cottage where Poe spent his final years and wrote some of his best work — a surprisingly moving experience." }, { name: "Wave Hill (Riverdale)", type: "🌸 Garden", cost: "$10 (free Tues + Sat AM)", desc: "Stunning garden estate overlooking the Hudson and Palisades — one of the most beautiful views in all of NYC." }, { name: "Arthur Avenue Italian Market", type: "🧀 Market", cost: "Free to browse", desc: "Walk through the 'Real Little Italy' — old-school Italian bakeries, fresh pasta makers, and cheese shops that have been here for generations." }] },
    ],
  },
  {
    id: "staten-island", name: "Staten Island", tagline: "NYC's hidden gem borough",
    description: "Free ferry views of the Statue of Liberty, Snug Harbor, historic village, and beautiful waterfront parks",
    image: "https://images.unsplash.com/photo-1601370552761-e4ee8b9d3773?w=600&h=400&fit=crop", emoji: "⛴️",
    neighborhoods: [
      { name: "St. George & Ferry Terminal", description: "The arrival point — free ferry views, waterfront arts, and Snug Harbor", image: "https://images.unsplash.com/photo-1516557595335-b1b49fcb5b3d?w=400&h=300&fit=crop", spots: [{ name: "Staten Island Ferry", type: "⛴️ Ferry", cost: "FREE", desc: "Best free attraction in NYC — take a round trip for stunning Statue of Liberty and Manhattan skyline views." }, { name: "Snug Harbor Cultural Center", type: "🎨 Park & Museum", cost: "Free grounds, $8 museum", desc: "83-acre park with Greek Revival buildings, Chinese Scholar's Garden, and free community events." }, { name: "Staten Island Museum", type: "🏛️ Museum", cost: "$10 (free Sundays)", desc: "Natural history, art, and culture of Staten Island — a real gem that most New Yorkers haven't seen." }, { name: "St. George Theatre", type: "🎭 Theater", cost: "Varies by show", desc: "Beautifully restored 1929 theater — catch an affordable show in a stunning historic space." }, { name: "Richmond Terrace Walk", type: "🌊 Waterfront", cost: "Free", desc: "Walk along the waterfront from the ferry for views back to Manhattan and the harbor." }, { name: "Edgewater Hall", type: "🍺 Bar", cost: "$5–15", desc: "Classic no-frills neighborhood bar near the ferry — a real local institution." }, { name: "New Brighton Park", type: "🌿 Park", cost: "Free", desc: "Quiet neighborhood park with waterfront access and a very different pace than Manhattan." }, { name: "Wu-Tang Clan Murals Tour", type: "🎨 Street Art", cost: "Free", desc: "Walk around Park Hill and Stapleton to see murals celebrating Staten Island's most famous sons." }] },
      { name: "Historic Richmond Town", description: "Living history museum of colonial-era New York on 100 acres of green space", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop", spots: [{ name: "Historic Richmond Town", type: "🏛️ Museum Village", cost: "$10", desc: "28 historic buildings — live demonstrations of colonial-era life in what was once New York." }, { name: "LaTourette Park & Golf", type: "🌿 Park", cost: "Free to hike", desc: "Over 500 acres of forest with hiking trails, a historic manor house, and real peace and quiet." }, { name: "Clay Pit Ponds", type: "🌿 Nature", cost: "Free", desc: "NYC's only state park preserve — spring-fed streams, birds, and total silence. Unreal inside the city." }, { name: "Jacques Marchais Museum of Tibetan Art", type: "🎨 Museum", cost: "$10", desc: "A unique hillside museum of Tibetan Buddhist art — unexpected and beautiful." }, { name: "Garibaldi-Meucci Museum", type: "🏛️ Museum", cost: "$5 suggested", desc: "Historic cottage where Italian patriots lived — a fascinating, very off-the-beaten-path experience." }, { name: "High Rock Park", type: "🌿 Nature", cost: "Free", desc: "90 acres of forest, ponds, and wetlands in the middle of Staten Island — bring binoculars." }, { name: "Richmond Town Tavern", type: "🍺 Historic Site", cost: "Free to view", desc: "Original 18th century tavern — one of the oldest surviving structures in NYC." }, { name: "Snug Harbor Farmer's Market", type: "🥕 Market", cost: "Free", desc: "Weekend farmers market on the Snug Harbor grounds — great local produce and community vibe." }] },
      { name: "Staten Island Nightlife & Activities", description: "Chill waterfront spots, DIY shows, and community events that Staten Island locals actually love", image: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=400&h=300&fit=crop", spots: [{ name: "Adobe Blues (New Brighton)", type: "🎵 Bar", cost: "$5–15", desc: "Live blues and roots music most weekends — small, intimate bar with a real neighborhood feel." }, { name: "Holding Company Bar", type: "🍺 Bar", cost: "$5–12", desc: "Popular local dive bar with cheap beer, darts, and pool — a true Staten Island gathering spot." }, { name: "Cargo Café", type: "🎭 Bar", cost: "$5–15", desc: "Eclectic bar with live music, drag shows, and themed events — Staten Island's most creative nightlife spot." }, { name: "Snug Harbor Summer Concerts", type: "🎶 Outdoor", cost: "Free–$10", desc: "Free and low-cost outdoor concerts on the beautiful Snug Harbor grounds throughout summer." }, { name: "Staten Island Yankees Game", type: "⚾ Sports", cost: "$10–20", desc: "Watch minor league baseball at Richmond County Bank Ballpark with stunning Manhattan skyline views across the harbor." }, { name: "Fort Wadsworth (Sunrise Hike)", type: "🌅 Activity", cost: "Free", desc: "Hike to Fort Wadsworth at sunrise for the most incredible unobstructed view of the Verrazano Bridge and harbor." }, { name: "Staten Island Escape Rooms", type: "🔐 Activity", cost: "$25–35 per person", desc: "Several escape room venues around the borough — perfect for a group activity on a rainy evening." }, { name: "North Shore Waterfront Walk", type: "🌊 Walk", cost: "Free", desc: "Walk the North Shore from St. George to Stapleton along the waterfront for harbor views and public art installations." }] },
    ],
  },
];

// ─── AI Chat Modal ─────────────────────────────────────────────────────────────
function AIChatModal({ onClose }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hey! I'm your NYC guide 🗽 Ask me anything — where to eat, what to do, hidden spots, date ideas, budget trips, or help planning your day!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;
    const newMessages = [...messages, { role: "user", text: q }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const history = newMessages.slice(-8).map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`).join("\n");

    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a friendly, knowledgeable NYC city guide. Keep responses concise (2–4 paragraphs max), practical, and specific to New York City. Include real place names, neighborhoods, and tips. Format key places in **bold**.

Conversation so far:
${history}

Respond to the latest user message as the NYC guide assistant.`,
      });
      setMessages(prev => [...prev, { role: "assistant", text: res }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "Sorry, I couldn't connect. Please try again!" }]);
    }
    setLoading(false);
  };

  const QUICK = ["Things to do tonight", "Cheap date spots", "Hidden gems", "Plan my day"];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-end"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
      onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="w-full max-w-lg flex flex-col"
        style={{ backgroundColor: "#ffffff", borderRadius: "28px 28px 0 0", height: "80vh", boxShadow: "0 -8px 48px rgba(0,0,0,0.25)" }}
        onClick={e => e.stopPropagation()}>

        {/* Handle + header */}
        <div className="shrink-0 px-5 pt-3 pb-4" style={{ borderBottom: "1px solid #E2E8F0" }}>
          <div className="flex justify-center mb-3">
            <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "var(--border-medium)" }} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-bold text-sm leading-tight" style={{ color: "#0F172A", fontFamily: "var(--font-serif)" }}>NYC AI Guide</p>
                <p className="text-xs" style={{ color: "#64748B" }}>Ask me anything about New York</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--bg-subtle)" }}>
              <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ backgroundColor: "#ffffff" }}>
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="w-7 h-7 rounded-xl shrink-0 mr-2 flex items-center justify-center text-sm"
                  style={{ background: "linear-gradient(135deg,#4F46E5,#7C3AED)" }}>🗽</div>
              )}
              <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed`}
                style={{
                  backgroundColor: m.role === "user" ? "#4F46E5" : "var(--bg-subtle)",
                  color: m.role === "user" ? "#fff" : "var(--text-primary)",
                  borderRadius: m.role === "user" ? "20px 20px 6px 20px" : "20px 20px 20px 6px",
                }}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-xl shrink-0 mr-2 flex items-center justify-center text-sm"
                style={{ background: "linear-gradient(135deg,#4F46E5,#7C3AED)" }}>🗽</div>
              <div className="px-4 py-3 rounded-2xl flex items-center gap-1.5"
                style={{ backgroundColor: "#F1F5F9", borderRadius: "20px 20px 20px 6px" }}>
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#4F46E5" }} />
                <span className="text-xs" style={{ color: "var(--text-hint)" }}>Thinking…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick chips */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide shrink-0" style={{ backgroundColor: "#ffffff" }}>
            {QUICK.map(q => (
              <button key={q} onClick={() => { setInput(q); }}
                className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ backgroundColor: "#F1F5F9", color: "#475569", border: "1px solid #E2E8F0" }}>
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="shrink-0 px-4 pb-6 pt-2" style={{ backgroundColor: "#ffffff" }}>
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl"
            style={{ backgroundColor: "#F1F5F9", border: "1px solid #E2E8F0" }}>
            <input
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Ask about NYC…"
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: "#0F172A", border: "none", minHeight: "unset", boxShadow: "none", padding: 0 }}
            />
            <button onClick={send} disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg,#4F46E5,#7C3AED)", opacity: !input.trim() ? 0.5 : 1 }}>
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function TripPlanner() {
  const [selectedBorough, setSelectedBorough] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAI, setShowAI] = useState(false);

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
      <BoroughDetail borough={selectedBorough} onBack={() => setSelectedBorough(null)} />
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
      {/* Header */}
      <div className="sticky top-0 z-30 px-4 pb-4"
        style={{ paddingTop: "max(env(safe-area-inset-top, 16px), 16px)", backgroundColor: "#ffffff", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-semibold" style={{ color: "var(--text-hint)" }}>Explore</p>
            <h1 className="text-2xl font-black leading-tight" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
              New York City
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {/* AI Chat Button */}
            <button
              onClick={() => setShowAI(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-bold"
              style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", color: "#fff", boxShadow: "0 4px 16px rgba(79,70,229,0.35)" }}>
              <Sparkles className="w-4 h-4" />
              <span>AI Guide</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl"
          style={{ backgroundColor: "#F1F5F9", border: "1px solid var(--border-light)" }}>
          <Search className="w-4 h-4 shrink-0" style={{ color: "var(--text-hint)" }} />
          <input
            type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search neighborhoods, spots…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--text-primary)", border: "none", minHeight: "unset", boxShadow: "none", padding: 0 }}
          />
        </div>
      </div>

      <div className="px-4 pt-5 pb-32">
        {!searchQuery && (
          <p className="text-sm mb-5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Discover hidden spots, free activities, local dining, libraries, markets, and community events — across all five boroughs.
          </p>
        )}

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
              style={{ height: 220, display: "block" }}>
              <img src={borough.image} alt={borough.name} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.7) 100%)" }} />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{borough.emoji}</span>
                      <h2 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-serif)" }}>{borough.name}</h2>
                    </div>
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>{borough.tagline}</p>
                  </div>
                  <div className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold"
                    style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "#fff", backdropFilter: "blur(8px)" }}>
                    {borough.neighborhoods.length} areas →
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* AI Chat Modal */}
      <AnimatePresence>
        {showAI && <AIChatModal onClose={() => setShowAI(false)} />}
      </AnimatePresence>
    </div>
  );
}