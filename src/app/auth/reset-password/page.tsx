"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Lock, CheckCircle2, AlertCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const [ready, setReady]   = useState(false);
  const [password, setPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    // Supabase automatically exchanges the recovery token in the URL for a session
    // when this page loads, via the onAuthStateChange listener below.
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });

    // Fallback: if there's already a session (e.g. fast load), allow immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setDone(true);
      setTimeout(() => { window.location.href = "/dashboard"; }, 2000);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-dvh bg-navy-500 flex items-center justify-center px-6">
      <div className="max-w-sm w-full">
        <div className="flex flex-col items-center mb-8">
          <div style={{
            background: "white",
            borderRadius: "50%",
            padding: "8px",
            width: "72px",
            height: "72px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 12px rgba(212,175,84,0.3)",
          }}>
            <img src="/logo.png" alt="Reset and Rise" style={{ width: "58px", height: "58px", objectFit: "contain" }} />
          </div>
          <h1 className="font-serif text-xl text-gold-400 font-medium mt-3">Reset &amp; Rise™</h1>
        </div>

        <div className="bg-white rounded-2xl p-7">
          {done ? (
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-full bg-gold-50 border border-gold-200 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={22} className="text-gold-500" />
              </div>
              <h2 className="font-serif text-xl text-navy-500 font-medium mb-2">Password updated!</h2>
              <p className="text-navy-400 text-sm">Taking you to your dashboard...</p>
            </div>
          ) : !ready ? (
            <div className="text-center py-6">
              <p className="text-navy-400 text-sm font-serif italic">Verifying your reset link...</p>
            </div>
          ) : (
            <>
              <h2 className="font-serif text-2xl text-navy-500 font-medium mb-2">Set a new password</h2>
              <p className="text-navy-400 text-sm mb-6">Choose something you&apos;ll remember.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">New password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
                    <input
                      type="password"
                      required
                      className="input pl-9"
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Confirm new password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
                    <input
                      type="password"
                      required
                      className="input pl-9"
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                {error && (
                  <p className="flex items-center gap-1.5 text-red-500 text-xs">
                    <AlertCircle size={12} /> {error}
                  </p>
                )}

                <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                  {loading ? "Updating…" : "Update password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
