"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { FinanceEntry } from "@/types";

const CATS = [
  { key: "exp_rent",      label: "Rent / Bills",  color: "#1a2744" },
  { key: "exp_groceries", label: "Groceries",     color: "#d4af54" },
  { key: "exp_children",  label: "Children",      color: "#8b6914" },
  { key: "exp_selfcare",  label: "Self-care",     color: "#b8976a" },
  { key: "exp_savings",   label: "Savings",       color: "#4a6741" },
  { key: "exp_other",     label: "Other",         color: "#9ca3af" },
] as const;

type CatKey = typeof CATS[number]["key"];

interface Props {
  userId: string;
  thisMonth: string;
  initialEntry: FinanceEntry | null;
  history: Partial<FinanceEntry>[];
}

export default function FinanceClient({ userId, thisMonth, initialEntry, history }: Props) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [income, setIncome] = useState(initialEntry?.income ?? 0);
  const [savingsGoal, setSavingsGoal] = useState(initialEntry?.savings_goal ?? 1000);
  const [savingsSaved, setSavingsSaved] = useState(initialEntry?.savings_saved ?? 0);
  const [mindsetNote, setMindsetNote] = useState(initialEntry?.mindset_note ?? "");
  const [expenses, setExpenses] = useState<Record<CatKey, number>>({
    exp_rent:      initialEntry?.exp_rent ?? 0,
    exp_groceries: initialEntry?.exp_groceries ?? 0,
    exp_children:  initialEntry?.exp_children ?? 0,
    exp_selfcare:  initialEntry?.exp_selfcare ?? 0,
    exp_savings:   initialEntry?.exp_savings ?? 0,
    exp_other:     initialEntry?.exp_other ?? 0,
  });

  const totalSpent = Object.values(expenses).reduce((a, b) => a + b, 0);
  const remaining = income - totalSpent;
  const savingsPct = savingsGoal > 0 ? Math.min(100, Math.round((savingsSaved / savingsGoal) * 100)) : 0;

  const save = useCallback(async () => {
    setSaving(true);
    await supabase.from("finance_entries").upsert(
      { user_id: userId, month: thisMonth, income, savings_goal: savingsGoal, savings_saved: savingsSaved, mindset_note: mindsetNote, ...expenses },
      { onConflict: "user_id,month" }
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [supabase, userId, thisMonth, income, savingsGoal, savingsSaved, mindsetNote, expenses]);

  useEffect(() => {
    const t = setTimeout(save, 1400);
    return () => clearTimeout(t);
  }, [save]);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="section-title mb-0">Money Reset</h2>
          <p className="text-navy-400 text-sm mt-1">Your money needs a leader, not shame</p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full border transition-all ${saved ? "bg-gold-50 border-gold-300 text-gold-600" : saving ? "bg-ivory-200 border-ivory-300 text-navy-400" : "bg-ivory-100 border-ivory-200 text-navy-300"}`}>
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

      {/* Income input */}
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

      {/* Expense tracker */}
      <div className="card mb-5">
        <p className="label">Expense tracker</p>
        <div className="space-y-4">
          {CATS.map(({ key, label, color }) => {
            const val = expenses[key];
            const pct = income > 0 ? Math.min(100, (val / income) * 100) : 0;
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-navy-500">{label}</span>
                  <div className="relative w-28">
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
                <div className="progress-bar">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            );
          })}
        </div>
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

      {/* Mindset note */}
      <div className="card card-gold mb-5">
        <p className="label">Money mindset check-in</p>
        <p className="text-xs text-navy-400 italic mb-3">Your money needs a leader — not shame. What&apos;s one thing you&apos;ll do differently?</p>
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
              const sp = (h.exp_rent ?? 0) + (h.exp_groceries ?? 0) + (h.exp_children ?? 0) + (h.exp_selfcare ?? 0) + (h.exp_savings ?? 0) + (h.exp_other ?? 0);
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
