import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Search, Bookmark, BookmarkCheck, Star, ChevronDown, X, TrendingUp, Flame, Shuffle } from "lucide-react";
import SpotifyMusicTab from "./SpotifyMusicTab";
import OpenLibraryBooksTab from "./OpenLibraryBooksTab";
import TmdbMoviesTab from "./TmdbMoviesTab";

// ─── Static Catalogue ──────────────────────────────────────────────────────

const MEDIA_CATALOGUE = [
  // ── MOVIES ──
  { id: "mv1", title: "Inception", media_type: "movie", genre: ["Sci-Fi","Thriller"], mood_tags: ["Mind-Bending","Epic","Tense"], description: "A skilled operative is hired to plant an idea into the mind of a CEO by navigating layers of shared dreamscapes.", release_year: 2010, creator: "Christopher Nolan", suggested_audience: "Fans of complex narratives and visual storytelling", similar_items: ["Interstellar","The Matrix","Shutter Island"] },
  { id: "mv2", title: "The Shawshank Redemption", media_type: "movie", genre: ["Drama"], mood_tags: ["Emotional","Hopeful","Inspiring"], description: "A man wrongly convicted of murder forms an unlikely friendship while navigating decades of prison life.", release_year: 1994, creator: "Frank Darabont", suggested_audience: "Anyone who appreciates character-driven storytelling", similar_items: ["The Green Mile","Papillon","Cool Hand Luke"] },
  { id: "mv3", title: "Parasite", media_type: "movie", genre: ["Thriller","Drama"], mood_tags: ["Dark","Tense","Thought-Provoking"], description: "A family of con artists infiltrates the life of a wealthy household, setting off a chain of unforeseen events.", release_year: 2019, creator: "Bong Joon-ho", suggested_audience: "Fans of social commentary and genre-bending narratives", similar_items: ["Burning","Snowpiercer","Get Out"] },
  { id: "mv4", title: "Interstellar", media_type: "movie", genre: ["Sci-Fi","Adventure"], mood_tags: ["Epic","Emotional","Mind-Bending"], description: "A team of astronauts travels through a wormhole near Saturn searching for a new habitable planet as Earth deteriorates.", release_year: 2014, creator: "Christopher Nolan", suggested_audience: "Sci-fi enthusiasts and fans of hard science themes", similar_items: ["Gravity","The Martian","2001: A Space Odyssey"] },
  { id: "mv5", title: "Get Out", media_type: "movie", genre: ["Horror","Thriller"], mood_tags: ["Tense","Dark","Thought-Provoking"], description: "A Black man visiting his white girlfriend's family begins noticing increasingly disturbing behaviors among the community.", release_year: 2017, creator: "Jordan Peele", suggested_audience: "Horror fans interested in psychological and social themes", similar_items: ["Us","Nope","Hereditary"] },
  { id: "mv6", title: "Everything Everywhere All at Once", media_type: "movie", genre: ["Sci-Fi","Comedy","Drama"], mood_tags: ["Chaotic","Emotional","Mind-Bending"], description: "A laundromat owner discovers she must connect with alternate versions of herself to prevent a multiverse-threatening force.", release_year: 2022, creator: "Daniels", suggested_audience: "Viewers open to unconventional, emotionally layered storytelling", similar_items: ["Spider-Man: Into the Spider-Verse","Swiss Army Man","The One I Love"] },
  { id: "mv7", title: "Dune: Part One", media_type: "movie", genre: ["Sci-Fi","Adventure"], mood_tags: ["Epic","Atmospheric","Dark"], description: "A noble heir is thrust into a dangerous desert world where rival factions battle over a precious resource.", release_year: 2021, creator: "Denis Villeneuve", suggested_audience: "Fans of epic world-building and political sci-fi", similar_items: ["Blade Runner 2049","Foundation","Lawrence of Arabia"] },
  { id: "mv8", title: "The Godfather", media_type: "movie", genre: ["Crime","Drama"], mood_tags: ["Dark","Intense","Classic"], description: "The aging patriarch of a powerful crime dynasty transfers control of his empire to his reluctant youngest son.", release_year: 1972, creator: "Francis Ford Coppola", suggested_audience: "Fans of crime dramas and classic cinema", similar_items: ["Goodfellas","The Godfather Part II","Scarface"] },
  { id: "mv9", title: "Spirited Away", media_type: "movie", genre: ["Animation","Fantasy"], mood_tags: ["Whimsical","Magical","Chill"], description: "A young girl wanders into a spirit world and must work at a supernatural bathhouse to rescue her transformed parents.", release_year: 2001, creator: "Hayao Miyazaki", suggested_audience: "All ages; especially fans of imaginative animated worlds", similar_items: ["Princess Mononoke","My Neighbor Totoro","Howl's Moving Castle"] },
  { id: "mv10", title: "Whiplash", media_type: "movie", genre: ["Drama"], mood_tags: ["Intense","Motivating","Stressful"], description: "A driven jazz student pursues perfection under the brutal mentorship of a feared music conservatory instructor.", release_year: 2014, creator: "Damien Chazelle", suggested_audience: "Fans of music and stories about ambition and obsession", similar_items: ["Black Swan","La La Land","Birdman"] },
  { id: "mv11", title: "The Dark Knight", media_type: "movie", genre: ["Action","Thriller"], mood_tags: ["Dark","Epic","Intense"], description: "Batman faces his greatest psychological challenge when the anarchic Joker plunges Gotham City into chaos.", release_year: 2008, creator: "Christopher Nolan", suggested_audience: "Fans of dark superhero films and psychological thrillers", similar_items: ["Batman Begins","The Dark Knight Rises","Joker"] },
  { id: "mv12", title: "12 Angry Men", media_type: "movie", genre: ["Drama","Thriller"], mood_tags: ["Intense","Thought-Provoking","Classic"], description: "Twelve jurors must deliberate the fate of a young man accused of murder in a sweltering jury room.", release_year: 1957, creator: "Sidney Lumet", suggested_audience: "Fans of courtroom dramas and character studies", similar_items: ["Inherit the Wind","A Few Good Men","The Verdict"] },
  { id: "mv13", title: "The Lord of the Rings: The Return of the King", media_type: "movie", genre: ["Fantasy","Adventure"], mood_tags: ["Epic","Emotional","Classic"], description: "The final chapter in Tolkien's epic as Frodo and Sam close in on Mount Doom while Aragorn rallies the forces of good.", release_year: 2003, creator: "Peter Jackson", suggested_audience: "Fans of epic fantasy and adventure", similar_items: ["The Two Towers","The Fellowship of the Ring","The Hobbit"] },
  { id: "mv14", title: "Schindler's List", media_type: "movie", genre: ["Drama","History"], mood_tags: ["Dark","Emotional","Haunting"], description: "German industrialist Oskar Schindler saves over a thousand Jewish refugees during the Holocaust by employing them in his factories.", release_year: 1993, creator: "Steven Spielberg", suggested_audience: "Those seeking powerful historical drama", similar_items: ["The Pianist","Life is Beautiful","Son of Saul"] },
  { id: "mv15", title: "Pulp Fiction", media_type: "movie", genre: ["Crime","Thriller"], mood_tags: ["Dark","Witty","Classic"], description: "The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.", release_year: 1994, creator: "Quentin Tarantino", suggested_audience: "Fans of nonlinear storytelling and sharp dialogue", similar_items: ["Reservoir Dogs","Inglourious Basterds","Jackie Brown"] },
  { id: "mv16", title: "The Lord of the Rings: The Fellowship of the Ring", media_type: "movie", genre: ["Fantasy","Adventure"], mood_tags: ["Epic","Magical","Classic"], description: "A hobbit and his companions set out on a journey to destroy a powerful ring and save Middle-earth.", release_year: 2001, creator: "Peter Jackson", suggested_audience: "Fans of classic fantasy world-building", similar_items: ["The Two Towers","The Return of the King","The Hobbit"] },
  { id: "mv17", title: "The Good, the Bad and the Ugly", media_type: "movie", genre: ["Western"], mood_tags: ["Epic","Classic","Intense"], description: "Three gunslingers compete to find a Confederate soldier's gold amid the American Civil War.", release_year: 1966, creator: "Sergio Leone", suggested_audience: "Fans of classic spaghetti westerns", similar_items: ["Once Upon a Time in the West","A Fistful of Dollars","True Grit"] },
  { id: "mv18", title: "Forrest Gump", media_type: "movie", genre: ["Drama","Romance"], mood_tags: ["Emotional","Inspiring","Classic"], description: "A man with a low IQ witnesses and is part of pivotal historical events of the 20th century in America.", release_year: 1994, creator: "Robert Zemeckis", suggested_audience: "Anyone who loves heartwarming, sweeping life stories", similar_items: ["Cast Away","Big Fish","The Green Mile"] },
  { id: "mv19", title: "The Lord of the Rings: The Two Towers", media_type: "movie", genre: ["Fantasy","Adventure"], mood_tags: ["Epic","Dark","Classic"], description: "The fellowship continues to splinter as war erupts across Middle-earth and Frodo draws closer to Mordor.", release_year: 2002, creator: "Peter Jackson", suggested_audience: "Fans of epic fantasy battles and world-building", similar_items: ["The Fellowship of the Ring","The Return of the King","The Hobbit"] },
  { id: "mv20", title: "Fight Club", media_type: "movie", genre: ["Drama","Thriller"], mood_tags: ["Dark","Mind-Bending","Rebellious"], description: "An insomniac office worker forms an underground fight club with a soap salesman that spirals into something far more sinister.", release_year: 1999, creator: "David Fincher", suggested_audience: "Fans of psychological thrillers and anti-establishment narratives", similar_items: ["Se7en","American Psycho","Gone Girl"] },
  { id: "mv21", title: "The Empire Strikes Back", media_type: "movie", genre: ["Sci-Fi","Adventure"], mood_tags: ["Epic","Dark","Classic"], description: "The Rebel Alliance faces the might of the Galactic Empire as Luke Skywalker begins his Jedi training with Yoda.", release_year: 1980, creator: "Irvin Kershner", suggested_audience: "Fans of space opera and adventure", similar_items: ["A New Hope","Return of the Jedi","Rogue One"] },
  { id: "mv22", title: "The Matrix", media_type: "movie", genre: ["Sci-Fi","Action"], mood_tags: ["Mind-Bending","Epic","Dark"], description: "A computer hacker discovers that reality as he knows it is a simulation and joins a rebellion against its machine controllers.", release_year: 1999, creator: "The Wachowskis", suggested_audience: "Fans of philosophical sci-fi and action", similar_items: ["Inception","Dark City","Blade Runner 2049"] },
  { id: "mv23", title: "Goodfellas", media_type: "movie", genre: ["Crime","Drama"], mood_tags: ["Dark","Intense","Classic"], description: "The rise and fall of a mob associate over several decades in New York's criminal underworld.", release_year: 1990, creator: "Martin Scorsese", suggested_audience: "Fans of crime dramas and true-crime stories", similar_items: ["The Godfather","Casino","The Irishman"] },
  { id: "mv24", title: "One Flew Over the Cuckoo's Nest", media_type: "movie", genre: ["Drama"], mood_tags: ["Dark","Thought-Provoking","Classic"], description: "A criminal feigning insanity to avoid prison time disrupts a mental institution and inspires fellow patients.", release_year: 1975, creator: "Miloš Forman", suggested_audience: "Fans of character-driven drama and social commentary", similar_items: ["A Beautiful Mind","Girl Interrupted","The Shawshank Redemption"] },
  { id: "mv25", title: "Se7en", media_type: "movie", genre: ["Thriller","Crime"], mood_tags: ["Dark","Haunting","Intense"], description: "Two detectives hunt a serial killer whose crimes are based on the seven deadly sins.", release_year: 1995, creator: "David Fincher", suggested_audience: "Fans of dark psychological crime thrillers", similar_items: ["Fight Club","Silence of the Lambs","Zodiac"] },
  { id: "mv26", title: "Good Omens", media_type: "movie", genre: ["Comedy","Fantasy"], mood_tags: ["Witty","Funny","Whimsical"], description: "An angel and a demon who have lived on Earth since the beginning team up to prevent the Apocalypse.", release_year: 1995, creator: "Terry Pratchett & Neil Gaiman", suggested_audience: "Fans of British humor and fantasy", similar_items: ["Hitchhiker's Guide","Discworld","Dirk Gently"] },

  // ── TV SHOWS ──
  { id: "tv1", title: "Breaking Bad", media_type: "show", genre: ["Crime","Drama","Thriller"], mood_tags: ["Dark","Intense","Addictive"], description: "A high school chemistry teacher diagnosed with cancer turns to manufacturing drugs to secure his family's future.", release_year: 2008, creator: "Vince Gilligan", suggested_audience: "Fans of moral complexity and slow-burn transformation stories", similar_items: ["Better Call Saul","Ozark","Narcos"] },
  { id: "tv2", title: "Chernobyl", media_type: "show", genre: ["Drama","History"], mood_tags: ["Dark","Haunting","Educational"], description: "A miniseries dramatizing the 1986 nuclear disaster in Soviet Ukraine and the subsequent investigation and cleanup.", release_year: 2019, creator: "Craig Mazin", suggested_audience: "Viewers interested in historical events and institutional accountability", similar_items: ["The Looming Tower","Dopesick","The People v. O.J. Simpson"] },
  { id: "tv3", title: "Fleabag", media_type: "show", genre: ["Comedy","Drama"], mood_tags: ["Emotional","Witty","Raw"], description: "A sharp-tongued woman navigates grief, relationships, and family dysfunction in modern London — often breaking the fourth wall.", release_year: 2016, creator: "Phoebe Waller-Bridge", suggested_audience: "Fans of dry humor and emotionally honest storytelling", similar_items: ["Catastrophe","Killing Eve","Normal People"] },
  { id: "tv4", title: "The Wire", media_type: "show", genre: ["Crime","Drama"], mood_tags: ["Gritty","Complex","Dark"], description: "An anthology of interconnected storylines examines the decay of a post-industrial American city from multiple societal angles.", release_year: 2002, creator: "David Simon", suggested_audience: "Fans of systemic social commentary and ensemble dramas", similar_items: ["The Shield","The Sopranos","Treme"] },
  { id: "tv5", title: "Succession", media_type: "show", genre: ["Drama","Satire"], mood_tags: ["Intense","Dark","Witty"], description: "The dysfunctional Roy family battles for control of their global media empire as their patriarch's health declines.", release_year: 2018, creator: "Jesse Armstrong", suggested_audience: "Fans of power dynamics, dark humor, and prestige television", similar_items: ["Billions","Arrested Development","The Crown"] },
  { id: "tv6", title: "Severance", media_type: "show", genre: ["Sci-Fi","Thriller"], mood_tags: ["Mind-Bending","Eerie","Atmospheric"], description: "Office workers who have surgically divided their work and personal memories begin to question the nature of their existence.", release_year: 2022, creator: "Dan Erickson", suggested_audience: "Fans of corporate satire blended with psychological mystery", similar_items: ["Devs","Westworld","Black Mirror"] },
  { id: "tv7", title: "Squid Game", media_type: "show", genre: ["Thriller","Drama"], mood_tags: ["Intense","Dark","Shocking"], description: "Desperate individuals compete in deadly children's games for a massive cash prize in a secretive and violent competition.", release_year: 2021, creator: "Hwang Dong-hyuk", suggested_audience: "Fans of survival thrillers with social commentary", similar_items: ["Alice in Borderland","Sweet Home","Money Heist"] },
  { id: "tv8", title: "Arcane", media_type: "show", genre: ["Animation","Fantasy","Action"], mood_tags: ["Epic","Emotional","Cinematic"], description: "Two sisters from divergent worlds struggle with the consequences of progress and political conflict in a steampunk city.", release_year: 2021, creator: "Fortiche Studio", suggested_audience: "Fans of animation, fantasy, and emotionally driven storytelling", similar_items: ["Avatar: The Last Airbender","Castlevania","Into the Spider-Verse"] },
  { id: "tv9", title: "Planet Earth II", media_type: "show", genre: ["Documentary","Nature"], mood_tags: ["Chill","Inspiring","Cinematic"], description: "A BBC nature documentary series exploring diverse global habitats through cutting-edge wildlife cinematography.", release_year: 2016, creator: "David Attenborough", suggested_audience: "Nature enthusiasts and documentary lovers of all ages", similar_items: ["Our Planet","Blue Planet II","Wild Isles"] },
  { id: "tv10", title: "The Bear", media_type: "show", genre: ["Drama","Comedy"], mood_tags: ["Intense","Raw","Emotional"], description: "A fine-dining chef returns to run his family's chaotic Chicago sandwich shop, struggling to reconcile grief and ambition.", release_year: 2022, creator: "Christopher Storer", suggested_audience: "Fans of high-stakes kitchen dramas and character studies", similar_items: ["Ratatouille","Chef's Table","Boiling Point"] },

  // ── BOOKS ──
  { id: "bk1", title: "Sapiens", media_type: "book", genre: ["Non-Fiction","History"], mood_tags: ["Educational","Thought-Provoking","Expansive"], description: "A sweeping narrative tracing the history of humankind from prehistoric communities to modern civilization.", release_year: 2011, creator: "Yuval Noah Harari", suggested_audience: "Curious minds interested in big-picture human history", similar_items: ["Homo Deus","Guns Germs and Steel","The Selfish Gene"] },
  { id: "bk2", title: "Atomic Habits", media_type: "book", genre: ["Self-Help","Psychology"], mood_tags: ["Motivating","Practical","Focused"], description: "A practical guide to building good habits and breaking bad ones through the science of small, incremental behavioral change.", release_year: 2018, creator: "James Clear", suggested_audience: "Anyone looking to improve daily routines and long-term productivity", similar_items: ["Deep Work","The Power of Habit","Thinking Fast and Slow"] },
  { id: "bk3", title: "1984", media_type: "book", genre: ["Fiction","Dystopia"], mood_tags: ["Dark","Haunting","Thought-Provoking"], description: "A man living under total state surveillance falls into a forbidden love affair and begins to question the nature of reality.", release_year: 1949, creator: "George Orwell", suggested_audience: "Fans of political fiction and dystopian world-building", similar_items: ["Brave New World","We","The Handmaid's Tale"] },
  { id: "bk4", title: "The Alchemist", media_type: "book", genre: ["Fiction","Philosophical"], mood_tags: ["Inspiring","Chill","Spiritual"], description: "A young shepherd embarks on a journey across the desert in search of a mysterious treasure and discovers deeper wisdom.", release_year: 1988, creator: "Paulo Coelho", suggested_audience: "Readers drawn to philosophical adventure and personal discovery", similar_items: ["Siddhartha","The Prophet","Jonathan Livingston Seagull"] },
  { id: "bk5", title: "Dune", media_type: "book", genre: ["Fiction","Sci-Fi"], mood_tags: ["Epic","Atmospheric","Dark"], description: "A young nobleman inherits stewardship of a desert planet and becomes entangled in the political and ecological fate of the universe.", release_year: 1965, creator: "Frank Herbert", suggested_audience: "Fans of detailed world-building and political science fiction", similar_items: ["Foundation","Hyperion","Ender's Game"] },
  { id: "bk6", title: "Thinking, Fast and Slow", media_type: "book", genre: ["Psychology","Non-Fiction"], mood_tags: ["Educational","Thought-Provoking","Focused"], description: "A psychologist examines the two cognitive systems that drive how humans think, make decisions, and perceive the world.", release_year: 2011, creator: "Daniel Kahneman", suggested_audience: "Readers interested in behavioral economics and cognitive science", similar_items: ["Predictably Irrational","Blink","The Undoing Project"] },
  { id: "bk7", title: "A Little Life", media_type: "book", genre: ["Fiction","Drama"], mood_tags: ["Emotional","Dark","Haunting"], description: "Four college friends navigate success and suffering over decades, centered on one man's devastating and complex past.", release_year: 2015, creator: "Hanya Yanagihara", suggested_audience: "Readers prepared for intense emotional depth and long-form character work", similar_items: ["Normal People","The Kite Runner","Pachinko"] },
  { id: "bk8", title: "The Body Keeps the Score", media_type: "book", genre: ["Non-Fiction","Psychology"], mood_tags: ["Educational","Emotional","Healing"], description: "A psychiatrist explores how trauma reshapes the body and brain, and examines pathways to recovery.", release_year: 2014, creator: "Bessel van der Kolk", suggested_audience: "Those interested in trauma, mental health, and healing", similar_items: ["In the Realm of Hungry Ghosts","Man's Search for Meaning","Lost Connections"] },
  { id: "bk9", title: "The Hitchhiker's Guide to the Galaxy", media_type: "book", genre: ["Fiction","Sci-Fi","Comedy"], mood_tags: ["Funny","Whimsical","Chill"], description: "An ordinary man is swept off Earth moments before its demolition and embarks on an absurd tour of the universe.", release_year: 1979, creator: "Douglas Adams", suggested_audience: "Fans of satirical humor and science fiction", similar_items: ["Good Omens","Discworld","Red Dwarf"] },
  { id: "bk10", title: "Project Hail Mary", media_type: "book", genre: ["Fiction","Sci-Fi"], mood_tags: ["Epic","Uplifting","Mind-Bending"], description: "An astronaut wakes up alone in deep space with no memory of how he got there, tasked with saving the solar system.", release_year: 2021, creator: "Andy Weir", suggested_audience: "Fans of hard science fiction and problem-solving narratives", similar_items: ["The Martian","Recursion","Children of Time"] },

  // ── VIDEO GAMES ──
  { id: "gm1", title: "The Last of Us", media_type: "game", genre: ["Action","Survival"], mood_tags: ["Emotional","Dark","Cinematic"], description: "A smuggler escorts a teenager across a post-fungal-pandemic America in a gripping story of survival and human connection.", release_year: 2013, creator: "Naughty Dog", suggested_audience: "Fans of narrative-driven games with emotional depth", similar_items: ["God of War","Death Stranding","Uncharted 4"] },
  { id: "gm2", title: "Elden Ring", media_type: "game", genre: ["RPG","Action"], mood_tags: ["Epic","Dark","Challenging"], description: "Players explore a vast open world filled with ancient lore, formidable bosses, and a richly interconnected environment.", release_year: 2022, creator: "FromSoftware", suggested_audience: "Players who enjoy challenge, exploration, and rich world lore", similar_items: ["Dark Souls III","Bloodborne","Sekiro"] },
  { id: "gm3", title: "Stardew Valley", media_type: "game", genre: ["Simulation","RPG"], mood_tags: ["Chill","Cozy","Relaxing"], description: "Players inherit a run-down farm and gradually restore it while building relationships and exploring a charming rural community.", release_year: 2016, creator: "ConcernedApe", suggested_audience: "Those looking for a calming, deeply rewarding gameplay loop", similar_items: ["Harvest Moon","Animal Crossing","My Time at Portia"] },
  { id: "gm4", title: "Red Dead Redemption 2", media_type: "game", genre: ["Action","Adventure"], mood_tags: ["Emotional","Epic","Atmospheric"], description: "A seasoned outlaw navigates the decline of the American frontier in the twilight years of the Wild West.", release_year: 2018, creator: "Rockstar Games", suggested_audience: "Fans of open-world games and cinematic storytelling", similar_items: ["Grand Theft Auto V","Horizon Zero Dawn","Assassin's Creed Origins"] },
  { id: "gm5", title: "Celeste", media_type: "game", genre: ["Platformer","Indie"], mood_tags: ["Emotional","Inspiring","Intense"], description: "A young woman climbs a mysterious mountain while battling inner demons in a precision platformer with a heartfelt narrative.", release_year: 2018, creator: "Maddy Thorson & Noel Berry", suggested_audience: "Players who enjoy tight mechanics alongside mental health narratives", similar_items: ["Hollow Knight","Ori and the Blind Forest","Super Meat Boy"] },
  { id: "gm6", title: "Minecraft", media_type: "game", genre: ["Sandbox","Survival"], mood_tags: ["Creative","Chill","Endless"], description: "An open-ended sandbox world where players mine, build, craft, and explore procedurally generated environments.", release_year: 2011, creator: "Mojang Studios", suggested_audience: "All ages; especially those who enjoy creativity and exploration", similar_items: ["Terraria","Valheim","No Man's Sky"] },
  { id: "gm7", title: "Hollow Knight", media_type: "game", genre: ["Metroidvania","Action"], mood_tags: ["Dark","Atmospheric","Challenging"], description: "A tiny knight explores the vast underground ruins of an ancient insect kingdom filled with danger and mystery.", release_year: 2017, creator: "Team Cherry", suggested_audience: "Fans of atmospheric exploration and challenging combat", similar_items: ["Ori and the Blind Forest","Dead Cells","Castlevania: Symphony of the Night"] },
  { id: "gm8", title: "The Witcher 3: Wild Hunt", media_type: "game", genre: ["RPG","Fantasy"], mood_tags: ["Epic","Dark","Immersive"], description: "A monster hunter searches for his surrogate daughter across a war-torn open world rich with moral ambiguity.", release_year: 2015, creator: "CD Projekt Red", suggested_audience: "RPG fans who appreciate complex narratives and open worlds", similar_items: ["Dragon Age: Inquisition","Cyberpunk 2077","Assassin's Creed Odyssey"] },
  { id: "gm9", title: "Portal 2", media_type: "game", genre: ["Puzzle","Sci-Fi"], mood_tags: ["Funny","Mind-Bending","Chill"], description: "Players use a portal-creation device to solve increasingly complex physics puzzles while interacting with a darkly comedic AI.", release_year: 2011, creator: "Valve", suggested_audience: "Fans of clever puzzle design and witty writing", similar_items: ["The Talos Principle","Antichamber","Inside"] },
  { id: "gm10", title: "Undertale", media_type: "game", genre: ["RPG","Indie"], mood_tags: ["Emotional","Funny","Subversive"], description: "A child falls into an underground world of monsters and must decide whether to fight or find a peaceful path home.", release_year: 2015, creator: "Toby Fox", suggested_audience: "Fans of unique RPG mechanics and unconventional storytelling", similar_items: ["Deltarune","OneShot","Omori"] },

  // ── MUSIC ──
  // Afrobeats
  { id: "ms1", title: "Love Nwantiti", media_type: "music", genre: ["Afrobeats"], mood_tags: ["Hype","Romantic","Dance"], description: "An infectious Afropop track with blended West African and global pop influences.", release_year: 2019, creator: "CKay", artist: "CKay", suggested_audience: "Fans of Afrobeats and danceable pop", similar_items: ["Essence","Calm Down","Diana"] },
  { id: "ms2", title: "Essence", media_type: "music", genre: ["Afrobeats"], mood_tags: ["Romantic","Chill","Smooth"], description: "A warm Afrofusion track celebrating admiration and attraction with layered production.", release_year: 2020, creator: "Wizkid ft. Tems", artist: "Wizkid", suggested_audience: "Fans of smooth Afrofusion and R&B crossover", similar_items: ["Love Nwantiti","VIBEZ","Calm Down"] },
  { id: "ms3", title: "Calm Down", media_type: "music", genre: ["Afrobeats"], mood_tags: ["Dance","Hype","Uplifting"], description: "A high-energy Afrobeats single built around a sample of a classic Enya chord progression.", release_year: 2022, creator: "Rema", artist: "Rema", suggested_audience: "Fans of modern Afrobeats and energetic pop", similar_items: ["Essence","Love Nwantiti","Ojuelegba"] },
  { id: "ms4", title: "VIBEZ", media_type: "music", genre: ["Afrobeats"], mood_tags: ["Chill","Late-Night","Smooth"], description: "A mellow Afropop record with introspective undertones and clean production.", release_year: 2021, creator: "Wizkid", artist: "Wizkid", suggested_audience: "Fans of late-night Afrofusion", similar_items: ["Essence","Ojuelegba","Champion"] },
  { id: "ms5", title: "Diana", media_type: "music", genre: ["Afrobeats"], mood_tags: ["Romantic","Dance","Smooth"], description: "A lighthearted Afrobeats love track with catchy hooks and upbeat instrumentation.", release_year: 2019, creator: "Davido", artist: "Davido", suggested_audience: "Fans of mainstream Afrobeats", similar_items: ["Fall","Fans Mi","Jeje"] },
  // Hip-Hop
  { id: "ms6", title: "Alright", media_type: "music", genre: ["Hip-Hop"], mood_tags: ["Uplifting","Emotional","Powerful"], description: "A jazz-infused anthem that became a rallying cry, blending social commentary with hopeful defiance.", release_year: 2015, creator: "Kendrick Lamar", artist: "Kendrick Lamar", suggested_audience: "Fans of conscious hip-hop and jazz rap", similar_items: ["HUMBLE.","King's Dead","DNA."] },
  { id: "ms7", title: "God's Plan", media_type: "music", genre: ["Hip-Hop"], mood_tags: ["Uplifting","Chill","Smooth"], description: "A reflective hip-hop single about gratitude and success, with soft melodic production.", release_year: 2018, creator: "Drake", artist: "Drake", suggested_audience: "Fans of mainstream melodic hip-hop", similar_items: ["Hotline Bling","One Dance","Knife Talk"] },
  { id: "ms8", title: "HUMBLE.", media_type: "music", genre: ["Hip-Hop"], mood_tags: ["Hype","Dark","Intense"], description: "A stark, minimalist trap record built around a single piano loop and assertive lyricism.", release_year: 2017, creator: "Kendrick Lamar", artist: "Kendrick Lamar", suggested_audience: "Fans of confrontational, high-energy hip-hop", similar_items: ["Alright","DNA.","Not Like Us"] },
  { id: "ms9", title: "Industry Baby", media_type: "music", genre: ["Hip-Hop","Pop"], mood_tags: ["Hype","Confident","Dance"], description: "A brass-heavy hip-hop anthem celebrating perseverance and arrival in the music industry.", release_year: 2021, creator: "Lil Nas X ft. Jack Harlow", artist: "Lil Nas X", suggested_audience: "Fans of bold, genre-blending pop-rap", similar_items: ["Montero","Thats What I Want","Late To Da Party"] },
  { id: "ms10", title: "Passionfruit", media_type: "music", genre: ["Hip-Hop","R&B"], mood_tags: ["Chill","Romantic","Late-Night"], description: "A dancehall-influenced R&B track with warm, nostalgic production and reflective lyrics about distance.", release_year: 2017, creator: "Drake", artist: "Drake", suggested_audience: "Fans of slow-tempo R&B crossover hip-hop", similar_items: ["Controlla","Hold On We're Going Home","Too Good"] },
  // R&B
  { id: "ms11", title: "Earned It", media_type: "music", genre: ["R&B"], mood_tags: ["Romantic","Dark","Smooth"], description: "A slow-burning R&B ballad with orchestral production, exploring themes of devotion and desire.", release_year: 2015, creator: "The Weeknd", artist: "The Weeknd", suggested_audience: "Fans of dark R&B and cinematic production", similar_items: ["Blinding Lights","Save Your Tears","Die For You"] },
  { id: "ms12", title: "About Damn Time", media_type: "music", genre: ["R&B","Funk"], mood_tags: ["Uplifting","Dance","Hype"], description: "A disco-funk-influenced R&B record celebrating resilience and self-worth with a bright, danceable groove.", release_year: 2022, creator: "Lizzo", artist: "Lizzo", suggested_audience: "Fans of feel-good funk-pop and empowerment anthems", similar_items: ["Truth Hurts","Good as Hell","Juice"] },
  { id: "ms13", title: "Die For You", media_type: "music", genre: ["R&B"], mood_tags: ["Romantic","Emotional","Intense"], description: "An emotionally charged slow ballad about unconditional devotion and inner conflict in love.", release_year: 2016, creator: "The Weeknd", artist: "The Weeknd", suggested_audience: "Fans of intense, layered dark R&B", similar_items: ["Earned It","The Hills","Often"] },
  { id: "ms14", title: "Pick Up Your Feelings", media_type: "music", genre: ["R&B"], mood_tags: ["Uplifting","Empowering","Smooth"], description: "A polished neo-soul R&B track about self-respect and moving forward after a relationship ends.", release_year: 2020, creator: "Jazmine Sullivan", artist: "Jazmine Sullivan", suggested_audience: "Fans of classic-influenced modern R&B", similar_items: ["Bust Your Windows","Foolish Things","Girl Like Me"] },
  // Pop
  { id: "ms15", title: "Blinding Lights", media_type: "music", genre: ["Pop","Synth-Pop"], mood_tags: ["Hype","Nostalgic","Dance"], description: "An '80s-inspired synth-pop track built around driving production and urgent vocals.", release_year: 2019, creator: "The Weeknd", artist: "The Weeknd", suggested_audience: "Fans of retro-influenced modern pop", similar_items: ["Save Your Tears","Starboy","Levitating"] },
  { id: "ms16", title: "Levitating", media_type: "music", genre: ["Pop","Disco"], mood_tags: ["Dance","Uplifting","Hype"], description: "A funky, disco-influenced pop anthem with an optimistic tone and spacey metaphors.", release_year: 2020, creator: "Dua Lipa", artist: "Dua Lipa", suggested_audience: "Fans of retro-disco pop", similar_items: ["Don't Start Now","Physical","New Rules"] },
  { id: "ms17", title: "drivers license", media_type: "music", genre: ["Pop","Ballad"], mood_tags: ["Emotional","Sad","Cinematic"], description: "A piano-driven coming-of-age pop ballad about heartbreak, loss, and nostalgia.", release_year: 2021, creator: "Olivia Rodrigo", artist: "Olivia Rodrigo", suggested_audience: "Fans of emotionally raw pop songwriting", similar_items: ["good 4 u","traitor","happier"] },
  { id: "ms18", title: "Anti-Hero", media_type: "music", genre: ["Pop"], mood_tags: ["Witty","Introspective","Catchy"], description: "A self-referential pop track exploring themes of self-doubt, public scrutiny, and inner conflict.", release_year: 2022, creator: "Taylor Swift", artist: "Taylor Swift", suggested_audience: "Fans of confessional pop and introspective lyricism", similar_items: ["Shake It Off","Blank Space","Cruel Summer"] },
  // Rock
  { id: "ms19", title: "Bohemian Rhapsody", media_type: "music", genre: ["Rock","Classic Rock"], mood_tags: ["Epic","Theatrical","Classic"], description: "An operatic rock suite structured in distinct musical movements, defying conventional song format.", release_year: 1975, creator: "Queen", artist: "Queen", suggested_audience: "Fans of classic rock and theatrical songwriting", similar_items: ["Under Pressure","Don't Stop Me Now","We Will Rock You"] },
  { id: "ms20", title: "Smells Like Teen Spirit", media_type: "music", genre: ["Rock","Grunge"], mood_tags: ["Intense","Raw","Rebellious"], description: "A distortion-heavy grunge anthem that became a defining sound of early '90s alternative rock.", release_year: 1991, creator: "Nirvana", artist: "Nirvana", suggested_audience: "Fans of alternative and grunge rock", similar_items: ["Come as You Are","Heart-Shaped Box","Lithium"] },
  { id: "ms21", title: "Mr. Brightside", media_type: "music", genre: ["Rock","Indie Rock"], mood_tags: ["Intense","Nostalgic","Emotional"], description: "A driving indie rock track about jealousy and romantic anxiety with an anthemic, sing-along quality.", release_year: 2003, creator: "The Killers", artist: "The Killers", suggested_audience: "Fans of indie and alternative rock", similar_items: ["Somebody Told Me","All These Things That I've Done","Human"] },
  // Emotional / Sad
  { id: "ms22", title: "Mad World", media_type: "music", genre: ["Emotional","Synth-Pop"], mood_tags: ["Sad","Haunting","Reflective"], description: "A melancholic synthesizer-driven track examining alienation and the desensitization of modern life.", release_year: 1982, creator: "Tears for Fears", artist: "Tears for Fears", suggested_audience: "Fans of introspective, atmospheric music", similar_items: ["The Sound of Silence","Hallelujah","Fix You"] },
  { id: "ms23", title: "Fix You", media_type: "music", genre: ["Emotional","Rock"], mood_tags: ["Sad","Hopeful","Cathartic"], description: "A gradually building rock ballad about offering support and solace during someone's lowest moments.", release_year: 2005, creator: "Coldplay", artist: "Coldplay", suggested_audience: "Fans of emotionally resonant rock music", similar_items: ["The Scientist","Yellow","Mad World"] },
  { id: "ms24", title: "The Sound of Silence", media_type: "music", genre: ["Emotional","Folk Rock"], mood_tags: ["Dark","Haunting","Reflective"], description: "A folk-rock composition exploring modern disconnection and the failure of communication in an increasingly noisy world.", release_year: 1964, creator: "Simon & Garfunkel", artist: "Simon & Garfunkel", suggested_audience: "Fans of timeless folk and acoustic songwriting", similar_items: ["Mad World","Hallelujah","The Boxer"] },
  // Soundtrack
  { id: "ms25", title: "Hans Zimmer - Interstellar (Main Theme)", media_type: "music", genre: ["Soundtrack","Orchestral"], mood_tags: ["Epic","Cinematic","Emotional"], description: "An organ-driven orchestral composition conveying the awe and solemnity of space exploration.", release_year: 2014, creator: "Hans Zimmer", artist: "Hans Zimmer", suggested_audience: "Fans of film scores and orchestral music", similar_items: ["Inception Brass","Time","Cornfield Chase"] },
  { id: "ms26", title: "Tame Impala - Let It Happen", media_type: "music", genre: ["Psychedelic Pop","Electronic"], mood_tags: ["Hype","Trippy","Cinematic"], description: "An eight-minute psych-pop journey exploring surrender and transformation through layered synthesizers and percussion.", release_year: 2015, creator: "Tame Impala", artist: "Tame Impala", suggested_audience: "Fans of psychedelic and electronic-influenced indie pop", similar_items: ["The Less I Know The Better","Elephant","Feels Like We Only Go Backwards"] },
  // International
  { id: "ms27", title: "Despacito", media_type: "music", genre: ["International","Reggaeton"], mood_tags: ["Dance","Romantic","Summer"], description: "A reggaeton-pop crossover with Latin percussion and bilingual vocals that achieved global chart success.", release_year: 2017, creator: "Luis Fonsi ft. Daddy Yankee", artist: "Luis Fonsi", suggested_audience: "Fans of Latin pop and reggaeton", similar_items: ["Con Calma","Gasolina","Bailando"] },
  { id: "ms28", title: "Jai Ho", media_type: "music", genre: ["International","Bollywood"], mood_tags: ["Uplifting","Cinematic","Dance"], description: "A rousing Bollywood film anthem combining traditional Indian rhythms with contemporary orchestration.", release_year: 2008, creator: "A.R. Rahman", artist: "A.R. Rahman", suggested_audience: "Fans of Bollywood soundtracks and world music", similar_items: ["Rang De Basanti","Chaiyya Chaiyya","Kun Faya Kun"] },
];

// ─── Constants ─────────────────────────────────────────────────────────────

const MEDIA_TYPES = [
  { key: "all", label: "All", emoji: "✦" },
  { key: "movieshow", label: "Movies & Shows", emoji: "🎬" },
  { key: "book", label: "Books", emoji: "📚" },
  { key: "game", label: "Games", emoji: "🎮" },
  { key: "music", label: "Music", emoji: "🎵" },
];

const MUSIC_GENRES = ["Afrobeats","Hip-Hop","R&B","Pop","Rock","Emotional","Soundtrack","International","Psychedelic Pop"];

const SORT_OPTIONS = [
  { key: "default", label: "✦ Featured" },
  { key: "rating", label: "⭐ Top Rated" },
  { key: "newest", label: "🆕 Newest" },
  { key: "oldest", label: "📅 Classic" },
  { key: "saves", label: "🔖 Most Saved" },
];

const ALL_GENRES = [...new Set(MEDIA_CATALOGUE.flatMap(i => i.genre))].sort();
const ALL_MOODS = [...new Set(MEDIA_CATALOGUE.flatMap(i => i.mood_tags))].sort();

const TYPE_COLORS = {
  movie: { bg: "#EEF3F0", border: "#3C6E5A22", accent: "#3C6E5A" },
  show: { bg: "#FFF3E8", border: "#D98B6222", accent: "#D98B62" },
  book: { bg: "#F0EEF8", border: "#7C69C422", accent: "#7C69C4" },
  game: { bg: "#FEF0E6", border: "#E8893522", accent: "#E88935" },
  music: { bg: "#F0F5FE", border: "#4A7FC122", accent: "#4A7FC1" },
};

const SAVE_LIST_MAP = {
  movie: "watchlist", show: "watchlist", book: "reading_list", game: "wishlist", music: "playlist",
};

// ─── Star Rating mini ──────────────────────────────────────────────────────
function MiniStars({ value, onRate }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <button key={n} onClick={onRate ? () => onRate(n) : undefined}
          className={onRate ? "transition-transform hover:scale-110" : "cursor-default"}>
          <Star className="w-3.5 h-3.5" fill={n <= value ? "#D98B62" : "none"}
            style={{ color: n <= value ? "#D98B62" : "var(--border-medium)" }} />
        </button>
      ))}
    </div>
  );
}

// ─── Media Card ────────────────────────────────────────────────────────────
function MediaCard({ item, user, savedIds, onSave, onUnsave, onSelect }) {
  const colors = TYPE_COLORS[item.media_type] || TYPE_COLORS.movie;
  const isSaved = savedIds.includes(item.id);

  const [localRating, setLocalRating] = useState(0);
  const { data: ratings = [] } = useQuery({
    queryKey: ["mediaRatings", item.id],
    queryFn: () => base44.entities.MediaRating.filter({ item_id: item.id }),
    staleTime: 60000,
  });
  const qc = useQueryClient();
  const rateMut = useMutation({
    mutationFn: (r) => base44.entities.MediaRating.create({ item_id: item.id, user_email: user?.email, rating: r }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mediaRatings", item.id] }),
  });
  const avgRating = ratings.length ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden cursor-pointer active:scale-[0.99] transition-all"
      style={{ backgroundColor: "var(--bg-card)", border: `1px solid ${colors.border}`, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}
      onClick={() => onSelect(item)}
    >
      {/* Cover placeholder strip */}
      <div className="h-2 w-full" style={{ background: `linear-gradient(90deg, ${colors.accent}33, ${colors.accent}11)` }} />

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon box */}
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
            style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}` }}>
            {MEDIA_TYPES.find(t => t.key === item.media_type)?.emoji || "🎭"}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm leading-snug" style={{ color: "var(--text-primary)" }}>{item.title}</p>
                {item.creator && <p className="text-[11px] mt-0.5" style={{ color: "var(--text-hint)" }}>{item.creator}</p>}
              </div>
              <button
                onClick={e => { e.stopPropagation(); isSaved ? onUnsave(item) : onSave(item); }}
                className="shrink-0 p-1.5 rounded-full transition-all active:scale-90"
                style={{ backgroundColor: isSaved ? colors.bg : "transparent", color: isSaved ? colors.accent : "var(--text-hint)" }}
              >
                {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              </button>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {item.genre?.slice(0, 2).map(g => (
                <span key={g} className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: colors.bg, color: colors.accent, border: `1px solid ${colors.border}` }}>
                  {g}
                </span>
              ))}
              {item.mood_tags?.slice(0, 2).map(m => (
                <span key={m} className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
                  {m}
                </span>
              ))}
              {item.release_year && (
                <span className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>
                  {item.release_year}
                </span>
              )}
            </div>

            <p className="text-xs mt-1.5 leading-relaxed line-clamp-2" style={{ color: "var(--text-secondary)" }}>
              {item.description}
            </p>

            {/* Rating row */}
            <div className="flex items-center gap-2 mt-2" onClick={e => e.stopPropagation()}>
              <MiniStars
                value={localRating || Math.round(Number(avgRating))}
                onRate={user ? (r) => { setLocalRating(r); rateMut.mutate(r); } : undefined}
              />
              {ratings.length > 0 && (
                <span className="text-[10px]" style={{ color: "var(--text-hint)" }}>{avgRating} ({ratings.length})</span>
              )}
            </div>
          </div>
        </div>

        {/* Similar items footer */}
        {item.similar_items?.length > 0 && (
          <div className="mt-3 pt-2.5 flex items-center gap-1.5 flex-wrap"
            style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <span className="text-[10px] font-medium" style={{ color: "var(--text-hint)" }}>Also liked:</span>
            {item.similar_items.map(s => (
              <span key={s} className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}>
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Detail Modal ──────────────────────────────────────────────────────────
function MediaDetailModal({ item, user, onClose, allItems }) {
  const colors = TYPE_COLORS[item.media_type] || TYPE_COLORS.movie;

  // Cross-category suggestions: same genre, different type
  const crossRecs = allItems
    .filter(i => i.id !== item.id && i.media_type !== item.media_type && i.genre?.some(g => item.genre?.includes(g)))
    .slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        className="w-full max-w-lg mx-auto rounded-t-3xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-modal)", maxHeight: "85vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-1.5 w-12 rounded-full mx-auto mt-3 mb-4" style={{ backgroundColor: "var(--border-medium)" }} />
        <div className="px-5 pb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0"
              style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}` }}>
              {MEDIA_TYPES.find(t => t.key === item.media_type)?.emoji}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-lg leading-snug" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{item.title}</p>
              {item.creator && <p className="text-sm mt-0.5" style={{ color: "var(--text-hint)" }}>{item.creator}</p>}
              <div className="flex gap-1.5 flex-wrap mt-1.5">
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-medium capitalize"
                  style={{ backgroundColor: colors.bg, color: colors.accent }}>
                  {item.media_type}
                </span>
                {item.release_year && <span className="text-[10px] px-2.5 py-0.5 rounded-full" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>{item.release_year}</span>}
              </div>
            </div>
          </div>

          <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>{item.description}</p>

          {/* Genres */}
          {item.genre?.length > 0 && (
            <div className="mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-hint)" }}>Genre</p>
              <div className="flex flex-wrap gap-1.5">
                {item.genre.map(g => (
                  <span key={g} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: colors.bg, color: colors.accent }}>{g}</span>
                ))}
              </div>
            </div>
          )}

          {/* Mood */}
          {item.mood_tags?.length > 0 && (
            <div className="mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-hint)" }}>Mood</p>
              <div className="flex flex-wrap gap-1.5">
                {item.mood_tags.map(m => (
                  <span key={m} className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>{m}</span>
                ))}
              </div>
            </div>
          )}

          {/* Audience */}
          {item.suggested_audience && (
            <div className="mb-4 p-3 rounded-xl" style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
              <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--text-hint)" }}>Recommended For</p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{item.suggested_audience}</p>
            </div>
          )}

          {/* Similar */}
          {item.similar_items?.length > 0 && (
            <div className="mb-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-hint)" }}>People Also Liked</p>
              <div className="flex flex-wrap gap-1.5">
                {item.similar_items.map(s => (
                  <span key={s} className="text-xs px-2.5 py-1 rounded-full border" style={{ backgroundColor: "var(--bg-card)", color: "var(--text-secondary)", borderColor: "var(--border-light)" }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Cross-category */}
          {crossRecs.length > 0 && (
            <div className="mb-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-hint)" }}>
                <Shuffle className="w-3 h-3 inline mr-1" />You Might Also Enjoy
              </p>
              <div className="space-y-2">
                {crossRecs.map(rec => (
                  <div key={rec.id} className="flex items-center gap-2 p-2.5 rounded-xl"
                    style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-light)" }}>
                    <span className="text-lg">{MEDIA_TYPES.find(t => t.key === rec.media_type)?.emoji}</span>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{rec.title}</p>
                      <p className="text-[10px]" style={{ color: "var(--text-hint)" }}>{rec.media_type} · {rec.genre?.[0]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legal disclaimer */}
          <p className="text-[10px] text-center mt-2 px-2 leading-relaxed" style={{ color: "var(--text-hint)", borderTop: "1px solid var(--border-subtle)", paddingTop: 12 }}>
            This platform is not affiliated with any studio, publisher, artist, label, or developer. All content is curated for informational and discovery purposes only. No ownership of media content is claimed.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Music Genre Section ───────────────────────────────────────────────────
function MusicSection({ items, user, savedIds, onSave, onUnsave, onSelect }) {
  const byGenre = useMemo(() => {
    const map = {};
    MUSIC_GENRES.forEach(g => {
      const songs = items.filter(i => i.genre?.includes(g));
      if (songs.length > 0) map[g] = songs;
    });
    const rest = items.filter(i => !MUSIC_GENRES.some(g => i.genre?.includes(g)));
    if (rest.length) map["Other"] = rest;
    return map;
  }, [items]);

  const [openGenre, setOpenGenre] = useState(MUSIC_GENRES[0]);

  return (
    <div className="space-y-2">
      {Object.entries(byGenre).map(([genre, songs]) => (
        <div key={genre}>
          <button
            onClick={() => setOpenGenre(openGenre === genre ? null : genre)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
          >
            <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>🎵 {genre}</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>{songs.length}</span>
              <ChevronDown className="w-4 h-4 transition-transform" style={{ color: "var(--accent-primary)", transform: openGenre === genre ? "rotate(180deg)" : "rotate(0deg)" }} />
            </div>
          </button>
          <AnimatePresence>
            {openGenre === genre && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                className="overflow-hidden pt-2 space-y-2">
                {songs.map(item => (
                  <MediaCard key={item.id} item={item} user={user} savedIds={savedIds} onSave={onSave} onUnsave={onUnsave} onSelect={onSelect} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

// ─── Main MediaTab ─────────────────────────────────────────────────────────
export default function MediaTab({ user }) {
  const [activeType, setActiveType] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [selectedMood, setSelectedMood] = useState("all");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const qc = useQueryClient();

  // User saves
  const { data: dbSaves = [] } = useQuery({
    queryKey: ["mediaSaves", user?.email],
    queryFn: () => base44.entities.MediaSave.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });
  const savedIds = dbSaves.map(s => s.item_id);

  const saveMut = useMutation({
    mutationFn: (item) => base44.entities.MediaSave.create({
      item_id: item.id, item_title: item.title, media_type: item.media_type,
      user_email: user.email, list_name: SAVE_LIST_MAP[item.media_type] || "watchlist"
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mediaSaves", user?.email] }),
  });
  const unsaveMut = useMutation({
    mutationFn: async (item) => {
      const s = dbSaves.find(s => s.item_id === item.id);
      if (s) await base44.entities.MediaSave.delete(s.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mediaSaves", user?.email] }),
  });

  // Filtered & sorted list
  const filtered = useMemo(() => {
    let list = MEDIA_CATALOGUE.filter(item => {
      const typeMatch = activeType === "all" || activeType === "movieshow"
        ? (activeType === "all" || item.media_type === "movie" || item.media_type === "show")
        : item.media_type === activeType;
      const genreMatch = selectedGenre === "all" || item.genre?.includes(selectedGenre);
      const moodMatch = selectedMood === "all" || item.mood_tags?.includes(selectedMood);
      const searchMatch = !search ||
        item.title?.toLowerCase().includes(search.toLowerCase()) ||
        item.creator?.toLowerCase().includes(search.toLowerCase()) ||
        item.genre?.some(g => g.toLowerCase().includes(search.toLowerCase())) ||
        item.mood_tags?.some(m => m.toLowerCase().includes(search.toLowerCase()));
      return typeMatch && genreMatch && moodMatch && searchMatch;
    });
    if (sortBy === "newest") list = [...list].sort((a, b) => (b.release_year || 0) - (a.release_year || 0));
    else if (sortBy === "oldest") list = [...list].sort((a, b) => (a.release_year || 0) - (b.release_year || 0));
    else if (sortBy === "rating") list = [...list].sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
    else if (sortBy === "saves") list = [...list].sort((a, b) => (savedIds.includes(b.id) ? 1 : 0) - (savedIds.includes(a.id) ? 1 : 0));
    return list;
  }, [activeType, selectedGenre, selectedMood, search, sortBy, savedIds]);

  const trending = MEDIA_CATALOGUE.filter(i => [
    "Inception","Breaking Bad","Elden Ring","Blinding Lights","Parasite","Stardew Valley","Fleabag","Atomic Habits","Calm Down","Arcane"
  ].includes(i.title));

  const isMusicView = activeType === "music";
  const isBookView = activeType === "book";
  const isMovieShowView = activeType === "movieshow";
  const activeFilterCount = [selectedGenre !== "all", selectedMood !== "all", sortBy !== "default"].filter(Boolean).length;

  return (
    <div className="pb-24">
      {/* Search bar */}
      <div className="px-5 pt-3 mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-hint)" }} />
          <input
            placeholder="Search movies, shows, books, games, music..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5" style={{ color: "var(--text-hint)" }} />
            </button>
          )}
        </div>
      </div>

      {/* Type chips */}
      <div className="px-5 mb-3 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 w-max">
          {MEDIA_TYPES.map(t => (
            <button key={t.key} onClick={() => { setActiveType(t.key); setSelectedGenre("all"); setSelectedMood("all"); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-all active:scale-95"
              style={{
                backgroundColor: activeType === t.key ? "var(--accent-primary)" : "var(--bg-card)",
                color: activeType === t.key ? "#fff" : "var(--text-secondary)",
                borderColor: activeType === t.key ? "var(--accent-primary)" : "var(--border-light)",
              }}>
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort & Filter bar */}
      <div className="px-5 mb-3 flex items-center gap-2">
        <div className="relative flex-1">
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="w-full text-xs font-medium rounded-xl px-3 py-2 pr-7 appearance-none outline-none border"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)", color: "var(--text-primary)" }}>
            {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "var(--text-hint)" }} />
        </div>
        <button onClick={() => setShowFilters(f => !f)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all shrink-0"
          style={{
            backgroundColor: showFilters || activeFilterCount > 0 ? "var(--accent-primary)" : "var(--bg-card)",
            color: showFilters || activeFilterCount > 0 ? "#fff" : "var(--text-secondary)",
            borderColor: showFilters || activeFilterCount > 0 ? "var(--accent-primary)" : "var(--border-light)",
          }}>
          Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
        </button>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="mx-5 mb-3 rounded-2xl p-4 space-y-3" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Filters</p>
            {activeFilterCount > 0 && (
              <button onClick={() => { setSelectedGenre("all"); setSelectedMood("all"); setSortBy("default"); }}
                className="text-xs flex items-center gap-1" style={{ color: "var(--accent-secondary)" }}>
                <X className="w-3 h-3" /> Reset
              </button>
            )}
          </div>
          <div>
            <p className="text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Genre</p>
            <div className="relative">
              <select value={selectedGenre} onChange={e => setSelectedGenre(e.target.value)}
                className="w-full text-xs rounded-xl px-3 py-2 pr-7 appearance-none outline-none border"
                style={{ backgroundColor: "var(--bg-subtle)", borderColor: "var(--border-light)", color: "var(--text-primary)" }}>
                <option value="all">All Genres</option>
                {ALL_GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "var(--text-hint)" }} />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Mood</p>
            <div className="flex flex-wrap gap-1.5">
              {["all", ...ALL_MOODS.slice(0, 14)].map(m => (
                <button key={m} onClick={() => setSelectedMood(m)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all"
                  style={{
                    backgroundColor: selectedMood === m ? "var(--accent-primary)" : "var(--bg-subtle)",
                    color: selectedMood === m ? "#fff" : "var(--text-secondary)",
                    borderColor: selectedMood === m ? "var(--accent-primary)" : "transparent",
                  }}>
                  {m === "all" ? "All Moods" : m}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Trending strip — only when no filters active */}
      {!search && activeType === "all" && selectedGenre === "all" && selectedMood === "all" && (
        <div className="mb-4">
          <div className="px-5 flex items-center gap-1.5 mb-2">
            <Flame className="w-4 h-4" style={{ color: "#D98B62" }} />
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Trending Now</p>
          </div>
          <div className="px-5 overflow-x-auto scrollbar-hide">
            <div className="flex gap-3 w-max pb-1">
              {trending.map(item => {
                const colors = TYPE_COLORS[item.media_type];
                return (
                  <button key={item.id} onClick={() => setSelectedItem(item)}
                    className="rounded-2xl p-3 text-left shrink-0 transition-all active:scale-95"
                    style={{ width: 140, backgroundColor: colors.bg, border: `1px solid ${colors.border}` }}>
                    <p className="text-base mb-1">{MEDIA_TYPES.find(t => t.key === item.media_type)?.emoji}</p>
                    <p className="text-xs font-semibold leading-snug line-clamp-2" style={{ color: "var(--text-primary)" }}>{item.title}</p>
                    <p className="text-[10px] mt-1" style={{ color: colors.accent }}>{item.genre?.[0]}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      {!isMusicView && !isBookView && (
        <p className="px-5 mb-2 text-[11px]" style={{ color: "var(--text-hint)" }}>
          {`${filtered.length} item${filtered.length !== 1 ? "s" : ""}`}
        </p>
      )}

      {/* Content */}
      {isMusicView ? (
        <SpotifyMusicTab user={user} />
      ) : isBookView ? (
        <OpenLibraryBooksTab />
      ) : isMovieShowView ? (
        <TmdbMoviesTab defaultTab={activeType} />
      ) : (
        <div className="px-5 space-y-3">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-3xl mb-3">🎭</p>
              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Nothing matches your filters</p>
              <button onClick={() => { setSearch(""); setSelectedGenre("all"); setSelectedMood("all"); }}
                className="mt-3 text-xs font-semibold" style={{ color: "var(--accent-primary)" }}>Clear filters</button>
            </div>
          ) : (
            filtered.map(item => (
              <MediaCard key={item.id} item={item} user={user} savedIds={savedIds}
                onSave={user ? saveMut.mutate : () => {}}
                onUnsave={user ? unsaveMut.mutate : () => {}}
                onSelect={setSelectedItem} />
            ))
          )}
        </div>
      )}

      {/* Legal footer */}
      <p className="text-[10px] text-center px-5 mt-6 leading-relaxed" style={{ color: "var(--text-hint)" }}>
        This platform is not affiliated with any studio, publisher, artist, record label, or developer. All titles and names belong to their respective owners. Content is curated for informational and discovery purposes only. No ownership of any media content is claimed or implied.
      </p>

      {/* Detail modal */}
      <AnimatePresence>
        {selectedItem && (
          <MediaDetailModal item={selectedItem} user={user} allItems={MEDIA_CATALOGUE}
            onClose={() => setSelectedItem(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}