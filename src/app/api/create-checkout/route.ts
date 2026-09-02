import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

/** Built per request, not at module load. `next build` collects page data for
 *  route handlers, which runs module-level code, so constructing Stripe here
 *  would make the build fail in any environment without the secret. */
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}

function priceFor(plan: string): string | undefined {
  return {
    core: process.env.STRIPE_PRICE_CORE,
    premium: process.env.STRIPE_PRICE_PREMIUM,
    vip: process.env.STRIPE_PRICE_VIP,
  }[plan];
}

export async function POST(request: NextRequest) {
  const { plan, email } = await request.json();
  const priceId = priceFor(plan);

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
    const session = await getStripe().checkout.sessions.create({
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
