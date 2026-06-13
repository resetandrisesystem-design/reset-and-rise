"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types";
import {
  CalendarDays, Brain, Wallet, UtensilsCrossed,
  BookHeart, LayoutDashboard, LogOut, Sparkles,
  CalendarRange, CalendarCheck, Settings, Calendar
} from "lucide-react";
import clsx from "clsx";

const NAV = [
  { href: "/dashboard",          label: "Overview",        icon: LayoutDashboard },
  { href: "/dashboard/planner",  label: "Daily Planner",   icon: CalendarDays    },
  { href: "/dashboard/weekly",   label: "Weekly Planner",  icon: CalendarRange   },
  { href: "/dashboard/monthly",  label: "Monthly Planner", icon: CalendarCheck   },
  { href: "/dashboard/calendar", label: "Calendar",        icon: Calendar        },
  { href: "/dashboard/mental",   label: "Mind Reset",      icon: Brain           },
  { href: "/dashboard/finance",  label: "Money Reset",     icon: Wallet          },
  { href: "/dashboard/meals",    label: "Meal Planner",    icon: UtensilsCrossed },
  { href: "/dashboard/journal",  label: "AI Journal",      icon: BookHeart       },
];

export default function Sidebar({ user, profile }: { user: User; profile: Profile | null }) {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  const name = profile?.full_name || user.email?.split("@")[0] || "Friend";

  return (
    <aside className="fixed left-0 top-0 h-dvh w-64 bg-navy-500 flex flex-col z-40">

      {/* Logo */}
      <div className="px-6 pt-6 pb-5 border-b border-navy-400/30 flex items-center gap-3">
        <Image
          src="/logo.png"
          alt="Reset and Rise"
          width={36}
          height={36}
          className="drop-shadow brightness-0 invert opacity-80 flex-shrink-0"
        />
        <div>
          <h1 className="font-serif text-lg text-gold-400 font-medium leading-tight">
            Reset &amp; Rise™
          </h1>
          <p className="text-ivory-400 text-[10px] uppercase tracking-widest">System</p>
        </div>
      </div>

      {/* User greeting */}
      <div className="px-6 py-4 border-b border-navy-400/30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gold-400/20 flex items-center justify-center text-gold-400 font-serif text-lg font-medium select-none">
            {name[0].toUpperCase()}
          </div>
          <div>
            <p className="text-ivory-100 text-sm font-medium leading-tight">{name}</p>
            <p className="text-navy-300 text-xs">Welcome back ✦</p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150",
                active
                  ? "bg-gold-400/15 text-gold-400 font-medium"
                  : "text-navy-200 hover:bg-navy-400/30 hover:text-ivory-100"
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Affirmation */}
      <div className="px-5 py-4 mx-3 mb-3 rounded-xl bg-navy-400/20 border border-navy-400/30">
        <Sparkles size={14} className="text-gold-400 mb-2" />
        <p className="font-serif text-ivory-300 text-xs italic leading-relaxed">
          &ldquo;Brew calm. Brew clarity. Brew control.&rdquo;
        </p>
      </div>

      {/* Settings + Sign out */}
      <div className="px-3 pb-6 space-y-1">
        <Link
          href="/dashboard/settings"
          className={clsx(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all w-full",
            pathname.startsWith("/dashboard/settings")
              ? "bg-gold-400/15 text-gold-400 font-medium"
              : "text-navy-300 hover:text-ivory-100 hover:bg-navy-400/30"
          )}
        >
          <Settings size={16} />
          Settings
        </Link>
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-navy-300 hover:text-ivory-100 hover:bg-navy-400/30 transition-all w-full"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
