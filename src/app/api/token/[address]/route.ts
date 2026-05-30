import { NextResponse } from "next/server";
import { z } from "zod";
import { buildTokenAnalysis } from "@/lib/token-analysis";
import { isValidSolanaMintAddress, validateOnChainMintAddress } from "@/lib/solana-validation";

const paramsSchema = z.object({
  address: z.string().min(20),
});

type RouteContext = {
  params: Promise<{ address: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const params = await context.params;
    const parsed = paramsSchema.safeParse(params);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid token address" }, { status: 400 });
    }

    if (!isValidSolanaMintAddress(parsed.data.address)) {
      return NextResponse.json({ error: "Address must be a valid Solana mint public key" }, { status: 400 });
    }

    const mintValidation = await validateOnChainMintAddress(parsed.data.address);
    if (!mintValidation.isMint) {
      console.error("[api:token] on-chain-mint-validation-failed", {
        address: parsed.data.address,
        error: mintValidation.error,
      });
      return NextResponse.json(
        { error: `Address is not a token mint account. ${mintValidation.error ?? "Unknown reason"}` },
        { status: 400 },
      );
    }

    const data = await buildTokenAnalysis(parsed.data.address);

    if (!data.name && !data.symbol) {
      console.error("[api:token] token-metadata-not-found", {
        address: parsed.data.address,
        metricErrors: data.metricErrors,
      });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[api:token] failed", {
      error: error instanceof Error ? error.message : "Unknown token route error",
    });
    return NextResponse.json({ error: "Failed to fetch token details" }, { status: 500 });
  }
}