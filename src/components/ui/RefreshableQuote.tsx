"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

interface Props {
  quotes: string[];
  label?: string;
  variant?: "dark" | "light"; // dark = navy card (ai-card style), light = gold border card
}

export default function RefreshableQuote({
  quotes,
  label = "✦ Your affirmation today",
  variant = "dark",
}: Props) {
  const [idx, setIdx] = useState(() => new Date().getDay() % quotes.length);
  const [spinning, setSpinning] = useState(false);

  function refresh() {
    setSpinning(true);
    setIdx((i) => {
      let next = Math.floor(Math.random() * quotes.length);
      // Make sure we don't show the same quote twice in a row
      if (next === i) next = (i + 1) % quotes.length;
      return next;
    });
    setTimeout(() => setSpinning(false), 400);
  }

  if (variant === "light") {
    return (
      <div className="flex gap-3 bg-white border-l-4 border-l-gold-400 rounded-r-2xl px-5 py-4 mb-6 shadow-sm">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-widest text-gold-500 font-medium mb-1">
            {label}
          </p>
          <p className="font-serif text-navy-500 italic text-base leading-relaxed">
            &ldquo;{quotes[idx]}&rdquo;
          </p>
        </div>
        <button
          onClick={refresh}
          title="Try a different quote"
          className="flex-shrink-0 text-navy-300 hover:text-gold-500 transition-colors mt-1"
        >
          <RefreshCw
            size={16}
            className={`transition-transform duration-400 ${spinning ? "rotate-180" : ""}`}
          />
        </button>
      </div>
    );
  }

  // Dark variant (ai-card style)
  return (
    <div className="ai-card mb-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-widest text-gold-400 font-medium mb-2">
            {label}
          </p>
          <p className="font-serif text-ivory-100 italic text-lg leading-relaxed">
            &ldquo;{quotes[idx]}&rdquo;
          </p>
        </div>
        <button
          onClick={refresh}
          title="Try a different quote"
          className="flex-shrink-0 text-gold-400/60 hover:text-gold-400 transition-colors mt-1"
        >
          <RefreshCw
            size={16}
            className={`transition-transform duration-400 ${spinning ? "rotate-180" : ""}`}
          />
        </button>
      </div>
    </div>
  );
}
