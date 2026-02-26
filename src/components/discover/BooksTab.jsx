import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Heart, Share2 } from "lucide-react";

const PRELOADED_BOOKS = [
  { title: "Anna Karenina", author: "Leo Tolstoy", year: 1877, cover: "📕" },
  { title: "To Kill a Mockingbird", author: "Harper Lee", year: 1960, cover: "📕" },
  { title: "The Great Gatsby", author: "F. Scott Fitzgerald", year: 1925, cover: "📕" },
  { title: "One Hundred Years of Solitude", author: "Gabriel García Márquez", year: 1967, cover: "📕" },
  { title: "A Passage to India", author: "E.M. Forster", year: 1924, cover: "📕" },
  { title: "Invisible Man", author: "Ralph Ellison", year: 1952, cover: "📕" },
  { title: "Don Quixote", author: "Miguel de Cervantes", year: 1605, cover: "📕" },
  { title: "Beloved", author: "Toni Morrison", year: 1987, cover: "📕" },
  { title: "The 48 Laws of Power", author: "Robert Greene", year: 1998, cover: "📘" },
];

export default function BooksTab({ onShare }) {
  const [liked, setLiked] = useState(new Set());

  const toggleLike = (title) => {
    const newLiked = new Set(liked);
    if (newLiked.has(title)) {
      newLiked.delete(title);
    } else {
      newLiked.add(title);
    }
    setLiked(newLiked);
  };

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center gap-2">
        <BookOpen className="w-6 h-6" style={{ color: "var(--text-primary)" }} />
        <div>
          <p className="text-base font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
            Classic Books
          </p>
          <p className="text-[11px]" style={{ color: "var(--text-hint)" }}>
            {PRELOADED_BOOKS.length} timeless reads
          </p>
        </div>
      </div>

      {/* Books grid */}
      <div className="px-5 space-y-2">
        <AnimatePresence>
          {PRELOADED_BOOKS.map((book) => (
            <motion.div
              key={book.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 p-3 rounded-2xl"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
            >
              {/* Book cover icon */}
              <div className="shrink-0 flex items-center justify-center w-16" style={{ height: 72 }}>
                <span className="text-5xl">{book.cover}</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-snug truncate" style={{ color: "var(--text-primary)" }}>
                  {book.title}
                </p>
                <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-secondary)" }}>
                  ✍️ {book.author}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-hint)" }}>
                    📅 {book.year}
                  </span>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <button
                    onClick={() => toggleLike(book.title)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all active:scale-95"
                    style={{
                      backgroundColor: liked.has(book.title) ? "#E05C7A" : "var(--bg-subtle)",
                      color: liked.has(book.title) ? "#fff" : "var(--text-secondary)",
                      border: `1px solid ${liked.has(book.title) ? "#E05C7A" : "var(--border-light)"}`,
                    }}
                  >
                    <Heart className="w-3 h-3" fill={liked.has(book.title) ? "currentColor" : "none"} />
                    {liked.has(book.title) ? "Liked" : "Like"}
                  </button>
                  <button
                    onClick={() => onShare?.(book)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-medium transition-all active:scale-95"
                    style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}
                  >
                    <Share2 className="w-3 h-3" /> Share
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <p className="text-[10px] text-center px-5 mt-6 leading-relaxed" style={{ color: "var(--text-hint)" }}>
        Discover timeless literature. Save your favorites and share with friends.
      </p>
    </div>
  );
}