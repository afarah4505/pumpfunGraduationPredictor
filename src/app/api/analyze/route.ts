import { NextResponse } from "next/server";
import { z } from "zod";
import { buildTokenAnalysis } from "@/lib/token-analysis";
import { isValidSolanaMintAddress, validateOnChainMintAddress } from "@/lib/solana-validation";
import { upsertAnalyzedToken } from "@/lib/supabase/tokens";

const schema = z.object({
  address: z.string().min(20),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = schema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid token address" }, { status: 400 });
    }

    if (!isValidSolanaMintAddress(parsed.data.address)) {
      return NextResponse.json({ error: "Address must be a valid Solana mint public key" }, { status: 400 });
    }

    console.info("[api:analyze] input-token-address", parsed.data.address);

    const mintValidation = await validateOnChainMintAddress(parsed.data.address);
    if (!mintValidation.isMint) {
      console.error("[api:analyze] on-chain-mint-validation-failed", {
        address: parsed.data.address,
        error: mintValidation.error,
      });
      return NextResponse.json(
        { error: `Address is not a token mint account. ${mintValidation.error ?? "Unknown reason"}` },
        { status: 400 },
      );
    }

    const data = await buildTokenAnalysis(parsed.data.address);
    await upsertAnalyzedToken(data);

    if (!data.name && !data.symbol) {
      console.error("[api:analyze] token-metadata-not-found", {
        address: parsed.data.address,
        metricErrors: data.metricErrors,
      });

      // Do not fail the request when upstream provider data is partial.
      // The UI can still render a degraded analysis from available metrics.
      return NextResponse.json({
        data,
        warning: "Token metadata not found from providers. Returning partial analysis.",
        details: data.metricErrors,
      });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[api:analyze] failed", {
      error: error instanceof Error ? error.message : "Unknown analyze error",
    });
    return NextResponse.json({ error: "Failed to analyze token" }, { status: 500 });
  }
}