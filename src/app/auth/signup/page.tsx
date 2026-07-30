import { redirect } from "next/navigation";

// Accounts are created through Paddle checkout (see /api/paddle-webhook).
// Direct signup is closed so plans can't be claimed without payment.
export default function SignupPage() {
  redirect("/pricing");
}
