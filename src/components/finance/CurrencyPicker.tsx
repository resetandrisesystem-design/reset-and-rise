"use client";

import { Globe } from "lucide-react";
import { CURRENCIES, currencyLabel, regionName } from "@/lib/currency";
import type { CurrencySource } from "@/lib/useCurrency";

interface Props {
  value: string;
  source: CurrencySource;
  country: string | null;
  suggestion: string | null;
  onChange: (code: string) => void;
}

/** The currency dropdown for money pages, with a note on where the current
 *  choice came from. */
export default function CurrencyPicker({ value, source, country, suggestion, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <label className="flex items-center gap-2">
        <Globe size={13} className="text-gold-400" />
        <span className="text-xs uppercase tracking-widest text-navy-400 font-medium">Currency</span>
        <select
          className="input w-auto py-1.5 pr-8 text-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Currency"
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>{currencyLabel(c.code)}</option>
          ))}
        </select>
      </label>
      {source === "detected" && country && (
        <span className="text-xs text-navy-400 italic">
          Detected from your location ({regionName(country)}). Change it any time.
        </span>
      )}
      {suggestion && country && (
        <button
          type="button"
          onClick={() => onChange(suggestion)}
          className="text-xs text-gold-500 hover:text-gold-600 font-medium"
        >
          You seem to be in {regionName(country)}. Switch to {suggestion}?
        </button>
      )}
    </div>
  );
}
