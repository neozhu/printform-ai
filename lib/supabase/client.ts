import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "../env";

// Create a browser Supabase client using client-safe public variables
export const supabase = createClient(
  publicEnv.PUBLIC_SUPABASE_URL,
  publicEnv.PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
);
