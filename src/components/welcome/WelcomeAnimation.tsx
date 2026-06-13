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

  const firstName = name.split(" ")[0];
  const message   = motivationText?.trim() ||
    DEFAULT_MESSAGES[new Date().getDay() % DEFAULT_MESSAGES.length];

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
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        backgroundColor: "#1a2744",
        transition: "opacity 0.7s",
        opacity: phase === "fadeout" ? 0 : 1,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "32px", padding: "0 32px", textAlign: "center", maxWidth: "480px" }}>

        {/* Logo with white circle background */}
        <div style={{
          transition: "all 0.7s",
          opacity:   phase === "logo" ? 0 : 1,
          transform: phase === "logo" ? "scale(0.9)" : "scale(1)",
        }}>
          <div style={{
            background: "white",
            borderRadius: "50%",
            padding: "12px",
            width: "130px",
            height: "130px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 30px rgba(212,175,84,0.4)",
            margin: "0 auto",
          }}>
            <img
              src="/logo.png"
              alt="Reset and Rise"
              style={{ width: "106px", height: "106px", objectFit: "contain" }}
            />
          </div>
        </div>

        {/* Greeting */}
        <div style={{
          transition: "all 0.7s",
          opacity:   (phase === "greeting" || phase === "message" || phase === "fadeout") ? 1 : 0,
          transform: (phase === "greeting" || phase === "message" || phase === "fadeout") ? "translateY(0)" : "translateY(16px)",
        }}>
          <p style={{ color: "#c8bfb0", fontSize: "12px", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: "8px" }}>
            {timeGreeting}
          </p>
          <h1 style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: "42px", color: "#d4af54", fontWeight: 500, margin: 0 }}>
            {firstName} ✦
          </h1>
        </div>

        {/* Message */}
        <div style={{
          transition: "all 0.7s",
          opacity:   (phase === "message" || phase === "fadeout") ? 1 : 0,
          transform: (phase === "message" || phase === "fadeout") ? "translateY(0)" : "translateY(16px)",
        }}>
          <div style={{ borderTop: "1px solid rgba(212,175,84,0.3)", borderBottom: "1px solid rgba(212,175,84,0.3)", padding: "20px 0" }}>
            <p style={{ fontFamily: "var(--font-serif, Georgia, serif)", color: "#e8e0d5", fontSize: "20px", fontStyle: "italic", lineHeight: 1.6, margin: 0 }}>
              &ldquo;{message}&rdquo;
            </p>
          </div>
          <p style={{ color: "#6b7a9a", fontSize: "11px", marginTop: "16px", letterSpacing: "0.2em", textTransform: "uppercase" }}>
            Reset &amp; Rise System
          </p>
        </div>

        {/* Skip */}
        <button
          onClick={onDone}
          style={{ color: "#6b7a9a", fontSize: "12px", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", marginTop: "8px" }}
        >
          Skip
        </button>
      </div>
    </div>
  );
}
