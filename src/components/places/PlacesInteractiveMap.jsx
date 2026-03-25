import React, { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, X, MapPin, Star, ExternalLink, Search, Navigation } from "lucide-react";

const CATEGORIES = [
  { key: "all",     label: "All",      emoji: "🗺️", color: "#4F46E5", bg: "#EEF2FF" },
  { key: "park",    label: "Parks",    emoji: "🌳", color: "#16A34A", bg: "#DCFCE7" },
  { key: "museum",  label: "Museums",  emoji: "🏛️", color: "#2563EB", bg: "#DBEAFE" },
  { key: "food",    label: "Food",     emoji: "🍔", color: "#DC2626", bg: "#FEE2E2" },
  { key: "beach",   label: "Beaches",  emoji: "🏖️", color: "#0891B2", bg: "#CFFAFE" },
  { key: "landmark",label: "Landmarks",emoji: "🏙️", color: "#9333EA", bg: "#F3E8FF" },
  { key: "zoo",     label: "Zoos",     emoji: "🦁", color: "#D97706", bg: "#FEF3C7" },
  { key: "garden",  label: "Gardens",  emoji: "🌸", color: "#DB2777", bg: "#FCE7F3" },
  { key: "sports",  label: "Sports",   emoji: "⚾", color: "#EA580C", bg: "#FED7AA" },
  { key: "shopping",label: "Shopping", emoji: "🛍️", color: "#7C3AED", bg: "#EDE9FE" },
];

const PLACES = [
  // Manhattan
  { id: 1,  name: "Central Park", category: "park", lat: 40.7851, lng: -73.9683, desc: "843-acre urban oasis with lakes, meadows, and iconic landmarks.", cost: "Free", rating: 4.9 },
  { id: 2,  name: "The Metropolitan Museum of Art", category: "museum", lat: 40.7794, lng: -73.9632, desc: "One of the world's greatest art museums spanning 5,000 years.", cost: "Pay-what-you-wish (NY residents)", rating: 4.9 },
  { id: 3,  name: "Statue of Liberty", category: "landmark", lat: 40.6892, lng: -74.0445, desc: "Iconic symbol of freedom in New York Harbor.", cost: "From $24 (ferry)", rating: 4.8 },
  { id: 4,  name: "The Museum of Modern Art", category: "museum", lat: 40.7614, lng: -73.9776, desc: "World-leading collection of modern and contemporary art.", cost: "$30", rating: 4.7 },
  { id: 5,  name: "Times Square", category: "landmark", lat: 40.7580, lng: -73.9855, desc: "The dazzling crossroads of the world — neon, billboards, and energy.", cost: "Free", rating: 4.6 },
  { id: 6,  name: "Empire State Building", category: "landmark", lat: 40.7484, lng: -73.9967, desc: "Iconic 102-floor Art Deco skyscraper with panoramic NYC views.", cost: "From $44", rating: 4.8 },
  { id: 7,  name: "Solomon R. Guggenheim Museum", category: "museum", lat: 40.7830, lng: -73.9590, desc: "Frank Lloyd Wright's spiraling masterpiece on Museum Mile.", cost: "$30", rating: 4.6 },
  { id: 8,  name: "The Plaza Hotel", category: "landmark", lat: 40.7648, lng: -73.9748, desc: "Grand Beaux-Arts landmark at the corner of Central Park South.", cost: "Free to visit lobby", rating: 4.7 },
  { id: 9,  name: "American Museum of Natural History", category: "museum", lat: 40.7813, lng: -73.9740, desc: "Dinosaurs, gems, ocean halls — one of the world's great natural history museums.", cost: "Pay-what-you-wish (NY residents)", rating: 4.8 },
  { id: 10, name: "Washington Square Park", category: "park", lat: 40.7308, lng: -73.9973, desc: "The living room of Greenwich Village — iconic arch and endless energy.", cost: "Free", rating: 4.8 },
  { id: 11, name: "The High Line", category: "park", lat: 40.7480, lng: -74.0048, desc: "Elevated park on former rail tracks with public art and Hudson views.", cost: "Free", rating: 4.8 },
  { id: 12, name: "Brooklyn Bridge", category: "landmark", lat: 40.7061, lng: -73.9969, desc: "Walk across NYC's most iconic bridge with stunning skyline views.", cost: "Free", rating: 4.9 },
  { id: 13, name: "One World Trade Center", category: "landmark", lat: 40.7127, lng: -74.0134, desc: "America's tallest building with an observatory 1,776 feet up.", cost: "From $46", rating: 4.7 },
  { id: 14, name: "Chelsea Market", category: "food", lat: 40.7424, lng: -74.0060, desc: "Iconic indoor food hall and shopping complex in a converted factory.", cost: "Free entry", rating: 4.7 },
  { id: 15, name: "The Vessel at Hudson Yards", category: "landmark", lat: 40.7540, lng: -74.0019, desc: "Honeycomb-like interactive art structure at Hudson Yards.", cost: "Free (timed entry)", rating: 4.5 },
  { id: 16, name: "Rockefeller Center", category: "landmark", lat: 40.7587, lng: -73.9787, desc: "Art Deco complex with Top of the Rock observatory and famous ice rink.", cost: "Free (Top of Rock from $40)", rating: 4.7 },
  { id: 17, name: "Lincoln Center", category: "landmark", lat: 40.7725, lng: -73.9836, desc: "World-class performing arts complex — free outdoor performances in summer.", cost: "Varies", rating: 4.8 },
  { id: 18, name: "Intrepid Sea, Air & Space Museum", category: "museum", lat: 40.7645, lng: -74.0027, desc: "Aircraft carrier turned museum with NASA space shuttle Enterprise.", cost: "$36", rating: 4.6 },
  { id: 19, name: "The Frick Collection", category: "museum", lat: 40.7713, lng: -73.9672, desc: "Intimate mansion museum with Old Masters collection on 5th Avenue.", cost: "$22", rating: 4.8 },
  { id: 20, name: "St. Patrick's Cathedral", category: "landmark", lat: 40.7586, lng: -73.9763, desc: "Stunning Gothic Revival cathedral in the heart of Midtown Manhattan.", cost: "Free", rating: 4.8 },
  { id: 21, name: "Chinatown", category: "food", lat: 40.7158, lng: -73.9970, desc: "Authentic Chinese community — best dim sum, dumplings and bubble tea.", cost: "Free to explore", rating: 4.7 },
  { id: 22, name: "Little Italy", category: "food", lat: 40.7193, lng: -73.9968, desc: "Classic Italian neighborhood with cannolis, espresso, and old-school charm.", cost: "Free to explore", rating: 4.5 },
  { id: 23, name: "SoHo", category: "shopping", lat: 40.7233, lng: -73.9973, desc: "Cast-iron architecture, boutique galleries, and upscale shopping on cobblestones.", cost: "Free to explore", rating: 4.7 },
  { id: 24, name: "Harlem", category: "landmark", lat: 40.8116, lng: -73.9465, desc: "Rich African-American heritage, jazz history, and soul food institutions.", cost: "Free to explore", rating: 4.7 },
  { id: 25, name: "Madison Square Garden", category: "sports", lat: 40.7505, lng: -73.9934, desc: "The world's most famous arena — Knicks, Rangers, concerts, boxing.", cost: "Varies by event", rating: 4.6 },
  { id: 26, name: "Bryant Park", category: "park", lat: 40.7536, lng: -73.9832, desc: "Midtown oasis with seasonal events — summer movies, winter ice skating.", cost: "Free", rating: 4.7 },
  { id: 27, name: "Museum of Natural History Planetarium", category: "museum", lat: 40.7815, lng: -73.9742, desc: "State-of-the-art digital planetarium with immersive space shows.", cost: "$17", rating: 4.7 },
  { id: 28, name: "9/11 Memorial & Museum", category: "museum", lat: 40.7115, lng: -74.0130, desc: "Moving tribute to the lives lost on September 11 — reflecting pools and museum.", cost: "$30 museum, Memorial free", rating: 4.9 },
  { id: 29, name: "Whitney Museum of American Art", category: "museum", lat: 40.7396, lng: -74.0089, desc: "Premier American art museum in the Meatpacking District with Hudson River views.", cost: "$30", rating: 4.6 },
  { id: 30, name: "Grand Central Terminal", category: "landmark", lat: 40.7527, lng: -73.9772, desc: "Beaux-Arts masterpiece — the world's most beautiful train station.", cost: "Free", rating: 4.8 },

  // Brooklyn
  { id: 31, name: "Brooklyn Museum", category: "museum", lat: 40.6712, lng: -73.9636, desc: "World-class collection in a stunning Beaux-Arts building. First Saturdays are free.", cost: "Pay-what-you-wish 1st Sat", rating: 4.7 },
  { id: 32, name: "Coney Island", category: "beach", lat: 40.5749, lng: -73.9859, desc: "Classic boardwalk, Luna Park rides, and NYC's most iconic beach.", cost: "Free (rides extra)", rating: 4.6 },
  { id: 33, name: "Brooklyn Botanic Garden", category: "garden", lat: 40.6700, lng: -73.9596, desc: "50 acres of stunning gardens including the beloved Japanese Hill-and-Pond Garden.", cost: "Free Tues + select times", rating: 4.8 },
  { id: 34, name: "Prospect Park", category: "park", lat: 40.6602, lng: -73.9690, desc: "Brooklyn's beloved 585-acre park — boathouse, meadows, free summer concerts.", cost: "Free", rating: 4.9 },
  { id: 35, name: "New York Transit Museum", category: "museum", lat: 40.6898, lng: -73.9897, desc: "Inside a decommissioned subway station — vintage cars and transit history.", cost: "$10", rating: 4.7 },
  { id: 36, name: "New York Aquarium", category: "zoo", lat: 40.5744, lng: -73.9758, desc: "Ocean wonders including sharks, sea lions, and penguins right on the boardwalk.", cost: "$22.95", rating: 4.5 },
  { id: 37, name: "The Green-Wood Cemetery", category: "park", lat: 40.6517, lng: -73.9901, desc: "Victorian cemetery with stunning hilltop views, remarkable monuments, and free tours.", cost: "Free", rating: 4.8 },
  { id: 38, name: "Brooklyn Children's Museum", category: "museum", lat: 40.6714, lng: -73.9449, desc: "World's first children's museum — hands-on exhibits for kids of all ages.", cost: "$15", rating: 4.6 },
  { id: 39, name: "Jane's Carousel", category: "landmark", lat: 40.7024, lng: -73.9963, desc: "Restored 1922 carousel in a stunning glass pavilion under the Brooklyn Bridge.", cost: "$3", rating: 4.8 },
  { id: 40, name: "DUMBO", category: "landmark", lat: 40.7033, lng: -73.9881, desc: "Cobblestone streets, galleries, Brooklyn Bridge views, and indie boutiques.", cost: "Free to explore", rating: 4.8 },
  { id: 41, name: "Smorgasburg", category: "food", lat: 40.7157, lng: -73.9630, desc: "100+ local food vendors with Manhattan skyline views every weekend.", cost: "Free entry", rating: 4.7 },
  { id: 42, name: "Brooklyn Bridge Park", category: "park", lat: 40.6997, lng: -73.9962, desc: "85-acre waterfront park with piers, kayaking, mini-golf, and Manhattan views.", cost: "Free", rating: 4.9 },
  { id: 43, name: "Industry City", category: "shopping", lat: 40.6537, lng: -74.0136, desc: "Creative campus in Sunset Park with shops, food halls, and maker spaces.", cost: "Free entry", rating: 4.5 },
  { id: 44, name: "Barclays Center", category: "sports", lat: 40.6826, lng: -73.9754, desc: "State-of-the-art arena — Nets basketball, Islanders hockey, top concerts.", cost: "Varies by event", rating: 4.5 },
  { id: 45, name: "Williamsburg", category: "shopping", lat: 40.7081, lng: -73.9571, desc: "Brooklyn's coolest neighborhood — vintage shops, rooftop bars, murals, and brunch.", cost: "Free to explore", rating: 4.8 },

  // The Bronx
  { id: 46, name: "Holiday Train Show at New York Botanical Garden", category: "garden", lat: 40.8628, lng: -73.8781, desc: "Beloved annual show with model trains running through miniature NYC landmarks made of natural materials.", cost: "$23–$30", rating: 4.9 },
  { id: 47, name: "Pelham Bay Park", category: "park", lat: 40.8699, lng: -73.7957, desc: "NYC's largest park — 2,772 acres with forests, marshes, and Orchard Beach.", cost: "Free", rating: 4.7 },
  { id: 48, name: "Orchard Beach", category: "beach", lat: 40.8667, lng: -73.7929, desc: "The 'Riviera of the Bronx' — crescent-shaped beach on Long Island Sound.", cost: "Free ($8 parking)", rating: 4.3 },
  { id: 49, name: "New York Botanical Garden", category: "garden", lat: 40.8628, lng: -73.8781, desc: "250 acres of stunning botanical collections — world-class greenhouses and seasonal exhibitions.", cost: "$35 (free Wed)", rating: 4.9 },
  { id: 50, name: "Bronx Zoo", category: "zoo", lat: 40.8506, lng: -73.8769, desc: "One of the world's largest urban zoos — 265 acres with 6,000+ animals.", cost: "From $25 (free Wed)", rating: 4.7 },
  { id: 51, name: "Yankee Stadium", category: "sports", lat: 40.8296, lng: -73.9262, desc: "Home of the New York Yankees — tours available year-round, games in season.", cost: "Tours from $25, games vary", rating: 4.7 },
  { id: 52, name: "Wave Hill Public Garden", category: "garden", lat: 40.8986, lng: -73.9120, desc: "Breathtaking 28-acre public garden overlooking the Hudson River and Palisades.", cost: "$10 ($4 seniors)", rating: 4.8 },
  { id: 53, name: "The Bronx Museum of the Arts", category: "museum", lat: 40.8219, lng: -73.9219, desc: "Contemporary and modern art celebrating Bronx culture and global artists.", cost: "Free", rating: 4.4 },
  { id: 54, name: "Van Cortlandt Park", category: "park", lat: 40.8936, lng: -73.8886, desc: "NYC's third-largest park with golf, cricket, cross-country trails, and a historic house.", cost: "Free", rating: 4.6 },
  { id: 55, name: "City Island", category: "food", lat: 40.8480, lng: -73.7872, desc: "New England-style fishing village in the Bronx — famous for fresh seafood restaurants.", cost: "Free to visit", rating: 4.6 },
  { id: 56, name: "Arthur Avenue Market", category: "food", lat: 40.8548, lng: -73.8839, desc: "The 'Real Little Italy' — authentic Italian delis, bakeries, and fresh pasta shops.", cost: "Free to browse", rating: 4.8 },
  { id: 57, name: "Edgar Allan Poe Cottage", category: "museum", lat: 40.8676, lng: -73.8982, desc: "The tiny cottage where Poe wrote his final poems — a National Historic Landmark.", cost: "$8", rating: 4.4 },

  // Queens
  { id: 58, name: "Flushing Meadows Corona Park", category: "park", lat: 40.7282, lng: -73.8448, desc: "NYC's second-largest park — home to the iconic Unisphere and 1964 World's Fair legacy.", cost: "Free", rating: 4.7 },
  { id: 59, name: "Museum of the Moving Image", category: "museum", lat: 40.7563, lng: -73.9307, desc: "Fascinating museum exploring the art and history of film, TV, and digital media.", cost: "$20 (free Fri evenings)", rating: 4.6 },
  { id: 60, name: "New York Hall of Science", category: "museum", lat: 40.7466, lng: -73.8467, desc: "Hands-on science museum with outdoor science playground — great for all ages.", cost: "$18", rating: 4.6 },
  { id: 61, name: "Astoria Park", category: "park", lat: 40.7793, lng: -73.9304, desc: "Scenic park under the Hell Gate Bridge with NYC's largest outdoor pool.", cost: "Free (pool free in summer)", rating: 4.7 },
  { id: 62, name: "Queens Zoo", category: "zoo", lat: 40.7476, lng: -73.8456, desc: "Small, beautiful zoo in Flushing Meadows focusing on North American animals.", cost: "$10.95", rating: 4.4 },
  { id: 63, name: "Gantry Plaza State Park", category: "park", lat: 40.7470, lng: -73.9575, desc: "Waterfront park with restored gantries, stunning Manhattan views, and esplanade.", cost: "Free", rating: 4.8 },
  { id: 64, name: "Citi Field", category: "sports", lat: 40.7571, lng: -73.8458, desc: "Home of the New York Mets — modern ballpark with great food and fan experience.", cost: "Tickets from $15", rating: 4.5 },
  { id: 65, name: "The Noguchi Museum", category: "museum", lat: 40.7693, lng: -73.9368, desc: "Serene sculpture museum in the artist's former studio — a true hidden gem.", cost: "$10", rating: 4.7 },
  { id: 66, name: "USTA Billie Jean King Tennis Center", category: "sports", lat: 40.7498, lng: -73.8486, desc: "Home of the US Open — tours available, largest tennis stadium in the world.", cost: "Tours $20, US Open varies", rating: 4.6 },
  { id: 67, name: "Jacob Riis Park", category: "beach", lat: 40.5628, lng: -73.8783, desc: "Beautiful public beach with Art Deco bathhouse, volleyball, and boardwalk — very few tourists.", cost: "Free", rating: 4.7 },
  { id: 68, name: "Rockaway Beach", category: "beach", lat: 40.5827, lng: -73.8185, desc: "NYC's best surf beach — accessible by A train with real waves and a great boardwalk.", cost: "Free", rating: 4.7 },
  { id: 69, name: "Queens Museum", category: "museum", lat: 40.7465, lng: -73.8468, desc: "Home to the 9,335 sq ft Panorama of NYC — a detailed scale model of every building.", cost: "Pay-what-you-wish", rating: 4.5 },
  { id: 70, name: "MoMA PS1", category: "museum", lat: 40.7456, lng: -73.9465, desc: "Leading contemporary art museum in a converted school building — adventurous programming.", cost: "$10 (free with MoMA ticket)", rating: 4.5 },
  { id: 71, name: "Queens Botanical Garden", category: "garden", lat: 40.7472, lng: -73.8298, desc: "39-acre garden in Flushing — fragrant rose garden, bee garden, and compost learning center.", cost: "$6", rating: 4.4 },
  { id: 72, name: "Queens County Farm Museum", category: "museum", lat: 40.7478, lng: -73.7429, desc: "Working farm on 47 acres — the longest continually farmed site in New York State.", cost: "Free (small fees for some programs)", rating: 4.5 },
  { id: 73, name: "Fort Totten Park", category: "park", lat: 40.7912, lng: -73.7879, desc: "Historic military fort with waterfront trails, wildlife, and stunning Sound views.", cost: "Free", rating: 4.6 },
  { id: 74, name: "Cunningham Park", category: "park", lat: 40.7274, lng: -73.7586, desc: "358-acre park in Fresh Meadows with tennis, hiking trails, and picnic areas.", cost: "Free", rating: 4.5 },
  { id: 75, name: "Queens Center Mall", category: "shopping", lat: 40.7344, lng: -73.8699, desc: "Major shopping destination in Elmhurst with 150+ stores in the heart of diverse Queens.", cost: "Free entry", rating: 4.2 },
  { id: 76, name: "Louis Armstrong House Museum", category: "museum", lat: 40.7556, lng: -73.8595, desc: "The preserved home of jazz legend Louis Armstrong in Corona, Queens — a must for music lovers.", cost: "$12", rating: 4.7 },
  { id: 77, name: "Socrates Sculpture Park", category: "park", lat: 40.7693, lng: -73.9388, desc: "Outdoor sculpture park on the East River waterfront with rotating large-scale installations.", cost: "Free", rating: 4.7 },
  { id: 78, name: "Jackson Diner (Jackson Heights)", category: "food", lat: 40.7472, lng: -73.8913, desc: "Jackson Heights has the best Indian food outside India — Diwali lights and incredible street eats.", cost: "Free to explore", rating: 4.8 },
  { id: 79, name: "Queens Night Market", category: "food", lat: 40.7468, lng: -73.8447, desc: "80+ vendors from 80+ countries at Flushing Meadows — all dishes under $6.", cost: "Free entry", rating: 4.8 },

  // Staten Island
  { id: 80, name: "Staten Island Ferry Terminal", category: "landmark", lat: 40.6437, lng: -74.0735, desc: "Free ferry with stunning views of Manhattan skyline and Statue of Liberty.", cost: "FREE", rating: 4.9 },
  { id: 81, name: "Snug Harbor Cultural Center", category: "garden", lat: 40.6418, lng: -74.1012, desc: "83-acre park with Greek Revival buildings, Chinese Scholar's Garden, and free events.", cost: "Free grounds, $8 museum", rating: 4.7 },
  { id: 82, name: "Historic Richmond Town", category: "museum", lat: 40.5718, lng: -74.1454, desc: "28 historic buildings — colonial-era NYC brought to life with live demonstrations.", cost: "$10", rating: 4.5 },
  { id: 83, name: "Staten Island Zoo", category: "zoo", lat: 40.6266, lng: -74.1153, desc: "Compact but beloved zoo with great reptile collection and petting zoo.", cost: "$14", rating: 4.4 },
  { id: 84, name: "LaTourette Park", category: "park", lat: 40.5902, lng: -74.1454, desc: "500+ acres of forest with hiking trails, golf course, and a historic manor house.", cost: "Free", rating: 4.6 },
  { id: 85, name: "Clay Pit Ponds", category: "park", lat: 40.5776, lng: -74.1762, desc: "NYC's only state park preserve — spring-fed streams, birds, and total silence.", cost: "Free", rating: 4.7 },

  // Long Island
  { id: 86, name: "Old Westbury Gardens", category: "garden", lat: 40.7864, lng: -73.6011, desc: "Spectacular English-style formal gardens on a grand Gold Coast estate in Long Island.", cost: "$18", rating: 4.7 },
  { id: 87, name: "Long Island Aquarium", category: "zoo", lat: 40.9249, lng: -72.9854, desc: "World-class aquarium in Riverhead with sharks, penguins, and river otter habitat.", cost: "$34.95", rating: 4.5 },
  { id: 88, name: "Cradle of Aviation Museum", category: "museum", lat: 40.7228, lng: -73.5944, desc: "Extraordinary aviation history museum on former Mitchell Field airbase in Garden City.", cost: "$16", rating: 4.7 },
  { id: 89, name: "Sagamore Hill National Historic Site", category: "museum", lat: 40.8876, lng: -73.4987, desc: "Theodore Roosevelt's beloved home — preserved Victorian estate and presidential legacy.", cost: "$10 house tour", rating: 4.7 },
  { id: 90, name: "Vanderbilt Museum and Planetarium", category: "museum", lat: 40.9085, lng: -73.3742, desc: "Stunning Spanish Revival mansion with natural history collections and stargazing shows.", cost: "$12", rating: 4.5 },
  { id: 91, name: "Montauk Point Lighthouse Museum", category: "landmark", lat: 41.0712, lng: -71.8574, desc: "New York's oldest lighthouse at the very tip of Long Island — breathtaking ocean views.", cost: "$15", rating: 4.8 },
  { id: 92, name: "Planting Fields Arboretum", category: "garden", lat: 40.8706, lng: -73.5819, desc: "409-acre estate arboretum with magnificent greenhouse collections and historic mansion.", cost: "$8 parking", rating: 4.7 },
  { id: 93, name: "Jones Beach State Park", category: "beach", lat: 40.5995, lng: -73.5188, desc: "World-class 2,400-acre beach park — Art Deco bathhouses, boardwalk, and surf.", cost: "$10 parking", rating: 4.7 },
  { id: 94, name: "Hempstead House (Sands Point)", category: "landmark", lat: 40.8554, lng: -73.7098, desc: "Stunning Tudor Revival Gold Coast mansion with seaside preserve and falcon shows.", cost: "$12", rating: 4.6 },
  { id: 95, name: "Long Island Children's Museum", category: "museum", lat: 40.7251, lng: -73.5964, desc: "Award-winning children's museum with immersive, hands-on exhibits for ages 0-12.", cost: "$14", rating: 4.5 },
  { id: 96, name: "Oheka Castle", category: "landmark", lat: 40.8027, lng: -73.4721, desc: "America's second-largest private residence — Gold Coast estate now open as hotel and event venue.", cost: "Tours from $30", rating: 4.7 },
  { id: 97, name: "Adventureland", category: "landmark", lat: 40.7398, lng: -73.4282, desc: "Classic Long Island amusement park with classic rides, games, and carnival food since 1962.", cost: "Pay per ride", rating: 4.3 },
  { id: 98, name: "Parrish Art Museum", category: "museum", lat: 40.9173, lng: -72.3671, desc: "World-class museum in Water Mill celebrating the art and landscape of the East End.", cost: "$15", rating: 4.7 },
  { id: 99, name: "Bayard Cutting Arboretum", category: "garden", lat: 40.7421, lng: -73.1688, desc: "691-acre state park arboretum with magnificent trees, gardens, and a historic Tudor mansion.", cost: "$8 parking", rating: 4.7 },
  { id: 100, name: "Nassau County Museum of Art", category: "museum", lat: 40.8832, lng: -73.6378, desc: "Fine arts museum on a stunning 145-acre estate with indoor and outdoor sculpture gardens.", cost: "$15", rating: 4.5 },
  { id: 101, name: "Cooper's Beach", category: "beach", lat: 40.8929, lng: -72.4057, desc: "One of America's best beaches — pristine white sand, clear water, and lifeguards.", cost: "$50 parking in peak season", rating: 4.8 },
  { id: 102, name: "Fire Island National Seashore", category: "beach", lat: 40.6417, lng: -73.1285, desc: "32-mile barrier island with no cars, beautiful beaches, and charming communities.", cost: "Free (ferry extra)", rating: 4.9 },
  { id: 103, name: "Cold Spring Harbor Lab", category: "museum", lat: 40.8577, lng: -73.4357, desc: "World-famous research institution with public science programs and DNA Learning Center.", cost: "Varies", rating: 4.6 },
  { id: 104, name: "Caumsett State Historic Park", category: "park", lat: 40.9320, lng: -73.4820, desc: "1,520-acre former Marshall Field estate on Lloyd Neck — pristine coastal forest and wildlife.", cost: "$8 parking", rating: 4.8 },
  { id: 105, name: "Sunken Meadow State Park", category: "beach", lat: 40.9151, lng: -73.2648, desc: "Beautiful Long Island Sound beach with bluffs, boardwalk, and gorgeous sunset views.", cost: "$10 parking", rating: 4.7 },
  { id: 106, name: "Stony Brook Village Center", category: "shopping", lat: 40.9185, lng: -73.1476, desc: "Charming historic village with boutiques, galleries, and great restaurants on Long Island.", cost: "Free to explore", rating: 4.5 },
  { id: 107, name: "Heckscher Museum of Art", category: "museum", lat: 40.7337, lng: -73.3899, desc: "Renowned art museum in Huntington with permanent collection and rotating exhibitions.", cost: "$10", rating: 4.5 },
  { id: 108, name: "Gurney's Montauk Resort", category: "landmark", lat: 41.0399, lng: -71.9349, desc: "Iconic oceanfront resort at land's end with spa, private beach, and legendary sunsets.", cost: "Varies", rating: 4.6 },
  { id: 109, name: "Shelter Island", category: "landmark", lat: 41.0695, lng: -72.3456, desc: "Pristine island between North and South Forks — reachable by ferry, with great kayaking and hiking.", cost: "Ferry ~$12/car", rating: 4.8 },
  { id: 110, name: "Greenport Village", category: "food", lat: 41.1015, lng: -72.3610, desc: "Charming North Fork fishing village with wine tasting, oysters, and a vintage carousel.", cost: "Free to explore", rating: 4.7 },
];

const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.key, c]));

function getCat(key) {
  return CAT_MAP[key] || CAT_MAP["landmark"];
}

export default function PlacesInteractiveMap({ onBack, user }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mapLoaded, setMapLoaded] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const filteredPlaces = useCallback(() => {
    return PLACES.filter(p => {
      const catMatch = activeCategory === "all" || p.category === activeCategory;
      const searchMatch = !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.desc.toLowerCase().includes(searchQuery.toLowerCase());
      return catMatch && searchMatch;
    });
  }, [activeCategory, searchQuery]);

  // Load Google Maps
  useEffect(() => {
    if (window.google?.maps) { setMapLoaded(true); return; }
    const apiKey = "AIzaSyD1m9iJV8kEBGX2NpFSsxH9O7C4OIwFtYk"; // Will use proxy
    const script = document.createElement("script");
    // Use backend token endpoint if available, else load directly
    fetch("/api/functions/googleMapsToken", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) })
      .then(r => r.json())
      .then(data => {
        const key = data.token || "";
        script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => setMapLoaded(true);
        document.head.appendChild(script);
      })
      .catch(() => {
        // Fallback: try loading with existing env
        setMapLoaded(true);
      });
    return () => {};
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return;
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 40.7580, lng: -73.9855 },
      zoom: 11,
      disableDefaultUI: true,
      zoomControl: true,
      styles: [
        { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
        { featureType: "transit", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#a0c8e0" }] },
        { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#f5f5f0" }] },
        { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
        { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
        { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#c9b2a6" }] },
      ],
    });
    mapInstanceRef.current = map;
    infoWindowRef.current = new window.google.maps.InfoWindow();
  }, [mapLoaded]);

  // Draw markers
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google?.maps) return;
    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    const places = filteredPlaces();
    places.forEach(place => {
      const cat = getCat(place.category);
      const marker = new window.google.maps.Marker({
        position: { lat: place.lat, lng: place.lng },
        map: mapInstanceRef.current,
        title: place.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: cat.color,
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2.5,
        },
        label: {
          text: cat.emoji,
          fontSize: "13px",
          fontWeight: "bold",
        },
      });
      marker.addListener("click", () => {
        setSelectedPlace(place);
        mapInstanceRef.current.panTo({ lat: place.lat, lng: place.lng });
      });
      markersRef.current.push(marker);
    });
  }, [mapLoaded, filteredPlaces]);

  const handleSearch = (q) => {
    setSearchQuery(q);
    if (q.trim().length > 1) {
      const results = PLACES.filter(p =>
        p.name.toLowerCase().includes(q.toLowerCase())
      ).slice(0, 6);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const selectSearchResult = (place) => {
    setSelectedPlace(place);
    setSearchQuery(place.name);
    setSearchResults([]);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat: place.lat, lng: place.lng });
      mapInstanceRef.current.setZoom(15);
    }
  };

  const flyToUserLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      const latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      mapInstanceRef.current?.panTo(latlng);
      mapInstanceRef.current?.setZoom(14);
    });
  };

  const cat = getCat(selectedPlace?.category || "landmark");

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", flexDirection: "column", backgroundColor: "#f5f5f0" }}>
      {/* Map */}
      <div ref={mapRef} style={{ flex: 1, width: "100%", height: "100%" }} />

      {!mapLoaded && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f5f5f0" }}>
          <div className="text-center">
            <div className="text-4xl mb-3">🗺️</div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Loading map…</p>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div style={{ position: "absolute", top: "max(env(safe-area-inset-top, 12px), 12px)", left: 12, right: 12, zIndex: 10 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          {/* Back button */}
          <button onClick={onBack}
            style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", border: "1px solid rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 12px rgba(0,0,0,0.12)" }}>
            <ChevronLeft style={{ width: 20, height: 20, color: "#0F172A" }} />
          </button>

          {/* Search */}
          <div style={{ flex: 1, position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 12px", height: 44, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 2px 12px rgba(0,0,0,0.12)" }}>
              <Search style={{ width: 16, height: 16, color: "#94A3B8", flexShrink: 0 }} />
              <input
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search 110+ places…"
                style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 14, color: "#0F172A", fontWeight: 500 }}
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(""); setSearchResults([]); }}>
                  <X style={{ width: 14, height: 14, color: "#94A3B8" }} />
                </button>
              )}
            </div>

            {/* Search results dropdown */}
            {searchResults.length > 0 && (
              <div style={{ position: "absolute", top: 48, left: 0, right: 0, backgroundColor: "white", borderRadius: 14, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.15)", border: "1px solid rgba(0,0,0,0.06)" }}>
                {searchResults.map(p => {
                  const c = getCat(p.category);
                  return (
                    <button key={p.id} onClick={() => selectSearchResult(p)}
                      style={{ width: "100%", padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, textAlign: "left", borderBottom: "1px solid #F1F5F9" }}>
                      <span style={{ fontSize: 18 }}>{c.emoji}</span>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", margin: 0 }}>{p.name}</p>
                        <p style={{ fontSize: 11, color: "#94A3B8", margin: 0, textTransform: "capitalize" }}>{p.category}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Location button */}
          <button onClick={flyToUserLocation}
            style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", border: "1px solid rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 12px rgba(0,0,0,0.12)" }}>
            <Navigation style={{ width: 18, height: 18, color: "#4F46E5" }} />
          </button>
        </div>
      </div>

      {/* Category filter pills */}
      <div style={{ position: "absolute", top: "max(calc(env(safe-area-inset-top, 12px) + 56px), 68px)", left: 0, right: 0, zIndex: 10, overflowX: "auto", display: "flex", gap: 8, padding: "0 12px", paddingBottom: 4, scrollbarWidth: "none" }}>
        {CATEGORIES.map(cat => (
          <button key={cat.key} onClick={() => setActiveCategory(cat.key)}
            style={{
              flexShrink: 0, padding: "6px 14px", borderRadius: 99, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
              backgroundColor: activeCategory === cat.key ? cat.color : "rgba(255,255,255,0.92)",
              color: activeCategory === cat.key ? "#fff" : "#475569",
              border: `1.5px solid ${activeCategory === cat.key ? cat.color : "rgba(0,0,0,0.07)"}`,
              backdropFilter: "blur(8px)",
              boxShadow: activeCategory === cat.key ? `0 4px 12px ${cat.color}55` : "0 1px 6px rgba(0,0,0,0.08)",
              transition: "all 0.2s",
            }}>
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* Place count badge */}
      <div style={{ position: "absolute", bottom: selectedPlace ? 310 : 100, right: 12, zIndex: 10 }}>
        <div style={{ padding: "6px 12px", borderRadius: 99, backgroundColor: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)", boxShadow: "0 2px 8px rgba(0,0,0,0.12)", fontSize: 12, fontWeight: 700, color: "#0F172A" }}>
          📍 {filteredPlaces().length} places
        </div>
      </div>

      {/* Place detail card */}
      {selectedPlace && (
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 20, padding: "0 12px 20px", animation: "slideUpSheet 0.3s cubic-bezier(0.22,1,0.36,1)" }}>
          <div style={{ backgroundColor: "white", borderRadius: 24, overflow: "hidden", boxShadow: "0 -4px 40px rgba(0,0,0,0.15)" }}>
            {/* Header */}
            <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: cat.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                {cat.emoji}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0F172A", lineHeight: 1.2, fontFamily: "var(--font-serif)" }}>
                  {selectedPlace.name}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, backgroundColor: cat.bg, color: cat.color, textTransform: "capitalize" }}>
                    {selectedPlace.category}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <Star style={{ width: 12, height: 12, fill: "#F59E0B", color: "#F59E0B" }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#F59E0B" }}>{selectedPlace.rating}</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#16A34A" }}>
                    {selectedPlace.cost === "Free" || selectedPlace.cost === "FREE" ? "🟢 Free" : selectedPlace.cost}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedPlace(null)}
                style={{ width: 32, height: 32, borderRadius: 99, backgroundColor: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <X style={{ width: 14, height: 14, color: "#64748B" }} />
              </button>
            </div>

            {/* Description */}
            <div style={{ padding: "12px 16px" }}>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "#475569" }}>{selectedPlace.desc}</p>
            </div>

            {/* Actions */}
            <div style={{ padding: "0 16px 16px", display: "flex", gap: 10 }}>
              <a href={`https://www.google.com/maps/search/${encodeURIComponent(selectedPlace.name + " New York")}`}
                target="_blank" rel="noopener noreferrer"
                style={{ flex: 1, padding: "12px 0", borderRadius: 14, background: "linear-gradient(135deg, #4F46E5, #7C3AED)", color: "white", fontWeight: 700, fontSize: 14, textAlign: "center", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <MapPin style={{ width: 15, height: 15 }} /> Directions
              </a>
              <a href={`https://www.google.com/search?q=${encodeURIComponent(selectedPlace.name + " New York")}`}
                target="_blank" rel="noopener noreferrer"
                style={{ padding: "12px 16px", borderRadius: 14, backgroundColor: "#F1F5F9", color: "#0F172A", fontWeight: 700, fontSize: 14, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
                <ExternalLink style={{ width: 15, height: 15 }} /> Info
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}