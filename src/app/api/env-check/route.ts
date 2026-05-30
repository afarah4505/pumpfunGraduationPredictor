import { NextResponse } from "next/server";

function present(value: string | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

export async function GET() {
  const vars = {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    BIRDEYE_API_KEY: process.env.BIRDEYE_API_KEY,
    HELIUS_API_KEY: process.env.HELIUS_API_KEY,
    SOLANA_TRACKER_API_KEY: process.env.SOLANA_TRACKER_API_KEY,
    HELIUS_RPC_URL: process.env.HELIUS_RPC_URL,
    SOLANA_RPC_URL: process.env.SOLANA_RPC_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV ?? null,
    checks: Object.fromEntries(
      Object.entries(vars).map(([key, value]) => [
        key,
        {
          present: present(value),
          length: value?.length ?? 0,
        },
      ]),
    ),
  });
}
