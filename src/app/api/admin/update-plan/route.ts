import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin-emails";

export async function POST(request: NextRequest) {
  // 1. Confirm the caller is actually logged in and is an admin
  const serverSupabase = createServerClient();
  const { data: { user }, error: authError } = await serverSupabase.auth.getUser();
  console.log("DEBUG auth check - user:", user?.email, "error:", authError);

  if (!user?.email || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // 2. Perform the update using the admin (service role) client
  const { targetUserId, newPlan } = await request.json();

  if (!targetUserId || !["core", "premium", "vip"].includes(newPlan)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ plan: newPlan })
    .eq("id", targetUserId);

  if (error) {
    console.error("Admin plan update failed:", error);
    return NextResponse.json({ error: error.message || JSON.stringify(error) }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
