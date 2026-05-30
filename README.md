# Pump.fun Graduation Predictor

Modern web application to estimate the probability that a newly launched Pump.fun token graduates to a DEX such as Raydium.

## Stack

- Next.js 15 (App Router) + React + TypeScript
- Tailwind CSS + shadcn/ui-style components
- Next.js API routes + Zod validation
- Supabase (Postgres)
- Vercel deployment target

## Features

- Landing page with crypto-trader style dashboard visuals
- Authenticated analysis dashboard
- Modular token graduation scoring engine
- Confidence tiers + bullish/risk signals
- Estimated time-to-graduation
- Watchlist add/remove flow (local storage)
- Trending opportunities page with sort/filter
- Token detail page at `/token/[address]` with charts
- Feedback widget and feedback API persistence

## Environment Variables

Copy `.env.example` to `.env.local` and fill values:

```bash
cp .env.example .env.local
```

- `NEXT_PUBLIC_APP_URL` (example: `http://localhost:3000`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `BIRDEYE_API_KEY` (optional, improves market/holder coverage)
- `HELIUS_API_KEY` (optional, enables Helius metadata lookups)
- `SOLANA_TRACKER_API_KEY` (optional, enables SolanaTracker token endpoint)
- `HELIUS_RPC_URL` (optional, overrides RPC endpoint for on-chain checks)
- `SOLANA_RPC_URL` (optional fallback RPC endpoint, defaults to Solana mainnet public RPC)

## Supabase Setup

1. Create a Supabase project.
2. Run SQL from `supabase/schema.sql` in SQL Editor.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploy on Vercel

1. Push repo to GitHub.
2. Import project in Vercel.
3. Add environment variables from `.env.example`.
4. Deploy.

## Notes

- Token analysis now attempts live market ingestion from DexScreener first, then gracefully falls back to deterministic synthetic modeling when live data is unavailable.
- Watchlist is intentionally client-local while authentication is disabled.
- Replace logic in `src/lib/token-analysis.ts` with real data ingestion for production alpha.
