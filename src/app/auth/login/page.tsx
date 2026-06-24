"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [debug, setDebug] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setDebug("Attempting login...");

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    setDebug(JSON.stringify({ 
      hasSession: !!data.session, 
      hasUser: !!data.user,
      error: error?.message 
    }));

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      setDebug("Session found! Redirecting...");
      // Force hard navigation
      setTimeout(() => {
        window.location.replace("/dashboard");
      }, 500);
    } else {
      setError("No session returned - email may not be confirmed");
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2 className="font-serif text-2xl text-navy-500 mb-1 font-medium">Welcome back</h2>
      <p className="text-sm text-navy-400 mb-6 italic font-serif">
        &ldquo;You don&apos;t need to do everything. Just the next right thing.&rdquo;
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
          {error}
        </div>
      )}

      {debug && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl text-xs mb-4 font-mono">
          {debug}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="label">Email address</label>
          <input
            type="email"
            className="input"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            type="password"
            className="input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="flex justify-end mt-1">
            <Link href="/auth/forgot-password" className="text-xs text-gold-500 hover:text-gold-600">
              Forgot password?
            </Link>
          </div>
        </div>
        <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
          {loading ? "Signing in..." : "Sign in → Reset & Rise"}
        </button>
      </form>

      <p className="text-center text-sm text-navy-400 mt-5">
        New here?{" "}
        <Link href="/auth/signup" className="text-gold-500 hover:underline font-medium">
          Create your account
        </Link>
      </p>
    </div>
  );
}
