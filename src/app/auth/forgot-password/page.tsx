"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]     = useState(false);
  const [error, setError]   = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      // Don't reveal whether the email exists — show success regardless for privacy/security
      console.error(error);
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-dvh bg-navy-500 flex items-center justify-center px-6">
      <div className="max-w-sm w-full">
        {/* Logo */}
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
          {!sent ? (
            <>
              <h2 className="font-serif text-2xl text-navy-500 font-medium mb-2">Forgot your password?</h2>
              <p className="text-navy-400 text-sm mb-6 leading-relaxed">
                No worries. Enter the email you signed up with and we&apos;ll send you a link to reset it.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Email address</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
                    <input
                      type="email"
                      required
                      className="input pl-9"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>

                {error && <p className="text-red-500 text-xs">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-full bg-gold-50 border border-gold-200 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={22} className="text-gold-500" />
              </div>
              <h2 className="font-serif text-xl text-navy-500 font-medium mb-2">Check your email</h2>
              <p className="text-navy-400 text-sm leading-relaxed">
                If an account exists for <span className="font-medium text-navy-500">{email}</span>,
                we&apos;ve sent a password reset link. It should arrive within a few minutes.
              </p>
            </div>
          )}

          <a
            href="/auth/login"
            className="flex items-center justify-center gap-1.5 text-navy-400 hover:text-navy-500 text-sm mt-6"
          >
            <ArrowLeft size={13} />
            Back to login
          </a>
        </div>
      </div>
    </div>
  );
}
