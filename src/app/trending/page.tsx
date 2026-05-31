"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Conviction = "High Conviction" | "Medium Conviction";

type TrendingOpportunity = {
  rank: number;
  address: string;
  name: string;
  symbol: string;
  score: number;
  confidence: "Low" | "Medium" | "High";
  conviction: Conviction;
};

type TrendingResponse = {
  data: TrendingOpportunity[];
  source?: "live-api";
  discoveryCount?: number;
  emptyReason?: string;
  generatedAt?: string;
};

export default function TrendingPage() {
  const [items, setItems] = useState<TrendingOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [discoveryCount, setDiscoveryCount] = useState<number | null>(null);
  const [emptyReason, setEmptyReason] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadTrending() {
      try {
        const response = await fetch("/api/trending", {
          cache: "no-store",
        });

        const json = (await response.json()) as TrendingResponse;
        if (!active) {
          return;
        }

        setItems(json.data ?? []);
        setDiscoveryCount(json.discoveryCount ?? null);
        setEmptyReason(json.emptyReason ?? null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadTrending();
    const intervalId = window.setInterval(() => {
      void loadTrending();
    }, 15000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const displayedItems = useMemo(() => items, [items]);

  return (
    <div className="space-y-6 page-enter">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-primary">Live Leaderboard</p>
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Trending Opportunities</h1>
        <p className="mt-1 text-sm text-muted">Live discovery and real-time scoring of recently launched Pump.fun tokens.</p>
      </div>

      <Card className="space-y-6 border border-border/80 bg-background-soft/70 p-4 sm:p-5">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : items.length === 0 ? (
          <p className="rounded-xl border border-border/80 bg-background-panel p-4 text-sm text-muted">
            {discoveryCount === 0 || emptyReason === "No new tokens discovered yet."
              ? "No new tokens discovered yet."
              : "No high-conviction opportunities found."}
          </p>
        ) : (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">Top Opportunities</h2>
            <div className="space-y-2">
              {displayedItems.map((token) => (
                <div key={token.address} className="rounded-xl border border-border/80 bg-background-panel p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        #{token.rank} {token.name} <span className="text-muted">({token.symbol})</span>
                      </p>
                      <p className="text-xs text-muted">{token.address}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="success">{token.score}%</Badge>
                      <Badge variant={token.confidence === "High" ? "success" : token.confidence === "Medium" ? "warning" : "default"}>
                        {token.confidence} Confidence
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
          </section>
        )}
      </Card>
    </div>
  );
}
