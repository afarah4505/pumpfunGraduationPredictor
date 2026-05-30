type DexPair = {
  chainId?: string;
  marketCap?: number;
  fdv?: number;
  liquidity?: {
    usd?: number;
  };
  volume?: {
    h24?: number;
  };
  txns?: {
    h24?: {
      buys?: number;
      sells?: number;
    };
  };
  priceChange?: {
    h24?: number;
  };
  baseToken?: {
    address?: string;
    name?: string;
    symbol?: string;
  };
  boosts?: {
    active?: number;
  };
};

type DexPairsResponse = {
  pairs?: DexPair[];
};

type DexBoostToken = {
  chainId?: string;
  tokenAddress?: string;
};

const DEX_API = "https://api.dexscreener.com";

async function fetchJson<T>(url: string) {
  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as T;
}

export async function fetchPrimarySolanaPair(address: string) {
  const data = await fetchJson<DexPairsResponse>(`${DEX_API}/latest/dex/tokens/${address}`);
  const pairs = (data?.pairs ?? []).filter((pair) => pair.chainId === "solana");

  if (pairs.length === 0) {
    return null;
  }

  return [...pairs].sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0];
}

export async function fetchTrendingAddresses(limit = 10) {
  const endpoints = [
    `${DEX_API}/token-boosts/top/v1`,
    `${DEX_API}/token-boosts/latest/v1`,
  ];

  for (const endpoint of endpoints) {
    const data = await fetchJson<DexBoostToken[] | { data?: DexBoostToken[] }>(endpoint);
    const raw = Array.isArray(data) ? data : (data?.data ?? []);
    const addresses = raw
      .filter((item) => item.chainId === "solana" && typeof item.tokenAddress === "string")
      .map((item) => item.tokenAddress as string)
      .filter(Boolean);

    if (addresses.length > 0) {
      return [...new Set(addresses)].slice(0, limit);
    }
  }

  return [];
}