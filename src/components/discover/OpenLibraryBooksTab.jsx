import React, { useState } from "react";
import { Search, BookOpen, X, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const QUICK_SEARCHES = ["Fiction classics", "Philosophy", "Science", "History", "Self-help", "Mystery", "Fantasy", "Biography"];

const SUBJECTS = ["All Subjects", "Fiction", "History", "Science", "Philosophy", "Biography", "Fantasy", "Mystery", "Psychology", "Poetry", "Romance", "Thriller"];

function BookCard({ book }) {
  const coverUrl = book.cover_i
    ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
    : null;

  const olUrl = `https://openlibrary.org${book.key}`;
  const subject = book.subject?.[0];
  const firstSentence = typeof book.first_sentence === "string"
    ? book.first_sentence
    : book.first_sentence?.value || null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 p-3 rounded-2xl"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
      {/* Cover */}
      <div className="shrink-0">
        {coverUrl ? (
          <img src={coverUrl} alt={book.title}
            className="w-16 rounded-xl object-cover"
            style={{ height: 88 }}
            onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
          />
        ) : null}
        <div className={`w-16 rounded-xl flex items-center justify-center ${coverUrl ? "hidden" : "flex"}`}
          style={{ height: 88, backgroundColor: "var(--bg-subtle)" }}>
          <BookOpen className="w-7 h-7" style={{ color: "var(--text-hint)" }} />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-snug" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
          {book.title}
        </p>
        {book.author_name?.[0] && (
          <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-secondary)" }}>
            ✍️ {book.author_name[0]}
          </p>
        )}
        <div className="flex flex-wrap gap-1 mt-1">
          {book.first_publish_year && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>
              {book.first_publish_year}
            </span>
          )}
          {subject && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ backgroundColor: "var(--accent-primary-light)", color: "var(--accent-primary)" }}>
              {subject.length > 22 ? subject.slice(0, 22) + "…" : subject}
            </span>
          )}
        </div>
        {firstSentence && (
          <p className="text-[11px] mt-1.5 leading-relaxed line-clamp-2" style={{ color: "var(--text-secondary)" }}>
            "{firstSentence}"
          </p>
        )}
        <a href={olUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-2 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all active:scale-95"
          style={{ backgroundColor: "var(--accent-primary)", color: "#fff" }}>
          <BookOpen className="w-3 h-3" />
          Read / Buy
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </motion.div>
  );
}

export default function OpenLibraryBooksTab() {
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("All Subjects");
  const [books, setBooks] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const doSearch = async (q, subj) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      let url = `https://openlibrary.org/search.json?limit=20&fields=key,title,author_name,first_publish_year,cover_i,subject,first_sentence`;
      // Append subject filter if selected
      const activeSubject = subj !== "All Subjects" ? subj : null;
      if (activeSubject) {
        url += `&q=${encodeURIComponent(q + " " + activeSubject)}`;
      } else {
        url += `&q=${encodeURIComponent(q)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setBooks(data.docs || []);
    } catch (e) {
      setError("Search failed. Please try again.");
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    doSearch(query, subject);
  };

  return (
    <div className="pb-10">
      {/* Open Library branding header */}
      <div className="px-5 pt-4 pb-3 flex items-center gap-2">
        <span className="text-2xl">📚</span>
        <div>
          <p className="text-base font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>Open Library</p>
          <p className="text-[11px]" style={{ color: "var(--text-hint)" }}>Millions of free books to discover</p>
        </div>
      </div>

      {/* Subject filter */}
      <div className="px-5 mb-3 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 w-max pb-1">
          {SUBJECTS.map(s => (
            <button key={s} onClick={() => { setSubject(s); if (query) doSearch(query, s); }}
              className="px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-all"
              style={{
                backgroundColor: subject === s ? "var(--accent-primary)" : "var(--bg-card)",
                color: subject === s ? "#fff" : "var(--text-secondary)",
                borderColor: subject === s ? "var(--accent-primary)" : "var(--border-light)",
              }}>
              {s}
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
              placeholder="Search by title or author..."
              className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm outline-none"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
            />
            {query && (
              <button type="button" onClick={() => { setQuery(""); setBooks(null); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5" style={{ color: "var(--text-hint)" }} />
              </button>
            )}
          </div>
          <button type="submit" disabled={!query.trim() || loading}
            className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-40"
            style={{ backgroundColor: "var(--accent-primary)", color: "#fff" }}>
            {loading ? "..." : "Go"}
          </button>
        </div>
      </form>

      {/* Quick search chips */}
      {!books && (
        <div className="px-5 mb-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 w-max pb-1">
            {QUICK_SEARCHES.map(q => (
              <button key={q} onClick={() => { setQuery(q); doSearch(q, subject); }}
                className="px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap"
                style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-light)", color: "var(--text-secondary)" }}>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mx-5 mb-3 p-3 rounded-xl text-xs text-center" style={{ backgroundColor: "#FEF0E6", color: "#D98B62" }}>{error}</div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
        </div>
      ) : books && books.length > 0 ? (
        <div className="px-5 space-y-2">
          <p className="text-[11px] mb-2" style={{ color: "var(--text-hint)" }}>{books.length} result{books.length !== 1 ? "s" : ""} for "{query}"</p>
          <AnimatePresence>
            {books.map((book, i) => <BookCard key={book.key || i} book={book} />)}
          </AnimatePresence>
        </div>
      ) : books && books.length === 0 ? (
        <div className="py-12 text-center px-5">
          <p className="text-3xl mb-3">📖</p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No books found for "{query}"</p>
        </div>
      ) : (
        <div className="py-10 text-center px-5">
          <p className="text-4xl mb-3">📖</p>
          <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Discover millions of books</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>Search by title, author, or topic</p>
        </div>
      )}

      {/* Open Library attribution */}
      <p className="text-[10px] text-center px-5 mt-6 leading-relaxed" style={{ color: "var(--text-hint)" }}>
        Powered by <span style={{ color: "var(--accent-primary)", fontWeight: 600 }}>Open Library</span> (openlibrary.org).
        Book data © Internet Archive & contributors. This app does not host any books or PDFs.
      </p>
    </div>
  );
}