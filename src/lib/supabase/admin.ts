import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client for server-only jobs that have no user session (payment webhooks).
 * Requires SUPABASE_SERVICE_ROLE_KEY as a Cloudflare secret; never import from client code.
 */
export function adminConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
