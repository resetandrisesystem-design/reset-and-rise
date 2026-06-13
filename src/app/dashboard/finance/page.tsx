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

      const [
        { data: entry },
        { data: history },
        { data: settings },
      ] = await Promise.all([
        supabase.from("finance_entries").select("*").eq("user_id", session.user.id).eq("month", thisMonth).maybeSingle(),
        supabase.from("finance_entries").select("month,income,exp_rent,exp_groceries,exp_children,exp_selfcare,exp_savings,exp_other").eq("user_id", session.user.id).order("month", { ascending: false }).limit(5),
        supabase.from("user_finance_settings").select("*").eq("user_id", session.user.id).maybeSingle(),
      ]);

      // Parse saved categories
      let savedCats = null;
      if (settings?.categories) {
        try { savedCats = JSON.parse(settings.categories); } catch {}
      }

      setData({
        userId:      session.user.id,
        thisMonth,
        initialEntry: entry,
        history:     history ?? [],
        savedCats,
        checkinData: settings ? {
          last_checkin: settings.last_checkin,
          next_checkin: settings.next_checkin,
          frequency:    settings.frequency,
        } : null,
      });
    });
  }, []);

  if (!data) return <div className="text-navy-400 font-serif italic text-lg">Loading your money reset...</div>;
  return <FinanceClient {...data} />;
}
