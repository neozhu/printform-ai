import { z } from "zod";

const publicEnvSchema = z.object({
  PUBLIC_SUPABASE_URL: z.string().url("PUBLIC_SUPABASE_URL must be a valid URL"),
  PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: z.string().min(1, "PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY is required"),
});

const serverEnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  OPENAI_MODEL: z.string().default("gpt-5-mini"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
});

// Validate public environment variables immediately
export const publicEnv = publicEnvSchema.parse({
  PUBLIC_SUPABASE_URL: process.env.PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: process.env.PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
});

// Validate and export server environment variables safely.
// If imported in a client component, accessing any server property will throw a clean error.
export const serverEnv = typeof window === "undefined"
  ? serverEnvSchema.parse({
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-5-mini",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    })
  : new Proxy({} as z.infer<typeof serverEnvSchema>, {
      get(target, prop) {
        throw new Error(
          `[Security Error] Attempted to access server-side environment variable "${String(
            prop
          )}" on the client.`
        );
      },
    });
