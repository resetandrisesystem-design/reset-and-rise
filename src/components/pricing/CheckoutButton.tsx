"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

export default function CheckoutButton({
  plan,
  name,
  featured = false,
}: {
  plan: string;
  name: string;
  featured?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startCheckout() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Could not start checkout");
      }
      window.location.href = data.url;
    } catch (err: any) {
      setError("Something went wrong starting checkout. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="mt-auto">
      <button
        onClick={startCheckout}
        disabled={loading}
        className={
          "w-full inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-wait " +
          (featured
            ? "bg-gold-400 text-navy-600 hover:bg-gold-300"
            : "bg-navy-500 text-gold-400 hover:bg-navy-600")
        }
      >
        <Sparkles size={14} />
        {loading ? "Opening checkout…" : `Get ${name} Access`}
      </button>
      {error && (
        <p className="text-xs text-red-500 text-center mt-2">{error}</p>
      )}
    </div>
  );
}
