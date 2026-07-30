import Link from "next/link";

export const metadata = {
  title: "Payment successful — Reset & Rise™",
};

export default function CheckoutSuccessPage() {
  return (
    <main className="min-h-screen bg-ivory-100 flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl shadow-sm border border-ivory-300 p-8 max-w-md w-full text-center">
        <div className="text-4xl mb-4">✦</div>
        <h1 className="font-serif text-2xl text-navy-500 font-medium mb-2">
          Payment successful — welcome!
        </h1>
        <p className="text-sm text-navy-400 leading-relaxed mb-6">
          Your account is being set up. Check your email for your sign-in link —
          it can take a minute or two to arrive. Once you&apos;re in, your plan
          will be waiting for you.
        </p>
        <p className="text-xs text-navy-400 mb-6">
          Already have an account? Your new plan has been applied — just sign in
          as usual.
        </p>
        <Link href="/auth/login" className="btn-primary inline-block">
          Go to sign in
        </Link>
      </div>
    </main>
  );
}
