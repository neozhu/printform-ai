import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "../env";

/**
 * Creates a Supabase client suitable for Server Components, Route Handlers, or Server Actions.
 * Currently, it initializes a basic client. If cookie-based authentication is required later,
 * this can be extended using @supabase/ssr and cookies from next/headers.
 */
export function createSupabaseServerClient() {
  return createClient(
    publicEnv.PUBLIC_SUPABASE_URL,
    publicEnv.PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  );
}
