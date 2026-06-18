"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import GoalsClient from "@/components/goals/GoalsClient";
import PlanGate from "@/components/plan-gate/PlanGate";

function getCurrentQuarter(): string {
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3) + 1;
  return `${now.getFullYear()}-Q${q}`;
}

export default function GoalsPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const quarter = getCurrentQuarter();
      const { data: entry } = await supabase
        .from("goals_entries")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("quarter", quarter)
        .maybeSingle();
      setData({ userId: session.user.id, quarter, initialEntry: entry });
    });
  }, []);

  return (
    <PlanGate requiredPlan="premium">
      {!data
        ? <div className="text-navy-400 font-serif italic text-lg">Loading your goals...</div>
        : <GoalsClient {...data} />
      }
    </PlanGate>
  );
}
