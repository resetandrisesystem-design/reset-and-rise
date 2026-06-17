"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import HomeLifeClient from "@/components/homelife/HomeLifeClient";
import { format, startOfWeek } from "date-fns";

export default function HomeLifePage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const { data: entry } = await supabase
        .from("home_life_entries")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("week_start", weekStart)
        .maybeSingle();
      setData({ userId: session.user.id, weekStart, initialEntry: entry });
    });
  }, []);

  if (!data) return <div className="text-navy-400 font-serif italic text-lg">Loading your home reset...</div>;
  return <HomeLifeClient {...data} />;
}
