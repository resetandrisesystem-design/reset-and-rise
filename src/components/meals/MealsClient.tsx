"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MealPlan, MealEntry } from "@/types";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MEAL_SUGGESTIONS = [
  "One-pot jollof rice with vegetables — 30 min, feeds the family, freezes well.",
  "Pasta e fagioli — Italian comfort food, budget-friendly, protein-packed.",
  "Sheet pan chicken thighs with roasted sweet potato — minimal prep, maximum nourishment.",
  "Chicken stew with yam and plantain — soul food that resets the spirit.",
  "Buddha bowl: brown rice, roasted chickpeas, cucumber, tahini. Fast and beautiful.",
  "Nigerian egusi soup with eba — rich, filling, and deeply nourishing.",
  "Simple roast chicken with seasonal veg — cook once, eat all week.",
];

interface MealData { breakfast: string; lunch: string; dinner: string; }

interface Props {
  userId: string;
  weekStart: string;
  initialPlan: (MealPlan & { meal_entries: MealEntry[] }) | null;
}

export default function MealsClient({ userId, weekStart, initialPlan }: Props) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [suggestionIdx, setSuggestionIdx] = useState(0);

  const [groceryList, setGroceryList] = useState(initialPlan?.grocery_list ?? "");
  const [batchSunday, setBatchSunday] = useState(initialPlan?.batch_sunday ?? "");
  const [batchMidweek, setBatchMidweek] = useState(initialPlan?.batch_midweek ?? "");

  const initMeals = () => {
    const m: Record<string, MealData> = {};
    DAYS.forEach((d) => {
      const entry = initialPlan?.meal_entries?.find((e) => e.day_label === d);
      m[d] = { breakfast: entry?.breakfast ?? "", lunch: entry?.lunch ?? "", dinner: entry?.dinner ?? "" };
    });
    return m;
  };
  const [meals, setMeals] = useState<Record<string, MealData>>(initMeals);

  const save = useCallback(async () => {
    setSaving(true);
    // Upsert the plan
    const { data: plan } = await supabase
      .from("meal_plans")
      .upsert(
        { user_id: userId, week_start: weekStart, grocery_list: groceryList, batch_sunday: batchSunday, batch_midweek: batchMidweek },
        { onConflict: "user_id,week_start" }
      )
      .select()
      .single();

    if (plan) {
      // Upsert each day's meals
      const entries = DAYS.map((day) => ({
        plan_id: plan.id,
        user_id: userId,
        day_label: day,
        breakfast: meals[day].breakfast,
        lunch: meals[day].lunch,
        dinner: meals[day].dinner,
      }));
      await supabase.from("meal_entries").upsert(entries, { onConflict: "plan_id,day_label" } as any);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [supabase, userId, weekStart, groceryList, batchSunday, batchMidweek, meals]);

  useEffect(() => {
    const t = setTimeout(save, 1600);
    return () => clearTimeout(t);
  }, [save]);

  function updateMeal(day: string, field: keyof MealData, value: string) {
    setMeals((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="section-title mb-0">Meal Planning Hub</h2>
          <p className="text-navy-400 text-sm mt-1">Feeding your body should feel like honouring yourself</p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full border transition-all ${saved ? "bg-gold-50 border-gold-300 text-gold-600" : saving ? "bg-ivory-200 border-ivory-300 text-navy-400" : "bg-ivory-100 border-ivory-200 text-navy-300"}`}>
          {saved ? "✓ Saved" : saving ? "Saving…" : "Auto-save on"}
        </span>
      </div>

      {/* AI Suggestion */}
      <div className="ai-card mb-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-gold-400 font-medium mb-2">✦ Meal suggestion</p>
            <p className="font-serif text-ivory-100 italic text-base leading-relaxed">
              &ldquo;{MEAL_SUGGESTIONS[suggestionIdx]}&rdquo;
            </p>
          </div>
        </div>
        <button
          onClick={() => setSuggestionIdx((i) => (i + 1) % MEAL_SUGGESTIONS.length)}
          className="mt-4 text-xs text-gold-400 hover:text-gold-300 underline"
        >
          New suggestion ↺
        </button>
      </div>

      {/* Cultural tags */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {["🌍 African", "🇬🇧 British", "🇮🇹 Italian", "🥢 Asian", "💚 Budget-friendly"].map((t) => (
          <span key={t} className="tag bg-navy-50 text-navy-500 border border-navy-100">{t}</span>
        ))}
      </div>

      {/* Weekly meal grid */}
      <div className="card mb-5">
        <p className="label">This week&apos;s meals</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 pr-3 text-xs text-navy-400 font-medium w-12"></th>
                {["Breakfast", "Lunch", "Dinner"].map((m) => (
                  <th key={m} className="text-left py-2 px-2 text-xs text-navy-400 font-medium">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day) => (
                <tr key={day} className="border-t border-ivory-200">
                  <td className="py-2 pr-3 text-xs font-medium text-navy-500 align-top pt-3">{day}</td>
                  {(["breakfast", "lunch", "dinner"] as const).map((meal) => (
                    <td key={meal} className="py-1 px-2 align-top">
                      <textarea
                        className="textarea text-xs min-h-[52px] py-2"
                        placeholder="..."
                        value={meals[day][meal]}
                        onChange={(e) => updateMeal(day, meal, e.target.value)}
                        rows={2}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grocery list */}
      <div className="card mb-5">
        <p className="label">Grocery list</p>
        <textarea
          className="textarea min-h-[100px]"
          placeholder="Fruits & veg, protein, pantry staples, household..."
          value={groceryList}
          onChange={(e) => setGroceryList(e.target.value)}
        />
      </div>

      {/* Batch cooking */}
      <div className="card card-gold mb-5">
        <p className="label">Cook once, eat twice ✦</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label text-xs">Sunday batch cook</label>
            <textarea className="textarea min-h-[70px]" placeholder="e.g. rice, stew, roasted veg..." value={batchSunday} onChange={(e) => setBatchSunday(e.target.value)} />
          </div>
          <div>
            <label className="label text-xs">Mid-week refresh</label>
            <textarea className="textarea min-h-[70px]" placeholder="e.g. add salad, wrap leftovers..." value={batchMidweek} onChange={(e) => setBatchMidweek(e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  );
}
