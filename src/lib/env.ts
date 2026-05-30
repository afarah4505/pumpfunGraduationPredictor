import { z } from "zod";

const serverEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  BIRDEYE_API_KEY: z.string().min(1).optional(),
  HELIUS_API_KEY: z.string().min(1).optional(),
  SOLANA_TRACKER_API_KEY: z.string().min(1).optional(),
  HELIUS_RPC_URL: z.string().url().optional(),
  SOLANA_RPC_URL: z.string().url().optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
});

const defaultEnv = {
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  NEXT_PUBLIC_SUPABASE_URL: "https://placeholder.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "placeholder-anon-key",
  SOLANA_RPC_URL: "https://api.mainnet-beta.solana.com",
};

let cachedServerEnv: z.infer<typeof serverEnvSchema> | null = null;

export function getServerEnv() {
  if (cachedServerEnv) {
    return cachedServerEnv;
  }

  const parsed = serverEnvSchema.parse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? defaultEnv.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? defaultEnv.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? defaultEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    BIRDEYE_API_KEY: process.env.BIRDEYE_API_KEY,
    HELIUS_API_KEY: process.env.HELIUS_API_KEY,
    SOLANA_TRACKER_API_KEY: process.env.SOLANA_TRACKER_API_KEY,
    HELIUS_RPC_URL: process.env.HELIUS_RPC_URL,
    SOLANA_RPC_URL: process.env.SOLANA_RPC_URL ?? defaultEnv.SOLANA_RPC_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });

  cachedServerEnv = parsed;
  return parsed;
}