"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MoodEntry } from "@/types";
import { Plus, X, Battery, BatteryLow, BatteryMedium, BatteryFull } from "lucide-react";

const MOODS = [
  { key: "low",    label: "Low",    emoji: "😔" },
  { key: "okay",   label: "Okay",   emoji: "😐" },
  { key: "good",   label: "Good",   emoji: "🙂" },
  { key: "calm",   label: "Calm",   emoji: "😊" },
  { key: "rising", label: "Rising", emoji: "🌟" },
] as const;

type Mood = typeof MOODS[number]["key"];

const REFLECTION_PROMPTS = [
  "What would make today feel like enough?",
  "What am I holding onto that I could release today?",
  "If a friend were in my shoes, what would I tell her?",
  "What is one thing I did well today — no matter how small?",
  "Where in my body do I feel tension, and what is it telling me?",
  "What boundary would protect my energy most right now?",
];

const DEFAULT_SELFCARE = [
  "A 10 minute walk",
  "A quiet cup of tea",
  "A slow shower",
  "A short stretch",
  "A gentle check-in with yourself",
];

const ENERGY_LEVELS = [
  { key: "low",    label: "Low",    icon: BatteryLow,    color: "text-red-400"  },
  { key: "medium", label: "Medium", icon: BatteryMedium, color: "text-gold-400" },
  { key: "high",   label: "High",   icon: BatteryFull,   color: "text-green-500"},
] as const;

interface Props {
  userId: string;
  today: string;
  initialEntry: (MoodEntry & { energy_level?: string; selfcare_checked?: string; selfcare_custom?: string }) | null;
  moodHistory: { entry_date: string; mood: string | null; stress_level: number | null }[];
}

export default function MentalHealthClient({ userId, today, initialEntry, moodHistory }: Props) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [promptIdx, setPromptIdx] = useState(0);

  const [mood, setMood]            = useState<Mood | null>((initialEntry?.mood as Mood) ?? null);
  const [stress, setStress]        = useState(initialEntry?.stress_level ?? 5);
  const [energyLevel, setEnergyLevel] = useState<string | null>(initialEntry?.energy_level ?? null);
  const [brainDump, setBrainDump]  = useState(initialEntry?.brain_dump ?? "");
  const [reflection, setReflection] = useState(initialEntry?.reflection ?? "");
  const [peaceBank, setPeaceBank]  = useState(initialEntry?.peace_bank ?? "");

  // Self-care menu (Premium)
  const [checkedItems, setCheckedItems] = useState<string[]>(() => {
    try { return JSON.parse(initialEntry?.selfcare_checked ?? "[]"); } catch { return []; }
  });
  const [customItems, setCustomItems] = useState<string[]>(() => {
    try { return JSON.parse(initialEntry?.selfcare_custom ?? "[]"); } catch { return []; }
  });
  const [addingCustom, setAddingCustom] = useState(false);
  const [newCustomItem, setNewCustomItem] = useState("");

  const allSelfCareItems = [...DEFAULT_SELFCARE, ...customItems];

  const save = useCallback(async (data: {
    mood: Mood | null; stress_level: number; brain_dump: string; reflection: string; peace_bank: string;
    energy_level: string | null; selfcare_checked: string; selfcare_custom: string;
  }) => {
    setSaving(true);
    await supabase.from("mood_entries").upsert(
      { user_id: userId, entry_date: today, ...data },
      { onConflict: "user_id,entry_date" }
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [supabase, userId, today]);

  useEffect(() => {
    const t = setTimeout(() => save({
      mood, stress_level: stress, brain_dump: brainDump, reflection, peace_bank: peaceBank,
      energy_level: energyLevel,
      selfcare_checked: JSON.stringify(checkedItems),
      selfcare_custom: JSON.stringify(customItems),
    }), 1200);
    return () => clearTimeout(t);
  }, [mood, stress, brainDump, reflection, peaceBank, energyLevel, checkedItems, customItems, save]);

  function toggleSelfCare(item: string) {
    setCheckedItems((prev) => prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]);
  }

  function addCustomItem() {
    if (!newCustomItem.trim()) return;
    setCustomItems((prev) => [...prev, newCustomItem.trim()]);
    setNewCustomItem("");
    setAddingCustom(false);
  }

  function removeCustomItem(item: string) {
    setCustomItems((prev) => prev.filter((i) => i !== item));
    setCheckedItems((prev) => prev.filter((i) => i !== item));
  }

  const MOOD_LABELS: Record<string, string> = { low: "😔", okay: "😐", good: "🙂", calm: "😊", rising: "🌟" };

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="section-title mb-0">Mind Reset Zone</h2>
          <p className="text-navy-400 text-sm mt-1">A space to unload, reflect and breathe</p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full border transition-all ${saved ? "bg-gold-50 border-gold-300 text-gold-600" : saving ? "bg-ivory-200 border-ivory-300 text-navy-400" : "bg-ivory-100 border-ivory-200 text-navy-300"}`}>
          {saved ? "✓ Saved" : saving ? "Saving…" : "Auto-save on"}
        </span>
      </div>

      {/* Mood selector */}
      <div className="card mb-5">
        <p className="label">How are you feeling right now?</p>
        <div className="grid grid-cols-5 gap-2">
          {MOODS.map(({ key, label, emoji }) => (
            <button
              key={key}
              onClick={() => setMood(key)}
              className={`mood-btn ${mood === key ? "selected" : ""}`}
            >
              <span className="text-2xl block mb-1">{emoji}</span>
              <span className="text-xs text-navy-400">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stress slider */}
      <div className="card card-gold mb-5">
        <p className="label">Stress level today</p>
        <input
          type="range"
          min={1} max={10} step={1}
          value={stress}
          onChange={(e) => setStress(Number(e.target.value))}
          className="w-full accent-navy-500 mb-2"
        />
        <div className="flex justify-between text-xs text-navy-400">
          <span>Calm</span>
          <span className="text-navy-500 font-medium">{stress} / 10</span>
          <span>Overwhelmed</span>
        </div>
      </div>

      {/* Energy Log — Premium */}
      <div className="card mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Battery size={16} className="text-gold-400" />
          <p className="label mb-0">Energy log</p>
          <span className="text-[10px] bg-gold-100 text-gold-600 px-2 py-0.5 rounded-full font-medium">PREMIUM</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {ENERGY_LEVELS.map(({ key, label, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => setEnergyLevel(key)}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${
                energyLevel === key
                  ? "border-gold-400 bg-gold-50"
                  : "border-ivory-200 bg-ivory-50 hover:border-gold-300"
              }`}
            >
              <Icon size={22} className={color} />
              <span className="text-xs text-navy-500 font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Self-Care Menu — Premium */}
      <div className="card card-gold mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <p className="label mb-0">Self-care menu</p>
            <span className="text-[10px] bg-gold-100 text-gold-600 px-2 py-0.5 rounded-full font-medium">PREMIUM</span>
          </div>
          <button
            onClick={() => setAddingCustom(true)}
            className="flex items-center gap-1 text-xs text-gold-500 hover:text-gold-600 font-medium"
          >
            <Plus size={12} /> Add your own
          </button>
        </div>
        <p className="text-xs text-navy-400 italic mb-3">Check off what feels good today.</p>

        <div className="space-y-2">
          {allSelfCareItems.map((item) => {
            const checked   = checkedItems.includes(item);
            const isCustom  = customItems.includes(item);
            return (
              <div key={item} className="flex items-center gap-2">
                <button
                  onClick={() => toggleSelfCare(item)}
                  className={`flex-1 flex items-center gap-3 text-left text-sm py-2.5 px-3 rounded-xl border transition-all ${
                    checked
                      ? "border-gold-400 bg-white text-navy-500"
                      : "border-ivory-200 bg-white/50 text-navy-400 hover:border-gold-300"
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                    checked ? "bg-gold-400 border-gold-400" : "border-navy-300"
                  }`}>
                    {checked && <span className="text-white text-[10px]">✓</span>}
                  </span>
                  {item}
                </button>
                {isCustom && (
                  <button onClick={() => removeCustomItem(item)} className="text-navy-300 hover:text-red-400">
                    <X size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {addingCustom && (
          <div className="flex gap-2 mt-3">
            <input
              className="input text-sm py-1.5 flex-1"
              placeholder="e.g. Read a chapter, call a friend..."
              value={newCustomItem}
              onChange={(e) => setNewCustomItem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustomItem()}
              autoFocus
            />
            <button onClick={addCustomItem} className="btn-primary text-xs py-1.5 px-3">Add</button>
            <button onClick={() => setAddingCustom(false)} className="btn-ghost text-xs py-1.5 px-3">Cancel</button>
          </div>
        )}
      </div>

      {/* Brain dump */}
      <div className="card mb-5">
        <p className="label">Brain dump — let it out</p>
        <p className="text-xs text-navy-400 mb-3 italic">You can&apos;t hold everything in your head. Pour it here.</p>
        <textarea
          className="textarea min-h-[110px]"
          placeholder="Worries, thoughts, to-dos, feelings... nothing is too small or too big."
          value={brainDump}
          onChange={(e) => setBrainDump(e.target.value)}
        />
      </div>

      {/* Reflection prompt */}
      <div className="card mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="label mb-0">Today&apos;s reflection prompt</p>
          <button
            onClick={() => setPromptIdx((i) => (i + 1) % REFLECTION_PROMPTS.length)}
            className="text-xs text-navy-400 hover:text-gold-500 underline"
          >
            New prompt ↺
          </button>
        </div>
        <p className="font-serif text-navy-500 italic text-base leading-relaxed mb-3">
          &ldquo;{REFLECTION_PROMPTS[promptIdx]}&rdquo;
        </p>
        <textarea
          className="textarea min-h-[90px]"
          placeholder="Write freely..."
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
        />
      </div>

      {/* Peace bank */}
      <div className="card card-gold mb-5">
        <p className="label">Peace bank ✦</p>
        <p className="text-xs text-navy-400 mb-3 italic">Save a peaceful thought, answered prayer, or moment of grace.</p>
        <textarea
          className="textarea min-h-[70px]"
          placeholder="Something beautiful to hold onto..."
          value={peaceBank}
          onChange={(e) => setPeaceBank(e.target.value)}
        />
      </div>

      {/* 7-day mood history */}
      {moodHistory.length > 0 && (
        <div className="card">
          <p className="label">Your mood this week</p>
          <div className="flex gap-2">
            {moodHistory.map((d) => (
              <div key={d.entry_date} className="flex flex-col items-center gap-1 flex-1">
                <span className="text-xl">{d.mood ? MOOD_LABELS[d.mood] : "—"}</span>
                <span className="text-xs text-navy-400">{new Date(d.entry_date).toLocaleDateString("en-GB", { weekday: "short" })}</span>
                {d.stress_level && (
                  <span className="text-xs text-navy-300">{d.stress_level}/10</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
