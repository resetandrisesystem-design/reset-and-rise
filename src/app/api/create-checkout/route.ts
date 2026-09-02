import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PRICE_MAP: Record<string, string | undefined> = {
  core: process.env.STRIPE_PRICE_CORE,
  premium: process.env.STRIPE_PRICE_PREMIUM,
  vip: process.env.STRIPE_PRICE_VIP,
};

export async function POST(request: NextRequest) {
  const { plan, email } = await request.json();
  const priceId = PRICE_MAP[plan];

  if (!plan || !priceId) {
    // Surfacing which plan failed makes a misconfigured price ID obvious in the
    // Vercel logs instead of showing up as a generic "checkout broken".
    console.error(`Checkout: no price configured for plan "${plan}"`);
    return NextResponse.json(
      { error: `No price configured for plan "${plan}"` },
      { status: 400 }
    );
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://app.resetandrisesystem.com";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email || undefined,
      success_url: `${appUrl}/checkout-success`,
      cancel_url: `${appUrl}/pricing`,
      metadata: { plan },
      // Renewal and cancellation events carry the subscription, not the original
      // session, so the plan has to be stamped on the subscription itself.
      subscription_data: { metadata: { plan } },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create checkout" },
      { status: 500 }
    );
  }
}
