"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";

const MOODS = [
  { key: "low",     emoji: "😔", label: "Low"    },
  { key: "okay",    emoji: "😐", label: "Okay"   },
  { key: "good",    emoji: "🙂", label: "Good"   },
  { key: "calm",    emoji: "😊", label: "Calm"   },
  { key: "rising",  emoji: "🌟", label: "Rising" },
] as const;

type MoodKey = typeof MOODS[number]["key"];

const HABIT_SLOTS = 4;
const WEEKS = ["Week 1", "Week 2", "Week 3", "Week 4"];

interface MonthlyEntry {
  id?: string;
  user_id?: string;
  month: string;
  monthly_overview:  string | null;
  goal_1:            string | null;
  goal_2:            string | null;
  goal_3:            string | null;
  budget_notes:      string | null;
  monthly_mood_log:  string | null; // JSON: { week: string, mood: MoodKey | null }[]
  habit_names:       string | null; // JSON: string[]
  habit_completions: string | null; // JSON: { habit: string, days: number }[]
}

interface Props {
  userId: string;
  thisMonth: string; // "yyyy-MM"
  initialEntry: MonthlyEntry | null;
}

export default function MonthlyPlannerClient({ userId, thisMonth, initialEntry }: Props) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  // Parse stored JSON or defaults
  const parseMoodLog = (): Record<string, MoodKey | null> => {
    try {
      const parsed = JSON.parse(initialEntry?.monthly_mood_log ?? "{}");
      return parsed;
    } catch { return {}; }
  };

  const parseHabitNames = (): string[] => {
    try {
      const parsed = JSON.parse(initialEntry?.habit_names ?? "[]");
      return parsed.length ? parsed : Array(HABIT_SLOTS).fill("");
    } catch { return Array(HABIT_SLOTS).fill(""); }
  };

  const parseHabitDays = (): Record<string, number> => {
    try {
      const parsed = JSON.parse(initialEntry?.habit_completions ?? "{}");
      return parsed;
    } catch { return {}; }
  };

  const [form, setForm] = useState({
    monthly_overview: initialEntry?.monthly_overview ?? "",
    goal_1:           initialEntry?.goal_1 ?? "",
    goal_2:           initialEntry?.goal_2 ?? "",
    goal_3:           initialEntry?.goal_3 ?? "",
    budget_notes:     initialEntry?.budget_notes ?? "",
  });

  const [moodLog,    setMoodLog]    = useState<Record<string, MoodKey | null>>(parseMoodLog);
  const [habitNames, setHabitNames] = useState<string[]>(parseHabitNames);
  const [habitDays,  setHabitDays]  = useState<Record<string, number>>(parseHabitDays);

  const save = useCallback(async () => {
    setSaving(true);
    await supabase.from("monthly_entries").upsert(
      {
        user_id: userId,
        month:   thisMonth,
        ...form,
        monthly_mood_log:  JSON.stringify(moodLog),
        habit_names:       JSON.stringify(habitNames),
        habit_completions: JSON.stringify(habitDays),
      },
      { onConflict: "user_id,month" }
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [supabase, userId, thisMonth, form, moodLog, habitNames, habitDays]);

  useEffect(() => {
    const t = setTimeout(save, 1300);
    return () => clearTimeout(t);
  }, [save]);

  function updateForm(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const monthLabel = format(new Date(`${thisMonth}-01`), "MMMM yyyy");

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-navy-400 text-sm uppercase tracking-widest mb-1">{monthLabel}</p>
          <h2 className="section-title mb-0">Monthly Planner</h2>
          <p className="text-navy-400 text-sm mt-1">Review, reset and set your intentions for the month</p>
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
          &ldquo;Your home, your mind, your work — everything can be reset gently. You are allowed to slow down.&rdquo;
        </p>
      </div>

      {/* Monthly Overview */}
      <div className="card mb-5">
        <p className="label">Monthly overview</p>
        <p className="text-xs text-navy-400 italic mb-3">How does this month look? What&apos;s happening?</p>
        <textarea
          className="textarea min-h-[90px]"
          placeholder="This month I'm focusing on... Key events, themes, intentions..."
          value={form.monthly_overview}
          onChange={(e) => updateForm("monthly_overview", e.target.value)}
        />
      </div>

      {/* Top 3 Monthly Goals */}
      <div className="card mb-5">
        <p className="label">Top 3 goals this month</p>
        <div className="space-y-3">
          {([1, 2, 3] as const).map((n) => (
            <div key={n} className="flex items-center gap-3">
              <span className="font-serif text-3xl text-gold-400 font-medium w-8 flex-shrink-0">{n}</span>
              <input
                className="input"
                placeholder={`Goal ${n}...`}
                value={form[`goal_${n}` as keyof typeof form]}
                onChange={(e) => updateForm(`goal_${n}` as keyof typeof form, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Habit Tracker */}
      <div className="card mb-5">
        <p className="label">Habit tracker</p>
        <p className="text-xs text-navy-400 italic mb-4">Track your habits across the month&apos;s weeks.</p>
        <div className="space-y-3">
          {habitNames.map((name, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto] gap-3 items-center">
              <input
                className="input text-sm"
                placeholder={`Habit ${i + 1} (e.g. Morning walk)`}
                value={name}
                onChange={(e) => {
                  const updated = [...habitNames];
                  updated[i] = e.target.value;
                  setHabitNames(updated);
                }}
              />
              <div className="flex items-center gap-1">
                {WEEKS.map((w) => {
                  const key = `${i}-${w}`;
                  const done = habitDays[key] ?? false;
                  return (
                    <button
                      key={w}
                      onClick={() => setHabitDays((prev) => ({ ...prev, [key]: done ? 0 : 1 }))}
                      className={`w-8 h-8 rounded-lg text-xs font-medium border transition-all ${
                        done
                          ? "bg-gold-400 border-gold-400 text-white"
                          : "bg-ivory-100 border-ivory-200 text-navy-400 hover:border-gold-300"
                      }`}
                      title={w}
                    >
                      {w.replace("Week ", "W")}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-navy-300 mt-3 italic">Click W1–W4 to mark each week as done</p>
      </div>

      {/* Monthly Mood Log */}
      <div className="card card-gold mb-5">
        <p className="label">Monthly mood log</p>
        <p className="text-xs text-navy-400 italic mb-4">How did each week of this month feel overall?</p>
        <div className="grid grid-cols-4 gap-3">
          {WEEKS.map((week) => (
            <div key={week} className="text-center">
              <p className="text-xs text-navy-400 mb-2 font-medium">{week}</p>
              <div className="space-y-1">
                {MOODS.map(({ key, emoji, label }) => (
                  <button
                    key={key}
                    onClick={() => setMoodLog((prev) => ({
                      ...prev,
                      [week]: prev[week] === key ? null : key
                    }))}
                    className={`w-full text-xs py-1 px-2 rounded-lg border transition-all flex items-center gap-1.5 ${
                      moodLog[week] === key
                        ? "border-gold-400 bg-gold-50 text-navy-500 font-medium"
                        : "border-ivory-200 bg-ivory-50 text-navy-400 hover:border-gold-300"
                    }`}
                  >
                    <span>{emoji}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Budget Notes */}
      <div className="card">
        <p className="label">Budget notes</p>
        <p className="text-xs text-navy-400 italic mb-3">A soft overview of this month&apos;s money.</p>
        <textarea
          className="textarea min-h-[80px]"
          placeholder="Key expenses, savings progress, money intentions for the month..."
          value={form.budget_notes}
          onChange={(e) => updateForm("budget_notes", e.target.value)}
        />
      </div>
    </div>
  );
}
