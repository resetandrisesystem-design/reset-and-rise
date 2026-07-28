import { NextRequest, NextResponse } from "next/server";
import { createPaddleCheckout } from "@/lib/paddle/paddle";

const PRICE_MAP: Record<string, string | undefined> = {
  core:    process.env.PADDLE_PRICE_CORE,
  premium: process.env.PADDLE_PRICE_PREMIUM,
  vip:     process.env.PADDLE_PRICE_VIP,
};

export async function POST(request: NextRequest) {
  const { plan, email } = await request.json();

  if (!plan || !PRICE_MAP[plan]) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const priceId = PRICE_MAP[plan]!;
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://app.resetandrisesystem.com";

  try {
    const checkout = await createPaddleCheckout({
      priceId,
      customerEmail: email,
      successUrl: `${appUrl}/checkout-success`,
      plan,
    });

    return NextResponse.json({ url: checkout.url });
  } catch (err: any) {
    console.error("Paddle checkout error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout" },
      { status: 500 }
    );
  }
}
