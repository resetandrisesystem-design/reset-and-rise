"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { hasAccess, PLAN_LABEL, PLAN_PRICE, type Plan } from "@/types/plan";
import { Lock, Sparkles } from "lucide-react";

interface Props {
  requiredPlan: Plan;
  children: React.ReactNode;
}

/**
 * Wrap any Premium/VIP page content in this component.
 * It checks the logged-in user's plan and either renders the children
 * or shows an upgrade prompt — without ever rendering the locked content.
 */
export default function PlanGate({ requiredPlan, children }: Props) {
  const [status, setStatus] = useState<"loading" | "allowed" | "denied">("loading");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setStatus("denied"); return; }
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", session.user.id)
        .maybeSingle();

      const userPlan = (profile?.plan as Plan) ?? "core";
      setStatus(hasAccess(userPlan, requiredPlan) ? "allowed" : "denied");
    });
  }, [requiredPlan]);

  if (status === "loading") {
    return <div className="text-navy-400 font-serif italic text-lg">Loading...</div>;
  }

  if (status === "denied") {
    return <UpgradePrompt requiredPlan={requiredPlan} />;
  }

  return <>{children}</>;
}

function UpgradePrompt({ requiredPlan }: { requiredPlan: Plan }) {
  const label = PLAN_LABEL[requiredPlan];
  const price = PLAN_PRICE[requiredPlan];

  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6">
      <div className="w-16 h-16 rounded-full bg-navy-500 flex items-center justify-center mb-5">
        <Lock size={24} className="text-gold-400" />
      </div>

      <span className="text-[10px] bg-gold-100 text-gold-600 px-3 py-1 rounded-full font-medium uppercase tracking-wider mb-4">
        {label} Feature
      </span>

      <h2 className="font-serif text-2xl text-navy-500 font-medium mb-3">
        This page is part of {label}
      </h2>

      <p className="text-navy-400 text-sm max-w-md leading-relaxed mb-6">
        Upgrade to {label} to unlock this and other tools designed to help you go deeper —
        for {price}, with lifetime access and all future updates included.
      </p>

      <a
        href="https://www.resetandrisesystem.com"
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary flex items-center gap-2"
      >
        <Sparkles size={14} />
        Upgrade to {label}
      </a>
    </div>
  );
}
