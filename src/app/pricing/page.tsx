import Link from "next/link";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import CheckoutButton from "@/components/pricing/CheckoutButton";
import type { Plan } from "@/types/plan";

export const metadata = {
  title: "Pricing — Reset & Rise™",
  description:
    "One system for your day, your money, your meals, your mind. Choose your plan — lifetime access, one payment.",
};

interface Tier {
  plan: Plan;
  name: string;
  price: string;
  tagline: string;
  features: string[];
  featured?: boolean;
}

const TIERS: Tier[] = [
  {
    plan: "core",
    name: "Core",
    price: "£9.99",
    tagline: "Everything you need to reset your day.",
    features: [
      "Daily, Weekly & Monthly Planner",
      "Mind Reset Zone + Money Reset",
      "Meal Planner + AI Journal",
      "Parenting Lane + Calendar",
    ],
  },
  {
    plan: "premium",
    name: "Premium",
    price: "£19.99",
    tagline: "Go deeper across your whole life.",
    featured: true,
    features: [
      "Everything in Core",
      "Home & Life + Family Connection",
      "Goal Setting & Growth",
      "Self-Care Menu + Energy Log",
    ],
  },
  {
    plan: "vip",
    name: "VIP",
    price: "£34.99",
    tagline: "The complete system, nothing held back.",
    features: [
      "Everything in Premium",
      "Faith & Renewal Journal",
      "Weekly Reset + VIP Trackers",
      "Weekly & Monthly Progress Tools",
    ],
  },
];

export default async function PricingPage() {
  // Logged-in customers skip pricing and go straight to their dashboard.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-ivory-100 px-6 py-14 sm:py-20">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <p className="font-serif text-2xl text-gold-500 mb-1">Reset &amp; Rise&trade;</p>
          <p className="text-[11px] uppercase tracking-widest text-navy-400 mb-8">
            The Busy Woman&rsquo;s Planner System
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl text-navy-500 font-medium mb-4">
            Choose your plan
          </h1>
          <p className="text-navy-400 max-w-xl mx-auto leading-relaxed">
            One system for your day, your money, your meals and your mind. Pay once,
            keep it for life &mdash; including every future update.
          </p>
        </div>

        {/* Plans */}
        <div className="grid gap-6 md:grid-cols-3 items-start">
          {TIERS.map((tier) => (
            <div
              key={tier.plan}
              className={
                "relative rounded-2xl p-7 flex flex-col " +
                (tier.featured
                  ? "bg-navy-500 text-ivory-100 shadow-xl md:-mt-4 md:mb-4"
                  : "bg-white border border-ivory-300 shadow-sm")
              }
            >
              {tier.featured && (
                <span className="absolute top-5 right-5 text-[10px] uppercase tracking-wider bg-gold-400 text-navy-600 px-3 py-1 rounded-full font-semibold">
                  Most popular
                </span>
              )}

              <h2
                className={
                  "font-serif text-2xl font-medium mb-1 " +
                  (tier.featured ? "text-gold-300" : "text-navy-500")
                }
              >
                {tier.name}
              </h2>
              <p
                className={
                  "text-sm mb-5 " + (tier.featured ? "text-ivory-300" : "text-navy-400")
                }
              >
                {tier.tagline}
              </p>

              <div className="flex items-baseline gap-1 mb-1">
                <span className="font-serif text-4xl font-medium">{tier.price}</span>
              </div>
              <p
                className={
                  "text-xs uppercase tracking-wider mb-6 " +
                  (tier.featured ? "text-gold-300" : "text-gold-500")
                }
              >
                Lifetime access
              </p>

              <ul className="space-y-3 mb-8">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check
                      size={17}
                      className={
                        "mt-0.5 shrink-0 " +
                        (tier.featured ? "text-gold-300" : "text-gold-500")
                      }
                    />
                    <span className={tier.featured ? "text-ivory-100" : "text-navy-500"}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <CheckoutButton
                plan={tier.plan}
                name={tier.name}
                featured={tier.featured}
              />
            </div>
          ))}
        </div>

        {/* Reassurance */}
        <p className="text-center text-xs text-navy-400 mt-10">
          30-day money-back guarantee &middot; One-time payment &middot; Works on any device
        </p>
        <p className="text-center text-sm text-navy-500 mt-6">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-gold-600 font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
