"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import JournalClient from "@/components/journal/JournalClient";
import { format } from "date-fns";

export default function JournalPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const today = format(new Date(), "yyyy-MM-dd");
      const [{ data: entry }, { data: past }] = await Promise.all([
        supabase.from("journal_entries").select("*").eq("user_id", session.user.id).eq("entry_date", today).maybeSingle(),
        supabase.from("journal_entries").select("entry_date, prompt_used, journal_text").eq("user_id", session.user.id).lt("entry_date", today).order("entry_date", { ascending: false }).limit(5),
      ]);
      setData({ userId: session.user.id, today, entry, past: past ?? [] });
    });
  }, []);

  if (!data) return <div className="text-navy-400 font-serif italic text-lg">Loading your journal...</div>;
  return <JournalClient userId={data.userId} today={data.today} initialEntry={data.entry} pastEntries={data.past} />;
}
