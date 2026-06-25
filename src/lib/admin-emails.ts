/**
 * Admin allow-list — only these emails can access /dashboard/admin
 * and call the admin API routes. Add/remove emails here as needed.
 */
export const ADMIN_EMAILS = [
  "meesamnaqvi1224@gmail.com",
  "resetandrisesystem@gmail.com",
];

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
