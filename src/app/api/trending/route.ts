import { NextResponse } from "next/server";
import { fetchTrendingOpportunitiesFromDb } from "@/lib/supabase/tokens";

export const dynamic = "force-dynamic";

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
  const rows = await fetchTrendingOpportunitiesFromDb();

  const ranked: RankedOpportunity[] = rows
    .filter((token) => token.score >= 60 && (token.confidence === "Medium" || token.confidence === "High"))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      const confidenceRank = {
        High: 3,
        Medium: 2,
        Low: 1,
      } as const;

      const confidenceDiff = confidenceRank[b.confidence] - confidenceRank[a.confidence];
      if (confidenceDiff !== 0) {
        return confidenceDiff;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .map((token, index) => {
      const rankedToken: RankedOpportunity = {
        rank: index + 1,
        address: token.address,
        name: token.name,
        symbol: token.symbol,
        score: token.score,
        confidence: token.confidence,
        conviction: toConviction(token.score),
      };

      console.info("[api:trending] rank", {
        token: `${rankedToken.symbol} (${rankedToken.address})`,
        score: rankedToken.score,
        confidence: rankedToken.confidence,
        sourceTable: "public.tokens",
        rankingPosition: rankedToken.rank,
      });

      return rankedToken;
    });

  return NextResponse.json(
    {
      data: ranked,
      source: "public.tokens",
      generatedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
