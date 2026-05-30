type PumpfunCoin = {
  mint?: string;
  name?: string;
  symbol?: string;
  usd_market_cap?: number;
  market_cap?: number;
  created_timestamp?: number;
  virtual_sol_reserves?: number;
  virtual_token_reserves?: number;
  reply_count?: number;
  twitter?: string | null;
  telegram?: string | null;
  website?: string | null;
};

const PUMPFUN_API = "https://frontend-api.pump.fun";

export async function fetchPumpfunCoin(address: string) {
  const response = await fetch(`${PUMPFUN_API}/coins/${address}`, {
    method: "GET",
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as PumpfunCoin;

  if (!data?.mint) {
    return null;
  }

  return data;
}