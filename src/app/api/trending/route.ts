import { NextResponse } from "next/server";
import { discoverRecentPumpfunTokenAddresses } from "@/lib/token-discovery";
import { buildTokenAnalysis } from "@/lib/token-analysis";

export const dynamic = "force-dynamic";

const SCORE_THRESHOLD = 65;
const DISCOVERY_LIMIT = 30;
const DISPLAY_LIMIT = 20;
const EXCLUDED_MINTS = new Set(["So11111111111111111111111111111111111111112"]);

type Conviction = "High Conviction" | "Medium Conviction";

type RankedOpportunity = {
  rank: number;
  address: string;
  name: string;
  symbol: string;
  score: number;
  confidence: "Low" | "Medium" | "High";
  conviction: Conviction;
};

function toConviction(score: number): Conviction {
  return score >= 80 ? "High Conviction" : "Medium Conviction";
}

export async function GET() {
  const discovery = await discoverRecentPumpfunTokenAddresses(DISCOVERY_LIMIT);
  const discoveredAddresses = discovery.addresses;

  console.info("[api:trending] tokens-fetched", {
    count: discoveredAddresses.length,
    addresses: discoveredAddresses,
    sources: discovery.details,
  });

  if (discoveredAddresses.length === 0) {
    console.warn("[api:trending] discovery-empty", {
      message: "No new tokens discovered yet.",
      sources: discovery.details,
    });

    return NextResponse.json(
      {
        data: [],
        source: "live-api",
        discoveryCount: 0,
        discoveryDetails: discovery.details,
        emptyReason: "No new tokens discovered yet.",
        generatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  }

  const analyzedResults = await Promise.allSettled(
    discoveredAddresses.map(async (address) => buildTokenAnalysis(address)),
  );

  const analyzedTokens = analyzedResults
    .filter((result): result is PromiseFulfilledResult<Awaited<ReturnType<typeof buildTokenAnalysis>>> => result.status === "fulfilled")
    .map((result) => result.value)
    .filter((value): value is Awaited<ReturnType<typeof buildTokenAnalysis>> => value !== null);

  console.info("[api:trending] tokens-analyzed", {
    discoveredCount: discoveredAddresses.length,
    analyzedCount: analyzedTokens.length,
  });

  console.info(
    "[api:trending] scores-generated",
    analyzedTokens.map((token) => ({
      token: `${token.symbol ?? "UNKNOWN"} (${token.address})`,
      score: token.score,
      confidence: token.confidence,
    })),
  );

  const ranked: RankedOpportunity[] = analyzedTokens
    .filter((token) => !EXCLUDED_MINTS.has(token.address))
    .filter((token) => token.score !== null && token.score >= SCORE_THRESHOLD)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, DISPLAY_LIMIT)
    .map((token, index) => ({
      rank: index + 1,
      address: token.address,
      name: token.name ?? "Unknown Token",
      symbol: token.symbol ?? "UNKNOWN",
      score: token.score ?? 0,
      confidence: token.confidence ?? "Low",
      conviction: toConviction(token.score ?? 0),
    }));

  console.info("[api:trending] tokens-displayed", {
    count: ranked.length,
    tokens: ranked.map((token) => ({
      token: `${token.symbol} (${token.address})`,
      score: token.score,
      confidence: token.confidence,
      sourceTable: "live-api",
    })),
  });

  return NextResponse.json(
    {
      data: ranked,
      source: "live-api",
      discoveryCount: discoveredAddresses.length,
      discoveryDetails: discovery.details,
      generatedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
