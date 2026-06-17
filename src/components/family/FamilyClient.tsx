"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Heart, Users } from "lucide-react";
import { format } from "date-fns";

interface FamilyEntry {
  id?: string;
  user_id?: string;
  entry_date: string;
  connection_focus: string | null;
  loving_action:    string | null;
  family_reflection: string | null;
}

interface Props {
  userId: string;
  today:  string;
  initialEntry: FamilyEntry | null;
  history: Partial<FamilyEntry>[];
}

export default function FamilyClient({ userId, today, initialEntry, history }: Props) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const [connectionFocus,  setConnectionFocus]  = useState(initialEntry?.connection_focus  ?? "");
  const [lovingAction,     setLovingAction]     = useState(initialEntry?.loving_action     ?? "");
  const [familyReflection, setFamilyReflection] = useState(initialEntry?.family_reflection ?? "");

  const save = useCallback(async () => {
    setSaving(true);
    await supabase.from("family_entries").upsert(
      {
        user_id: userId, entry_date: today,
        connection_focus:  connectionFocus,
        loving_action:     lovingAction,
        family_reflection: familyReflection,
      },
      { onConflict: "user_id,entry_date" }
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [supabase, userId, today, connectionFocus, lovingAction, familyReflection]);

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
            <h2 className="section-title mb-0">Family & Connection</h2>
            <span className="text-[10px] bg-gold-100 text-gold-600 px-2 py-0.5 rounded-full font-medium">PREMIUM</span>
          </div>
          <p className="text-navy-400 text-sm mt-1">Create space for presence and meaningful connection</p>
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
        <Heart size={18} className="text-gold-400 flex-shrink-0" />
        <p className="font-serif text-navy-500 italic text-base leading-relaxed">
          &ldquo;The people who matter most need your presence, not your perfection.&rdquo;
        </p>
      </div>

      {/* Connection Focus */}
      <div className="card mb-5">
        <div className="flex items-center gap-2 mb-2">
          <Users size={16} className="text-gold-400" />
          <p className="label mb-0">Connection focus today</p>
        </div>
        <p className="text-xs text-navy-400 italic mb-3">Who do you want to be present with today?</p>
        <input
          className="input"
          placeholder="e.g. My daughter, my partner, my mum..."
          value={connectionFocus}
          onChange={(e) => setConnectionFocus(e.target.value)}
        />
      </div>

      {/* One Loving Action */}
      <div className="card card-gold mb-5">
        <p className="label">One loving action</p>
        <p className="text-xs text-navy-400 italic mb-3">A small act of care you can give today.</p>
        <textarea
          className="textarea min-h-[80px]"
          placeholder="e.g. Put my phone away during dinner, write a kind note, ask how their day really was..."
          value={lovingAction}
          onChange={(e) => setLovingAction(e.target.value)}
        />
      </div>

      {/* Family Reflection */}
      <div className="card mb-5">
        <p className="label">Family reflection</p>
        <p className="text-xs text-navy-400 italic mb-3">How did connection show up today?</p>
        <textarea
          className="textarea min-h-[90px]"
          placeholder="A moment that mattered, a conversation, something you noticed..."
          value={familyReflection}
          onChange={(e) => setFamilyReflection(e.target.value)}
        />
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="card">
          <p className="label">Recent reflections</p>
          <div className="space-y-3">
            {history.slice(0, 5).map((h) => (
              <div key={h.entry_date} className="border-b border-ivory-200 pb-3 last:border-0">
                <p className="text-xs text-navy-400 mb-1">
                  {format(new Date(h.entry_date!), "EEEE, d MMMM")}
                </p>
                {h.connection_focus && (
                  <p className="text-sm text-navy-500"><span className="text-gold-500">Focus:</span> {h.connection_focus}</p>
                )}
                {h.family_reflection && (
                  <p className="text-sm text-navy-400 italic mt-1 line-clamp-2">{h.family_reflection}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
