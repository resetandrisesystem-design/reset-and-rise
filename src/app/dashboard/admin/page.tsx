"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AdminClient from "@/components/admin/AdminClient";
import { isAdminEmail } from "@/lib/admin-emails";
import { ShieldOff } from "lucide-react";

export default function AdminPage() {
  const [status, setStatus] = useState<"loading" | "allowed" | "denied">("loading");
  const [users, setUsers] = useState<any[]>([]);
  const [callerEmail, setCallerEmail] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user?.email || !isAdminEmail(session.user.email)) {
        setStatus("denied");
        return;
      }

      setCallerEmail(session.user.email);

      // Fetch all profiles (RLS allows users to see only their own row normally,
      // but admins fetch via this client-readable view since profiles has a
      // permissive admin-read policy — see SQL file for the policy added).
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, plan, created_at, email:id")
        .order("created_at", { ascending: false });

      // We need emails too — profiles table doesn't store email directly in
      // older schemas, so we fetch from a view that joins auth.users.
      const { data: usersWithEmail } = await supabase
        .from("admin_users_view")
        .select("*")
        .order("created_at", { ascending: false });

      setUsers(usersWithEmail ?? []);
      setStatus("allowed");
    });
  }, []);

  if (status === "loading") {
    return <div className="text-navy-400 font-serif italic text-lg">Checking access...</div>;
  }

  if (status === "denied") {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20">
        <ShieldOff size={32} className="text-navy-300 mb-4" />
        <h2 className="font-serif text-xl text-navy-500 font-medium mb-2">Access restricted</h2>
        <p className="text-navy-400 text-sm">This page is only available to administrators.</p>
      </div>
    );
  }

  return <AdminClient users={users} callerEmail={callerEmail} />;
}
