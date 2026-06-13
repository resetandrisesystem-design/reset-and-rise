"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { FinanceEntry } from "@/types";
import { Pencil, Plus, Trash2, Check, X, Calendar, Bell } from "lucide-react";
import { format, addWeeks, addMonths } from "date-fns";

// Default categories — used if no custom ones saved yet
const DEFAULT_CATS = [
  { key: "exp_rent",      label: "Rent / Bills",  color: "#1a2744" },
  { key: "exp_groceries", label: "Groceries",     color: "#d4af54" },
  { key: "exp_children",  label: "Children",      color: "#8b6914" },
  { key: "exp_selfcare",  label: "Self-care",     color: "#b8976a" },
  { key: "exp_savings",   label: "Savings",       color: "#4a6741" },
  { key: "exp_other",     label: "Other",         color: "#9ca3af" },
];

const CAT_COLORS = [
  "#1a2744", "#d4af54", "#8b6914", "#b8976a",
  "#4a6741", "#9ca3af", "#6b7280", "#b45309",
  "#7c3aed", "#0891b2", "#be185d", "#065f46",
];

const CHECKIN_OPTIONS = [
  { label: "Weekly",     value: "weekly"     },
  { label: "Bi-weekly",  value: "biweekly"   },
  { label: "Monthly",    value: "monthly"    },
  { label: "Bi-monthly", value: "bimonthly"  },
];

interface Category {
  key:   string;
  label: string;
  color: string;
}

interface Props {
  userId:       string;
  thisMonth:    string;
  initialEntry: FinanceEntry | null;
  history:      Partial<FinanceEntry>[];
  savedCats:    Category[] | null;
  checkinData:  { last_checkin: string | null; next_checkin: string | null; frequency: string | null } | null;
}

export default function FinanceClient({
  userId, thisMonth, initialEntry, history, savedCats, checkinData
}: Props) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  // Categories state
  const [cats, setCats] = useState<Category[]>(savedCats ?? DEFAULT_CATS);
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editLabel,  setEditLabel]  = useState("");
  const [addingNew,  setAddingNew]  = useState(false);
  const [newLabel,   setNewLabel]   = useState("");
  const [newColor,   setNewColor]   = useState(CAT_COLORS[0]);

  // Finance state
  const [income,       setIncome]       = useState(initialEntry?.income       ?? 0);
  const [savingsGoal,  setSavingsGoal]  = useState(initialEntry?.savings_goal ?? 1000);
  const [savingsSaved, setSavingsSaved] = useState(initialEntry?.savings_saved ?? 0);
  const [mindsetNote,  setMindsetNote]  = useState(initialEntry?.mindset_note ?? "");
  const [mindsetDate,  setMindsetDate]  = useState<string>(
    (initialEntry as any)?.mindset_date ?? format(new Date(), "yyyy-MM-dd")
  );

  // Check-in scheduler
  const [frequency,    setFrequency]    = useState(checkinData?.frequency   ?? "monthly");
  const [nextCheckin,  setNextCheckin]  = useState(checkinData?.next_checkin ?? "");
  const [showScheduler, setShowScheduler] = useState(false);

  // Dynamic expenses — keyed by category key
  const [expenses, setExpenses] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    cats.forEach(({ key }) => {
      init[key] = (initialEntry as any)?.[key] ?? 0;
    });
    return init;
  });

  const totalSpent = Object.values(expenses).reduce((a, b) => a + b, 0);
  const remaining  = income - totalSpent;
  const savingsPct = savingsGoal > 0 ? Math.min(100, Math.round((savingsSaved / savingsGoal) * 100)) : 0;

  // Save finance entry
  const save = useCallback(async () => {
    setSaving(true);

    // Build expense columns (only original 6 fixed keys go in finance_entries)
    const expCols: Record<string, number> = {
      exp_rent:      expenses["exp_rent"]      ?? 0,
      exp_groceries: expenses["exp_groceries"] ?? 0,
      exp_children:  expenses["exp_children"]  ?? 0,
      exp_selfcare:  expenses["exp_selfcare"]  ?? 0,
      exp_savings:   expenses["exp_savings"]   ?? 0,
      exp_other:     expenses["exp_other"]     ?? 0,
    };

    await Promise.all([
      // Save finance entry
      supabase.from("finance_entries").upsert(
        {
          user_id: userId, month: thisMonth,
          income, savings_goal: savingsGoal, savings_saved: savingsSaved,
          mindset_note: mindsetNote,
          mindset_date: mindsetDate,
          custom_expenses: JSON.stringify(expenses),
          ...expCols,
        },
        { onConflict: "user_id,month" }
      ),
      // Save custom categories
      supabase.from("user_finance_settings").upsert(
        {
          user_id:    userId,
          categories: JSON.stringify(cats),
          frequency,
          next_checkin: nextCheckin || null,
          last_checkin: format(new Date(), "yyyy-MM-dd"),
        },
        { onConflict: "user_id" }
      ),
    ]);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [supabase, userId, thisMonth, income, savingsGoal, savingsSaved,
      mindsetNote, mindsetDate, expenses, cats, frequency, nextCheckin]);

  useEffect(() => {
    const t = setTimeout(save, 1400);
    return () => clearTimeout(t);
  }, [save]);

  // Category management
  function startEdit(cat: Category) {
    setEditingCat(cat.key);
    setEditLabel(cat.label);
  }

  function saveEdit(key: string) {
    setCats((prev) => prev.map((c) => c.key === key ? { ...c, label: editLabel } : c));
    setEditingCat(null);
  }

  function deleteCat(key: string) {
    setCats((prev) => prev.filter((c) => c.key !== key));
    setExpenses((prev) => { const n = { ...prev }; delete n[key]; return n; });
  }

  function addCategory() {
    if (!newLabel.trim()) return;
    const key = `exp_custom_${Date.now()}`;
    setCats((prev) => [...prev, { key, label: newLabel.trim(), color: newColor }]);
    setExpenses((prev) => ({ ...prev, [key]: 0 }));
    setNewLabel("");
    setAddingNew(false);
  }

  // Schedule next check-in
  function scheduleCheckin(freq: string) {
    setFrequency(freq);
    const now = new Date();
    let next: Date;
    if      (freq === "weekly")    next = addWeeks(now, 1);
    else if (freq === "biweekly")  next = addWeeks(now, 2);
    else if (freq === "monthly")   next = addMonths(now, 1);
    else                           next = addMonths(now, 2);
    setNextCheckin(format(next, "yyyy-MM-dd"));
    setShowScheduler(false);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="section-title mb-0">Money Reset</h2>
          <p className="text-navy-400 text-sm mt-1">Your money needs a leader, not shame</p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full border transition-all ${
          saved   ? "bg-gold-50 border-gold-300 text-gold-600" :
          saving  ? "bg-ivory-200 border-ivory-300 text-navy-400" :
                    "bg-ivory-100 border-ivory-200 text-navy-300"
        }`}>
          {saved ? "✓ Saved" : saving ? "Saving…" : "Auto-save on"}
        </span>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <p className="label">Income</p>
          <p className="font-serif text-3xl font-medium text-navy-500">£{income.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="label">Spent</p>
          <p className="font-serif text-3xl font-medium text-navy-500">£{totalSpent.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="label">Remaining</p>
          <p className={`font-serif text-3xl font-medium ${remaining >= 0 ? "text-gold-500" : "text-red-500"}`}>
            {remaining < 0 ? "-" : ""}£{Math.abs(remaining).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Income */}
      <div className="card card-gold mb-5">
        <p className="label">Monthly income</p>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400 font-medium">£</span>
          <input
            type="number"
            className="input pl-7"
            placeholder="0"
            value={income || ""}
            onChange={(e) => setIncome(Number(e.target.value))}
          />
        </div>
      </div>

      {/* Expense tracker with custom categories */}
      <div className="card mb-5">
        <div className="flex items-center justify-between mb-4">
          <p className="label mb-0">Expense tracker</p>
          <button
            onClick={() => setAddingNew(true)}
            className="flex items-center gap-1.5 text-xs text-gold-500 hover:text-gold-600 font-medium transition-colors"
          >
            <Plus size={14} />
            Add category
          </button>
        </div>

        <div className="space-y-4">
          {cats.map(({ key, label, color }) => {
            const val = expenses[key] ?? 0;
            const pct = income > 0 ? Math.min(100, (val / income) * 100) : 0;
            const isEditing = editingCat === key;

            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1 gap-2">
                  {/* Label — editable */}
                  {isEditing ? (
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        className="input py-1 text-sm h-7 flex-1"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveEdit(key)}
                        autoFocus
                      />
                      <button onClick={() => saveEdit(key)} className="text-gold-500 hover:text-gold-600">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setEditingCat(null)} className="text-navy-400 hover:text-navy-500">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 flex-1">
                      <span className="text-sm text-navy-500">{label}</span>
                      <button
                        onClick={() => startEdit({ key, label, color })}
                        className="text-navy-300 hover:text-gold-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Pencil size={11} />
                      </button>
                      {/* Show edit/delete on hover */}
                      <div className="flex gap-1 ml-1">
                        <button onClick={() => startEdit({ key, label, color })} className="text-navy-300 hover:text-gold-400">
                          <Pencil size={11} />
                        </button>
                        <button onClick={() => deleteCat(key)} className="text-navy-300 hover:text-red-400">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Amount input */}
                  <div className="relative w-28 flex-shrink-0">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400 text-xs">£</span>
                    <input
                      type="number"
                      className="input pl-6 py-1.5 text-sm h-8"
                      placeholder="0"
                      value={val || ""}
                      onChange={(e) => setExpenses((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                {/* Progress bar */}
                <div className="progress-bar">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Add new category form */}
        {addingNew && (
          <div className="mt-4 p-4 bg-ivory-100 rounded-xl border border-ivory-200">
            <p className="text-sm text-navy-500 font-medium mb-3">New category</p>
            <div className="flex gap-2 mb-3">
              <input
                className="input flex-1"
                placeholder="Category name (e.g. Mortgage, Transport)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCategory()}
                autoFocus
              />
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {CAT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${newColor === c ? "border-navy-500 scale-110" : "border-transparent"}`}
                  style={{ background: c }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={addCategory} className="btn-primary text-sm py-1.5">
                Add
              </button>
              <button onClick={() => { setAddingNew(false); setNewLabel(""); }} className="btn-ghost text-sm py-1.5">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Savings goal */}
      <div className="card mb-5">
        <p className="label">Savings goal tracker</p>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="label text-xs">Goal (£)</label>
            <input type="number" className="input" value={savingsGoal || ""} onChange={(e) => setSavingsGoal(Number(e.target.value))} />
          </div>
          <div>
            <label className="label text-xs">Saved so far (£)</label>
            <input type="number" className="input" value={savingsSaved || ""} onChange={(e) => setSavingsSaved(Number(e.target.value))} />
          </div>
        </div>
        <div className="progress-bar mb-2">
          <div className="progress-fill" style={{ width: `${savingsPct}%` }} />
        </div>
        <div className="flex justify-between text-xs text-navy-400">
          <span>£{savingsSaved.toLocaleString()} saved</span>
          <span className="font-medium text-navy-500">{savingsPct}%</span>
          <span>Goal: £{savingsGoal.toLocaleString()}</span>
        </div>
      </div>

      {/* Money mindset check-in with date + scheduler */}
      <div className="card card-gold mb-5">
        <div className="flex items-start justify-between mb-2">
          <p className="label mb-0">Money mindset check-in</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-navy-400 flex items-center gap-1">
              <Calendar size={11} />
              {format(new Date(mindsetDate), "d MMM yyyy")}
            </span>
            <button
              onClick={() => setShowScheduler(!showScheduler)}
              className="flex items-center gap-1 text-xs text-gold-500 hover:text-gold-600 font-medium"
            >
              <Bell size={11} />
              Schedule
            </button>
          </div>
        </div>

        {/* Scheduler dropdown */}
        {showScheduler && (
          <div className="bg-white rounded-xl border border-gold-200 p-3 mb-3">
            <p className="text-xs text-navy-500 font-medium mb-2">How often do you want to check in?</p>
            <div className="grid grid-cols-2 gap-2">
              {CHECKIN_OPTIONS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => scheduleCheckin(value)}
                  className={`text-xs py-2 px-3 rounded-lg border transition-all ${
                    frequency === value
                      ? "bg-gold-400 border-gold-400 text-white font-medium"
                      : "border-ivory-200 text-navy-400 hover:border-gold-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {nextCheckin && (
              <p className="text-xs text-navy-400 mt-2 italic">
                Next check-in: {format(new Date(nextCheckin), "d MMMM yyyy")}
              </p>
            )}
          </div>
        )}

        {nextCheckin && !showScheduler && (
          <p className="text-xs text-navy-400 italic mb-2 flex items-center gap-1">
            <Bell size={10} className="text-gold-400" />
            Next check-in: {format(new Date(nextCheckin), "d MMMM yyyy")}
          </p>
        )}

        <p className="text-xs text-navy-400 italic mb-3">
          Your money needs a leader — not shame. What&apos;s one thing you&apos;ll do differently?
        </p>
        <textarea
          className="textarea min-h-[80px]"
          placeholder="Write freely about your relationship with money this month..."
          value={mindsetNote}
          onChange={(e) => setMindsetNote(e.target.value)}
        />
      </div>

      {/* History */}
      {history.length > 1 && (
        <div className="card">
          <p className="label">Recent months</p>
          <div className="space-y-2">
            {history.map((h) => {
              const sp  = (h.exp_rent ?? 0) + (h.exp_groceries ?? 0) + (h.exp_children ?? 0) + (h.exp_selfcare ?? 0) + (h.exp_savings ?? 0) + (h.exp_other ?? 0);
              const rem = (h.income ?? 0) - sp;
              return (
                <div key={h.month} className="flex items-center justify-between text-sm py-2 border-b border-ivory-200 last:border-0">
                  <span className="text-navy-400">{h.month}</span>
                  <span className="text-navy-500">Income £{(h.income ?? 0).toLocaleString()}</span>
                  <span className={rem >= 0 ? "text-gold-500 font-medium" : "text-red-500 font-medium"}>
                    {rem >= 0 ? "+" : "-"}£{Math.abs(rem).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
