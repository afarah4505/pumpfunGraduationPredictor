import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchPrimarySolanaPair, fetchTrendingAddresses } from "@/lib/dexscreener";
import { buildTokenAnalysis } from "@/lib/token-analysis";
import type { TokenAnalysis, TrendingSortBy } from "@/lib/types";

const querySchema = z.object({
  sortBy: z
    .enum(["score", "holderGrowthRate", "buySellRatio", "volumeGrowthRate", "uniqueWalletCount"])
    .default("score"),
});

function sortTokens(tokens: TokenAnalysis[], sortBy: TrendingSortBy) {
  return [...tokens].sort((a, b) => {
    const aValue = a[sortBy] ?? Number.NEGATIVE_INFINITY;
    const bValue = b[sortBy] ?? Number.NEGATIVE_INFINITY;
    return bValue - aValue;
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    sortBy: url.searchParams.get("sortBy") ?? "score",
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid sort option" }, { status: 400 });
  }

  const liveAddresses = await fetchTrendingAddresses(30);

  if (liveAddresses.length === 0) {
    return NextResponse.json({ data: [], message: "No live trending tokens available right now" });
  }

  const primaryPairs = await Promise.all(liveAddresses.map((address) => fetchPrimarySolanaPair(address)));
  const pumpfunPreferred = liveAddresses.filter((_, index) => {
    const dexId = (primaryPairs[index]?.dexId ?? "").toLowerCase();
    return dexId === "pumpfun";
  });

  const targetAddresses = (pumpfunPreferred.length > 0 ? pumpfunPreferred : liveAddresses).slice(0, 12);

  const data = await Promise.all(targetAddresses.map((address) => buildTokenAnalysis(address)));
  const opportunities = data.filter((token) => !token.isGraduated && (token.score ?? Number.NEGATIVE_INFINITY) >= 31);

  return NextResponse.json({ data: sortTokens(opportunities, parsed.data.sortBy) });
}