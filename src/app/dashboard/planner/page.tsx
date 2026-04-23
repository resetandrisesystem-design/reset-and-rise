"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import DailyPlannerClient from "@/components/planner/DailyPlannerClient";
import { format } from "date-fns";

export default function PlannerPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const today = format(new Date(), "yyyy-MM-dd");
      const [{ data: entry }, { data: habits }, { data: habitLogs }] = await Promise.all([
        supabase.from("daily_entries").select("*").eq("user_id", session.user.id).eq("entry_date", today).maybeSingle(),
        supabase.from("habits").select("*").eq("user_id", session.user.id).order("sort_order"),
        supabase.from("habit_logs").select("*").eq("user_id", session.user.id).eq("log_date", today),
      ]);
      setData({ userId: session.user.id, today, entry, habits: habits ?? [], habitLogs: habitLogs ?? [] });
    });
  }, []);

  if (!data) return <div className="text-navy-400 font-serif italic text-lg">Loading your planner...</div>;
  return <DailyPlannerClient userId={data.userId} today={data.today} initialEntry={data.entry} initialHabits={data.habits} initialHabitLogs={data.habitLogs} />;
}
