"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Battery, BatteryLow, BatteryMedium, BatteryFull, Droplet, Footprints, Moon } from "lucide-react";
import { format } from "date-fns";

const MOOD_OPTIONS = [
  { key: "calm",     label: "Calm"     },
  { key: "okay",     label: "Okay"     },
  { key: "stressed", label: "Stressed" },
  { key: "low",      label: "Low / Depressed" },
] as const;

const ENERGY_LEVELS = [
  { key: "low",    label: "Low",    icon: BatteryLow,    color: "text-red-400"   },
  { key: "medium", label: "Medium", icon: BatteryMedium, color: "text-gold-400"  },
  { key: "high",   label: "High",   icon: BatteryFull,   color: "text-green-500" },
] as const;

const MOOD_BOOST_ACTIVITIES = [
  "Take 5 slow, deep breaths",
  "Drink a glass of water",
  "Step outside for fresh air",
  "Stretch for 2–5 minutes",
  "Write one thing I'm grateful for",
  "Tidy one small space",
  "Listen to calming music",
  "Take a short break from screens",
  "Talk to someone I trust",
  "Do one easy task and stop",
];

const WATER_LEVELS = [
  { key: "low",    label: "3–4 cups" },
  { key: "medium", label: "5–6 cups" },
  { key: "high",   label: "7+ cups"  },
];

const MOVEMENT_OPTIONS = [
  { key: "movement", label: "Movement" },
  { key: "rest",      label: "Rest"     },
  { key: "both",      label: "Both"     },
];

interface VipDailyEntry {
  id?: string;
  user_id?: string;
  entry_date: string;
  todays_focus:    string | null;
  task_1: string | null; task_2: string | null; task_3: string | null;
  task_4: string | null; task_5: string | null;
  energy_level:    string | null;
  mood_check:      string | null;
  mood_boost_checked: string | null; // JSON
  water_intake:    string | null;
  movement_rest:   string | null;
  completed_today: string | null;
  can_wait:        string | null;
}

interface Props {
  userId: string;
  today:  string;
  initialEntry: VipDailyEntry | null;
}

export default function VipDailyClient({ userId, today, initialEntry }: Props) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const [todaysFocus, setTodaysFocus] = useState(initialEntry?.todays_focus ?? "");
  const [tasks, setTasks] = useState<string[]>([
    initialEntry?.task_1 ?? "", initialEntry?.task_2 ?? "", initialEntry?.task_3 ?? "",
    initialEntry?.task_4 ?? "", initialEntry?.task_5 ?? "",
  ]);
  const [energyLevel, setEnergyLevel] = useState<string | null>(initialEntry?.energy_level ?? null);
  const [moodCheck,   setMoodCheck]   = useState<string | null>(initialEntry?.mood_check ?? null);
  const [waterIntake, setWaterIntake] = useState<string | null>(initialEntry?.water_intake ?? null);
  const [movementRest, setMovementRest] = useState<string | null>(initialEntry?.movement_rest ?? null);
  const [completedToday, setCompletedToday] = useState(initialEntry?.completed_today ?? "");
  const [canWait, setCanWait] = useState(initialEntry?.can_wait ?? "");

  const [moodBoostChecked, setMoodBoostChecked] = useState<string[]>(() => {
    try { return JSON.parse(initialEntry?.mood_boost_checked ?? "[]"); } catch { return []; }
  });

  const save = useCallback(async () => {
    setSaving(true);
    await supabase.from("vip_daily_entries").upsert(
      {
        user_id: userId, entry_date: today,
        todays_focus: todaysFocus,
        task_1: tasks[0], task_2: tasks[1], task_3: tasks[2], task_4: tasks[3], task_5: tasks[4],
        energy_level: energyLevel, mood_check: moodCheck,
        mood_boost_checked: JSON.stringify(moodBoostChecked),
        water_intake: waterIntake, movement_rest: movementRest,
        completed_today: completedToday, can_wait: canWait,
      },
      { onConflict: "user_id,entry_date" }
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [supabase, userId, today, todaysFocus, tasks, energyLevel, moodCheck, moodBoostChecked, waterIntake, movementRest, completedToday, canWait]);

  useEffect(() => {
    const t = setTimeout(save, 1300);
    return () => clearTimeout(t);
  }, [save]);

  function updateTask(i: number, value: string) {
    setTasks((prev) => { const n = [...prev]; n[i] = value; return n; });
  }

  function toggleMoodBoost(activity: string) {
    setMoodBoostChecked((prev) =>
      prev.includes(activity) ? prev.filter((a) => a !== activity) : [...prev, activity]
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="section-title mb-0">Daily Activity Tracker</h2>
            <span className="text-[10px] bg-navy-500 text-gold-400 px-2 py-0.5 rounded-full font-medium">VIP</span>
          </div>
          <p className="text-navy-400 text-sm mt-1">Stay focused and grounded each day</p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full border transition-all ${
          saved   ? "bg-gold-50 border-gold-300 text-gold-600" :
          saving  ? "bg-ivory-200 border-ivory-300 text-navy-400" :
                    "bg-ivory-100 border-ivory-200 text-navy-300"
        }`}>
          {saved ? "✓ Saved" : saving ? "Saving…" : "Auto-save on"}
        </span>
      </div>

      {/* Today's Focus */}
      <div className="card card-gold mb-5">
        <p className="label">Today&apos;s focus</p>
        <p className="text-xs text-navy-400 italic mb-3">What matters most today?</p>
        <input
          className="input"
          placeholder="The one thing that, if done, makes today a success..."
          value={todaysFocus}
          onChange={(e) => setTodaysFocus(e.target.value)}
        />
      </div>

      {/* Tasks for Today */}
      <div className="card mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="label mb-0">Tasks for today</p>
          <span className="text-xs text-navy-300 italic">max 5</span>
        </div>
        <div className="space-y-3">
          {tasks.map((task, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="font-serif text-2xl text-gold-400 font-medium w-6 flex-shrink-0">{i + 1}</span>
              <input
                className="input"
                placeholder={`Task ${i + 1}...`}
                value={task}
                onChange={(e) => updateTask(i, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Energy + Mood */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        {/* Energy */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Battery size={16} className="text-gold-400" />
            <p className="label mb-0">Energy level</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {ENERGY_LEVELS.map(({ key, label, icon: Icon, color }) => (
              <button
                key={key}
                onClick={() => setEnergyLevel(key)}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-all ${
                  energyLevel === key ? "border-gold-400 bg-gold-50" : "border-ivory-200 hover:border-gold-300"
                }`}
              >
                <Icon size={18} className={color} />
                <span className="text-[10px] text-navy-500 font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mood */}
        <div className="card">
          <p className="label">Mood check</p>
          <div className="space-y-1.5">
            {MOOD_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setMoodCheck(key)}
                className={`w-full text-left text-xs py-2 px-3 rounded-lg border transition-all ${
                  moodCheck === key
                    ? "border-gold-400 bg-gold-50 text-navy-500 font-medium"
                    : "border-ivory-200 text-navy-400 hover:border-gold-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mood Boost Activities */}
      <div className="card card-gold mb-5">
        <p className="label">Mood boost activities</p>
        <p className="text-xs text-navy-400 italic mb-3">Check what helps today.</p>
        <div className="grid grid-cols-2 gap-2">
          {MOOD_BOOST_ACTIVITIES.map((activity) => {
            const checked = moodBoostChecked.includes(activity);
            return (
              <button
                key={activity}
                onClick={() => toggleMoodBoost(activity)}
                className={`flex items-center gap-2 text-left text-xs py-2.5 px-3 rounded-xl border transition-all ${
                  checked
                    ? "border-gold-400 bg-white text-navy-500"
                    : "border-ivory-200 bg-white/50 text-navy-400 hover:border-gold-300"
                }`}
              >
                <span className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                  checked ? "bg-gold-400 border-gold-400" : "border-navy-300"
                }`}>
                  {checked && <span className="text-white text-[8px]">✓</span>}
                </span>
                {activity}
              </button>
            );
          })}
        </div>
      </div>

      {/* Water + Movement */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Droplet size={16} className="text-blue-400" />
            <p className="label mb-0">Water intake</p>
          </div>
          <div className="space-y-1.5">
            {WATER_LEVELS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setWaterIntake(key)}
                className={`w-full text-left text-xs py-2 px-3 rounded-lg border transition-all ${
                  waterIntake === key
                    ? "border-blue-400 bg-blue-50 text-navy-500 font-medium"
                    : "border-ivory-200 text-navy-400 hover:border-blue-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Footprints size={16} className="text-green-500" />
            <p className="label mb-0">Movement or rest</p>
          </div>
          <div className="space-y-1.5">
            {MOVEMENT_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setMovementRest(key)}
                className={`w-full text-left text-xs py-2 px-3 rounded-lg border transition-all ${
                  movementRest === key
                    ? "border-green-400 bg-green-50 text-navy-500 font-medium"
                    : "border-ivory-200 text-navy-400 hover:border-green-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* End of Day Check */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Moon size={16} className="text-navy-400" />
          <p className="label mb-0">End-of-day check</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-navy-500 font-medium mb-1.5 block">What did I complete?</label>
            <textarea
              className="textarea min-h-[70px]"
              placeholder="Celebrate what got done today..."
              value={completedToday}
              onChange={(e) => setCompletedToday(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-navy-500 font-medium mb-1.5 block">What can wait?</label>
            <textarea
              className="textarea min-h-[70px]"
              placeholder="Give yourself permission to release the rest..."
              value={canWait}
              onChange={(e) => setCanWait(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
