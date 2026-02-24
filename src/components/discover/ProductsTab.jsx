import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import QuickVote from "./QuickVote";
import { Smartphone, Monitor, Headphones, Droplets, Cpu, Sprout } from "lucide-react";

const PRODUCT_CATEGORIES = [
  { key: "all", label: "All" },
  { key: "perfume", label: "🌸 Perfume" },
  { key: "laptop", label: "💻 Laptop" },
  { key: "earbuds", label: "🎧 Earbuds/Headphones" },
  { key: "phone", label: "📱 Phone" },
  { key: "skincare", label: "✨ Skincare" },
  { key: "tech_accessories", label: "🔌 Electronics" },
  { key: "fitness", label: "🏋️ Fitness" },
  { key: "travel", label: "✈️ Travel" },
];

const CATEGORY_ICONS = {
  perfume: "🌸",
  laptop: "💻",
  earbuds: "🎧",
  phone: "📱",
  skincare: "✨",
  tech_accessories: "🔌",
  fitness: "🏋️",
  travel: "✈️",
};

// Static sample products
const SAMPLE_PRODUCTS = [
  // Laptops
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
  { id: "l13", name: "HP Pavilion 15 Laptop", category: "laptop", description: "Mid-range laptop offering a balance of performance and price, suitable for students and home users. Available with various processor options.", insight: "Popular for home and school use", price: "$499–$699" },
  { id: "l14", name: "Dell Inspiron 15 3000", category: "laptop", description: "Budget-friendly Windows laptop from Dell with a 15\" screen, suitable for basic computing and web browsing.", insight: "Reliable starter laptop", price: "$399–$599" },
  { id: "l15", name: "Asus VivoBook 15", category: "laptop", description: "Colorful, lightweight laptop targeting students with decent performance, a number pad, and slim bezels at an affordable price.", insight: "Loved for looks and value", price: "$449–$599" },
  { id: "l16", name: "Acer Aspire 5", category: "laptop", description: "Well-rounded budget laptop with IPS display, AMD/Intel options, and solid build. Consistently recommended in budget laptop roundups.", insight: "Most recommended sub-$500 laptop", price: "$399–$549" },
  { id: "l17", name: "Lenovo Flex 5 14″ 2-in-1", category: "laptop", description: "Affordable 2-in-1 convertible with touchscreen and pen support. Good option for students who want laptop + tablet flexibility.", insight: "Popular budget 2-in-1 pick", price: "$499–$699" },
  { id: "l18", name: "HP Chromebook x2 12″", category: "laptop", description: "Detachable Chromebook with a sharp 3:2 display and included keyboard. Runs ChromeOS — great for web-based workflows and education.", insight: "Top detachable Chromebook", price: "$299–$399" },
  { id: "l19", name: "Samsung Chromebook Plus", category: "laptop", description: "Lightweight Chromebook with a stylus and 360-degree hinge. Designed for note-taking and Google Workspace users.", insight: "Loved for stylus integration", price: "$329–$429" },
  { id: "l20", name: "Microsoft Surface Go 3", category: "laptop", description: "Compact 10.5\" 2-in-1 Windows tablet. Portable and light — ideal for casual browsing, note-taking, and Office apps on the go.", insight: "Best ultra-portable Windows option", price: "$399–$549" },
  { id: "l21", name: "Acer Nitro 5", category: "laptop", description: "Entry-level gaming laptop with NVIDIA GTX/RTX graphics and IPS display. Popular first gaming laptop for students on a budget.", insight: "Best budget gaming laptop", price: "$899–$1,099" },
  { id: "l22", name: "MSI GF63 Thin", category: "laptop", description: "Thin and relatively lightweight gaming laptop with NVIDIA graphics. Handles most modern games at 1080p without breaking the bank.", insight: "Popular for slim gaming form factor", price: "$799–$999" },
  { id: "l23", name: "HP Victus 16", category: "laptop", description: "Gaming laptop from HP's Victus line — balances gaming performance with a more everyday aesthetic. Good display and thermals.", insight: "Praised for quiet fans and display", price: "$899–$1,199" },
  { id: "l24", name: "Dell G15", category: "laptop", description: "Gaming laptop with AMD or Intel options, solid GPU performance, and a comfortable keyboard. Dell's reliable build quality at a gaming price.", insight: "Top Dell gaming pick under $1,300", price: "$999–$1,299" },
  { id: "l25", name: "Asus TUF Gaming F17", category: "laptop", description: "Durable gaming laptop with MIL-STD-810H certification, strong battery, and efficient thermal design. A rugged gamer's choice.", insight: "Loved for durability in gaming", price: "$999–$1,299" },
  // Headphones / Earbuds
  { id: "h1", name: "Sony WH-1000XM5", category: "earbuds", description: "Over-ear wireless headphones with industry-leading noise cancellation and up to 30-hour battery. Well regarded for long listening sessions.", insight: "Most praised for noise cancellation", price: "$348–$399" },
  { id: "h2", name: "Bose QuietComfort 45", category: "earbuds", description: "Iconic over-ear ANC headphones known for comfortable fit and smooth, balanced sound profile. A classic recommendation for frequent flyers.", insight: "Loved for comfort on long trips", price: "$279–$329" },
  { id: "h3", name: "Apple AirPods Max", category: "earbuds", description: "Premium over-ear headphones with Apple's H1 chip, spatial audio, and aluminum ear cups. Seamless integration with Apple devices.", insight: "Top pick for Apple ecosystem users", price: "$499–$549" },
  { id: "h4", name: "Sennheiser Momentum 4 Wireless", category: "earbuds", description: "High-fidelity over-ear headphones with rich sound, strong ANC, and exceptional 60-hour battery. Audiophile-grade wireless audio.", insight: "Best-in-class battery & sound quality", price: "$299–$349" },
  { id: "h5", name: "Bose 700 Noise Cancelling", category: "earbuds", description: "Bose's premium ANC headphones with 11 adjustable noise-cancellation levels and voice assistant integration. Sleek modern design.", insight: "Praised for adjustable ANC levels", price: "$349–$399" },
  { id: "h6", name: "Shure AONIC 50", category: "earbuds", description: "Professional-grade wireless headphones with adjustable ANC, wired/wireless flexibility, and detailed sound. Favored by audiophiles.", insight: "Popular with audiophiles for sound accuracy", price: "$299–$349" },
  { id: "h7", name: "Bang & Olufsen Beoplay H95", category: "earbuds", description: "Ultra-premium luxury headphones with lambskin ear cushions, adaptive ANC, and 38-hour battery. Statement piece for audiophiles.", insight: "Most luxurious headphone experience", price: "$849–$949" },
  { id: "h8", name: "Sony WF-1000XM4 (TWS)", category: "earbuds", description: "Sony's flagship true wireless earbuds with LDAC hi-res audio support, great ANC, and compact design. Popular upgrade from budget earbuds.", insight: "Top TWS pick for audio quality", price: "$199–$249" },
  { id: "h9", name: "Apple AirPods Pro (2nd Gen)", category: "earbuds", description: "Apple's flagship TWS earbuds with Adaptive Transparency, H2 chip, and strong ANC. Best integration with iPhone and iPad.", insight: "Most popular earbuds for iPhone users", price: "$249–$279" },
  { id: "h10", name: "Anker Soundcore Life Q20", category: "earbuds", description: "Budget over-ear ANC headphones that punch well above their price point. Excellent value for commuters and students.", insight: "Best budget ANC headphones", price: "$59–$79" },
  { id: "h11", name: "JBL Tune 510BT", category: "earbuds", description: "Lightweight wireless on-ear headphones with 40-hour battery. Simple, reliable audio for everyday listening at an affordable price.", insight: "Most popular sub-$70 on-ear", price: "$49–$69" },
  { id: "h12", name: "Skullcandy Crusher Evo", category: "earbuds", description: "Over-ear headphones with adjustable bass sensation via haptic drivers. Unique immersive experience for bass lovers.", insight: "Loved for bass immersion feature", price: "$129–$149" },
  { id: "h13", name: "Razer BlackShark V2", category: "earbuds", description: "Gaming headset with THX Spatial Audio, detachable noise-cancelling mic, and comfortable memory foam. Top pick for PC gamers.", insight: "Best gaming headset for sound accuracy", price: "$99–$129" },
  { id: "h14", name: "HyperX Cloud II", category: "earbuds", description: "Classic gaming headset with virtual 7.1 surround, durable aluminum frame, and great microphone. A long-standing community favorite.", insight: "Most recommended entry gaming headset", price: "$99–$129" },
  { id: "h15", name: "SteelSeries Arctis 7", category: "earbuds", description: "Wireless gaming headset with 24-hour battery, ClearCast bidirectional mic, and lossless 2.4GHz connection. Versatile across PC and console.", insight: "Top wireless gaming headset pick", price: "$149–$179" },
  { id: "h16", name: "Logitech G Pro X", category: "earbuds", description: "Pro-grade gaming headset with Blue VO!CE microphone technology, designed for competitive esports players.", insight: "Favorite headset among esports pros", price: "$129–$159" },
  { id: "h17", name: "Jabra Evolve2 55", category: "earbuds", description: "Business-focused wireless headset with good microphone quality and ANC. Used heavily in remote-work and call-center setups.", insight: "Top pick for call quality", price: "$299–$349" },
  { id: "h18", name: "Philips SHP9500", category: "earbuds", description: "Open-back wired headphones beloved by audiophiles for their airy, natural soundstage. Great budget option for music purists.", insight: "Most loved budget open-back", price: "$69–$89" },
  { id: "h19", name: "Koss Porta Pro", category: "earbuds", description: "Legendary lightweight on-ear headphones with a cult following since 1984. Known for warm, punchy sound and lifetime warranty.", insight: "Cult classic with lifetime warranty", price: "$49–$69" },
  { id: "h20", name: "Sony MDR-ZX110", category: "earbuds", description: "Ultra-budget on-ear wired headphones. Simple, reliable, and widely used in schools and offices where basic audio is needed.", insight: "Best ultra-budget wired option", price: "$19–$29" },
  // Fitness
  { id: "f1", name: "Peloton Bike+", category: "fitness", description: "Premium connected indoor exercise bike with a rotating 24\" HD touchscreen, live and on-demand classes, and Auto Resistance feature.", insight: "Most praised for interactive workout experience", price: "$1,995–$2,445" },
  { id: "f2", name: "NordicTrack Commercial 1750 Treadmill", category: "fitness", description: "Feature-rich treadmill with incline and decline capabilities, 14\" HD touchscreen, and iFIT integration for guided workouts.", insight: "Top pick for home treadmill buyers", price: "$1,599–$1,899" },
  { id: "f3", name: "Concept2 Model D Rower", category: "fitness", description: "The gold-standard rowing machine used by Olympic athletes and CrossFit gyms. Durable, accurate, and stores upright for space saving.", insight: "Most recommended rowing machine globally", price: "$950–$1,150" },
  { id: "f4", name: "Bowflex SelectTech 552 Dumbbells", category: "fitness", description: "Adjustable dumbbell set that replaces 15 pairs of weights. Dial-select system lets you switch from 5 to 52.5 lbs per dumbbell.", insight: "Best space-saving adjustable dumbbells", price: "$399–$449" },
  { id: "f5", name: "Theragun PRO", category: "fitness", description: "Professional-grade percussive massage device with adjustable arm, OLED screen, and Bluetooth. Used by athletes for recovery.", insight: "Most recommended recovery device", price: "$399–$499" },
  { id: "f6", name: "Garmin Fēnix 7 Fitness Watch", category: "fitness", description: "Rugged multisport GPS smartwatch with solar charging, health monitoring, and detailed training metrics. Built for serious athletes.", insight: "Loved by endurance athletes", price: "$599–$699" },
  { id: "f7", name: "Fitbit Sense 2", category: "fitness", description: "Health-focused smartwatch with EDA stress sensor, ECG, SpO2, and 6-day battery. Ideal for wellness-conscious users.", insight: "Top health monitoring smartwatch", price: "$279–$329" },
  { id: "f8", name: "Schwinn IC4 Indoor Cycling Bike", category: "fitness", description: "Belt-driven indoor bike with 100 resistance levels, dual-sided pedals, and Bluetooth connectivity to fitness apps.", insight: "Popular Peloton alternative at lower cost", price: "$899–$1,099" },
  { id: "f9", name: "Resistance Bands Set", category: "fitness", description: "Versatile set of latex resistance bands in multiple resistance levels. Used for strength training, physical therapy, and stretching.", insight: "Most versatile home gym starter tool", price: "$19–$39" },
  { id: "f10", name: "Gaiam Yoga Mat", category: "fitness", description: "Non-slip yoga mat with alignment lines, available in various thicknesses and patterns. A community staple for yoga and pilates.", insight: "Top-selling yoga mat for beginners", price: "$29–$49" },
  { id: "f11", name: "TriggerPoint GRID Foam Roller", category: "fitness", description: "Multi-density foam roller designed to replicate a therapist's hands. Used for muscle recovery and myofascial release.", insight: "Most recommended foam roller", price: "$29–$49" },
  { id: "f12", name: "WOD Nation Jump Rope", category: "fitness", description: "Speed jump rope with adjustable cable and comfortable handles. Used by CrossFit athletes and beginners for cardio conditioning.", insight: "Best jump rope for speed training", price: "$19–$29" },
  { id: "f13", name: "Bowflex PR1000 Home Gym", category: "fitness", description: "Compact home gym with over 30 exercises, rowing machine, and 210 lbs of resistance. Great for full-body workouts at home.", insight: "Best all-in-one home gym under $800", price: "$699–$799" },
  { id: "f14", name: "Titan Fitness Power Rack", category: "fitness", description: "Heavy-duty steel power rack for squats, bench press, and pull-ups. Popular in home garage gym setups for serious lifting.", insight: "Community favorite for garage gyms", price: "$499–$699" },
  { id: "f15", name: "Sunny Health & Fitness Treadmill", category: "fitness", description: "Budget-friendly folding treadmill with manual incline, LCD display, and simple controls. Good for walking and light jogging.", insight: "Best budget folding treadmill", price: "$399–$499" },
  // Electronics
  { id: "e1", name: "Apple iPhone 15 Pro Max", category: "tech_accessories", description: "Apple's flagship iPhone with titanium frame, A17 Pro chip, 48MP camera system, and USB-C. Top-tier smartphone performance.", insight: "Best camera system on an iPhone", price: "$1,099–$1,299" },
  { id: "e2", name: "Samsung Galaxy S24 Ultra", category: "tech_accessories", description: "Samsung's powerhouse with built-in S Pen, 200MP camera, 6.8\" display, and Galaxy AI features. A productivity beast.", insight: "Most feature-packed Android flagship", price: "$1,199–$1,399" },
  { id: "e3", name: "Google Pixel 8 Pro", category: "tech_accessories", description: "Google's flagship with best-in-class computational photography, 7 years of OS updates, and clean Android experience.", insight: "Top pick for software and camera", price: "$899–$999" },
  { id: "e4", name: "Apple iPad Pro 12.9″ (M2)", category: "tech_accessories", description: "Pro tablet with M2 chip, Liquid Retina XDR display, and Apple Pencil 2 support. Replaces a laptop for many creative workflows.", insight: "Best tablet for creative professionals", price: "$1,099–$1,899" },
  { id: "e5", name: "Samsung Galaxy Tab S9+", category: "tech_accessories", description: "Premium Android tablet with AMOLED display, S Pen included, and DeX desktop mode. Strong competitor to iPad Pro.", insight: "Best Android tablet for productivity", price: "$899–$999" },
  { id: "e6", name: "Sony A7 IV Mirrorless Camera", category: "tech_accessories", description: "Full-frame mirrorless camera with 33MP sensor, 4K60 video, and advanced autofocus. Popular with portrait and hybrid shooters.", insight: "Top pick for photo/video hybrid work", price: "$1,998–$2,199" },
  { id: "e7", name: "DJI Air 3 Drone", category: "tech_accessories", description: "Consumer drone with dual main cameras, 4K/60fps video, 46-minute flight time, and omnidirectional obstacle sensing.", insight: "Most recommended travel drone 2024", price: "$999–$1,199" },
  { id: "e8", name: "GoPro HERO12 Black", category: "tech_accessories", description: "Action camera with HyperSmooth 6.0 stabilization, 5.3K video, and waterproof to 10m. Go-to for outdoor adventurers.", insight: "Best action camera for adventure sports", price: "$399–$449" },
  { id: "e9", name: "Apple Watch Ultra", category: "tech_accessories", description: "Rugged titanium smartwatch designed for extreme athletes — 60-hour battery in low-power mode, dive computer, and loud siren.", insight: "Most capable Apple Watch ever", price: "$799–$849" },
  { id: "e10", name: "Fitbit Charge 6", category: "tech_accessories", description: "Slim fitness tracker with Google Maps, Google Wallet, ECG, and YouTube Music controls. Daily wellness tracking made easy.", insight: "Best slim fitness tracker with Google", price: "$149–$179" },
  { id: "e11", name: "Kindle Paperwhite (11th Gen)", category: "tech_accessories", description: "Waterproof e-reader with a flush-front 6.8\" display, warm light, and weeks of battery. The definitive e-reader for most people.", insight: "Most recommended e-reader", price: "$139–$159" },
  { id: "e12", name: "Anker PowerCore 20100 PD", category: "tech_accessories", description: "High-capacity portable charger that can charge two devices simultaneously, including USB-C laptops. A travel essential.", insight: "Top power bank for travel", price: "$49–$69" },
  { id: "e13", name: "Roku Ultra Streaming Player", category: "tech_accessories", description: "4K streaming device with Dolby Vision, Dolby Atmos, and a personal button for private listening via the Roku remote.", insight: "Best standalone streaming device", price: "$89–$119" },
  { id: "e14", name: "Samsung T7 Portable SSD 1TB", category: "tech_accessories", description: "Fast, compact USB 3.2 external SSD with metal casing and password encryption. Popular for photographers and video editors on the go.", insight: "Most popular portable SSD", price: "$109–$139" },
  { id: "e15", name: "Sonos Ray Soundbar", category: "tech_accessories", description: "Compact soundbar that upgrades TV audio with clear dialogue and Sonos multi-room compatibility. Great entry point into the Sonos ecosystem.", insight: "Best compact soundbar entry point", price: "$279–$319" },
  { id: "e16", name: "LG C3 OLED TV 55″", category: "tech_accessories", description: "Award-winning OLED TV with near-infinite contrast, 120Hz gaming mode, and Dolby Vision IQ. Consistently rated best TV for image quality.", insight: "Best OLED TV for the money", price: "$1,499–$1,699" },
  { id: "e17", name: "Dell 27″ 4K Monitor", category: "tech_accessories", description: "USB-C 4K IPS monitor with wide color coverage and height-adjustable stand. Widely recommended for home office and creative work.", insight: "Top-rated work-from-home monitor", price: "$499–$599" },
  { id: "e18", name: "Apple AirTag 4-Pack", category: "tech_accessories", description: "Apple's precision item tracker using U1 chip and the Find My network. Attach to keys, bags, or valuables to locate them easily.", insight: "Most used item tracker in Apple ecosystem", price: "$99–$119" },
  // Travel
  { id: "t1", name: "Away The Bigger Carry-On", category: "travel", description: "Premium hardshell carry-on suitcase with a built-in battery (removable for TSA), 360° spinner wheels, and lifetime warranty.", insight: "Most gifted premium carry-on", price: "$275–$295" },
  { id: "t2", name: "Travelpro Platinum Elite 29″", category: "travel", description: "Professional-grade spinner suitcase trusted by flight crews. Lightweight, durable, and packed with organizational pockets.", insight: "Favorite luggage of frequent flyers", price: "$449–$499" },
  { id: "t3", name: "Samsonite Omni PC Hardside 28″", category: "travel", description: "Polycarbonate hardshell suitcase with multi-directional spinner wheels and TSA-approved lock. Reliable for checked baggage.", insight: "Best value hardshell checked luggage", price: "$319–$359" },
  { id: "t4", name: "Osprey Farpoint 40 Backpack", category: "travel", description: "Award-winning travel backpack that fits as a carry-on, with a padded suspension system and lockable zippers. Loved by backpackers.", insight: "Most recommended travel backpack", price: "$159–$189" },
  { id: "t5", name: "Patagonia Black Hole Duffel 55L", category: "travel", description: "Rugged, water-resistant duffel made from recycled materials. Convertible to a backpack. Beloved by outdoor adventurers.", insight: "Top duffel for outdoor travelers", price: "$179–$209" },
  { id: "t6", name: "Herschel Little America Backpack", category: "travel", description: "Classic-styled daypack with padded laptop compartment and signature stripe lining. Popular for city travel and commuting.", insight: "Most stylish everyday travel backpack", price: "$99–$129" },
  { id: "t7", name: "Anker PowerCore 26800 Portable Charger", category: "travel", description: "High-capacity travel power bank that can charge smartphones multiple times before needing a recharge. Great for long flights.", insight: "Best high-capacity travel power bank", price: "$59–$79" },
  { id: "t8", name: "Bose Sleepbuds II", category: "travel", description: "Sleep earbuds that play soothing sounds to mask noise — not regular audio. Designed specifically for better sleep while traveling.", insight: "Top pick for blocking hotel/flight noise", price: "$249–$279" },
  { id: "t9", name: "Eagle Creek Pack-It Specter Cube Set", category: "travel", description: "Ultra-lightweight packing cubes in three sizes. Help compress and organize clothes in any luggage type.", insight: "Community favorite for luggage organization", price: "$54–$74" },
  { id: "t10", name: "Travelon Anti-Theft Crossbody Bag", category: "travel", description: "Slash-resistant crossbody bag with locking zippers and RFID blocking. Designed to protect valuables in busy tourist destinations.", insight: "Most recommended anti-theft travel bag", price: "$49–$69" },
  { id: "t11", name: "Cabeau Evolution Pillow", category: "travel", description: "Memory foam travel pillow with a unique support system for resting your head at any angle. Comes with a carry case.", insight: "Top-rated neck pillow for flights", price: "$39–$59" },
  { id: "t12", name: "Etekcity Luggage Scale", category: "travel", description: "Digital handheld luggage scale with backlit display. Prevents overweight bag fees at the airport. Compact and affordable.", insight: "Most practical travel accessory under $30", price: "$19–$29" },
  { id: "t13", name: "GoPro HERO11 Black Travel Kit", category: "travel", description: "Bundled action camera kit with extra accessories — mounts, batteries, and carrying case. Ready for adventure travel right out of the box.", insight: "Best camera bundle for adventure travel", price: "$399–$449" },
  { id: "t14", name: "Tile Pro (2024)", category: "travel", description: "Bluetooth tracker that works with a community network to find lost luggage, keys, or bags. Louder speaker than previous generations.", insight: "Most used Bluetooth tracker for luggage", price: "$34–$49" },
  { id: "t15", name: "Anker Nano II 65W Charger", category: "travel", description: "Compact GaN USB-C charger that can power a laptop, tablet, and phone simultaneously. Small enough to always keep in a bag.", insight: "Best travel charger for laptop users", price: "$29–$49" },
  // Original
  { id: "p3", name: "CeraVe Moisturizing Cream", category: "skincare", description: "A fragrance-free moisturizer with ceramides, commonly recommended for dry and sensitive skin types.", insight: "Loved for gentleness and affordability" },
  { id: "p6", name: "Maison Margiela Replica Beach Walk", category: "perfume", description: "A light, fresh fragrance with coconut and white musk notes. Often described as a warm-weather, everyday scent.", insight: "Popular for long-lasting scent" },
  { id: "p_phone1", name: "Pixel 8a", category: "phone", description: "Mid-range Android phone with strong camera performance, 7 years of OS updates, and clean software. Great value proposition.", insight: "Praised for camera and software" },
];

export default function ProductsTab() {
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: dbProducts = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.Product.list("-created_date", 100),
  });

  const allProducts = dbProducts.length > 0 ? dbProducts : SAMPLE_PRODUCTS;

  const filtered = activeCategory === "all"
    ? allProducts
    : allProducts.filter(p => p.category === activeCategory);

  return (
    <div className="pb-24">
      {/* Category chips */}
      <div className="px-5 mb-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 w-max">
          {PRODUCT_CATEGORIES.map(c => (
            <button
              key={c.key}
              onClick={() => setActiveCategory(c.key)}
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

      {/* Product cards */}
      <div className="px-5 space-y-3">
        {filtered.map(product => (
          <div
            key={product.id}
            className="rounded-2xl p-4"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                style={{ backgroundColor: "var(--accent-primary-light)" }}
              >
                {CATEGORY_ICONS[product.category] || "📦"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{product.name}</p>
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

      {/* Legal notice */}
      <p className="text-[10px] text-center px-5 mt-6" style={{ color: "var(--text-hint)" }}>
        All product names and trademarks belong to their respective owners. This platform is community-driven and not affiliated with any brand.
      </p>
    </div>
  );
}