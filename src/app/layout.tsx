import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reset & Rise™ — The Busy Woman's Planner System",
  description: "Your all-in-one life planner. Reset your mind, money, meals and wellness.",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "Reset & Rise™",
    description: "Brew calm. Brew clarity. Brew control.",
    siteName: "Reset & Rise™",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
