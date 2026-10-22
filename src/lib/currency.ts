/**
 * Currency support for the Money Reset and Meal Planner pages.
 *
 * Amounts are entered and stored in the currency the user chooses, or in the
 * one detected from their location on their first visit. Nothing here touches
 * the subscription prices, which stay in GBP on Stripe.
 */

export const DEFAULT_CURRENCY = "GBP";

export interface CurrencyInfo {
  code: string;
  name: string;
}

/** GBP, USD and EUR first, then alphabetical by code. Every currency that the
 *  country table below points at is in this list, so the dropdown can always
 *  show the detected one. */
export const CURRENCIES: CurrencyInfo[] = [
  { code: "GBP", name: "British Pound" },
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "AED", name: "UAE Dirham" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "BBD", name: "Barbadian Dollar" },
  { code: "BDT", name: "Bangladeshi Taka" },
  { code: "BRL", name: "Brazilian Real" },
  { code: "BWP", name: "Botswana Pula" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "CZK", name: "Czech Koruna" },
  { code: "DKK", name: "Danish Krone" },
  { code: "EGP", name: "Egyptian Pound" },
  { code: "ETB", name: "Ethiopian Birr" },
  { code: "GHS", name: "Ghanaian Cedi" },
  { code: "GMD", name: "Gambian Dalasi" },
  { code: "HKD", name: "Hong Kong Dollar" },
  { code: "HUF", name: "Hungarian Forint" },
  { code: "IDR", name: "Indonesian Rupiah" },
  { code: "ILS", name: "Israeli Shekel" },
  { code: "INR", name: "Indian Rupee" },
  { code: "JMD", name: "Jamaican Dollar" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "KES", name: "Kenyan Shilling" },
  { code: "KRW", name: "South Korean Won" },
  { code: "LKR", name: "Sri Lankan Rupee" },
  { code: "MAD", name: "Moroccan Dirham" },
  { code: "MUR", name: "Mauritian Rupee" },
  { code: "MWK", name: "Malawian Kwacha" },
  { code: "MXN", name: "Mexican Peso" },
  { code: "MYR", name: "Malaysian Ringgit" },
  { code: "MZN", name: "Mozambican Metical" },
  { code: "NAD", name: "Namibian Dollar" },
  { code: "NGN", name: "Nigerian Naira" },
  { code: "NOK", name: "Norwegian Krone" },
  { code: "NZD", name: "New Zealand Dollar" },
  { code: "PHP", name: "Philippine Peso" },
  { code: "PKR", name: "Pakistani Rupee" },
  { code: "PLN", name: "Polish Zloty" },
  { code: "QAR", name: "Qatari Riyal" },
  { code: "RON", name: "Romanian Leu" },
  { code: "RWF", name: "Rwandan Franc" },
  { code: "SAR", name: "Saudi Riyal" },
  { code: "SEK", name: "Swedish Krona" },
  { code: "SGD", name: "Singapore Dollar" },
  { code: "SLE", name: "Sierra Leonean Leone" },
  { code: "THB", name: "Thai Baht" },
  { code: "TRY", name: "Turkish Lira" },
  { code: "TTD", name: "Trinidad & Tobago Dollar" },
  { code: "TZS", name: "Tanzanian Shilling" },
  { code: "UGX", name: "Ugandan Shilling" },
  { code: "VND", name: "Vietnamese Dong" },
  { code: "XAF", name: "Central African CFA Franc" },
  { code: "XCD", name: "East Caribbean Dollar" },
  { code: "XOF", name: "West African CFA Franc" },
  { code: "ZAR", name: "South African Rand" },
  { code: "ZMW", name: "Zambian Kwacha" },
];

/** ISO 3166 country code to the currency people there budget in. Countries
 *  not listed fall back to the app default. */
const COUNTRY_CURRENCY: Record<string, string> = {
  GB: "GBP", GG: "GBP", JE: "GBP", IM: "GBP",
  US: "USD", PR: "USD", EC: "USD", SV: "USD", PA: "USD", ZW: "USD",
  AT: "EUR", BE: "EUR", CY: "EUR", DE: "EUR", EE: "EUR", ES: "EUR", FI: "EUR", FR: "EUR",
  GR: "EUR", HR: "EUR", IE: "EUR", IT: "EUR", LT: "EUR", LU: "EUR", LV: "EUR", MT: "EUR",
  NL: "EUR", PT: "EUR", SI: "EUR", SK: "EUR", AD: "EUR", MC: "EUR", SM: "EUR", VA: "EUR",
  ME: "EUR", XK: "EUR",
  AE: "AED", AU: "AUD", BB: "BBD", BD: "BDT", BR: "BRL", BW: "BWP", CA: "CAD",
  CH: "CHF", LI: "CHF", CN: "CNY", CZ: "CZK", DK: "DKK", GL: "DKK", FO: "DKK",
  EG: "EGP", ET: "ETB", GH: "GHS", GM: "GMD", HK: "HKD", HU: "HUF", ID: "IDR",
  IL: "ILS", IN: "INR", JM: "JMD", JP: "JPY", KE: "KES", KR: "KRW", LK: "LKR",
  MA: "MAD", MU: "MUR", MW: "MWK", MX: "MXN", MY: "MYR", MZ: "MZN", NA: "NAD",
  NG: "NGN", NO: "NOK", NZ: "NZD", PH: "PHP", PK: "PKR", PL: "PLN", QA: "QAR",
  RO: "RON", RW: "RWF", SA: "SAR", SE: "SEK", SG: "SGD", SL: "SLE", TH: "THB",
  TR: "TRY", TT: "TTD", TZ: "TZS", UG: "UGX", VN: "VND",
  CM: "XAF", CF: "XAF", TD: "XAF", CG: "XAF", GQ: "XAF", GA: "XAF",
  AG: "XCD", DM: "XCD", GD: "XCD", KN: "XCD", LC: "XCD", VC: "XCD",
  BJ: "XOF", BF: "XOF", CI: "XOF", GW: "XOF", ML: "XOF", NE: "XOF", SN: "XOF", TG: "XOF",
  ZA: "ZAR", LS: "ZAR", SZ: "ZAR", ZM: "ZMW",
};

export function isSupportedCurrency(code: unknown): code is string {
  return typeof code === "string" && CURRENCIES.some((c) => c.code === code);
}

export function currencyForCountry(country: string | null | undefined): string | null {
  if (!country) return null;
  return COUNTRY_CURRENCY[country.toUpperCase()] ?? null;
}

/* ── formatting ─────────────────────────────────────────────── */

const formatters = new Map<string, Intl.NumberFormat | null>();

function formatter(code: string, minFrac: number, maxFrac: number): Intl.NumberFormat | null {
  const key = `${code}|${minFrac}|${maxFrac}`;
  if (formatters.has(key)) return formatters.get(key)!;
  let f: Intl.NumberFormat | null = null;
  for (const currencyDisplay of ["narrowSymbol", "symbol"] as const) {
    try {
      f = new Intl.NumberFormat(undefined, {
        style: "currency", currency: code, currencyDisplay,
        minimumFractionDigits: minFrac, maximumFractionDigits: maxFrac,
      });
      break;
    } catch {
      /* older browsers lack narrowSymbol; an unknown code fails both and falls through */
    }
  }
  formatters.set(key, f);
  return f;
}

/** How many decimal places the currency uses: 2 for most, 0 for yen, shillings and the like. */
export function minorUnits(code: string): number {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency: code }).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}

/** "£1,500", "₦250,000", "$4.50". Whole numbers show no decimals, as before. */
export function formatMoney(amount: number, code: string): string {
  const n = Number.isFinite(amount) ? amount : 0;
  const units = minorUnits(code);
  const min = Number.isInteger(n) ? 0 : Math.min(2, units);
  const f = formatter(code, min, Math.max(min, units));
  return f ? f.format(n) : `${code} ${n.toLocaleString()}`;
}

/** The bare symbol for input prefixes: "£", "$", "₦", "KSh". Falls back to the code. */
export function currencySymbol(code: string): string {
  const f = formatter(code, 0, 0);
  if (!f) return code;
  try {
    return f.formatToParts(1).find((p) => p.type === "currency")?.value ?? code;
  } catch {
    return code;
  }
}

/** "NGN · Nigerian Naira (₦)" for the dropdown. */
export function currencyLabel(code: string): string {
  const name = CURRENCIES.find((c) => c.code === code)?.name ?? code;
  const sym = currencySymbol(code);
  return sym !== code ? `${code} · ${name} (${sym})` : `${code} · ${name}`;
}

/** "United Kingdom" for "GB", in the visitor's own language. */
export function regionName(country: string): string {
  try {
    return new Intl.DisplayNames(undefined, { type: "region" }).of(country) ?? country;
  } catch {
    return country;
  }
}

/** Rounds a converted amount to the target currency's minor units. */
export function convertAmount(amount: number, rate: number, toCode: string): number {
  const p = Math.pow(10, minorUnits(toCode));
  return Math.round((Number.isFinite(amount) ? amount : 0) * rate * p) / p;
}

/* ── where the choice is remembered ─────────────────────────── */

const STORAGE_PREFIX = "rr_currency_";

export function readSavedCurrency(userId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(STORAGE_PREFIX + userId);
    return isSupportedCurrency(v) ? v : null;
  } catch {
    return null;
  }
}

export function writeSavedCurrency(userId: string, code: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_PREFIX + userId, code);
  } catch {
    /* storage blocked: the account copy still carries the choice */
  }
}

/* ── location and rates ─────────────────────────────────────── */

/** This visitor's country: the geo header Vercel adds first, then the browser's locale. */
export async function detectCountry(): Promise<string | null> {
  try {
    const res = await fetch("/api/geo", { cache: "no-store" });
    if (res.ok) {
      const body = await res.json();
      if (typeof body?.country === "string" && /^[A-Za-z]{2}$/.test(body.country)) {
        return body.country.toUpperCase();
      }
    }
  } catch {
    /* fall through to the locale */
  }
  try {
    const lang = typeof navigator !== "undefined" ? navigator.language : "";
    if (lang) {
      const region = new Intl.Locale(lang).maximize().region;
      if (region && /^[A-Z]{2}$/.test(region)) return region;
    }
  } catch {
    /* no usable locale */
  }
  return null;
}

/** Today's rate from one currency to another, via /api/fx. Null when unavailable. */
export async function fetchRate(from: string, to: string): Promise<number | null> {
  if (from === to) return 1;
  try {
    const res = await fetch(`/api/fx?base=${encodeURIComponent(from)}`);
    if (!res.ok) return null;
    const body = await res.json();
    const rate = Number(body?.rates?.[to]);
    return Number.isFinite(rate) && rate > 0 ? rate : null;
  } catch {
    return null;
  }
}
