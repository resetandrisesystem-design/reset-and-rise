"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { format, startOfWeek, addDays } from "date-fns";

const WEEK_REFLECTIONS = [
  "What felt good this week?",
  "What felt heavy or draining?",
  "What needs gentle attention next week?",
];

interface WeeklyEntry {
  id?: string;
  user_id?: string;
  week_start: string;
  weekly_focus: string | null;
  important_dates: string | null;
  todo_1: string | null;
  todo_2: string | null;
  todo_3: string | null;
  todo_4: string | null;
  todo_5: string | null;
  reflection_good: string | null;
  reflection_heavy: string | null;
  reflection_next: string | null;
}

interface Props {
  userId: string;
  weekStart: string;
  initialEntry: WeeklyEntry | null;
}

export default function WeeklyPlannerClient({ userId, weekStart, initialEntry }: Props) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    weekly_focus:     initialEntry?.weekly_focus ?? "",
    important_dates:  initialEntry?.important_dates ?? "",
    todo_1:           initialEntry?.todo_1 ?? "",
    todo_2:           initialEntry?.todo_2 ?? "",
    todo_3:           initialEntry?.todo_3 ?? "",
    todo_4:           initialEntry?.todo_4 ?? "",
    todo_5:           initialEntry?.todo_5 ?? "",
    reflection_good:  initialEntry?.reflection_good ?? "",
    reflection_heavy: initialEntry?.reflection_heavy ?? "",
    reflection_next:  initialEntry?.reflection_next ?? "",
  });

  const save = useCallback(async (data: typeof form) => {
    setSaving(true);
    await supabase.from("weekly_entries").upsert(
      { user_id: userId, week_start: weekStart, ...data },
      { onConflict: "user_id,week_start" }
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [supabase, userId, weekStart]);

  useEffect(() => {
    const timer = setTimeout(() => save(form), 1200);
    return () => clearTimeout(timer);
  }, [form, save]);

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // Build week day labels e.g. Mon 9 – Sun 15
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    format(addDays(new Date(weekStart), i), "EEE d")
  );
  const weekLabel = `${weekDays[0]} – ${weekDays[6]} ${format(new Date(weekStart), "MMM yyyy")}`;

  const todos = [
    { key: "todo_1" as const, label: "1" },
    { key: "todo_2" as const, label: "2" },
    { key: "todo_3" as const, label: "3" },
    { key: "todo_4" as const, label: "4" },
    { key: "todo_5" as const, label: "5" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-navy-400 text-sm uppercase tracking-widest mb-1">{weekLabel}</p>
          <h2 className="section-title mb-0">Weekly Planner</h2>
          <p className="text-navy-400 text-sm mt-1">See your week clearly and stay organised</p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full border transition-all ${
          saved   ? "bg-gold-50 border-gold-300 text-gold-600" :
          saving  ? "bg-ivory-200 border-ivory-300 text-navy-400" :
                    "bg-ivory-100 border-ivory-200 text-navy-300"
        }`}>
          {saved ? "✓ Saved" : saving ? "Saving…" : "Auto-save on"}
        </span>
      </div>

      {/* Affirmation */}
      <div className="flex gap-3 bg-white border-l-4 border-l-gold-400 rounded-r-2xl px-5 py-4 mb-6 shadow-sm">
        <span className="text-gold-400 text-lg">✦</span>
        <p className="font-serif text-navy-500 italic text-base leading-relaxed">
          &ldquo;Small steps done with softness still count. You&apos;re doing more than you think.&rdquo;
        </p>
      </div>

      {/* Weekly Focus */}
      <div className="card mb-5">
        <p className="label">Weekly focus — what matters most this week?</p>
        <textarea
          className="textarea min-h-[80px]"
          placeholder="My main intention for this week is..."
          value={form.weekly_focus}
          onChange={(e) => update("weekly_focus", e.target.value)}
        />
      </div>

      {/* Important Dates */}
      <div className="card card-gold mb-5">
        <p className="label">Important dates this week</p>
        <textarea
          className="textarea min-h-[70px]"
          placeholder="Appointments, deadlines, birthdays, events..."
          value={form.important_dates}
          onChange={(e) => update("important_dates", e.target.value)}
        />
      </div>

      {/* Week at a Glance */}
      <div className="card mb-5">
        <p className="label">Week at a glance</p>
        <div className="grid grid-cols-7 gap-1 mt-2">
          {weekDays.map((day) => (
            <div key={day} className="bg-ivory-100 rounded-xl p-2 text-center border border-ivory-200">
              <p className="text-xs text-navy-400 font-medium">{day.split(" ")[0]}</p>
              <p className="font-serif text-lg text-navy-500 font-medium">{day.split(" ")[1]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* This Week's To-Dos */}
      <div className="card mb-5">
        <div className="flex items-center justify-between mb-4">
          <p className="label mb-0">This week&apos;s to-do list</p>
          <span className="text-xs text-navy-300 italic">max 5</span>
        </div>
        <div className="space-y-3">
          {todos.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              <span className="font-serif text-2xl text-gold-400 font-medium w-6 flex-shrink-0">{label}</span>
              <input
                className="input"
                placeholder={`Task ${label}...`}
                value={form[key]}
                onChange={(e) => update(key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Reflection */}
      <div className="card">
        <p className="label">Weekly reflection</p>
        <p className="text-xs text-navy-400 italic mb-4">Take a moment to close your week gently.</p>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-navy-500 font-medium mb-2">✦ What felt good?</p>
            <textarea
              className="textarea min-h-[80px]"
              placeholder="Wins, moments of ease, things that flowed..."
              value={form.reflection_good}
              onChange={(e) => update("reflection_good", e.target.value)}
            />
          </div>

          <div>
            <p className="text-sm text-navy-500 font-medium mb-2">✦ What felt heavy?</p>
            <textarea
              className="textarea min-h-[80px]"
              placeholder="Challenges, drains, things that felt hard..."
              value={form.reflection_heavy}
              onChange={(e) => update("reflection_heavy", e.target.value)}
            />
          </div>

          <div className="bg-ivory-100 rounded-xl p-4 border border-ivory-200">
            <p className="text-sm text-navy-500 font-medium mb-2">✦ What needs gentle attention next week?</p>
            <textarea
              className="textarea bg-white min-h-[80px]"
              placeholder="One thing to carry forward with care..."
              value={form.reflection_next}
              onChange={(e) => update("reflection_next", e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
