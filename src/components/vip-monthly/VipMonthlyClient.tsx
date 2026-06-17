"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Target, Battery, BatteryLow, BatteryMedium, BatteryFull, ArrowRight } from "lucide-react";
import { format } from "date-fns";

const ENERGY_LEVELS = [
  { key: "low",    label: "Low",    icon: BatteryLow,    color: "text-red-400"   },
  { key: "medium", label: "Medium", icon: BatteryMedium, color: "text-gold-400"  },
  { key: "high",   label: "High",   icon: BatteryFull,   color: "text-green-500" },
] as const;

const TIME_CATEGORIES = ["Work", "Family", "Personal care", "Home", "Rest"];

interface VipMonthlyEntry {
  id?: string;
  user_id?: string;
  month: string;
  goal_1: string | null; goal_2: string | null; goal_3: string | null;
  habit_names: string | null; // JSON
  habit_days:  string | null; // JSON
  time_allocation: string | null; // JSON: string[]
  energy_overall: string | null;
  what_helped: string | null;
  what_slowed: string | null;
  continue_next: string | null;
  change_next:   string | null;
}

interface Props {
  userId:    string;
  thisMonth: string;
  initialEntry: VipMonthlyEntry | null;
}

export default function VipMonthlyClient({ userId, thisMonth, initialEntry }: Props) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const [goal1, setGoal1] = useState(initialEntry?.goal_1 ?? "");
  const [goal2, setGoal2] = useState(initialEntry?.goal_2 ?? "");
  const [goal3, setGoal3] = useState(initialEntry?.goal_3 ?? "");

  const [habitNames, setHabitNames] = useState<string[]>(() => {
    try {
      const p = JSON.parse(initialEntry?.habit_names ?? "[]");
      return p.length ? p : ["", "", ""];
    } catch { return ["", "", ""]; }
  });
  const [habitDays, setHabitDays] = useState<Record<string, number>>(() => {
    try { return JSON.parse(initialEntry?.habit_days ?? "{}"); } catch { return {}; }
  });

  const [timeAllocation, setTimeAllocation] = useState<string[]>(() => {
    try { return JSON.parse(initialEntry?.time_allocation ?? "[]"); } catch { return []; }
  });
  const [energyOverall, setEnergyOverall] = useState<string | null>(initialEntry?.energy_overall ?? null);
  const [whatHelped, setWhatHelped] = useState(initialEntry?.what_helped ?? "");
  const [whatSlowed, setWhatSlowed] = useState(initialEntry?.what_slowed ?? "");
  const [continueNext, setContinueNext] = useState(initialEntry?.continue_next ?? "");
  const [changeNext,   setChangeNext]   = useState(initialEntry?.change_next ?? "");

  const save = useCallback(async () => {
    setSaving(true);
    await supabase.from("vip_monthly_entries").upsert(
      {
        user_id: userId, month: thisMonth,
        goal_1: goal1, goal_2: goal2, goal_3: goal3,
        habit_names: JSON.stringify(habitNames),
        habit_days:  JSON.stringify(habitDays),
        time_allocation: JSON.stringify(timeAllocation),
        energy_overall: energyOverall,
        what_helped: whatHelped, what_slowed: whatSlowed,
        continue_next: continueNext, change_next: changeNext,
      },
      { onConflict: "user_id,month" }
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [supabase, userId, thisMonth, goal1, goal2, goal3, habitNames, habitDays, timeAllocation, energyOverall, whatHelped, whatSlowed, continueNext, changeNext]);

  useEffect(() => {
    const t = setTimeout(save, 1300);
    return () => clearTimeout(t);
  }, [save]);

  function toggleTimeCategory(cat: string) {
    setTimeAllocation((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]);
  }

  function updateHabitDays(i: number, days: number) {
    setHabitDays((prev) => ({ ...prev, [i]: days }));
  }

  const monthLabel = format(new Date(`${thisMonth}-01`), "MMMM yyyy");

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="section-title mb-0">Monthly Progress Tracker</h2>
            <span className="text-[10px] bg-navy-500 text-gold-400 px-2 py-0.5 rounded-full font-medium">VIP</span>
          </div>
          <p className="text-navy-400 text-sm mt-1">{monthLabel} — review and reset</p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full border transition-all ${
          saved   ? "bg-gold-50 border-gold-300 text-gold-600" :
          saving  ? "bg-ivory-200 border-ivory-300 text-navy-400" :
                    "bg-ivory-100 border-ivory-200 text-navy-300"
        }`}>
          {saved ? "✓ Saved" : saving ? "Saving…" : "Auto-save on"}
        </span>
      </div>

      {/* Top 3 Goals */}
      <div className="card card-gold mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Target size={16} className="text-gold-400" />
          <p className="label mb-0">Top 3 goals this month</p>
        </div>
        <div className="space-y-3">
          {[
            { val: goal1, set: setGoal1 },
            { val: goal2, set: setGoal2 },
            { val: goal3, set: setGoal3 },
          ].map(({ val, set }, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="font-serif text-2xl text-gold-400 font-medium w-6 flex-shrink-0">{i + 1}</span>
              <input className="input" placeholder={`Goal ${i + 1}...`} value={val} onChange={(e) => set(e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      {/* Habits */}
      <div className="card mb-5">
        <p className="label">Habits I&apos;m working on</p>
        <div className="space-y-2">
          {habitNames.map((name, i) => (
            <div key={i} className="grid grid-cols-[1fr_100px] gap-3 items-center">
              <input
                className="input text-sm"
                placeholder={`Habit ${i + 1}`}
                value={name}
                onChange={(e) => {
                  const n = [...habitNames]; n[i] = e.target.value; setHabitNames(n);
                }}
              />
              <input
                type="number"
                className="input text-sm text-center"
                placeholder="Days done"
                value={habitDays[i] || ""}
                onChange={(e) => updateHabitDays(i, Number(e.target.value))}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Time allocation */}
      <div className="card mb-5">
        <p className="label">Where did most of my time go this month?</p>
        <div className="flex flex-wrap gap-2 mt-2">
          {TIME_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => toggleTimeCategory(cat)}
              className={`text-sm px-4 py-2 rounded-full border transition-all ${
                timeAllocation.includes(cat)
                  ? "bg-navy-500 border-navy-500 text-white font-medium"
                  : "bg-ivory-100 border-ivory-200 text-navy-500 hover:border-navy-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Energy overall */}
      <div className="card mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Battery size={16} className="text-gold-400" />
          <p className="label mb-0">How was my energy overall?</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {ENERGY_LEVELS.map(({ key, label, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => setEnergyOverall(key)}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${
                energyOverall === key ? "border-gold-400 bg-gold-50" : "border-ivory-200 hover:border-gold-300"
              }`}
            >
              <Icon size={20} className={color} />
              <span className="text-xs text-navy-500 font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Monthly check-in */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="card">
          <p className="label">What helped me stay consistent?</p>
          <textarea className="textarea min-h-[80px]" placeholder="Habits, routines, support..." value={whatHelped} onChange={(e) => setWhatHelped(e.target.value)} />
        </div>
        <div className="card">
          <p className="label">What slowed me down?</p>
          <textarea className="textarea min-h-[80px]" placeholder="Obstacles, distractions, energy dips..." value={whatSlowed} onChange={(e) => setWhatSlowed(e.target.value)} />
        </div>
      </div>

      {/* Next Month Focus */}
      <div className="card card-gold">
        <div className="flex items-center gap-2 mb-3">
          <ArrowRight size={16} className="text-gold-400" />
          <p className="label mb-0">Next month focus</p>
        </div>
        <p className="text-xs text-navy-400 italic mb-4">A clean transition into the next month.</p>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-navy-500 font-medium mb-1.5 block">One thing I want to continue</label>
            <input className="input" placeholder="..." value={continueNext} onChange={(e) => setContinueNext(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-navy-500 font-medium mb-1.5 block">One thing I want to change or simplify</label>
            <input className="input" placeholder="..." value={changeNext} onChange={(e) => setChangeNext(e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  );
}
