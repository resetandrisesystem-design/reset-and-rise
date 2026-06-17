"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import VipResetClient from "@/components/vip-reset/VipResetClient";
import { format } from "date-fns";

export default function VipResetPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const today = format(new Date(), "yyyy-MM-dd");
      const { data: entry } = await supabase
        .from("vip_reset_entries")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("entry_date", today)
        .maybeSingle();
      setData({ userId: session.user.id, today, initialEntry: entry });
    });
  }, []);

  if (!data) return <div className="text-navy-400 font-serif italic text-lg">Loading...</div>;
  return <VipResetClient {...data} />;
}
