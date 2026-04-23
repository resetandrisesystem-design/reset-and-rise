"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import type { DailyEntry, Habit, HabitLog } from "@/types";
import { CheckCircle2, Circle } from "lucide-react";

const AFFIRMATIONS = [
  "You don't need to do everything. You just need to do the next right thing.",
  "You are not falling apart. You are falling into place.",
  "Rest is productive. Peace is powerful. You are enough.",
  "Your calm is contagious. Lead yourself first.",
  "Even on the hardest days, you are still rising.",
];

interface Props {
  userId: string;
  today: string;
  initialEntry: DailyEntry | null;
  initialHabits: Habit[];
  initialHabitLogs: HabitLog[];
}

export default function DailyPlannerClient({ userId, today, initialEntry, initialHabits, initialHabitLogs }: Props) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    priority_1: initialEntry?.priority_1 ?? "",
    priority_2: initialEntry?.priority_2 ?? "",
    priority_3: initialEntry?.priority_3 ?? "",
    block_morning: initialEntry?.block_morning ?? "",
    block_afternoon: initialEntry?.block_afternoon ?? "",
    block_evening: initialEntry?.block_evening ?? "",
  });

  const [habitLogs, setHabitLogs] = useState<Record<string, boolean>>(
    Object.fromEntries(initialHabitLogs.map((l) => [l.habit_id, l.completed]))
  );

  const affirmation = AFFIRMATIONS[new Date().getDay() % AFFIRMATIONS.length];

  const save = useCallback(async (data: typeof form) => {
    setSaving(true);
    await supabase.from("daily_entries").upsert(
      { user_id: userId, entry_date: today, ...data },
      { onConflict: "user_id,entry_date" }
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [supabase, userId, today]);

  // Debounced auto-save
  useEffect(() => {
    const timer = setTimeout(() => save(form), 1200);
    return () => clearTimeout(timer);
  }, [form, save]);

  function updateForm(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function toggleHabit(habitId: string) {
    const newVal = !habitLogs[habitId];
    setHabitLogs((prev) => ({ ...prev, [habitId]: newVal }));
    await supabase.from("habit_logs").upsert(
      { habit_id: habitId, user_id: userId, log_date: today, completed: newVal },
      { onConflict: "habit_id,log_date" }
    );
  }

  const doneCount = Object.values(habitLogs).filter(Boolean).length;

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-navy-400 text-sm uppercase tracking-widest mb-1">
            {format(new Date(), "EEEE, d MMMM")}
          </p>
          <h2 className="section-title mb-0">Daily Planner</h2>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full border transition-all ${saved ? "bg-gold-50 border-gold-300 text-gold-600" : saving ? "bg-ivory-200 border-ivory-300 text-navy-400" : "bg-ivory-100 border-ivory-200 text-navy-300"}`}>
          {saved ? "✓ Saved" : saving ? "Saving…" : "Auto-save on"}
        </span>
      </div>

      {/* Affirmation */}
      <div className="flex gap-3 bg-white border-l-4 border-l-gold-400 rounded-r-2xl px-5 py-4 mb-6 shadow-sm">
        <span className="text-gold-400 text-lg">✦</span>
        <p className="font-serif text-navy-500 italic text-base leading-relaxed">&ldquo;{affirmation}&rdquo;</p>
      </div>

      {/* Top 3 priorities */}
      <div className="card mb-5">
        <p className="label">Top 3 priorities today</p>
        <div className="grid grid-cols-3 gap-3">
          {([1, 2, 3] as const).map((n) => (
            <div key={n} className="bg-ivory-100 rounded-xl p-4 border border-ivory-200">
              <span className="font-serif text-3xl text-gold-400 font-medium block leading-none mb-2">{n}</span>
              <textarea
                className="textarea bg-transparent border-0 p-0 focus:ring-0 text-sm min-h-[60px]"
                placeholder="What matters most..."
                value={form[`priority_${n}` as keyof typeof form]}
                onChange={(e) => updateForm(`priority_${n}` as keyof typeof form, e.target.value)}
                rows={3}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Time blocks */}
      <div className="card mb-5">
        <p className="label">Time blocks</p>
        <div className="space-y-3">
          {(["morning", "afternoon", "evening"] as const).map((block) => (
            <div key={block} className="grid grid-cols-[90px_1fr] overflow-hidden rounded-xl border border-ivory-200">
              <div className="bg-navy-500 text-gold-400 text-xs font-medium uppercase tracking-widest flex items-center justify-center">
                {block}
              </div>
              <textarea
                className="textarea rounded-none border-0 focus:ring-0 min-h-[52px] py-3"
                placeholder={block === "morning" ? "6am – 12pm focus..." : block === "afternoon" ? "12pm – 5pm..." : "5pm onwards..."}
                value={form[`block_${block}` as keyof typeof form]}
                onChange={(e) => updateForm(`block_${block}` as keyof typeof form, e.target.value)}
                rows={2}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Habit tracker */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <p className="label mb-0">Habit tracker</p>
          <span className="text-xs text-navy-400">{doneCount} / {initialHabits.length} done today</span>
        </div>
        <div className="space-y-3">
          {initialHabits.map((habit) => (
            <div key={habit.id} className="flex items-center gap-3">
              <button
                onClick={() => toggleHabit(habit.id)}
                className="flex-shrink-0 text-gold-400 hover:text-gold-500 transition-colors"
              >
                {habitLogs[habit.id]
                  ? <CheckCircle2 size={22} className="text-gold-400" />
                  : <Circle size={22} className="text-ivory-400" />
                }
              </button>
              <span className={`text-sm ${habitLogs[habit.id] ? "line-through text-navy-300" : "text-navy-500"}`}>
                {habit.icon} {habit.name}
              </span>
            </div>
          ))}
        </div>
        {doneCount === initialHabits.length && initialHabits.length > 0 && (
          <div className="mt-4 bg-gold-50 border border-gold-200 rounded-xl px-4 py-3 text-center">
            <p className="font-serif text-gold-600 italic text-sm">
              &ldquo;All habits complete — you are rising today. ✦&rdquo;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
