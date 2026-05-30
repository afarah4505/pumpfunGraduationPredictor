import { AnalyzeTokenPanel } from "@/components/analyze-token-panel";

type DashboardPageProps = {
  searchParams: Promise<{ address?: string }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { address } = await searchParams;

  return (
    <div className="space-y-6 page-enter">
      <div className="rounded-2xl border border-border/70 bg-background-soft/70 p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-primary">PumpIQ Workstation</p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">Run analysis, monitor risk, and track tokens on your watchlist with live signal confidence.</p>
      </div>

      <AnalyzeTokenPanel initialWatchlist={[]} initialAddress={address ?? ""} />
    </div>
  );
}