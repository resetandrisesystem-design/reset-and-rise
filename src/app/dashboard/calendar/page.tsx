"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import CalendarClient from "@/components/calendar/CalendarClient";
import { format, subMonths } from "date-fns";

export default function CalendarPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const uid = session.user.id;

      // Fetch last 3 months of data
      const threeMonthsAgo = format(subMonths(new Date(), 3), "yyyy-MM-dd");

      const [
        { data: journals },
        { data: planners },
        { data: moods },
        { data: finances },
      ] = await Promise.all([
        supabase.from("journal_entries")
          .select("entry_date, journal_text, prompt_used")
          .eq("user_id", uid)
          .gte("entry_date", threeMonthsAgo)
          .order("entry_date"),
        supabase.from("daily_entries")
          .select("entry_date, priority_1, priority_2, priority_3")
          .eq("user_id", uid)
          .gte("entry_date", threeMonthsAgo)
          .order("entry_date"),
        supabase.from("mood_entries")
          .select("entry_date, mood, reflection")
          .eq("user_id", uid)
          .gte("entry_date", threeMonthsAgo)
          .order("entry_date"),
        supabase.from("finance_entries")
          .select("month")
          .eq("user_id", uid),
      ]);

      // Build a unified map by date
      const dateMap = new Map<string, any>();

      (journals ?? []).forEach((j) => {
        const d = dateMap.get(j.entry_date) ?? { date: j.entry_date };
        d.hasJournal  = true;
        d.journalText = j.journal_text;
        d.promptUsed  = j.prompt_used;
        dateMap.set(j.entry_date, d);
      });

      (planners ?? []).forEach((p) => {
        const d = dateMap.get(p.entry_date) ?? { date: p.entry_date };
        d.hasPlanner  = true;
        d.priorities  = [p.priority_1, p.priority_2, p.priority_3].filter(Boolean);
        dateMap.set(p.entry_date, d);
      });

      (moods ?? []).forEach((m) => {
        const d = dateMap.get(m.entry_date) ?? { date: m.entry_date };
        d.hasMood    = true;
        d.mood       = m.mood;
        d.reflection = m.reflection;
        dateMap.set(m.entry_date, d);
      });

      // Finance is monthly — mark first day of each month
      (finances ?? []).forEach((f) => {
        const date = `${f.month}-01`;
        const d = dateMap.get(date) ?? { date };
        d.hasFinance = true;
        dateMap.set(date, d);
      });

      const entries = Array.from(dateMap.values()).map((e) => ({
        date:        e.date,
        hasJournal:  e.hasJournal  ?? false,
        hasPlanner:  e.hasPlanner  ?? false,
        hasMood:     e.hasMood     ?? false,
        hasFinance:  e.hasFinance  ?? false,
        journalText: e.journalText ?? null,
        promptUsed:  e.promptUsed  ?? null,
        mood:        e.mood        ?? null,
        priorities:  e.priorities  ?? [],
        reflection:  e.reflection  ?? null,
      }));

      setData({ userId: uid, entries });
    });
  }, []);

  if (!data) return <div className="text-navy-400 font-serif italic text-lg">Loading your calendar...</div>;
  return <CalendarClient userId={data.userId} entries={data.entries} />;
}
