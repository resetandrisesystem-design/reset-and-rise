"use client";

import { useEffect, useState } from "react";


const DEFAULT_MESSAGES = [
  "Hey girl, one step closer to success!",
  "You've got this. One reset at a time.",
  "Clarity begins here. Welcome back.",
  "Brew calm. Brew clarity. Brew control.",
  "No one is coming to save us — but we've got each other.",
];

interface Props {
  name:            string;
  motivationText?: string | null;
  onDone:          () => void;
}

export default function WelcomeAnimation({ name, motivationText, onDone }: Props) {
  const [phase, setPhase] = useState<"logo" | "greeting" | "message" | "fadeout">("logo");

  const firstName    = name.split(" ")[0];
  const message      = motivationText?.trim() ||
    DEFAULT_MESSAGES[new Date().getDay() % DEFAULT_MESSAGES.length];

  // Get time-based greeting
  const hour = new Date().getHours();
  const timeGreeting =
    hour < 12 ? "Good morning" :
    hour < 17 ? "Good afternoon" :
                "Good evening";

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("greeting"),  900);
    const t2 = setTimeout(() => setPhase("message"),   2000);
    const t3 = setTimeout(() => setPhase("fadeout"),   4200);
    const t4 = setTimeout(() => onDone(),              5000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-navy-500
        transition-opacity duration-700 ${phase === "fadeout" ? "opacity-0" : "opacity-100"}`}
    >
      {/* Background soft glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold-400/5 blur-3xl" />
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-gold-400/5 blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center gap-8 px-8 text-center max-w-lg">

        {/* Logo */}
        <div className={`transition-all duration-700 ${
          phase === "logo" ? "opacity-0 scale-90" : "opacity-100 scale-100"
        }`}>
          <img
            src="/logo.png"
            alt="Reset and Rise"
            width={120}
            height={120}
            className="drop-shadow-lg brightness-0 invert opacity-90"
            priority
          />
        </div>

        {/* Greeting */}
        <div className={`transition-all duration-700 delay-100 ${
          phase === "logo" || phase === "greeting" && false
            ? "opacity-0 translate-y-4"
            : "opacity-100 translate-y-0"
        } ${phase === "greeting" || phase === "message" || phase === "fadeout" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <p className="text-ivory-300 text-sm uppercase tracking-[0.3em] mb-2">
            {timeGreeting}
          </p>
          <h1 className="font-serif text-4xl text-gold-400 font-medium">
            {firstName} ✦
          </h1>
        </div>

        {/* Motivational message */}
        <div className={`transition-all duration-700 delay-200 ${
          phase === "message" || phase === "fadeout"
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4"
        }`}>
          <div className="border-t border-b border-gold-400/30 py-5">
            <p className="font-serif text-ivory-200 text-xl italic leading-relaxed">
              &ldquo;{message}&rdquo;
            </p>
          </div>
          <p className="text-navy-300 text-xs mt-4 uppercase tracking-widest">
            Reset &amp; Rise System
          </p>
        </div>

        {/* Skip button */}
        <button
          onClick={onDone}
          className="text-navy-300 text-xs hover:text-ivory-300 transition-colors mt-4 underline underline-offset-2"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
