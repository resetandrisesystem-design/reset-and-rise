import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin-emails";

export async function POST(request: NextRequest) {
  const { targetUserId, newPlan, callerEmail } = await request.json();

  // Verify the caller is an admin using the email they pass from the client
  // Then verify it's real by looking up that email in auth.users via admin client
  if (!callerEmail || !isAdminEmail(callerEmail)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  if (!targetUserId || !["core", "premium", "vip"].includes(newPlan)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Double-verify: confirm this email actually exists as a real user
  const { data: users } = await admin.auth.admin.listUsers();
  const callerExists = users?.users?.some(
    (u) => u.email?.toLowerCase() === callerEmail.toLowerCase()
  );

  if (!callerExists) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // Perform the update
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
