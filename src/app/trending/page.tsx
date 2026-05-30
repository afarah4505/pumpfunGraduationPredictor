"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { TokenAnalysis, TrendingSortBy } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const sortOptions: Array<{ label: string; value: TrendingSortBy }> = [
  { label: "Highest Graduation Score", value: "score" },
  { label: "Fastest Holder Growth", value: "holderGrowthRate" },
  { label: "Highest Buy Pressure", value: "buySellRatio" },
  { label: "Highest Volume Growth", value: "volumeGrowthRate" },
  { label: "Most Active Wallet Growth", value: "uniqueWalletCount" },
];

export default function TrendingPage() {
  const [items, setItems] = useState<TokenAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<TrendingSortBy>("score");
  const [minScore, setMinScore] = useState("31");

  useEffect(() => {
    async function loadTrending() {
      setLoading(true);
      const response = await fetch(`/api/trending?sortBy=${sortBy}`);
      const json = (await response.json()) as { data: TokenAnalysis[] };
      setItems(json.data ?? []);
      setLoading(false);
    }

    void loadTrending();
  }, [sortBy]);

  const filtered = useMemo(() => {
    const parsedMin = Number(minScore) || 0;
    return items.filter((item) => !item.isGraduated && (item.score ?? Number.NEGATIVE_INFINITY) >= parsedMin);
  }, [items, minScore]);

  const topThree = filtered.slice(0, 3);

  return (
    <div className="space-y-6 page-enter">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-primary">Live Leaderboard</p>
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Trending Opportunities</h1>
        <p className="mt-1 text-sm text-muted">Ranked by graduation score, growth velocity, and buy pressure.</p>
      </div>

      <Card className="space-y-4 border border-border/80 bg-background-soft/70">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="text-muted">Sort by</span>
            <select
              className="h-10 w-full rounded-xl border border-border bg-background-panel px-3 text-sm text-foreground"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as TrendingSortBy)}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-muted">Minimum score</span>
            <Input value={minScore} onChange={(event) => setMinScore(event.target.value)} type="number" min={0} max={100} />
          </label>
        </div>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="rounded-xl border border-border/80 bg-background-panel p-4 text-sm text-muted">No tokens match this filter.</p>
        ) : (
          <div className="space-y-4">
            {topThree.length > 0 && (
              <div className="grid gap-3 md:grid-cols-3">
                {topThree.map((token, index) => (
                  <div key={token.address} className="rounded-2xl border border-border/70 bg-background-panel p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted">Top {index + 1}</p>
                    <p className="mt-2 text-lg font-semibold text-foreground">{token.symbol ?? "Unknown"}</p>
                    <p className="text-xs text-muted">{token.name ?? "Unknown Token"}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <Badge
                        variant={
                          token.isGraduated
                            ? "success"
                            : token.score === null
                            ? "warning"
                            : token.score >= 61
                              ? "success"
                              : token.score >= 31
                                ? "warning"
                                : "danger"
                        }
                      >
                        {token.isGraduated ? "Graduated" : token.score === null ? "N/A" : `${token.score}%`}
                      </Badge>
                      <Link href={`/token/${token.address}`} className="inline-flex text-primary hover:underline">
                        Open
                        <ArrowUpRight className="ml-1 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              {filtered.map((token) => (
                <div key={token.address} className="rounded-xl border border-border/80 bg-background-panel p-3 transition hover:bg-background-soft/80">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground">
                      {token.name ?? "Unknown Token"} <span className="text-muted">({token.symbol ?? "N/A"})</span>
                    </p>
                    <p className="text-xs text-muted">{token.address}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        token.isGraduated
                          ? "success"
                          : token.score === null
                          ? "warning"
                          : token.score >= 61
                            ? "success"
                            : token.score >= 31
                              ? "warning"
                              : "danger"
                      }
                    >
                      {token.isGraduated ? "Graduated" : token.score === null ? "N/A" : `${token.score}%`}
                    </Badge>
                    <Link href={`/token/${token.address}`} className="inline-flex text-primary hover:underline">
                      View
                      <ArrowUpRight className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}