import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Plan } from "@/types/plan";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/** profiles.plan has a CHECK constraint, so only these three values may ever be written. */
const VALID_PLANS: Plan[] = ["core", "premium", "vip"];

function isPlan(value: unknown): value is Plan {
  return typeof value === "string" && VALID_PLANS.includes(value as Plan);
}

/** Falls back to the price ID when metadata is missing, e.g. for subscriptions
 *  created before the plan was stamped on them. */
function planFromPriceId(priceId: string | undefined): Plan | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_CORE) return "core";
  if (priceId === process.env.STRIPE_PRICE_PREMIUM) return "premium";
  if (priceId === process.env.STRIPE_PRICE_VIP) return "vip";
  return null;
}

/** Finds the existing auth user for an email, or creates one and sends the
 *  "set your password" invite. Returns the user id. */
async function findOrInviteUser(
  supabase: ReturnType<typeof createAdminClient>,
  email: string
): Promise<string | null> {
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existing = existingUsers?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );
  if (existing) return existing.id;

  // inviteUserByEmail creates the account AND delivers the email
  // (generateLink only builds a link without sending it).
  const { data: invited, error } = await supabase.auth.admin.inviteUserByEmail(email);
  if (error || !invited?.user) {
    console.error("Stripe webhook: failed to invite user", email, error);
    return null;
  }
  return invited.user.id;
}

async function setPlan(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  plan: Plan
) {
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: userId, plan }, { onConflict: "id" });
  if (error) console.error("Stripe webhook: failed to set plan", userId, plan, error);
  return !error;
}

/** Subscription events carry a customer id but no email, so resolve it via Stripe. */
async function emailForCustomer(customer: string | Stripe.Customer | Stripe.DeletedCustomer) {
  const id = typeof customer === "string" ? customer : customer.id;
  const record = await stripe.customers.retrieve(id);
  if (record.deleted) return null;
  return record.email ?? null;
}

export async function POST(request: NextRequest) {
  // The raw body is required for signature verification; request.json() would
  // reformat it and every signature check would fail.
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error("Stripe webhook: signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      // Purchase completed: provision the account and grant the plan.
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const email = session.customer_details?.email || session.customer_email;
        if (!email) {
          console.error("Stripe webhook: no email on session", session.id);
          return NextResponse.json({ error: "No customer email" }, { status: 400 });
        }

        const metadataPlan = session.metadata?.plan;
        const plan: Plan = isPlan(metadataPlan) ? metadataPlan : "core";

        const userId = await findOrInviteUser(supabase, email);
        if (!userId) {
          return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
        }

        await setPlan(supabase, userId, plan);
        console.log(`Stripe webhook: ${email} -> ${plan} (${userId})`);
        break;
      }

      // Plan changed (upgrade, downgrade, or reactivation): resync.
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const email = await emailForCustomer(subscription.customer);
        if (!email) break;

        const metadataPlan = subscription.metadata?.plan;
        const plan =
          (isPlan(metadataPlan) ? metadataPlan : null) ??
          planFromPriceId(subscription.items.data[0]?.price?.id);
        if (!plan) break;

        // A subscription that is no longer paying should not retain access.
        const active = ["active", "trialing", "past_due"].includes(subscription.status);
        const userId = await findOrInviteUser(supabase, email);
        if (userId) await setPlan(supabase, userId, active ? plan : "core");
        break;
      }

      // Subscription ended: drop to core rather than deleting anything, so the
      // customer keeps their data and regains access if they resubscribe.
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const email = await emailForCustomer(subscription.customer);
        if (!email) break;

        const userId = await findOrInviteUser(supabase, email);
        if (userId) {
          await setPlan(supabase, userId, "core");
          console.log(`Stripe webhook: ${email} lapsed -> core`);
        }
        break;
      }

      default:
        // Acknowledge anything else so Stripe stops retrying it.
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook error:", err);
    // A non-2xx tells Stripe to retry, which is what we want for transient faults.
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
