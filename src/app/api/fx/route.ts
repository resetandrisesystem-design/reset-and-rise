import { NextRequest, NextResponse } from "next/server";
import { isSupportedCurrency } from "@/lib/currency";

export const dynamic = "force-dynamic";

/** Daily exchange rates for one base currency. Used only when a user chooses to
 *  convert the figures already on their Money Reset page. Results are cached on
 *  the server for twelve hours, so the upstream services see a handful of
 *  requests a day at most. */
const TWELVE_HOURS = 12 * 60 * 60;

interface Rates {
  rates: Record<string, number>;
  date: string;
  source: string;
}

async function fromErApi(base: string): Promise<Rates | null> {
  const res = await fetch(`https://open.er-api.com/v6/latest/${base}`, { next: { revalidate: TWELVE_HOURS } });
  if (!res.ok) return null;
  const body = await res.json();
  if (body?.result !== "success" || typeof body?.rates !== "object") return null;
  return { rates: body.rates, date: String(body.time_last_update_utc || ""), source: "open.er-api.com" };
}

async function fromFrankfurter(base: string): Promise<Rates | null> {
  const res = await fetch(`https://api.frankfurter.dev/v1/latest?base=${base}`, { next: { revalidate: TWELVE_HOURS } });
  if (!res.ok) return null;
  const body = await res.json();
  if (typeof body?.rates !== "object") return null;
  return { rates: body.rates, date: String(body.date || ""), source: "frankfurter.dev" };
}

export async function GET(request: NextRequest) {
  const base = (request.nextUrl.searchParams.get("base") || "GBP").toUpperCase();
  if (!isSupportedCurrency(base)) {
    return NextResponse.json({ error: "Unknown currency" }, { status: 400 });
  }

  for (const provider of [fromErApi, fromFrankfurter]) {
    try {
      const result = await provider(base);
      if (result) {
        return NextResponse.json({ base, ...result }, { headers: { "Cache-Control": "public, max-age=3600" } });
      }
    } catch {
      /* try the next provider */
    }
  }
  return NextResponse.json({ error: "Exchange rates are unavailable right now" }, { status: 503 });
}
