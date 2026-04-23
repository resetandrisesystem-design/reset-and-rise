"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { JournalEntry } from "@/types";
import { Sparkles, Loader2 } from "lucide-react";

const PROMPTS = [
  "What am I carrying that isn't mine to hold?",
  "What does my future self need me to do today?",
  "When did I last feel truly at peace — and what made it so?",
  "What boundary would protect my energy most right now?",
  "What is one thing I'm proud of this week?",
  "What would I do if I knew I couldn't fail?",
  "What does my body need right now that I've been ignoring?",
  "What story about myself am I ready to let go of?",
  "If I could give my past self one piece of advice, what would it be?",
  "What does rising look like for me right now?",
];

const AFFIRMATIONS = [
  "I am not behind. I am brewing. Every small step is an act of rising.",
  "Rest is not laziness — it is how I refill so I can keep rising.",
  "I am allowed to take up space. I am allowed to want more for myself.",
  "My story is not over. The best chapters are still being written.",
  "I choose peace. I choose progress. I choose myself.",
];

interface Props {
  userId: string;
  today: string;
  initialEntry: JournalEntry | null;
  pastEntries: Partial<JournalEntry>[];
}

export default function JournalClient({ userId, today, initialEntry, pastEntries }: Props) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [selectedPrompt, setSelectedPrompt] = useState(initialEntry?.prompt_used ?? "");
  const [journalText, setJournalText] = useState(initialEntry?.journal_text ?? "");
  const [aiResponse, setAiResponse] = useState(initialEntry?.ai_response ?? "");
  const [gratitude1, setGratitude1] = useState(initialEntry?.gratitude_1 ?? "");
  const [gratitude2, setGratitude2] = useState(initialEntry?.gratitude_2 ?? "");
  const [gratitude3, setGratitude3] = useState(initialEntry?.gratitude_3 ?? "");
  const [tonightIntention, setTonightIntention] = useState(initialEntry?.tonight_intention ?? "");

  const [shuffledPrompts] = useState(() => [...PROMPTS].sort(() => Math.random() - 0.5).slice(0, 6));
  const affirmation = AFFIRMATIONS[new Date().getDay() % AFFIRMATIONS.length];

  const save = useCallback(async () => {
    setSaving(true);
    await supabase.from("journal_entries").upsert(
      {
        user_id: userId, entry_date: today,
        prompt_used: selectedPrompt, journal_text: journalText, ai_response: aiResponse,
        gratitude_1: gratitude1, gratitude_2: gratitude2, gratitude_3: gratitude3,
        tonight_intention: tonightIntention,
      },
      { onConflict: "user_id,entry_date" }
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [supabase, userId, today, selectedPrompt, journalText, aiResponse, gratitude1, gratitude2, gratitude3, tonightIntention]);

  useEffect(() => {
    const t = setTimeout(save, 1500);
    return () => clearTimeout(t);
  }, [save]);

  async function getAiResponse() {
    if (!journalText.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai-journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: selectedPrompt, journalText }),
      });
      const data = await res.json();
      setAiResponse(data.response ?? "");
    } catch {
      setAiResponse("Something went wrong. Please try again.");
    }
    setAiLoading(false);
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="section-title mb-0">AI Reset Journal</h2>
          <p className="text-navy-400 text-sm mt-1">This space holds your truth safely</p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full border transition-all ${saved ? "bg-gold-50 border-gold-300 text-gold-600" : saving ? "bg-ivory-200 border-ivory-300 text-navy-400" : "bg-ivory-100 border-ivory-200 text-navy-300"}`}>
          {saved ? "✓ Saved" : saving ? "Saving…" : "Auto-save on"}
        </span>
      </div>

      {/* Daily affirmation */}
      <div className="ai-card mb-6">
        <p className="text-xs uppercase tracking-widest text-gold-400 font-medium mb-2">✦ Your affirmation today</p>
        <p className="font-serif text-ivory-100 italic text-lg leading-relaxed">&ldquo;{affirmation}&rdquo;</p>
      </div>

      {/* Prompt picker */}
      <div className="card mb-5">
        <p className="label">Choose a journal prompt</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {shuffledPrompts.map((p) => (
            <button
              key={p}
              onClick={() => { setSelectedPrompt(p); setJournalText(p + "\n\n"); }}
              className={`text-left text-xs p-3 rounded-xl border transition-all duration-150 leading-relaxed ${selectedPrompt === p ? "border-gold-400 bg-gold-50 text-navy-500" : "border-ivory-300 bg-ivory-50 text-navy-400 hover:border-gold-300 hover:text-navy-500"}`}
            >
              {p}
            </button>
          ))}
        </div>
        <textarea
          className="textarea min-h-[140px]"
          placeholder="Start writing... this space holds your truth safely."
          value={journalText}
          onChange={(e) => setJournalText(e.target.value)}
        />
        <div className="flex gap-3 mt-3">
          <button
            onClick={getAiResponse}
            disabled={aiLoading || !journalText.trim()}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {aiLoading ? "Thinking…" : "Get AI response"}
          </button>
        </div>
      </div>

      {/* AI response */}
      {aiResponse && (
        <div className="ai-card mb-5">
          <p className="text-xs uppercase tracking-widest text-gold-400 font-medium mb-3">✦ Your personalised reset</p>
          <p className="text-ivory-100 text-sm leading-relaxed whitespace-pre-wrap">{aiResponse}</p>
        </div>
      )}

      {/* Gratitude */}
      <div className="card card-gold mb-5">
        <p className="label">Gratitude — 3 things today</p>
        <div className="space-y-3">
          {[
            { val: gratitude1, set: setGratitude1, placeholder: "1. I am grateful for..." },
            { val: gratitude2, set: setGratitude2, placeholder: "2. Something beautiful I noticed..." },
            { val: gratitude3, set: setGratitude3, placeholder: "3. A small win today..." },
          ].map(({ val, set, placeholder }, i) => (
            <input key={i} className="input" placeholder={placeholder} value={val} onChange={(e) => set(e.target.value)} />
          ))}
        </div>
      </div>

      {/* Tonight's intention */}
      <div className="card mb-6">
        <p className="label">Tonight&apos;s intention</p>
        <textarea
          className="textarea min-h-[80px]"
          placeholder="What will you release before bed? What do you choose to carry into tomorrow?"
          value={tonightIntention}
          onChange={(e) => setTonightIntention(e.target.value)}
        />
      </div>

      {/* Past entries */}
      {pastEntries.length > 0 && (
        <div className="card">
          <p className="label">Past journal entries</p>
          <div className="space-y-3">
            {pastEntries.map((e) => (
              <div key={e.entry_date} className="border-b border-ivory-200 pb-3 last:border-0">
                <p className="text-xs text-navy-400 mb-1">
                  {new Date(e.entry_date!).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
                </p>
                {e.prompt_used && <p className="text-xs text-gold-500 italic mb-1">&ldquo;{e.prompt_used}&rdquo;</p>}
                {e.journal_text && (
                  <p className="text-sm text-navy-500 line-clamp-2 leading-relaxed">{e.journal_text.slice(0, 120)}…</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
