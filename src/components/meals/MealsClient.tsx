"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MealPlan, MealEntry } from "@/types";
import { Plus, X, ShoppingCart, Target } from "lucide-react";

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

const DEFAULT_DIET_TAGS = [
  { label: "🌍 African",         key: "african"       },
  { label: "🇬🇧 British",        key: "british"       },
  { label: "🇮🇹 Italian",        key: "italian"       },
  { label: "🥢 Asian",           key: "asian"         },
  { label: "💚 Budget-friendly", key: "budget"        },
  { label: "🥑 Keto",            key: "keto"          },
  { label: "🌱 Vegan",           key: "vegan"         },
  { label: "🥦 Vegetarian",      key: "vegetarian"    },
  { label: "🌾 Gluten-Free",     key: "glutenfree"    },
  { label: "🍗 High Protein",    key: "highprotein"   },
];

interface MealData {
  breakfast: string;
  lunch:     string;
  dinner:    string;
}

interface MacroData {
  carbs:   number;
  protein: number;
  fats:    number;
}

interface Props {
  userId:        string;
  weekStart:     string;
  initialPlan:   (MealPlan & { meal_entries: MealEntry[] }) | null;
  monthlyBudget: number;
  totalSpent:    number;
}

export default function MealsClient({ userId, weekStart, initialPlan, monthlyBudget, totalSpent }: Props) {
  const supabase = createClient();
  const [saving, setSaving]               = useState(false);
  const [saved,  setSaved]                = useState(false);
  const [suggestionIdx, setSuggestionIdx] = useState(0);

  // Diet tags
  const [activeTags,  setActiveTags]  = useState<string[]>([]);
  const [customTags,  setCustomTags]  = useState<string[]>([]);
  const [addingTag,   setAddingTag]   = useState(false);
  const [newTagLabel, setNewTagLabel] = useState("");

  // Grocery
  const [groceryList,   setGroceryList]   = useState(initialPlan?.grocery_list   ?? "");
  const [batchSunday,   setBatchSunday]   = useState(initialPlan?.batch_sunday   ?? "");
  const [batchMidweek,  setBatchMidweek]  = useState(initialPlan?.batch_midweek  ?? "");

  // Meals
  const initMeals = () => {
    const m: Record<string, MealData> = {};
    DAYS.forEach((d) => {
      const entry = initialPlan?.meal_entries?.find((e) => e.day_label === d);
      m[d] = { breakfast: entry?.breakfast ?? "", lunch: entry?.lunch ?? "", dinner: entry?.dinner ?? "" };
    });
    return m;
  };
  const [meals, setMeals] = useState<Record<string, MealData>>(initMeals);

  // Macros per day
  const initMacros = () => {
    const m: Record<string, MacroData> = {};
    DAYS.forEach((d) => {
      const entry = initialPlan?.meal_entries?.find((e) => e.day_label === d) as any;
      m[d] = {
        carbs:   entry?.macro_carbs   ?? 0,
        protein: entry?.macro_protein ?? 0,
        fats:    entry?.macro_fats    ?? 0,
      };
    });
    return m;
  };
  const [macros, setMacros] = useState<Record<string, MacroData>>(initMacros);

  // Weekly macro totals
  const weeklyTotals = DAYS.reduce(
    (acc, d) => ({
      carbs:   acc.carbs   + (macros[d]?.carbs   ?? 0),
      protein: acc.protein + (macros[d]?.protein ?? 0),
      fats:    acc.fats    + (macros[d]?.fats    ?? 0),
    }),
    { carbs: 0, protein: 0, fats: 0 }
  );

  // Budget remaining
  const groceryBudget  = monthlyBudget > 0 ? Math.round(monthlyBudget * 0.25) : 0; // rough 25% for groceries
  const budgetDisplay  = monthlyBudget > 0;

  const save = useCallback(async () => {
    setSaving(true);
    const { data: plan } = await supabase
      .from("meal_plans")
      .upsert(
        {
          user_id: userId, week_start: weekStart,
          grocery_list: groceryList, batch_sunday: batchSunday, batch_midweek: batchMidweek,
          diet_tags:    JSON.stringify(activeTags),
          custom_tags:  JSON.stringify(customTags),
        },
        { onConflict: "user_id,week_start" }
      )
      .select()
      .single();

    if (plan) {
      const entries = DAYS.map((day) => ({
        plan_id:       plan.id,
        user_id:       userId,
        day_label:     day,
        breakfast:     meals[day].breakfast,
        lunch:         meals[day].lunch,
        dinner:        meals[day].dinner,
        macro_carbs:   macros[day]?.carbs   ?? 0,
        macro_protein: macros[day]?.protein ?? 0,
        macro_fats:    macros[day]?.fats    ?? 0,
      }));
      await supabase.from("meal_entries").upsert(entries, { onConflict: "plan_id,day_label" } as any);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [supabase, userId, weekStart, groceryList, batchSunday, batchMidweek, meals, macros, activeTags, customTags]);

  useEffect(() => {
    const t = setTimeout(save, 1600);
    return () => clearTimeout(t);
  }, [save]);

  function updateMeal(day: string, field: keyof MealData, value: string) {
    setMeals((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  }

  function updateMacro(day: string, field: keyof MacroData, value: number) {
    setMacros((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  }

  function toggleTag(key: string) {
    setActiveTags((prev) => prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]);
  }

  function addCustomTag() {
    if (!newTagLabel.trim()) return;
    setCustomTags((prev) => [...prev, newTagLabel.trim()]);
    setNewTagLabel("");
    setAddingTag(false);
  }

  function removeCustomTag(tag: string) {
    setCustomTags((prev) => prev.filter((t) => t !== tag));
  }

  const allTags = [...DEFAULT_DIET_TAGS, ...customTags.map((t) => ({ label: t, key: t }))];

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="section-title mb-0">Meal Planning Hub</h2>
          <p className="text-navy-400 text-sm mt-1">Feeding your body should feel like honouring yourself</p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full border transition-all ${
          saved   ? "bg-gold-50 border-gold-300 text-gold-600" :
          saving  ? "bg-ivory-200 border-ivory-300 text-navy-400" :
                    "bg-ivory-100 border-ivory-200 text-navy-300"
        }`}>
          {saved ? "✓ Saved" : saving ? "Saving…" : "Auto-save on"}
        </span>
      </div>

      {/* AI Suggestion */}
      <div className="ai-card mb-6">
        <p className="text-xs uppercase tracking-widest text-gold-400 font-medium mb-2">✦ Meal suggestion</p>
        <p className="font-serif text-ivory-100 italic text-base leading-relaxed">
          &ldquo;{MEAL_SUGGESTIONS[suggestionIdx]}&rdquo;
        </p>
        <button
          onClick={() => setSuggestionIdx((i) => (i + 1) % MEAL_SUGGESTIONS.length)}
          className="mt-4 text-xs text-gold-400 hover:text-gold-300 underline"
        >
          New suggestion ↺
        </button>
      </div>

      {/* Dietary preference tags */}
      <div className="card mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="label mb-0">Dietary preferences</p>
          <button
            onClick={() => setAddingTag(true)}
            className="flex items-center gap-1 text-xs text-gold-500 hover:text-gold-600 font-medium"
          >
            <Plus size={12} /> Add custom
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {allTags.map(({ label, key }) => (
            <div key={key} className="flex items-center gap-1">
              <button
                onClick={() => toggleTag(key)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  activeTags.includes(key)
                    ? "bg-navy-500 border-navy-500 text-white font-medium"
                    : "bg-ivory-100 border-ivory-200 text-navy-500 hover:border-navy-300"
                }`}
              >
                {label}
              </button>
              {customTags.includes(label) && (
                <button onClick={() => removeCustomTag(label)} className="text-navy-300 hover:text-red-400">
                  <X size={11} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add custom tag input */}
        {addingTag && (
          <div className="flex gap-2 mt-3">
            <input
              className="input text-sm py-1.5 flex-1"
              placeholder="e.g. Caribbean, Dairy-Free, Low Carb..."
              value={newTagLabel}
              onChange={(e) => setNewTagLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustomTag()}
              autoFocus
            />
            <button onClick={addCustomTag} className="btn-primary text-xs py-1.5 px-3">Add</button>
            <button onClick={() => setAddingTag(false)} className="btn-ghost text-xs py-1.5 px-3">Cancel</button>
          </div>
        )}
      </div>

      {/* Weekly meal grid */}
      <div className="card mb-5">
        <p className="label">This week&apos;s meals</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 pr-3 text-xs text-navy-400 font-medium w-10"></th>
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

      {/* Macro Tracker */}
      <div className="card mb-5">
        <div className="flex items-center gap-2 mb-4">
          <Target size={16} className="text-gold-400" />
          <p className="label mb-0">Daily macro tracker</p>
          <span className="text-xs text-navy-300 italic">(grams)</span>
        </div>

        {/* Weekly totals */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "Total Carbs",   value: weeklyTotals.carbs,   color: "text-blue-500",  bg: "bg-blue-50"  },
            { label: "Total Protein", value: weeklyTotals.protein, color: "text-green-500", bg: "bg-green-50" },
            { label: "Total Fats",    value: weeklyTotals.fats,    color: "text-gold-500",  bg: "bg-gold-50"  },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`${bg} rounded-xl p-3 text-center border border-ivory-200`}>
              <p className={`font-serif text-2xl font-medium ${color}`}>{value}g</p>
              <p className="text-xs text-navy-400">{label} / week</p>
            </div>
          ))}
        </div>

        {/* Per-day macro inputs */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 text-xs text-navy-400 font-medium w-10"></th>
                <th className="text-left py-2 px-2 text-xs text-blue-400 font-medium">Carbs (g)</th>
                <th className="text-left py-2 px-2 text-xs text-green-500 font-medium">Protein (g)</th>
                <th className="text-left py-2 px-2 text-xs text-gold-500 font-medium">Fats (g)</th>
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day) => (
                <tr key={day} className="border-t border-ivory-200">
                  <td className="py-2 text-xs font-medium text-navy-500">{day}</td>
                  {(["carbs", "protein", "fats"] as const).map((macro) => (
                    <td key={macro} className="py-1 px-2">
                      <input
                        type="number"
                        className="input text-xs py-1.5 h-8 w-full"
                        placeholder="0"
                        value={macros[day]?.[macro] || ""}
                        onChange={(e) => updateMacro(day, macro, Number(e.target.value))}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grocery list with budget link */}
      <div className="card mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShoppingCart size={16} className="text-gold-400" />
            <p className="label mb-0">Grocery list</p>
          </div>
          {budgetDisplay && (
            <div className="bg-ivory-100 rounded-xl px-3 py-1.5 border border-ivory-200 text-right">
              <p className="text-xs text-navy-400">Est. grocery budget</p>
              <p className="font-serif text-sm font-medium text-navy-500">
                ~£{groceryBudget.toLocaleString()}
                <span className="text-xs text-navy-300 font-normal ml-1">/ month</span>
              </p>
            </div>
          )}
        </div>
        {budgetDisplay && (
          <p className="text-xs text-navy-400 italic mb-3">
            Based on your £{monthlyBudget.toLocaleString()} monthly income from Money Reset (est. 25% for groceries)
          </p>
        )}
        <textarea
          className="textarea min-h-[100px]"
          placeholder="Fruits & veg, protein, pantry staples, household..."
          value={groceryList}
          onChange={(e) => setGroceryList(e.target.value)}
        />
      </div>

      {/* Batch cooking */}
      <div className="card card-gold">
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
