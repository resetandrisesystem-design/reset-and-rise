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
      const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const { data: plan } = await supabase
        .from("meal_plans")
        .select("*, meal_entries(*)")
        .eq("user_id", session.user.id)
        .eq("week_start", weekStart)
        .maybeSingle();
      setData({ userId: session.user.id, weekStart, plan });
    });
  }, []);

  if (!data) return <div className="text-navy-400 font-serif italic text-lg">Loading your meal planner...</div>;
  return <MealsClient userId={data.userId} weekStart={data.weekStart} initialPlan={data.plan} />;
}
