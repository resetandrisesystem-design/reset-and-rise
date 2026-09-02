export type Plan = "core" | "premium" | "vip";

export const PLAN_RANK: Record<Plan, number> = {
  core: 0,
  premium: 1,
  vip: 2,
};

export const PLAN_LABEL: Record<Plan, string> = {
  core: "Core",
  premium: "Premium",
  vip: "VIP",
};

/** Must match the Stripe Prices and the pricing page. Verified against live
 *  Stripe on 2 Sept 2026: all three are recurring monthly GBP. */
export const PLAN_PRICE: Record<Plan, string> = {
  core: "£4.99",
  premium: "£9.99",
  vip: "£14.99",
};

/** Returns true if a user on `userPlan` can access a page that requires `requiredPlan`. */
export function hasAccess(userPlan: Plan | null | undefined, requiredPlan: Plan): boolean {
  const u = userPlan ?? "core";
  return PLAN_RANK[u] >= PLAN_RANK[requiredPlan];
}
