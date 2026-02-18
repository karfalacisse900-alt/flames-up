import React from "react";
import { Star } from "lucide-react";

export default function StarRating({ value = 0, max = 5, onRate, size = "sm", showCount, count }) {
  const [hover, setHover] = React.useState(0);
  const stars = Array.from({ length: max }, (_, i) => i + 1);
  const sz = size === "lg" ? "w-6 h-6" : size === "md" ? "w-5 h-5" : "w-3.5 h-3.5";

  return (
    <div className="flex items-center gap-0.5">
      {stars.map((star) => (
        <Star
          key={star}
          className={`${sz} transition-colors ${onRate ? "cursor-pointer" : ""}`}
          fill={(hover || value) >= star ? "#F59E0B" : "none"}
          stroke={(hover || value) >= star ? "#F59E0B" : "#D1D5DB"}
          onMouseEnter={() => onRate && setHover(star)}
          onMouseLeave={() => onRate && setHover(0)}
          onClick={() => onRate && onRate(star)}
        />
      ))}
      {showCount && (
        <span className="text-xs ml-1" style={{ color: "var(--text-hint)" }}>
          {value > 0 ? `${value.toFixed(1)}` : ""} {count > 0 ? `(${count})` : "(no reviews)"}
        </span>
      )}
    </div>
  );
}