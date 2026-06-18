"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import FamilyClient from "@/components/family/FamilyClient";
import PlanGate from "@/components/plan-gate/PlanGate";
import { format } from "date-fns";

export default function FamilyPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const today = format(new Date(), "yyyy-MM-dd");

      const [{ data: entry }, { data: history }] = await Promise.all([
        supabase.from("family_entries").select("*").eq("user_id", session.user.id).eq("entry_date", today).maybeSingle(),
        supabase.from("family_entries").select("*").eq("user_id", session.user.id).neq("entry_date", today).order("entry_date", { ascending: false }).limit(10),
      ]);

      setData({ userId: session.user.id, today, initialEntry: entry, history: history ?? [] });
    });
  }, []);

  return (
    <PlanGate requiredPlan="premium">
      {!data
        ? <div className="text-navy-400 font-serif italic text-lg">Loading...</div>
        : <FamilyClient {...data} />
      }
    </PlanGate>
  );
}
