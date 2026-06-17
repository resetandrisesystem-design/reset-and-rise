"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Briefcase, Home, User, Trophy, Battery, BatteryLow, BatteryMedium, BatteryFull } from "lucide-react";
import { format, addDays } from "date-fns";

const ENERGY_LEVELS = [
  { key: "low",    label: "Low",    icon: BatteryLow,    color: "text-red-400"   },
  { key: "medium", label: "Medium", icon: BatteryMedium, color: "text-gold-400"  },
  { key: "high",   label: "High",   icon: BatteryFull,   color: "text-green-500" },
] as const;

interface VipWeeklyEntry {
  id?: string;
  user_id?: string;
  week_start: string;
  main_focus:  string | null;
  work_tasks:  string | null;  // JSON: string[5]
  home_tasks:  string | null;  // JSON: string[5]
  personal_tasks: string | null; // JSON: string[5]
  went_well:   string | null;
  needs_attention: string | null;
  energy_level: string | null;
  achievements: string | null; // JSON: string[5]
}

interface Props {
  userId:    string;
  weekStart: string;
  initialEntry: VipWeeklyEntry | null;
}

function parseArr(json: string | null | undefined, size: number): string[] {
  try {
    const parsed = JSON.parse(json ?? "[]");
    if (parsed.length >= size) return parsed.slice(0, size);
    return [...parsed, ...Array(size - parsed.length).fill("")];
  } catch { return Array(size).fill(""); }
}

export default function VipWeeklyClient({ userId, weekStart, initialEntry }: Props) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const [mainFocus, setMainFocus] = useState(initialEntry?.main_focus ?? "");
  const [workTasks,     setWorkTasks]     = useState<string[]>(() => parseArr(initialEntry?.work_tasks, 5));
  const [homeTasks,     setHomeTasks]     = useState<string[]>(() => parseArr(initialEntry?.home_tasks, 5));
  const [personalTasks, setPersonalTasks] = useState<string[]>(() => parseArr(initialEntry?.personal_tasks, 5));
  const [achievements,  setAchievements]  = useState<string[]>(() => parseArr(initialEntry?.achievements, 5));

  const [wentWell, setWentWell]   = useState(initialEntry?.went_well ?? "");
  const [needsAttention, setNeedsAttention] = useState(initialEntry?.needs_attention ?? "");
  const [energyLevel, setEnergyLevel] = useState<string | null>(initialEntry?.energy_level ?? null);

  const save = useCallback(async () => {
    setSaving(true);
    await supabase.from("vip_weekly_entries").upsert(
      {
        user_id: userId, week_start: weekStart,
        main_focus: mainFocus,
        work_tasks: JSON.stringify(workTasks),
        home_tasks: JSON.stringify(homeTasks),
        personal_tasks: JSON.stringify(personalTasks),
        went_well: wentWell, needs_attention: needsAttention,
        energy_level: energyLevel,
        achievements: JSON.stringify(achievements),
      },
      { onConflict: "user_id,week_start" }
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [supabase, userId, weekStart, mainFocus, workTasks, homeTasks, personalTasks, wentWell, needsAttention, energyLevel, achievements]);

  useEffect(() => {
    const t = setTimeout(save, 1300);
    return () => clearTimeout(t);
  }, [save]);

  function updateArr(setter: (fn: (prev: string[]) => string[]) => void, i: number, value: string) {
    setter((prev) => { const n = [...prev]; n[i] = value; return n; });
  }

  const weekLabel = `${format(new Date(weekStart), "d MMM")} – ${format(addDays(new Date(weekStart), 6), "d MMM yyyy")}`;

  const taskGroups = [
    { title: "Work",     icon: Briefcase, tasks: workTasks,     setter: setWorkTasks,     color: "text-navy-400"  },
    { title: "Home",     icon: Home,      tasks: homeTasks,     setter: setHomeTasks,     color: "text-gold-500"  },
    { title: "Personal", icon: User,      tasks: personalTasks, setter: setPersonalTasks, color: "text-blush-400" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="section-title mb-0">Weekly Activity Tracker</h2>
            <span className="text-[10px] bg-navy-500 text-gold-400 px-2 py-0.5 rounded-full font-medium">VIP</span>
          </div>
          <p className="text-navy-400 text-sm mt-1">{weekLabel} — see your week clearly</p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full border transition-all ${
          saved   ? "bg-gold-50 border-gold-300 text-gold-600" :
          saving  ? "bg-ivory-200 border-ivory-300 text-navy-400" :
                    "bg-ivory-100 border-ivory-200 text-navy-300"
        }`}>
          {saved ? "✓ Saved" : saving ? "Saving…" : "Auto-save on"}
        </span>
      </div>

      {/* Main Focus */}
      <div className="card card-gold mb-5">
        <p className="label">Main focus for the week</p>
        <input
          className="input"
          placeholder="The one thing that defines this week..."
          value={mainFocus}
          onChange={(e) => setMainFocus(e.target.value)}
        />
      </div>

      {/* Task groups: Work / Home / Personal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {taskGroups.map(({ title, icon: Icon, tasks, setter, color }) => (
          <div key={title} className="card">
            <div className="flex items-center gap-2 mb-3">
              <Icon size={15} className={color} />
              <p className="label mb-0">{title}</p>
            </div>
            <div className="space-y-2">
              {tasks.map((t, i) => (
                <input
                  key={i}
                  className="input text-xs py-1.5 h-8"
                  placeholder={`Priority ${i + 1}`}
                  value={t}
                  onChange={(e) => updateArr(setter, i, e.target.value)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Went well / Needs attention */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="card">
          <p className="label">What went well this week</p>
          <textarea
            className="textarea min-h-[90px]"
            placeholder="Wins, progress, things that flowed..."
            value={wentWell}
            onChange={(e) => setWentWell(e.target.value)}
          />
        </div>
        <div className="card">
          <p className="label">What needs attention next week</p>
          <textarea
            className="textarea min-h-[90px]"
            placeholder="Carry forward with intention..."
            value={needsAttention}
            onChange={(e) => setNeedsAttention(e.target.value)}
          />
        </div>
      </div>

      {/* Energy level */}
      <div className="card mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Battery size={16} className="text-gold-400" />
          <p className="label mb-0">Energy level this week</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {ENERGY_LEVELS.map(({ key, label, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => setEnergyLevel(key)}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${
                energyLevel === key ? "border-gold-400 bg-gold-50" : "border-ivory-200 hover:border-gold-300"
              }`}
            >
              <Icon size={20} className={color} />
              <span className="text-xs text-navy-500 font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Weekly Achievements */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Trophy size={16} className="text-gold-400" />
          <p className="label mb-0">Weekly achievements</p>
        </div>
        <div className="space-y-2">
          {achievements.map((a, i) => (
            <div key={i} className="flex items-center gap-3">
              <Trophy size={13} className="text-gold-300 flex-shrink-0" />
              <input
                className="input text-sm py-1.5 h-9"
                placeholder={`Achievement ${i + 1}...`}
                value={a}
                onChange={(e) => updateArr(setAchievements, i, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
