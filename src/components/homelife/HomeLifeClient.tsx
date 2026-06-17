"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Home, Sparkles } from "lucide-react";

const TIDY_CHECKLIST = [
  "Quick clean",
  "Laundry load",
  "5-minute reset",
  "Dishes",
];

interface HomeLifeEntry {
  id?: string;
  user_id?: string;
  week_start: string;
  declutter_focus:    string | null;
  tidy_checked:       string | null; // JSON
  tidy_custom:        string | null; // JSON
  home_reflection:    string | null;
}

interface Props {
  userId:    string;
  weekStart: string;
  initialEntry: HomeLifeEntry | null;
}

export default function HomeLifeClient({ userId, weekStart, initialEntry }: Props) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const [declutterFocus, setDeclutterFocus] = useState(initialEntry?.declutter_focus ?? "");
  const [homeReflection, setHomeReflection] = useState(initialEntry?.home_reflection ?? "");

  const [checkedItems, setCheckedItems] = useState<string[]>(() => {
    try { return JSON.parse(initialEntry?.tidy_checked ?? "[]"); } catch { return []; }
  });
  const [customItems, setCustomItems] = useState<string[]>(() => {
    try { return JSON.parse(initialEntry?.tidy_custom ?? "[]"); } catch { return []; }
  });
  const [addingCustom, setAddingCustom] = useState(false);
  const [newItem, setNewItem] = useState("");

  const allTidyItems = [...TIDY_CHECKLIST, ...customItems];

  const save = useCallback(async () => {
    setSaving(true);
    await supabase.from("home_life_entries").upsert(
      {
        user_id: userId, week_start: weekStart,
        declutter_focus: declutterFocus,
        home_reflection: homeReflection,
        tidy_checked: JSON.stringify(checkedItems),
        tidy_custom:  JSON.stringify(customItems),
      },
      { onConflict: "user_id,week_start" }
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [supabase, userId, weekStart, declutterFocus, homeReflection, checkedItems, customItems]);

  useEffect(() => {
    const t = setTimeout(save, 1300);
    return () => clearTimeout(t);
  }, [save]);

  function toggleItem(item: string) {
    setCheckedItems((prev) => prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]);
  }

  function addCustomItem() {
    if (!newItem.trim()) return;
    setCustomItems((prev) => [...prev, newItem.trim()]);
    setNewItem("");
    setAddingCustom(false);
  }

  function removeCustomItem(item: string) {
    setCustomItems((prev) => prev.filter((i) => i !== item));
    setCheckedItems((prev) => prev.filter((i) => i !== item));
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="section-title mb-0">Home & Life Reset</h2>
              <span className="text-[10px] bg-gold-100 text-gold-600 px-2 py-0.5 rounded-full font-medium">PREMIUM</span>
            </div>
            <p className="text-navy-400 text-sm mt-1">Your space, gently restored</p>
          </div>
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
        <Sparkles size={18} className="text-gold-400 flex-shrink-0" />
        <p className="font-serif text-navy-500 italic text-base leading-relaxed">
          &ldquo;Your home, your mind, your work — everything can be reset gently. You are allowed to slow down.&rdquo;
        </p>
      </div>

      {/* Declutter Focus */}
      <div className="card mb-5">
        <div className="flex items-center gap-2 mb-2">
          <Home size={16} className="text-gold-400" />
          <p className="label mb-0">Declutter focus — one corner</p>
        </div>
        <p className="text-xs text-navy-400 italic mb-3">Pick just one space. You don&apos;t need to do it all at once.</p>
        <input
          className="input"
          placeholder="e.g. The kitchen counter, my desk, the entryway..."
          value={declutterFocus}
          onChange={(e) => setDeclutterFocus(e.target.value)}
        />
      </div>

      {/* Weekly Home Tidy Checklist */}
      <div className="card card-gold mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="label mb-0">Weekly home tidy</p>
          <button
            onClick={() => setAddingCustom(true)}
            className="flex items-center gap-1 text-xs text-gold-500 hover:text-gold-600 font-medium"
          >
            + Add yours
          </button>
        </div>

        <div className="space-y-2">
          {allTidyItems.map((item) => {
            const checked  = checkedItems.includes(item);
            const isCustom = customItems.includes(item);
            return (
              <div key={item} className="flex items-center gap-2">
                <button
                  onClick={() => toggleItem(item)}
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
                    ×
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
              placeholder="e.g. Vacuum living room, clear inbox..."
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustomItem()}
              autoFocus
            />
            <button onClick={addCustomItem} className="btn-primary text-xs py-1.5 px-3">Add</button>
            <button onClick={() => setAddingCustom(false)} className="btn-ghost text-xs py-1.5 px-3">Cancel</button>
          </div>
        )}
      </div>

      {/* Home Reflection */}
      <div className="card">
        <p className="label">How does your space feel right now?</p>
        <textarea
          className="textarea min-h-[90px]"
          placeholder="What's working, what's weighing on you, what would help..."
          value={homeReflection}
          onChange={(e) => setHomeReflection(e.target.value)}
        />
      </div>
    </div>
  );
}
