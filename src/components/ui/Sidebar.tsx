"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types";
import { hasAccess, type Plan } from "@/types/plan";
import { isAdminEmail } from "@/lib/admin-emails";
import {
  CalendarDays, Brain, Wallet, UtensilsCrossed,
  BookHeart, LayoutDashboard, LogOut,
  CalendarRange, CalendarCheck, Settings, Calendar, Home,
  Heart, Target, Activity, CalendarClock, Wind, Lock,
  Shield, Menu, X, Baby
} from "lucide-react";
import clsx from "clsx";
import { useState } from "react";

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
  { href: "/dashboard/parenting", label: "Parenting Lane", icon: Baby           },
];

const PREMIUM_NAV = [
  { href: "/dashboard/home-life", label: "Home & Life Reset",     icon: Home   },
  { href: "/dashboard/family",    label: "Family & Connection",   icon: Heart  },
  { href: "/dashboard/goals",     label: "Goal Setting & Growth", icon: Target },
];

const VIP_NAV = [
  { href: "/dashboard/vip-daily",   label: "Activity Tracker", icon: Activity      },
  { href: "/dashboard/vip-weekly",  label: "Weekly Tracker",   icon: CalendarRange },
  { href: "/dashboard/vip-monthly", label: "Monthly Progress", icon: CalendarClock },
  { href: "/dashboard/vip-reset",   label: "Weekly Reset",     icon: Wind          },
];

function NavLink({ href, label, icon: Icon, pathname, exact = false, locked = false, onClick }: {
  href: string; label: string; icon: any; pathname: string; exact?: boolean; locked?: boolean; onClick?: () => void;
}) {
  const active = exact ? pathname === href : pathname.startsWith(href);
  return (
    <Link
      href={href}
      onClick={onClick}
      className={clsx(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-150",
        locked
          ? "text-navy-400/60 hover:bg-navy-400/20 hover:text-navy-300"
          : active
            ? "bg-gold-400/15 text-gold-400 font-medium"
            : "text-navy-200 hover:bg-navy-400/30 hover:text-ivory-100"
      )}
    >
      <Icon size={15} className="flex-shrink-0" />
      <span className="truncate flex-1">{label}</span>
      {locked && <Lock size={11} className="flex-shrink-0 opacity-60" />}
    </Link>
  );
}

export default function Sidebar({ user, profile }: { user: User; profile: (Profile & { plan?: Plan }) | null }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const supabase  = createClient();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  const name     = profile?.full_name || user.email?.split("@")[0] || "Friend";
  const userPlan: Plan = profile?.plan ?? "core";
  const close    = () => setOpen(false);

  const SidebarContent = () => (
    <>
      {/* Logo + user */}
      <div className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-navy-400/30">
        <div className="flex items-center gap-3">
          <div style={{
            background: "white", borderRadius: "50%", padding: "4px",
            width: "44px", height: "44px", display: "flex",
            alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(212,175,84,0.3)", flexShrink: 0,
          }}>
            <img src="/logo.png" alt="Reset and Rise" style={{ width: "36px", height: "36px", objectFit: "contain" }} />
          </div>
          <div className="overflow-hidden">
            <h1 className="font-serif text-sm text-gold-400 font-medium leading-tight truncate">Reset &amp; Rise™</h1>
            <p className="text-ivory-400 text-[9px] uppercase tracking-widest">System</p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3.5">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-gold-400/20 flex items-center justify-center text-gold-400 font-serif text-sm font-medium select-none flex-shrink-0 overflow-hidden">
              {profile?.avatar_url?.startsWith("emoji:")
                ? <span className="text-sm">{profile.avatar_url.replace("emoji:", "")}</span>
                : profile?.avatar_url
                  ? <img src={profile.avatar_url} alt={name} className="w-full h-full object-cover" />
                  : name[0].toUpperCase()
              }
            </div>
            <div className="overflow-hidden">
              <p className="text-ivory-100 text-xs font-medium leading-tight truncate">{name}</p>
              <p className="text-navy-300 text-[10px]">Welcome back ✦</p>
            </div>
          </div>
          <span className="text-[9px] bg-gold-400/20 text-gold-400 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider flex-shrink-0">
            {userPlan}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-0.5">
        {NAV.map((item) => (
          <NavLink key={item.href} {...item} pathname={pathname}
            exact={item.href === "/dashboard"} onClick={close} />
        ))}

        <div className="pt-2.5 mt-2.5 border-t border-navy-400/30">
          <p className="text-gold-400/70 text-[10px] font-semibold uppercase tracking-widest px-3 mb-1.5">Premium</p>
          {PREMIUM_NAV.map((item) => (
            <NavLink key={item.href} {...item} pathname={pathname}
              locked={!hasAccess(userPlan, "premium")} onClick={close} />
          ))}
        </div>

        <div className="pt-2.5 mt-2.5 border-t border-navy-400/30">
          <p className="text-gold-400/70 text-[10px] font-semibold uppercase tracking-widest px-3 mb-1.5">VIP</p>
          {VIP_NAV.map((item) => (
            <NavLink key={item.href} {...item} pathname={pathname}
              locked={!hasAccess(userPlan, "vip")} onClick={close} />
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="flex-shrink-0 px-3 pt-2 pb-4 border-t border-navy-400/30 space-y-0.5">
        {isAdminEmail(user.email) && (
          <NavLink href="/dashboard/admin" label="Admin Panel" icon={Shield} pathname={pathname} onClick={close} />
        )}
        <NavLink href="/dashboard/settings" label="Settings" icon={Settings} pathname={pathname} onClick={close} />
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] text-navy-300 hover:text-ivory-100 hover:bg-navy-400/30 transition-all w-full"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* ── MOBILE: top bar + hamburger ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-navy-500 flex items-center justify-between px-4 py-3 border-b border-navy-400/30">
        <div className="flex items-center gap-2.5">
          <div style={{
            background: "white", borderRadius: "50%", padding: "3px",
            width: "32px", height: "32px", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>
            <img src="/logo.png" alt="Reset and Rise" style={{ width: "26px", height: "26px", objectFit: "contain" }} />
          </div>
          <span className="font-serif text-sm text-gold-400 font-medium">Reset &amp; Rise™</span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="text-ivory-100 p-1.5 rounded-lg hover:bg-navy-400/30 transition-colors"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* ── MOBILE: drawer overlay ── */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50"
          onClick={close}
        >
          <div
            className="absolute left-0 top-0 h-full w-72 bg-navy-500 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent />
          </div>
        </div>
      )}

      {/* ── DESKTOP: fixed sidebar ── */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-dvh w-64 bg-navy-500 flex-col z-40 overflow-hidden">
        <SidebarContent />
      </aside>
    </>
  );
}
