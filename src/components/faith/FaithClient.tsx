"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import RefreshableQuote from "@/components/ui/RefreshableQuote";

// ── CHRISTIAN content ──
const CHRISTIAN_AFFIRMATIONS = [
  "I am held. I am guided. I am not alone.",
  "God's timing is perfect, even when I don't understand it.",
  "I release what I cannot control and trust what I cannot see.",
  "My faith is bigger than my fear.",
  "I am being restored, renewed and redirected.",
  "This season is not my final chapter.",
  "I walk by faith, not by sight.",
  "I am worthy of rest, grace and peace.",
  "God goes before me — I do not walk alone.",
  "I am rooted in His love, even when I feel lost.",
];

const CHRISTIAN_SCRIPTURES = [
  "Philippians 4:13 — I can do all things through Christ who strengthens me.",
  "Isaiah 40:31 — Those who hope in the Lord will renew their strength.",
  "Jeremiah 29:11 — For I know the plans I have for you, plans to prosper you.",
  "Psalm 46:10 — Be still and know that I am God.",
  "Proverbs 3:5-6 — Trust in the Lord with all your heart.",
  "Romans 8:28 — All things work together for good to those who love God.",
  "Matthew 11:28 — Come to me, all you who are weary, and I will give you rest.",
  "Psalm 23:1 — The Lord is my shepherd; I shall not want.",
];

const CHRISTIAN_PRAYER_PLACEHOLDER = "Lord, today I bring you...";
const CHRISTIAN_HEALING_PROMPT = "What area of your life needs God's healing touch right now?";
const CHRISTIAN_HEALING_PLACEHOLDER = "In my body / mind / relationships / finances / heart...";
const CHRISTIAN_EVENING_PROMPT = "How did you see God move today? What are you releasing before rest?";
const CHRISTIAN_EVENING_PLACEHOLDER = "Today I saw God in... Before I sleep I release...";
const CHRISTIAN_MONTHLY_PROMPTS = [
  "How has my faith grown this month?",
  "Where did I feel God most clearly?",
  "What did I struggle to surrender?",
  "What is God calling me toward next month?",
];
const CHRISTIAN_SERMON_LABEL = "📝 Sermon / message notes";
const CHRISTIAN_SERMON_PLACEHOLDER = "e.g. Sunday service — Pastor James...";
const CHRISTIAN_SERMON_NOTES_PLACEHOLDER = "Key points, scriptures mentioned, what stood out...";

// ── GENERIC content ──
const GENERIC_AFFIRMATIONS = [
  "I am enough, exactly as I am right now.",
  "I trust the timing of my own journey.",
  "I release what I cannot control and embrace what I can.",
  "Peace is available to me in every moment.",
  "I am being shaped by every experience, even the hard ones.",
  "This season is preparing me for what's next.",
  "I choose intention over reaction today.",
  "I am worthy of rest, stillness and care.",
  "I do not have to carry everything — I can set things down.",
  "I am growing, even when I cannot see it.",
];

const GENERIC_REFLECTIONS = [
  "A mantra or intention for today...",
  "Something I want to let go of...",
  "What would bring me peace right now...",
  "A moment of stillness I can find today...",
  "Something I believe about myself that I want to remember...",
];

const GENERIC_PRAYER_PLACEHOLDER = "What's on your heart today? Write it out freely...";
const GENERIC_HEALING_PROMPT = "What area of your life needs attention and care right now?";
const GENERIC_HEALING_PLACEHOLDER = "In my body / mind / relationships / work / heart...";
const GENERIC_EVENING_PROMPT = "How did today feel? What are you choosing to release before rest?";
const GENERIC_EVENING_PLACEHOLDER = "Today I noticed... Before I sleep I am releasing...";
const GENERIC_MONTHLY_PROMPTS = [
  "How have I grown this month?",
  "When did I feel most at peace?",
  "What did I find hard to let go of?",
  "What am I being called toward next month?",
];
const GENERIC_SERMON_LABEL = "📝 Talk / podcast / reading notes";
const GENERIC_SERMON_PLACEHOLDER = "e.g. Podcast — Brené Brown, Community talk, Book chapter...";
const GENERIC_SERMON_NOTES_PLACEHOLDER = "Key ideas, quotes, what resonated, what I want to remember...";

const GRATITUDE_PROMPTS = [
  "Today I am grateful for...",
  "A small blessing I noticed today...",
  "Someone who showed me kindness...",
  "A challenge that taught me something...",
  "A moment of peace I experienced...",
];

const PRAYER_CATEGORIES = [
  { key: "gratitude",  label: "Gratitude",    emoji: "🙏" },
  { key: "guidance",   label: "Guidance",      emoji: "✨" },
  { key: "healing",    label: "Healing",       emoji: "💛" },
  { key: "family",     label: "Family",        emoji: "👨‍👩‍👧" },
  { key: "provision",  label: "Provision",     emoji: "🌿" },
  { key: "peace",      label: "Peace",         emoji: "🕊️" },
] as const;

type FaithMode = "christian" | "generic";

interface FaithEntry {
  id?: string;
  user_id?: string;
  entry_date: string;
  faith_mode:         string | null;
  morning_prayer:     string | null;
  scripture_today:    string | null;
  scripture_note:     string | null;
  gratitude_1:        string | null;
  gratitude_2:        string | null;
  gratitude_3:        string | null;
  prayer_categories:  string | null;
  prayer_requests:    string | null;
  sermon_notes:       string | null;
  sermon_title:       string | null;
  healing_prompt:     string | null;
  evening_reflection: string | null;
  monthly_reset:      string | null;
  faith_intention:    string | null;
}

interface Props {
  userId: string;
  today:  string;
  initialEntry: FaithEntry | null;
}

export default function FaithClient({ userId, today, initialEntry }: Props) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [promptIdx, setPromptIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<"daily" | "sermon" | "monthly">("daily");

  // Religion mode — persisted in the entry
  const [faithMode, setFaithMode] = useState<FaithMode>(
    (initialEntry?.faith_mode as FaithMode) ?? "christian"
  );

  // Content based on mode
  const affirmations = faithMode === "christian" ? CHRISTIAN_AFFIRMATIONS : GENERIC_AFFIRMATIONS;
  const scriptures   = faithMode === "christian" ? CHRISTIAN_SCRIPTURES : GENERIC_REFLECTIONS;
  const sermonLabel  = faithMode === "christian" ? CHRISTIAN_SERMON_LABEL : GENERIC_SERMON_LABEL;
  const sermonPlaceholder = faithMode === "christian" ? CHRISTIAN_SERMON_PLACEHOLDER : GENERIC_SERMON_PLACEHOLDER;
  const sermonNotesPlaceholder = faithMode === "christian" ? CHRISTIAN_SERMON_NOTES_PLACEHOLDER : GENERIC_SERMON_NOTES_PLACEHOLDER;
  const monthlyPrompts = faithMode === "christian" ? CHRISTIAN_MONTHLY_PROMPTS : GENERIC_MONTHLY_PROMPTS;
  const prayerPlaceholder = faithMode === "christian" ? CHRISTIAN_PRAYER_PLACEHOLDER : GENERIC_PRAYER_PLACEHOLDER;
  const healingPromptText = faithMode === "christian" ? CHRISTIAN_HEALING_PROMPT : GENERIC_HEALING_PROMPT;
  const healingPlaceholder = faithMode === "christian" ? CHRISTIAN_HEALING_PLACEHOLDER : GENERIC_HEALING_PLACEHOLDER;
  const eveningPromptText = faithMode === "christian" ? CHRISTIAN_EVENING_PROMPT : GENERIC_EVENING_PROMPT;
  const eveningPlaceholder = faithMode === "christian" ? CHRISTIAN_EVENING_PLACEHOLDER : GENERIC_EVENING_PLACEHOLDER;
  const affirmationLabel = faithMode === "christian" ? "✦ Your faith affirmation today" : "✦ Your affirmation today";
  const scriptureLabel   = faithMode === "christian" ? "📖 Scripture for today" : "📖 Reflection or intention";
  const prayerLabel      = faithMode === "christian" ? "🙏 Morning prayer" : "🙏 Morning intention";
  const prayerBeginText  = faithMode === "christian" ? "Begin with stillness. What do you want to bring before God today?" : "Begin with stillness. What do you want to set as your intention today?";

  const [morningPrayer,     setMorningPrayer]     = useState(initialEntry?.morning_prayer     ?? "");
  const [scriptureToday,    setScriptureToday]     = useState(initialEntry?.scripture_today    ?? "");
  const [scriptureNote,     setScriptureNote]      = useState(initialEntry?.scripture_note     ?? "");
  const [gratitude1,        setGratitude1]         = useState(initialEntry?.gratitude_1        ?? "");
  const [gratitude2,        setGratitude2]         = useState(initialEntry?.gratitude_2        ?? "");
  const [gratitude3,        setGratitude3]         = useState(initialEntry?.gratitude_3        ?? "");
  const [prayerRequests,    setPrayerRequests]     = useState(initialEntry?.prayer_requests    ?? "");
  const [sermonTitle,       setSermonTitle]        = useState(initialEntry?.sermon_title       ?? "");
  const [sermonNotes,       setSermonNotes]        = useState(initialEntry?.sermon_notes       ?? "");
  const [healingPrompt,     setHealingPrompt]      = useState(initialEntry?.healing_prompt     ?? "");
  const [eveningReflection, setEveningReflection] = useState(initialEntry?.evening_reflection ?? "");
  const [monthlyReset,      setMonthlyReset]      = useState(initialEntry?.monthly_reset      ?? "");
  const [faithIntention,    setFaithIntention]    = useState(initialEntry?.faith_intention    ?? "");
  const [prayerCategories,  setPrayerCategories]  = useState<string[]>(() => {
    try { return JSON.parse(initialEntry?.prayer_categories ?? "[]"); } catch { return []; }
  });

  const save = useCallback(async () => {
    setSaving(true);
    await supabase.from("faith_entries").upsert(
      {
        user_id: userId, entry_date: today,
        faith_mode: faithMode,
        morning_prayer: morningPrayer, scripture_today: scriptureToday,
        scripture_note: scriptureNote,
        gratitude_1: gratitude1, gratitude_2: gratitude2, gratitude_3: gratitude3,
        prayer_categories: JSON.stringify(prayerCategories),
        prayer_requests: prayerRequests,
        sermon_title: sermonTitle, sermon_notes: sermonNotes,
        healing_prompt: healingPrompt, evening_reflection: eveningReflection,
        monthly_reset: monthlyReset, faith_intention: faithIntention,
      },
      { onConflict: "user_id,entry_date" }
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [supabase, userId, today, faithMode, morningPrayer, scriptureToday, scriptureNote,
      gratitude1, gratitude2, gratitude3, prayerCategories, prayerRequests,
      sermonTitle, sermonNotes, healingPrompt, eveningReflection, monthlyReset, faithIntention]);

  useEffect(() => {
    const t = setTimeout(save, 1400);
    return () => clearTimeout(t);
  }, [save]);

  function toggleCategory(key: string) {
    setPrayerCategories((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="section-title mb-0">Faith & Renewal</h2>
            <span className="text-[10px] bg-navy-500 text-gold-400 px-2 py-0.5 rounded-full font-medium">VIP</span>
          </div>
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

      {/* Faith mode selector */}
      <div className="card mb-5">
        <p className="label mb-3">My faith tradition</p>
        <div className="grid grid-cols-2 gap-3">
          {([
            { key: "christian", label: "Christian", emoji: "✝️", desc: "Bible scriptures, prayer, sermon notes" },
            { key: "generic",   label: "Universal",  emoji: "🌿", desc: "Affirmations, intentions, reflection" },
          ] as const).map(({ key, label, emoji, desc }) => (
            <button
              key={key}
              onClick={() => setFaithMode(key)}
              className={`flex flex-col items-start gap-1 p-4 rounded-xl border text-left transition-all ${
                faithMode === key
                  ? "border-gold-400 bg-gold-50"
                  : "border-ivory-200 bg-white hover:border-gold-300"
              }`}
            >
              <span className="text-xl">{emoji}</span>
              <span className={`text-sm font-medium ${faithMode === key ? "text-navy-500" : "text-navy-400"}`}>
                {label}
              </span>
              <span className="text-xs text-navy-400">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Refreshable affirmation */}
      <RefreshableQuote
        quotes={affirmations}
        label={affirmationLabel}
        variant="dark"
      />

      {/* Tab switcher */}
      <div className="flex gap-1 bg-ivory-200 rounded-xl p-1 mb-6">
        {[
          { key: "daily",   label: "Daily Reset"   },
          { key: "sermon",  label: faithMode === "christian" ? "Sermon Notes" : "Notes & Reading" },
          { key: "monthly", label: "Monthly Reset" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === key
                ? "bg-white text-navy-500 shadow-sm"
                : "text-navy-400 hover:text-navy-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── DAILY TAB ── */}
      {activeTab === "daily" && (
        <div className="space-y-5">
          {/* Morning prayer / intention */}
          <div className="card">
            <p className="label">{prayerLabel}</p>
            <p className="text-xs text-navy-400 italic mb-3">{prayerBeginText}</p>
            <textarea
              className="textarea min-h-[100px]"
              placeholder={prayerPlaceholder}
              value={morningPrayer}
              onChange={(e) => setMorningPrayer(e.target.value)}
            />
          </div>

          {/* Scripture / reflection */}
          <div className="card card-gold">
            <p className="label">{scriptureLabel}</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {scriptures.slice(0, 4).map((s) => {
                const shortLabel = faithMode === "christian" ? s.split(" — ")[0] : s.substring(0, 30) + "...";
                const value      = faithMode === "christian" ? s.split(" — ")[0] : s;
                return (
                  <button
                    key={s}
                    onClick={() => setScriptureToday(value)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      scriptureToday === value
                        ? "bg-gold-400 border-gold-400 text-white"
                        : "border-ivory-200 text-navy-400 hover:border-gold-300"
                    }`}
                  >
                    {shortLabel}
                  </button>
                );
              })}
            </div>
            <input
              className="input mb-3"
              placeholder={faithMode === "christian" ? "Type or paste a scripture reference..." : "Type your intention or reflection..."}
              value={scriptureToday}
              onChange={(e) => setScriptureToday(e.target.value)}
            />
            <textarea
              className="textarea min-h-[70px]"
              placeholder={faithMode === "christian" ? "What does this scripture mean to you today?" : "What does this mean to you today?"}
              value={scriptureNote}
              onChange={(e) => setScriptureNote(e.target.value)}
            />
          </div>

          {/* Gratitude */}
          <div className="card">
            <p className="label">💛 Gratitude journal</p>
            <p className="text-xs text-navy-400 italic mb-3">
              {GRATITUDE_PROMPTS[promptIdx]}
              <button
                onClick={() => setPromptIdx((i) => (i + 1) % GRATITUDE_PROMPTS.length)}
                className="ml-2 text-gold-500 hover:text-gold-600 underline"
              >
                different prompt ↺
              </button>
            </p>
            <div className="space-y-3">
              {[
                { val: gratitude1, set: setGratitude1, label: "1." },
                { val: gratitude2, set: setGratitude2, label: "2." },
                { val: gratitude3, set: setGratitude3, label: "3." },
              ].map(({ val, set, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="font-serif text-gold-400 text-xl font-medium w-5">{label}</span>
                  <input
                    className="input"
                    placeholder="I am grateful for..."
                    value={val}
                    onChange={(e) => set(e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Prayer / reflection focus */}
          <div className="card">
            <p className="label">🕊️ {faithMode === "christian" ? "Prayer focus areas" : "Reflection focus areas"}</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {PRAYER_CATEGORIES.map(({ key, label, emoji }) => (
                <button
                  key={key}
                  onClick={() => toggleCategory(key)}
                  className={`flex items-center gap-2 py-2.5 px-3 rounded-xl border text-sm transition-all ${
                    prayerCategories.includes(key)
                      ? "border-navy-500 bg-navy-500 text-white font-medium"
                      : "border-ivory-200 text-navy-400 hover:border-navy-300"
                  }`}
                >
                  <span>{emoji}</span>
                  <span className="text-xs">{label}</span>
                </button>
              ))}
            </div>
            <textarea
              className="textarea min-h-[80px]"
              placeholder={prayerRequests || prayerPlaceholder}
              value={prayerRequests}
              onChange={(e) => setPrayerRequests(e.target.value)}
            />
          </div>

          {/* Healing */}
          <div className="card card-gold">
            <p className="label">💚 {faithMode === "christian" ? "Healing & restoration" : "Care & restoration"}</p>
            <p className="text-xs text-navy-400 italic mb-3">{healingPromptText}</p>
            <textarea
              className="textarea min-h-[80px]"
              placeholder={healingPlaceholder}
              value={healingPrompt}
              onChange={(e) => setHealingPrompt(e.target.value)}
            />
          </div>

          {/* Evening reflection */}
          <div className="card">
            <p className="label">🌙 Evening reflection</p>
            <p className="text-xs text-navy-400 italic mb-3">{eveningPromptText}</p>
            <textarea
              className="textarea min-h-[80px]"
              placeholder={eveningPlaceholder}
              value={eveningReflection}
              onChange={(e) => setEveningReflection(e.target.value)}
            />
          </div>

          {/* Faith / daily intention */}
          <div className="card">
            <p className="label">✦ My intention for today</p>
            <input
              className="input"
              placeholder="e.g. I will trust the process. I will choose peace over panic."
              value={faithIntention}
              onChange={(e) => setFaithIntention(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* ── SERMON / NOTES TAB ── */}
      {activeTab === "sermon" && (
        <div className="space-y-5">
          <div className="card">
            <p className="label">{sermonLabel}</p>
            <div className="space-y-3">
              <div>
                <label className="label text-xs">
                  {faithMode === "christian" ? "Service / church / speaker" : "Source / speaker / title"}
                </label>
                <input
                  className="input"
                  placeholder={sermonPlaceholder}
                  value={sermonTitle}
                  onChange={(e) => setSermonTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="label text-xs">Notes</label>
                <textarea
                  className="textarea min-h-[200px]"
                  placeholder={sermonNotesPlaceholder}
                  value={sermonNotes}
                  onChange={(e) => setSermonNotes(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MONTHLY RESET TAB ── */}
      {activeTab === "monthly" && (
        <div className="space-y-5">
          <div className="card card-gold">
            <p className="label">🌿 Monthly {faithMode === "christian" ? "spiritual" : "inner"} reset</p>
            <p className="text-xs text-navy-400 italic mb-4">
              Take time to reflect on your {faithMode === "christian" ? "faith" : "inner"} journey this month.
            </p>
            <div className="space-y-4">
              {monthlyPrompts.map((prompt, i) => (
                <div key={i}>
                  <p className="text-sm text-navy-500 font-medium mb-2">✦ {prompt}</p>
                  <textarea
                    className="textarea min-h-[70px]"
                    placeholder="Write freely..."
                    value={monthlyReset?.split("|||")[i] ?? ""}
                    onChange={(e) => {
                      const parts = (monthlyReset ?? "").split("|||");
                      while (parts.length < 4) parts.push("");
                      parts[i] = e.target.value;
                      setMonthlyReset(parts.join("|||"));
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
