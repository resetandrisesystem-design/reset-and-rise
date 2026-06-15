"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import MealsClient from "@/components/meals/MealsClient";
import { format, startOfWeek } from "date-fns";

export default function MealsPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const uid       = session.user.id;
      const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const thisMonth = format(new Date(), "yyyy-MM");

      const [
        { data: plan },
        { data: finance },
      ] = await Promise.all([
        supabase.from("meal_plans").select("*, meal_entries(*)").eq("user_id", uid).eq("week_start", weekStart).maybeSingle(),
        supabase.from("finance_entries").select("income,exp_rent,exp_groceries,exp_children,exp_selfcare,exp_savings,exp_other").eq("user_id", uid).eq("month", thisMonth).maybeSingle(),
      ]);

      // Calculate total spent
      const totalSpent = finance
        ? (finance.exp_rent ?? 0) + (finance.exp_groceries ?? 0) + (finance.exp_children ?? 0) +
          (finance.exp_selfcare ?? 0) + (finance.exp_savings ?? 0) + (finance.exp_other ?? 0)
        : 0;

      setData({
        userId:        uid,
        weekStart,
        initialPlan:   plan,
        monthlyBudget: finance?.income ?? 0,
        totalSpent,
      });
    });
  }, []);

  if (!data) return <div className="text-navy-400 font-serif italic text-lg">Loading your meal planner...</div>;
  return <MealsClient {...data} />;
}
