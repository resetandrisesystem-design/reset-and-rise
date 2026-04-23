"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { CalendarDays, Brain, Wallet, UtensilsCrossed, BookHeart, ArrowRight } from "lucide-react";

const AFFIRMATIONS = [
  "You are not behind. You are brewing.",
  "Rest is productive. Peace is powerful.",
  "Every small step is an act of rising.",
  "You don't need to do everything — just the next right thing.",
  "Your calm is contagious. Lead yourself first.",
];

const CARDS = [
  { href: "/dashboard/planner",  icon: CalendarDays,    label: "Daily Planner", detail: "Set your top 3 priorities & time blocks" },
  { href: "/dashboard/mental",   icon: Brain,           label: "Mind Reset",    detail: "Log your mood & brain dump"              },
  { href: "/dashboard/finance",  icon: Wallet,          label: "Money Reset",   detail: "Track your income & expenses"            },
  { href: "/dashboard/meals",    icon: UtensilsCrossed, label: "Meal Planner",  detail: "Plan this week's meals"                  },
  { href: "/dashboard/journal",  icon: BookHeart,       label: "AI Journal",    detail: "Reflect, journal & get AI support"       },
];

export default function DashboardPage() {
  const [name, setName] = useState("Friend");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const n = session.user.user_metadata?.full_name || 
                  session.user.email?.split("@")[0] || "Friend";
        setName(n);
      }
      setReady(true);
    });
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const affirmation = AFFIRMATIONS[new Date().getDay() % AFFIRMATIONS.length];
  const dateStr = new Date().toLocaleDateString("en-GB", { 
    weekday: "long", year: "numeric", month: "long", day: "numeric" 
  });

  if (!ready) return null;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <p className="text-navy-400 text-sm uppercase tracking-widest mb-1">{dateStr}</p>
        <h2 className="font-serif text-4xl text-navy-500 font-medium mb-3">
          {greeting}, {name} ✦
        </h2>
        <div className="flex items-start gap-3 bg-white border-l-4 border-l-gold-400 rounded-r-2xl px-5 py-4 max-w-xl shadow-sm">
          <span className="text-gold-400 text-lg mt-0.5">✦</span>
          <p className="font-serif text-navy-500 italic text-lg leading-relaxed">
            &ldquo;{affirmation}&rdquo;
          </p>
        </div>
      </div>

      {/* Section cards */}
      <h3 className="font-serif text-xl text-navy-500 mb-4">Your reset zones</h3>
      <div className="grid grid-cols-1 gap-3">
        {CARDS.map(({ href, icon: Icon, label, detail }) => (
          <Link
            key={href}
            href={href}
            className="card flex items-center gap-4 hover:shadow-md hover:border-gold-300 transition-all duration-200 group"
          >
            <div className="w-10 h-10 rounded-xl bg-ivory-200 flex items-center justify-center flex-shrink-0">
              <Icon size={18} className="text-navy-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-navy-500 font-medium text-sm">{label}</p>
              <p className="text-navy-400 text-xs mt-0.5">{detail}</p>
            </div>
            <ArrowRight size={16} className="text-navy-300 group-hover:text-gold-400 transition-colors flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
