"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "@/components/ui/Sidebar";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const isOverview = pathname === "/dashboard";

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        window.location.href = "/auth/login";
      } else {
        setUser(session.user);
        setLoading(false);
      }
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

  return (
    <div className="flex min-h-dvh bg-ivory-100">
      <Sidebar user={user} profile={null} />
      <main className="flex-1 ml-64 p-8 max-w-4xl">
        {/* Back button — shown on all pages except Overview */}
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
