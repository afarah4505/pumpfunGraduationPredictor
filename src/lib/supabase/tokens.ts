import type { ConfidenceLevel, TokenAnalysis } from "@/lib/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type TrendingOpportunity = {
  address: string;
  name: string;
  symbol: string;
  score: number;
  confidence: ConfidenceLevel;
};

type DbTokenRow = {
  address: string;
  name: string;
  symbol: string;
  score: number;
  confidence: ConfidenceLevel;
};

export async function upsertAnalyzedToken(data: TokenAnalysis) {
  if (data.score === null || data.confidence === null || data.insufficientData) {
    return;
  }

  const supabase = createServerSupabaseClient();
  if (!supabase) {
    console.warn("[supabase:tokens] SUPABASE_SERVICE_ROLE_KEY missing; skipping token upsert", {
      address: data.address,
    });
    return;
  }

  const row = {
    address: data.address,
    name: data.name ?? "Unknown Token",
    symbol: data.symbol ?? "UNKNOWN",
    score: data.score,
    confidence: data.confidence,
  };

  const { error } = await supabase
    .from("tokens")
    .upsert(row, { onConflict: "address" });

  if (error) {
    console.error("[supabase:tokens] failed upsert", {
      address: data.address,
      error: error.message,
    });
  }
}

export async function fetchTrendingOpportunitiesFromDb(): Promise<TrendingOpportunity[]> {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    console.warn("[supabase:tokens] SUPABASE_SERVICE_ROLE_KEY missing; trending read returns empty");
    return [];
  }

  const { data, error } = await supabase
    .from("tokens")
    .select("address, name, symbol, score, confidence")
    .gte("score", 60)
    .in("confidence", ["Medium", "High"])
    .order("score", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[supabase:tokens] failed trending read", { error: error.message });
    return [];
  }

  return ((data ?? []) as DbTokenRow[]).map((row) => ({
    address: row.address,
    name: row.name,
    symbol: row.symbol,
    score: row.score,
    confidence: row.confidence,
  }));
}
