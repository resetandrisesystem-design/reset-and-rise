"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Target, Image as ImageIcon, Trophy, Plus, X } from "lucide-react";
import { format } from "date-fns";

interface GoalsEntry {
  id?: string;
  user_id?: string;
  quarter: string; // e.g. "2026-Q2"
  vision_board_notes: string | null;
  quarterly_goals:    string | null; // JSON: string[]
  milestone_1: string | null;
  milestone_2: string | null;
  milestone_3: string | null;
  weekly_wins: string | null; // JSON: string[]
}

interface Props {
  userId:  string;
  quarter: string;
  initialEntry: GoalsEntry | null;
}

function getCurrentQuarter(): string {
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3) + 1;
  return `${now.getFullYear()}-Q${q}`;
}

export default function GoalsClient({ userId, quarter, initialEntry }: Props) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const [visionNotes, setVisionNotes] = useState(initialEntry?.vision_board_notes ?? "");
  const [milestone1,  setMilestone1]  = useState(initialEntry?.milestone_1 ?? "");
  const [milestone2,  setMilestone2]  = useState(initialEntry?.milestone_2 ?? "");
  const [milestone3,  setMilestone3]  = useState(initialEntry?.milestone_3 ?? "");

  const [goals, setGoals] = useState<string[]>(() => {
    try {
      const parsed = JSON.parse(initialEntry?.quarterly_goals ?? "[]");
      return parsed.length ? parsed : ["", "", ""];
    } catch { return ["", "", ""]; }
  });

  const [wins, setWins] = useState<string[]>(() => {
    try { return JSON.parse(initialEntry?.weekly_wins ?? "[]"); } catch { return []; }
  });
  const [newWin, setNewWin] = useState("");

  const save = useCallback(async () => {
    setSaving(true);
    await supabase.from("goals_entries").upsert(
      {
        user_id: userId, quarter,
        vision_board_notes: visionNotes,
        quarterly_goals: JSON.stringify(goals),
        milestone_1: milestone1, milestone_2: milestone2, milestone_3: milestone3,
        weekly_wins: JSON.stringify(wins),
      },
      { onConflict: "user_id,quarter" }
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [supabase, userId, quarter, visionNotes, goals, milestone1, milestone2, milestone3, wins]);

  useEffect(() => {
    const t = setTimeout(save, 1300);
    return () => clearTimeout(t);
  }, [save]);

  function updateGoal(i: number, value: string) {
    setGoals((prev) => { const n = [...prev]; n[i] = value; return n; });
  }

  function addWin() {
    if (!newWin.trim()) return;
    setWins((prev) => [newWin.trim(), ...prev]);
    setNewWin("");
  }

  function removeWin(i: number) {
    setWins((prev) => prev.filter((_, idx) => idx !== i));
  }

  const quarterLabel = quarter.replace("-", " ");

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="section-title mb-0">Goal Setting & Growth</h2>
            <span className="text-[10px] bg-gold-100 text-gold-600 px-2 py-0.5 rounded-full font-medium">PREMIUM</span>
          </div>
          <p className="text-navy-400 text-sm mt-1">{quarterLabel} — Dream it, plan it, become it</p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full border transition-all ${
          saved   ? "bg-gold-50 border-gold-300 text-gold-600" :
          saving  ? "bg-ivory-200 border-ivory-300 text-navy-400" :
                    "bg-ivory-100 border-ivory-200 text-navy-300"
        }`}>
          {saved ? "✓ Saved" : saving ? "Saving…" : "Auto-save on"}
        </span>
      </div>

      {/* Vision Board */}
      <div className="card mb-5">
        <div className="flex items-center gap-2 mb-2">
          <ImageIcon size={16} className="text-gold-400" />
          <p className="label mb-0">Vision board</p>
        </div>
        <p className="text-xs text-navy-400 italic mb-3">
          Describe your vision in words — what does the life you&apos;re building look, feel and sound like?
        </p>
        <textarea
          className="textarea min-h-[120px]"
          placeholder="Picture yourself 3 months from now. What has changed? What are you proud of? What does your day look like?"
          value={visionNotes}
          onChange={(e) => setVisionNotes(e.target.value)}
        />
      </div>

      {/* Quarterly Goals */}
      <div className="card card-gold mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Target size={16} className="text-gold-400" />
          <p className="label mb-0">Quarterly goals</p>
        </div>
        <div className="space-y-3">
          {goals.map((g, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="font-serif text-2xl text-gold-400 font-medium w-6 flex-shrink-0">{i + 1}</span>
              <input
                className="input"
                placeholder={`Goal ${i + 1} for this quarter...`}
                value={g}
                onChange={(e) => updateGoal(i, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Milestones */}
      <div className="card mb-5">
        <p className="label">Milestones</p>
        <p className="text-xs text-navy-400 italic mb-3">Key checkpoints along the way to your goals.</p>
        <div className="space-y-3">
          {[
            { val: milestone1, set: setMilestone1, placeholder: "Milestone 1 — e.g. Complete first draft..." },
            { val: milestone2, set: setMilestone2, placeholder: "Milestone 2 — e.g. Launch the new offer..." },
            { val: milestone3, set: setMilestone3, placeholder: "Milestone 3 — e.g. Hit savings target..." },
          ].map(({ val, set, placeholder }, i) => (
            <input key={i} className="input" placeholder={placeholder} value={val} onChange={(e) => set(e.target.value)} />
          ))}
        </div>
      </div>

      {/* Weekly Wins */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Trophy size={16} className="text-gold-400" />
          <p className="label mb-0">Weekly wins</p>
        </div>
        <p className="text-xs text-navy-400 italic mb-3">Celebrate progress — big or small.</p>

        <div className="flex gap-2 mb-4">
          <input
            className="input flex-1"
            placeholder="Add a win from this week..."
            value={newWin}
            onChange={(e) => setNewWin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addWin()}
          />
          <button onClick={addWin} className="btn-primary px-4 flex items-center gap-1.5">
            <Plus size={14} /> Add
          </button>
        </div>

        {wins.length > 0 ? (
          <div className="space-y-2">
            {wins.map((w, i) => (
              <div key={i} className="flex items-center justify-between bg-gold-50 rounded-xl px-4 py-2.5 border border-gold-100">
                <span className="text-sm text-navy-500 flex items-center gap-2">
                  <Trophy size={13} className="text-gold-400" />
                  {w}
                </span>
                <button onClick={() => removeWin(i)} className="text-navy-300 hover:text-red-400">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-navy-300 italic text-center py-4">No wins added yet — start small!</p>
        )}
      </div>
    </div>
  );
}
