import { notFound } from "next/navigation";
import { fetchTokenDebugData } from "@/lib/analysis-providers";
import { isValidSolanaMintAddress } from "@/lib/solana-validation";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

type DebugPageProps = {
  params: Promise<{ tokenAddress: string }>;
};

export default async function DebugTokenPage({ params }: DebugPageProps) {
  const { tokenAddress } = await params;

  if (!isValidSolanaMintAddress(tokenAddress)) {
    notFound();
  }

  const debug = await fetchTokenDebugData(tokenAddress);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Token Debug</h1>
        <p className="mt-1 text-sm text-muted">{tokenAddress}</p>
      </div>

      <Card className="space-y-3">
        <CardTitle>Provider Used</CardTitle>
        <CardDescription>
          name: {debug.providerUsed.name ?? "none"} | symbol: {debug.providerUsed.symbol ?? "none"} | price: {debug.providerUsed.price ?? "none"} |
          marketCap: {debug.providerUsed.marketCap ?? "none"} | liquidity: {debug.providerUsed.liquidity ?? "none"} | volume: {debug.providerUsed.volume ?? "none"}
        </CardDescription>
      </Card>

      <Card className="space-y-3">
        <CardTitle>Parsed Fields</CardTitle>
        <pre className="overflow-auto rounded-lg border border-border/70 bg-[#0a1424] p-4 text-xs text-muted">
          {JSON.stringify(debug.parsedFields, null, 2)}
        </pre>
      </Card>

      <Card className="space-y-3">
        <CardTitle>Missing Fields</CardTitle>
        <CardDescription>{debug.missingFields.length > 0 ? debug.missingFields.join(", ") : "None"}</CardDescription>
      </Card>

      <Card className="space-y-3">
        <CardTitle>Provider Existence Check</CardTitle>
        <pre className="overflow-auto rounded-lg border border-border/70 bg-[#0a1424] p-4 text-xs text-muted">
          {JSON.stringify(
            debug.providerChecks.map((item) => ({
              provider: item.provider,
              exists: item.exists,
              calls: item.checks.map((call) => ({
                endpoint: call.endpoint,
                status: call.status,
                ok: call.ok,
                error: call.error,
              })),
            })),
            null,
            2,
          )}
        </pre>
      </Card>

      <Card className="space-y-3">
        <CardTitle>Raw API Responses</CardTitle>
        <pre className="max-h-[60vh] overflow-auto rounded-lg border border-border/70 bg-[#0a1424] p-4 text-xs text-muted">
          {JSON.stringify(debug.rawResponses, null, 2)}
        </pre>
      </Card>

      <Card className="space-y-3">
        <CardTitle>Errors</CardTitle>
        <pre className="overflow-auto rounded-lg border border-border/70 bg-[#0a1424] p-4 text-xs text-danger">
          {JSON.stringify(debug.errors, null, 2)}
        </pre>
      </Card>
    </div>
  );
}
