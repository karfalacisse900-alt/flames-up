import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Search } from "lucide-react";

export default function GifPicker({ onSelect, onClose }) {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    search("trending");
  }, []);

  const search = async (q) => {
    if (!q) return;
    setLoading(true);
    const res = await base44.functions.invoke("giphySearch", { query: q }).catch(() => null);
    setGifs(res?.data?.data || []);
    setLoading(false);
  };

  return (
    <div className="mx-3 mb-2 rounded-2xl overflow-hidden"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-light)", maxHeight: 280 }}>
      <div className="flex items-center gap-2 p-2" style={{ borderBottom: "1px solid var(--border-light)" }}>
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-xl"
          style={{ backgroundColor: "var(--bg-subtle)" }}>
          <Search className="w-3.5 h-3.5" style={{ color: "var(--text-hint)" }} />
          <input value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && search(query || "trending")}
            placeholder="Search GIFs…" className="flex-1 bg-transparent outline-none text-xs"
            style={{ color: "var(--text-primary)" }} />
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "var(--bg-subtle)" }}>
          <X className="w-3.5 h-3.5" style={{ color: "var(--text-secondary)" }} />
        </button>
      </div>
      <div className="overflow-y-auto" style={{ maxHeight: 220 }}>
        {loading ? (
          <p className="text-center text-xs py-4" style={{ color: "var(--text-hint)" }}>Loading…</p>
        ) : (
          <div className="grid grid-cols-3 gap-1 p-1">
            {gifs.map(gif => (
              <button key={gif.id} onClick={() => onSelect(gif.images?.fixed_height?.url || gif.images?.original?.url)}
                className="rounded-xl overflow-hidden aspect-square">
                <img src={gif.images?.fixed_height_small?.url || gif.images?.fixed_height?.url}
                  alt={gif.title} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}