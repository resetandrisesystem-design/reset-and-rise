"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import MonthlyPlannerClient from "@/components/planner/MonthlyPlannerClient";
import { format } from "date-fns";

export default function MonthlyPlannerPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const thisMonth = format(new Date(), "yyyy-MM");
      const { data: entry } = await supabase
        .from("monthly_entries")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("month", thisMonth)
        .maybeSingle();
      setData({ userId: session.user.id, thisMonth, entry });
    });
  }, []);

  if (!data) return <div className="text-navy-400 font-serif italic text-lg">Loading your monthly planner...</div>;
  return <MonthlyPlannerClient userId={data.userId} thisMonth={data.thisMonth} initialEntry={data.entry} />;
}
