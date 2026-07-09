"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "@/components/ui/Sidebar";
import WelcomeAnimation from "@/components/welcome/WelcomeAnimation";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user,        setUser]        = useState<any>(null);
  const [profile,     setProfile]     = useState<any>(null);
  const [loading,     setLoading]     = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const pathname = usePathname();
  const router   = useRouter();
  const isOverview = pathname === "/dashboard";

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { window.location.href = "/auth/login"; return; }

      const { data: prof } = await supabase
        .from("profiles").select("*").eq("id", session.user.id).maybeSingle();

      setUser(session.user);
      setProfile(prof);

      const key = `welcome_shown_${session.user.id}`;
      if (!sessionStorage.getItem(key)) {
        setShowWelcome(true);
        sessionStorage.setItem(key, "1");
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-dvh bg-navy-500 flex items-center justify-center">
        <div className="text-center">
          <p className="font-serif text-3xl text-gold-400 mb-2">Reset & Rise™</p>
          <p className="text-ivory-300 text-sm">Loading your reset...</p>
        </div>
      </div>
    );
  }

  const name = profile?.full_name || user?.email?.split("@")[0] || "Friend";

  return (
    <div className="flex min-h-dvh bg-ivory-100">
      {showWelcome && (
        <WelcomeAnimation
          name={name}
          motivationText={profile?.motivation_text}
          onDone={() => setShowWelcome(false)}
        />
      )}

      <Sidebar user={user} profile={profile} />

      {/* 
        Desktop: ml-64 to clear the fixed sidebar
        Mobile: pt-14 to clear the fixed top bar, no left margin
      */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 px-4 lg:px-8 py-4 lg:py-8 max-w-4xl w-full">
        {!isOverview && (
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-navy-400 hover:text-navy-500 text-sm mb-6 transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to Overview
          </button>
        )}
        {children}
      </main>
    </div>
  );
}
