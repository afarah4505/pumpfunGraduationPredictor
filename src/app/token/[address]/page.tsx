import { notFound } from "next/navigation";
import { Activity, BadgeDollarSign, PieChart, Wallet } from "lucide-react";
import { GrowthTrendChart } from "@/components/charts/growth-trend-chart";
import { ScoreHistoryChart } from "@/components/charts/score-history-chart";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { ScoreRing } from "@/components/ui/score-ring";
import { buildTokenAnalysis } from "@/lib/token-analysis";

type TokenPageProps = {
  params: Promise<{ address: string }>;
};

export default async function TokenDetailPage({ params }: TokenPageProps) {
  const { address } = await params;

  if (!address || address.length < 20) {
    notFound();
  }

  const token = await buildTokenAnalysis(address);

  return (
    <div className="w-full overflow-x-hidden space-y-6 page-enter">
      <div className="glass rounded-3xl border border-border/70 p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-primary">Token Intelligence</p>
            <h1 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
              {token.name ?? "Unknown Token"} <span className="text-muted">({token.symbol ?? "Unknown"})</span>
            </h1>
            <p className="mt-1 max-w-full break-all text-sm text-muted">{token.address}</p>
            <p className="mt-2 text-xs uppercase tracking-wide text-muted">Data source: {token.dataSource}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-muted">Data completeness: {token.dataCompletenessPercentage}%</p>
          </div>
          <ScoreRing score={token.score} />
        </div>
      </div>

      {token.insufficientData && (
        <Card className="border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
          Provider data is currently unavailable for this token. Retry shortly or verify provider limits.
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Market Cap" value={token.marketCap === null ? "Unknown" : `$${token.marketCap.toLocaleString()}`} icon={<BadgeDollarSign className="h-4 w-4" />} />
        <MetricCard title="Buy/Sell Ratio" value={token.buySellRatio === null ? "Unknown" : token.buySellRatio.toFixed(2)} icon={<Activity className="h-4 w-4" />} tone="bull" />
        <MetricCard title="Holder Count" value={token.holderCount === null ? "Unknown" : token.holderCount.toLocaleString()} icon={<Wallet className="h-4 w-4" />} />
        <MetricCard title="Unique Wallets" value={token.uniqueWalletCount === null ? "Unknown" : token.uniqueWalletCount.toLocaleString()} icon={<PieChart className="h-4 w-4" />} />
      </div>

      <Card>
        <CardDescription>Model Confidence</CardDescription>
        <CardTitle className="mt-2">
          <Badge
            variant={
              token.confidence === "High"
                ? "success"
                : token.confidence === "Medium"
                  ? "warning"
                  : token.confidence === "Low"
                    ? "danger"
                    : "warning"
            }
          >
            {token.confidence ?? "Unavailable"}
          </Badge>
        </CardTitle>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="space-y-3">
          <CardTitle>Score History</CardTitle>
          <ScoreHistoryChart data={token.scoreHistory} />
        </Card>

        <Card className="space-y-3">
          <CardTitle>Growth Trends</CardTitle>
          <GrowthTrendChart data={token.growthTrends} />
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="space-y-2">
          <CardTitle>Bullish Signals</CardTitle>
          {token.bullishSignals.length === 0 ? (
            <p className="text-sm text-muted">No bullish signals available.</p>
          ) : (
            token.bullishSignals.map((signal) => (
              <p key={signal} className="rounded-lg border border-primary/25 bg-primary/10 px-2 py-1 text-sm text-primary">
                + {signal}
              </p>
            ))
          )}
        </Card>

        <Card className="space-y-2">
          <CardTitle>Risk Signals</CardTitle>
          {token.riskSignals.length === 0 ? (
            <p className="text-sm text-muted">No risk signals available.</p>
          ) : (
            token.riskSignals.map((signal) => (
              <p key={signal} className="rounded-lg border border-danger/25 bg-danger/10 px-2 py-1 text-sm text-danger">
                - {signal}
              </p>
            ))
          )}
        </Card>

        <Card className="space-y-2">
          <CardTitle>Holder Distribution</CardTitle>
          {token.holderDistribution.map((part) => (
            <p key={part.name} className="text-sm text-muted">
              {part.name}: {part.percentage.toFixed(1)}%
            </p>
          ))}
        </Card>
      </div>

      <Card className="grid gap-2 text-sm text-muted md:grid-cols-2 xl:grid-cols-4">
        <p>Holder Count: {token.holderCount === null ? "Unknown" : token.holderCount.toLocaleString()}</p>
        <p>Unique Wallets: {token.uniqueWalletCount === null ? "Unknown" : token.uniqueWalletCount.toLocaleString()}</p>
        <p>Volume: {token.volume === null ? "Unknown" : `$${token.volume.toLocaleString()}`}</p>
        <p className="break-all">Address: {token.address}</p>
      </Card>

      {token.missingMetrics.length > 0 && (
        <Card className="p-4 text-xs text-muted">Missing metrics: {token.missingMetrics.join(", ")}</Card>
      )}
    </div>
  );
}