import { NextResponse, type NextRequest } from "next/server";

// Temporarily disabled - just pass through everything
export async function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*"],
};
