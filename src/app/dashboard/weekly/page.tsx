"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import WeeklyPlannerClient from "@/components/planner/WeeklyPlannerClient";
import { format, startOfWeek } from "date-fns";

export default function WeeklyPlannerPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const { data: entry } = await supabase
        .from("weekly_entries")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("week_start", weekStart)
        .maybeSingle();
      setData({ userId: session.user.id, weekStart, entry });
    });
  }, []);

  if (!data) return <div className="text-navy-400 font-serif italic text-lg">Loading your weekly planner...</div>;
  return <WeeklyPlannerClient userId={data.userId} weekStart={data.weekStart} initialEntry={data.entry} />;
}
