import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import QuickVote from "./QuickVote";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import ProductCard from "../products/ProductCard";
import ProductDetailModal from "../products/ProductDetailModal";

const PRODUCT_CATEGORIES = [
  { key: "all", label: "All" },
  { key: "perfume", label: "🌸 Perfume" },
  { key: "laptop", label: "💻 Laptop" },
  { key: "earbuds", label: "🎧 Headphones" },
  { key: "phone", label: "📱 Phone" },
  { key: "skincare", label: "✨ Skincare" },
  { key: "tech_accessories", label: "🔌 Electronics" },
  { key: "fitness", label: "🏋️ Fitness" },
  { key: "travel", label: "✈️ Travel" },
];

const CATEGORY_ICONS = {
  perfume: "🌸", laptop: "💻", earbuds: "🎧", phone: "📱",
  skincare: "✨", tech_accessories: "🔌", fitness: "🏋️", travel: "✈️",
};

// Extract brand from product name (first word or known brand)
const KNOWN_BRANDS = ["Apple","Samsung","Sony","Bose","Dell","HP","Lenovo","Asus","Acer","Microsoft","Razer","LG","Google","Anker","JBL","Jabra","Sennheiser","Bang","Skullcandy","HyperX","SteelSeries","Logitech","Philips","Koss","Shure","Peloton","NordicTrack","Concept2","Bowflex","Theragun","Garmin","Fitbit","Schwinn","Titan","Sunny","Osprey","Travelpro","Samsonite","Away","Patagonia","Herschel","Bose","Travelon","Cabeau","Etekcity","GoPro","DJI","Roku","Kindle","MSI","Razer","TriggerPoint","Gaiam","Maison","CeraVe","Pixel","Tile"];

function getBrand(name) {
  for (const b of KNOWN_BRANDS) {
    if (name.startsWith(b)) return b;
  }
  return name.split(" ")[0];
}

// Parse min price from price string like "$999–$1,299"
function parseMinPrice(priceStr) {
  if (!priceStr) return 0;
  const match = priceStr.replace(/,/g, "").match(/\$(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

const SORT_OPTIONS = [
  { key: "popular", label: "Most Popular" },
  { key: "price_asc", label: "Price: Low to High" },
  { key: "price_desc", label: "Price: High to Low" },
  { key: "newest", label: "Newest" },
  { key: "name_asc", label: "Name A–Z" },
];

const PRICE_RANGES = [
  { key: "all", label: "Any Price" },
  { key: "0-50", label: "Under $50", min: 0, max: 50 },
  { key: "50-200", label: "$50–$200", min: 50, max: 200 },
  { key: "200-500", label: "$200–$500", min: 200, max: 500 },
  { key: "500-1000", label: "$500–$1,000", min: 500, max: 1000 },
  { key: "1000+", label: "Over $1,000", min: 1000, max: Infinity },
];

// Category-specific features
const FEATURES_BY_CATEGORY = {
  laptop: ["ANC", "OLED Display", "2-in-1", "Gaming", "Chromebook", "Touchscreen", "Lightweight", "Business"],
  earbuds: ["ANC", "True Wireless", "Gaming Headset", "Open-Back", "Wired", "Wireless", "Hi-Res Audio"],
  fitness: ["Cardio Machine", "Strength", "Recovery", "Wearable", "Home Gym", "Budget-Friendly"],
  tech_accessories: ["Smartphone", "Tablet", "Camera", "Smart Watch", "Streaming", "SSD", "Power Bank", "Smart Home"],
  travel: ["Luggage", "Backpack", "Accessories", "Tech", "Organizer", "Anti-Theft"],
};

// Tag products with features
function getFeatures(product) {
  const name = product.name.toLowerCase();
  const desc = (product.description || "").toLowerCase();
  const combined = name + " " + desc;
  const features = [];
  if (/anc|noise cancel/i.test(combined)) features.push("ANC");
  if (/oled/i.test(combined)) features.push("OLED Display");
  if (/2.in.1|convertible|2 in 1/i.test(combined)) features.push("2-in-1");
  if (/gaming/i.test(combined)) features.push("Gaming");
  if (/chromebook/i.test(combined)) features.push("Chromebook");
  if (/touch/i.test(combined)) features.push("Touchscreen");
  if (/light|thin|slim|ultrabook|ultraportable/i.test(combined)) features.push("Lightweight");
  if (/business|enterprise|thinkpad|spectre/i.test(combined)) features.push("Business");
  if (/true wireless|tws|earbud/i.test(combined)) features.push("True Wireless");
  if (/gaming headset/i.test(combined)) features.push("Gaming Headset");
  if (/open.back/i.test(combined)) features.push("Open-Back");
  if (/wired/i.test(combined) && !/wireless/i.test(name)) features.push("Wired");
  if (/wireless/i.test(combined)) features.push("Wireless");
  if (/ldac|hi.res|high.res/i.test(combined)) features.push("Hi-Res Audio");
  if (/treadmill|bike|rower|cycling/i.test(combined)) features.push("Cardio Machine");
  if (/dumbbell|rack|gym|bench/i.test(combined)) features.push("Strength");
  if (/massage|foam roller|theragun/i.test(combined)) features.push("Recovery");
  if (/watch|fitbit|garmin/i.test(combined)) features.push("Wearable");
  if (/home gym|cable/i.test(combined)) features.push("Home Gym");
  if (/budget|affordable|cheap|entry/i.test(combined)) features.push("Budget-Friendly");
  if (/iphone|galaxy s|pixel \d/i.test(combined)) features.push("Smartphone");
  if (/ipad|tab s|tablet/i.test(combined)) features.push("Tablet");
  if (/camera|gopro|drone|dji/i.test(combined)) features.push("Camera");
  if (/watch ultra|apple watch|fitbit/i.test(combined)) features.push("Smart Watch");
  if (/roku|streaming/i.test(combined)) features.push("Streaming");
  if (/ssd/i.test(combined)) features.push("SSD");
  if (/powercore|power bank|charger/i.test(combined)) features.push("Power Bank");
  if (/luggage|suitcase|spinner/i.test(combined)) features.push("Luggage");
  if (/backpack/i.test(combined)) features.push("Backpack");
  if (/packing|organizer|cube/i.test(combined)) features.push("Organizer");
  if (/anti.theft|rfid/i.test(combined)) features.push("Anti-Theft");
  if (/gopro|tile|charger|kindle|roku/i.test(combined)) features.push("Tech");
  return [...new Set(features)];
}

const SAMPLE_PRODUCTS = [
  { id: "l1", name: "Apple MacBook Air (M2)", category: "laptop", description: "Slim, fanless laptop powered by Apple's M2 chip. Great battery life and performance for everyday tasks, students, and creators. Available in multiple colors.", insight: "Best-seller for battery & performance combo", price: "$999–$1,299" },
  { id: "l2", name: "Apple MacBook Pro 14″ (M3 Pro)", category: "laptop", description: "Pro-tier Apple laptop with the M3 Pro chip, stunning Liquid Retina XDR display, and long battery life. Aimed at developers, video editors, and power users.", insight: "Top pick for creative professionals", price: "$1,999–$2,499" },
  { id: "l3", name: "Dell XPS 13 Plus", category: "laptop", description: "Compact ultrabook with a sleek edge-to-edge keyboard, OLED display option, and premium build quality. Popular with business travelers.", insight: "Praised for design and display", price: "$1,299–$1,799" },
  { id: "l4", name: "HP Spectre x360 14″", category: "laptop", description: "Versatile 2-in-1 laptop with OLED touchscreen, stylus support, and premium aluminum chassis. Excellent for note-takers and artists.", insight: "Loved for versatility as a 2-in-1", price: "$1,299–$1,899" },
  { id: "l5", name: "Lenovo ThinkPad X1 Carbon Gen 12", category: "laptop", description: "Legendary business ultrabook with military-grade durability, excellent keyboard, and long battery. Trusted by enterprise users worldwide.", insight: "Best-in-class keyboard experience", price: "$1,599–$2,199" },
  { id: "l6", name: "Asus ROG Zephyrus G14", category: "laptop", description: "Compact gaming laptop with AMD Ryzen 9 and NVIDIA RTX graphics. Surprisingly portable for its gaming power.", insight: "Top pick for portable gaming", price: "$1,499–$2,099" },
  { id: "l7", name: "Razer Blade 15 Advanced", category: "laptop", description: "Premium gaming laptop with high-refresh-rate display, powerful GPU, and sleek all-black aluminum design. Aimed at serious gamers.", insight: "Most praised for build quality in gaming", price: "$1,799–$2,999" },
  { id: "l8", name: "Microsoft Surface Laptop Studio 2", category: "laptop", description: "Unique convertible laptop with a pull-forward display for drawing and touch input. Designed for creative professionals in the Windows ecosystem.", insight: "Unique form factor loved by artists", price: "$1,799–$2,299" },
  { id: "l9", name: "Samsung Galaxy Book3 Pro", category: "laptop", description: "Ultra-thin Windows laptop with AMOLED display and 120Hz refresh rate. Pairs well with Samsung phones for seamless cross-device features.", insight: "Praised for AMOLED display quality", price: "$1,299–$1,799" },
  { id: "l10", name: "LG Gram 17", category: "laptop", description: "Exceptionally lightweight 17\" laptop despite its large screen. MIL-STD-810G certified for durability with all-day battery life.", insight: "Lightest 17\" laptop in its class", price: "$1,299–$1,799" },
  { id: "l11", name: "Acer Swift 3 (Intel i5)", category: "laptop", description: "Affordable ultrabook with solid performance, metal chassis, and long battery life. A favorite for students on a budget.", insight: "Best budget ultrabook value", price: "$599–$799" },
  { id: "l12", name: "Lenovo IdeaPad 3 15″", category: "laptop", description: "Entry-level Windows laptop for everyday tasks like browsing, streaming, and light productivity. Reliable and affordable.", insight: "Most popular entry-level pick", price: "$399–$549" },
  { id: "l13", name: "HP Pavilion 15 Laptop", category: "laptop", description: "Mid-range laptop offering a balance of performance and price, suitable for students and home users.", insight: "Popular for home and school use", price: "$499–$699" },
  { id: "l14", name: "Dell Inspiron 15 3000", category: "laptop", description: "Budget-friendly Windows laptop from Dell with a 15\" screen, suitable for basic computing and web browsing.", insight: "Reliable starter laptop", price: "$399–$599" },
  { id: "l15", name: "Asus VivoBook 15", category: "laptop", description: "Colorful, lightweight laptop targeting students with decent performance, a number pad, and slim bezels.", insight: "Loved for looks and value", price: "$449–$599" },
  { id: "l16", name: "Acer Aspire 5", category: "laptop", description: "Well-rounded budget laptop with IPS display, AMD/Intel options, and solid build. Consistently recommended in budget laptop roundups.", insight: "Most recommended sub-$500 laptop", price: "$399–$549" },
  { id: "l17", name: "Lenovo Flex 5 14″ 2-in-1", category: "laptop", description: "Affordable 2-in-1 convertible with touchscreen and pen support. Good option for students who want laptop + tablet flexibility.", insight: "Popular budget 2-in-1 pick", price: "$499–$699" },
  { id: "l18", name: "HP Chromebook x2 12″", category: "laptop", description: "Detachable Chromebook with a sharp 3:2 display and included keyboard. Runs ChromeOS — great for web-based workflows.", insight: "Top detachable Chromebook", price: "$299–$399" },
  { id: "l19", name: "Samsung Chromebook Plus", category: "laptop", description: "Lightweight Chromebook with a stylus and 360-degree hinge. Designed for note-taking and Google Workspace users.", insight: "Loved for stylus integration", price: "$329–$429" },
  { id: "l20", name: "Microsoft Surface Go 3", category: "laptop", description: "Compact 10.5\" 2-in-1 Windows tablet. Portable and light — ideal for casual browsing and note-taking on the go.", insight: "Best ultra-portable Windows option", price: "$399–$549" },
  { id: "l21", name: "Acer Nitro 5", category: "laptop", description: "Entry-level gaming laptop with NVIDIA GTX/RTX graphics and IPS display. Popular first gaming laptop for students.", insight: "Best budget gaming laptop", price: "$899–$1,099" },
  { id: "l22", name: "MSI GF63 Thin", category: "laptop", description: "Thin and relatively lightweight gaming laptop with NVIDIA graphics. Handles most modern games at 1080p.", insight: "Popular for slim gaming form factor", price: "$799–$999" },
  { id: "l23", name: "HP Victus 16", category: "laptop", description: "Gaming laptop from HP's Victus line — balances gaming performance with a more everyday aesthetic.", insight: "Praised for quiet fans and display", price: "$899–$1,199" },
  { id: "l24", name: "Dell G15", category: "laptop", description: "Gaming laptop with AMD or Intel options, solid GPU performance, and a comfortable keyboard.", insight: "Top Dell gaming pick under $1,300", price: "$999–$1,299" },
  { id: "l25", name: "Asus TUF Gaming F17", category: "laptop", description: "Durable gaming laptop with MIL-STD-810H certification, strong battery, and efficient thermal design.", insight: "Loved for durability in gaming", price: "$999–$1,299" },
  { id: "h1", name: "Sony WH-1000XM5", category: "earbuds", description: "Over-ear wireless headphones with industry-leading noise cancellation and up to 30-hour battery.", insight: "Most praised for noise cancellation", price: "$348–$399" },
  { id: "h2", name: "Bose QuietComfort 45", category: "earbuds", description: "Iconic over-ear ANC headphones known for comfortable fit and smooth, balanced sound profile.", insight: "Loved for comfort on long trips", price: "$279–$329" },
  { id: "h3", name: "Apple AirPods Max", category: "earbuds", description: "Premium over-ear headphones with Apple's H1 chip, spatial audio, and aluminum ear cups.", insight: "Top pick for Apple ecosystem users", price: "$499–$549" },
  { id: "h4", name: "Sennheiser Momentum 4 Wireless", category: "earbuds", description: "High-fidelity over-ear headphones with rich sound, strong ANC, and exceptional 60-hour battery.", insight: "Best-in-class battery & sound quality", price: "$299–$349" },
  { id: "h5", name: "Bose 700 Noise Cancelling", category: "earbuds", description: "Bose's premium ANC headphones with 11 adjustable noise-cancellation levels and voice assistant integration.", insight: "Praised for adjustable ANC levels", price: "$349–$399" },
  { id: "h6", name: "Shure AONIC 50", category: "earbuds", description: "Professional-grade wireless headphones with adjustable ANC, wired/wireless flexibility, and detailed sound.", insight: "Popular with audiophiles for sound accuracy", price: "$299–$349" },
  { id: "h7", name: "Bang & Olufsen Beoplay H95", category: "earbuds", description: "Ultra-premium luxury headphones with lambskin ear cushions, adaptive ANC, and 38-hour battery.", insight: "Most luxurious headphone experience", price: "$849–$949" },
  { id: "h8", name: "Sony WF-1000XM4 (TWS)", category: "earbuds", description: "Sony's flagship true wireless earbuds with LDAC hi-res audio support, great ANC, and compact design.", insight: "Top TWS pick for audio quality", price: "$199–$249" },
  { id: "h9", name: "Apple AirPods Pro (2nd Gen)", category: "earbuds", description: "Apple's flagship TWS earbuds with Adaptive Transparency, H2 chip, and strong ANC.", insight: "Most popular earbuds for iPhone users", price: "$249–$279" },
  { id: "h10", name: "Anker Soundcore Life Q20", category: "earbuds", description: "Budget over-ear ANC headphones that punch well above their price point.", insight: "Best budget ANC headphones", price: "$59–$79" },
  { id: "h11", name: "JBL Tune 510BT", category: "earbuds", description: "Lightweight wireless on-ear headphones with 40-hour battery. Simple, reliable audio.", insight: "Most popular sub-$70 on-ear", price: "$49–$69" },
  { id: "h12", name: "Skullcandy Crusher Evo", category: "earbuds", description: "Over-ear headphones with adjustable bass sensation via haptic drivers. Unique immersive experience.", insight: "Loved for bass immersion feature", price: "$129–$149" },
  { id: "h13", name: "Razer BlackShark V2", category: "earbuds", description: "Gaming headset with THX Spatial Audio, detachable noise-cancelling mic, and comfortable memory foam.", insight: "Best gaming headset for sound accuracy", price: "$99–$129" },
  { id: "h14", name: "HyperX Cloud II", category: "earbuds", description: "Classic gaming headset with virtual 7.1 surround, durable aluminum frame, and great microphone.", insight: "Most recommended entry gaming headset", price: "$99–$129" },
  { id: "h15", name: "SteelSeries Arctis 7", category: "earbuds", description: "Wireless gaming headset with 24-hour battery, ClearCast bidirectional mic, and lossless 2.4GHz connection.", insight: "Top wireless gaming headset pick", price: "$149–$179" },
  { id: "h16", name: "Logitech G Pro X", category: "earbuds", description: "Pro-grade gaming headset with Blue VO!CE microphone technology, designed for competitive esports.", insight: "Favorite headset among esports pros", price: "$129–$159" },
  { id: "h17", name: "Jabra Evolve2 55", category: "earbuds", description: "Business-focused wireless headset with good microphone quality and ANC. Used heavily in remote-work setups.", insight: "Top pick for call quality", price: "$299–$349" },
  { id: "h18", name: "Philips SHP9500", category: "earbuds", description: "Open-back wired headphones beloved by audiophiles for their airy, natural soundstage.", insight: "Most loved budget open-back", price: "$69–$89" },
  { id: "h19", name: "Koss Porta Pro", category: "earbuds", description: "Legendary lightweight on-ear headphones with a cult following since 1984. Known for warm, punchy sound and lifetime warranty.", insight: "Cult classic with lifetime warranty", price: "$49–$69" },
  { id: "h20", name: "Sony MDR-ZX110", category: "earbuds", description: "Ultra-budget on-ear wired headphones. Simple, reliable, widely used in schools and offices.", insight: "Best ultra-budget wired option", price: "$19–$29" },
  { id: "f1", name: "Peloton Bike+", category: "fitness", description: "Premium connected indoor exercise bike with a rotating 24\" HD touchscreen, live and on-demand classes.", insight: "Most praised for interactive workout experience", price: "$1,995–$2,445" },
  { id: "f2", name: "NordicTrack Commercial 1750 Treadmill", category: "fitness", description: "Feature-rich treadmill with incline and decline capabilities, 14\" HD touchscreen, and iFIT integration.", insight: "Top pick for home treadmill buyers", price: "$1,599–$1,899" },
  { id: "f3", name: "Concept2 Model D Rower", category: "fitness", description: "The gold-standard rowing machine used by Olympic athletes and CrossFit gyms. Durable and accurate.", insight: "Most recommended rowing machine globally", price: "$950–$1,150" },
  { id: "f4", name: "Bowflex SelectTech 552 Dumbbells", category: "fitness", description: "Adjustable dumbbell set that replaces 15 pairs of weights. Dial-select from 5 to 52.5 lbs.", insight: "Best space-saving adjustable dumbbells", price: "$399–$449" },
  { id: "f5", name: "Theragun PRO", category: "fitness", description: "Professional-grade percussive massage device with adjustable arm, OLED screen, and Bluetooth.", insight: "Most recommended recovery device", price: "$399–$499" },
  { id: "f6", name: "Garmin Fēnix 7 Fitness Watch", category: "fitness", description: "Rugged multisport GPS smartwatch with solar charging and detailed training metrics.", insight: "Loved by endurance athletes", price: "$599–$699" },
  { id: "f7", name: "Fitbit Sense 2", category: "fitness", description: "Health-focused smartwatch with EDA stress sensor, ECG, SpO2, and 6-day battery.", insight: "Top health monitoring smartwatch", price: "$279–$329" },
  { id: "f8", name: "Schwinn IC4 Indoor Cycling Bike", category: "fitness", description: "Belt-driven indoor bike with 100 resistance levels and Bluetooth connectivity to fitness apps.", insight: "Popular Peloton alternative at lower cost", price: "$899–$1,099" },
  { id: "f9", name: "Resistance Bands Set", category: "fitness", description: "Versatile set of latex resistance bands in multiple resistance levels for training and therapy.", insight: "Most versatile home gym starter tool", price: "$19–$39" },
  { id: "f10", name: "Gaiam Yoga Mat", category: "fitness", description: "Non-slip yoga mat with alignment lines, available in various thicknesses and patterns.", insight: "Top-selling yoga mat for beginners", price: "$29–$49" },
  { id: "f11", name: "TriggerPoint GRID Foam Roller", category: "fitness", description: "Multi-density foam roller designed to replicate a therapist's hands for muscle recovery.", insight: "Most recommended foam roller", price: "$29–$49" },
  { id: "f12", name: "WOD Nation Jump Rope", category: "fitness", description: "Speed jump rope with adjustable cable. Used by CrossFit athletes and beginners for cardio.", insight: "Best jump rope for speed training", price: "$19–$29" },
  { id: "f13", name: "Bowflex PR1000 Home Gym", category: "fitness", description: "Compact home gym with over 30 exercises, rowing machine, and 210 lbs of resistance.", insight: "Best all-in-one home gym under $800", price: "$699–$799" },
  { id: "f14", name: "Titan Fitness Power Rack", category: "fitness", description: "Heavy-duty steel power rack for squats, bench press, and pull-ups. Popular in home garage gyms.", insight: "Community favorite for garage gyms", price: "$499–$699" },
  { id: "f15", name: "Sunny Health & Fitness Treadmill", category: "fitness", description: "Budget-friendly folding treadmill with manual incline, LCD display, and simple controls.", insight: "Best budget folding treadmill", price: "$399–$499" },
  { id: "e1", name: "Apple iPhone 15 Pro Max", category: "tech_accessories", description: "Apple's flagship iPhone with titanium frame, A17 Pro chip, 48MP camera system, and USB-C.", insight: "Best camera system on an iPhone", price: "$1,099–$1,299" },
  { id: "e2", name: "Samsung Galaxy S24 Ultra", category: "tech_accessories", description: "Samsung's powerhouse with built-in S Pen, 200MP camera, and Galaxy AI features.", insight: "Most feature-packed Android flagship", price: "$1,199–$1,399" },
  { id: "e3", name: "Google Pixel 8 Pro", category: "tech_accessories", description: "Google's flagship with best-in-class computational photography and 7 years of OS updates.", insight: "Top pick for software and camera", price: "$899–$999" },
  { id: "e4", name: "Apple iPad Pro 12.9″ (M2)", category: "tech_accessories", description: "Pro tablet with M2 chip, Liquid Retina XDR display, and Apple Pencil 2 support.", insight: "Best tablet for creative professionals", price: "$1,099–$1,899" },
  { id: "e5", name: "Samsung Galaxy Tab S9+", category: "tech_accessories", description: "Premium Android tablet with AMOLED display, S Pen included, and DeX desktop mode.", insight: "Best Android tablet for productivity", price: "$899–$999" },
  { id: "e6", name: "Sony A7 IV Mirrorless Camera", category: "tech_accessories", description: "Full-frame mirrorless camera with 33MP sensor, 4K60 video, and advanced autofocus.", insight: "Top pick for photo/video hybrid work", price: "$1,998–$2,199" },
  { id: "e7", name: "DJI Air 3 Drone", category: "tech_accessories", description: "Consumer drone with dual main cameras, 4K/60fps video, and 46-minute flight time.", insight: "Most recommended travel drone 2024", price: "$999–$1,199" },
  { id: "e8", name: "GoPro HERO12 Black", category: "tech_accessories", description: "Action camera with HyperSmooth 6.0 stabilization, 5.3K video, and waterproof to 10m.", insight: "Best action camera for adventure sports", price: "$399–$449" },
  { id: "e9", name: "Apple Watch Ultra", category: "tech_accessories", description: "Rugged titanium smartwatch designed for extreme athletes — 60-hour battery and dive computer.", insight: "Most capable Apple Watch ever", price: "$799–$849" },
  { id: "e10", name: "Fitbit Charge 6", category: "tech_accessories", description: "Slim fitness tracker with Google Maps, Google Wallet, ECG, and YouTube Music controls.", insight: "Best slim fitness tracker with Google", price: "$149–$179" },
  { id: "e11", name: "Kindle Paperwhite (11th Gen)", category: "tech_accessories", description: "Waterproof e-reader with flush-front 6.8\" display, warm light, and weeks of battery.", insight: "Most recommended e-reader", price: "$139–$159" },
  { id: "e12", name: "Anker PowerCore 20100 PD", category: "tech_accessories", description: "High-capacity portable charger that can charge two devices simultaneously including USB-C laptops.", insight: "Top power bank for travel", price: "$49–$69" },
  { id: "e13", name: "Roku Ultra Streaming Player", category: "tech_accessories", description: "4K streaming device with Dolby Vision, Dolby Atmos, and private listening via remote.", insight: "Best standalone streaming device", price: "$89–$119" },
  { id: "e14", name: "Samsung T7 Portable SSD 1TB", category: "tech_accessories", description: "Fast, compact USB 3.2 external SSD with metal casing and password encryption.", insight: "Most popular portable SSD", price: "$109–$139" },
  { id: "e15", name: "Sonos Ray Soundbar", category: "tech_accessories", description: "Compact soundbar with clear dialogue and Sonos multi-room compatibility.", insight: "Best compact soundbar entry point", price: "$279–$319" },
  { id: "e16", name: "LG C3 OLED TV 55″", category: "tech_accessories", description: "Award-winning OLED TV with near-infinite contrast, 120Hz gaming mode, and Dolby Vision IQ.", insight: "Best OLED TV for the money", price: "$1,499–$1,699" },
  { id: "e17", name: "Dell 27″ 4K Monitor", category: "tech_accessories", description: "USB-C 4K IPS monitor with wide color coverage and height-adjustable stand.", insight: "Top-rated work-from-home monitor", price: "$499–$599" },
  { id: "e18", name: "Apple AirTag 4-Pack", category: "tech_accessories", description: "Apple's precision item tracker using U1 chip and the Find My network.", insight: "Most used item tracker in Apple ecosystem", price: "$99–$119" },
  { id: "t1", name: "Away The Bigger Carry-On", category: "travel", description: "Premium hardshell carry-on suitcase with built-in battery, 360° spinner wheels, and lifetime warranty.", insight: "Most gifted premium carry-on", price: "$275–$295" },
  { id: "t2", name: "Travelpro Platinum Elite 29″", category: "travel", description: "Professional-grade spinner suitcase trusted by flight crews. Lightweight and durable.", insight: "Favorite luggage of frequent flyers", price: "$449–$499" },
  { id: "t3", name: "Samsonite Omni PC Hardside 28″", category: "travel", description: "Polycarbonate hardshell suitcase with multi-directional spinner wheels and TSA-approved lock.", insight: "Best value hardshell checked luggage", price: "$319–$359" },
  { id: "t4", name: "Osprey Farpoint 40 Backpack", category: "travel", description: "Award-winning travel backpack that fits as carry-on, with padded suspension and lockable zippers.", insight: "Most recommended travel backpack", price: "$159–$189" },
  { id: "t5", name: "Patagonia Black Hole Duffel 55L", category: "travel", description: "Rugged water-resistant duffel made from recycled materials. Convertible to a backpack.", insight: "Top duffel for outdoor travelers", price: "$179–$209" },
  { id: "t6", name: "Herschel Little America Backpack", category: "travel", description: "Classic-styled daypack with padded laptop compartment. Popular for city travel and commuting.", insight: "Most stylish everyday travel backpack", price: "$99–$129" },
  { id: "t7", name: "Anker PowerCore 26800 Portable Charger", category: "travel", description: "High-capacity travel power bank for smartphones on long flights.", insight: "Best high-capacity travel power bank", price: "$59–$79" },
  { id: "t8", name: "Bose Sleepbuds II", category: "travel", description: "Sleep earbuds that play soothing sounds to mask noise — designed specifically for better sleep.", insight: "Top pick for blocking hotel/flight noise", price: "$249–$279" },
  { id: "t9", name: "Eagle Creek Pack-It Specter Cube Set", category: "travel", description: "Ultra-lightweight packing cubes in three sizes to organize clothes in any luggage.", insight: "Community favorite for luggage organization", price: "$54–$74" },
  { id: "t10", name: "Travelon Anti-Theft Crossbody Bag", category: "travel", description: "Slash-resistant crossbody bag with locking zippers and RFID blocking.", insight: "Most recommended anti-theft travel bag", price: "$49–$69" },
  { id: "t11", name: "Cabeau Evolution Pillow", category: "travel", description: "Memory foam travel pillow with a unique support system for resting at any angle.", insight: "Top-rated neck pillow for flights", price: "$39–$59" },
  { id: "t12", name: "Etekcity Luggage Scale", category: "travel", description: "Digital handheld luggage scale. Prevents overweight bag fees at the airport.", insight: "Most practical travel accessory under $30", price: "$19–$29" },
  { id: "t13", name: "GoPro HERO11 Black Travel Kit", category: "travel", description: "Bundled action camera kit with extra accessories — mounts, batteries, and carrying case.", insight: "Best camera bundle for adventure travel", price: "$399–$449" },
  { id: "t14", name: "Tile Pro (2024)", category: "travel", description: "Bluetooth tracker that works with a community network to find lost luggage or bags.", insight: "Most used Bluetooth tracker for luggage", price: "$34–$49" },
  { id: "t15", name: "Anker Nano II 65W Charger", category: "travel", description: "Compact GaN USB-C charger that can power a laptop, tablet, and phone simultaneously.", insight: "Best travel charger for laptop users", price: "$29–$49" },
  // Additional headphones
  { id: "h21", name: "Corsair HS70 Pro", category: "earbuds", description: "Wireless gaming headset with memory foam ear pads, 7.1 surround sound, and 16-hour battery life.", insight: "Top value wireless gaming headset", price: "$99–$129" },
  { id: "h22", name: "Beats Studio3 Wireless", category: "earbuds", description: "Apple-powered over-ear headphones with Pure ANC, W1 chip, and 22-hour battery. Strong bass emphasis.", insight: "Popular with Apple and Android users", price: "$199–$249" },
  { id: "h23", name: "Jabra Evolve 40", category: "earbuds", description: "Wired USB headset optimized for calls and music. Simple, reliable choice for office and remote work.", insight: "Top corded office headset", price: "$79–$99" },
  { id: "h24", name: "Audio-Technica ATH-M50x", category: "earbuds", description: "Studio monitor headphones with exceptional clarity and flat response curve. Beloved by musicians and podcasters.", insight: "Industry-standard studio headphones", price: "$149–$179" },
  { id: "h25", name: "Tribit XFree Tune", category: "earbuds", description: "Budget wireless on-ear headphones with Hi-Fi sound, 40-hour battery, and foldable design.", insight: "Best budget wireless headphones", price: "$39–$59" },
  // Additional fitness
  { id: "f16", name: "Marcy Smith Cage System", category: "fitness", description: "Smith machine with a functional trainer for cable exercises. A complete home gym for intermediate lifters.", insight: "Popular all-in-one home gym system", price: "$699–$899" },
  { id: "f17", name: "Total Gym XLS", category: "fitness", description: "Incline bodyweight training system used by celebrities and physical therapists. Up to 80 exercises.", insight: "Best bodyweight cable gym", price: "$899–$1,099" },
  { id: "f18", name: "Push-Up Bars", category: "fitness", description: "Simple rotating push-up handles that improve form, reduce wrist strain, and increase range of motion.", insight: "Best minimal home gym tool", price: "$19–$29" },
  { id: "f19", name: "Ankle Weights (Reebok)", category: "fitness", description: "Adjustable ankle weight set for lower body toning, leg lifts, and walking exercises. Easy to strap on.", insight: "Most popular ankle weight set", price: "$24–$49" },
  { id: "f20", name: "Ab Wheel Roller", category: "fitness", description: "Simple but effective core training tool. Roll out for challenging ab workouts requiring zero equipment.", insight: "Most underrated core tool", price: "$14–$29" },
  { id: "f21", name: "Gym Gloves Set", category: "fitness", description: "Workout gloves with wrist wrap support to protect hands during weightlifting and gym sessions.", insight: "Popular add-on for weight training", price: "$19–$29" },
  { id: "f22", name: "Balance Ball (Gaiam)", category: "fitness", description: "Anti-burst exercise ball for core workouts, yoga, and physical therapy. Also used as a desk chair.", insight: "Best stability ball for home use", price: "$21–$39" },
  // Additional travel
  { id: "t16", name: "JanSport SuperBreak Backpack", category: "travel", description: "Classic everyday backpack with a single main compartment and front utility pocket. Iconic and durable.", insight: "Most iconic everyday backpack", price: "$49–$69" },
  { id: "t17", name: "Carhartt Legacy Travel Pack", category: "travel", description: "Rugged work-ready backpack with multiple compartments and reinforced construction. Great for tradespeople and travelers.", insight: "Top pick for rugged durability", price: "$99–$129" },
  { id: "t18", name: "Delsey Paris Helium Aero Spinner", category: "travel", description: "Lightweight polycarbonate hardshell spinner with TSA lock and elegant design. Popular French luggage brand.", insight: "Best stylish checked luggage", price: "$299–$329" },
  { id: "t19", name: "Sea to Summit Pack Organizer", category: "travel", description: "Ultralight dry bag organizer set for separating gear in any bag. Popular with backpackers and minimalist travelers.", insight: "Best ultralight packing organizer", price: "$24–$39" },
  { id: "t20", name: "Travelpro TSA Toiletry Kit", category: "travel", description: "TSA-accepted hanging toiletry bag with multiple compartments and hook system. Trusted by frequent flyers.", insight: "Most organized travel toiletry bag", price: "$39–$59" },
  { id: "t21", name: "Osprey Ultralight Dry Sack Set", category: "travel", description: "Waterproof dry bags in various sizes for protecting gear during water activities and camping.", insight: "Top waterproof gear protection", price: "$24–$39" },
  { id: "t22", name: "Mpow Travel Adapter", category: "travel", description: "Universal travel adapter with 4 USB ports, compatible with outlets in 150+ countries worldwide.", insight: "Best budget travel adapter", price: "$19–$29" },
  { id: "t23", name: "Sony WH-CH510 Travel Headphones", category: "travel", description: "Lightweight wireless on-ear headphones with 35-hour battery. A simple, affordable option for travel audio.", insight: "Best budget travel headphones", price: "$59–$79" },
  { id: "t24", name: "Kindle Paperwhite Signature Travel Edition", category: "travel", description: "Bundled Kindle Paperwhite with a case, wireless charging, and auto-adjusting warm light for nighttime reading.", insight: "Perfect reading bundle for travelers", price: "$189–$219" },
  // Phones
  { id: "p_phone1", name: "Pixel 8a", category: "phone", description: "Mid-range Android phone with strong camera performance, 7 years of OS updates, and clean software.", insight: "Praised for camera and software" },
  { id: "ph2", name: "Samsung Galaxy A54", category: "phone", description: "Mid-range Galaxy with 50MP camera, 5,000mAh battery, and IP67 water resistance. Popular in emerging markets.", insight: "Best mid-range Samsung under $400", price: "$349–$399" },
  { id: "ph3", name: "OnePlus 12", category: "phone", description: "Flagship Android with Snapdragon 8 Gen 3, 50W wireless charging, and a Hasselblad-tuned triple camera.", insight: "Best value flagship Android", price: "$799–$899" },
  { id: "ph4", name: "iPhone 15", category: "phone", description: "Apple's standard 2023 iPhone with Dynamic Island, 48MP main camera, USB-C, and A16 Bionic chip.", insight: "Best iPhone for most people", price: "$799–$929" },
  { id: "ph5", name: "Nothing Phone (2)", category: "phone", description: "Unique Android phone with a transparent back and LED Glyph interface. Runs a clean, near-stock Android.", insight: "Most visually distinctive phone", price: "$599–$699" },
  { id: "ph6", name: "Motorola Edge 40 Pro", category: "phone", description: "Flagship Motorola with curved OLED display, 125W charging, and 50MP camera. Solid premium offering.", insight: "Top Motorola flagship pick", price: "$599–$699" },
  // Skincare
  { id: "p3", name: "CeraVe Moisturizing Cream", category: "skincare", description: "A fragrance-free moisturizer with ceramides, commonly recommended for dry and sensitive skin types.", insight: "Loved for gentleness and affordability" },
  { id: "sk2", name: "The Ordinary Niacinamide 10%", category: "skincare", description: "Affordable serum that reduces blemishes, minimizes pores, and regulates sebum production.", insight: "Most popular affordable serum", price: "$6–$9" },
  { id: "sk3", name: "La Roche-Posay Toleriane Cleanser", category: "skincare", description: "Gentle foaming face wash recommended by dermatologists for sensitive and dry skin types.", insight: "Top dermatologist-recommended cleanser", price: "$15–$18" },
  { id: "sk4", name: "Neutrogena Hydro Boost Gel Cream", category: "skincare", description: "Lightweight water-gel moisturizer with hyaluronic acid that hydrates without feeling heavy or greasy.", insight: "Most repurchased drugstore moisturizer", price: "$18–$22" },
  { id: "sk5", name: "Paula's Choice BHA Exfoliant", category: "skincare", description: "Chemical exfoliant that unclogs pores, reduces blackheads, and smooths skin texture. Cult-favorite status.", insight: "Cult classic for acne-prone skin", price: "$34–$39" },
  // Perfume
  { id: "p6", name: "Maison Margiela Replica Beach Walk", category: "perfume", description: "A light, fresh fragrance with coconut and white musk notes. Often described as a warm-weather, everyday scent.", insight: "Popular for long-lasting scent" },
  { id: "pf2", name: "Dior Sauvage EDT", category: "perfume", description: "Woody, fresh masculine fragrance with bergamot and ambroxan. One of the world's best-selling men's fragrances.", insight: "Most popular men's designer fragrance", price: "$89–$139" },
  { id: "pf3", name: "Chanel Chance Eau Tendre", category: "perfume", description: "A soft, floral-citrus feminine fragrance with jasmine and white musk. Youthful and versatile.", insight: "Top women's fragrance for daily wear", price: "$99–$149" },
  { id: "pf4", name: "Versace Eros", category: "perfume", description: "Fresh, aromatic fragrance with mint, apple, and tonka bean. Popular with younger men for its bold character.", insight: "Most popular youth fragrance", price: "$59–$89" },
  { id: "pf5", name: "Viktor & Rolf Flowerbomb", category: "perfume", description: "Explosive floral fragrance with jasmine, rose, and patchouli. A classic feminine bestseller worldwide.", insight: "Best-selling floral feminine fragrance", price: "$129–$179" },
  { id: "pf6", name: "Yves Saint Laurent Black Opium", category: "perfume", description: "Warm, addictive feminine fragrance with coffee, vanilla, and white flowers. Great for evenings.", insight: "Top evening/night fragrance for women", price: "$99–$149" },
];

export default function ProductsTab() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [priceRange, setPriceRange] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedFeature, setSelectedFeature] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const { data: dbProducts = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.Product.list("-created_date", 100),
  });

  const allProducts = dbProducts.length > 0 ? dbProducts : SAMPLE_PRODUCTS;

  // Available brands for current category
  const availableBrands = useMemo(() => {
    const base = activeCategory === "all" ? allProducts : allProducts.filter(p => p.category === activeCategory);
    const brands = [...new Set(base.map(p => getBrand(p.name)))].sort();
    return ["all", ...brands];
  }, [allProducts, activeCategory]);

  // Available features for current category
  const availableFeatures = useMemo(() => {
    const base = activeCategory === "all" ? allProducts : allProducts.filter(p => p.category === activeCategory);
    const featureSet = new Set();
    base.forEach(p => getFeatures(p).forEach(f => featureSet.add(f)));
    return ["all", ...Array.from(featureSet).sort()];
  }, [allProducts, activeCategory]);

  const filtered = useMemo(() => {
    let list = activeCategory === "all" ? allProducts : allProducts.filter(p => p.category === activeCategory);

    // Price filter
    if (priceRange !== "all") {
      const range = PRICE_RANGES.find(r => r.key === priceRange);
      if (range) {
        list = list.filter(p => {
          const min = parseMinPrice(p.price);
          return min >= range.min && min < (range.max === Infinity ? 999999 : range.max + 1);
        });
      }
    }

    // Brand filter
    if (selectedBrand !== "all") {
      list = list.filter(p => getBrand(p.name) === selectedBrand);
    }

    // Feature filter
    if (selectedFeature !== "all") {
      list = list.filter(p => getFeatures(p).includes(selectedFeature));
    }

    // Sort
    if (sortBy === "price_asc") {
      list = [...list].sort((a, b) => parseMinPrice(a.price) - parseMinPrice(b.price));
    } else if (sortBy === "price_desc") {
      list = [...list].sort((a, b) => parseMinPrice(b.price) - parseMinPrice(a.price));
    } else if (sortBy === "name_asc") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "newest") {
      list = [...list].reverse();
    }
    // "popular" = default order

    return list;
  }, [allProducts, activeCategory, priceRange, selectedBrand, selectedFeature, sortBy]);

  const activeFilterCount = [priceRange !== "all", selectedBrand !== "all", selectedFeature !== "all"].filter(Boolean).length;

  const resetFilters = () => {
    setPriceRange("all");
    setSelectedBrand("all");
    setSelectedFeature("all");
    setSortBy("popular");
  };

  return (
    <div className="pb-24">
      {/* Category chips */}
      <div className="px-5 mb-3 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 w-max">
          {PRODUCT_CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => { setActiveCategory(c.key); setSelectedBrand("all"); setSelectedFeature("all"); }}
              className="px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-all active:scale-95"
              style={{
                backgroundColor: activeCategory === c.key ? "var(--accent-primary)" : "var(--bg-card)",
                color: activeCategory === c.key ? "#fff" : "var(--text-secondary)",
                borderColor: activeCategory === c.key ? "var(--accent-primary)" : "var(--border-light)",
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort & Filter bar */}
      <div className="px-5 mb-3 flex items-center gap-2">
        {/* Sort selector */}
        <div className="relative flex-1">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="w-full text-xs font-medium rounded-xl px-3 py-2 pr-7 appearance-none outline-none border"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)", color: "var(--text-primary)" }}
          >
            {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "var(--text-hint)" }} />
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(f => !f)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all shrink-0"
          style={{
            backgroundColor: showFilters || activeFilterCount > 0 ? "var(--accent-primary)" : "var(--bg-card)",
            color: showFilters || activeFilterCount > 0 ? "#fff" : "var(--text-secondary)",
            borderColor: showFilters || activeFilterCount > 0 ? "var(--accent-primary)" : "var(--border-light)",
          }}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
        </button>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="mx-5 mb-3 rounded-2xl p-4 space-y-3" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Filters</p>
            {activeFilterCount > 0 && (
              <button onClick={resetFilters} className="text-xs flex items-center gap-1" style={{ color: "var(--accent-secondary)" }}>
                <X className="w-3 h-3" /> Reset
              </button>
            )}
          </div>

          {/* Price Range */}
          <div>
            <p className="text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Price Range</p>
            <div className="flex flex-wrap gap-1.5">
              {PRICE_RANGES.map(r => (
                <button
                  key={r.key}
                  onClick={() => setPriceRange(r.key)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all"
                  style={{
                    backgroundColor: priceRange === r.key ? "var(--accent-primary)" : "var(--bg-subtle)",
                    color: priceRange === r.key ? "#fff" : "var(--text-secondary)",
                    borderColor: priceRange === r.key ? "var(--accent-primary)" : "transparent",
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Brand */}
          <div>
            <p className="text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Brand</p>
            <div className="relative">
              <select
                value={selectedBrand}
                onChange={e => setSelectedBrand(e.target.value)}
                className="w-full text-xs rounded-xl px-3 py-2 pr-7 appearance-none outline-none border"
                style={{ backgroundColor: "var(--bg-subtle)", borderColor: "var(--border-light)", color: "var(--text-primary)" }}
              >
                {availableBrands.map(b => <option key={b} value={b}>{b === "all" ? "All Brands" : b}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "var(--text-hint)" }} />
            </div>
          </div>

          {/* Feature */}
          {availableFeatures.length > 1 && (
            <div>
              <p className="text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Feature</p>
              <div className="flex flex-wrap gap-1.5">
                {availableFeatures.slice(0, 12).map(f => (
                  <button
                    key={f}
                    onClick={() => setSelectedFeature(f)}
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all"
                    style={{
                      backgroundColor: selectedFeature === f ? "var(--accent-primary)" : "var(--bg-subtle)",
                      color: selectedFeature === f ? "#fff" : "var(--text-secondary)",
                      borderColor: selectedFeature === f ? "var(--accent-primary)" : "transparent",
                    }}
                  >
                    {f === "all" ? "All Features" : f}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results count */}
      <p className="px-5 mb-2 text-[11px]" style={{ color: "var(--text-hint)" }}>
        {filtered.length} product{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Product cards */}
      <div className="px-5 space-y-3">
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-3xl mb-3">🔍</p>
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>No products match your filters</p>
            <button onClick={resetFilters} className="mt-3 text-xs font-semibold" style={{ color: "var(--accent-primary)" }}>Clear filters</button>
          </div>
        ) : filtered.map(product => (
          <div
            key={product.id}
            className="rounded-2xl p-4"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: "var(--accent-primary-light)" }}>
                {CATEGORY_ICONS[product.category] || "📦"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm leading-snug" style={{ color: "var(--text-primary)" }}>{product.name}</p>
                  {product.price && (
                    <span className="text-[10px] font-semibold shrink-0 px-1.5 py-0.5 rounded-full whitespace-nowrap" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
                      {product.price}
                    </span>
                  )}
                </div>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{product.description}</p>
                {product.insight && (
                  <p className="text-[10px] mt-1.5 italic" style={{ color: "var(--accent-primary)" }}>💡 {product.insight}</p>
                )}
                <QuickVote item={product} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-center px-5 mt-6" style={{ color: "var(--text-hint)" }}>
        All product names and trademarks belong to their respective owners. This platform is community-driven and not affiliated with any brand.
      </p>
    </div>
  );
}