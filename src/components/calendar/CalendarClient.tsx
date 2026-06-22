"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isToday,
  parseISO
} from "date-fns";
import {
  ChevronLeft, ChevronRight, BookHeart, CalendarDays, Brain, Wallet,
  Plus, X, Cake, Heart, Pin, Trash2
} from "lucide-react";

interface DayData {
  date: string;
  hasJournal:  boolean;
  hasPlanner:  boolean;
  hasMood:     boolean;
  hasFinance:  boolean;
  journalText?: string | null;
  promptUsed?:  string | null;
  mood?:        string | null;
  priorities?:  string[];
  reflection?:  string | null;
}

interface CustomEvent {
  id: string;
  event_date: string;
  title: string;
  category: "birthday" | "anniversary" | "other";
  recurring: boolean;
}

interface Props {
  userId:  string;
  entries: DayData[];
  customEvents: CustomEvent[];
}

const MOOD_EMOJI: Record<string, string> = {
  low: "😔", okay: "😐", good: "🙂", calm: "😊", rising: "🌟",
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const CATEGORY_META = {
  birthday:    { label: "Birthday",     color: "bg-pink-400",   icon: Cake,  text: "text-pink-500"   },
  anniversary: { label: "Anniversary",  color: "bg-purple-400", icon: Heart, text: "text-purple-500" },
  other:       { label: "Other Event",  color: "bg-teal-400",   icon: Pin,   text: "text-teal-500"   },
} as const;

export default function CalendarClient({ userId, entries, customEvents: initialCustomEvents }: Props) {
  const supabase = createClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [customEvents, setCustomEvents] = useState<CustomEvent[]>(initialCustomEvents);

  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEventDate, setNewEventDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventCategory, setNewEventCategory] = useState<CustomEvent["category"]>("birthday");
  const [newEventRecurring, setNewEventRecurring] = useState(true);
  const [saving, setSaving] = useState(false);

  const entryMap = new Map<string, DayData>();
  entries.forEach((e) => entryMap.set(e.date, e));

  const eventsByDate = new Map<string, CustomEvent[]>();
  customEvents.forEach((ev) => {
    const key = ev.recurring ? ev.event_date.slice(5) : ev.event_date;
    const list = eventsByDate.get(key) ?? [];
    list.push(ev);
    eventsByDate.set(key, list);
  });

  function getEventsForDate(dateStr: string): CustomEvent[] {
    const monthDay = dateStr.slice(5);
    return [...(eventsByDate.get(dateStr) ?? []), ...(eventsByDate.get(monthDay) ?? [])]
      .filter((v, i, arr) => arr.findIndex((x) => x.id === v.id) === i);
  }

  const monthStart = startOfMonth(currentMonth);
  const monthEnd   = endOfMonth(currentMonth);
  const calStart   = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd     = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const weeks: Date[][] = [];
  let day = calStart;
  while (day <= calEnd) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) { week.push(day); day = addDays(day, 1); }
    weeks.push(week);
  }

  const monthEntries = entries.filter((e) => e.date.startsWith(format(currentMonth, "yyyy-MM")));
  const journalDays = monthEntries.filter((e) => e.hasJournal).length;
  const plannerDays = monthEntries.filter((e) => e.hasPlanner).length;
  const moodDays    = monthEntries.filter((e) => e.hasMood).length;

  async function addEvent() {
    if (!newEventTitle.trim()) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("calendar_events")
      .insert({
        user_id: userId,
        event_date: newEventDate,
        title: newEventTitle.trim(),
        category: newEventCategory,
        recurring: newEventRecurring,
      })
      .select()
      .single();

    if (!error && data) {
      setCustomEvents((prev) => [...prev, data]);
      setNewEventTitle("");
      setShowAddEvent(false);
    }
    setSaving(false);
  }

  async function deleteEvent(id: string) {
    await supabase.from("calendar_events").delete().eq("id", id);
    setCustomEvents((prev) => prev.filter((e) => e.id !== id));
  }

  const selectedDayEvents = selectedDay ? getEventsForDate(selectedDay.date) : [];

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="section-title mb-0">Calendar</h2>
          <p className="text-navy-400 text-sm mt-1">View and reflect on your journey</p>
        </div>
        <button
          onClick={() => setShowAddEvent(true)}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus size={14} /> Add Event
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Journal entries", value: journalDays, icon: BookHeart,    color: "text-gold-400"  },
          { label: "Planner days",    value: plannerDays, icon: CalendarDays, color: "text-navy-400"  },
          { label: "Mood check-ins",  value: moodDays,    icon: Brain,        color: "text-blush-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card text-center">
            <Icon size={18} className={`${color} mx-auto mb-1`} />
            <p className="font-serif text-3xl text-navy-500 font-medium">{value}</p>
            <p className="text-xs text-navy-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-5">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="btn-ghost p-2">
              <ChevronLeft size={18} />
            </button>
            <h3 className="font-serif text-xl text-navy-500 font-medium">
              {format(currentMonth, "MMMM yyyy")}
            </h3>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="btn-ghost p-2">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs text-navy-400 font-medium py-1">{d}</div>
            ))}
          </div>

          <div className="space-y-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1">
                {week.map((date) => {
                  const dateStr  = format(date, "yyyy-MM-dd");
                  const data     = entryMap.get(dateStr);
                  const dayEvents = getEventsForDate(dateStr);
                  const inMonth  = isSameMonth(date, currentMonth);
                  const isSelect = selectedDay?.date === dateStr;
                  const todayDay = isToday(date);

                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDay(
                        isSelect ? null : (data ?? { date: dateStr, hasJournal: false, hasPlanner: false, hasMood: false, hasFinance: false })
                      )}
                      className={`
                        relative rounded-xl p-1.5 min-h-[52px] text-left transition-all
                        ${!inMonth ? "opacity-30 cursor-default" : "cursor-pointer"}
                        ${isSelect ? "bg-navy-500 ring-2 ring-gold-400" : todayDay ? "bg-gold-50 border border-gold-300" : "hover:bg-ivory-200 bg-white border border-ivory-200"}
                      `}
                      disabled={!inMonth}
                    >
                      <span className={`text-xs font-medium block mb-1 ${
                        isSelect ? "text-gold-400" : todayDay ? "text-gold-600" : "text-navy-500"
                      }`}>
                        {format(date, "d")}
                        {todayDay && <span className="ml-1 text-gold-400">•</span>}
                      </span>

                      {inMonth && (data || dayEvents.length > 0) && (
                        <div className="flex flex-wrap gap-0.5">
                          {data?.hasJournal && <span className="w-1.5 h-1.5 rounded-full bg-gold-400" title="Journal" />}
                          {data?.hasPlanner && <span className="w-1.5 h-1.5 rounded-full bg-navy-300" title="Planner" />}
                          {data?.hasMood    && <span className="w-1.5 h-1.5 rounded-full bg-blush-300" title="Mood" />}
                          {data?.hasFinance && <span className="w-1.5 h-1.5 rounded-full bg-ivory-500" title="Finance" />}
                          {dayEvents.map((ev) => (
                            <span
                              key={ev.id}
                              className={`w-1.5 h-1.5 rounded-full ${CATEGORY_META[ev.category].color}`}
                              title={CATEGORY_META[ev.category].label}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-ivory-200 flex-wrap">
            {[
              { color: "bg-gold-400",   label: "Journal"     },
              { color: "bg-navy-300",   label: "Planner"     },
              { color: "bg-blush-300",  label: "Mood"        },
              { color: "bg-ivory-500",  label: "Finance"     },
              { color: "bg-pink-400",   label: "Birthday"    },
              { color: "bg-purple-400", label: "Anniversary" },
              { color: "bg-teal-400",   label: "Other Event" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${color}`} />
                <span className="text-xs text-navy-400">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          {selectedDay ? (
            <div className="card h-full">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="label mb-0">{format(parseISO(selectedDay.date), "EEEE")}</p>
                  <p className="font-serif text-2xl text-navy-500 font-medium">
                    {format(parseISO(selectedDay.date), "d MMMM yyyy")}
                  </p>
                </div>
                <button onClick={() => setSelectedDay(null)} className="btn-ghost text-lg leading-none px-2">×</button>
              </div>

              <div className="space-y-4">
                {selectedDayEvents.map((ev) => {
                  const meta = CATEGORY_META[ev.category];
                  const Icon = meta.icon;
                  return (
                    <div key={ev.id} className={`rounded-xl p-3 border flex items-center justify-between gap-2 ${
                      ev.category === "birthday" ? "bg-pink-50 border-pink-100" :
                      ev.category === "anniversary" ? "bg-purple-50 border-purple-100" :
                      "bg-teal-50 border-teal-100"
                    }`}>
                      <div className="flex items-center gap-2">
                        <Icon size={15} className={meta.text} />
                        <div>
                          <p className="text-sm text-navy-500 font-medium">{ev.title}</p>
                          <p className="text-xs text-navy-400">{meta.label}{ev.recurring ? " · repeats yearly" : ""}</p>
                        </div>
                      </div>
                      <button onClick={() => deleteEvent(ev.id)} className="text-navy-300 hover:text-red-400">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}

                {selectedDay.hasJournal && (
                  <div className="bg-navy-500 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BookHeart size={14} className="text-gold-400" />
                      <p className="text-gold-400 text-xs font-medium uppercase tracking-wider">Journal</p>
                    </div>
                    {selectedDay.promptUsed && (
                      <p className="text-ivory-400 text-xs italic mb-2">&ldquo;{selectedDay.promptUsed}&rdquo;</p>
                    )}
                    <p className="text-ivory-200 text-sm leading-relaxed line-clamp-4">
                      {selectedDay.journalText || "Entry recorded"}
                    </p>
                  </div>
                )}

                {selectedDay.hasMood && selectedDay.mood && (
                  <div className="stat-card">
                    <div className="flex items-center gap-2 mb-1">
                      <Brain size={14} className="text-blush-400" />
                      <p className="text-xs font-medium text-navy-400 uppercase tracking-wider">Mood</p>
                    </div>
                    <p className="text-2xl">
                      {MOOD_EMOJI[selectedDay.mood]}
                      <span className="text-sm text-navy-500 ml-2 capitalize">{selectedDay.mood}</span>
                    </p>
                  </div>
                )}

                {selectedDay.hasPlanner && selectedDay.priorities && selectedDay.priorities.filter(Boolean).length > 0 && (
                  <div className="stat-card">
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarDays size={14} className="text-navy-400" />
                      <p className="text-xs font-medium text-navy-400 uppercase tracking-wider">Top Priorities</p>
                    </div>
                    <div className="space-y-1">
                      {selectedDay.priorities.filter(Boolean).map((p, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="font-serif text-gold-400 font-medium text-sm w-4">{i + 1}</span>
                          <p className="text-sm text-navy-500">{p}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedDay.reflection && (
                  <div className="bg-ivory-100 rounded-xl p-3 border border-ivory-200">
                    <p className="text-xs text-navy-400 italic mb-1">End of day reflection</p>
                    <p className="text-sm text-navy-500 leading-relaxed">{selectedDay.reflection}</p>
                  </div>
                )}

                {!selectedDay.hasJournal && !selectedDay.hasMood && !selectedDay.hasPlanner && selectedDayEvents.length === 0 && (
                  <div className="text-center py-8">
                    <p className="font-serif text-navy-400 italic text-sm">Nothing recorded this day</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-12 h-12 rounded-full bg-gold-50 border border-gold-200 flex items-center justify-center mb-3">
                <CalendarDays size={20} className="text-gold-400" />
              </div>
              <p className="font-serif text-navy-400 italic text-sm">
                Click any day to see entries, or add an event
              </p>
            </div>
          )}
        </div>
      </div>

      {showAddEvent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowAddEvent(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-xl text-navy-500 font-medium">Add Event</h3>
              <button onClick={() => setShowAddEvent(false)} className="text-navy-300 hover:text-navy-500">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Event title</label>
                <input
                  className="input"
                  placeholder="e.g. Mum's birthday, Wedding anniversary..."
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div>
                <label className="label">Date</label>
                <input
                  type="date"
                  className="input"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["birthday", "anniversary", "other"] as const).map((cat) => {
                    const meta = CATEGORY_META[cat];
                    const Icon = meta.icon;
                    return (
                      <button
                        key={cat}
                        onClick={() => setNewEventCategory(cat)}
                        className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-all ${
                          newEventCategory === cat ? "border-gold-400 bg-gold-50" : "border-ivory-200 hover:border-gold-300"
                        }`}
                      >
                        <Icon size={16} className={meta.text} />
                        <span className="text-[10px] text-navy-500 font-medium">{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newEventRecurring}
                  onChange={(e) => setNewEventRecurring(e.target.checked)}
                  className="accent-gold-400"
                />
                <span className="text-sm text-navy-500">Repeats every year</span>
              </label>

              <button
                onClick={addEvent}
                disabled={saving || !newEventTitle.trim()}
                className="btn-primary w-full disabled:opacity-50"
              >
                {saving ? "Adding…" : "Add Event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
