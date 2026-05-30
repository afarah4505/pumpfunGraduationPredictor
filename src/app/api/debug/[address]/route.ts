import { NextResponse } from "next/server";
import { fetchTokenDebugData } from "@/lib/analysis-providers";
import { isValidSolanaMintAddress } from "@/lib/solana-validation";

type RouteContext = {
  params: Promise<{ address: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { address } = await context.params;

    if (!isValidSolanaMintAddress(address)) {
      return NextResponse.json({ error: "Invalid Solana public key" }, { status: 400 });
    }

    const data = await fetchTokenDebugData(address);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("[api:debug] failed", {
      error: error instanceof Error ? error.message : "Unknown debug route error",
    });
    return NextResponse.json({ error: "Failed to fetch debug diagnostics" }, { status: 500 });
  }
}
