import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import WorthItButton from "./WorthItButton";

const PRELOADED_BOOKS = [
  { id: "book_1", title: "Atomic Habits", author: "James Clear", year: 2018, cover: "https://images.unsplash.com/photo-1507842217343-583f20270319?w=300&h=400&fit=crop" },
  { id: "book_2", title: "The 7 Habits of Highly Effective People", author: "Stephen R. Covey", year: 1989, cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=400&fit=crop" },
  { id: "book_3", title: "Thinking, Fast and Slow", author: "Daniel Kahneman", year: 2011, cover: "https://images.unsplash.com/photo-1543002588-d83cdf395bda?w=300&h=400&fit=crop" },
  { id: "book_4", title: "Sapiens", author: "Yuval Noah Harari", year: 2011, cover: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=300&h=400&fit=crop" },
  { id: "book_5", title: "Educated", author: "Tara Westover", year: 2018, cover: "https://images.unsplash.com/photo-1479808592917-e93b0cfc4dca?w=300&h=400&fit=crop" },
  { id: "book_6", title: "The Midnight Library", author: "Matt Haig", year: 2020, cover: "https://images.unsplash.com/photo-1507842217343-583f20270319?w=300&h=400&fit=crop" },
];

export default function BooksWithRating({ onShare }) {
  const [likedBooks, setLikedBooks] = useState({});

  const toggleLike = (bookId) => {
    setLikedBooks(prev => ({ ...prev, [bookId]: !prev[bookId] }));
  };

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        <p className="text-base font-semibold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
          📚 Books
        </p>
        <p className="text-[11px]" style={{ color: "var(--text-hint)" }}>
          {PRELOADED_BOOKS.length} curated reads
        </p>
      </div>

      {/* Books grid */}
      <div className="px-5 space-y-2.5">
        <AnimatePresence>
          {PRELOADED_BOOKS.map(book => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-2xl flex gap-3"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)" }}
            >
              {/* Cover */}
              <img
                src={book.cover}
                alt={book.title}
                className="w-14 h-20 rounded-lg object-cover shrink-0"
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>
                  {book.title}
                </h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  {book.author}
                </p>
                <p className="text-[10px] mt-1" style={{ color: "var(--text-hint)" }}>
                  {book.year}
                </p>
                <div className="mt-2">
                  <WorthItButton
                    contentType="book"
                    contentId={book.id}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <p className="text-[10px] text-center px-5 mt-6" style={{ color: "var(--text-hint)" }}>
        Explore timeless and modern classics
      </p>
    </div>
  );
}