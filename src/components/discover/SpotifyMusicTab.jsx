import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Music, X, Play, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MediaDetailSheet from "./MediaDetailSheet";
import { AudioPreviewPlayer, MiniStickyPlayer } from "./AudioPreviewPlayer";
import ShareModal from "./ShareModal.jsx";

// ── Preloaded trending songs ──────────────────────────────────────────────
const PRELOADED_SONGS = [
  { title: "Achour", artist: "Innoss'B", duration: "3:51" },
  { title: "Yo Pe", artist: "Innoss'B", duration: "4:33" },
  { title: "Careless Whisper", artist: "George Michael", duration: "5:01" },
  { title: "Until I Found You", artist: "Stephen Sanchez", duration: "2:57" },
  { title: "Gangsta's Paradise", artist: "Coolio", duration: "4:01" },
  { title: "Yellow", artist: "Coldplay", duration: "4:27" },
  { title: "On the Low", artist: "Burna Boy", duration: "3:06" },
  { title: "I Wanna Be Yours", artist: "Arctic Monkeys", duration: "3:04" },
  { title: "Die With A Smile", artist: "Lady Gaga & Bruno Mars", duration: "4:12" },
  { title: "Save Your Tears", artist: "The Weeknd", duration: "3:36" },
  { title: "Somewhere Only We Know", artist: "Keane", duration: "3:59" },
  { title: "In Da Club", artist: "50 Cent", duration: "3:14" },
  { title: "Diamonds", artist: "Rihanna", duration: "3:46" },
  { title: "Take on Me", artist: "a-ha", duration: "3:46" },
  { title: "Those Eyes", artist: "New West", duration: "3:41" },
  { title: "Sailor Song", artist: "Gigi Perez", duration: "3:32" },
  { title: "One Of The Girls", artist: "The Weeknd, JENNIE & Lily Rose Depp", duration: "4:05" },
  { title: "Arcade", artist: "Duncan Laurence", duration: "3:04" },
  { title: "Billie Jean", artist: "Michael Jackson", duration: "4:54" },
  { title: "Every Breath You Take", artist: "The Police", duration: "4:14" },
  { title: "Show Me Love", artist: "WizTheMc & bees & honey", duration: "2:57" },
  { title: "Beautiful Things", artist: "Benson Boone", duration: "3:01" },
  { title: "Gasolina", artist: "Daddy Yankee", duration: "3:13" },
  { title: "Girls Just Want to Have Fun", artist: "Cyndi Lauper", duration: "3:59" },
  { title: "blue", artist: "yung kai", duration: "3:35" },
  { title: "Never Gonna Give You Up", artist: "Rick Astley", duration: "3:34" },
  { title: "Right Here Waiting", artist: "Richard Marx", duration: "4:25" },
  { title: "Yeah!", artist: "Usher feat. Lil Jon & Ludacris", duration: "4:11" },
  { title: "I Want to Know What Love Is", artist: "Foreigner", duration: "5:05" },
  { title: "Dear Mama", artist: "2Pac", duration: "4:40" },
  { title: "It Must Have Been Love", artist: "Roxette", duration: "4:20" },
  { title: "Sweet Dreams (Are Made of This)", artist: "Eurythmics", duration: "3:38" },
  { title: "Perfect", artist: "Ed Sheeran", duration: "4:24" },
  { title: "Cinnamon Girl", artist: "Lana Del Rey", duration: "5:01" },
  { title: "How Deep Is Your Love", artist: "Bee Gees", duration: "4:04" },
  { title: "Smack That", artist: "Akon feat. Eminem", duration: "3:33" },
  { title: "Pretty Little Baby", artist: "Connie Francis", duration: "2:23" },
  { title: "Dandelions", artist: "Ruth B.", duration: "3:54" },
  { title: "Karma Chameleon", artist: "Culture Club", duration: "4:13" },
  { title: "APT.", artist: "ROSÉ & Bruno Mars", duration: "2:50" },
  { title: "End of Beginning", artist: "Djo", duration: "2:40" },
  { title: "Another Day in Paradise", artist: "Phil Collins", duration: "5:24" },
  { title: "Way Down We Go", artist: "KALEO", duration: "3:34" },
  { title: "The Night We Met", artist: "Lord Huron", duration: "3:29" },
  { title: "Empire State Of Mind", artist: "JAY-Z feat. Alicia Keys", duration: "4:37" },
  { title: "Dancing Queen", artist: "ABBA", duration: "3:51" },
  { title: "Wake Me Up Before You Go-Go", artist: "Wham!", duration: "3:52" },
  { title: "Someone You Loved", artist: "Lewis Capaldi", duration: "3:03" },
  { title: "Shekini", artist: "P-Square", duration: "3:39" },
  { title: "Another Love", artist: "Tom Odell", duration: "4:11" },
  { title: "Time After Time", artist: "Cyndi Lauper", duration: "4:02" },
  { title: "Ms. Jackson", artist: "Outkast", duration: "4:31" },
  { title: "Eye of the Tiger", artist: "Survivor", duration: "4:04" },
  { title: "lovely", artist: "Billie Eilish & Khalid", duration: "3:21" },
  { title: "Blinding Lights", artist: "The Weeknd", duration: "3:22" },
  { title: "My Heart Will Go On", artist: "Céline Dion", duration: "4:40" },
  { title: "Butter", artist: "BTS", duration: "2:45" },
  { title: "TOKYO DRIFT", artist: "Teriyaki Boyz", duration: "4:16" },
  { title: "Ooh Ahh (My Life Be Like)", artist: "Grits feat. TobyMac", duration: "3:54" },
  { title: "Nothing's Gonna Stop Us Now", artist: "Starship", duration: "4:31" },
  { title: "Baby", artist: "Justin Bieber feat. Ludacris", duration: "3:35" },
  { title: "Y Que Fue?", artist: "Don Miguelo", duration: "2:44" },
  { title: "Hoist The Colours", artist: "Samuel Kim", duration: "4:49" },
];

const GENRE_FILTERS = ["All", "Pop", "Hip-Hop", "R&B", "Rock", "Afrobeats", "Latin", "K-Pop", "Classic", "Dance", "Emotional"];
const SORT_OPTIONS = [
  { key: "default", label: "Default" },
  { key: "az", label: "A → Z" },
  { key: "artist", label: "By Artist" },
  { key: "year_desc", label: "Year ↓" },
  { key: "year_asc", label: "Year ↑" },
];



// ── Single song card ────────────────────────────────────────────────────────
function SongCard({ track, onShare }) {
  const [playKey, setPlayKey] = useState(0); // increment to re-trigger autoPlay
  const [isPreviewActive, setIsPreviewActive] = useState(false);

  const handleCoverClick = (e) => {
    e.stopPropagation();
    if (track.preview_url) {
      setIsPreviewActive(true);
      setPlayKey(k => k + 1);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 p-3 rounded-2xl"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>

      {/* Album cover — click to preview */}
      <div className="shrink-0 relative" onClick={handleCoverClick}>
        {track.cover_url ? (
          <img src={track.cover_url} alt={track.title}
            className="w-16 rounded-xl object-cover cursor-pointer" style={{ height: 72 }} />
        ) : (
          <div className="w-16 rounded-xl flex items-center justify-center cursor-pointer"
            style={{ height: 72, backgroundColor: "var(--bg-subtle)" }}>
            <Music className="w-7 h-7" style={{ color: "var(--text-hint)" }} />
          </div>
        )}
        {track.preview_url && (
          <div className="absolute inset-0 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.3)" }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: "#1DB954" }}>
              <Play className="w-3.5 h-3.5 text-black" fill="black" style={{ marginLeft: 1 }} />
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-snug truncate" style={{ color: "var(--text-primary)" }}>
          {track.title}
        </p>
        <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-secondary)" }}>
          🎤 {track.artist}
        </p>
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          {track.album && (
            <span className="text-[10px] truncate max-w-[120px]" style={{ color: "var(--text-hint)" }}>
              💿 {track.album}
            </span>
          )}
          {(track.duration || track.duration_str) && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>
              {track.duration || track.duration_str}
            </span>
          )}
          {track.release_year && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>
              {track.release_year}
            </span>
          )}
        </div>

        {/* Audio preview player */}
        {track.preview_url && isPreviewActive && (
          <AudioPreviewPlayer
            key={playKey}
            previewUrl={track.preview_url}
            trackTitle={track.title}
            autoPlay={true}
          />
        )}

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {track.spotify_url ? (
            <a href={track.spotify_url} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all active:scale-95"
              style={{ backgroundColor: "#1DB954", color: "#fff" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
              Listen on Spotify
            </a>
          ) : (
            <span className="text-[10px] italic" style={{ color: "var(--text-hint)" }}>Searching…</span>
          )}
          {/* Share button */}
          <button
            onClick={e => { e.stopPropagation(); onShare && onShare(track); }}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-medium transition-all active:scale-95"
            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}>
            <Share2 className="w-3 h-3" /> Share
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function SpotifyMusicTab() {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("All");
  const [searchResults, setSearchResults] = useState(null);
  const [enriched, setEnriched] = useState({}); // keyed by "title|artist"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [enriching, setEnriching] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [sortBy, setSortBy] = useState("default");
  const [nowPlaying, setNowPlaying] = useState(null);
  const [shareItem, setShareItem] = useState(null);

  // Enrich preloaded list on mount (parallel batches of 5)
  useEffect(() => {
    let cancelled = false;
    const enrichBatch = async () => {
      setEnriching(true);
      const batch = PRELOADED_SONGS.slice(0, 40);
      const CHUNK = 5;
      for (let i = 0; i < batch.length; i += CHUNK) {
        if (cancelled) break;
        const chunk = batch.slice(i, i + CHUNK);
        await Promise.all(chunk.map(async (song) => {
          if (cancelled) return;
          const key = `${song.title}|${song.artist}`;
          try {
            const res = await base44.functions.invoke("spotifySearch", {
              query: `${song.title} ${song.artist}`, type: "track", limit: 1,
            });
            if (res.data?.error) {
              console.error("Spotify error:", res.data.error);
              return;
            }
            const track = res.data?.tracks?.[0];
            if (track && !cancelled) {
              setEnriched(prev => ({ ...prev, [key]: track }));
            }
          } catch (err) { 
            console.error("Spotify fetch error:", err.message);
          }
        }));
        await new Promise(r => setTimeout(r, 250));
      }
      if (!cancelled) setEnriching(false);
    };
    enrichBatch();
    return () => { cancelled = true; };
  }, []);

  // Live search
  const doSearch = async (q) => {
    if (!q.trim()) { setSearchResults(null); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("spotifySearch", { query: q.trim(), type: "track", limit: 20 });
      if (res.data?.error) {
        setError("Spotify API error. Please try again.");
        console.error("Spotify error:", res.data.error);
        setSearchResults([]);
      } else {
        setSearchResults(res.data?.tracks || []);
      }
    } catch (err) {
      setError("Network error. Check your connection.");
      console.error("Search error:", err);
      setSearchResults([]);
    }
    setLoading(false);
  };

  const handleSearch = (e) => { e.preventDefault(); doSearch(query); };

  // Build display list
  const preloadedMerged = PRELOADED_SONGS.map(s => {
    const key = `${s.title}|${s.artist}`;
    const spotify = enriched[key];
    return {
      id: key,
      title: s.title,
      artist: s.artist,
      duration_str: s.duration,
      cover_url: spotify?.cover_url || null,
      spotify_url: spotify?.spotify_url || null,
      preview_url: spotify?.preview_url || null,
      album: spotify?.album || null,
      release_year: spotify?.release_year || null,
    };
  });

  // Genre filter applied to preloaded list (client-side keyword match)
  const GENRE_KEYWORDS = {
    "Pop": ["pop","katy","taylor","dua","ed sheeran","bts","rose","bruno","justin","billie","sheeran","wham","abba","cyndi","rick","phil","celine","lewis","benson","duncan","stephen"],
    "Hip-Hop": ["50 cent","usher","coolio","2pac","outkast","jay-z","jay z","eminem","ludacris","lil jon","toby","grits","teriyaki"],
    "R&B": ["the weeknd","rihanna","khalid","lady gaga"],
    "Rock": ["arctic monkeys","coldplay","keane","foreigner","survivor","police","a-ha","eurythmics","roxette","kaleo","lord huron","starship"],
    "Afrobeats": ["burna boy","p-square","innoss","innossb"],
    "Latin": ["daddy yankee","don miguelo","gasolina"],
    "K-Pop": ["bts","rosé","jennie"],
    "Classic": ["george michael","michael jackson","bee gees","abba","cyndi lauper","rick astley","richard marx","phil collins","connie francis","culture club","foreigner","roxette","eurythmics","police","a-ha","wham","starship"],
    "Dance": ["abba","wham","gasolina","yeah","usher","dancing","wake me up"],
    "Emotional": ["dandelions","someone you loved","another love","the night we met","lovely","arcade","end of beginning","right here waiting","my heart"],
  };

  const filteredPreloaded = genre === "All"
    ? preloadedMerged
    : preloadedMerged.filter(s => {
        const keywords = GENRE_KEYWORDS[genre] || [];
        const hay = (s.title + " " + s.artist).toLowerCase();
        return keywords.some(k => hay.includes(k));
      });

  const toDisplayTrack = (t) => ({
    ...t,
    media_type: "music",
    duration_str: t.duration_str || (t.duration_ms ? `${Math.floor(t.duration_ms/60000)}:${String(Math.floor((t.duration_ms%60000)/1000)).padStart(2,"0")}` : null),
  });

  const applySort = (list) => {
    if (sortBy === "az") return [...list].sort((a, b) => a.title.localeCompare(b.title));
    if (sortBy === "artist") return [...list].sort((a, b) => a.artist?.localeCompare(b.artist || ""));
    if (sortBy === "year_desc") return [...list].sort((a, b) => (b.release_year || 0) - (a.release_year || 0));
    if (sortBy === "year_asc") return [...list].sort((a, b) => (a.release_year || 0) - (b.release_year || 0));
    return list;
  };

  const displayList = applySort(searchResults
    ? searchResults.map(t => toDisplayTrack({ id: t.id, title: t.title, artist: t.artist, cover_url: t.cover_url, spotify_url: t.spotify_url, preview_url: t.preview_url, album: t.album, release_year: t.release_year }))
    : filteredPreloaded.map(toDisplayTrack));

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center gap-2">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="#1DB954">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
        </svg>
        <div>
          <p className="text-base font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Spotify Music</p>
          <p className="text-[11px]" style={{ color: "var(--text-hint)" }}>
            {enriching ? "Loading song details…" : `${PRELOADED_SONGS.length} curated tracks · search for more`}
          </p>
        </div>
      </div>

      {/* Genre chips */}
      <div className="px-5 mb-3 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 w-max pb-1">
          {GENRE_FILTERS.slice(0, 8).map(g => (
            <button key={g} onClick={() => { setGenre(g); setSearchResults(null); setQuery(""); }}
              className="px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-all"
              style={{
                backgroundColor: genre === g ? "#1DB954" : "var(--bg-card)",
                color: genre === g ? "#fff" : "var(--text-secondary)",
                borderColor: genre === g ? "#1DB954" : "var(--border-light)",
              }}>
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="px-5 mb-3">
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-hint)" }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by title or artist…"
              className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm outline-none"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
            />
            {query && (
              <button type="button" onClick={() => { setQuery(""); setSearchResults(null); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5" style={{ color: "var(--text-hint)" }} />
              </button>
            )}
          </div>
          <button type="submit" disabled={!query.trim() || loading}
            className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-40"
            style={{ backgroundColor: "#1DB954", color: "#fff" }}>
            {loading ? "…" : "Go"}
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="mx-5 mb-3 p-3 rounded-xl text-xs text-center" style={{ backgroundColor: "#FEF0E6", color: "#D98B62" }}>{error}</div>
      )}

      {/* Count */}
      <p className="px-5 mb-2 text-[11px]" style={{ color: "var(--text-hint)" }}>
        {searchResults ? `${displayList.length} result${displayList.length !== 1 ? "s" : ""} for "${query}"` : `${displayList.length} track${displayList.length !== 1 ? "s" : ""}`}
      </p>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "#1DB954", borderTopColor: "transparent" }} />
        </div>
      ) : displayList.length > 0 ? (
        <div className="px-5 space-y-2">
          <AnimatePresence>
            {displayList.map(track => (
              <div key={track.id} onClick={() => setSelectedItem(track)} className="cursor-pointer">
                <SongCard track={track} onShare={setShareItem} />
              </div>
            ))}
          </AnimatePresence>
          {searchResults && (
            <button onClick={() => { setSearchResults(null); setQuery(""); }}
              className="w-full py-2 text-xs font-medium text-center" style={{ color: "var(--text-hint)" }}>
              ← Back to all songs
            </button>
          )}
        </div>
      ) : (
        <div className="py-12 text-center px-5">
          <p className="text-3xl mb-3">🎵</p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No tracks match "{genre}"</p>
        </div>
      )}

      {/* Footer */}
      <p className="text-[10px] text-center px-5 mt-6 leading-relaxed" style={{ color: "var(--text-hint)" }}>
        Powered by <span style={{ color: "#1DB954", fontWeight: 600 }}>Spotify</span>. Music data © Spotify AB. No music is hosted in this app. All links go to official Spotify pages.
      </p>

      <AnimatePresence>
        {selectedItem && <MediaDetailSheet item={selectedItem} onClose={() => setSelectedItem(null)} />}
      </AnimatePresence>

      {shareItem && <ShareModal item={shareItem} onClose={() => setShareItem(null)} />}
    </div>
  );
}