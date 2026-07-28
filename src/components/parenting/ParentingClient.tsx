"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Star, CheckCircle2, Plus, X, Smile } from "lucide-react";
import RefreshableQuote from "@/components/ui/RefreshableQuote";
import { PARENTING_QUOTES } from "@/lib/quotes";
import { format } from "date-fns";

const MORNING_ROUTINE_DEFAULTS = [
  "Wake up & get dressed",
  "Brush teeth & wash face",
  "Eat breakfast",
  "Pack school bag",
  "Out the door on time",
];

const EVENING_ROUTINE_DEFAULTS = [
  "After school snack",
  "Homework / reading time",
  "Tidy up toys",
  "Bath time",
  "Bedtime story & lights out",
];

const EMOTIONS = [
  { emoji: "😊", label: "Happy"    },
  { emoji: "😔", label: "Sad"      },
  { emoji: "😡", label: "Angry"    },
  { emoji: "😰", label: "Anxious"  },
  { emoji: "😴", label: "Tired"    },
  { emoji: "🤩", label: "Excited"  },
  { emoji: "🥰", label: "Loved"    },
  { emoji: "😤", label: "Frustrated"},
];

const CHORE_REWARDS = [
  "Extra screen time",
  "Choose dinner",
  "Stay up 30 mins later",
  "Pick a family activity",
  "Small treat",
  "Sticker / reward chart",
];

interface ParentingEntry {
  id?: string;
  user_id?: string;
  entry_date: string;
  child_name:          string | null;
  morning_checked:     string | null; // JSON
  evening_checked:     string | null; // JSON
  morning_custom:      string | null; // JSON
  evening_custom:      string | null; // JSON
  emotion_today:       string | null;
  emotion_note:        string | null;
  chores_done:         string | null; // JSON
  chores_custom:       string | null; // JSON
  reward_chosen:       string | null;
  parenting_note:      string | null;
  proud_moment:        string | null;
}

interface Props {
  userId: string;
  today:  string;
  initialEntry: ParentingEntry | null;
}

function parseJSON(val: string | null | undefined, fallback: any = []) {
  try { return JSON.parse(val ?? "[]"); } catch { return fallback; }
}

export default function ParentingClient({ userId, today, initialEntry }: Props) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const [childName,      setChildName]      = useState(initialEntry?.child_name      ?? "");
  const [emotionToday,   setEmotionToday]   = useState(initialEntry?.emotion_today   ?? null);
  const [emotionNote,    setEmotionNote]    = useState(initialEntry?.emotion_note    ?? "");
  const [rewardChosen,   setRewardChosen]   = useState(initialEntry?.reward_chosen   ?? "");
  const [parentingNote,  setParentingNote]  = useState(initialEntry?.parenting_note  ?? "");
  const [proudMoment,    setProudMoment]    = useState(initialEntry?.proud_moment    ?? "");

  const [morningChecked, setMorningChecked] = useState<string[]>(() => parseJSON(initialEntry?.morning_checked));
  const [eveningChecked, setEveningChecked] = useState<string[]>(() => parseJSON(initialEntry?.evening_checked));
  const [morningCustom,  setMorningCustom]  = useState<string[]>(() => parseJSON(initialEntry?.morning_custom));
  const [eveningCustom,  setEveningCustom]  = useState<string[]>(() => parseJSON(initialEntry?.evening_custom));
  const [choresDone,     setChoresDone]     = useState<string[]>(() => parseJSON(initialEntry?.chores_done));
  const [choresCustom,   setChoresCustom]   = useState<string[]>(() => parseJSON(initialEntry?.chores_custom));

  const [addingMorning,  setAddingMorning]  = useState(false);
  const [addingEvening,  setAddingEvening]  = useState(false);
  const [addingChore,    setAddingChore]    = useState(false);
  const [newMorning,     setNewMorning]     = useState("");
  const [newEvening,     setNewEvening]     = useState("");
  const [newChore,       setNewChore]       = useState("");

  const save = useCallback(async () => {
    setSaving(true);
    await supabase.from("parenting_entries").upsert(
      {
        user_id: userId, entry_date: today,
        child_name: childName,
        morning_checked: JSON.stringify(morningChecked),
        evening_checked: JSON.stringify(eveningChecked),
        morning_custom:  JSON.stringify(morningCustom),
        evening_custom:  JSON.stringify(eveningCustom),
        chores_done:     JSON.stringify(choresDone),
        chores_custom:   JSON.stringify(choresCustom),
        emotion_today: emotionToday, emotion_note: emotionNote,
        reward_chosen: rewardChosen,
        parenting_note: parentingNote, proud_moment: proudMoment,
      },
      { onConflict: "user_id,entry_date" }
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [supabase, userId, today, childName, morningChecked, eveningChecked, morningCustom,
      eveningCustom, choresDone, choresCustom, emotionToday, emotionNote, rewardChosen,
      parentingNote, proudMoment]);

  useEffect(() => {
    const t = setTimeout(save, 1400);
    return () => clearTimeout(t);
  }, [save]);

  function toggleCheck(list: string[], setList: (v: string[]) => void, item: string) {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  }

  function Checklist({
    defaults, customItems, checked, onToggle, onAddCustom, onRemoveCustom,
    addingNew, setAddingNew, newItem, setNewItem, placeholder
  }: {
    defaults: string[]; customItems: string[]; checked: string[];
    onToggle: (item: string) => void;
    onAddCustom: (item: string) => void; onRemoveCustom: (item: string) => void;
    addingNew: boolean; setAddingNew: (v: boolean) => void;
    newItem: string; setNewItem: (v: string) => void; placeholder: string;
  }) {
    const allItems = [...defaults, ...customItems];
    return (
      <div className="space-y-2">
        {allItems.map((item) => {
          const done = checked.includes(item);
          const isCustom = customItems.includes(item);
          return (
            <div key={item} className="flex items-center gap-2">
              <button
                onClick={() => onToggle(item)}
                className={`flex-1 flex items-center gap-3 text-left text-sm py-2.5 px-3 rounded-xl border transition-all ${
                  done ? "border-gold-400 bg-white text-navy-500" : "border-ivory-200 bg-white/50 text-navy-400 hover:border-gold-300"
                }`}
              >
                <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                  done ? "bg-gold-400 border-gold-400" : "border-navy-300"
                }`}>
                  {done && <span className="text-white text-[10px]">✓</span>}
                </span>
                {item}
              </button>
              {isCustom && (
                <button onClick={() => onRemoveCustom(item)} className="text-navy-300 hover:text-red-400">
                  <X size={14} />
                </button>
              )}
            </div>
          );
        })}
        {addingNew ? (
          <div className="flex gap-2">
            <input
              className="input text-sm py-1.5 flex-1"
              placeholder={placeholder}
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newItem.trim()) {
                  onAddCustom(newItem.trim());
                  setNewItem("");
                  setAddingNew(false);
                }
              }}
              autoFocus
            />
            <button
              onClick={() => { if (newItem.trim()) { onAddCustom(newItem.trim()); setNewItem(""); setAddingNew(false); } }}
              className="btn-primary text-xs py-1.5 px-3"
            >Add</button>
            <button onClick={() => { setAddingNew(false); setNewItem(""); }} className="btn-ghost text-xs py-1.5 px-3">Cancel</button>
          </div>
        ) : (
          <button
            onClick={() => setAddingNew(true)}
            className="flex items-center gap-1.5 text-xs text-gold-500 hover:text-gold-600 font-medium mt-1"
          >
            <Plus size={12} /> Add step
          </button>
        )}
      </div>
    );
  }

  const allChores = [...(choresCustom ?? [])];

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="section-title mb-0">Parenting Lane</h2>
          <p className="text-navy-400 text-sm mt-1">
            {format(new Date(today), "EEEE, d MMMM yyyy")}
          </p>
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
      <RefreshableQuote quotes={PARENTING_QUOTES} variant="light" />

      {/* Child name */}
      <div className="card mb-5">
        <p className="label">Child&apos;s name</p>
        <input
          className="input"
          placeholder="e.g. Amara, Joshua, Lily..."
          value={childName}
          onChange={(e) => setChildName(e.target.value)}
        />
      </div>

      {/* Morning + Evening routines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🌅</span>
            <p className="label mb-0">Morning routine</p>
            <span className="text-xs text-navy-400 ml-auto">
              {morningChecked.length}/{MORNING_ROUTINE_DEFAULTS.length + morningCustom.length} done
            </span>
          </div>
          <Checklist
            defaults={MORNING_ROUTINE_DEFAULTS}
            customItems={morningCustom}
            checked={morningChecked}
            onToggle={(item) => toggleCheck(morningChecked, setMorningChecked, item)}
            onAddCustom={(item) => setMorningCustom((prev) => [...prev, item])}
            onRemoveCustom={(item) => {
              setMorningCustom((prev) => prev.filter((i) => i !== item));
              setMorningChecked((prev) => prev.filter((i) => i !== item));
            }}
            addingNew={addingMorning} setAddingNew={setAddingMorning}
            newItem={newMorning} setNewItem={setNewMorning}
            placeholder="e.g. Take vitamins..."
          />
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🌙</span>
            <p className="label mb-0">Evening routine</p>
            <span className="text-xs text-navy-400 ml-auto">
              {eveningChecked.length}/{EVENING_ROUTINE_DEFAULTS.length + eveningCustom.length} done
            </span>
          </div>
          <Checklist
            defaults={EVENING_ROUTINE_DEFAULTS}
            customItems={eveningCustom}
            checked={eveningChecked}
            onToggle={(item) => toggleCheck(eveningChecked, setEveningChecked, item)}
            onAddCustom={(item) => setEveningCustom((prev) => [...prev, item])}
            onRemoveCustom={(item) => {
              setEveningCustom((prev) => prev.filter((i) => i !== item));
              setEveningChecked((prev) => prev.filter((i) => i !== item));
            }}
            addingNew={addingEvening} setAddingNew={setAddingEvening}
            newItem={newEvening} setNewItem={setNewEvening}
            placeholder="e.g. Read together..."
          />
        </div>
      </div>

      {/* Emotional check-in */}
      <div className="card card-gold mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Smile size={16} className="text-gold-400" />
          <p className="label mb-0">How is {childName || "your child"} feeling today?</p>
        </div>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {EMOTIONS.map(({ emoji, label }) => (
            <button
              key={label}
              onClick={() => setEmotionToday(emotionToday === label ? null : label)}
              className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-all ${
                emotionToday === label
                  ? "border-gold-400 bg-white"
                  : "border-ivory-200 bg-white/50 hover:border-gold-300"
              }`}
            >
              <span className="text-xl">{emoji}</span>
              <span className="text-[10px] text-navy-500 font-medium">{label}</span>
            </button>
          ))}
        </div>
        <textarea
          className="textarea min-h-[70px]"
          placeholder="What came up for them today? Any big feelings to note..."
          value={emotionNote}
          onChange={(e) => setEmotionNote(e.target.value)}
        />
      </div>

      {/* Chores & Rewards */}
      <div className="card mb-5">
        <div className="flex items-center gap-2 mb-4">
          <Star size={16} className="text-gold-400" />
          <p className="label mb-0">Chores & responsibilities</p>
        </div>

        {/* Add custom chores */}
        {choresCustom.length > 0 && (
          <div className="space-y-2 mb-3">
            {choresCustom.map((chore) => {
              const done = choresDone.includes(chore);
              return (
                <div key={chore} className="flex items-center gap-2">
                  <button
                    onClick={() => toggleCheck(choresDone, setChoresDone, chore)}
                    className={`flex-1 flex items-center gap-3 text-left text-sm py-2 px-3 rounded-xl border transition-all ${
                      done ? "border-gold-400 bg-gold-50 text-navy-500" : "border-ivory-200 text-navy-400"
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                      done ? "bg-gold-400 border-gold-400" : "border-navy-300"
                    }`}>
                      {done && <span className="text-white text-[10px]">✓</span>}
                    </span>
                    {chore}
                  </button>
                  <button
                    onClick={() => {
                      setChoresCustom((prev) => prev.filter((c) => c !== chore));
                      setChoresDone((prev) => prev.filter((c) => c !== chore));
                    }}
                    className="text-navy-300 hover:text-red-400"
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {addingChore ? (
          <div className="flex gap-2 mb-4">
            <input
              className="input text-sm py-1.5 flex-1"
              placeholder="e.g. Set the table, tidy bedroom..."
              value={newChore}
              onChange={(e) => setNewChore(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newChore.trim()) {
                  setChoresCustom((prev) => [...prev, newChore.trim()]);
                  setNewChore(""); setAddingChore(false);
                }
              }}
              autoFocus
            />
            <button
              onClick={() => { if (newChore.trim()) { setChoresCustom((prev) => [...prev, newChore.trim()]); setNewChore(""); setAddingChore(false); } }}
              className="btn-primary text-xs py-1.5 px-3"
            >Add</button>
            <button onClick={() => { setAddingChore(false); setNewChore(""); }} className="btn-ghost text-xs py-1.5 px-3">Cancel</button>
          </div>
        ) : (
          <button
            onClick={() => setAddingChore(true)}
            className="flex items-center gap-1.5 text-xs text-gold-500 hover:text-gold-600 font-medium mb-4"
          >
            <Plus size={12} /> Add a chore
          </button>
        )}

        {/* Reward */}
        <div>
          <p className="text-sm text-navy-500 font-medium mb-2">Today&apos;s reward for completing chores</p>
          <div className="flex flex-wrap gap-2">
            {CHORE_REWARDS.map((reward) => (
              <button
                key={reward}
                onClick={() => setRewardChosen(rewardChosen === reward ? "" : reward)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  rewardChosen === reward
                    ? "bg-gold-400 border-gold-400 text-white font-medium"
                    : "border-ivory-200 text-navy-400 hover:border-gold-300"
                }`}
              >
                {reward}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Proud moment + parenting note */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <p className="label">✦ Proud moment today</p>
          <p className="text-xs text-navy-400 italic mb-3">Something they did that made your heart full.</p>
          <textarea
            className="textarea min-h-[80px]"
            placeholder="No matter how small — write it down..."
            value={proudMoment}
            onChange={(e) => setProudMoment(e.target.value)}
          />
        </div>

        <div className="card">
          <p className="label">Parenting note</p>
          <p className="text-xs text-navy-400 italic mb-3">Anything to remember, follow up on, or pass to a co-parent.</p>
          <textarea
            className="textarea min-h-[80px]"
            placeholder="Appointments, concerns, wins, next steps..."
            value={parentingNote}
            onChange={(e) => setParentingNote(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
