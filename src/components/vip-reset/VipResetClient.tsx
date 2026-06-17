"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Wind, Feather, ArrowRight } from "lucide-react";
import { format } from "date-fns";

interface VipResetEntry {
  id?: string;
  user_id?: string;
  entry_date: string;
  feels_heavy: string | null;
  can_simplify: string | null;
  one_step:     string | null;
}

interface Props {
  userId: string;
  today:  string;
  initialEntry: VipResetEntry | null;
}

export default function VipResetClient({ userId, today, initialEntry }: Props) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const [feelsHeavy,   setFeelsHeavy]   = useState(initialEntry?.feels_heavy   ?? "");
  const [canSimplify,  setCanSimplify]  = useState(initialEntry?.can_simplify  ?? "");
  const [oneStep,      setOneStep]      = useState(initialEntry?.one_step      ?? "");

  const save = useCallback(async () => {
    setSaving(true);
    await supabase.from("vip_reset_entries").upsert(
      { user_id: userId, entry_date: today, feels_heavy: feelsHeavy, can_simplify: canSimplify, one_step: oneStep },
      { onConflict: "user_id,entry_date" }
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [supabase, userId, today, feelsHeavy, canSimplify, oneStep]);

  useEffect(() => {
    const t = setTimeout(save, 1300);
    return () => clearTimeout(t);
  }, [save]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="section-title mb-0">Weekly Reset</h2>
            <span className="text-[10px] bg-navy-500 text-gold-400 px-2 py-0.5 rounded-full font-medium">VIP</span>
          </div>
          <p className="text-navy-400 text-sm mt-1">Use this when life feels messy</p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full border transition-all ${
          saved   ? "bg-gold-50 border-gold-300 text-gold-600" :
          saving  ? "bg-ivory-200 border-ivory-300 text-navy-400" :
                    "bg-ivory-100 border-ivory-200 text-navy-300"
        }`}>
          {saved ? "✓ Saved" : saving ? "Saving…" : "Auto-save on"}
        </span>
      </div>

      {/* Calming intro */}
      <div className="ai-card mb-6 text-center">
        <Wind size={24} className="text-gold-400 mx-auto mb-3" />
        <p className="font-serif text-ivory-100 italic text-lg leading-relaxed">
          &ldquo;Breathe. You don&apos;t have to fix everything right now. Just this.&rdquo;
        </p>
      </div>

      {/* What feels heavy */}
      <div className="card mb-5">
        <p className="label">What feels heavy right now?</p>
        <p className="text-xs text-navy-400 italic mb-3">Let it all out — no judgment, no filter.</p>
        <textarea
          className="textarea min-h-[110px]"
          placeholder="Name it. Sometimes that's the first relief..."
          value={feelsHeavy}
          onChange={(e) => setFeelsHeavy(e.target.value)}
        />
      </div>

      {/* What can I simplify */}
      <div className="card card-gold mb-5">
        <div className="flex items-center gap-2 mb-2">
          <Feather size={16} className="text-gold-400" />
          <p className="label mb-0">What can I simplify?</p>
        </div>
        <p className="text-xs text-navy-400 italic mb-3">What can you let go of, delegate, or do less perfectly?</p>
        <textarea
          className="textarea min-h-[90px]"
          placeholder="Maybe it's saying no, asking for help, lowering the bar just for now..."
          value={canSimplify}
          onChange={(e) => setCanSimplify(e.target.value)}
        />
      </div>

      {/* One small step forward */}
      <div className="card">
        <div className="flex items-center gap-2 mb-2">
          <ArrowRight size={16} className="text-gold-400" />
          <p className="label mb-0">One small step forward</p>
        </div>
        <p className="text-xs text-navy-400 italic mb-3">Just one. Not the whole mountain — just the next step.</p>
        <input
          className="input"
          placeholder="e.g. Send that one email, drink some water, take 5 minutes..."
          value={oneStep}
          onChange={(e) => setOneStep(e.target.value)}
        />
      </div>
    </div>
  );
}
