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

export const PLAN_PRICE: Record<Plan, string> = {
  core: "£9.99",
  premium: "£19.99",
  vip: "£34.99",
};

/** Returns true if a user on `userPlan` can access a page that requires `requiredPlan`. */
export function hasAccess(userPlan: Plan | null | undefined, requiredPlan: Plan): boolean {
  const u = userPlan ?? "core";
  return PLAN_RANK[u] >= PLAN_RANK[requiredPlan];
}
