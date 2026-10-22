import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** The visitor's country, from the header Vercel adds at its edge. Null when
 *  running locally or behind a proxy that strips it. Nothing is stored. */
export async function GET(request: NextRequest) {
  const raw = request.headers.get("x-vercel-ip-country") || "";
  const country = /^[A-Za-z]{2}$/.test(raw) ? raw.toUpperCase() : null;
  return NextResponse.json({ country }, { headers: { "Cache-Control": "private, no-store" } });
}
