"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SettingsClient from "@/components/settings/SettingsClient";

export default function SettingsPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();
      setData({
        userId:          session.user.id,
        initialName:     profile?.full_name ?? "",
        initialEmail:    session.user.email ?? "",
        initialTimezone: profile?.timezone ?? "Europe/London",
        initialMotivation: profile?.motivation_text ?? "",
        initialAvatarUrl: profile?.avatar_url ?? null,
      });
    });
  }, []);

  if (!data) return <div className="text-navy-400 font-serif italic text-lg">Loading settings...</div>;
  return <SettingsClient {...data} />;
}
