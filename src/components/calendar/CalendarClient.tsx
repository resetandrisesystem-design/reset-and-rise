"use client";

import { useState } from "react";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday,
  parseISO
} from "date-fns";
import { ChevronLeft, ChevronRight, BookHeart, CalendarDays, Brain, Wallet } from "lucide-react";

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

interface Props {
  userId:  string;
  entries: DayData[];
}

const MOOD_EMOJI: Record<string, string> = {
  low:    "😔",
  okay:   "😐",
  good:   "🙂",
  calm:   "😊",
  rising: "🌟",
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CalendarClient({ userId, entries }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  // Build a lookup map by date string
  const entryMap = new Map<string, DayData>();
  entries.forEach((e) => entryMap.set(e.date, e));

  // Build calendar grid
  const monthStart  = startOfMonth(currentMonth);
  const monthEnd    = endOfMonth(currentMonth);
  const calStart    = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd      = endOfWeek(monthEnd,     { weekStartsOn: 1 });

  const weeks: Date[][] = [];
  let day = calStart;
  while (day <= calEnd) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(day);
      day = addDays(day, 1);
    }
    weeks.push(week);
  }

  // Stats for the month
  const monthEntries = entries.filter((e) => e.date.startsWith(format(currentMonth, "yyyy-MM")));
  const journalDays  = monthEntries.filter((e) => e.hasJournal).length;
  const plannerDays  = monthEntries.filter((e) => e.hasPlanner).length;
  const moodDays     = monthEntries.filter((e) => e.hasMood).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="section-title mb-0">Calendar</h2>
          <p className="text-navy-400 text-sm mt-1">View and reflect on your journey</p>
        </div>
      </div>

      {/* Month Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Journal entries",  value: journalDays,  icon: BookHeart,   color: "text-gold-400"  },
          { label: "Planner days",     value: plannerDays,  icon: CalendarDays, color: "text-navy-400" },
          { label: "Mood check-ins",   value: moodDays,     icon: Brain,        color: "text-blush-400"},
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card text-center">
            <Icon size={18} className={`${color} mx-auto mb-1`} />
            <p className="font-serif text-3xl text-navy-500 font-medium">{value}</p>
            <p className="text-xs text-navy-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 card">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="btn-ghost p-2"
            >
              <ChevronLeft size={18} />
            </button>
            <h3 className="font-serif text-xl text-navy-500 font-medium">
              {format(currentMonth, "MMMM yyyy")}
            </h3>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="btn-ghost p-2"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs text-navy-400 font-medium py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="space-y-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1">
                {week.map((date) => {
                  const dateStr  = format(date, "yyyy-MM-dd");
                  const data     = entryMap.get(dateStr);
                  const inMonth  = isSameMonth(date, currentMonth);
                  const isSelect = selectedDay?.date === dateStr;
                  const todayDay = isToday(date);

                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDay(data ? (isSelect ? null : data) : null)}
                      className={`
                        relative rounded-xl p-1.5 min-h-[52px] text-left transition-all
                        ${!inMonth ? "opacity-30 cursor-default" : "cursor-pointer"}
                        ${isSelect ? "bg-navy-500 ring-2 ring-gold-400" : todayDay ? "bg-gold-50 border border-gold-300" : "hover:bg-ivory-200 bg-white border border-ivory-200"}
                      `}
                      disabled={!inMonth}
                    >
                      {/* Date number */}
                      <span className={`text-xs font-medium block mb-1 ${
                        isSelect ? "text-gold-400" : todayDay ? "text-gold-600" : "text-navy-500"
                      }`}>
                        {format(date, "d")}
                        {todayDay && <span className="ml-1 text-gold-400">•</span>}
                      </span>

                      {/* Activity dots */}
                      {data && inMonth && (
                        <div className="flex flex-wrap gap-0.5">
                          {data.hasJournal  && <span className={`w-1.5 h-1.5 rounded-full ${isSelect ? "bg-gold-400" : "bg-gold-400"}`} title="Journal" />}
                          {data.hasPlanner  && <span className={`w-1.5 h-1.5 rounded-full ${isSelect ? "bg-ivory-300" : "bg-navy-300"}`} title="Planner" />}
                          {data.hasMood     && <span className={`w-1.5 h-1.5 rounded-full ${isSelect ? "bg-blush-300" : "bg-blush-300"}`} title="Mood" />}
                          {data.hasFinance  && <span className={`w-1.5 h-1.5 rounded-full ${isSelect ? "bg-ivory-300" : "bg-ivory-500"}`} title="Finance" />}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-ivory-200">
            {[
              { color: "bg-gold-400",   label: "Journal"  },
              { color: "bg-navy-300",   label: "Planner"  },
              { color: "bg-blush-300",  label: "Mood"     },
              { color: "bg-ivory-500",  label: "Finance"  },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${color}`} />
                <span className="text-xs text-navy-400">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Day Detail Panel */}
        <div className="lg:col-span-1">
          {selectedDay ? (
            <div className="card h-full">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="label mb-0">
                    {format(parseISO(selectedDay.date), "EEEE")}
                  </p>
                  <p className="font-serif text-2xl text-navy-500 font-medium">
                    {format(parseISO(selectedDay.date), "d MMMM yyyy")}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="btn-ghost text-lg leading-none px-2"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {/* Journal entry */}
                {selectedDay.hasJournal && (
                  <div className="bg-navy-500 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BookHeart size={14} className="text-gold-400" />
                      <p className="text-gold-400 text-xs font-medium uppercase tracking-wider">Journal</p>
                    </div>
                    {selectedDay.promptUsed && (
                      <p className="text-ivory-400 text-xs italic mb-2">
                        &ldquo;{selectedDay.promptUsed}&rdquo;
                      </p>
                    )}
                    <p className="text-ivory-200 text-sm leading-relaxed line-clamp-4">
                      {selectedDay.journalText || "Entry recorded"}
                    </p>
                  </div>
                )}

                {/* Mood */}
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

                {/* Priorities */}
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

                {/* Reflection */}
                {selectedDay.reflection && (
                  <div className="bg-ivory-100 rounded-xl p-3 border border-ivory-200">
                    <p className="text-xs text-navy-400 italic mb-1">End of day reflection</p>
                    <p className="text-sm text-navy-500 leading-relaxed">{selectedDay.reflection}</p>
                  </div>
                )}

                {/* Nothing recorded */}
                {!selectedDay.hasJournal && !selectedDay.hasMood && !selectedDay.hasPlanner && (
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
                Click any day with dots to see your entries
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
