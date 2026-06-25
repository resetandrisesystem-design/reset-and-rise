import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Admin client — uses the SERVICE ROLE key, never the anon key.
 * This bypasses Row Level Security, so it must ONLY be used in trusted
 * server-side code (API routes / webhooks), never in client components.
 *
 * Required env var: SUPABASE_SERVICE_ROLE_KEY
 * (Find it in Supabase → Settings → API → service_role key)
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
