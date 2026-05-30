"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Activity, ArrowRight, BadgeDollarSign, Star, Users, Wallet } from "lucide-react";
import type { TokenAnalysis } from "@/lib/types";
import { shortAddress } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MetricCard } from "@/components/ui/metric-card";
import { Progress } from "@/components/ui/progress";
import { ScoreRing } from "@/components/ui/score-ring";
import { Skeleton } from "@/components/ui/skeleton";
import { appendScoreSnapshot } from "@/lib/score-history-client";

type WatchlistItem = {
  id: string;
  created_at: string;
  token: {
    id: string;
    address: string;
    name: string;
    score: number | null;
    isGraduated?: boolean;
  };
};

type AnalyzeTokenPanelProps = {
  initialWatchlist: WatchlistItem[];
  initialAddress?: string;
};

type AnalyzeResponse = {
  error?: string;
  warning?: string;
  details?: string[];
  data?: TokenAnalysis;
};

function isLikelyBase58Mint(value: string) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
}

function normalizeAddressInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (isLikelyBase58Mint(trimmed)) {
    return trimmed;
  }

  const candidates: string[] = [];

  try {
    const parsed = new URL(trimmed);
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    candidates.push(...pathParts);

    const queryValues = [
      parsed.searchParams.get("address"),
      parsed.searchParams.get("mint"),
      parsed.searchParams.get("token"),
      parsed.searchParams.get("ca"),
    ].filter(Boolean) as string[];
    candidates.push(...queryValues);
  } catch {
    // Not a URL, continue with tokenized raw text fallback.
  }

  candidates.push(...trimmed.split(/[^1-9A-HJ-NP-Za-km-z]+/g));

  const normalized = candidates.find((part) => isLikelyBase58Mint(part));
  return normalized ?? trimmed;
}

async function readJsonSafely<T>(response: Response): Promise<T | null> {
  const contentType = response.headers.get("content-type") ?? "";
  const raw = await response.text();

  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function AnalyzeTokenPanel({ initialWatchlist, initialAddress = "" }: AnalyzeTokenPanelProps) {
  const [address, setAddress] = useState(normalizeAddressInput(initialAddress));
  const [result, setResult] = useState<TokenAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [warningDetails, setWarningDetails] = useState<string[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(initialWatchlist);
  const [watchlistBusy, setWatchlistBusy] = useState(false);
  const hasAutoAnalyzed = useRef(false);

  useEffect(() => {
    const raw = window.localStorage.getItem("pumpfun-watchlist");
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as WatchlistItem[];
      setWatchlist(parsed);

      const needsGraduationBackfill = parsed.some((item) => item.token.isGraduated === undefined);
      if (!needsGraduationBackfill) {
        return;
      }

      void (async () => {
        const updates = await Promise.all(
          parsed.map(async (item) => {
            if (item.token.isGraduated !== undefined) {
              return item;
            }

            try {
              const response = await fetch(`/api/token/${item.token.address}`);
              if (!response.ok) {
                return item;
              }

              const json = await response.json() as { data?: TokenAnalysis };
              if (!json.data) {
                return item;
              }

              return {
                ...item,
                token: {
                  ...item.token,
                  score: json.data.score,
                  isGraduated: json.data.isGraduated,
                },
              };
            } catch {
              return item;
            }
          }),
        );

        setWatchlist(updates);
      })();
    } catch {
      setWatchlist([]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("pumpfun-watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  const isSaved = useMemo(() => {
    if (!result) {
      return false;
    }

    return watchlist.some((item) => item.token.address === result.address);
  }, [result, watchlist]);

  function formatNumber(value: number | null, digits = 0) {
    if (value === null) {
      return "Unknown";
    }

    return digits > 0 ? value.toFixed(digits) : value.toLocaleString();
  }

  const analyzeToken = useCallback(async (tokenAddress?: string) => {
    const targetAddress = normalizeAddressInput(tokenAddress ?? address);
    if (!targetAddress) {
      return;
    }

    if (targetAddress !== address) {
      setAddress(targetAddress);
    }

    setLoading(true);
    setError(null);
    setWarning(null);
    setWarningDetails([]);

    try {
      console.info("[ui:analyze] request", {
        inputTokenAddress: targetAddress,
        apiUrl: "/api/analyze",
      });

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address: targetAddress }),
      });

      console.info("[ui:analyze] response-status", {
        inputTokenAddress: targetAddress,
        status: response.status,
      });

      const json = await readJsonSafely<AnalyzeResponse>(response);

      if (!response.ok) {
        throw new Error(json?.error ?? "Analyze request failed. Please try again.");
      }

      if (!json?.data) {
        throw new Error("Server returned an unexpected response format.");
      }

      setResult(json.data);
      appendScoreSnapshot(json.data.address, json.data.score);
      setWarning(json.warning ?? null);
      setWarningDetails(json.details ?? []);
    } catch (analysisError) {
      setResult(null);
      setError(analysisError instanceof Error ? analysisError.message : "Analysis failed");
      setWarning(null);
      setWarningDetails([]);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    const trimmed = normalizeAddressInput(initialAddress);
    if (!trimmed || hasAutoAnalyzed.current) {
      return;
    }

    hasAutoAnalyzed.current = true;
    setAddress(trimmed);
    void analyzeToken(trimmed);
  }, [initialAddress, analyzeToken]);

  async function addToWatchlist() {
    if (!result) {
      return;
    }

    setWatchlistBusy(true);
    setError(null);

    try {
      const next: WatchlistItem = {
        id: result.address,
        created_at: new Date().toISOString(),
        token: {
          id: result.address,
          address: result.address,
          name: result.name ?? result.symbol ?? result.address,
          score: result.score,
          isGraduated: result.isGraduated,
        },
      };

      setWatchlist((previous) => {
        const exists = previous.some((item) => item.token.address === result.address);
        if (exists) {
          return previous;
        }
        return [next, ...previous];
      });
    } catch (watchlistError) {
      setError(watchlistError instanceof Error ? watchlistError.message : "Unable to save token");
    } finally {
      setWatchlistBusy(false);
    }
  }

  async function removeFromWatchlist(tokenAddress: string) {
    setWatchlistBusy(true);
    setError(null);

    try {
      setWatchlist((previous) => previous.filter((item) => item.token.address !== tokenAddress));
    } catch (watchlistError) {
      setError(watchlistError instanceof Error ? watchlistError.message : "Unable to remove token");
    } finally {
      setWatchlistBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
      <Card className="space-y-4 border border-border/80 bg-background-soft/70">
        <div>
          <CardTitle>Analyze Pump.fun Token</CardTitle>
          <CardDescription>Paste a token address to generate a graduation score, confidence tier, and risk profile.</CardDescription>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="Enter Pump.fun token address"
          />
          <Button disabled={loading || !address.trim()} onClick={() => void analyzeToken()}>
            {loading ? "Analyzing..." : "Analyze"}
          </Button>
        </div>

        {error && <p className="rounded-lg border border-danger/20 bg-danger/10 p-3 text-sm text-danger">{error}</p>}

        {warning && (
          <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
            <p>{warning}</p>
            {warningDetails.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-warning/90">
                {warningDetails.slice(0, 5).map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {!loading && !result && !error && (
          <p className="rounded-xl border border-border/80 bg-background-panel p-5 text-sm text-muted">
            No analysis yet. Enter an address to generate score, confidence, and risk profile.
          </p>
        )}

        {result && !loading && (
          <div className="space-y-4 page-enter">
            <div className="rounded-xl border border-border/70 bg-background-panel p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    {result.name ?? "Unknown Token"} <span className="text-muted">({result.symbol ?? "Unknown"})</span>
                  </p>
                  <p className="text-sm text-muted">{shortAddress(result.address)}</p>
                  <p className="mt-2 text-xs text-muted">Data completeness: {result.dataCompletenessPercentage}%</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge
                    variant={
                      result.confidence === "High"
                        ? "success"
                        : result.confidence === "Medium"
                          ? "warning"
                          : result.confidence === "Low"
                            ? "danger"
                            : "warning"
                    }
                  >
                    {result.confidence ?? "Unavailable"} Confidence
                  </Badge>
                  <ScoreRing score={result.score} isGraduated={result.isGraduated} className="scale-[0.8] origin-top-right" />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Graduation Probability</span>
                  <span className="font-semibold text-foreground">
                    {result.isGraduated ? "Graduated" : result.score === null ? "Unknown" : `${result.score}%`}
                  </span>
                </div>
                <Progress value={result.isGraduated ? 100 : (result.score ?? 0)} />
              </div>

              {result.insufficientData && (
                <p className="mt-3 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
                  Provider data is currently unavailable for this token. Retry shortly or verify provider limits.
                </p>
              )}

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard title="Market Cap" value={result.marketCap === null ? "Unknown" : `$${formatNumber(result.marketCap)}`} icon={<BadgeDollarSign className="h-4 w-4" />} />
                <MetricCard title="Holder Count" value={formatNumber(result.holderCount)} icon={<Users className="h-4 w-4" />} />
                <MetricCard title="Unique Wallets" value={formatNumber(result.uniqueWalletCount)} icon={<Wallet className="h-4 w-4" />} />
                <MetricCard title="Buy/Sell Ratio" value={formatNumber(result.buySellRatio, 2)} icon={<Activity className="h-4 w-4" />} tone="bull" />
              </div>

              <div className="mt-4 grid gap-2 text-sm text-muted sm:grid-cols-2">
                <p>Volume: {result.volume === null ? "Unknown" : `$${formatNumber(result.volume)}`}</p>
                <p>Holder Growth Rate: {result.holderGrowthRate === null ? "Unknown" : `${result.holderGrowthRate}%`}</p>
                <p>Estimated Time: {result.estimatedTimeToGraduation ?? "Unknown"}</p>
                <p>Category: {result.category}</p>
                <p>Data Source: {result.dataSource}</p>
              </div>

              {result.missingMetrics.length > 0 && (
                <p className="mt-3 text-xs text-muted">Missing metrics: {result.missingMetrics.join(", " )}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="space-y-3 border border-primary/20 bg-primary/5">
                <CardTitle>Bullish Signals</CardTitle>
                {result.bullishSignals.length === 0 ? (
                  <CardDescription>No significant bullish signals detected.</CardDescription>
                ) : (
                  <ul className="space-y-2 text-sm text-primary">
                    {result.bullishSignals.map((signal) => (
                      <li key={signal}>+ {signal}</li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card className="space-y-3 border border-danger/20 bg-danger/5">
                <CardTitle>Risk Signals</CardTitle>
                {result.riskSignals.length === 0 ? (
                  <CardDescription>No immediate red flags detected.</CardDescription>
                ) : (
                  <ul className="space-y-2 text-sm text-danger">
                    {result.riskSignals.map((signal) => (
                      <li key={signal}>- {signal}</li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={addToWatchlist} disabled={watchlistBusy || isSaved}>
                <Star className="mr-2 h-4 w-4" />
                {isSaved ? "Saved to Watchlist" : "Add to Watchlist"}
              </Button>

              <Link href={`/token/${result.address}`}>
                <Button variant="secondary">
                  View Token Details
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Card>

      <Card id="watchlist" className="space-y-4 border border-border/80 bg-background-soft/70">
        <div>
          <CardTitle>Watchlist</CardTitle>
          <CardDescription>Saved tokens and latest graduation scores.</CardDescription>
        </div>

        {watchlist.length === 0 ? (
          <p className="rounded-xl border border-border/80 bg-background-panel p-4 text-sm text-muted">No tokens added yet.</p>
        ) : (
          <div className="space-y-2">
            {watchlist.map((item) => (
              <div key={item.id} className="rounded-xl border border-border/70 bg-background-panel p-3 transition hover:bg-background-soft/70">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.token.name}</p>
                    <p className="text-xs text-muted">{shortAddress(item.token.address)}</p>
                  </div>
                  <Badge
                    variant={
                      item.token.isGraduated
                        ? "success"
                        : item.token.score === null
                        ? "warning"
                        : item.token.score >= 61
                          ? "success"
                          : item.token.score >= 31
                            ? "warning"
                            : "danger"
                    }
                  >
                    {item.token.isGraduated ? "Graduated" : item.token.score === null ? "Unknown" : `${item.token.score}%`}
                  </Badge>
                </div>

                <div className="mt-2 flex gap-2">
                  <Link href={`/token/${item.token.address}`} className="text-xs text-primary hover:underline">
                    Open
                  </Link>
                  <p className="text-xs text-muted">Added {new Date(item.created_at).toLocaleDateString()}</p>
                  <button
                    type="button"
                    className="text-xs text-danger hover:underline"
                    onClick={() => removeFromWatchlist(item.token.address)}
                    disabled={watchlistBusy}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}