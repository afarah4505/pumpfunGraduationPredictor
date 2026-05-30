import Link from "next/link";
import { ArrowRight, LineChart, ShieldAlert, Sparkles, TrendingUp, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { HomeAnalyzeForm } from "@/components/home-analyze-form";

export default function Home() {
  return (
    <div className="space-y-10 pb-6 sm:space-y-16 sm:pb-10 page-enter">
      <section className="glass relative overflow-hidden rounded-3xl border border-border/60 p-6 sm:p-10">
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/20 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-24 left-12 h-48 w-48 rounded-full bg-sky-400/20 blur-3xl" aria-hidden="true" />
        <div className="relative grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-6">
            <p className="inline-flex rounded-full border border-border/70 bg-background-soft px-3 py-1 text-xs uppercase tracking-[0.24em] text-primary">
              Real-Time Graduation Prediction
            </p>
            <h1 className="max-w-3xl text-3xl font-semibold leading-tight text-foreground sm:text-5xl">
              Predict Which Pump.fun Tokens Will Graduate
            </h1>
            <p className="max-w-2xl text-base text-muted sm:text-lg">
              Real-time on-chain data to help you decide what to buy, hold, or avoid before tokens gain momentum.
            </p>

            <HomeAnalyzeForm />

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-border/70 bg-background-soft px-3 py-1 text-muted">Real-time on-chain signals</span>
              <span className="rounded-full border border-border/70 bg-background-soft px-3 py-1 text-muted">Buy / Hold / Avoid guidance</span>
              <span className="rounded-full border border-border/70 bg-background-soft px-3 py-1 text-muted">Pump.fun to Raydium focus</span>
            </div>
          </div>

          <div className="grid gap-3">
            <Card className="space-y-2 border border-primary/25 bg-primary/8 metric-glow">
              <CardTitle className="text-2xl text-primary">82%</CardTitle>
              <CardDescription>Average confidence on tokens flagged as high-probability Raydium graduates.</CardDescription>
            </Card>
            <Card className="space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-4 w-4" />
                <p className="text-xs uppercase tracking-[0.18em]">Trader Decision Feed</p>
              </div>
              <div className="grid gap-2 text-sm text-muted">
                <p className="flex items-center justify-between"><span>Entry setup quality</span><strong className="text-foreground">Strong</strong></p>
                <p className="flex items-center justify-between"><span>Graduation momentum</span><strong className="text-foreground">+18%</strong></p>
                <p className="flex items-center justify-between"><span>Risk pressure</span><strong className="text-foreground">Moderate</strong></p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="space-y-4 stagger-fade-in">
        <h2 className="text-xl font-semibold uppercase tracking-[0.16em] text-muted">Core Intelligence</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="space-y-3">
            <LineChart className="h-5 w-5 text-primary" />
            <CardTitle>Graduation Probability Score</CardTitle>
            <CardDescription>Compute a normalized 0-100 score with confidence tiers and category labels.</CardDescription>
          </Card>
          <Card className="space-y-3">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>Holder Growth Analysis</CardTitle>
            <CardDescription>Track unique wallet expansion and holder acceleration over time.</CardDescription>
          </Card>
          <Card className="space-y-3">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>Buy/Sell Momentum</CardTitle>
            <CardDescription>Assess buy pressure and volume expansion for breakout potential.</CardDescription>
          </Card>
          <Card className="space-y-3">
            <ShieldAlert className="h-5 w-5 text-danger" />
            <CardTitle>Risk Detection</CardTitle>
            <CardDescription>Identify concentration, developer ownership, and weak participation risk.</CardDescription>
          </Card>
          <Card className="space-y-3 sm:col-span-2 lg:col-span-2">
            <CardTitle>Trending Opportunities</CardTitle>
            <CardDescription>
              Rank tokens by graduation score, holder growth, buy pressure, volume growth, and wallet activity.
            </CardDescription>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <Card className="space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <Zap className="h-4 w-4" />
            <p className="text-xs uppercase tracking-[0.18em]">Live Ticker</p>
          </div>
          <div className="grid gap-2 text-sm text-muted">
            <p className="flex items-center justify-between"><span>$FOMO</span><strong className="text-foreground">Score 74</strong></p>
            <p className="flex items-center justify-between"><span>$FISH</span><strong className="text-foreground">Score 69</strong></p>
            <p className="flex items-center justify-between"><span>$MOONIT</span><strong className="text-foreground">Score 65</strong></p>
          </div>
          <Link href="/trending" className="inline-flex text-sm font-medium text-primary hover:underline">
            Explore full leaderboard
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Card>

        <Card className="space-y-3 border border-border/80 bg-background-soft/90">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">For Serious Traders</p>
          <CardTitle className="text-2xl">Built for fast conviction</CardTitle>
          <CardDescription>
            PumpIQ highlights when multiple momentum signals align, so you can prioritize ideas in seconds.
          </CardDescription>
          <Link href="/dashboard" className="inline-flex">
            <Button variant="secondary">Launch Dashboard</Button>
          </Link>
        </Card>
      </section>
    </div>
  );
}
