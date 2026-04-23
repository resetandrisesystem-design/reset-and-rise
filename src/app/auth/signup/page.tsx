"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="card text-center">
        <div className="text-4xl mb-4">✦</div>
        <h2 className="font-serif text-2xl text-navy-500 mb-2 font-medium">You&apos;re brewing something beautiful</h2>
        <p className="text-sm text-navy-400 leading-relaxed mb-6">
          Check your email for a confirmation link, then come back to sign in and start your reset.
        </p>
        <Link href="/auth/login" className="btn-primary inline-block">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="font-serif text-2xl text-navy-500 mb-1 font-medium">Start your reset</h2>
      <p className="text-sm text-navy-400 mb-6 italic font-serif">
        &ldquo;While it looked like I was breaking… I was brewing.&rdquo;
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="label">Your name</label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Joyce"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
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
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>
        <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
          {loading ? "Creating your account..." : "Create account & Rise →"}
        </button>
      </form>

      <p className="text-center text-sm text-navy-400 mt-5">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-gold-500 hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
