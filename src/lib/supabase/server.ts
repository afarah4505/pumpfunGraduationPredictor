import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env";

export function createServerSupabaseClient() {
  const env = getServerEnv();

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        "x-application-name": "pumpiq-server",
      },
    },
  });
}
