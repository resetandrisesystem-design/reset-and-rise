"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  DEFAULT_CURRENCY, currencyForCountry, detectCountry, isSupportedCurrency,
  readSavedCurrency, writeSavedCurrency,
} from "@/lib/currency";

export type CurrencySource = "saved" | "detected" | "default";

export interface CurrencyState {
  code: string;
  source: CurrencySource;
  /** ISO country code the location check returned, once it has run. */
  country: string | null;
  /** A currency detected for the user's location but not applied, because their figures are already in another one. */
  suggestion: string | null;
}

interface Options {
  userId: string;
  /** The currency saved on the user's account (auth metadata), if any. */
  initialCurrency?: string | null;
  /** True when the user already has figures entered: the currency is then never switched automatically. */
  hasExistingData: boolean;
}

/**
 * The user's currency for money pages. Order of precedence: the choice saved on
 * this device, the choice saved on the account, the currency of the country the
 * visitor is in (first visit only), and finally GBP. A saved choice is written
 * both to localStorage and to the account so it follows the user across devices.
 */
export function useCurrency({ userId, initialCurrency, hasExistingData }: Options) {
  const [state, setState] = useState<CurrencyState>(() => {
    const saved = readSavedCurrency(userId) ?? (isSupportedCurrency(initialCurrency) ? initialCurrency : null);
    return saved
      ? { code: saved, source: "saved", country: null, suggestion: null }
      : { code: DEFAULT_CURRENCY, source: "default", country: null, suggestion: null };
  });

  // Read at the moment detection completes, so figures typed meanwhile count.
  const hasDataRef = useRef(hasExistingData);
  hasDataRef.current = hasExistingData;

  const persist = useCallback((code: string) => {
    writeSavedCurrency(userId, code);
    try {
      createClient().auth.updateUser({ data: { currency: code } }).then(() => {}, () => {});
    } catch {
      /* the device copy is enough to keep working */
    }
  }, [userId]);

  useEffect(() => {
    if (state.source === "saved") {
      if (!readSavedCurrency(userId)) writeSavedCurrency(userId, state.code);
      return;
    }
    let cancelled = false;
    detectCountry().then((country) => {
      if (cancelled) return;
      const detected = currencyForCountry(country);
      if (!country || !detected) {
        setState((s) => ({ ...s, country }));
      } else if (hasDataRef.current) {
        setState((s) => ({ ...s, country, suggestion: detected !== s.code ? detected : null }));
      } else {
        setState({ code: detected, source: "detected", country, suggestion: null });
        persist(detected);
      }
    });
    return () => { cancelled = true; };
    // Detection runs once per user; after a choice is saved it never runs again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const setCurrency = useCallback((code: string) => {
    if (!isSupportedCurrency(code)) return;
    setState((s) => ({ ...s, code, source: "saved", suggestion: null }));
    persist(code);
  }, [persist]);

  return { ...state, setCurrency };
}
