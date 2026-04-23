"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import MentalHealthClient from "@/components/mental/MentalHealthClient";
import { format } from "date-fns";

export default function MentalPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const today = format(new Date(), "yyyy-MM-dd");
      const sevenDaysAgo = format(new Date(Date.now() - 6 * 86400000), "yyyy-MM-dd");
      const [{ data: entry }, { data: history }] = await Promise.all([
        supabase.from("mood_entries").select("*").eq("user_id", session.user.id).eq("entry_date", today).maybeSingle(),
        supabase.from("mood_entries").select("entry_date, mood, stress_level").eq("user_id", session.user.id).gte("entry_date", sevenDaysAgo).order("entry_date"),
      ]);
      setData({ userId: session.user.id, today, entry, history: history ?? [] });
    });
  }, []);

  if (!data) return <div className="text-navy-400 font-serif italic text-lg">Loading your mind reset...</div>;
  return <MentalHealthClient userId={data.userId} today={data.today} initialEntry={data.entry} moodHistory={data.history} />;
}
