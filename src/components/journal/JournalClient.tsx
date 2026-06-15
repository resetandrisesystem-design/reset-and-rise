"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { JournalEntry } from "@/types";
import { Sparkles, Loader2, Search, X, ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import { format, parseISO } from "date-fns";

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
  userId:      string;
  today:       string;
  initialEntry: JournalEntry | null;
  pastEntries: Partial<JournalEntry>[];
}

export default function JournalClient({ userId, today, initialEntry, pastEntries }: Props) {
  const supabase = createClient();
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Today's entry
  const [selectedPrompt,    setSelectedPrompt]    = useState(initialEntry?.prompt_used       ?? "");
  const [journalText,       setJournalText]        = useState(initialEntry?.journal_text      ?? "");
  const [aiResponse,        setAiResponse]         = useState(initialEntry?.ai_response       ?? "");
  const [gratitude1,        setGratitude1]         = useState(initialEntry?.gratitude_1       ?? "");
  const [gratitude2,        setGratitude2]         = useState(initialEntry?.gratitude_2       ?? "");
  const [gratitude3,        setGratitude3]         = useState(initialEntry?.gratitude_3       ?? "");
  const [tonightIntention,  setTonightIntention]   = useState(initialEntry?.tonight_intention ?? "");

  // History state
  const [historySearch,   setHistorySearch]   = useState("");
  const [expandedEntry,   setExpandedEntry]   = useState<string | null>(null);
  const [showAllHistory,  setShowAllHistory]  = useState(false);
  const [activeTab,       setActiveTab]       = useState<"today" | "history">("today");

  const [shuffledPrompts] = useState(() => [...PROMPTS].sort(() => Math.random() - 0.5).slice(0, 6));
  const affirmation = AFFIRMATIONS[new Date().getDay() % AFFIRMATIONS.length];

  // Filter past entries by search
  const filteredEntries = pastEntries.filter((e) => {
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase();
    return (
      e.journal_text?.toLowerCase().includes(q) ||
      e.prompt_used?.toLowerCase().includes(q) ||
      e.entry_date?.includes(q)
    );
  });

  const displayedEntries = showAllHistory ? filteredEntries : filteredEntries.slice(0, 5);

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
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="section-title mb-0">AI Reset Journal</h2>
          <p className="text-navy-400 text-sm mt-1">This space holds your truth safely</p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full border transition-all ${
          saved   ? "bg-gold-50 border-gold-300 text-gold-600" :
          saving  ? "bg-ivory-200 border-ivory-300 text-navy-400" :
                    "bg-ivory-100 border-ivory-200 text-navy-300"
        }`}>
          {saved ? "✓ Saved" : saving ? "Saving…" : "Auto-save on"}
        </span>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-ivory-200 rounded-xl p-1 mb-6">
        <button
          onClick={() => setActiveTab("today")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "today"
              ? "bg-white text-navy-500 shadow-sm"
              : "text-navy-400 hover:text-navy-500"
          }`}
        >
          Today&apos;s Entry
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            activeTab === "history"
              ? "bg-white text-navy-500 shadow-sm"
              : "text-navy-400 hover:text-navy-500"
          }`}
        >
          <BookOpen size={14} />
          Journal History
          {pastEntries.length > 0 && (
            <span className="bg-gold-400 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {pastEntries.length}
            </span>
          )}
        </button>
      </div>

      {/* TODAY TAB */}
      {activeTab === "today" && (
        <>
          {/* Daily affirmation */}
          <div className="ai-card mb-6">
            <p className="text-xs uppercase tracking-widest text-gold-400 font-medium mb-2">✦ Your affirmation today</p>
            <p className="font-serif text-ivory-100 italic text-lg leading-relaxed">&ldquo;{affirmation}&rdquo;</p>
          </div>

          {/* Date indicator */}
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px flex-1 bg-ivory-200" />
            <span className="text-xs text-navy-400 font-medium">
              {format(parseISO(today), "EEEE, d MMMM yyyy")}
            </span>
            <div className="h-px flex-1 bg-ivory-200" />
          </div>

          {/* Prompt picker */}
          <div className="card mb-5">
            <p className="label">Choose a journal prompt</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {shuffledPrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => { setSelectedPrompt(p); setJournalText(p + "\n\n"); }}
                  className={`text-left text-xs p-3 rounded-xl border transition-all duration-150 leading-relaxed ${
                    selectedPrompt === p
                      ? "border-gold-400 bg-gold-50 text-navy-500"
                      : "border-ivory-300 bg-ivory-50 text-navy-400 hover:border-gold-300 hover:text-navy-500"
                  }`}
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
          <div className="card">
            <p className="label">Tonight&apos;s intention</p>
            <textarea
              className="textarea min-h-[80px]"
              placeholder="What will you release before bed? What do you choose to carry into tomorrow?"
              value={tonightIntention}
              onChange={(e) => setTonightIntention(e.target.value)}
            />
          </div>
        </>
      )}

      {/* HISTORY TAB */}
      {activeTab === "history" && (
        <div>
          {pastEntries.length === 0 ? (
            <div className="card text-center py-12">
              <BookOpen size={32} className="text-navy-300 mx-auto mb-3" />
              <p className="font-serif text-navy-400 italic">No journal entries yet.</p>
              <p className="text-sm text-navy-300 mt-1">Start writing today — your history will appear here.</p>
            </div>
          ) : (
            <>
              {/* Search */}
              <div className="relative mb-5">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
                <input
                  className="input pl-9 pr-9"
                  placeholder="Search your journal entries..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                />
                {historySearch && (
                  <button
                    onClick={() => setHistorySearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-500"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Stats bar */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="stat-card text-center">
                  <p className="font-serif text-3xl text-navy-500 font-medium">{pastEntries.length}</p>
                  <p className="text-xs text-navy-400">Total entries</p>
                </div>
                <div className="stat-card text-center">
                  <p className="font-serif text-3xl text-navy-500 font-medium">
                    {pastEntries.filter((e) => e.ai_response).length}
                  </p>
                  <p className="text-xs text-navy-400">AI responses</p>
                </div>
                <div className="stat-card text-center">
                  <p className="font-serif text-3xl text-navy-500 font-medium">
                    {pastEntries.filter((e) => e.gratitude_1).length}
                  </p>
                  <p className="text-xs text-navy-400">Gratitude days</p>
                </div>
              </div>

              {/* Entry list */}
              <div className="space-y-3">
                {displayedEntries.length === 0 ? (
                  <div className="card text-center py-8">
                    <p className="text-navy-400 text-sm italic">No entries match your search.</p>
                  </div>
                ) : (
                  displayedEntries.map((e) => {
                    const isExpanded = expandedEntry === e.entry_date;
                    return (
                      <div key={e.entry_date} className="card">
                        {/* Entry header */}
                        <button
                          onClick={() => setExpandedEntry(isExpanded ? null : (e.entry_date ?? null))}
                          className="w-full text-left"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="text-xs text-navy-400 font-medium mb-1">
                                {format(parseISO(e.entry_date!), "EEEE, d MMMM yyyy")}
                              </p>
                              {e.prompt_used && (
                                <p className="text-xs text-gold-500 italic mb-1">
                                  &ldquo;{e.prompt_used}&rdquo;
                                </p>
                              )}
                              {!isExpanded && e.journal_text && (
                                <p className="text-sm text-navy-500 leading-relaxed line-clamp-2">
                                  {e.journal_text.slice(0, 150)}{e.journal_text.length > 150 ? "…" : ""}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {e.ai_response && (
                                <span className="text-xs bg-navy-500 text-gold-400 px-2 py-0.5 rounded-full">AI</span>
                              )}
                              {isExpanded
                                ? <ChevronUp size={16} className="text-navy-400" />
                                : <ChevronDown size={16} className="text-navy-400" />
                              }
                            </div>
                          </div>
                        </button>

                        {/* Expanded entry */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-ivory-200 space-y-4">
                            {/* Journal text */}
                            {e.journal_text && (
                              <div>
                                <p className="text-xs text-navy-400 uppercase tracking-wider mb-2">Journal</p>
                                <p className="text-sm text-navy-500 leading-relaxed whitespace-pre-wrap">
                                  {e.journal_text}
                                </p>
                              </div>
                            )}

                            {/* AI response */}
                            {e.ai_response && (
                              <div className="ai-card">
                                <p className="text-xs uppercase tracking-widest text-gold-400 font-medium mb-2">✦ AI Reset Response</p>
                                <p className="text-ivory-100 text-sm leading-relaxed whitespace-pre-wrap">
                                  {e.ai_response}
                                </p>
                              </div>
                            )}

                            {/* Gratitude */}
                            {(e.gratitude_1 || e.gratitude_2 || e.gratitude_3) && (
                              <div className="bg-gold-50 rounded-xl p-3 border border-gold-100">
                                <p className="text-xs text-navy-400 uppercase tracking-wider mb-2">Gratitude</p>
                                <div className="space-y-1">
                                  {[e.gratitude_1, e.gratitude_2, e.gratitude_3].filter(Boolean).map((g, i) => (
                                    <p key={i} className="text-sm text-navy-500">✦ {g}</p>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Tonight's intention */}
                            {e.tonight_intention && (
                              <div>
                                <p className="text-xs text-navy-400 uppercase tracking-wider mb-1">Tonight&apos;s intention</p>
                                <p className="text-sm text-navy-500 italic">{e.tonight_intention}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Show more / less */}
              {filteredEntries.length > 5 && (
                <button
                  onClick={() => setShowAllHistory(!showAllHistory)}
                  className="w-full mt-4 py-3 text-sm text-navy-400 hover:text-navy-500 border border-ivory-200 rounded-xl hover:border-navy-300 transition-all"
                >
                  {showAllHistory
                    ? "Show less ↑"
                    : `Show all ${filteredEntries.length} entries ↓`
                  }
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
