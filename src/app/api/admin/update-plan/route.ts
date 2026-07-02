import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin-emails";

export async function POST(request: NextRequest) {
  const admin = createAdminClient();

  // Authenticate the caller by verifying their access token (JWT).
  // The token is validated by Supabase — unlike an email string, a client
  // cannot forge it, so this can't be bypassed by knowing an admin's email.
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const {
    data: { user },
    error: authError,
  } = await admin.auth.getUser(token);

  if (authError || !user?.email || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { targetUserId, newPlan } = await request.json();

  if (!targetUserId || !["core", "premium", "vip"].includes(newPlan)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { error } = await admin
    .from("profiles")
    .update({ plan: newPlan })
    .eq("id", targetUserId);

  if (error) {
    console.error("Admin plan update failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
