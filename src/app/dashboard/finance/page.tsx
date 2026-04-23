"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import FinanceClient from "@/components/finance/FinanceClient";
import { format } from "date-fns";

export default function FinancePage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const thisMonth = format(new Date(), "yyyy-MM");
      const [{ data: entry }, { data: history }] = await Promise.all([
        supabase.from("finance_entries").select("*").eq("user_id", session.user.id).eq("month", thisMonth).maybeSingle(),
        supabase.from("finance_entries").select("*").eq("user_id", session.user.id).order("month", { ascending: false }).limit(4),
      ]);
      setData({ userId: session.user.id, thisMonth, entry, history: history ?? [] });
    });
  }, []);

  if (!data) return <div className="text-navy-400 font-serif italic text-lg">Loading your money reset...</div>;
  return <FinanceClient userId={data.userId} thisMonth={data.thisMonth} initialEntry={data.entry} history={data.history} />;
}
