export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-navy-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl text-gold-400 font-medium tracking-wide mb-1">
            Reset &amp; Rise™
          </h1>
          <p className="text-ivory-300 text-xs uppercase tracking-widest">
            The Busy Woman&apos;s Planner System
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
