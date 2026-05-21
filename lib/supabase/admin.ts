import { createClient } from "@supabase/supabase-js";
import { publicEnv, serverEnv } from "../env";

/**
 * Creates a Supabase client with admin privileges using the SUPABASE_SERVICE_ROLE_KEY.
 * This client bypasses Row Level Security (RLS) and is server-only.
 *
 * WARNING: Never import this in any client component.
 */
export function createSupabaseAdminClient() {
  return createClient(
    publicEnv.PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
