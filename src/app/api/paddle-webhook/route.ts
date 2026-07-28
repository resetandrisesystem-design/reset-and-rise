import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPaddleWebhook, priceIdToPlan } from "@/lib/paddle/paddle";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("paddle-signature");

  const isValid = await verifyPaddleWebhook(rawBody, signatureHeader);
  if (!isValid) {
    console.error("Paddle webhook: invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.event_type !== "transaction.completed") {
    return NextResponse.json({ received: true });
  }

  const transaction = event.data;
  const customerEmail: string | undefined =
    transaction?.customer?.email ||
    transaction?.details?.contact?.email;

  if (!customerEmail) {
    console.error("Paddle webhook: no customer email", transaction?.id);
    return NextResponse.json({ error: "No customer email" }, { status: 400 });
  }

  const priceId: string | undefined =
    transaction?.items?.[0]?.price?.id ||
    transaction?.items?.[0]?.price_id;

  const planFromCustomData = transaction?.custom_data?.plan as
    | "core" | "premium" | "vip" | undefined;

  const plan =
    planFromCustomData ??
    (priceId ? priceIdToPlan(priceId) : null) ??
    "core";

  const supabase = createAdminClient();

  try {
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === customerEmail.toLowerCase()
    );

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const { data: newUser, error: createError } =
        await supabase.auth.admin.createUser({
          email: customerEmail,
          email_confirm: true,
        });

      if (createError || !newUser?.user) {
        console.error("Paddle webhook: failed to create user", createError);
        return NextResponse.json(
          { error: "Failed to create account" },
          { status: 500 }
        );
      }

      userId = newUser.user.id;

      await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: customerEmail,
      });
    }

    await supabase
      .from("profiles")
      .upsert({ id: userId, plan }, { onConflict: "id" });

    console.log(`✅ Paddle webhook: ${customerEmail} → ${plan} (${userId})`);
    return NextResponse.json({ received: true, plan, userId });
  } catch (err) {
    console.error("Paddle webhook error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
