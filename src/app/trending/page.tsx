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
  source?: "strict" | "recent-fallback";
  generatedAt?: string;
};

export default function TrendingPage() {
  const [items, setItems] = useState<TrendingOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"strict" | "recent-fallback">("strict");

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
        setSource(json.source ?? "strict");
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

  const highConviction = useMemo(() => items.filter((item) => item.conviction === "High Conviction"), [items]);
  const mediumConviction = useMemo(() => items.filter((item) => item.conviction === "Medium Conviction"), [items]);

  return (
    <div className="space-y-6 page-enter">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-primary">Live Leaderboard</p>
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Trending Opportunities</h1>
        <p className="mt-1 text-sm text-muted">
          {source === "strict"
            ? "Strictly ranked by graduation probability score, highest to lowest."
            : "Showing recent analyzed tokens while strict high-conviction rankings are still populating."}
        </p>
      </div>

      <Card className="space-y-6 border border-border/80 bg-background-soft/70 p-4 sm:p-5">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-border/80 bg-background-panel p-4 text-sm text-muted">
            <p>No trending tokens found yet.</p>
            <p className="mt-2">Local setup checklist:</p>
            <ol className="mt-1 list-decimal space-y-1 pl-5">
              <li>Run SQL from <code>supabase/schema.sql</code> in your Supabase project.</li>
              <li>Ensure <code>SUPABASE_SERVICE_ROLE_KEY</code> is set in <code>.env.local</code>.</li>
              <li>Analyze at least one token from the home page to populate the tokens table.</li>
            </ol>
          </div>
        ) : (
          <>
            <section className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">High Conviction</h2>
              {highConviction.length === 0 ? (
                <p className="rounded-xl border border-border/70 bg-background-panel p-3 text-sm text-muted">No high-conviction tokens currently ranked.</p>
              ) : (
                <div className="space-y-2">
                  {highConviction.map((token) => (
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
              )}
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-warning">Medium Conviction</h2>
              {mediumConviction.length === 0 ? (
                <p className="rounded-xl border border-border/70 bg-background-panel p-3 text-sm text-muted">No medium-conviction tokens currently ranked.</p>
              ) : (
                <div className="space-y-2">
                  {mediumConviction.map((token) => (
                    <div key={token.address} className="rounded-xl border border-border/80 bg-background-panel p-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            #{token.rank} {token.name} <span className="text-muted">({token.symbol})</span>
                          </p>
                          <p className="text-xs text-muted">{token.address}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="warning">{token.score}%</Badge>
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
              )}
            </section>
          </>
        )}
      </Card>
    </div>
  );
}
