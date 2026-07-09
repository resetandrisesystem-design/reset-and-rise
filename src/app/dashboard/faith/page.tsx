"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import FaithClient from "@/components/faith/FaithClient";
import PlanGate from "@/components/plan-gate/PlanGate";
import { format } from "date-fns";

export default function FaithPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const today = format(new Date(), "yyyy-MM-dd");
      const { data: entry } = await supabase
        .from("faith_entries")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("entry_date", today)
        .maybeSingle();
      setData({ userId: session.user.id, today, initialEntry: entry });
    });
  }, []);

  return (
    <PlanGate requiredPlan="vip">
      {!data
        ? <div className="text-navy-400 font-serif italic text-lg">Loading your faith journal...</div>
        : <FaithClient {...data} />
      }
    </PlanGate>
  );
}
